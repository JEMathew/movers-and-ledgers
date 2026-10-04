"""State owner for verified reconciliation and governed synthetic configuration."""

from uuid import UUID

from agents.configuration import ConfigurationAgent
from agents.resolution import ResolutionAgent
from agents.validation import ValidationAgent
from domain.discovery_assessment.models import (
    ActivityStatus,
    AgentActivity,
    ProductEvent,
    Provenance,
    RiskLevel,
)
from domain.discovery_assessment.models import (
    ProductEventName as Event,
)
from domain.migration_resolution.models import (
    BatchStatus,
    ExceptionKind,
    ExecutionStatus,
    MigrationFailure,
    ResolutionDecision,
    ResolutionState,
)
from domain.planning_mapping.models import WorkflowStatus as State
from domain.validation_configuration.models import (
    ConfigurationState,
    ValidationRepair,
    ValidationStatus,
)
from tools.configuration.controls import (
    apply_safe_configuration,
    decide_configuration,
    record_configuration_event,
    replays_decision,
    validate_value,
)
from tools.migration import stable_checksum
from tools.validation.checks import record_validation_event
from tools.validation.repair import restore_approved_source_payload

from .plan_map_approve import WorkflowTransitionError


class ValidateConfigureOrchestrator:
    def __init__(self) -> None:
        self.validation_agent = ValidationAgent()
        self.configuration_agent = ConfigurationAgent()
        self.resolution_agent = ResolutionAgent()

    @staticmethod
    def event(session, name: Event, attributes: dict | None = None) -> None:
        session.events.append(
            ProductEvent(migration_session_id=session.id, name=name, attributes=attributes or {})
        )

    def transition(self, session, state: State, event: Event, evidence: dict) -> None:
        previous = session.workflow_status
        session.workflow_status = state
        session.stage = (
            "configure"
            if state in {State.CONFIGURING, State.CONFIGURATION_REVIEW_REQUIRED, State.CONFIGURED}
            else "validate"
        )
        self.event(
            session, event, {**evidence, "from_state": previous.value, "to_state": state.value}
        )

    @staticmethod
    def activity(session, agent: str, action: str, evidence: list[str], human=False) -> None:
        session.activity.append(
            AgentActivity(
                migration_session_id=session.id,
                agent=agent,
                action=action,
                tool="deterministic_validation"
                if agent == "validation_agent"
                else "governed_configuration_or_resolution",
                status=ActivityStatus.COMPLETED,
                evidence_references=evidence,
                risk=RiskLevel.HIGH,
                provenance=Provenance.HUMAN if human else Provenance.DETERMINISTIC,
                customer_action_required=False,
                human_approval_required=human,
            )
        )

    def validate(self, session, fixture: dict):
        execution = session.execution
        if (
            execution is None
            or execution.status is not ExecutionStatus.COMPLETE
            or (
                not execution.batches
                or any(b.status is not BatchStatus.COMPLETED for b in execution.batches)
                or execution.unresolved_blocking_failures
            )
        ):
            raise WorkflowTransitionError(
                "Complete migration and resolve blocking exceptions first."
            )
        if session.workflow_status not in {
            State.MIGRATION_COMPLETE,
            State.VALIDATION_BLOCKED,
            State.VALIDATED,
            State.CONFIGURATION_REVIEW_REQUIRED,
            State.CONFIGURED,
        }:
            raise WorkflowTransitionError("Validation is unavailable at this journey stage.")
        if session.configuration:
            session.configuration.ready_for_onboarding = False
            session.configuration_history.append(session.configuration.model_copy(deep=True))
            session.configuration = None
        self.transition(
            session, State.VALIDATING, Event.VALIDATION_STARTED, {"execution_id": str(execution.id)}
        )
        report = self.validation_agent.run(session, fixture)
        session.validation_reports.append(report)
        for check in report.checks:
            self.event(
                session,
                Event.VALIDATION_CHECK_COMPLETED,
                {"report_id": str(report.id), "check_id": check.id, "status": check.status.value},
            )
        verified = report.status is ValidationStatus.VERIFIED
        if not verified:
            self.event(session, Event.VALIDATION_FAILED, record_validation_event(report))
        self.transition(
            session,
            State.VALIDATED if verified else State.VALIDATION_BLOCKED,
            Event.VALIDATION_VERIFIED if verified else Event.VALIDATION_BLOCKED,
            record_validation_event(report),
        )
        self.activity(
            session,
            "validation_agent",
            f"Validation {report.status.value.lower()}",
            [f"validation:{report.id}", f"target:{report.target_checksum}"],
        )
        return report

    def require_verified(self, session, fixture: dict):
        if not session.validation_reports or not session.execution:
            raise WorkflowTransitionError("A current verified validation report is required.")
        report = session.validation_reports[-1]
        if report.status is not ValidationStatus.VERIFIED or report.blocking_discrepancies:
            raise WorkflowTransitionError(
                "Blocking discrepancies must be resolved and revalidated."
            )
        if (
            report.target_checksum != stable_checksum(session.execution.target_state)
            or report.source_checksum != stable_checksum(fixture)
            or report.manifest_checksum != session.execution.manifest_checksum
            or session.execution.status is not ExecutionStatus.COMPLETE
            or session.execution.unresolved_blocking_failures
        ):
            raise WorkflowTransitionError("Evidence changed; revalidation is required.")
        # Also verify that approval records have not changed since execution.
        from tools.validation.checks import validate_mapping_completeness

        if validate_mapping_completeness(session, fixture["datasets"]).status is not (
            ValidationStatus.VERIFIED
        ):
            raise WorkflowTransitionError(
                "Approved mapping evidence changed; revalidation required."
            )
        return report

    def configure(self, session, fixture: dict):
        report = self.require_verified(session, fixture)
        if session.configuration:
            return session.configuration
        if session.workflow_status is not State.VALIDATED:
            raise WorkflowTransitionError("Configuration requires the VALIDATED workflow state.")
        self.transition(
            session,
            State.CONFIGURING,
            Event.CONFIGURATION_STARTED,
            {"validation_id": str(report.id)},
        )
        plan = self.configuration_agent.propose(report, fixture)
        session.configuration = plan
        for proposal in plan.proposals:
            self.event(session, Event.CONFIGURATION_PROPOSED, record_configuration_event(proposal))
            if proposal.state is ConfigurationState.AUTO_APPLICABLE:
                if not proposal.evidence or not validate_value(
                    proposal.area, proposal.selected_value, proposal.source_value
                ):
                    raise WorkflowTransitionError("Safe configuration evidence is incomplete.")
                plan.target_settings[proposal.area] = proposal.selected_value
                proposal.state = ConfigurationState.APPLIED
                self.event(
                    session,
                    Event.CONFIGURATION_APPLIED,
                    {**record_configuration_event(proposal), "automatic": True},
                )
        self.transition(
            session,
            State.CONFIGURATION_REVIEW_REQUIRED,
            Event.CONFIGURATION_REVIEW_REQUIRED,
            {"configuration_id": str(plan.id)},
        )
        self.activity(
            session,
            "configuration_agent",
            "Prepared configuration for human review",
            [f"validation:{report.id}", f"configuration:{plan.id}"],
        )
        return plan

    def decide(self, session, fixture: dict, proposal_id: UUID, decision, actor: str):
        self.require_verified(session, fixture)
        plan = session.configuration
        if plan is None or session.workflow_status is not State.CONFIGURATION_REVIEW_REQUIRED:
            raise WorkflowTransitionError("Configuration is not awaiting decisions.")
        proposal = next((p for p in plan.proposals if p.id == proposal_id), None)
        if proposal is None:
            raise LookupError("Configuration proposal not found.")
        if actor == session.owner_subject and replays_decision(proposal, decision, actor):
            # The same decision is already recorded: succeed without a second decision, event
            # or activity, and without rewriting who decided or when.
            return plan
        decide_configuration(proposal, decision, actor)
        from .audit import record_decision

        record_decision(
            session,
            actor,
            decision.action,
            "configure",
            proposal.id,
            proposal.evidence,
            proposal.selected_value,
        )
        event = {
            "approve": Event.CONFIGURATION_APPROVED,
            "modify": Event.CONFIGURATION_MODIFIED,
            "reject": Event.CONFIGURATION_REJECTED,
        }[decision.action]
        self.event(
            session,
            event,
            {
                **record_configuration_event(proposal),
                "actor": actor,
                "selected_value": proposal.selected_value,
            },
        )
        self.activity(
            session,
            "configuration_agent",
            f"Human {decision.action}: {proposal.label}",
            proposal.evidence,
            human=True,
        )
        return plan

    def apply(self, session, fixture: dict):
        report = self.require_verified(session, fixture)
        plan = session.configuration
        if plan is None or plan.validation_id != report.id:
            raise WorkflowTransitionError(
                "A configuration plan bound to current validation is required."
            )
        if plan.ready_for_onboarding and self.can_handoff(session, fixture):
            return plan
        if session.workflow_status is not State.CONFIGURATION_REVIEW_REQUIRED:
            raise WorkflowTransitionError("Configuration is not ready for application.")
        apply_safe_configuration(plan)
        for proposal in plan.proposals:
            self.event(session, Event.CONFIGURATION_APPLIED, record_configuration_event(proposal))
        self.transition(
            session,
            State.CONFIGURED,
            Event.CONFIGURATION_COMPLETED,
            {
                "configuration_id": str(plan.id),
                "settings_checksum": stable_checksum(plan.target_settings),
            },
        )
        plan.ready_for_onboarding = self.can_handoff(session, fixture)
        if plan.ready_for_onboarding:
            self.event(
                session,
                Event.READY_FOR_ONBOARDING,
                {
                    "configuration_id": str(plan.id),
                    "validation_id": str(report.id),
                    "onboarding_implemented": True,
                },
            )
        self.activity(
            session,
            "configuration_agent",
            "Applied approved synthetic configuration",
            [f"configuration:{plan.id}", f"validation:{report.id}"],
        )
        return plan

    def can_handoff(self, session, fixture: dict) -> bool:
        return session.workflow_status is State.CONFIGURED and self.has_configured_evidence(
            session, fixture
        )

    def has_configured_evidence(self, session, fixture: dict) -> bool:
        """Reusable evidence gate for later lifecycle stages; does not change workflow state."""
        try:
            report = self.require_verified(session, fixture)
            plan = session.configuration
            if plan is None or plan.validation_id != report.id:
                return False
            if any(p.state is not ConfigurationState.APPLIED for p in plan.proposals):
                return False
            checked = plan.model_copy(deep=True)
            apply_safe_configuration(checked)
            return checked.target_settings == plan.target_settings
        except (ValueError, KeyError, TypeError):
            return False

    def propose_repair(self, session, fixture: dict, entity: str, record_id: str):
        if (
            session.workflow_status is not State.VALIDATION_BLOCKED
            or not session.validation_reports
        ):
            raise WorkflowTransitionError("A blocked validation report is required for Resolution.")
        report = session.validation_reports[-1]
        execution = session.execution
        if report.target_checksum != stable_checksum(execution.target_state):
            raise WorkflowTransitionError(
                "Target changed; rerun validation before proposing repair."
            )
        if report.source_checksum != stable_checksum(fixture):
            raise WorkflowTransitionError("Source evidence changed; remediation is blocked.")
        batch = next((b for b in execution.batches if b.entity == entity), None)
        if batch is None or batch.source_checksum != stable_checksum(
            fixture["datasets"].get(entity)
        ):
            raise WorkflowTransitionError("Repair cannot alter the approved source snapshot.")
        source = next((r for r in fixture["datasets"][entity] if r["id"] == record_id), None)
        rows = [r for r in execution.target_state[entity] if r.get("source_id") == record_id]
        if source is None or len(rows) != 1 or rows[0].get("payload") == source:
            raise WorkflowTransitionError(
                "Only an identified altered target record can be restored."
            )
        existing = next(
            (
                r
                for r in session.validation_repairs
                if r.validation_id == report.id and r.entity == entity and r.record_id == record_id
            ),
            None,
        )
        if existing:
            return next(p for p in execution.resolutions if p.id == existing.resolution_id)
        if any(not r.applied for r in session.validation_repairs):
            raise WorkflowTransitionError("Complete the pending repair and revalidate first.")
        failure = MigrationFailure(
            batch_id=batch.id,
            kind=ExceptionKind.VALIDATION_DISCREPANCY,
            code="MB-VALIDATION-PAYLOAD",
            summary=f"Restore {entity}:{record_id} to the approved source payload",
            root_cause="Deterministic payload comparison found a post-load discrepancy.",
            retryable=True,
            risk="HIGH",
            evidence=[
                f"validation:{report.id}",
                f"source:{stable_checksum(source)}",
                f"target:{stable_checksum(rows[0])}",
            ],
            affected_record_ids=[record_id],
        )
        proposal = self.resolution_agent.propose(failure)
        execution.failures.append(failure)
        execution.resolutions.append(proposal)
        session.validation_repairs.append(
            ValidationRepair(
                resolution_id=proposal.id,
                validation_id=report.id,
                entity=entity,
                record_id=record_id,
                before_checksum=stable_checksum(rows[0]),
                source_checksum=stable_checksum(source),
            )
        )
        self.event(session, Event.RESOLUTION_STARTED, {"report_id": str(report.id)})
        self.event(
            session,
            Event.RESOLUTION_PROPOSED,
            {"resolution_id": str(proposal.id), "record_id": record_id, "entity": entity},
        )
        return proposal

    def repair(self, session, fixture: dict, resolution_id: UUID, actor: str):
        binding = next(
            (r for r in session.validation_repairs if r.resolution_id == resolution_id), None
        )
        if binding is None:
            raise LookupError("Validation resolution not found.")
        if binding.applied:
            return
        execution = session.execution
        proposal = next(p for p in execution.resolutions if p.id == resolution_id)
        report = session.validation_reports[-1]
        if (
            binding.validation_id != report.id
            or session.workflow_status is not State.VALIDATION_BLOCKED
            or stable_checksum(fixture) != report.source_checksum
            or stable_checksum(execution.target_state) != report.target_checksum
        ):
            raise WorkflowTransitionError("Resolution evidence is stale; revalidation is required.")
        row = next(
            r
            for r in execution.target_state[binding.entity]
            if r.get("source_id") == binding.record_id
        )
        source = next(
            r for r in fixture["datasets"][binding.entity] if r["id"] == binding.record_id
        )
        if stable_checksum(row) != binding.before_checksum or stable_checksum(source) != (
            binding.source_checksum
        ):
            raise WorkflowTransitionError("Record evidence changed; repair is blocked.")
        self.resolution_agent.decide(
            proposal,
            ResolutionDecision(
                approve=True,
                comment="Approved restoration of the displayed synthetic source record",
            ),
            actor,
        )
        # This bounded deterministic copy is the only repair supported by this Beta contract.
        from .audit import record_decision

        record_decision(
            session,
            actor,
            "approve",
            "validate",
            proposal.id,
            proposal.evidence,
            f"restore:{binding.entity}:{binding.record_id}",
        )
        restore_approved_source_payload(row, source, binding, proposal)
        proposal.state = ResolutionState.APPLIED
        next(f for f in execution.failures if f.id == proposal.failure_id).resolved = True
        binding.applied = True
        self.event(
            session, Event.RESOLUTION_APPROVED, {"resolution_id": str(proposal.id), "actor": actor}
        )
        self.event(
            session,
            Event.RESOLUTION_APPLIED,
            {
                "resolution_id": str(proposal.id),
                "before_checksum": stable_checksum(binding.before_payload),
                "after_checksum": binding.source_checksum,
                "revalidation_required": True,
            },
        )
        self.activity(
            session,
            "resolution_agent",
            "Restored approved synthetic source payload",
            proposal.evidence,
            human=True,
        )
