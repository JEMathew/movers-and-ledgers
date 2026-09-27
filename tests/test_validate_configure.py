"""Executable golden scenarios and adversarial governance regression checks."""

from copy import deepcopy

import pytest
from fastapi.testclient import TestClient
from movebooks_api.discover_assess.fixtures import load_sample_company
from movebooks_api.discover_assess.service import (
    DiscoverAssessService,
    InMemoryMigrationSessionRepository,
)
from movebooks_api.main import app

from agents.orchestrator import MigrateResolveOrchestrator
from agents.orchestrator.validate_configure import ValidateConfigureOrchestrator
from domain.migration_resolution.models import ResolutionDecision
from domain.validation_configuration.models import ConfigurationDecision
from tools.configuration.controls import apply_safe_configuration
from tools.validation.checks import money

AUTH = {"Authorization": "Bearer demo-user"}


def completed():
    service = DiscoverAssessService(InMemoryMigrationSessionRepository())
    session = service.create_migration_demo_session("owner")
    fixture = deepcopy(load_sample_company(session.sample_company_id))
    fixture.pop("migration_controls")
    MigrateResolveOrchestrator().start(session, fixture, "validation-golden")
    return ValidateConfigureOrchestrator(), session, fixture


def approved(orchestrator, session, fixture):
    for proposal in session.configuration.proposals:
        if proposal.state != "APPLIED":
            orchestrator.decide(
                session, fixture, proposal.id, ConfigurationDecision(action="approve"), "owner"
            )


GOLDEN_CASES = (
    "fully-reconciled",
    "record-count",
    "ar",
    "ap",
    "trial-balance",
    "references",
    "repair-revalidate",
    "safe-auto",
    "high-risk",
    "modify",
    "reject",
    "missing-evidence",
    "incomplete-handoff",
    "deterministic",
)


@pytest.mark.parametrize("case", GOLDEN_CASES)
def test_golden(case):
    orchestrator, session, fixture = completed()
    target = session.execution.target_state
    if case == "record-count":
        target["customers"].pop()
    if case in {"ar", "repair-revalidate"}:
        target["invoices"][0]["payload"]["total"] = "400.00"
    if case == "ap":
        entries = target["transactions"][1]["payload"]["entries"]
        entries[0]["debit"] = entries[1]["credit"] = "120.00"
    if case == "trial-balance":
        target["transactions"][0]["payload"]["entries"][0]["debit"] = "419.00"
    if case == "references":
        target["invoices"][0]["payload"]["customer_id"] = "missing"
    report = orchestrator.validate(session, fixture)
    if case in {"record-count", "ar", "ap", "trial-balance", "references"}:
        assert report.status == "BLOCKED"
        check_id = "count:customers" if case == "record-count" else case
        assert next(c for c in report.checks if c.id == check_id).status == "BLOCKED"
        with pytest.raises(ValueError):
            orchestrator.configure(session, fixture)
        assert not orchestrator.can_handoff(session, fixture)
        return
    if case == "repair-revalidate":
        proposal = orchestrator.propose_repair(session, fixture, "invoices", "invoice-001")
        assert session.execution.failures[-1].kind == "VALIDATION_DISCREPANCY"
        assert proposal.version == "validation-repair-v1"
        with pytest.raises(ValueError, match="revalidation-bound"):
            MigrateResolveOrchestrator().decide_resolution(
                session, proposal.id, ResolutionDecision(approve=True), "owner"
            )
        orchestrator.repair(session, fixture, proposal.id, "owner")
        assert session.validation_repairs[-1].before_payload["total"] == "400.00"
        with pytest.raises(ValueError):
            orchestrator.configure(session, fixture)
        report = orchestrator.validate(session, fixture)
    assert report.status == "VERIFIED", [c for c in report.checks if c.status != "VERIFIED"]
    if case == "deterministic":
        repeated = orchestrator.validate(session, fixture)
        assert report.checks == repeated.checks
        assert report.target_checksum == repeated.target_checksum
    plan = orchestrator.configure(session, fixture)
    inventory = next(p for p in plan.proposals if p.area == "inventory")
    assert inventory.state == "REVIEW_REQUIRED"
    assert not orchestrator.can_handoff(session, fixture)
    if case == "safe-auto":
        assert plan.target_settings == {
            "fiscal_year": "1",
            "payment_terms": "NET_30",
            "invoice_preferences": "HL-",
        }
    if case in {"high-risk", "incomplete-handoff"}:
        with pytest.raises(ValueError):
            orchestrator.apply(session, fixture)
        assert not orchestrator.can_handoff(session, fixture)
        return
    if case == "modify":
        orchestrator.decide(
            session,
            fixture,
            inventory.id,
            ConfigurationDecision(action="modify", value="FIFO"),
            "owner",
        )
        assert inventory.state == "MODIFIED" and inventory.selected_value == "FIFO"
    if case == "reject":
        orchestrator.decide(
            session, fixture, inventory.id, ConfigurationDecision(action="reject"), "owner"
        )
        with pytest.raises(ValueError):
            orchestrator.apply(session, fixture)
        assert not orchestrator.can_handoff(session, fixture)
        return
    approved(orchestrator, session, fixture)
    if case == "missing-evidence":
        inventory.evidence = []
        with pytest.raises(ValueError):
            orchestrator.apply(session, fixture)
        return
    orchestrator.apply(session, fixture)
    assert orchestrator.can_handoff(session, fixture)
    assert session.workflow_status == "CONFIGURED"
    assert session.events[-1].name == "ready_for_onboarding"
    count = len(session.events)
    orchestrator.apply(session, fixture)
    assert len(session.events) == count


