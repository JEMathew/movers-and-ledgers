"""Every stage read carries the same journey evidence for the same migration.

My Migration, Assess, Plan, Migrate, Validate and Start Using each read a different endpoint.
The shared journey projection is only consistent if those reads agree on the workflow status,
mapping review counts and readiness blockers.
"""

import pytest
from fastapi.testclient import TestClient
from movebooks_api.discover_assess.service import session_repository
from movebooks_api.main import app

AUTH = {"Authorization": "Bearer demo-user"}


@pytest.fixture(autouse=True)
def clear_sessions():
    session_repository.clear()
    yield
    session_repository.clear()


def assert_same_evidence(client: TestClient, session_id: str) -> dict:
    base = f"/v1/migration-sessions/{session_id}"
    session, trust, validation, onboarding = (
        client.get(path, headers=AUTH).json()
        for path in (
            base,
            f"{base}/intake-trust",
            f"{base}/validation-configuration",
            f"{base}/onboarding",
        )
    )
    assert {read["workflow_status"] for read in (session, trust, validation, onboarding)} == {
        session["workflow_status"]
    }
    mappings = session["mappings"]
    review = (
        {
            "total": len(mappings),
            "pending": sum(m["state"] not in {"APPROVED", "MODIFIED"} for m in mappings),
        }
        if mappings
        else None
    )
    assert trust["mapping_review"] == validation["mapping_review"] == review
    assert onboarding["mapping_review"] == review
    blockers = session["assessment"]["blocker_count"] if session["assessment"] else 0
    assert len(trust["discovery"]["findings"]) == blockers
    assert validation["readiness_blockers"] == onboarding["readiness_blockers"] == blockers
    return {"status": session["workflow_status"], "review": review, "blockers": blockers}


def created(client: TestClient, sample: str) -> str:
    response = client.post(
        "/v1/migration-sessions", headers=AUTH, json={"sample_company_id": sample}
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_fresh_and_assessed_reads_agree_including_readiness_blockers():
    with TestClient(app) as client:
        session_id = created(client, "northstar-supplies")
        assert assert_same_evidence(client, session_id) == {
            "status": "CREATED",
            "review": None,
            "blockers": 0,
        }
        client.post(f"/v1/migration-sessions/{session_id}/discovery", headers=AUTH)
        client.post(f"/v1/migration-sessions/{session_id}/assessment", headers=AUTH)
        evidence = assert_same_evidence(client, session_id)
        assert evidence["status"] == "ASSESSED"
        assert evidence["blockers"] > 0


def test_pending_and_fully_reviewed_mappings_read_the_same_everywhere():
    with TestClient(app) as client:
        session_id = created(client, "harbor-light-migrate-demo")
        base = f"/v1/migration-sessions/{session_id}"
        client.post(f"{base}/discovery", headers=AUTH)
        client.post(f"{base}/assessment", headers=AUTH)
        client.post(f"{base}/plan", headers=AUTH)
        mappings = client.post(f"{base}/mappings", headers=AUTH).json()
        pending = assert_same_evidence(client, session_id)
        assert pending["status"] == "AWAITING_APPROVAL"
        assert pending["review"]["pending"] > 0

        for mapping in mappings:
            if mapping["state"] not in {"APPROVED", "MODIFIED"}:
                response = client.post(
                    f"{base}/mappings/{mapping['id']}/approve", headers=AUTH, json={}
                )
                assert response.status_code == 200
        reviewed = assert_same_evidence(client, session_id)
        assert reviewed["status"] == "AWAITING_APPROVAL"
        assert reviewed["review"] == {"total": len(mappings), "pending": 0}


def test_later_stage_reads_keep_the_same_evidence():
    with TestClient(app) as client:
        demo = client.post("/v1/validation-demo-sessions", headers=AUTH, json={})
        assert demo.status_code == 201
        evidence = assert_same_evidence(client, demo.json()["session_id"])
        assert evidence["review"]["pending"] == 0
        onboarding = client.post(
            "/v1/onboarding-demo-sessions", headers=AUTH, json={"scenario": "clean"}
        )
        assert onboarding.status_code == 201
        later = assert_same_evidence(client, onboarding.json()["session_id"])
        assert later["review"]["pending"] == 0
