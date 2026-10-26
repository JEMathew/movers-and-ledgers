"""Offline controls only: transport doubles, no ADC, generation or real ledger."""

import asyncio
import json
from copy import deepcopy
from types import SimpleNamespace

import pytest
from movebooks_api.runtime.hosted_evaluation import (
    AUTHORIZATION_ID,
    CALL_MICROUSD,
    HostedAuthority,
    transition,
)
from movebooks_api.runtime.model_controls import ControlDenied
from test_gemini_evaluation_guards import wire

from agents.reasoning.transport import CountedTransport, TransportDenied, cloud_guard

SCOPE = {"owner_hash": "a" * 64, "workspace_hash": "b" * 64, "mapping_hash": "c" * 64}
POLICY = {"enabled": True, "synthetic_beta_authorized": True}
REVISION = "private-local-test-revision"


def approved():
    return {
        "authorization_id": AUTHORIZATION_ID,
        "scope": deepcopy(SCOPE),
        "revision": REVISION,
        "max_calls": 4,
        "max_microusd": 200000,
        "call_microusd": CALL_MICROUSD,
        "model": "gemini-3.5-flash-lite",
        "location": "global",
        "thinking": "LOW",
        "state": "APPROVED",
        "calls": 0,
        "reserved_microusd": 0,
        "in_flight": False,
        "role_calls": {"advisor": 0, "reviewer": 0},
        "approved_synthetic_identity": True,
        "synthetic_workspace_verified": True,
        "private_acceptance_passed": True,
        "count_tokens_free_verified": True,
        "all_output_bounded_verified": True,
        "price_verified": True,
        "native_control_verification_passed": True,
        "preflight_evidence_sha256": "d" * 64,
    }


class LedgerDouble:
    def __init__(self, document=None, policy=None):
        self.document = document if document is not None else approved()
        self.policy = policy if policy is not None else deepcopy(POLICY)
        self.responses = []
        self.lock = asyncio.Lock()

    async def change(self, event, details=None):
        async with self.lock:
            self.document = transition(
                self.document, self.policy, SCOPE, REVISION, "claim-1", event, details
            )
            return self.document

    async def claim(self):
        await self.change("claim")

    async def reserve(self, role, tokens, fingerprint):
        return (await self.change("reserve", (role, tokens, fingerprint)))["calls"]

    async def finish(self, attempt, trace):
        self.responses.append(trace)
        await self.change("response", (attempt, trace))

    async def halt(self):
        self.document["state"] = "HALTED"


def install(
    guard,
    role="advisor",
    tokens=50000,
    *,
    count_error=False,
    generation_error=False,
    usage=None,
    kill_after_count=False,
):
    calls = []

    async def transport(request, http_options=None, stream=False):
        assert http_options.retry_options.attempts == 1 and not stream
        calls.append(deepcopy(request))
        if request.url.endswith(":countTokens"):
            if count_error:
                raise ValueError("private provider diagnostic")
            body = {"totalTokens": tokens}
            if kill_after_count:
                guard.authority.policy["enabled"] = False
        else:
            # Durable reservation must precede a generation attempt.
            assert guard.authority.document["in_flight"]
            assert guard.authority.document["calls"] >= 1
            if generation_error:
                raise TimeoutError("ambiguous generation")
            body = {
                "usageMetadata": usage
                if usage is not None
                else {
                    "promptTokenCount": 8,
                    "candidatesTokenCount": 2,
                },
                "modelVersion": "gemini-3.5-flash-lite",
                "responseId": "local-response",
            }
        return SimpleNamespace(response_stream=[json.dumps(body)])

    api = SimpleNamespace(_async_request=transport)
    guard.install(SimpleNamespace(_api_client=api), role)
    return api, calls


def test_four_calls_roles_cost_and_restart_are_nonrenewable():
    async def scenario():
        ledger = LedgerDouble()
        guard = CountedTransport(ledger)
        await guard.prepare()
        advisor, _ = install(guard)
        for _ in range(2):
            await advisor._async_request(wire())
        await ledger.change("advisor_complete")
        reviewer, calls = install(guard, "reviewer")
        for _ in range(2):
            await reviewer._async_request(wire())
        assert ledger.document["calls"] == 4
        assert ledger.document["reserved_microusd"] == 80480 < 200000
        assert ledger.document["role_calls"] == {"advisor": 2, "reviewer": 2}
        assert ledger.responses[0]["usage_status"] == "partial"
        assert "thoughtsTokenCount" not in ledger.responses[0]["usage"]
        with pytest.raises(TransportDenied):
            await reviewer._async_request(wire())
        assert sum(r.url.endswith(":generateContent") for r in calls) == 2
        with pytest.raises(ControlDenied):
            await CountedTransport(ledger).prepare()

    asyncio.run(scenario())


