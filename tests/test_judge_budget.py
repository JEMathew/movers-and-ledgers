"""Accepted budget decisions and application wiring; no cloud/model access."""

import asyncio
from copy import deepcopy
from datetime import UTC, datetime, timedelta

import pytest
from movebooks_api.runtime.judge_budget import (
    APPROVAL_SHA,
    CAMPAIGN_ID,
    FIXTURE_SHA,
    LIMITS,
    PROOFS,
    JudgeAuthority,
    decide,
)
from movebooks_api.runtime.model_controls import ControlDenied
from movebooks_api.settings import Settings

NOW = datetime(2026, 10, 21, tzinfo=UTC)
REVISION = "judge-offline-revision"
SCOPE = {"owner_hash": "a" * 64, "workspace_hash": "b" * 64, "mapping_hash": "c" * 64}
POLICY = {"enabled": True, "synthetic_beta_authorized": True}


def campaign():
    # Mock native proof only. Never serialize this fixture to an actual cloud database.
    return {
        "campaign_id": CAMPAIGN_ID,
        "owner_acceptance_sha256": APPROVAL_SHA,
        "state": "APPROVED",
        "revision": REVISION,
        "model": "gemini-3.5-flash-lite",
        "location": "global",
        "thinking": "LOW",
        "max_input_tokens": 50000,
        "max_output_tokens": 2048,
        **LIMITS,
        **{p: True for p in PROOFS},
        "preflight_evidence_sha256": "d" * 64,
        "start_utc": NOW,
        "end_utc": NOW + timedelta(days=7),
        "analyses": 0,
        "reserved_microusd": 0,
        "active_claims": [],
    }


def eligibility(scope=SCOPE):
    return {
        "campaign_id": CAMPAIGN_ID,
        "active": True,
        "approved_synthetic_identity": True,
        "synthetic_workspace_verified": True,
        "owner_hash": scope["owner_hash"],
        "workspace_hash": scope["workspace_hash"],
        "fixture_sha256": FIXTURE_SHA,
        "provenance_sha256": "e" * 64,
    }


class MemoryJudge(JudgeAuthority):
    """Decision adapter double. Real concurrency/restart is tested with the emulator."""

    def __init__(self):
        self.c = campaign()
        self.policy = deepcopy(POLICY)
        self.scope = deepcopy(SCOPE)
        self.eligibility = eligibility()
        self.r, self.o, self.w = None, None, None
        self.nonce, self.key = "f" * 64, "1" * 64
        self.basis = None
        self.now = NOW

    async def change(self, event, details=None):
        self.c, self.r, self.o, self.w = decide(
            self.c,
            self.policy,
            self.eligibility,
            self.r,
            self.o,
            self.w,
            scope=self.scope,
            revision=REVISION,
            key=self.key,
            nonce=self.nonce,
            basis=self.basis,
            now=self.now,
            event=event,
            details=details,
        )
        return self.r

    @property
    def document(self):
        return self.r


def memory():
    a = MemoryJudge()
    a.bind_context("2" * 64)
    return a


def run(a, event, details=None):
    return asyncio.run(a.change(event, details))


@pytest.mark.parametrize("field", ["owner_acceptance_sha256", "revision", *PROOFS])
def test_missing_acceptance_or_proof_fails_closed(field):
    a = memory()
    a.c.pop(field)
    with pytest.raises(ControlDenied):
        run(a, "claim")
    assert a.r is None and a.c["analyses"] == 0


@pytest.mark.parametrize(
    "field",
    [
        "active",
        "approved_synthetic_identity",
        "synthetic_workspace_verified",
        "fixture_sha256",
        "owner_hash",
        "workspace_hash",
        "provenance_sha256",
    ],
)
def test_unknown_or_wrong_identity_provenance_fails_closed(field):
    a = memory()
    a.eligibility.pop(field)
    with pytest.raises(ControlDenied):
        run(a, "claim")


