"""Planning orchestration over deterministic plan capabilities."""

from uuid import UUID, uuid5

from agents.contracts import AgentRole
from domain.discovery_assessment.models import (
    ActivityStatus,
    AgentActivity,
    AssessmentResult,
    DiscoveryResult,
    Provenance,
    RiskLevel,
)
from domain.planning_mapping.models import MigrationPlan
from tools.planning import build_migration_plan, validate_migration_plan

_ACTIVITY_NAMESPACE = UUID("99c2371e-2d75-5c7b-8b30-e56b0bb40224")


class PlanningAgent:
    """Creates a structured plan but cannot execute or approve migration work."""

    role = AgentRole.PLANNING

    def run(
        self,
        session_id: UUID,
        assessment: AssessmentResult,
        discovery: DiscoveryResult,
    ) -> tuple[MigrationPlan, AgentActivity]:
        plan = build_migration_plan(assessment, discovery)
        errors = validate_migration_plan(plan)
        if errors:
            raise ValueError(" ".join(errors))
        activity = AgentActivity(
            id=uuid5(_ACTIVITY_NAMESPACE, f"{session_id}:{plan.version}"),
            migration_session_id=session_id,
            agent=self.role.value,
            action="Generated a dependency-checked migration plan",
            tool="build_migration_plan,validate_migration_plan",
            status=ActivityStatus.COMPLETED,
            evidence_references=plan.evidence_references,
            risk=RiskLevel.HIGH if plan.blockers else RiskLevel.MEDIUM,
            provenance=Provenance.DETERMINISTIC,
            customer_action_required=True,
            human_approval_required=True,
        )
        return plan, activity