@pytest.mark.parametrize("tokens", [50001, 0, -1, None, True, "12"])
def test_invalid_count_stops_before_generation(tokens):
    async def scenario():
        ledger = LedgerDouble()
        guard = CountedTransport(ledger)
        await guard.prepare()
        api, calls = install(guard, tokens=tokens)
        with pytest.raises(TransportDenied):
            await api._async_request(wire())
        assert len(calls) == 1 and calls[0].url.endswith(":countTokens")
        assert ledger.document["calls"] == 0 and ledger.document["state"] == "HALTED"

    asyncio.run(scenario())


@pytest.mark.parametrize("count_error,generation_error", [(True, False), (False, True)])
def test_errors_burn_claim_and_never_retry(count_error, generation_error):
    async def scenario():
        ledger = LedgerDouble()
        guard = CountedTransport(ledger)
        await guard.prepare()
        api, calls = install(guard, count_error=count_error, generation_error=generation_error)
        with pytest.raises(TransportDenied, match="^hosted_transport_stopped$"):
            await api._async_request(wire())
        assert ledger.document["calls"] == int(generation_error)
        assert ledger.document["state"] == "HALTED"
        before = len(calls)
        with pytest.raises(TransportDenied):
            await api._async_request(wire())
        assert len(calls) == before

    asyncio.run(scenario())


def test_actual_wire_count_includes_schema_instruction_and_prior_tool_turns():
    async def scenario():
        guard = CountedTransport(LedgerDouble())
        await guard.prepare()
        api, calls = install(guard)
        request = wire()
        await api._async_request(request)
        assert calls[0].data == request.data == calls[1].data
        assert "functionResponse" in str(calls[0].data)

    asyncio.run(scenario())


@pytest.mark.parametrize(
    "change",
    [
        {"tools": [{"googleSearch": {}}]},
        {"cachedContent": "forbidden"},
        {"generationConfig": {"maxOutputTokens": 2049}},
        {"contents": [{"parts": [{"fileData": {"fileUri": "gs://not-permitted"}}]}]},
    ],
)
def test_uncounted_paid_tools_and_changed_limits_fail_before_network(change):
    async def scenario():
        guard = CountedTransport(LedgerDouble())
        await guard.prepare()
        api, calls = install(guard)
        with pytest.raises(TransportDenied):
            await api._async_request(wire(**change))
        assert not calls

    asyncio.run(scenario())


@pytest.mark.parametrize(
    "field,value",
    [
        ("approved_synthetic_identity", False),
        ("private_acceptance_passed", False),
        ("all_output_bounded_verified", False),
        ("count_tokens_free_verified", False),
        ("price_verified", False),
        ("native_control_verification_passed", False),
        ("calls", True),
        ("calls", -1),
        ("role_calls", {}),
        ("reserved_microusd", 1),
        ("scope", {**SCOPE, "owner_hash": "e" * 64}),
        ("revision", "other-revision"),
        ("authorization_id", "another-allowance"),
        ("preflight_evidence_sha256", ""),
    ],
)
def test_missing_proof_corruption_and_identity_mismatch_fail_closed(field, value):
    doc = approved()
    doc[field] = value
    with pytest.raises(ControlDenied):
        transition(doc, POLICY, SCOPE, REVISION, "claim-1", "claim")


def test_kill_switch_inflight_and_role_order():
    doc = transition(approved(), POLICY, SCOPE, REVISION, "claim-1", "claim")
    with pytest.raises(ControlDenied, match="advisor_not_complete"):
        transition(doc, POLICY, SCOPE, REVISION, "claim-1", "reserve", ("reviewer", 10, "f" * 64))
    doc = transition(doc, POLICY, SCOPE, REVISION, "claim-1", "reserve", ("advisor", 10, "f" * 64))
    for policy in [POLICY, {"enabled": False}]:
        with pytest.raises(ControlDenied):
            transition(
                doc, policy, SCOPE, REVISION, "claim-1", "reserve", ("advisor", 10, "f" * 64)
            )


def test_concurrent_claim_has_one_winner_and_reconstruction_cannot_resume():
    async def scenario():
        ledger = LedgerDouble()
        results = await asyncio.gather(
            *(CountedTransport(ledger).prepare() for _ in range(20)), return_exceptions=True
        )
        assert sum(r is None for r in results) == 1
        with pytest.raises(ControlDenied):
            await CountedTransport(LedgerDouble(deepcopy(ledger.document))).prepare()

    asyncio.run(scenario())