@pytest.mark.parametrize(
    "field,value",
    [
        ("analyses", True),
        ("analyses", -1),
        ("reserved_microusd", 1),
        ("active_claims", ["bad"]),
        ("owner_daily", 50),
        ("budget_microusd", 6000000),
    ],
)
def test_corrupt_or_expanded_budget_denied(field, value):
    a = memory()
    a.c[field] = value
    with pytest.raises(ControlDenied):
        run(a, "claim")


@pytest.mark.parametrize("day", [-1, 7, 8])
def test_window_never_renews(day):
    a = memory()
    a.now += timedelta(days=day)
    with pytest.raises(ControlDenied, match="window"):
        run(a, "claim")


def test_reserve_entire_pair_then_no_refund_on_known_failure():
    a = memory()
    run(a, "claim")
    assert a.c["reserved_microusd"] == 80480 and a.o == a.w == {"analyses": 1}
    run(a, "halt")
    run(a, "halt")
    assert not a.c["active_claims"] and a.c["reserved_microusd"] == 80480
    with pytest.raises(ControlDenied):
        run(a, "claim")


def test_daily_and_lifetime_limits_independent():
    for target, count in (("o", 5), ("w", 10)):
        a = memory()
        setattr(a, target, {"analyses": count})
        with pytest.raises(ControlDenied, match="daily_limit"):
            run(a, "claim")
    a = memory()
    a.c.update(analyses=62, reserved_microusd=4_989_760)
    a.now += timedelta(days=1)  # Empty new-day counts cannot reset campaign spend.
    with pytest.raises(ControlDenied, match="campaign_budget"):
        run(a, "claim")


@pytest.mark.parametrize("value", [{}, {"analyses": True}, {"analyses": -1}])
def test_corrupt_daily_counter_never_treated_as_absent(value):
    a = memory()
    a.o = value
    with pytest.raises(ControlDenied, match="daily_corrupt"):
        run(a, "claim")


def test_four_attempts_roles_completion_and_no_replay():
    a = memory()
    run(a, "claim")
    for n, role in enumerate(("advisor", "advisor", "reviewer", "reviewer"), 1):
        if n == 3:
            run(a, "advisor_complete")
        run(a, "reserve", (role, 50000, "3" * 64))
        run(a, "response", (n, {"usage": {}, "billable_cost_status": "UNVERIFIED"}))
    with pytest.raises(ControlDenied):
        run(a, "reserve", ("reviewer", 1, "3" * 64))
    run(a, "complete")
    assert a.r["calls"] == 4 and a.r["state"] == "COMPLETED"
    assert a.c["reserved_microusd"] == 80480 and a.c["active_claims"] == []
    with pytest.raises(ControlDenied):
        run(a, "claim")


def test_kill_or_expiry_blocks_dispatch_but_allows_terminal_accounting():
    for kill in (True, False):
        a = memory()
        run(a, "claim")
        run(a, "reserve", ("advisor", 1, "3" * 64))
        if kill:
            a.policy["enabled"] = False
        else:
            a.now += timedelta(days=7)
        run(a, "response", (1, {}))
        with pytest.raises(ControlDenied):
            run(a, "reserve", ("advisor", 1, "3" * 64))
        run(a, "halt")
        assert a.c["active_claims"] == [] and a.c["reserved_microusd"] == 80480


def test_ambiguous_dispatch_holds_slot_and_restart_cannot_resume():
    a = memory()
    run(a, "claim")
    run(a, "reserve", ("advisor", 1, "3" * 64))
    run(a, "halt")
    assert a.c["active_claims"] == [a.key]
    a.nonce = "4" * 64
    with pytest.raises(ControlDenied):
        run(a, "reserve", ("advisor", 1, "3" * 64))


def test_defaults_disabled_and_unsafe_enablement_invalid():
    assert Settings().judge_campaign_enabled is False
    with pytest.raises(ValueError):
        Settings(judge_campaign_enabled=True)


