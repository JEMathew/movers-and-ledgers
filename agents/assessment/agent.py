"""Assessment orchestration for the versioned deterministic readiness policy."""

from uuid import UUID, uuid5

from agents.contracts import AgentRole
from domain.discovery_assessment.models import (
    ActivityStatus,
    AgentActivity,
    AssessmentResult,
    DiscoveryResult,
    Provenance,
    ReadinessStatus,
    RiskLevel,
)
from tools.discovery.readiness import calculate_readiness

_ACTIVITY_NAMESPACE = UUID("201bb576-ab50-5ce0-b99f-9c2c96f559a9")


class AssessmentAgent:
    """Applies readiness policy without changing or reinterpreting source evidence."""

    role = AgentRole.ASSESSMENT

    def run(
        self, session_id: UUID, discovery: DiscoveryResult
    ) -> tuple[AssessmentResult, AgentActivity]:
        result = calculate_readiness(discovery)
        risk = {
            ReadinessStatus.READY: RiskLevel.LOW,
            ReadinessStatus.NEEDS_ATTENTION: RiskLevel.MEDIUM,
            ReadinessStatus.BLOCKED: RiskLevel.HIGH,
        }[result.readiness]
        activity = AgentActivity(
            id=uuid5(_ACTIVITY_NAMESPACE, f"{session_id}:{result.policy_version}"),
            migration_session_id=session_id,
            agent=AgentRole.ASSESSMENT.value,
            action="Calculated migration readiness",
            tool="calculate_readiness",
            status=ActivityStatus.COMPLETED,
            evidence_references=[item.id for item in discovery.evidence],
            risk=risk,
            provenance=Provenance.DETERMINISTIC,
            customer_action_required=result.readiness is not ReadinessStatus.READY,
            human_approval_required=False,
        )
        return result, activity
