"""Executable onboarding/FPU golden cases and false-success regression boundaries."""

from copy import deepcopy

import pytest
from fastapi.testclient import TestClient
from movebooks_api.main import app
from test_validate_configure import approved, completed

from agents.orchestrator.onboard_fpu import OnboardFpuOrchestrator
from domain.onboarding_fpu.models import DecisionInput, InvoiceInput
from tools.activation.invoice import verification_checks
from tools.onboarding.checks import TASKS

AUTH = {"Authorization": "Bearer demo-user"}
INPUT = InvoiceInput(customer_id="customer-001", product_id="product-001")


def setup(fault=None, decisions=True):
    prior, session, fixture = completed()
    prior.validate(session, fixture)
    prior.configure(session, fixture)
    approved(prior, session, fixture)
    prior.apply(session, fixture)
    flow = OnboardFpuOrchestrator()
    flow.start(session, fixture, [fault] if fault else [])
    if decisions:
        for key, (_, choices) in TASKS.items():
            if choices:
                flow.decide_task(session, fixture, key, DecisionInput(action="approve"), "owner")
    return flow, session, fixture


def prepare(flow, session, fixture, approve=True):
    flow.prepare(session, fixture, INPUT, "owner")
    if approve:
        flow.decide_fpu(session, fixture, DecisionInput(action="approve"), "owner")


GOLDEN = (
    "happy_onboarding",
    "incomplete_configuration",
    "missing_role",
    "invalid_tax",
    "missing_customer",
    "missing_product",
    "invalid_mapping",
    "totals_mismatch",
    "verified_invoice",
    "remediation_retry",
    "human_approval",
    "model_unavailable",
    "checkpoint_resume",
    "deterministic_verification",
)


@pytest.mark.parametrize("case", GOLDEN)
def test_golden_onboard_fpu(case):
    prerequisites = {
        "incomplete_configuration",
        "missing_role",
        "invalid_tax",
        "missing_customer",
        "missing_product",
        "invalid_mapping",
    }
    fault = (
        case
        if case in prerequisites | {"totals_mismatch"}
        else {
            "remediation_retry": "posting_failure",
            "checkpoint_resume": "verification_interrupted",
        }.get(case)
    )
    flow, session, fixture = setup(fault, decisions=case != "human_approval")
    if case == "human_approval":
        with pytest.raises(ValueError):
            prepare(flow, session, fixture)
        assert not flow.verified(session, fixture)
        return
    if case in prerequisites:
        assert session.workflow_status == "ONBOARDING_BLOCKED"
        with pytest.raises(ValueError):
            prepare(flow, session, fixture)
        flow.remediate(session, fixture, DecisionInput(action="approve"), "owner")
    assert flow.refresh(session, fixture)
    assert len(session.onboarding.tasks) == 10
    if case == "happy_onboarding":
        assert session.workflow_status == "READY_FOR_FIRST_PRODUCTIVE_USE"
        assert not flow.verified(session, fixture)
        return
    baseline = deepcopy(session.execution.target_state)
    prepare(flow, session, fixture)
    if case == "model_unavailable":
        assert flow.onboarding_agent.active_provider == "deterministic-fallback"
    flow.execute(session, fixture, "golden-key", "owner")
    task = session.onboarding.fpu
    if case in {"totals_mismatch", "remediation_retry"}:
        assert not flow.verified(session, fixture)
        assert not session.onboarding.invoices
        flow.remediate(session, fixture, DecisionInput(action="approve"), "owner")
        flow.execute(session, fixture, "golden-key", "owner")
    if case == "checkpoint_resume":
        assert task.checkpoint == "POSTED"
        assert not flow.verified(session, fixture)
        flow.execute(session, fixture, "golden-key", "owner")
        assert task.attempts == 1
    assert flow.verified(session, fixture), task.checks
    assert task.invoice["total"] == "107.25"
    assert len(session.onboarding.invoices) == len(session.onboarding.journals) == 1
    assert session.execution.target_state == baseline
    if case == "deterministic_verification":
        assert verification_checks(session) == verification_checks(deepcopy(session))
    events = len(session.events)
    flow.execute(session, fixture, "golden-key", "owner")
    flow.finish_verification(session, fixture)
    assert len(session.events) == events


@pytest.mark.parametrize(
    "mutation",
    [
        "invoice",
        "journal",
        "approval",
        "audit",
        "mapping",
        "config",
        "verification_hash",
        "completion_event",
        "approval_role",
    ],
)
def test_completed_fpu_rechecks_evidence(mutation):
    flow, session, fixture = setup()
    prepare(flow, session, fixture)
    flow.execute(session, fixture, "key", "owner")
    task = session.onboarding.fpu
    assert flow.verified(session, fixture)
    if mutation == "invoice":
        task.invoice["total"] = "1.00"
    elif mutation == "journal":
        task.journal["entries"][0]["debit"] = "1.00"
    elif mutation == "approval":
        task.decisions[-1].actor = "other"
    elif mutation == "audit":
        session.events = [e for e in session.events if e.name != "fpu_posted"]
    elif mutation == "mapping":
        session.mappings[0].decided_by = None
    elif mutation == "verification_hash":
        task.evidence_hash = "altered"
    elif mutation == "completion_event":
        session.events = [e for e in session.events if e.name != "first_productive_use_completed"]
    elif mutation == "approval_role":
        task.decisions[-1].role = "READ_ONLY"
    else:
        session.configuration.target_settings["payment_terms"] = "NET_15"
    assert not flow.verified(session, fixture)


