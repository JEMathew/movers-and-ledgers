"""Structured, provider-neutral records for deterministic discovery and assessment."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from domain.migration_resolution.models import MigrationExecution
from domain.onboarding_fpu.models import OnboardingState
from domain.planning_mapping.models import MappingProposal, MigrationPlan, WorkflowStatus
from domain.validation_configuration.models import (
    ConfigurationPlan,
    ValidationRepair,
    ValidationReport,
)


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
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PAUSED = "PAUSED"


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
    PLAN_STARTED = "plan_started"
    PLAN_GENERATED = "plan_generated"
    MAPPING_STARTED = "mapping_started"
    MAPPING_PROPOSED = "mapping_proposed"
    MAPPING_REVIEW_REQUIRED = "mapping_review_required"
    MAPPING_APPROVED = "mapping_approved"
    MAPPING_MODIFIED = "mapping_modified"
    MAPPING_REJECTED = "mapping_rejected"
    MAPPING_RECONSIDERATION_REQUESTED = "mapping_reconsideration_requested"
    MAPPING_RECONSIDERATION_REVIEWED = "mapping_reconsideration_reviewed"
    MAPPING_RECONSIDERATION_APPROVED = "mapping_reconsideration_approved"
    MAPPING_RECONSIDERATION_REJECTED = "mapping_reconsideration_rejected"
    MAPPING_BLOCKED = "mapping_blocked"
    READY_FOR_MIGRATION = "ready_for_migration"
    MIGRATION_STARTED = "migration_started"
    BATCH_STARTED = "batch_started"
    BATCH_COMPLETED = "batch_completed"
    BATCH_FAILED = "batch_failed"
    MIGRATION_PAUSED = "migration_paused"
    RESOLUTION_STARTED = "resolution_started"
    RESOLUTION_PROPOSED = "resolution_proposed"
    RESOLUTION_APPROVED = "resolution_approved"
    RESOLUTION_APPLIED = "resolution_applied"
    RETRY_STARTED = "retry_started"
    RETRY_SUCCEEDED = "retry_succeeded"
    RETRY_FAILED = "retry_failed"
    MIGRATION_RESUMED = "migration_resumed"
    MIGRATION_COMPLETED = "migration_completed"
    MIGRATION_BLOCKED = "migration_blocked"
    VALIDATION_STARTED = "validation_started"
    VALIDATION_CHECK_COMPLETED = "validation_check_completed"
    VALIDATION_FAILED = "validation_failed"
    VALIDATION_BLOCKED = "validation_blocked"
    VALIDATION_VERIFIED = "validation_verified"
    CONFIGURATION_STARTED = "configuration_started"
    CONFIGURATION_PROPOSED = "configuration_proposed"
    CONFIGURATION_REVIEW_REQUIRED = "configuration_review_required"
    CONFIGURATION_APPROVED = "configuration_approved"
    CONFIGURATION_MODIFIED = "configuration_modified"
    CONFIGURATION_REJECTED = "configuration_rejected"
    CONFIGURATION_APPLIED = "configuration_applied"
    CONFIGURATION_COMPLETED = "configuration_completed"
    READY_FOR_ONBOARDING = "ready_for_onboarding"
    ONBOARDING_STARTED = "onboarding_started"
    ONBOARDING_TASK_COMPLETED = "onboarding_task_completed"
    ONBOARDING_BLOCKED = "onboarding_blocked"
    ONBOARDING_COMPLETED = "onboarding_completed"
    ONBOARDING_DECISION = "onboarding_decision"
    FPU_READY = "fpu_ready"
    FPU_STARTED = "fpu_started"
    FPU_FAILED = "fpu_failed"
    FPU_BLOCKED = "fpu_blocked"
    FPU_REMEDIATION_REQUIRED = "fpu_remediation_required"
    FPU_REMEDIATED = "fpu_remediated"
    FPU_CONTRACT_PROPOSED = "fpu_contract_proposed"
    FPU_DECISION = "fpu_decision"
    FPU_POSTED = "fpu_posted"
    FPU_VERIFIED = "fpu_verified"
    FIRST_PRODUCTIVE_USE_COMPLETED = "first_productive_use_completed"


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


class HumanDecisionRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    actor: str
    role: str = "DEMO_WORKSPACE_OWNER"
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    decision: str
    evidence: list[str]
    stage: str
    affected_entity: str
    selected_value: str | None = None


class MigrationSession(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    owner_subject: str = Field(exclude=True, repr=False)
    sample_company_id: str
    company_name: str
    synthetic: bool = True
    status: SessionStatus = SessionStatus.CREATED
    source_kind: str = "synthetic_sample"
    uploaded_source: dict | None = Field(default=None, exclude=True, repr=False)
    intake_report: dict | None = None
    source_checksum: str | None = None
    stage: str = "discover"
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    discovery: DiscoveryResult | None = None
    assessment: AssessmentResult | None = None
    activity: list[AgentActivity] = Field(default_factory=list)
    events: list[ProductEvent] = Field(default_factory=list)
    human_decisions: list[HumanDecisionRecord] = Field(default_factory=list)
    workflow_status: WorkflowStatus = WorkflowStatus.CREATED
    plan: MigrationPlan | None = None
    mappings: list[MappingProposal] = Field(default_factory=list)
    execution: MigrationExecution | None = None
    validation_reports: list[ValidationReport] = Field(default_factory=list)
    validation_repairs: list[ValidationRepair] = Field(default_factory=list)
    configuration: ConfigurationPlan | None = None
    configuration_history: list[ConfigurationPlan] = Field(default_factory=list)
    onboarding: OnboardingState | None = None
