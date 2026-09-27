"""Structured planning, mapping, and human-approval records."""

from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class WorkflowStatus(StrEnum):
    DISCOVERED = "DISCOVERED"
    ASSESSED = "ASSESSED"
    PLANNED = "PLANNED"
    MAPPING = "MAPPING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    MIGRATION_READY = "MIGRATION_READY"
    MIGRATING = "MIGRATING"
    MIGRATION_PAUSED = "MIGRATION_PAUSED"
    RESOLVING = "RESOLVING"
    RETRY_PENDING = "RETRY_PENDING"
    MIGRATION_COMPLETE = "MIGRATION_COMPLETE"
    MIGRATION_BLOCKED = "MIGRATION_BLOCKED"
    VALIDATING = "VALIDATING"
    VALIDATION_BLOCKED = "VALIDATION_BLOCKED"
    VALIDATED = "VALIDATED"
    CONFIGURING = "CONFIGURING"
    CONFIGURATION_REVIEW_REQUIRED = "CONFIGURATION_REVIEW_REQUIRED"
    CONFIGURED = "CONFIGURED"
    ONBOARDING = "ONBOARDING"
    ONBOARDING_BLOCKED = "ONBOARDING_BLOCKED"
    READY_FOR_FIRST_PRODUCTIVE_USE = "READY_FOR_FIRST_PRODUCTIVE_USE"
    FIRST_PRODUCTIVE_USE_IN_PROGRESS = "FIRST_PRODUCTIVE_USE_IN_PROGRESS"
    FIRST_PRODUCTIVE_USE_BLOCKED = "FIRST_PRODUCTIVE_USE_BLOCKED"
    VERIFIED_FIRST_PRODUCTIVE_USE = "VERIFIED_FIRST_PRODUCTIVE_USE"


class PlanStatus(StrEnum):
    DRAFT = "DRAFT"
    READY_FOR_MAPPING = "READY_FOR_MAPPING"


class PlanPhaseStatus(StrEnum):
    READY = "READY"
    NEEDS_ATTENTION = "NEEDS_ATTENTION"
    BLOCKED = "BLOCKED"
    FUTURE = "FUTURE"


class MappingArea(StrEnum):
    CHART_OF_ACCOUNTS = "chart_of_accounts"
    CUSTOMERS = "customers"
    VENDORS = "vendors"
    PRODUCTS_SERVICES = "products_services"
    TAX_CONFIGURATION = "tax_configuration"
    GENERAL_CONFIGURATION = "general_configuration"


class MappingRisk(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class MappingState(StrEnum):
    PROPOSED = "PROPOSED"
    AUTO_ACCEPTABLE = "AUTO_ACCEPTABLE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    APPROVED = "APPROVED"
    MODIFIED = "MODIFIED"
    REJECTED = "REJECTED"
    BLOCKED = "BLOCKED"


class PlanPhase(BaseModel):
    id: str
    sequence: int = Field(ge=1)
    name: str
    objective: str
    dependencies: list[str] = Field(default_factory=list)
    status: PlanPhaseStatus
    risks: list[str] = Field(default_factory=list)
    customer_action: str
    agent_responsible: str
    approval_checkpoint: str | None = None


class MigrationPlan(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    version: str
    status: PlanStatus
    phases: list[PlanPhase]
    sequence: list[str]
    dependencies: dict[str, list[str]]
    prerequisites: list[str]
    blockers: list[str]
    risks: list[str]
    checkpoints: list[str]
    approvals_required: list[str]
    customer_actions: list[str]
    relative_complexity: str
    evidence_references: list[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class MappingProposal(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    version: str
    area: MappingArea
    source_id: str
    source_label: str
    recommended_target: str
    selected_target: str
    confidence: float = Field(ge=0, le=1)
    risk: MappingRisk
    evidence: list[str]
    rationale: str
    alternatives: list[str] = Field(default_factory=list)
    required_target_fields: list[str] = Field(default_factory=list)
    state: MappingState = MappingState.PROPOSED
    approval_required: bool = True
    policy_reasons: list[str] = Field(default_factory=list)
    deterministic_checks: list[str] = Field(default_factory=list)
    specialist: str
    decided_by: str | None = None
    decided_at: datetime | None = None
    decision_comment: str | None = None


class MappingDecision(BaseModel):
    decision: MappingState
    selected_target: str | None = None
    comment: str | None = None


class MappingSpecialistInput(BaseModel):
    area: MappingArea
    records: list[dict[str, object]]
    evidence_references: list[str]


class MappingSpecialistOutput(BaseModel):
    specialist: str
    proposals: list[MappingProposal]
    escalations: list[str] = Field(default_factory=list)
    tools_used: list[str] = Field(default_factory=list)
