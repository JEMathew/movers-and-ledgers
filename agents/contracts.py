from datetime import UTC, datetime
from enum import StrEnum
from typing import Any, Protocol
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class LifecycleStage(StrEnum):
    LEARN = "learn"
    PLAY = "play"
    SIMULATE = "simulate"
    TRY_YOUR_DATA = "try_your_data"
    DISCOVER = "discover"
    ASSESS = "assess"
    PLAN = "plan"
    MAP_APPROVE = "map_approve"
    MIGRATE = "migrate"
    RESOLVE = "resolve"
    VALIDATE = "validate"
    CONFIGURE = "configure"
    ONBOARD = "onboard"
    FIRST_PRODUCTIVE_USE = "first_productive_use"


class AgentRole(StrEnum):
    ORCHESTRATOR = "migration_orchestrator"
    DISCOVERY = "discovery_agent"
    ASSESSMENT = "assessment_agent"
    PLANNING = "planning_agent"
    MAPPING = "mapping_agent"
    MIGRATION = "migration_agent"
    RESOLUTION = "resolution_agent"
    VALIDATION = "validation_agent"
    CONFIGURATION = "configuration_agent"
    ONBOARDING = "onboarding_agent"
    ACTIVATION = "first_productive_use_activation_agent"
    TRUST_GOVERNANCE = "trust_governance_agent"
    KNOWLEDGE = "knowledge_agent"


class Evidence(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    kind: str
    source: str
    checksum: str | None = None
    observed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    attributes: dict[str, Any] = Field(default_factory=dict)


class ProposedAction(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    agent: AgentRole
    name: str
    rationale: str
    inputs: dict[str, Any] = Field(default_factory=dict)
    evidence_ids: list[UUID] = Field(default_factory=list)
    consequential: bool = False
    idempotency_key: str


class ToolResult(BaseModel):
    action_id: UUID
    success: bool
    evidence: list[Evidence] = Field(default_factory=list)
    output: dict[str, Any] = Field(default_factory=dict)
    error_code: str | None = None


class AgentContract(Protocol):
    role: AgentRole

    async def propose(self, state: "WorkflowState") -> ProposedAction: ...


class WorkflowState(BaseModel):
    workspace_id: UUID = Field(default_factory=uuid4)
    stage: LifecycleStage = LifecycleStage.DISCOVER
    revision: int = Field(default=1, ge=1)
    evidence: list[Evidence] = Field(default_factory=list)
    open_issues: list[str] = Field(default_factory=list)
    approvals: list[UUID] = Field(default_factory=list)
    context: dict[str, Any] = Field(default_factory=dict)
