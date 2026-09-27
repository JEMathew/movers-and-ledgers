import json
from copy import deepcopy
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from movebooks_api.discover_assess.fixtures import load_sample_company
from movebooks_api.discover_assess.service import (
    DiscoverAssessService,
    InMemoryMigrationSessionRepository,
    session_repository,
)
from movebooks_api.main import app

from agents.orchestrator import MigrateResolveOrchestrator, WorkflowTransitionError
from agents.resolution import ResolutionAgent
from domain.migration_resolution.models import (
    ExceptionKind,
    ExecutionStatus,
    MigrationFailure,
    ResolutionDecision,
    ResolutionState,
)

AUTH = {"Authorization": "Bearer demo-user"}
EVALS_PATH = Path(__file__).resolve().parents[1] / "evals" / "migrate_resolve_cases.json"


@pytest.fixture(autouse=True)
def clear_sessions() -> None:
    session_repository.clear()
    yield
    app.dependency_overrides.clear()


def _approved_session():
    service = DiscoverAssessService(InMemoryMigrationSessionRepository())
    session = service.create_migration_demo_session("owner")
    fixture = deepcopy(load_sample_company("harbor-light-migrate-demo"))
    assert fixture is not None
    return service, session, fixture


def _start(kind: ExceptionKind | None, failures_before_success: int = 1):
    _, session, fixture = _approved_session()
    if kind is None:
        fixture.pop("migration_controls", None)
    else:
        fixture["migration_controls"] = {
            "batch": "customers",
            "failure_kind": kind.value,
            "failures_before_success": failures_before_success,
        }
    orchestrator = MigrateResolveOrchestrator()
    session = orchestrator.start(session, fixture, f"run-{kind or 'clean'}")
    return orchestrator, session, fixture


def test_eval_catalog_contains_the_fourteen_required_golden_cases() -> None:
    cases = json.loads(EVALS_PATH.read_text(encoding="utf-8"))
    assert len(cases) == 14
    assert len({case["id"] for case in cases}) == 14


def test_clean_migration_completes_with_inspectable_synthetic_target() -> None:
    orchestrator, session, _ = _start(None)
    assert session.execution is not None
    assert session.execution.status is ExecutionStatus.COMPLETE
    assert session.execution.progress_percent == 100
    assert set(session.execution.target_state) == {
        "accounts",
        "customers",
        "vendors",
        "products",
        "taxes",
        "configuration",
        "invoices",
        "transactions",
    }
    assert orchestrator.can_handoff_to_validation(session)


def test_retryable_transient_failure_is_auto_resolved_by_policy() -> None:
    _, session, _ = _start(ExceptionKind.TRANSIENT_EXECUTION)
    assert session.execution is not None
    assert session.execution.status is ExecutionStatus.RETRY_PENDING
    assert session.execution.resolutions[0].human_approval_required is False
    assert session.execution.resolutions[0].state is ResolutionState.APPLIED


@pytest.mark.parametrize(
    ("kind", "specialist"),
    [
        (ExceptionKind.DUPLICATE_CUSTOMER, "duplicate_resolution_specialist"),
        (ExceptionKind.MISSING_REFERENCE, "referential_integrity_specialist"),
        (ExceptionKind.UNSUPPORTED_TAX_CODE, "tax_configuration_resolution_specialist"),
        (
            ExceptionKind.INVALID_CONFIGURATION_DEPENDENCY,
            "tax_configuration_resolution_specialist",
        ),
    ],
)
def test_structured_failures_route_to_the_correct_specialist(
    kind: ExceptionKind, specialist: str
) -> None:
    _, session, _ = _start(kind)
    assert session.execution is not None
    proposal = session.execution.resolutions[0]
    assert proposal.specialist == specialist
    assert proposal.evidence
    assert proposal.confidence >= 0.9
    assert proposal.escalation_rule


def test_human_approval_applies_consequential_resolution() -> None:
    orchestrator, session, _ = _start(ExceptionKind.DUPLICATE_CUSTOMER)
    assert session.execution is not None
    proposal = session.execution.resolutions[0]
    orchestrator.decide_resolution(
        session, proposal.id, ResolutionDecision(approve=True, comment="Evidence reviewed"), "owner"
    )
    assert proposal.state is ResolutionState.APPLIED
    assert session.execution.status is ExecutionStatus.RETRY_PENDING


def test_human_rejection_blocks_migration_without_mutating_target() -> None:
    orchestrator, session, _ = _start(ExceptionKind.DUPLICATE_CUSTOMER)
    assert session.execution is not None
    before = deepcopy(session.execution.target_state)
    proposal = session.execution.resolutions[0]
    orchestrator.decide_resolution(
        session, proposal.id, ResolutionDecision(approve=False, comment="Do not merge"), "owner"
    )
    assert session.execution.status is ExecutionStatus.BLOCKED
    assert session.execution.target_state == before


