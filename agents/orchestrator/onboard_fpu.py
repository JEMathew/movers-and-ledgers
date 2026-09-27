"""Sole owner of onboarding, governed productive use, checkpoints and success events."""

from datetime import UTC, datetime

from agents.activation import FirstProductiveUseAgent
from agents.onboarding import OnboardingAgent
from agents.orchestrator.validate_configure import ValidateConfigureOrchestrator
from domain.discovery_assessment.models import ProductEventName as Event
from domain.onboarding_fpu.models import Decision, FpuCheck, FpuTask, OnboardingState
from domain.planning_mapping.models import WorkflowStatus as State
from tools.activation.invoice import (
    calculate_fpu_status,
    create_synthetic_invoice,
    record_fpu_event,
    validate_invoice_posting,
    verify_accounting_impact,
)
from tools.migration import stable_checksum
from tools.onboarding.checks import TASKS, context_hash, record_onboarding_event

STAGES = {
    State.ONBOARDING,
    State.ONBOARDING_BLOCKED,
    State.READY_FOR_FIRST_PRODUCTIVE_USE,
    State.FIRST_PRODUCTIVE_USE_IN_PROGRESS,
    State.FIRST_PRODUCTIVE_USE_BLOCKED,
    State.VERIFIED_FIRST_PRODUCTIVE_USE,
}


