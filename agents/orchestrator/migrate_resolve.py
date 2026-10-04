"""Governed Migrate → Resolve orchestration for the synthetic Beta slice."""

from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid5

from agents.contracts import AgentRole
from agents.mapping.specialists import records_for_area
from agents.migration import MigrationAgent
from agents.resolution import ResolutionAgent
from domain.discovery_assessment.models import (
    ActivityStatus,
    AgentActivity,
    MigrationSession,
    ProductEvent,
    ProductEventName,
    Provenance,
    RiskLevel,
)
from domain.migration_resolution.models import (
    BatchStatus,
    ExecutionStatus,
    ResolutionDecision,
    ResolutionProposal,
    ResolutionState,
)
from domain.planning_mapping.models import MappingState, WorkflowStatus
from tools.mapping.controls import lookup_mapping_rule, validate_mapping_compatibility
from tools.migration import stable_checksum
from tools.validation.checks import validate_mapping_completeness

from .audit import record_decision
from .plan_map_approve import WorkflowTransitionError


class MigrateResolveOrchestrator:
    """Owns transitions; agents cannot directly authorize workflow progression."""

    role = AgentRole.ORCHESTRATOR

    def __init__(self) -> None:
        self.migration_agent = MigrationAgent()
        self.resolution_agent = ResolutionAgent()

    @staticmethod
    def require_manifest(session, fixture):
        """Recheck the actual approved evidence before every load/resume, not only validation."""
        if session.source_checksum and session.source_checksum != stable_checksum(
            fixture["datasets"]
        ):
            raise WorkflowTransitionError("Source evidence changed since session creation.")
        if not session.plan or session.plan.blockers or not session.assessment:
            raise WorkflowTransitionError("A clear assessed plan is required.")
        if session.assessment.blocker_count:
            raise WorkflowTransitionError("Readiness blockers prevent migration.")
        # Legacy approved sessions retain their existing contract. New explicit approvals
        # bind the scope and mapping evidence to the immutable server consent snapshot.
        if session.plan.approval:
            checksum = stable_checksum({
                "plan": session.plan.model_dump(mode="json", exclude={"approval"}),
                "source_checksum": session.source_checksum,
                "mappings": [m.model_dump(mode="json") for m in session.mappings],
            })
            if checksum != session.plan.approval.manifest_checksum:
                raise WorkflowTransitionError("Plan or mappings changed after explicit approval.")
        if validate_mapping_completeness(session, fixture["datasets"]).status != "VERIFIED":
            raise WorkflowTransitionError("The approved manifest is incomplete or changed.")
        if session.execution.plan_id != session.plan.id:
            raise WorkflowTransitionError("The approved plan identity changed.")
        for mapping in session.mappings:
            records = records_for_area(fixture, mapping.area)
            source = next((r for r in records if r.get("id") == mapping.source_id), None)
            if (
                source is None
                or mapping.decided_by != session.owner_subject
                or not mapping.decided_at
                or validate_mapping_compatibility(mapping, source)
            ):
                raise WorkflowTransitionError(
                    "Mapping approval or deterministic evidence is invalid."
                )
            if mapping.area.value in {"general_configuration", "products_services"} and (
                mapping.selected_target != lookup_mapping_rule(mapping.area, source)["target"]
            ):
                raise WorkflowTransitionError(
                    "This synthetic identity adapter cannot apply a changed product or "
                    "configuration treatment. A separately reviewed transformation is required."
                )
        for batch in session.execution.batches:
            if stable_checksum(fixture["datasets"][batch.entity]) != batch.source_checksum:
                raise WorkflowTransitionError(
                    "Approved source evidence changed; resume is blocked."
                )

    @staticmethod
    def _event(
        session: MigrationSession,
        name: ProductEventName,
        attributes: dict[str, str | int | bool] | None = None,
    ) -> None:
        session.events.append(
            ProductEvent(
                migration_session_id=session.id,
                name=name,
                attributes=attributes or {},
            )
        )

    @staticmethod
    def _activity(
        session: MigrationSession,
        agent: str,
        action: str,
        tool: str,
        status: ActivityStatus,
        evidence: list[str],
        risk: RiskLevel,
        customer_action_required: bool = False,
        human_approval_required: bool = False,
        provenance: Provenance = Provenance.DETERMINISTIC,
    ) -> None:
        session.activity.append(
            AgentActivity(
                id=uuid5(
                    NAMESPACE_URL,
                    f"{session.id}:{agent}:{action}:{len(session.activity)}",
                ),
                migration_session_id=session.id,
                agent=agent,
                action=action,
                tool=tool,
                status=status,
                evidence_references=evidence,
                risk=risk,
                provenance=provenance,
                customer_action_required=customer_action_required,
                human_approval_required=human_approval_required,
            )
        )

    def start(
        self,
        session: MigrationSession,
        fixture: dict[str, Any],
        idempotency_key: str,
    ) -> MigrationSession:
        if session.execution is not None:
            if session.execution.idempotency_key == idempotency_key:
                return session
            raise WorkflowTransitionError("This approved manifest already has an execution.")
        if session.workflow_status is not WorkflowStatus.APPROVED:
            raise WorkflowTransitionError("Migration requires an approved mapping manifest.")
        if session.plan is None or session.plan.blockers:
            raise WorkflowTransitionError("Migration cannot start while plan blockers remain.")
        if not session.mappings or any(
            item.state not in {MappingState.APPROVED, MappingState.MODIFIED}
            for item in session.mappings
        ):
            raise WorkflowTransitionError("Every mapping requires a recorded human decision.")
        session.execution = self.migration_agent.create_execution(
            fixture, session.plan.version, idempotency_key, session.mappings
        )
        session.execution.plan_id = session.plan.id
        self.require_manifest(session, fixture)
        session.workflow_status = WorkflowStatus.MIGRATION_READY
        session.stage = "migrate"
        self._event(
            session,
            ProductEventName.MIGRATION_STARTED,
            {
                "execution_id": str(session.execution.id),
                "plan_id": str(session.plan.id),
                "manifest_version": session.plan.version,
                "manifest_checksum": session.execution.manifest_checksum,
                "synthetic_target": True,
            },
        )
        return self.run(session, fixture)

    def run(self, session: MigrationSession, fixture: dict[str, Any]) -> MigrationSession:
        execution = session.execution
        if execution is None:
            raise WorkflowTransitionError("Migration execution has not been created.")
        if execution.status not in {
            ExecutionStatus.READY,
            ExecutionStatus.RUNNING,
            ExecutionStatus.RETRY_PENDING,
        }:
            raise WorkflowTransitionError("Execution is not ready to run.")
        previous_completed = {
            batch.id for batch in execution.batches if batch.status is BatchStatus.COMPLETED
        }
        previous_failures = {failure.id for failure in execution.failures}
        session.workflow_status = WorkflowStatus.MIGRATING
        execution = self.migration_agent.run_until_stop(execution, fixture)
        session.execution = execution
        for batch in execution.batches:
            if batch.id not in previous_completed and batch.status is BatchStatus.COMPLETED:
                self._event(session, ProductEventName.BATCH_STARTED, {"batch_id": batch.id})
                self._event(
                    session,
                    ProductEventName.BATCH_COMPLETED,
                    {"batch_id": batch.id, "record_count": batch.record_count},
                )
        new_failure = next(
            (failure for failure in execution.failures if failure.id not in previous_failures), None
        )
        if new_failure is not None:
            batch = next(item for item in execution.batches if item.id == new_failure.batch_id)
            self._event(session, ProductEventName.BATCH_STARTED, {"batch_id": batch.id})
            self._event(
                session,
                ProductEventName.BATCH_FAILED,
                {
                    "batch_id": batch.id,
                    "failure_id": str(new_failure.id),
                    "retryable": new_failure.retryable,
                },
            )
        if execution.status is ExecutionStatus.COMPLETE:
            session.workflow_status = WorkflowStatus.MIGRATION_COMPLETE
            session.stage = "migrate"
            self._event(
                session,
                ProductEventName.MIGRATION_COMPLETED,
                {"progress_percent": 100, "safe_to_validate": execution.safe_to_validate},
            )
            self._activity(
                session,
                AgentRole.MIGRATION.value,
                "Completed all approved synthetic migration batches",
                ",".join(self.migration_agent.allowed_tools),
                ActivityStatus.COMPLETED,
                [f"checkpoint:{item.revision}" for item in execution.checkpoints],
                RiskLevel.MEDIUM,
            )
        elif execution.status is ExecutionStatus.PAUSED and new_failure is not None:
            session.workflow_status = WorkflowStatus.MIGRATION_PAUSED
            session.stage = "resolve"
            self._event(
                session,
                ProductEventName.MIGRATION_PAUSED,
                {"failure_id": str(new_failure.id), "retryable": new_failure.retryable},
            )
            self._activity(
                session,
                AgentRole.MIGRATION.value,
                "Paused at a safe batch boundary after a controlled failure",
                "checkpoint_recording,exception_capture",
                ActivityStatus.PAUSED,
                new_failure.evidence,
                RiskLevel(new_failure.risk),
                customer_action_required=True,
                human_approval_required=bool(new_failure.risk in {"MEDIUM", "HIGH"}),
            )
            self.propose_resolution(session, new_failure.id)
        elif execution.status is ExecutionStatus.BLOCKED:
            session.stage = "resolve"
            session.workflow_status = WorkflowStatus.MIGRATION_BLOCKED
            self._event(session, ProductEventName.MIGRATION_BLOCKED)
            if new_failure is not None:
                self.propose_resolution(session, new_failure.id)
        return session

    def propose_resolution(self, session: MigrationSession, failure_id: UUID) -> ResolutionProposal:
        execution = session.execution
        if execution is None:
            raise WorkflowTransitionError("Migration execution has not been created.")
        failure = next((item for item in execution.failures if item.id == failure_id), None)
        if failure is None:
            raise LookupError(str(failure_id))
        existing = next(
            (item for item in execution.resolutions if item.failure_id == failure.id), None
        )
        if existing is not None:
            return existing
        session.workflow_status = WorkflowStatus.RESOLVING
        execution.status = ExecutionStatus.RESOLVING
        execution.current_agent = AgentRole.RESOLUTION.value
        self._event(session, ProductEventName.RESOLUTION_STARTED, {"failure_id": str(failure.id)})
        proposal = self.resolution_agent.propose(failure)
        execution.resolutions.append(proposal)
        if not failure.retryable:
            proposal.state = ResolutionState.ESCALATED
            execution.status = ExecutionStatus.BLOCKED
            session.workflow_status = WorkflowStatus.MIGRATION_BLOCKED
        self._event(
            session,
            ProductEventName.RESOLUTION_PROPOSED,
            {
                "resolution_id": str(proposal.id),
                "specialist": proposal.specialist,
                "human_approval_required": proposal.human_approval_required,
            },
        )
        self._activity(
            session,
            proposal.specialist,
            f"Proposed governed remediation: {proposal.action}",
            ",".join(proposal.allowed_tools),
            ActivityStatus.COMPLETED,
            proposal.evidence,
            RiskLevel.HIGH if proposal.risk == "HIGH" else RiskLevel.MEDIUM,
            customer_action_required=proposal.human_approval_required,
            human_approval_required=proposal.human_approval_required,
        )
        if not proposal.human_approval_required:
            proposal.state = ResolutionState.APPROVED
            self.resolution_agent.apply(execution, proposal)
            session.workflow_status = WorkflowStatus.RETRY_PENDING
            self._event(
                session,
                ProductEventName.RESOLUTION_APPLIED,
                {"resolution_id": str(proposal.id), "automatic": True},
            )
        elif not failure.retryable:
            self._event(
                session,
                ProductEventName.MIGRATION_BLOCKED,
                {"resolution_id": str(proposal.id), "reason": "non_retryable"},
            )
        return proposal

    def decide_resolution(
        self,
        session: MigrationSession,
        resolution_id: UUID,
        decision: ResolutionDecision,
        actor: str,
    ) -> MigrationSession:
        if any(r.resolution_id == resolution_id for r in session.validation_repairs):
            raise WorkflowTransitionError("Validation repairs require the revalidation-bound path.")
        execution = session.execution
        if execution is None:
            raise WorkflowTransitionError("Migration execution has not been created.")
        proposal = next((item for item in execution.resolutions if item.id == resolution_id), None)
        if proposal is None:
            raise LookupError(str(resolution_id))
        if proposal.state is not ResolutionState.AWAITING_APPROVAL:
            raise WorkflowTransitionError("This resolution is not awaiting a decision.")
        self.resolution_agent.decide(proposal, decision, actor)
        record_decision(
            session,
            actor,
            "approve" if decision.approve else "reject",
            "resolve",
            proposal.id,
            proposal.evidence,
            proposal.action,
        )
        self._activity(
            session,
            self.role.value,
            f"Recorded human resolution decision: {'approved' if decision.approve else 'rejected'}",
            "approval_policy_enforcement,audit_event_recording",
            ActivityStatus.COMPLETED,
            proposal.evidence,
            RiskLevel.HIGH if proposal.risk == "HIGH" else RiskLevel.MEDIUM,
            customer_action_required=not decision.approve,
            human_approval_required=True,
            provenance=Provenance.HUMAN,
        )
        if not decision.approve:
            execution.status = ExecutionStatus.BLOCKED
            session.workflow_status = WorkflowStatus.MIGRATION_BLOCKED
            session.stage = "resolve"
            self._event(
                session,
                ProductEventName.MIGRATION_BLOCKED,
                {"resolution_id": str(proposal.id), "reason": "resolution_rejected"},
            )
            return session
        self._event(
            session,
            ProductEventName.RESOLUTION_APPROVED,
            {"resolution_id": str(proposal.id), "actor": actor},
        )
        self.resolution_agent.apply(execution, proposal)
        session.workflow_status = WorkflowStatus.RETRY_PENDING
        self._event(
            session,
            ProductEventName.RESOLUTION_APPLIED,
            {"resolution_id": str(proposal.id), "automatic": False},
        )
        return session

    def retry(self, session: MigrationSession, fixture: dict[str, Any]) -> MigrationSession:
        execution = session.execution
        if execution is None or execution.status is not ExecutionStatus.RETRY_PENDING:
            raise WorkflowTransitionError("An applied resolution is required before retry.")
        self.require_manifest(session, fixture)
        self._event(session, ProductEventName.RETRY_STARTED)
        self._event(session, ProductEventName.MIGRATION_RESUMED)
        session.stage = "migrate"
        session = self.run(session, fixture)
        if session.execution and session.execution.status is ExecutionStatus.COMPLETE:
            self._event(session, ProductEventName.RETRY_SUCCEEDED)
        elif session.execution and session.execution.status in {
            ExecutionStatus.PAUSED,
            ExecutionStatus.BLOCKED,
        }:
            self._event(session, ProductEventName.RETRY_FAILED)
            if session.execution.status is ExecutionStatus.BLOCKED:
                session.workflow_status = WorkflowStatus.MIGRATION_BLOCKED
        return session

    @staticmethod
    def can_handoff_to_validation(session: MigrationSession) -> bool:
        execution = session.execution
        return bool(
            execution
            and execution.status is ExecutionStatus.COMPLETE
            and execution.safe_to_validate
            and execution.unresolved_blocking_failures == 0
        )