def test_approval_rejection_revision_retry_limit_and_key():
    flow, session, fixture = setup("posting_failure")
    prepare(flow, session, fixture, approve=False)
    flow.execute(session, fixture, "key", "owner")
    assert not session.onboarding.invoices
    flow.decide_fpu(session, fixture, DecisionInput(action="reject"), "owner")
    flow.execute(session, fixture, "key", "owner")
    assert not session.onboarding.invoices
    flow.decide_fpu(session, fixture, DecisionInput(action="approve"), "owner")
    for _ in range(4):
        flow.execute(session, fixture, "key", "owner")
    assert session.onboarding.fpu.attempts == 3
    flow.remediate(session, fixture, DecisionInput(action="approve"), "owner")
    flow.execute(session, fixture, "key", "owner")
    assert not flow.verified(session, fixture)
    with pytest.raises(ValueError):
        flow.prepare(session, fixture, INPUT, "owner")
    with pytest.raises(ValueError):
        flow.execute(session, fixture, "different-key", "owner")


def test_modified_setup_revokes_invoice_approval_and_owner_boundary():
    flow, session, fixture = setup()
    prepare(flow, session, fixture)
    with pytest.raises(ValueError):
        flow.execute(session, fixture, "key", "other")
    flow.decide_task(
        session,
        fixture,
        "bank_setup",
        DecisionInput(action="modify", selection="SANDBOX_READ_ONLY"),
        "owner",
    )
    assert session.onboarding.fpu is None
    assert len(session.onboarding.fpu_history) == 1
    flow.prepare(session, fixture, INPUT, "owner")
    assert not session.onboarding.fpu.decisions


def test_concurrent_execution_commits_only_one_receipt():
    from movebooks_api.discover_assess.service import InMemoryMigrationSessionRepository

    flow, session, fixture = setup()
    prepare(flow, session, fixture)
    repo = InMemoryMigrationSessionRepository()
    repo.put(session)
    first, second = repo.get(session.id, "owner"), repo.get(session.id, "owner")
    before_first, before_second = deepcopy(first), deepcopy(second)
    flow.execute(first, fixture, "same-key", "owner")
    flow.execute(second, fixture, "same-key", "owner")
    repo.put_if_unchanged(before_first, first)
    with pytest.raises(ValueError, match="concurrently"):
        repo.put_if_unchanged(before_second, second)
    saved = repo.get(session.id, "owner")
    count = len(saved.events)
    flow.execute(saved, fixture, "same-key", "owner")
    assert len(saved.events) == count
    assert len(saved.onboarding.invoices) == len(saved.onboarding.journals) == 1


@pytest.mark.parametrize("price", ["NaN", "Infinity", "0.001", "-1.00", "0.00", "100000.01"])
def test_invalid_invoice_money_never_prepares(price):
    flow, session, fixture = setup()
    with pytest.raises(ValueError):
        flow.prepare(session, fixture, INPUT.model_copy(update={"unit_price": price}), "owner")
    assert not session.onboarding.fpu


def test_unconfigured_and_unvalidated_handoffs_block():
    prior, session, fixture = completed()
    flow = OnboardFpuOrchestrator()
    with pytest.raises(ValueError):
        flow.start(session, fixture)
    prior.validate(session, fixture)
    prior.configure(session, fixture)
    with pytest.raises(ValueError):
        flow.start(session, fixture)


def test_versioned_api_auth_ownership_forged_events_and_end_to_end():
    client = TestClient(app)
    response = client.post("/v1/onboarding-demo-sessions", headers=AUTH, json={"scenario": "clean"})
    assert response.status_code == 201, response.text
    root = f"/v1/migration-sessions/{response.json()['session_id']}"
    assert client.get(root + "/fpu").status_code == 401
    assert client.post(root + "/fpu/verify", headers=AUTH).status_code == 409
    for event in ("fpu_verified", "first_productive_use_completed", "onboarding_completed"):
        assert client.post(root + "/events", headers=AUTH, json={"name": event}).status_code in {
            403,
            422,
        }
    for key, (_, choices) in TASKS.items():
        if choices:
            path = root + f"/onboarding/tasks/{key}/decision"
            assert (
                client.post(
                    path, headers=AUTH, json={"action": "approve", "actor": "forged"}
                ).status_code
                == 422
            )
            assert client.post(path, headers=AUTH, json={"action": "approve"}).status_code == 200
    assert client.post(root + "/fpu/task", headers=AUTH, json=INPUT.model_dump()).status_code == 200
    assert (
        client.post(root + "/fpu/decision", headers=AUTH, json={"action": "approve"}).status_code
        == 200
    )
    result = client.post(root + "/fpu/execute", headers={**AUTH, "Idempotency-Key": "api"})
    assert result.status_code == 200, result.text
    assert result.json()["verified_fpu"]
    from movebooks_api.auth import Principal, require_principal

    app.dependency_overrides[require_principal] = lambda: Principal(
        subject="other", email="o@example.test"
    )
    try:
        assert client.get(root + "/fpu", headers=AUTH).status_code == 404
    finally:
        app.dependency_overrides.clear()
