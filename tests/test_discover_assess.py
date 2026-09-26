import json
from copy import deepcopy
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from movebooks_api.auth import Principal, require_principal
from movebooks_api.discover_assess.fixtures import load_northstar_supplies
from movebooks_api.discover_assess.service import session_repository
from movebooks_api.main import app

from agents.assessment import AssessmentAgent
from agents.discovery import DiscoveryAgent
from domain.discovery_assessment.models import FindingCategory

AUTH = {"Authorization": "Bearer demo-user"}
EVALS_PATH = Path(__file__).resolve().parents[1] / "evals" / "discover_assess_cases.json"


def _clean_fixture() -> dict[str, object]:
    fixture = deepcopy(load_northstar_supplies())
    datasets = fixture["datasets"]
    datasets["customers"][1]["display_name"] = "Beacon Stationery"
    datasets["vendors"][1]["display_name"] = "Harbor Freight Services"
    datasets["invoices"][1]["customer_id"] = "customer-003"
    datasets["configuration"][2]["value"] = "weighted_average"
    return fixture


def _fixture_variant(variant: str) -> dict[str, object]:
    if variant == "fixture_as_published":
        return deepcopy(load_northstar_supplies())
    fixture = _clean_fixture()
    datasets = fixture["datasets"]
    if variant == "clean":
        return fixture
    if variant == "duplicates_only":
        datasets["customers"][1]["display_name"] = "Northstar Retail Private Limited"
    elif variant == "required_dataset_missing":
        del datasets["vendors"]
    elif variant == "critical_reference":
        datasets["invoices"][1]["customer_id"] = "customer-missing"
    elif variant == "unsupported_configuration":
        datasets["configuration"][2]["value"] = "moving_average_custom"
    else:
        raise AssertionError(f"Unknown golden variant: {variant}")
    return fixture


def _evaluate(fixture: dict[str, object]) -> tuple[dict[str, object], dict[str, object]]:
    session_id = uuid4()
    discovery, _ = DiscoveryAgent().run(session_id, fixture)
    assessment, _ = AssessmentAgent().run(session_id, discovery)
    return discovery.model_dump(mode="json"), assessment.model_dump(mode="json")


def test_published_fixture_exposes_expected_evidence() -> None:
    discovery, assessment = _evaluate(deepcopy(load_northstar_supplies()))
    assert discovery["company_name"] == "Northstar Supplies"
    assert assessment["readiness"] == "BLOCKED"
    assert assessment["score"] is None
    assert set(discovery["tools_called"]) == {
        "profile_dataset",
        "validate_schema",
        "detect_duplicates",
        "validate_referential_integrity",
        "validate_configuration",
    }


@pytest.mark.parametrize(
    "case",
    json.loads(EVALS_PATH.read_text())["cases"],
    ids=lambda case: case["id"],
)
def test_discover_assess_golden_cases(case: dict[str, object]) -> None:
    fixture = _fixture_variant(str(case["variant"]))
    runs = [_evaluate(fixture) for _ in range(int(case.get("repeat", 1)))]
    first_discovery, first_assessment = runs[0]
    rules = {finding["rule_code"] for finding in first_discovery["findings"]}

    assert first_assessment["readiness"] == case["expected_readiness"]
    assert first_assessment["blocker_count"] == case["expected_blockers"]
    assert first_assessment["warning_count"] == case["expected_warnings"]
    assert set(case["required_rules"]).issubset(rules)
    assert all(finding["evidence"] for finding in first_discovery["findings"])
    assert all(finding["provenance"] == "DETERMINISTIC" for finding in first_discovery["findings"])
    assert all(run == runs[0] for run in runs)


def test_info_findings_are_not_readiness_defects() -> None:
    discovery, assessment = _evaluate(_clean_fixture())
    info_count = sum(
        finding["category"] == FindingCategory.INFO.value for finding in discovery["findings"]
    )
    assert info_count == 7
    assert assessment["readiness"] == "READY"


@pytest.fixture(autouse=True)
def clear_sessions() -> None:
    session_repository.clear()
    yield
    app.dependency_overrides.clear()


def test_versioned_api_runs_owner_scoped_discovery_and_assessment() -> None:
    client = TestClient(app)
    created = client.post(
        "/v1/migration-sessions",
        headers=AUTH,
        json={"sample_company_id": "northstar-supplies"},
    )
    assert created.status_code == 201
    session_id = created.json()["id"]

    discovery = client.post(f"/v1/migration-sessions/{session_id}/discovery", headers=AUTH)
    assessment = client.post(f"/v1/migration-sessions/{session_id}/assessment", headers=AUTH)
    activity = client.get(f"/v1/migration-sessions/{session_id}/activity", headers=AUTH)

    assert discovery.status_code == 200
    assert assessment.json()["readiness"] == "BLOCKED"
    assert len(activity.json()) == 19
    assert all("evidence_references" in item for item in activity.json())

    async def other_owner() -> Principal:
        return Principal(subject="other-user", email="other@example.com")

    app.dependency_overrides[require_principal] = other_owner
    assert client.get(f"/v1/migration-sessions/{session_id}", headers=AUTH).status_code == 404


def test_api_requires_discovery_before_assessment() -> None:
    client = TestClient(app)
    created = client.post(
        "/v1/migration-sessions",
        headers=AUTH,
        json={"sample_company_id": "northstar-supplies"},
    )
    response = client.post(
        f"/v1/migration-sessions/{created.json()['id']}/assessment", headers=AUTH
    )
    assert response.status_code == 409


def test_client_cannot_forge_internal_lifecycle_events() -> None:
    client = TestClient(app)
    created = client.post(
        "/v1/migration-sessions",
        headers=AUTH,
        json={"sample_company_id": "northstar-supplies"},
    )
    session_id = created.json()["id"]
    response = client.post(
        f"/v1/migration-sessions/{session_id}/events",
        headers=AUTH,
        json={"name": "assessment_completed", "attributes": {}},
    )
    assert response.status_code == 422