def test_retry_succeeds_and_preserves_prior_checkpoint() -> None:
    orchestrator, session, fixture = _start(ExceptionKind.DUPLICATE_CUSTOMER)
    assert session.execution is not None
    checkpoint = session.execution.checkpoints[0]
    loaded_before = list(session.execution.loaded_idempotency_keys)
    proposal = session.execution.resolutions[0]
    orchestrator.decide_resolution(session, proposal.id, ResolutionDecision(approve=True), "owner")
    orchestrator.retry(session, fixture)
    assert session.execution.status is ExecutionStatus.COMPLETE
    assert session.execution.checkpoints[0] == checkpoint
    assert session.execution.loaded_idempotency_keys[: len(loaded_before)] == loaded_before


def test_retry_limit_escalates_to_blocked_state() -> None:
    orchestrator, session, fixture = _start(
        ExceptionKind.DUPLICATE_CUSTOMER, failures_before_success=99
    )
    assert session.execution is not None
    for _ in range(3):
        proposal = session.execution.resolutions[-1]
        orchestrator.decide_resolution(
            session, proposal.id, ResolutionDecision(approve=True), "owner"
        )
        orchestrator.retry(session, fixture)
    assert session.execution.status is ExecutionStatus.BLOCKED
    assert session.execution.unresolved_blocking_failures == 1
    assert session.execution.failures[-1].code == "MB-RETRY-LIMIT"
    assert session.execution.resolutions[-1].specialist == "migration_recovery_coordinator"
    assert not orchestrator.can_handoff_to_validation(session)


def test_non_retryable_failure_blocks_without_resolution_bypass() -> None:
    orchestrator, session, _ = _start(ExceptionKind.NON_RETRYABLE_BLOCKED)
    assert session.execution is not None
    assert session.execution.status is ExecutionStatus.BLOCKED
    assert session.execution.failures[0].resolved is False
    assert session.execution.resolutions[0].specialist == "migration_recovery_coordinator"
    assert session.execution.resolutions[0].state is ResolutionState.ESCALATED
    assert not orchestrator.can_handoff_to_validation(session)


def test_duplicate_execution_is_idempotent_and_conflicting_key_is_prevented() -> None:
    orchestrator, session, fixture = _start(ExceptionKind.DUPLICATE_CUSTOMER)
    execution_id = session.execution.id if session.execution else None
    orchestrator.start(session, fixture, "run-DUPLICATE_CUSTOMER")
    assert session.execution and session.execution.id == execution_id
    with pytest.raises(WorkflowTransitionError, match="already has an execution"):
        orchestrator.start(session, fixture, "another-run")


def test_identical_failure_input_has_deterministic_policy_outcome() -> None:
    failure = MigrationFailure(
        batch_id="batch-02-customers",
        kind=ExceptionKind.DUPLICATE_CUSTOMER,
        code="MB-DUPLICATE_CUSTOMER",
        summary="Duplicate",
        root_cause="Synthetic case",
        retryable=True,
        risk="MEDIUM",
        evidence=["batch:customers"],
    )
    first = ResolutionAgent().propose(failure)
    second = ResolutionAgent().propose(failure)
    assert first.model_dump(exclude={"id"}) == second.model_dump(exclude={"id"})


def test_unresolved_exception_prevents_future_validate_handoff() -> None:
    orchestrator, session, _ = _start(ExceptionKind.MISSING_REFERENCE)
    assert session.execution is not None
    assert session.execution.unresolved_blocking_failures == 1
    assert not orchestrator.can_handoff_to_validation(session)


def test_api_flow_is_owner_scoped_and_rejects_forged_internal_events() -> None:
    client = TestClient(app)
    created = client.post("/v1/migration-demo-sessions", headers=AUTH)
    assert created.status_code == 201
    session_id = created.json()["id"]
    started = client.post(
        f"/v1/migration-sessions/{session_id}/migration/start",
        headers={**AUTH, "Idempotency-Key": "api-demo-run"},
    )
    assert started.status_code == 200
    assert started.json()["status"] == "RESOLVING"
    assert (
        client.get(
            f"/v1/migration-sessions/{session_id}/migration",
            headers={"Authorization": "Bearer another-user"},
        ).status_code
        == 401
    )
    forged = client.post(
        f"/v1/migration-sessions/{session_id}/events",
        headers=AUTH,
        json={"name": "migration_completed", "attributes": {}},
    )
    assert forged.status_code == 422