@pytest.mark.parametrize("amount", [0.1, True, "NaN", "Infinity", "0.001", "1e100", None])
def test_invalid_money_fails_closed(amount):
    with pytest.raises(ValueError):
        money(amount)


@pytest.mark.parametrize(
    "mutation", ["target", "source", "mapping", "evidence", "approval", "missing-area", "settings"]
)
def test_stale_or_incomplete_handoff_fails_closed(mutation):
    orchestrator, session, fixture = completed()
    orchestrator.validate(session, fixture)
    plan = orchestrator.configure(session, fixture)
    approved(orchestrator, session, fixture)
    orchestrator.apply(session, fixture)
    if mutation == "target":
        session.execution.target_state["invoices"][0]["payload"]["total"] = "1.00"
    elif mutation == "source":
        fixture["configuration_profile"]["inventory"] = "FIFO"
    elif mutation == "mapping":
        session.mappings[0].decided_by = None
    elif mutation == "evidence":
        plan.proposals[0].evidence = []
    elif mutation == "approval":
        item = next(p for p in plan.proposals if p.area == "inventory")
        item.decided_by = None
        item.risk = "LOW"
        item.approval_required = False
    elif mutation == "missing-area":
        plan.proposals.pop()
    else:
        plan.target_settings["user_roles"] = "ADMIN"
    assert not orchestrator.can_handoff(session, fixture)


def test_application_preflight_is_atomic_and_cannot_change_currency_or_role():
    orchestrator, session, fixture = completed()
    orchestrator.validate(session, fixture)
    plan = orchestrator.configure(session, fixture)
    before = deepcopy(plan.target_settings)
    with pytest.raises(ValueError):
        apply_safe_configuration(plan)
    assert plan.target_settings == before
    for area, value in (("base_currency", "INR"), ("user_roles", "ADMIN"), ("tax_setup", "NONE")):
        proposal = next(p for p in plan.proposals if p.area == area)
        with pytest.raises(ValueError):
            orchestrator.decide(
                session,
                fixture,
                proposal.id,
                ConfigurationDecision(action="modify", value=value),
                "owner",
            )


def test_compare_and_swap_rejects_concurrent_stale_decision():
    repo = InMemoryMigrationSessionRepository()
    _, session, _ = completed()
    repo.put(session)
    first = repo.get(session.id, "owner")
    second = repo.get(session.id, "owner")
    changed = first.model_copy(deep=True)
    changed.stage = "validate"
    repo.put_if_unchanged(first, changed)
    with pytest.raises(ValueError, match="concurrently"):
        repo.put_if_unchanged(second, second)


@pytest.mark.parametrize(
    "area,value", [("base_currency", "INR"), ("fiscal_year", "4"), ("tax_setup", "NONE")]
)
def test_inconsistent_configuration_evidence_blocks_approval(area, value):
    orchestrator, session, fixture = completed()
    fixture["configuration_profile"][area] = value
    orchestrator.validate(session, fixture)
    plan = orchestrator.configure(session, fixture)
    proposal = next(p for p in plan.proposals if p.area == area)
    assert proposal.state == "BLOCKED"
    with pytest.raises(ValueError):
        orchestrator.decide(
            session, fixture, proposal.id, ConfigurationDecision(action="approve"), "owner"
        )


def test_api_revalidation_approval_ownership_and_forged_events():
    client = TestClient(app)
    response = client.post(
        "/v1/validation-demo-sessions", headers=AUTH, json={"scenario": "ar_discrepancy"}
    )
    assert response.status_code == 201, response.text
    root = f"/v1/migration-sessions/{response.json()['session_id']}"
    assert client.get(root + "/validation-configuration").status_code == 401
    assert client.post(root + "/configuration", headers=AUTH).status_code == 409
    assert client.post(root + "/validation", headers=AUTH).json()["report"]["status"] == "BLOCKED"
    response = client.post(
        root + "/validation/resolutions",
        headers=AUTH,
        json={"entity": "invoices", "record_id": "invoice-001"},
    )
    assert response.status_code == 200, response.text
    resolution = response.json()["repairs"][-1]["resolution_id"]
    assert (
        client.post(
            root + f"/validation/resolutions/{resolution}/approve", headers=AUTH
        ).status_code
        == 200
    )
    assert (
        client.post(root + "/revalidation", headers=AUTH).json()["report"]["status"] == "VERIFIED"
    )
    response = client.post(root + "/configuration", headers=AUTH)
    assert response.status_code == 200
    for proposal in response.json()["configuration"]["proposals"]:
        if proposal["state"] != "APPLIED":
            path = root + f"/configuration/{proposal['id']}"
            assert client.get(path + "/explanation", headers=AUTH).status_code == 200
            assert (
                client.post(
                    path + "/decision", headers=AUTH, json={"action": "approve", "risk": "LOW"}
                ).status_code
                == 422
            )
            assert (
                client.post(
                    path + "/decision", headers=AUTH, json={"action": "approve"}
                ).status_code
                == 200
            )
    assert client.post(root + "/configuration/apply", headers=AUTH).json()["ready_for_onboarding"]
    from movebooks_api.auth import Principal, require_principal

    app.dependency_overrides[require_principal] = lambda: Principal(
        subject="other", email="other@example.test"
    )
    try:
        assert client.get(root + "/validation", headers=AUTH).status_code == 404
    finally:
        app.dependency_overrides.clear()
    assert client.post(
        root + "/events", headers=AUTH, json={"name": "validation_verified"}
    ).status_code in {403, 422}