def test_cloud_model_requires_application_pair_scope_before_adc():
    with pytest.raises(TransportDenied):
        cloud_guard(SimpleNamespace(cloud=True))
    assert cloud_guard(SimpleNamespace(cloud=False)) is None
    with pytest.raises(ControlDenied, match="verified_identity"):
        HostedAuthority(None, "operator-email-is-not-firebase", "s", "m", "r")


def test_kill_switch_after_count_prevents_generation():
    async def scenario():
        ledger = LedgerDouble()
        guard = CountedTransport(ledger)
        await guard.prepare()
        api, calls = install(guard, kill_after_count=True)
        with pytest.raises(TransportDenied):
            await api._async_request(wire())
        assert len(calls) == 1 and ledger.document["calls"] == 0

    asyncio.run(scenario())


def test_reported_thinking_overrun_halts_and_preserves_partial_evidence():
    async def scenario():
        ledger = LedgerDouble()
        guard = CountedTransport(ledger)
        await guard.prepare()
        api, calls = install(
            guard,
            usage={
                "promptTokenCount": 8,
                "candidatesTokenCount": 2,
                "thoughtsTokenCount": 2048,
            },
        )
        with pytest.raises(TransportDenied):
            await api._async_request(wire())
        assert ledger.document["calls"] == 1 and ledger.document["state"] == "HALTED"
        assert ledger.responses[0]["usage"]["thoughtsTokenCount"] == 2048
        assert ledger.responses[0]["billable_cost_status"] == "UNVERIFIED"
        assert len(calls) == 2

    asyncio.run(scenario())


def test_no_usage_is_unknown_not_zero_cost():
    async def scenario():
        ledger = LedgerDouble()
        guard = CountedTransport(ledger)
        await guard.prepare()
        api, _ = install(guard, usage={})
        await api._async_request(wire())
        assert ledger.responses[0]["usage_status"] == "unknown"
        assert ledger.responses[0]["reported_estimated_cost_usd"] is None

    asyncio.run(scenario())


@pytest.mark.parametrize("bad_count", [False, True])
def test_application_pair_binds_guard_before_quota_and_preserves_human_authority(
    monkeypatch,
    bad_count,
):
    from uuid import uuid4

    import movebooks_api.analysis as application
    from test_assisted_analysis import Reviewer, business, settings, setup
    from test_live_reasoning import GoodProvider

    from agents.reasoning.transport import ACTIVE

    repo, session, mapping = setup()
    ledger = LedgerDouble()
    guard = CountedTransport(ledger)
    calls = []

    def factory(config, owner, session_id, mapping_id, request_id):
        assert (owner, session_id, mapping_id) == ("owner", session.id, mapping.id)
        return guard

    async def reserve(*args):
        assert guard.prepared and ledger.document["state"] == "CLAIMED"
        calls.append("daily-reserved")

    async def finish(*args):
        return True

    class Advisor(GoodProvider):
        async def generate(self, context, model):
            assert ACTIVE.get() is guard
            api, _ = install(guard, tokens=50001 if bad_count else 10)
            await api._async_request(wire())
            return await super().generate(context, model)

    class IndependentReviewer(Reviewer):
        async def generate(self, context, model):
            assert ACTIVE.get() is guard
            api, _ = install(guard, "reviewer", tokens=10)
            await api._async_request(wire())
            return await super().generate(context, model)

    monkeypatch.setattr(application, "new_pair_guard", factory)
    for module in ["movebooks_api.reasoning", "movebooks_api.reviewer"]:
        monkeypatch.setattr(module + ".reserve_live", reserve)
        monkeypatch.setattr(module + ".finish_live", finish)
    reviewer = IndependentReviewer()
    result = asyncio.run(
        application.request_analysis(
            repo,
            "owner",
            session.id,
            mapping.id,
            application.AnalysisRequest(request_id=uuid4(), confirmed=True),
            settings().model_copy(update={"env": "cloud-dev"}),
            Advisor(),
            reviewer,
        )
    )
    assert ACTIVE.get() is None
    assert business(repo.get(session.id, "owner")) == business(session)
    assert result.human_approval_required and not result.financial_authority
    if bad_count:
        assert ledger.document["state"] == "HALTED" and ledger.document["calls"] == 0
        assert result.advisor.state == result.reviewer.state == "FALLBACK"
        assert reviewer.calls == 0 and len(calls) == 1
    else:
        assert ledger.document["state"] == "COMPLETED" and ledger.document["calls"] == 2
        assert result.advisor.state == "ESCALATED" and result.reviewer.state == "COMPLETED"
        assert result.reviewer.advisor_request_id == result.advisor.request_id
        assert reviewer.calls == 1 and len(calls) == 2
