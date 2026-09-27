from datetime import UTC, datetime
from enum import StrEnum
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class ValidationStatus(StrEnum):
    VERIFIED = "VERIFIED"
    WARNING = "WARNING"
    BLOCKED = "BLOCKED"


class ValidationCheck(BaseModel):
    id: str
    label: str
    source: str
    target: str
    difference: str
    status: ValidationStatus
    evidence: list[str]
    record_ids: list[str] = Field(default_factory=list)
    explanation: str
    next_action: str


class ValidationReport(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    policy_version: str = "validation-v1-exact-decimal"
    source_checksum: str
    target_checksum: str
    manifest_checksum: str
    currency: str
    status: ValidationStatus
    checks: list[ValidationCheck]
    blocking_discrepancies: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ConfigurationState(StrEnum):
    PROPOSED = "PROPOSED"
    AUTO_APPLICABLE = "AUTO_APPLICABLE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    APPROVED = "APPROVED"
    MODIFIED = "MODIFIED"
    REJECTED = "REJECTED"
    BLOCKED = "BLOCKED"
    APPLIED = "APPLIED"


class ConfigurationProposal(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    area: str
    label: str
    source_value: str
    selected_value: str
    alternatives: list[str]
    risk: Literal["LOW", "HIGH"]
    approval_required: bool
    required: bool = True
    state: ConfigurationState
    evidence: list[str]
    policy_reason: str
    explanation: str
    decided_by: str | None = None
    decided_at: datetime | None = None
    decision: str | None = None
    comment: str | None = None


class ConfigurationDecision(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal["approve", "modify", "reject"]
    value: str | None = Field(default=None, max_length=120)
    comment: str | None = Field(default=None, max_length=1000)


class ConfigurationPlan(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    policy_version: str = "configuration-v1"
    validation_id: UUID
    target_checksum: str
    source_checksum: str
    proposals: list[ConfigurationProposal]
    target_settings: dict[str, str] = Field(default_factory=dict)
    ready_for_onboarding: bool = False


class ValidationRepair(BaseModel):
    resolution_id: UUID
    validation_id: UUID
    entity: str
    record_id: str
    before_checksum: str
    before_payload: dict = Field(default_factory=dict)
    source_checksum: str
    applied: bool = False
