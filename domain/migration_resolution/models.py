"""Structured execution, exception, checkpoint, and remediation records."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ExecutionStatus(StrEnum):
    READY = "MIGRATION_READY"
    RUNNING = "MIGRATING"
    PAUSED = "MIGRATION_PAUSED"
    RESOLVING = "RESOLVING"
    RETRY_PENDING = "RETRY_PENDING"
    COMPLETE = "MIGRATION_COMPLETE"
    BLOCKED = "MIGRATION_BLOCKED"


class BatchStatus(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    RETRY_PENDING = "RETRY_PENDING"
    BLOCKED = "BLOCKED"


class ExceptionKind(StrEnum):
    VALIDATION_DISCREPANCY = "VALIDATION_DISCREPANCY"
    DUPLICATE_CUSTOMER = "DUPLICATE_CUSTOMER"
    MISSING_REFERENCE = "MISSING_REFERENCE"
    UNSUPPORTED_TAX_CODE = "UNSUPPORTED_TAX_CODE"
    INVALID_CONFIGURATION_DEPENDENCY = "INVALID_CONFIGURATION_DEPENDENCY"
    TRANSIENT_EXECUTION = "TRANSIENT_EXECUTION"
    RETRYABLE_BATCH = "RETRYABLE_BATCH"
    NON_RETRYABLE_BLOCKED = "NON_RETRYABLE_BLOCKED"


class ResolutionState(StrEnum):
    PROPOSED = "PROPOSED"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    APPLIED = "APPLIED"
    REJECTED = "REJECTED"
    ESCALATED = "ESCALATED"


class ExecutionCheckpoint(BaseModel):
    batch_id: str
    revision: int = Field(ge=1)
    completed_batch_ids: list[str]
    target_checksum: str
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class MigrationBatch(BaseModel):
    id: str
    sequence: int = Field(ge=1)
    entity: str
    record_count: int = Field(ge=0)
    idempotency_key: str
    source_checksum: str
    status: BatchStatus = BatchStatus.PENDING
    attempt_count: int = Field(default=0, ge=0)
    retry_limit: int = Field(default=2, ge=0, le=5)
    succeeded_count: int = Field(default=0, ge=0)
    failed_count: int = Field(default=0, ge=0)
    failure_id: UUID | None = None
    last_error: str | None = None


class MigrationFailure(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    batch_id: str
    kind: ExceptionKind
    code: str
    summary: str
    root_cause: str
    retryable: bool
    risk: str
    evidence: list[str]
    affected_record_ids: list[str] = Field(default_factory=list)
    blocking: bool = True
    resolved: bool = False
    retry_count: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ResolutionProposal(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    failure_id: UUID
    version: str = "resolution-policy-v1"
    specialist: str
    action: str
    rationale: str
    evidence: list[str]
    confidence: float = Field(ge=0, le=1)
    risk: str
    reversible: bool
    deterministic_fix_available: bool
    human_approval_required: bool
    escalation_rule: str
    allowed_tools: list[str]
    state: ResolutionState = ResolutionState.PROPOSED
    decided_by: str | None = None
    decided_at: datetime | None = None
    decision_comment: str | None = None


class ResolutionDecision(BaseModel):
    approve: bool
    comment: str | None = None


class MigrationExecution(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    version: str = "migration-execution-v1"
    manifest_version: str
    manifest_checksum: str
    approved_mapping_ids: list[UUID]
    plan_id: UUID | None = None
    mapping_bindings: dict[str, dict[str, str]] = Field(default_factory=dict)
    status: ExecutionStatus = ExecutionStatus.READY
    idempotency_key: str
    batches: list[MigrationBatch]
    failures: list[MigrationFailure] = Field(default_factory=list)
    resolutions: list[ResolutionProposal] = Field(default_factory=list)
    checkpoints: list[ExecutionCheckpoint] = Field(default_factory=list)
    loaded_idempotency_keys: list[str] = Field(default_factory=list)
    applied_resolution_actions: list[str] = Field(default_factory=list)
    target_state: dict[str, list[dict[str, Any]]] = Field(default_factory=dict)
    progress_percent: int = Field(default=0, ge=0, le=100)
    current_batch_id: str | None = None
    current_agent: str = "migration_agent"
    safe_to_validate: bool = False
    started_at: datetime | None = None
    completed_at: datetime | None = None

    @property
    def unresolved_blocking_failures(self) -> int:
        return sum(1 for failure in self.failures if failure.blocking and not failure.resolved)