def test_exact_accepted_settings_validate_without_client_or_credentials():
    from test_google_runtime import CLOUD

    from domain.reasoning.models import Capability

    values = {
        **CLOUD,
        "google_project": "movebooks-ai",
        "reasoning_project": "movebooks-ai",
        "reasoning_location": "global",
        "model_provider_mode": "gemini-adk",
        "reasoning_models": {c.value: "gemini-3.5-flash-lite" for c in Capability},
        "synthetic_analysis_enabled": True,
        "synthetic_beta_authorized": True,
        "model_controls_backend": "firestore",
        "judge_campaign_enabled": True,
        "reasoning_reservation_microusd": 40240,
    }
    assert Settings(**values).judge_campaign_enabled
    for change in (
        {"reasoning_reservation_microusd": 1},
        {"model_controls_backend": "disabled"},
        {"reasoning_global_daily_microusd": 5000000},
        {"synthetic_beta_authorized": False},
    ):
        with pytest.raises(ValueError):
            Settings(**{**values, **change})


@pytest.mark.parametrize("bad_count", [False, True])
def test_actual_pair_judge_authority_no_financial_mutation(monkeypatch, bad_count):
    from uuid import uuid4

    import movebooks_api.analysis as app
    from test_assisted_analysis import Reviewer, business, settings, setup
    from test_gemini_evaluation_guards import wire
    from test_hosted_evaluation import install
    from test_live_reasoning import GoodProvider

    from agents.reasoning.transport import CountedTransport

    repo, session, mapping = setup()
    a = MemoryJudge()
    guard = CountedTransport(a)
    monkeypatch.setattr(app, "new_judge_guard", lambda *args: guard)

    async def daily(*args):
        assert guard.prepared and a.c["reserved_microusd"] == 80480

    async def finish(*args):
        return True

    for module in ("movebooks_api.reasoning", "movebooks_api.reviewer"):
        monkeypatch.setattr(module + ".reserve_live", daily)
        monkeypatch.setattr(module + ".finish_live", finish)

    class Advisor(GoodProvider):
        async def generate(self, context, model):
            api, _ = install(guard, tokens=50001 if bad_count else 10)
            await api._async_request(wire())
            return await super().generate(context, model)

    class Review(Reviewer):
        async def generate(self, context, model):
            api, _ = install(guard, "reviewer", tokens=10)
            await api._async_request(wire())
            return await super().generate(context, model)

    config = settings().model_copy(update={"env": "cloud-dev", "judge_campaign_enabled": True})
    request = app.AnalysisRequest(request_id=uuid4(), confirmed=True)
    result = asyncio.run(
        app.request_analysis(
            repo, "owner", session.id, mapping.id, request, config, Advisor(), Review()
        )
    )
    assert business(repo.get(session.id, "owner")) == business(session)
    assert result.human_approval_required and not result.financial_authority
    assert a.r["calls"] == (0 if bad_count else 2)
    assert a.r["state"] == ("HALTED" if bad_count else "COMPLETED")
    assert not a.c["active_claims"]
    if not bad_count:
        # Existing cached result is returned under a fresh, unclaimed authority.
        fresh = MemoryJudge()
        monkeypatch.setattr(app, "new_judge_guard", lambda *args: CountedTransport(fresh))
        replay = asyncio.run(
            app.request_analysis(
                repo, "owner", session.id, mapping.id, request, config, Advisor(), Review()
            )
        )
        assert replay == result and fresh.r is None
        # A cached Advisor without its Reviewer must not create a new paid run.
        changed = repo.get(session.id, "owner")
        changed.review_records.clear()  # Local synthetic test fixture only.
        repo.put(changed)
        review = Review()
        partial = asyncio.run(
            app.request_analysis(
                repo, "owner", session.id, mapping.id, request, config, Advisor(), review
            )
        )
        assert partial.reviewer.state == "FALLBACK" and review.calls == 0 and fresh.r is None
