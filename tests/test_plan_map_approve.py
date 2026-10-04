import json
from copy import deepcopy
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from movebooks_api.discover_assess.fixtures import load_northstar_supplies
from movebooks_api.discover_assess.service import session_repository
from movebooks_api.main import app

from agents.assessment import AssessmentAgent
from agents.discovery import DiscoveryAgent
from agents.mapping import MappingAgent
from agents.mapping.provider import DeterministicMappingRecommendationProvider
from agents.orchestrator import PlanMapApproveOrchestrator, WorkflowTransitionError
from agents.planning import PlanningAgent
from domain.planning_mapping.models import (
    MappingArea,
    MappingDecision,
    MappingProposal,
    MappingRisk,
    MappingState,
    WorkflowStatus,
)
from domain.planning_mapping.policy import MAPPING_POLICY_VERSION
from tools.mapping import (
    MappingPolicyError,
    apply_mapping_decision,
    enforce_approval_policy,
    mapping_ready_for_handoff,
    validate_mapping_compatibility,
)
from tools.planning import validate_migration_plan

AUTH = {"Authorization": "Bearer demo-user"}
EVALS_PATH = Path(__file__).resolve().parents[1] / "evals" / "plan_map_approve_cases.json"


def _assessed_fixture() -> tuple[dict[str, object], object, object]:
    fixture = deepcopy(load_northstar_supplies())
    discovery, _ = DiscoveryAgent().run(uuid4(), fixture)
    assessment, _ = AssessmentAgent().run(uuid4(), discovery)
    return fixture, discovery, assessment


def _clean_fixture() -> dict[str, object]:
    fixture = deepcopy(load_northstar_supplies())
    datasets = fixture["datasets"]
    datasets["customers"][1]["display_name"] = "Beacon Stationery"
    datasets["vendors"][1]["display_name"] = "Harbor Freight Services"
    datasets["invoices"][1]["customer_id"] = "customer-003"
    datasets["configuration"][2]["value"] = "weighted_average"
    return fixture


def _proposal(
    *,
    area: MappingArea = MappingArea.CUSTOMERS,
    selected_target: str = "Customer",
    evidence: list[str] | None = None,
    confidence: float = 0.98,
    risk: MappingRisk = MappingRisk.LOW,
) -> MappingProposal:
    return MappingProposal(
        version=MAPPING_POLICY_VERSION,
        area=area,
        source_id="source-001",
        source_label="Source record",
        recommended_target=selected_target,
        selected_target=selected_target,
        confidence=confidence,
        risk=risk,
        evidence=evidence if evidence is not None else ["evidence:source-001"],
        rationale="Versioned synthetic mapping rationale.",
        alternatives=["Vendor", "Other Current Asset"],
        specialist="test_specialist",
    )


def _source_for(area: MappingArea) -> dict[str, object]:
    if area is MappingArea.CHART_OF_ACCOUNTS:
        return {"id": "source-001", "code": "1200", "name": "Clearing", "account_type": "asset"}
    if area is MappingArea.GENERAL_CONFIGURATION:
        return {"id": "source-001", "key": "inventory_valuation_method", "value": "fifo"}
    return {"id": "source-001", "display_name": "Source record"}


def _controlled(proposal: MappingProposal, source: dict[str, object]) -> MappingProposal:
    return enforce_approval_policy(proposal, validate_mapping_compatibility(proposal, source))


@pytest.fixture(autouse=True)
def clear_sessions() -> None:
    session_repository.clear()
    yield
    app.dependency_overrides.clear()


def test_planning_agent_builds_all_phases_with_valid_dependencies() -> None:
    _, discovery, assessment = _assessed_fixture()
    plan, activity = PlanningAgent().run(uuid4(), assessment, discovery)
    assert [phase.id for phase in plan.phases] == [
        "resolve-prerequisites",
        "review-mappings",
        "prepare-migration",
        "execute-migration",
        "validate",
        "configure",
        "onboard",
    ]
    assert validate_migration_plan(plan) == []
    assert plan.relative_complexity == "High"
    assert activity.human_approval_required is True


def test_mapping_agent_uses_all_required_areas_and_specialists() -> None:
    fixture, discovery, _ = _assessed_fixture()
    proposals, activity = MappingAgent().run(
        uuid4(), fixture, [item.id for item in discovery.evidence]
    )
    assert {proposal.area for proposal in proposals} == set(MappingArea)
    assert {proposal.specialist for proposal in proposals} == {
        "account_mapping_specialist",
        "tax_mapping_specialist",
        "entity_mapping_specialist",
        "configuration_mapping_specialist",
    }
    assert all(proposal.state is not MappingState.PROPOSED for proposal in proposals)
    assert all(proposal.evidence for proposal in proposals)
    assert any(item.agent == "mapping_agent" for item in activity)


