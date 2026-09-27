"""Migration Agent constrained to deterministic tools and the synthetic target."""

from datetime import UTC, datetime
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from agents.contracts import AgentRole
from domain.migration_resolution.models import (
    BatchStatus,
    ExceptionKind,
    ExecutionStatus,
    MigrationBatch,
    MigrationExecution,
    MigrationFailure,
)
from domain.migration_resolution.policy import BATCH_ORDER, DEFAULT_RETRY_LIMIT, FAILURE_POLICIES
from domain.planning_mapping.models import MappingProposal
from tools.migration import (
    calculate_progress,
    checkpoint_batch,
    extract_batch,
    load_batch,
    planned_failure_for_batch,
    stable_checksum,
    transform_batch,
    validate_idempotency,
    validate_transformation,
)


class MigrationAgent:
    role = AgentRole.MIGRATION
    allowed_tools = (
        "batch_extraction",
        "deterministic_transformation",
        "transformation_validation",
        "synthetic_target_load",
        "checkpoint_recording",
        "progress_calculation",
    )

    def create_execution(
        self,
        fixture: dict[str, Any],
        manifest_version: str,
        idempotency_key: str,
        approved_mappings: list[MappingProposal],
    ) -> MigrationExecution:
        validate_idempotency(idempotency_key)
        datasets = fixture.get("datasets", {})
        if not isinstance(datasets, dict):
            raise ValueError("Synthetic datasets are unavailable.")
        batches = []
        order = (*BATCH_ORDER, "bills") if "bills" in datasets else BATCH_ORDER
        for sequence, entity in enumerate(order, start=1):
            records = datasets.get(entity, [])
            if not isinstance(records, list):
                raise ValueError(f"Dataset '{entity}' is not a record collection.")
            batches.append(
                MigrationBatch(
                    id=f"batch-{sequence:02d}-{entity}",
                    sequence=sequence,
                    entity=entity,
                    record_count=len(records),
                    idempotency_key=f"{idempotency_key}:{entity}",
                    source_checksum=stable_checksum(records),
                    retry_limit=DEFAULT_RETRY_LIMIT,
                )
            )
        return MigrationExecution(
            manifest_version=manifest_version,
            manifest_checksum=stable_checksum(
                {
                    "version": manifest_version,
                    "mappings": [mapping.model_dump(mode="json") for mapping in approved_mappings],
                }
            ),
            approved_mapping_ids=[mapping.id for mapping in approved_mappings],
            mapping_bindings={
                f"{mapping.area.value}:{mapping.source_id}": {
                    "mapping_id": str(mapping.id),
                    "selected_target": mapping.selected_target,
                }
                for mapping in approved_mappings
            },
            idempotency_key=idempotency_key,
            batches=batches,
        )

    def run_until_stop(
        self, execution: MigrationExecution, fixture: dict[str, Any]
    ) -> MigrationExecution:
        execution.status = ExecutionStatus.RUNNING
        execution.started_at = execution.started_at or datetime.now(UTC)
        execution.current_agent = self.role.value
        for batch in execution.batches:
            if batch.status is BatchStatus.COMPLETED:
                continue
            if batch.attempt_count >= batch.retry_limit + 1:
                failure = MigrationFailure(
                    id=uuid5(NAMESPACE_URL, f"{execution.id}:{batch.id}:retry-limit"),
                    batch_id=batch.id,
                    kind=ExceptionKind.NON_RETRYABLE_BLOCKED,
                    code="MB-RETRY-LIMIT",
                    summary=f"{batch.entity.replace('_', ' ').title()} retry limit reached.",
                    root_cause="The bounded retry policy was exhausted without batch completion.",
                    retryable=False,
                    risk="HIGH",
                    evidence=[
                        f"batch:{batch.id}",
                        f"attempt-count:{batch.attempt_count}",
                        f"retry-limit:{batch.retry_limit}",
                    ],
                    retry_count=batch.attempt_count - 1,
                )
                execution.failures.append(failure)
                batch.failure_id = failure.id
                batch.last_error = failure.summary
                batch.status = BatchStatus.BLOCKED
                execution.status = ExecutionStatus.BLOCKED
                return execution
            execution.current_batch_id = batch.id
            batch.status = BatchStatus.RUNNING
            batch.attempt_count += 1
            records = extract_batch(fixture, batch)
            transformed = transform_batch(records, batch)
            areas = {
                "accounts": "chart_of_accounts",
                "products": "products_services",
                "taxes": "tax_configuration",
                "configuration": "general_configuration",
                "customers": "customers",
                "vendors": "vendors",
            }
            for row in transformed:
                binding = execution.mapping_bindings.get(
                    f"{areas.get(batch.entity, batch.entity)}:{row['source_id']}"
                )
                if binding:
                    row["approved_mapping"] = dict(binding)
            errors = validate_transformation(transformed, batch)
            if errors:
                raise ValueError(" ".join(errors))
            failure_kind = planned_failure_for_batch(fixture, batch)
            if failure_kind is not None:
                policy = FAILURE_POLICIES[failure_kind]
                failure = MigrationFailure(
                    id=uuid5(NAMESPACE_URL, f"{execution.id}:{batch.id}:{batch.attempt_count}"),
                    batch_id=batch.id,
                    kind=failure_kind,
                    code=f"MB-{failure_kind.value}",
                    summary=f"{batch.entity.replace('_', ' ').title()} batch needs resolution.",
                    root_cause=f"Declared synthetic scenario: {failure_kind.value}.",
                    retryable=bool(policy["retryable"]),
                    risk=str(policy["risk"]),
                    evidence=[
                        f"batch:{batch.id}",
                        f"source-checksum:{batch.source_checksum}",
                        "fixture:migration_controls",
                    ],
                    affected_record_ids=[
                        str(record.get("id") or record.get("key")) for record in records[:3]
                    ],
                    retry_count=max(batch.attempt_count - 1, 0),
                )
                execution.failures.append(failure)
                batch.failure_id = failure.id
                batch.failed_count = batch.record_count
                batch.last_error = failure.summary
                batch.status = BatchStatus.FAILED if failure.retryable else BatchStatus.BLOCKED
                execution.progress_percent = calculate_progress(execution.batches)
                execution.status = (
                    ExecutionStatus.PAUSED if failure.retryable else ExecutionStatus.BLOCKED
                )
                return execution
            execution.target_state, execution.loaded_idempotency_keys = load_batch(
                execution.target_state,
                batch,
                transformed,
                execution.loaded_idempotency_keys,
            )
            batch.status = BatchStatus.COMPLETED
            batch.succeeded_count = batch.record_count
            batch.failed_count = 0
            batch.last_error = None
            execution.checkpoints.append(checkpoint_batch(execution, batch))
            execution.progress_percent = calculate_progress(execution.batches)
        execution.status = ExecutionStatus.COMPLETE
        execution.current_batch_id = None
        execution.progress_percent = 100
        execution.safe_to_validate = execution.unresolved_blocking_failures == 0
        execution.completed_at = datetime.now(UTC)
        return execution
