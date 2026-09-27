"""Resolution Agent that explains failures and proposes bounded remediation."""

from datetime import UTC, datetime

from agents.contracts import AgentRole
from agents.knowledge import KnowledgeAgent
from domain.migration_resolution.models import (
    MigrationExecution,
    MigrationFailure,
    ResolutionDecision,
    ResolutionProposal,
    ResolutionState,
)
from domain.migration_resolution.policy import FAILURE_POLICIES, RESOLUTION_POLICY_VERSION
from tools.migration import apply_resolution_control

from .specialists import SPECIALISTS


class ResolutionAgent:
    role = AgentRole.RESOLUTION

    def __init__(self) -> None:
        self.knowledge_agent = KnowledgeAgent()

    def propose(self, failure: MigrationFailure) -> ResolutionProposal:
        policy = FAILURE_POLICIES[failure.kind]
        specialist = SPECIALISTS[str(policy["specialist"])]
        result = specialist.propose(failure)
        knowledge = self.knowledge_agent.lookup_resolution(failure.kind)
        approval_required = bool(policy["human_approval_required"])
        return ResolutionProposal(
            failure_id=failure.id,
            version=RESOLUTION_POLICY_VERSION,
            specialist=result.specialist,
            action=result.action,
            rationale=f"{result.rationale} {knowledge.remediation_guardrail}",
            evidence=[
                *failure.evidence,
                f"policy:{RESOLUTION_POLICY_VERSION}",
                knowledge.reference,
            ],
            confidence=result.confidence,
            risk=str(policy["risk"]),
            reversible=True,
            deterministic_fix_available=bool(policy["retryable"]),
            human_approval_required=approval_required,
            escalation_rule=result.escalation_rule,
            allowed_tools=list(result.allowed_tools),
            state=(
                ResolutionState.AWAITING_APPROVAL if approval_required else ResolutionState.PROPOSED
            ),
        )

    def decide(
        self, proposal: ResolutionProposal, decision: ResolutionDecision, actor: str
    ) -> ResolutionProposal:
        proposal.state = ResolutionState.APPROVED if decision.approve else ResolutionState.REJECTED
        proposal.decided_by = actor
        proposal.decided_at = datetime.now(UTC)
        proposal.decision_comment = decision.comment
        return proposal

    def apply(
        self, execution: MigrationExecution, proposal: ResolutionProposal
    ) -> MigrationExecution:
        apply_resolution_control(execution, proposal)
        execution.current_agent = self.role.value
        return execution