def test_orchestrator_stops_out_of_order_and_blocks_handoff_with_open_findings() -> None:
    client = TestClient(app)
    created = client.post(
        "/v1/migration-sessions",
        headers=AUTH,
        json={"sample_company_id": "northstar-supplies"},
    )
    session_id = created.json()["id"]
    assert client.post(f"/v1/migration-sessions/{session_id}/plan", headers=AUTH).status_code == 409

    discovery = client.post(f"/v1/migration-sessions/{session_id}/discovery", headers=AUTH)
    assessment = client.post(f"/v1/migration-sessions/{session_id}/assessment", headers=AUTH)
    assert discovery.status_code == 200
    assert assessment.status_code == 200
    plan = client.post(f"/v1/migration-sessions/{session_id}/plan", headers=AUTH)
    mappings = client.post(f"/v1/migration-sessions/{session_id}/mappings", headers=AUTH)

    assert plan.status_code == 200
    assert len(plan.json()["phases"]) == 7
    assert mappings.status_code == 200
    assert {item["area"] for item in mappings.json()} == {area.value for area in MappingArea}

    for item in mappings.json():
        response = client.post(
            f"/v1/migration-sessions/{session_id}/mappings/{item['id']}/approve",
            headers=AUTH,
            json={"comment": "Approved in synthetic evaluation"},
        )
        assert response.status_code == (409 if item["state"] == "BLOCKED" else 200)

    session = client.get(f"/v1/migration-sessions/{session_id}", headers=AUTH).json()
    assert session["workflow_status"] == "AWAITING_APPROVAL"
    assert session["stage"] == "map_approve"
    assert not any(event["name"] == "ready_for_migration" for event in session["events"])


def test_clean_plan_and_complete_approvals_reach_approved_handoff() -> None:
    from domain.discovery_assessment.models import MigrationSession

    fixture = _clean_fixture()
    discovery, _ = DiscoveryAgent().run(uuid4(), fixture)
    assessment, _ = AssessmentAgent().run(uuid4(), discovery)
    session = MigrationSession(
        owner_subject="owner",
        sample_company_id="northstar-supplies",
        company_name="Northstar Supplies",
        discovery=discovery,
        assessment=assessment,
        workflow_status=WorkflowStatus.ASSESSED,
    )
    orchestrator = PlanMapApproveOrchestrator()
    session = orchestrator.create_mappings(orchestrator.create_plan(session), fixture)
    for proposal in list(session.mappings):
        datasets = fixture["datasets"]
        dataset_key = {
            MappingArea.CHART_OF_ACCOUNTS: "accounts",
            MappingArea.CUSTOMERS: "customers",
            MappingArea.VENDORS: "vendors",
            MappingArea.PRODUCTS_SERVICES: "products",
            MappingArea.TAX_CONFIGURATION: "taxes",
            MappingArea.GENERAL_CONFIGURATION: "configuration",
        }[proposal.area]
        source = next(
            row
            for row in datasets[dataset_key]
            if str(row.get("id") or row.get("key")) == proposal.source_id
        )
        session = orchestrator.decide_mapping(
            session,
            proposal.id,
            MappingDecision(decision=MappingState.APPROVED),
            "owner",
            source,
        )
    assert session.workflow_status is WorkflowStatus.AWAITING_APPROVAL
    session = orchestrator.approve_plan(session, "owner", session.plan.id)
    assert session.workflow_status is WorkflowStatus.APPROVED
    assert any(event.name.value == "ready_for_migration" for event in session.events)


def test_internal_mapping_events_cannot_be_forged_by_browser() -> None:
    client = TestClient(app)
    created = client.post(
        "/v1/migration-sessions",
        headers=AUTH,
        json={"sample_company_id": "northstar-supplies"},
    )
    response = client.post(
        f"/v1/migration-sessions/{created.json()['id']}/events",
        headers=AUTH,
        json={"name": "ready_for_migration", "attributes": {}},
    )
    assert response.status_code == 422