class OnboardFpuOrchestrator:
    def __init__(self):
        self.prior = ValidateConfigureOrchestrator()
        self.onboarding_agent = OnboardingAgent()
        self.fpu_agent = FirstProductiveUseAgent()

    def event(self, session, event, evidence=None):
        self.prior.event(session, event, evidence)

    def transition(self, session, state, event, evidence=None):
        before = session.workflow_status
        session.workflow_status = state
        session.stage = (
            "onboard"
            if state in {State.ONBOARDING, State.ONBOARDING_BLOCKED}
            else "first_productive_use"
        )
        self.event(
            session,
            event,
            {**(evidence or {}), "from_state": before.value, "to_state": state.value},
        )

    def owner(self, session, actor):
        if actor != session.owner_subject:
            raise ValueError(
                "Only the authenticated workspace owner may decide or execute this task."
            )

    def guard(self, session, fixture):
        if not session.synthetic or not self.prior.has_configured_evidence(session, fixture):
            raise ValueError(
                "Current VERIFIED validation and fully approved configuration are required."
            )
        if session.onboarding and (
            session.onboarding.configuration_id != session.configuration.id
            or session.onboarding.context_hash != context_hash(session)
        ):
            raise ValueError("Configured evidence changed; onboarding approval is stale.")

    def start(self, session, fixture, faults=None):
        self.guard(session, fixture)
        if session.onboarding:
            return self.refresh(session, fixture)
        if session.workflow_status is not State.CONFIGURED:
            raise ValueError("Onboarding starts only from CONFIGURED.")
        session.onboarding = OnboardingState(
            configuration_id=session.configuration.id,
            context_hash=context_hash(session),
            faults=faults or [],
        )
        self.transition(
            session,
            State.ONBOARDING,
            Event.ONBOARDING_STARTED,
            {"configuration_id": str(session.configuration.id), "policy": "onboarding-v1"},
        )
        self.refresh(session, fixture)

    def refresh(self, session, fixture):
        self.guard(session, fixture)
        if not session.onboarding or session.workflow_status not in STAGES:
            raise ValueError("Start onboarding from the configured handoff.")
        state = session.onboarding
        state.tasks = self.onboarding_agent.run(session)
        for task in state.tasks:
            if task.status == "COMPLETED" and task.id not in state.completed_task_ids:
                self.event(session, Event.ONBOARDING_TASK_COMPLETED, record_onboarding_event(task))
                state.completed_task_ids.append(task.id)
        complete = all(t.status == "COMPLETED" for t in state.tasks)
        if state.fpu and state.fpu.checkpoint != "DRAFT":
            return complete
        desired = (
            State.READY_FOR_FIRST_PRODUCTIVE_USE
            if complete
            else (
                State.ONBOARDING_BLOCKED
                if any(t.status == "BLOCKED" for t in state.tasks)
                else State.ONBOARDING
            )
        )
        if session.workflow_status != desired:
            if complete:
                self.event(
                    session, Event.ONBOARDING_COMPLETED, {"context_hash": state.context_hash}
                )
            self.transition(
                session,
                desired,
                Event.FPU_READY
                if complete
                else (
                    Event.ONBOARDING_BLOCKED
                    if desired is State.ONBOARDING_BLOCKED
                    else Event.ONBOARDING_STARTED
                ),
                {"complete": complete},
            )
        return complete

    def decide_task(self, session, fixture, task_id, request, actor):
        self.owner(session, actor)
        self.guard(session, fixture)
        state = session.onboarding
        if not state or (state.fpu and (state.fpu.checkpoint != "DRAFT" or state.fpu.attempts)):
            raise ValueError("Onboarding decisions are unavailable after posting.")
        if task_id not in TASKS or not TASKS[task_id][1]:
            raise ValueError("This is a deterministic check, not a human-decision task.")
        choices = TASKS[task_id][1]
        selection = request.selection or choices[0]
        if selection not in choices or (request.action == "modify" and not request.selection):
            raise ValueError("Choose an explicitly supported onboarding option.")
        decision = Decision(
            actor=actor,
            action=request.action,
            selection=selection,
            evidence_hash=state.context_hash,
            comment=request.comment,
        )
        state.decisions.setdefault(task_id, []).append(decision)
        # Any changed setup decision revokes an unexecuted invoice approval.
        if state.fpu:
            state.fpu_history.append(state.fpu.model_copy(deep=True))
            state.fpu = None
        self.event(
            session,
            Event.ONBOARDING_DECISION,
            {
                "task_id": task_id,
                "actor": actor,
                "role": decision.role,
                "action": decision.action,
                "selection": selection,
                "evidence_hash": state.context_hash,
            },
        )
        self.prior.activity(
            session,
            "onboarding_agent",
            f"Human {request.action}: {TASKS[task_id][0]}",
            [f"context:{state.context_hash}", f"task:{task_id}"],
            human=True,
        )
        self.refresh(session, fixture)

    def prepare(self, session, fixture, inputs, actor):
        self.owner(session, actor)
        if not self.refresh(session, fixture):
            raise ValueError("Complete every onboarding prerequisite before preparing FPU.")
        state = session.onboarding
        if state.fpu and (state.fpu.checkpoint != "DRAFT" or state.fpu.attempts):
            raise ValueError("An attempted task must resume with its original contract and key.")
        contract = self.fpu_agent.propose(session, inputs)
        if state.fpu:
            state.fpu_history.append(state.fpu.model_copy(deep=True))
        state.fpu = FpuTask(
            inputs=inputs, contract=contract, contract_hash=stable_checksum(contract)
        )
        self.event(session, Event.FPU_CONTRACT_PROPOSED, record_fpu_event(state.fpu))

    def decide_fpu(self, session, fixture, request, actor):
        self.owner(session, actor)
        self.guard(session, fixture)
        task = session.onboarding.fpu if session.onboarding else None
        if not task or task.checkpoint != "DRAFT":
            raise ValueError("Only a prepared, unposted task may be approved or rejected.")
        if request.action == "modify":
            raise ValueError(
                "Modify the invoice draft; a revised contract requires fresh approval."
            )
        if self.fpu_agent.propose(session, task.inputs) != task.contract:
            raise ValueError("Invoice contract changed; do not approve stale evidence.")
        task.decisions.append(
            Decision(
                actor=actor,
                action=request.action,
                selection="POST_SYNTHETIC_INVOICE",
                evidence_hash=task.contract_hash,
                comment=request.comment,
            )
        )
        task.status = "APPROVED" if request.action == "approve" else "REJECTED"
        self.event(
            session,
            Event.FPU_DECISION,
            {
                **record_fpu_event(task),
                "actor": actor,
                "role": "DEMO_WORKSPACE_OWNER",
                "action": request.action,
            },
        )
        if request.action == "reject":
            self.block(
                session, "Human rejected the invoice; revise or explicitly approve before posting."
            )

    def block(self, session, reason):
        task = session.onboarding.fpu if session.onboarding else None
        if task:
            task.status = "BLOCKED"
            task.checks = [c for c in task.checks if c.id != "safe_stop"] + [
                FpuCheck(
                    id="safe_stop",
                    passed=False,
                    explanation=reason,
                    evidence=[f"contract:{task.contract_hash}"],
                )
            ]
        self.event(session, Event.FPU_FAILED, {"reason": reason})
        self.transition(
            session, State.FIRST_PRODUCTIVE_USE_BLOCKED, Event.FPU_BLOCKED, {"reason": reason}
        )
        self.event(
            session, Event.FPU_REMEDIATION_REQUIRED, {"reason": reason, "owner": "workspace_owner"}
        )

    def execute(self, session, fixture, key, actor):
        self.owner(session, actor)
        task = session.onboarding.fpu if session.onboarding else None
        if not task:
            raise ValueError("Prepare and approve an eligible invoice contract first.")
        if not key or len(key) > 120:
            raise ValueError("A bounded idempotency key is required.")
        if task.idempotency_key and task.idempotency_key != key:
            raise ValueError("Retries must reuse the original idempotency key.")
        task.idempotency_key = key
        try:
            self.guard(session, fixture)
            if (
                self.fpu_agent.propose(session, task.inputs) != task.contract
                or stable_checksum(task.contract) != task.contract_hash
            ):
                raise ValueError("Contract evidence changed; investigate before posting.")
            decision = task.decisions[-1] if task.decisions else None
            if (
                not decision
                or decision.actor != actor
                or decision.action != "approve"
                or decision.evidence_hash != task.contract_hash
            ):
                raise ValueError("An attributable approval for this exact invoice is required.")
            if task.checkpoint == "VERIFIED" and self.verified(session, fixture):
                return
            if task.checkpoint == "DRAFT":
                if task.attempts >= task.retry_limit:
                    raise ValueError("Retry budget exhausted; investigate without further writes.")
                task.attempts += 1
                self.transition(
                    session,
                    State.FIRST_PRODUCTIVE_USE_IN_PROGRESS,
                    Event.FPU_STARTED,
                    record_fpu_event(task),
                )
                if "posting_failure" in session.onboarding.faults:
                    raise ValueError(
                        "Synthetic target refused posting before any write. "
                        "Approve remediation, then retry."
                    )
                invoice, journal = create_synthetic_invoice(task)
                if "totals_mismatch" in session.onboarding.faults:
                    invoice["total"] = "0.01"
                if (
                    not validate_invoice_posting(task, invoice, journal)
                    or not verify_accounting_impact(session, task, journal)[0]
                ):
                    raise ValueError(
                        "Invoice totals or accounting impact failed; no posting committed."
                    )
                if session.onboarding.invoices or session.onboarding.journals:
                    raise ValueError(
                        "Unexpected existing operating records; reconcile before posting."
                    )
                # Both records and the receipt are committed together by the repository CAS.
                session.onboarding.invoices[str(task.id)] = invoice
                session.onboarding.journals[str(task.id)] = journal
                task.invoice, task.journal = invoice, journal
                task.posted_by, task.posted_at = actor, datetime.now(UTC)
                task.checkpoint, task.status = "POSTED", "POSTED_AWAITING_VERIFICATION"
                self.event(
                    session,
                    Event.FPU_POSTED,
                    {**record_fpu_event(task), "invoice_id": str(task.id), "actor": actor},
                )
                if "verification_interrupted" in session.onboarding.faults:
                    return  # Resume verifies the existing receipt; it cannot post again.
            self.finish_verification(session, fixture)
        except (ValueError, KeyError, TypeError, ArithmeticError) as error:
            self.block(session, str(error))

    def finish_verification(self, session, fixture):
        self.guard(session, fixture)
        if self.verified(session, fixture):
            return
        task = session.onboarding.fpu if session.onboarding else None
        if not task or task.checkpoint == "DRAFT":
            raise ValueError("A posted receipt is required before verification.")
        task.checks = self.fpu_agent.verify(session)
        if calculate_fpu_status(task.checks) != "VERIFIED":
            self.block(
                session,
                "Deterministic FPU verification failed. Retain posted evidence and investigate.",
            )
            return
        task.checkpoint, task.status = "VERIFIED", "VERIFIED"
        task.verified_at = datetime.now(UTC)
        task.evidence_hash = stable_checksum([c.model_dump() for c in task.checks])
        self.event(
            session,
            Event.FPU_VERIFIED,
            {**record_fpu_event(task), "evidence_hash": task.evidence_hash},
        )
        self.transition(
            session,
            State.VERIFIED_FIRST_PRODUCTIVE_USE,
            Event.FIRST_PRODUCTIVE_USE_COMPLETED,
            {**record_fpu_event(task), "actor": task.posted_by, "synthetic": True},
        )
        self.prior.activity(
            session,
            self.fpu_agent.name,
            "Verified first productive synthetic invoice",
            [
                f"invoice:{task.id}",
                f"contract:{task.contract_hash}",
                f"verification:{task.evidence_hash}",
            ],
        )

    def verified(self, session, fixture):
        try:
            self.guard(session, fixture)
            task = session.onboarding.fpu
            checks = self.fpu_agent.verify(session)
            return bool(
                task
                and task.checkpoint == "VERIFIED"
                and task.status == "VERIFIED"
                and task.verified_at
                and task.evidence_hash == stable_checksum([c.model_dump() for c in checks])
                and any(
                    e.name == Event.FPU_VERIFIED
                    and e.attributes.get("task_id") == str(task.id)
                    and e.attributes.get("evidence_hash") == task.evidence_hash
                    for e in session.events
                )
                and any(
                    e.name == Event.FIRST_PRODUCTIVE_USE_COMPLETED
                    and e.attributes.get("task_id") == str(task.id)
                    for e in session.events
                )
                and session.workflow_status is State.VERIFIED_FIRST_PRODUCTIVE_USE
                and calculate_fpu_status(checks) == "VERIFIED"
            )
        except (ValueError, KeyError, AttributeError, TypeError):
            return False

    def remediate(self, session, fixture, request, actor):
        self.owner(session, actor)
        self.guard(session, fixture)
        state = session.onboarding
        if not state or not state.faults or request.action != "approve":
            raise ValueError("Explicit approval of a declared synthetic fault repair is required.")
        before = list(state.faults)
        state.faults = []
        state.fault_history.append(
            {
                "faults": before,
                "actor": actor,
                "role": "DEMO_WORKSPACE_OWNER",
                "at": datetime.now(UTC).isoformat(),
                "decision": "approve",
                "context_hash": state.context_hash,
                "comment": request.comment,
            }
        )
        self.event(
            session,
            Event.FPU_REMEDIATED,
            {"faults": ",".join(before), "actor": actor, "context_hash": state.context_hash},
        )
        self.refresh(session, fixture)
