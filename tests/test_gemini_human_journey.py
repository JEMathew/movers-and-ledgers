"""Real local HTTP journey, deterministic providers, no remote identity/model calls."""

from uuid import uuid4

import pytest
from movebooks_api import analysis
from movebooks_api.settings import Settings
from test_beta_v1_integration import Journey, service
from test_live_reasoning import InMemoryMigrationSessionRepository


@pytest.mark.parametrize("action", ["approve", "reject"])
def test_pair_then_explicit_human_decision_replay_does_not_duplicate_audit(monkeypatch, action):
    monkeypatch.setattr(service, "repository", InMemoryMigrationSessionRepository())
    config = Settings(
        _env_file=None,
        synthetic_analysis_enabled=True,
        model_provider_mode="deterministic-only",
        synthetic_beta_authorized=False,
    )
    monkeypatch.setattr(analysis, "get_settings", lambda: config)
    j = Journey()
    j.prepare()
    before = j.get()
    mapping = next(m for m in before["mappings"] if m["source_id"] == "account-clearing")
    result = j.post(
        f"/analysis/mapping/{mapping['id']}",
        {
            "confirmed": True,
            "request_id": str(uuid4()),
        },
    )
    assert result["advisor"]["model_calls"] == result["reviewer"]["model_calls"] == 0
    assert result["advisor"]["state"] == result["reviewer"]["state"] == "FALLBACK"
    assert j.get()["human_decisions"] == before["human_decisions"]
    assert j.get()["mappings"] == before["mappings"]
    route = f"/mappings/{mapping['id']}/{action}"
    j.post(route, {"comment": "Synthetic owner decision; not an AI approval"})
    after = j.get()
    assert len(after["human_decisions"]) == len(before["human_decisions"]) + 1
    assert after["human_decisions"][-1]["actor"] == "demo-user"
    assert after["execution"] is None
    j.post(route, {"comment": "Duplicate transport replay"}, status=409)
    assert j.get() == after