def test_api_exposes_plan_status_evidence_and_governed_decisions() -> None:
    client = TestClient(app)
    created = client.post(
        "/v1/migration-sessions",
        headers=AUTH,
        json={"sample_company_id": "northstar-supplies"},
    )
    session_id = created.json()["id"]
    client.post(f"/v1/migration-sessions/{session_id}/discovery", headers=AUTH)
    client.post(f"/v1/migration-sessions/{session_id}/assessment", headers=AUTH)
    client.post(f"/v1/migration-sessions/{session_id}/plan", headers=AUTH)
    mappings = client.post(
        f"/v1/migration-sessions/{session_id}/mappings", headers=AUTH
    ).json()

    plan_status = client.get(
        f"/v1/migration-sessions/{session_id}/plan/status", headers=AUTH
    )
    assert plan_status.json() == {
        "status": "READY_FOR_MAPPING",
        "version": "migration-plan-v1",
        "phase_count": 7,
    }

    customer = next(item for item in mappings if item["area"] == "customers")
    evidence = client.get(
        f"/v1/migration-sessions/{session_id}/mappings/{customer['id']}/evidence",
        headers=AUTH,
    )
    assert evidence.status_code == 200
    assert evidence.json()
    rejected = client.post(
        f"/v1/migration-sessions/{session_id}/mappings/{customer['id']}/reject",
        headers=AUTH,
        json={"comment": "Needs customer review"},
    )
    assert rejected.status_code == 200
    assert rejected.json()["state"] == "REJECTED"

    configuration = next(
        item
        for item in mappings
        if item["area"] == "general_configuration" and item["source_id"] == "configuration-001"
    )
    modified = client.post(
        f"/v1/migration-sessions/{session_id}/mappings/{configuration['id']}/modify",
        headers=AUTH,
        json={"selected_target": "EUR", "comment": "Use target-company currency"},
    )
    assert modified.status_code == 200
    assert modified.json()["state"] == "MODIFIED"
    assert modified.json()["decided_by"] == "demo-user"


@pytest.mark.parametrize(
    "case",
    json.loads(EVALS_PATH.read_text())["cases"],
    ids=lambda case: case["id"],
)
def test_plan_map_approve_golden_cases(case: dict[str, str]) -> None:
    kind = case["kind"]
    variant = case["variant"]
    expected = case["expected"]
    provider = DeterministicMappingRecommendationProvider()

    if kind == "mapping":
        if variant == "customer":
            area = MappingArea.CUSTOMERS
            record = {"id": "customer-001", "display_name": "Acme"}
        elif variant == "ambiguous_account":
            area = MappingArea.CHART_OF_ACCOUNTS
            record = {
                "id": "account-001",
                "code": "1200",
                "name": "Misc Clearing",
                "account_type": "asset",
            }
        else:
            area = MappingArea.TAX_CONFIGURATION
            record = {"id": "tax-001", "code": "CA", "rate": "0.07", "jurisdiction": "California"}
        recommendation = provider.recommend(area, record)
        proposal = _proposal(
            area=area,
            selected_target=str(recommendation["target"]),
            confidence=float(recommendation["confidence"]),
            risk=recommendation["risk"],
        )
        assert _controlled(proposal, record).state.value == expected
        return

    if kind == "control":
        if variant == "missing_evidence":
            area = MappingArea.CUSTOMERS
            record = _source_for(area)
            proposal = _proposal(area=area, evidence=[])
        elif variant == "unsafe_account":
            area = MappingArea.CHART_OF_ACCOUNTS
            record = _source_for(area)
            proposal = _proposal(area=area, selected_target="Sales Income")
        else:
            area = MappingArea.GENERAL_CONFIGURATION
            record = _source_for(area)
            proposal = _proposal(area=area, selected_target="Unsupported target configuration")
        assert _controlled(proposal, record).state.value == expected
        return

    if kind == "decision":
        area = MappingArea.GENERAL_CONFIGURATION if variant == "modify" else MappingArea.CUSTOMERS
        record = _source_for(area)
        target = "FIFO" if variant == "modify" else "Customer"
        controlled = _controlled(_proposal(area=area, selected_target=target), record)
        decision_state = {
            "approve": MappingState.APPROVED,
            "reject": MappingState.REJECTED,
            "modify": MappingState.MODIFIED,
        }[variant]
        decision = MappingDecision(
            decision=decision_state,
            selected_target="Weighted Average" if variant == "modify" else None,
        )
        assert apply_mapping_decision(controlled, decision, "owner", record).state.value == expected
        return

    if kind == "repeatability":
        area = MappingArea.CUSTOMERS
        record = _source_for(area)
        outcomes = [
            _controlled(_proposal(area=area), record).model_dump(exclude={"id"})
            for _ in range(2)
        ]
        assert outcomes[0] == outcomes[1]
        assert outcomes[0]["state"] == expected
        return

    if kind == "plan":
        _, discovery, assessment = _assessed_fixture()
        plan, _ = PlanningAgent().run(uuid4(), assessment, discovery)
        assert ("VALID" if not validate_migration_plan(plan) else "INVALID") == expected
        return

    pending = _controlled(_proposal(), _source_for(MappingArea.CUSTOMERS))
    approved = pending.model_copy(update={"state": MappingState.APPROVED})
    assert ("READY" if mapping_ready_for_handoff([approved, pending]) else "STOPPED") == expected


