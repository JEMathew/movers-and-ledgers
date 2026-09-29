"""Real HTTP contracts with local authenticated principals; no live Firebase claim."""

import json
from uuid import UUID, uuid4

import pytest
from movebooks_api.auth import Principal, require_principal
from movebooks_api.discover_assess.repository import InMemoryMigrationSessionRepository
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.main import app
from movebooks_api.runtime.persistence import SqlSessionRepository, decode, encode, metadata
from sqlalchemy import create_engine
from test_beta_v1_integration import Journey


@pytest.fixture(params=["memory", "sqlite"])
def rejected(request, monkeypatch, tmp_path):
    url = f"sqlite:///{tmp_path / 'reconsideration.db'}"
    engine = create_engine(url)
    metadata.create_all(engine)
    repo = (
        SqlSessionRepository(engine)
        if request.param == "sqlite"
        else InMemoryMigrationSessionRepository()
    )
    monkeypatch.setattr(service, "repository", repo)
    app.dependency_overrides[require_principal] = lambda: Principal("firebase:owner-a", "")
    try:
        journey = Journey()
        journey.prepare()
        mapping = next(
            m for m in journey.get()["mappings"] if m["source_label"] == "Catalog preparation"
        )
        path = f"/mappings/{mapping['id']}"
        journey.post(path + "/reject", {"comment": "Original human rejection with evidence"})
        before = journey.get()
        payload = {
            "request_id": str(uuid4()),
            "prior_decision_id": before["human_decisions"][-1]["id"],
            "reason": "Owner now authorizes this synthetic service mapping",
            "proposed_target": "Service",
        }
        yield journey, path, payload, before, url, request.param
    finally:
        app.dependency_overrides.pop(require_principal, None)
        engine.dispose()


def review_path(path, payload):
    return path + f"/reconsiderations/{payload['request_id']}/review"


def test_final_decision_and_explicit_request_required(rejected):
    j, path, payload, before, _, _ = rejected
    j.post(path + "/approve", {}, status=409)
    j.post(review_path(path, payload), {"action": "approve"}, status=409)
    assert j.get() == before
    pending = j.post(path + "/reconsiderations", payload)
    assert pending["state"] == "REJECTED"
    assert pending["reconsiderations"][0]["state"] == "REVIEW_REQUIRED"
    j.post(path + "/approve", {}, status=409)
    assert j.get()["workflow_status"] == "AWAITING_APPROVAL"


@pytest.mark.parametrize("action", ["approve", "reject"])
def test_review_preserves_history_and_is_idempotent(rejected, action):
    j, path, payload, before, _, _ = rejected
    pending = j.post(path + "/reconsiderations", payload)
    original = next(m for m in before["mappings"] if m["id"] == pending["id"])
    snapshot = pending["reconsiderations"][0]
    assert snapshot["prior_actor"] == original["decided_by"] == "firebase:owner-a"
    assert snapshot["prior_timestamp"] == original["decided_at"]
    assert snapshot["prior_reason"] == original["decision_comment"]
    assert snapshot["prior_evidence"] == original["evidence"]
    body = {"action": action, "comment": "Separate explicit review"}
    decided = j.post(review_path(path, payload), body)
    after = j.get()
    assert after["human_decisions"][:-1] == before["human_decisions"]
    assert after["events"][: len(before["events"])] == before["events"]
    new = after["human_decisions"][-1]
    assert new["id"] != payload["prior_decision_id"]
    assert new["actor"] == "firebase:owner-a" and new["role"] == "WORKSPACE_OWNER"
    record = decided["reconsiderations"][0]
    assert record["state"] == ("APPROVED" if action == "approve" else "REJECTED")
    assert record["decision_id"] == new["id"]
    assert record["reviewed_by"] == "firebase:owner-a" and record["reviewed_at"]
    assert decided["state"] == ("APPROVED" if action == "approve" else "REJECTED")
    assert record["prior_reason"] == original["decision_comment"]
    names = [e["name"] for e in after["events"]]
    assert names.count("mapping_reconsideration_requested") == 1
    assert names.count("mapping_reconsideration_reviewed") == 1
    assert (
        names.count(f"mapping_reconsideration_{'approved' if action == 'approve' else 'rejected'}")
        == 1
    )
    assert j.post(review_path(path, payload), body) == decided
    assert j.post(path + "/reconsiderations", payload) == decided
    assert j.get() == after
    j.post(
        review_path(path, payload),
        {"action": "reject" if action == "approve" else "approve"},
        status=409,
    )
    assert j.get() == after


def test_ownership_and_actor_spoofing(rejected):
    j, path, payload, before, _, _ = rejected
    j.post(path + "/reconsiderations", {**payload, "actor": "firebase:owner-b"}, status=422)
    assert j.get() == before
    app.dependency_overrides[require_principal] = lambda: Principal("firebase:owner-b", "")
    j.post(path + "/reconsiderations", payload, status=404)
    j.post(review_path(path, payload), {"action": "approve"}, status=404)
    app.dependency_overrides[require_principal] = lambda: Principal("firebase:owner-a", "")
    assert j.get() == before
    j.post(path + "/reconsiderations", payload)
    pending = j.get()
    app.dependency_overrides[require_principal] = lambda: Principal("firebase:owner-b", "")
    j.post(review_path(path, payload), {"action": "approve"}, status=404)
    app.dependency_overrides[require_principal] = lambda: Principal("firebase:owner-a", "")
    j.post(
        review_path(path, payload), {"action": "approve", "actor": "firebase:owner-b"}, status=422
    )
    assert j.get() == pending
    app.dependency_overrides.pop(require_principal)
    for endpoint, body in [
        (path + "/reconsiderations", payload),
        (review_path(path, payload), {"action": "approve"}),
    ]:
        assert j.client.post(j.root + endpoint, json=body).status_code == 401


