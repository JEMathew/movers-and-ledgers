"""Deterministic lifecycle guardrails around agent-proposed work."""

from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from agents.contracts import LifecycleStage, ProposedAction, WorkflowState


class ApprovalDecision(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApprovalRequest(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    workspace_id: UUID
    action: ProposedAction
    decision: ApprovalDecision = ApprovalDecision.PENDING
    decided_by: str | None = None
    decided_at: datetime | None = None
    comment: str | None = None


class PolicyStop(ValueError):
    pass


STAGE_ORDER = list(LifecycleStage)
CONSEQUENTIAL_STAGES = {
    LifecycleStage.MAP_APPROVE,
    LifecycleStage.MIGRATE,
    LifecycleStage.CONFIGURE,
    LifecycleStage.FIRST_PRODUCTIVE_USE,
}


class MigrationWorkflow:
    """A deterministic state machine; agents cannot bypass these transitions."""

    def next_stage(self, state: WorkflowState, *, approved: bool = False) -> WorkflowState:
        current_index = STAGE_ORDER.index(state.stage)
        if current_index == len(STAGE_ORDER) - 1:
            return state
        next_stage = STAGE_ORDER[current_index + 1]
        if next_stage in CONSEQUENTIAL_STAGES and not approved:
            raise PolicyStop(f"human approval is required before {next_stage.value}")
        if state.open_issues and next_stage in {
            LifecycleStage.MIGRATE,
            LifecycleStage.FIRST_PRODUCTIVE_USE,
        }:
            raise PolicyStop("blocking issues must be resolved before this transition")
        return state.model_copy(update={"stage": next_stage, "revision": state.revision + 1})

    def decide(
        self, request: ApprovalRequest, decision: ApprovalDecision, actor: str, comment: str | None
    ) -> ApprovalRequest:
        if request.decision is not ApprovalDecision.PENDING:
            raise PolicyStop("approval request has already been decided")
        if decision is ApprovalDecision.PENDING:
            raise PolicyStop("a final decision is required")
        return request.model_copy(
            update={
                "decision": decision,
                "decided_by": actor,
                "decided_at": datetime.now(UTC),
                "comment": comment,
            }
        )
