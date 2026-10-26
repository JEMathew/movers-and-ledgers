"""New judge adapter only; disposable anonymous loopback Firestore, never ADC/cloud."""

import asyncio
from datetime import timedelta
from types import SimpleNamespace

import pytest
from movebooks_api.runtime.judge_budget import CAMPAIGN_ID, JudgeAuthority, digest
from movebooks_api.runtime.model_controls import ControlDenied
from test_firestore_emulator_integration import database
from test_firestore_emulator_integration import pytestmark as emulator_only
from test_judge_budget import NOW, POLICY, REVISION, campaign, eligibility

pytestmark = emulator_only
PREFIX = "judge-" + CAMPAIGN_ID


def authority(adapter, settings, monkeypatch, request="request-1", owner="firebase:synthetic-A"):
    assert adapter.client.project == "demo-movebooks-local"
    assert adapter.client._emulator_host.startswith("127.0.0.1:")
    monkeypatch.setenv("K_REVISION", REVISION)
    config = SimpleNamespace(
        **{
            **vars(settings),
            "judge_campaign_enabled": True,
            "google_project": "movebooks-ai",
            "reasoning_project": "movebooks-ai",
            "reasoning_location": "global",
            "model_control_timeout_seconds": 5,
        }
    )
    a = JudgeAuthority(
        config,
        owner,
        "synthetic-workspace",
        "clearing",
        request,
        adapter=adapter,
        clock=lambda: NOW,
    )
    a.bind_context("a" * 64)
    return a


async def seed(adapter, a, *, budget=None):
    col = adapter.client.collection("movebooks_model_controls")
    await col.document("policy").create(POLICY)
    await col.document(PREFIX).create(budget or campaign())
    key = digest(a.scope["owner_hash"] + ":" + a.scope["workspace_hash"])
    await col.document(PREFIX + "-eligible-" + key).create(eligibility(a.scope))
    return col


def test_missing_campaign_does_not_seed_or_touch_validation_grant(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            a = authority(adapter, settings, monkeypatch)
            with pytest.raises(ControlDenied):
                await a.claim()
            assert [
                d async for d in adapter.client.collection("movebooks_model_controls").stream()
            ] == []

    asyncio.run(scenario())


def test_restart_and_two_shared_slots_are_durable(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            a = authority(adapter, settings, monkeypatch)
            col = await seed(adapter, a)
            await a.claim()
            async with database(monkeypatch, database_id=settings.firestore_database) as (b, s):
                with pytest.raises(ControlDenied):
                    await authority(b, s, monkeypatch).claim()
                second = authority(b, s, monkeypatch, "request-2")
                await second.claim()
                with pytest.raises(ControlDenied):
                    await authority(b, s, monkeypatch, "request-3").claim()
            result = (await col.document(PREFIX).get()).to_dict()
            assert result["analyses"] == 2 and result["reserved_microusd"] == 160960
            assert len(result["active_claims"]) == 2

    asyncio.run(scenario())


def test_competing_last_budget_reservation_never_both_succeeds(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            a = authority(adapter, settings, monkeypatch)
            budget = campaign()
            budget.update(analyses=61, reserved_microusd=61 * 80480)
            col = await seed(adapter, a, budget=budget)
            b = authority(adapter, settings, monkeypatch, "request-2")
            results = await asyncio.gather(a.claim(), b.claim(), return_exceptions=True)
            assert sum(r is None for r in results) <= 1
            assert all(r is None or isinstance(r, ControlDenied) for r in results)
            current = (await col.document(PREFIX).get()).to_dict()
            assert current["analyses"] <= 62 and current["reserved_microusd"] <= 5000000

    asyncio.run(scenario())


def test_four_attempts_and_response_evidence_survive_completion(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            a = authority(adapter, settings, monkeypatch)
            col = await seed(adapter, a)
            await a.claim()
            for n, role in enumerate(("advisor", "advisor", "reviewer", "reviewer"), 1):
                if n == 3:
                    await a.change("advisor_complete")
                assert await a.reserve(role, 50000, "f" * 64) == n
                await a.finish(n, {"usage": {}, "billable_cost_status": "UNVERIFIED"})
            with pytest.raises(ControlDenied):
                await a.reserve("reviewer", 1, "f" * 64)
            await a.change("complete")
            result = (await col.document(PREFIX).get()).to_dict()
            assert result["reserved_microusd"] == 80480 and result["active_claims"] == []
            records = [d async for d in col.stream()]
            assert sum("-attempt-" in d.id for d in records) == 4
            assert all(d.id.startswith("judge-") or d.id == "policy" for d in records)
            with pytest.raises(ControlDenied):
                await a.claim()

    asyncio.run(scenario())


def test_kill_switch_then_ambiguous_halt_never_refunds_slot(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            a = authority(adapter, settings, monkeypatch)
            col = await seed(adapter, a)
            await a.claim()
            await a.reserve("advisor", 1, "f" * 64)
            await col.document("policy").update({"enabled": False})
            with pytest.raises(ControlDenied):
                await a.reserve("advisor", 1, "f" * 64)
            await a.halt()
            await a.halt()
            result = (await col.document(PREFIX).get()).to_dict()
            assert result["reserved_microusd"] == 80480 and result["active_claims"] == [a.key]

    asyncio.run(scenario())


def test_foreign_owner_and_corrupt_daily_record_do_not_consume(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            a = authority(adapter, settings, monkeypatch)
            col = await seed(adapter, a)
            with pytest.raises(ControlDenied):
                await authority(
                    adapter, settings, monkeypatch, owner="firebase:synthetic-B"
                ).claim()
            await col.document(PREFIX + "-owner-2026-10-21-" + a.scope["owner_hash"]).create({})
            with pytest.raises(ControlDenied):
                await a.claim()
            assert (await col.document(PREFIX).get()).to_dict()["analyses"] == 0
            assert not (await col.document(PREFIX + "-claim-" + a.key).get()).exists

    asyncio.run(scenario())


def test_real_daily_rollover_preserves_spend_and_expiry_blocks(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            a = authority(adapter, settings, monkeypatch)
            col = await seed(adapter, a)
            await a.claim()
            await a.halt()  # Known pre-dispatch failure: slot only, never refund spend.
            b = authority(adapter, settings, monkeypatch, "next-day")
            b.clock = lambda: NOW + timedelta(days=1)
            await b.claim()
            result = (await col.document(PREFIX).get()).to_dict()
            assert result["analyses"] == 2 and result["reserved_microusd"] == 160960
            b.clock = lambda: NOW + timedelta(days=7)
            with pytest.raises(ControlDenied):
                await b.reserve("advisor", 1, "f" * 64)
            await b.halt()
            assert (await col.document(PREFIX).get()).to_dict()["active_claims"] == []

    asyncio.run(scenario())
