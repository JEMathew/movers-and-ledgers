"""Structured, provider-neutral records for deterministic discovery and assessment."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class FindingCategory(StrEnum):
    BLOCKER = "BLOCKER"
    WARNING = "WARNING"
    INFO = "INFO"


class Provenance(StrEnum):
    DETERMINISTIC = "DETERMINISTIC"
    AI_ML = "AI_ML"
    GENAI = "GENAI"
    HUMAN = "HUMAN"


class DatasetStatus(StrEnum):
    READY = "READY"
    NEEDS_ATTENTION = "NEEDS ATTENTION"
    BLOCKED = "BLOCKED"


class ReadinessStatus(StrEnum):
    READY = "READY"
    NEEDS_ATTENTION = "NEEDS ATTENTION"
    BLOCKED = "BLOCKED"


class SessionStatus(StrEnum):
    CREATED = "CREATED"
    DISCOVERED = "DISCOVERED"
    ASSESSED = "ASSESSED"
    BLOCKED = "BLOCKED"


class ActivityStatus(StrEnum):
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class RiskLevel(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ProductEventName(StrEnum):
    ASSESSMENT_STARTED = "assessment_started"
    DISCOVERY_STARTED = "discovery_started"
    DISCOVERY_COMPLETED = "discovery_completed"
    FINDING_GENERATED = "finding_generated"
    ASSESSMENT_COMPLETED = "assessment_completed"
    ASSESSMENT_BLOCKED = "assessment_blocked"
    CONTINUE_TO_PLAN_SELECTED = "continue_to_plan_selected"


class EvidenceReference(BaseModel):
    id: str
    tool: str
    dataset: str
    summary: str
    attributes: dict[str, Any] = Field(default_factory=dict)


class DetectedIssue(BaseModel):
    rule_code: str
    category: FindingCategory
    title: str
    explanation: str
    affected_record_count: int | None = None
    evidence_summary: str
    recommended_action: str
    customer_action_required: bool


class ToolObservation(BaseModel):
    tool: str
    dataset: str
    passed: bool
    evidence: EvidenceReference
    issues: list[DetectedIssue] = Field(default_factory=list)
    details: dict[str, Any] = Field(default_factory=dict)


class Finding(BaseModel):
    id: str
    rule_code: str
    category: FindingCategory
    title: str
    explanation: str
    affected_entity: str
    affected_record_count: int | None = None
    evidence: list[str]
    recommended_action: str
    provenance: Provenance = Provenance.DETERMINISTIC
    tool: str
    customer_action_required: bool


class DatasetProfile(BaseModel):
    dataset: str
    label: str
    record_count: int
    required_fields: list[str]
    missing_values: dict[str, int] = Field(default_factory=dict)
    duplicate_candidates: int = 0
    referential_integrity_issues: int = 0
    unsupported_items: int = 0
    status: DatasetStatus
    evidence_ids: list[str] = Field(default_factory=list)


class DiscoveryResult(BaseModel):
    fixture_version: str
    sample_company_id: str
    company_name: str
    synthetic: bool = True
    profiles: list[DatasetProfile]
    findings: list[Finding]
    evidence: list[EvidenceReference]
    tools_called: list[str]


class AssessmentResult(BaseModel):
    readiness: ReadinessStatus
    policy_version: str
    blocker_count: int
    warning_count: int
    ready_areas: list[str]
    unresolved_areas: list[str]
    recommended_next_actions: list[str]
    decision_basis: list[str]
    target_assumptions: list[str]
    score: int | None = None


class AgentActivity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    migration_session_id: UUID
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    agent: str
    action: str
    tool: str
    status: ActivityStatus
    evidence_references: list[str] = Field(default_factory=list)
    risk: RiskLevel
    provenance: Provenance
    customer_action_required: bool
    human_approval_required: bool


class ProductEvent(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    migration_session_id: UUID
    name: ProductEventName
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    attributes: dict[str, str | int | bool] = Field(default_factory=dict)


class MigrationSession(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    owner_subject: str = Field(exclude=True, repr=False)
    sample_company_id: str
    company_name: str
    synthetic: bool = True
    status: SessionStatus = SessionStatus.CREATED
    stage: str = "discover"
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    discovery: DiscoveryResult | None = None
    assessment: AssessmentResult | None = None
    activity: list[AgentActivity] = Field(default_factory=list)
    events: list[ProductEvent] = Field(default_factory=list)
