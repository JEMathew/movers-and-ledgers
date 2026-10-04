"""Deterministic orchestration for Plan → Map & Approve."""

from typing import Any
from uuid import UUID, uuid5

from agents.contracts import AgentRole
from agents.mapping import MappingAgent
from agents.planning import PlanningAgent
from domain.discovery_assessment.models import (
    ActivityStatus,
    AgentActivity,
    MigrationSession,
    ProductEvent,
    ProductEventName,
    Provenance,
    RiskLevel,
)
from domain.planning_mapping.models import MappingDecision, MappingState, WorkflowStatus
from tools.mapping import (
    MappingPolicyError,
    apply_mapping_decision,
    mapping_ready_for_handoff,
    record_audit_event,
)

_ACTIVITY_NAMESPACE = UUID("e4ec4d76-a0c0-5af0-8780-5d1f32548b3f")


class WorkflowTransitionError(ValueError):
    pass


class PlanMapApproveOrchestrator:
    """Owns stage transitions; delegated agents cannot mutate workflow state directly."""

    role = AgentRole.ORCHESTRATOR

    def __init__(self) -> None:
        self.planning_agent = PlanningAgent()
        self.mapping_agent = MappingAgent()

    def create_plan(
        self, session: MigrationSession, source: dict | None = None
    ) -> MigrationSession:
        if session.discovery is None or session.assessment is None:
            raise WorkflowTransitionError("Discovery and assessment are required before planning.")
        if session.workflow_status is not WorkflowStatus.ASSESSED:
            raise WorkflowTransitionError("Planning requires the ASSESSED workflow state.")
        session.events.append(
            ProductEvent(migration_session_id=session.id, name=ProductEventName.PLAN_STARTED)
        )
        plan, activity = self.planning_agent.run(
            session.id, session.assessment, session.discovery, source
        )
        session.plan = plan
        session.activity.append(activity)
        session.workflow_status = WorkflowStatus.PLANNED
        session.stage = "plan"
        session.events.append(
            ProductEvent(
                migration_session_id=session.id,
                name=ProductEventName.PLAN_GENERATED,
                attributes={"plan_id": str(plan.id), "phase_count": len(plan.phases)},
            )
        )
        return session

    def create_mappings(
        self, session: MigrationSession, fixture: dict[str, Any]
    ) -> MigrationSession:
        if session.plan is None or session.workflow_status is not WorkflowStatus.PLANNED:
            raise WorkflowTransitionError("A valid migration plan is required before mapping.")
        session.workflow_status = WorkflowStatus.MAPPING
        session.stage = "map_approve"
        session.events.append(
            ProductEvent(migration_session_id=session.id, name=ProductEventName.MAPPING_STARTED)
        )
        mappings, activity = self.mapping_agent.run(
            session.id, fixture, session.plan.evidence_references
        )
        session.mappings = mappings
        session.activity.extend(activity)
        for proposal in mappings:
            session.events.append(
                ProductEvent(
                    migration_session_id=session.id,
                    name=(
                        ProductEventName.MAPPING_BLOCKED
                        if proposal.state is MappingState.BLOCKED
                        else ProductEventName.MAPPING_REVIEW_REQUIRED
                        if proposal.state is MappingState.REVIEW_REQUIRED
                        else ProductEventName.MAPPING_PROPOSED
                    ),
                    attributes={
                        "mapping_id": str(proposal.id),
                        "area": proposal.area.value,
                        "state": proposal.state.value,
                    },
                )
            )
        session.workflow_status = WorkflowStatus.AWAITING_APPROVAL
        return session

    def decide_mapping(
        self,
        session: MigrationSession,
        mapping_id: UUID,
        decision: MappingDecision,
        actor: str,
        source_record: dict[str, Any],
    ) -> MigrationSession:
        if session.workflow_status is not WorkflowStatus.AWAITING_APPROVAL:
            raise WorkflowTransitionError("Mapping decisions require AWAITING_APPROVAL state.")
        index = next(
            (position for position, item in enumerate(session.mappings) if item.id == mapping_id),
            None,
        )
        if index is None:
            raise LookupError(str(mapping_id))
        decided = apply_mapping_decision(session.mappings[index], decision, actor, source_record)
        from .audit import record_decision

        record_decision(
            session,
            actor,
            decided.state.value,
            "map_approve",
            decided.id,
            decided.evidence,
            decided.selected_target,
        )
        session.mappings[index] = decided
        event_name = {
            MappingState.APPROVED: ProductEventName.MAPPING_APPROVED,
            MappingState.MODIFIED: ProductEventName.MAPPING_MODIFIED,
            MappingState.REJECTED: ProductEventName.MAPPING_REJECTED,
        }[decided.state]
        audit = record_audit_event(event_name.value, actor, decided)
        session.events.append(
            ProductEvent(
                migration_session_id=session.id,
                name=event_name,
                attributes={
                    key: value for key, value in audit.items() if isinstance(value, (str, bool))
                },
            )
        )
        session.activity.append(
            AgentActivity(
                id=uuid5(_ACTIVITY_NAMESPACE, f"{session.id}:{decided.id}:{decided.state.value}"),
                migration_session_id=session.id,
                agent=self.role.value,
                action=f"Recorded human mapping decision: {decided.state.value}",
                tool="approval_policy_enforcement,audit_event_recording",
                status=ActivityStatus.COMPLETED,
                evidence_references=decided.evidence,
                risk=RiskLevel.HIGH if decided.risk.value == "HIGH" else RiskLevel.MEDIUM,
                provenance=Provenance.HUMAN,
                customer_action_required=(
                    not mapping_ready_for_handoff(session.mappings)
                    or bool(session.plan and session.plan.blockers)
                ),
                human_approval_required=True,
            )
        )
        return session

    def approve_plan(
        self, session: MigrationSession, actor: str, plan_id: UUID
    ) -> MigrationSession:
        from domain.planning_mapping.models import PlanApproval
        from tools.migration import stable_checksum

        from .audit import record_decision

        if actor != session.owner_subject:
            raise WorkflowTransitionError("Only the authenticated workspace owner may approve.")
        if session.plan is None or session.plan.id != plan_id:
            raise WorkflowTransitionError(
                "Read and review the current migration plan before approval."
            )
        if session.plan.approval is not None:
            return session  # A retry returns the original consent; no duplicate audit entry.
        if session.workflow_status is not WorkflowStatus.AWAITING_APPROVAL:
            raise WorkflowTransitionError("Plan approval requires AWAITING_APPROVAL state.")
        if (
            session.assessment is None
            or session.assessment.blocker_count
            or session.assessment.readiness.value == "BLOCKED"
            or session.plan.blockers
            or not mapping_ready_for_handoff(session.mappings)
        ):
            raise WorkflowTransitionError(
                "Review all mappings and clear hard blockers before approval."
            )
        decisions = []
        for mapping in session.mappings:
            audit = next(
                (
                    d
                    for d in reversed(session.human_decisions)
                    if d.affected_entity == str(mapping.id)
                    and d.decision == mapping.state.value
                    and d.actor == mapping.decided_by
                    and d.selected_value == mapping.selected_target
                ),
                None,
            )
            if audit is None or mapping.decided_at is None:
                raise WorkflowTransitionError("Every mapping needs an attributable human decision.")
            decisions.append(audit.id)
        checksum = stable_checksum(
            {
                "plan": session.plan.model_dump(mode="json", exclude={"approval"}),
                "source_checksum": session.source_checksum,
                "mappings": [m.model_dump(mode="json") for m in session.mappings],
            }
        )
        record_decision(
            session,
            actor,
            "PLAN_APPROVED",
            "approve",
            session.plan.id,
            [*session.plan.evidence_references, *map(str, decisions)],
            checksum,
        )
        audit = session.human_decisions[-1]
        session.plan.approval = PlanApproval(
            plan_id=session.plan.id,
            decision_id=audit.id,
            actor=audit.actor,
            approved_at=audit.occurred_at,
            mapping_decision_ids=decisions,
            manifest_checksum=checksum,
        )
        session.workflow_status = WorkflowStatus.APPROVED
        session.stage = "approve"
        session.events.append(
            ProductEvent(
                migration_session_id=session.id,
                name=ProductEventName.READY_FOR_MIGRATION,
                attributes={
                    "plan_id": str(session.plan.id),
                    "mapping_count": len(session.mappings),
                    "approval_decision_id": str(audit.id),
                    "target_writes_performed": False,
                },
            )
        )
        return session


__all__ = [
    "MappingPolicyError",
    "PlanMapApproveOrchestrator",
    "WorkflowTransitionError",
]
