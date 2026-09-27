"""Authoritative batch, idempotency, checkpoint, and synthetic-target controls."""

import hashlib
import json
from copy import deepcopy
from typing import Any

from domain.migration_resolution.models import (
    BatchStatus,
    ExceptionKind,
    ExecutionCheckpoint,
    ExecutionStatus,
    MigrationBatch,
    MigrationExecution,
    ResolutionProposal,
    ResolutionState,
)


class MigrationControlError(ValueError):
    pass


def stable_checksum(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()
    return hashlib.sha256(encoded).hexdigest()


def validate_idempotency(idempotency_key: str) -> None:
    if not idempotency_key.strip() or len(idempotency_key) > 160:
        raise MigrationControlError("A bounded idempotency key is required.")


def detect_duplicate_execution(idempotency_key: str, completed_keys: list[str]) -> bool:
    validate_idempotency(idempotency_key)
    return idempotency_key in completed_keys


def extract_batch(fixture: dict[str, Any], batch: MigrationBatch) -> list[dict[str, Any]]:
    datasets = fixture.get("datasets")
    if not isinstance(datasets, dict):
        raise MigrationControlError("Synthetic source datasets are unavailable.")
    records = datasets.get(batch.entity, [])
    if not isinstance(records, list):
        raise MigrationControlError(f"Dataset '{batch.entity}' is not a record collection.")
    if stable_checksum(records) != batch.source_checksum:
        raise MigrationControlError("Source batch changed after the approved manifest was created.")
    return deepcopy(records)


def transform_batch(records: list[dict[str, Any]], batch: MigrationBatch) -> list[dict[str, Any]]:
    """Normalize synthetic records without making accounting classifications."""
    transformed: list[dict[str, Any]] = []
    for index, record in enumerate(records):
        source_id = str(record.get("id") or record.get("key") or f"{batch.entity}-{index + 1}")
        transformed.append(
            {
                "source_id": source_id,
                "canonical_entity": batch.entity,
                "source_checksum": stable_checksum(record),
                "payload": deepcopy(record),
            }
        )
    return transformed


def validate_transformation(transformed: list[dict[str, Any]], batch: MigrationBatch) -> list[str]:
    errors: list[str] = []
    if len(transformed) != batch.record_count:
        errors.append("Transformed record count differs from the approved source batch.")
    source_ids = [str(item.get("source_id", "")) for item in transformed]
    if any(not source_id for source_id in source_ids):
        errors.append("Every transformed record requires source lineage.")
    if len(source_ids) != len(set(source_ids)):
        errors.append("Duplicate source identities exist inside the execution batch.")
    if any(item.get("canonical_entity") != batch.entity for item in transformed):
        errors.append("Canonical entity changed outside the approved batch boundary.")
    return errors


def planned_failure_for_batch(
    fixture: dict[str, Any], batch: MigrationBatch
) -> ExceptionKind | None:
    """Return a declared synthetic failure; never infer production outcomes."""
    controls = fixture.get("migration_controls", {})
    if not isinstance(controls, dict) or controls.get("batch") != batch.entity:
        return None
    failures_before_success = int(controls.get("failures_before_success", 1))
    if batch.attempt_count > failures_before_success:
        return None
    try:
        return ExceptionKind(str(controls.get("failure_kind")))
    except ValueError as error:
        raise MigrationControlError("Unknown synthetic failure scenario.") from error


def load_batch(
    target_state: dict[str, list[dict[str, Any]]],
    batch: MigrationBatch,
    transformed: list[dict[str, Any]],
    completed_keys: list[str],
) -> tuple[dict[str, list[dict[str, Any]]], list[str]]:
    """Idempotently write to the inspectable synthetic target only."""
    if detect_duplicate_execution(batch.idempotency_key, completed_keys):
        return deepcopy(target_state), list(completed_keys)
    updated = deepcopy(target_state)
    updated[batch.entity] = deepcopy(transformed)
    return updated, [*completed_keys, batch.idempotency_key]


def checkpoint_batch(execution: MigrationExecution, batch: MigrationBatch) -> ExecutionCheckpoint:
    completed = [item.id for item in execution.batches if item.status is BatchStatus.COMPLETED]
    return ExecutionCheckpoint(
        batch_id=batch.id,
        revision=len(execution.checkpoints) + 1,
        completed_batch_ids=completed,
        target_checksum=stable_checksum(execution.target_state),
    )


def calculate_progress(batches: list[MigrationBatch]) -> int:
    if not batches:
        return 0
    total_records = sum(max(batch.record_count, 1) for batch in batches)
    completed_records = sum(
        max(batch.record_count, 1) for batch in batches if batch.status is BatchStatus.COMPLETED
    )
    return round((completed_records / total_records) * 100)


def pause_execution(execution: MigrationExecution) -> MigrationExecution:
    return execution.model_copy(update={"status": ExecutionStatus.PAUSED})


def resume_execution(execution: MigrationExecution) -> MigrationExecution:
    if execution.status not in {ExecutionStatus.PAUSED, ExecutionStatus.RETRY_PENDING}:
        raise MigrationControlError("Only paused or retry-pending execution can resume.")
    return execution.model_copy(update={"status": ExecutionStatus.RUNNING})


def record_execution_event(
    action: str, execution: MigrationExecution, batch: MigrationBatch | None = None
) -> dict[str, str | int | bool]:
    return {
        "action": action,
        "execution_id": str(execution.id),
        "batch_id": batch.id if batch else "",
        "entity": batch.entity if batch else "",
        "attempt": batch.attempt_count if batch else 0,
        "progress_percent": execution.progress_percent,
        "synthetic_target": True,
    }


def apply_resolution_control(
    execution: MigrationExecution, proposal: ResolutionProposal
) -> MigrationExecution:
    """Record an authorized remediation without allowing free-form record mutation."""
    if proposal.human_approval_required and proposal.state is not ResolutionState.APPROVED:
        raise MigrationControlError("Human approval is required before remediation.")
    if proposal.state is ResolutionState.REJECTED:
        raise MigrationControlError("A rejected resolution cannot be applied.")
    failure = next((item for item in execution.failures if item.id == proposal.failure_id), None)
    if failure is None:
        raise MigrationControlError("Resolution failure evidence is unavailable.")
    if not failure.retryable or not proposal.deterministic_fix_available:
        proposal.state = ResolutionState.ESCALATED
        execution.status = ExecutionStatus.BLOCKED
        return execution
    action_record = f"{failure.id}:{proposal.action}:{proposal.version}"
    if action_record not in execution.applied_resolution_actions:
        execution.applied_resolution_actions.append(action_record)
    failure.resolved = True
    proposal.state = ResolutionState.APPLIED
    batch = next(item for item in execution.batches if item.id == failure.batch_id)
    batch.status = BatchStatus.RETRY_PENDING
    batch.failure_id = None
    execution.status = ExecutionStatus.RETRY_PENDING
    return execution