def test_decisions_are_final_and_cannot_be_self_overridden() -> None:
    record = _source_for(MappingArea.CUSTOMERS)
    controlled = _controlled(_proposal(), record)
    approved = apply_mapping_decision(
        controlled, MappingDecision(decision=MappingState.APPROVED), "owner", record
    )
    with pytest.raises(MappingPolicyError, match="final decision"):
        apply_mapping_decision(
            approved, MappingDecision(decision=MappingState.REJECTED), "owner", record
        )


def test_modify_cannot_bypass_canonical_entity_target_policy() -> None:
    record = _source_for(MappingArea.CUSTOMERS)
    controlled = _controlled(_proposal(), record)
    with pytest.raises(MappingPolicyError, match="not a canonical customers target"):
        apply_mapping_decision(
            controlled,
            MappingDecision(decision=MappingState.MODIFIED, selected_target="Arbitrary class"),
            "owner",
            record,
        )


def test_supported_targets_only_offer_destinations_a_decision_accepts() -> None:
    from agents.mapping.specialists import records_for_area

    fixture = _clean_fixture()
    proposals, _ = MappingAgent().run(uuid4(), fixture, ["evidence:test"])
    records = {
        (area, str(record["id"])): record
        for area in MappingArea
        for record in records_for_area(fixture, area)
    }
    tax = [p for p in proposals if p.area is MappingArea.TAX_CONFIGURATION]
    assert tax
    for proposal in tax:
        # The specialist alternative stays visible as context but is not a selectable target.
        assert "Manual tax specialist review" in proposal.alternatives
        assert proposal.supported_targets == [proposal.recommended_target]
    for proposal in proposals:
        record = records[(proposal.area, proposal.source_id)]
        for target in proposal.supported_targets:
            decided = apply_mapping_decision(
                proposal,
                MappingDecision(decision=MappingState.MODIFIED, selected_target=target),
                "owner",
                record,
            )
            assert decided.state is MappingState.MODIFIED
        rejected = set(proposal.alternatives) - set(proposal.supported_targets)
        for target in rejected:
            with pytest.raises(MappingPolicyError):
                apply_mapping_decision(
                    proposal,
                    MappingDecision(decision=MappingState.MODIFIED, selected_target=target),
                    "owner",
                    record,
                )


def test_missing_required_entity_field_blocks_mapping() -> None:
    record = {"id": "vendor-001", "display_name": ""}
    controlled = _controlled(
        _proposal(area=MappingArea.VENDORS, selected_target="Vendor"), record
    )
    assert controlled.state is MappingState.BLOCKED
    assert any("display_name" in reason for reason in controlled.policy_reasons)


def test_orchestrator_requires_assessed_state() -> None:
    fixture, discovery, assessment = _assessed_fixture()
    del fixture
    from domain.discovery_assessment.models import MigrationSession

    session = MigrationSession(
        owner_subject="owner",
        sample_company_id="northstar-supplies",
        company_name="Northstar Supplies",
        discovery=discovery,
        assessment=assessment,
    )
    with pytest.raises(WorkflowTransitionError, match="ASSESSED"):
        PlanMapApproveOrchestrator().create_plan(session)


def test_orchestrator_package_preserves_existing_and_new_public_exports() -> None:
    from agents.orchestrator import __all__ as public_exports

    assert {
        "ApprovalDecision",
        "ApprovalRequest",
        "MigrationWorkflow",
        "PlanMapApproveOrchestrator",
        "WorkflowTransitionError",
    }.issubset(public_exports)


def test_mapping_evidence_is_owner_scoped_through_session_access() -> None:
    client = TestClient(app)
    created = client.post(
        "/v1/migration-sessions",
        headers=AUTH,
        json={"sample_company_id": "northstar-supplies"},
    )
    session_id = created.json()["id"]
    assert client.get(
        f"/v1/migration-sessions/{session_id}/mappings/{UUID(int=0)}/evidence",
        headers={"Authorization": "Bearer invalid"},
    ).status_code == 401