def test_invalid_stale_duplicate_and_pending_requests(rejected):
    j, path, payload, before, _, _ = rejected
    for changes, status in [
        ({"reason": "   "}, 422),
        ({"reason": "x" * 1001}, 422),
        ({"proposed_target": "Arbitrary account"}, 409),
        ({"prior_decision_id": str(uuid4())}, 409),
    ]:
        j.post(path + "/reconsiderations", {**payload, **changes}, status=status)
        assert j.get() == before
    result = j.post(path + "/reconsiderations", payload)
    after = j.get()
    assert j.post(path + "/reconsiderations", payload) == result
    j.post(path + "/reconsiderations", {**payload, "reason": "Changed"}, status=409)
    j.post(path + "/reconsiderations", {**payload, "request_id": str(uuid4())}, status=409)
    assert j.get() == after


def test_same_workspace_handoff_and_no_execution_rewind(rejected):
    j, path, payload, before, _, _ = rejected
    for mapping in before["mappings"]:
        if not path.endswith(mapping["id"]):
            j.post(f"/mappings/{mapping['id']}/approve", {})
    j.post(path + "/reconsiderations", payload)
    j.post("/migration/start", key="guarded-reconsideration", status=409)
    j.post(review_path(path, payload), {"action": "approve"})
    assert j.get()["id"] == before["id"] and j.get()["workflow_status"] == "APPROVED"
    j.post("/migration/start", key="guarded-reconsideration")
    executed = j.get()
    assert executed["execution"]
    j.post(path + "/reconsiderations", {**payload, "request_id": str(uuid4())}, status=409)
    assert j.get() == executed


def test_persistence_restart_and_legacy_snapshot(rejected, monkeypatch):
    j, path, payload, before, url, kind = rejected
    legacy = service.get_session("firebase:owner-a", UUID(j.id))
    data = json.loads(encode(legacy))
    for mapping in data["session"]["mappings"]:
        assert "reconsiderations" not in mapping
    assert decode(json.dumps(data), "firebase:owner-a") == legacy
    j.post(path + "/reconsiderations", payload)
    pending = j.get()
    if kind == "sqlite":
        service.repository.engine.dispose()
        engine = create_engine(url)
        monkeypatch.setattr(service, "repository", SqlSessionRepository(engine))
    assert j.get() == pending
    j.post(review_path(path, payload), {"action": "approve"})
    decided = j.get()
    if kind == "sqlite":
        service.repository.engine.dispose()
        engine = create_engine(url)
        monkeypatch.setattr(service, "repository", SqlSessionRepository(engine))
    assert j.get() == decided
    assert decided["human_decisions"][:-1] == before["human_decisions"]
    if kind == "sqlite":
        engine.dispose()


def test_stale_write_cannot_partially_append_audit(rejected, monkeypatch):
    j, path, payload, before, _, _ = rejected
    original_put = service.repository.put_if_unchanged

    def conflict(original, updated):
        raise ValueError("Session changed concurrently; refresh and review before retrying.")

    monkeypatch.setattr(service.repository, "put_if_unchanged", conflict)
    j.post(path + "/reconsiderations", payload, status=409)
    assert j.get() == before
    monkeypatch.setattr(service.repository, "put_if_unchanged", original_put)
    j.post(path + "/reconsiderations", payload)
    pending = j.get()
    monkeypatch.setattr(service.repository, "put_if_unchanged", conflict)
    j.post(review_path(path, payload), {"action": "approve"}, status=409)
    assert j.get() == pending


def test_rejected_review_can_be_reconsidered_without_losing_either_rejection(rejected):
    j, path, payload, before, _, _ = rejected
    j.post(path + "/reconsiderations", payload)
    j.post(review_path(path, payload), {"action": "reject", "comment": "Second rejection"})
    after_rejection = j.get()
    next_payload = {
        **payload,
        "request_id": str(uuid4()),
        "prior_decision_id": after_rejection["human_decisions"][-1]["id"],
    }
    j.post(path + "/reconsiderations", next_payload)
    result = j.post(review_path(path, next_payload), {"action": "approve"})
    assert result["state"] == "APPROVED"
    assert len(result["reconsiderations"]) == 2
    assert result["reconsiderations"][0]["prior_reason"] == "Original human rejection with evidence"
    assert result["reconsiderations"][1]["prior_reason"] == "Second rejection"
    after = j.get()
    assert after["human_decisions"][:-1] == after_rejection["human_decisions"]
    assert after["events"][: len(after_rejection["events"])] == after_rejection["events"]
    assert after["human_decisions"][0] == before["human_decisions"][0]


def test_reconsideration_events_cannot_be_forged(rejected):
    j, _, _, before, _, _ = rejected
    for suffix in ["requested", "reviewed", "approved", "rejected"]:
        j.post("/events", {"name": f"mapping_reconsideration_{suffix}"}, status=422)
    assert j.get() == before
