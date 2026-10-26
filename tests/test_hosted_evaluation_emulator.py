"""Real Firestore SDK with disposable loopback emulator; never cloud authorization."""

import asyncio
from copy import deepcopy
from types import SimpleNamespace

import pytest
from movebooks_api.runtime.hosted_evaluation import AUTHORIZATION_ID, HostedAuthority
from movebooks_api.runtime.model_controls import ControlDenied
from test_firestore_emulator_integration import database
from test_firestore_emulator_integration import pytestmark as emulator_only
from test_hosted_evaluation import POLICY, REVISION, approved

pytestmark = emulator_only


def authority(adapter, settings, monkeypatch):
    monkeypatch.setenv("K_REVISION", REVISION)
    # Only configuration values use the approved project. The injected real SDK
    # client is independently pinned to the demo project and loopback emulator.
    assert adapter.client.project == "demo-movebooks-local"
    assert adapter.client._emulator_host.startswith("127.0.0.1:")
    config = SimpleNamespace(
        **{
            **vars(settings),
            "google_project": "movebooks-ai",
            "reasoning_project": "movebooks-ai",
            "reasoning_location": "global",
            "model_control_timeout_seconds": 5,
        }
    )
    return HostedAuthority(
        config,
        "firebase:synthetic-test-owner",
        "workspace",
        "mapping",
        "explicit-request",
        adapter=adapter,
    )


async def seed(adapter, value):
    collection = adapter.client.collection("movebooks_model_controls")
    await collection.document("policy").create(POLICY)
    doc = approved()
    doc["scope"] = deepcopy(value.scope)
    ref = collection.document("authorization-" + AUTHORIZATION_ID)
    await ref.create(doc)
    return ref


def test_sdk_missing_authorization_never_seeds_or_calls(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            value = authority(adapter, settings, monkeypatch)
            with pytest.raises(ControlDenied):
                await value.claim()
            ref = adapter.client.collection("movebooks_model_controls").document(
                "authorization-" + AUTHORIZATION_ID
            )
            assert not (await ref.get()).exists

    asyncio.run(scenario())


def test_sdk_concurrent_claim_never_has_two_winners(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            first = authority(adapter, settings, monkeypatch)
            second = authority(adapter, settings, monkeypatch)
            ref = await seed(adapter, first)
            results = await asyncio.gather(first.claim(), second.claim(), return_exceptions=True)
            # The emulator may hold both contending writes until our explicit
            # deadline. Denying both is safe; granting both would be a defect.
            assert sum(r is None for r in results) <= 1
            assert all(r is None or isinstance(r, ControlDenied) for r in results)
            snapshot = (await ref.get()).to_dict()
            assert snapshot["state"] in {"APPROVED", "CLAIMED"} and snapshot["calls"] == 0

    asyncio.run(scenario())


def test_sdk_new_client_restart_cannot_renew_durable_claim(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            first = authority(adapter, settings, monkeypatch)
            ref = await seed(adapter, first)
            await first.claim()
            snapshot = (await ref.get()).to_dict()
            assert snapshot["state"] == "CLAIMED"
            async with database(monkeypatch, database_id=settings.firestore_database) as (a2, s2):
                with pytest.raises(ControlDenied):
                    await authority(a2, s2, monkeypatch).claim()
            assert (await ref.get()).to_dict() == snapshot

    asyncio.run(scenario())


def test_sdk_four_attempts_complete_and_immutable_sanitized_evidence(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            value = authority(adapter, settings, monkeypatch)
            ref = await seed(adapter, value)
            await value.claim()
            for role in ("advisor", "advisor", "reviewer", "reviewer"):
                if role == "reviewer":
                    await value.change("advisor_complete")
                number = await value.reserve(role, 50000, "f" * 64)
                pending = (await ref.get()).to_dict()
                assert pending["calls"] == number and pending["in_flight"]
                await value.finish(number, {"usage": {}, "usage_status": "partial"})
            await value.change("complete")
            final = (await ref.get()).to_dict()
            assert final["state"] == "COMPLETED" and final["calls"] == 4
            assert final["reserved_microusd"] == 80480
            with pytest.raises(ControlDenied):
                await value.reserve("reviewer", 10, "f" * 64)
            with pytest.raises(ControlDenied):
                await value.claim()
            records = [
                d.to_dict()
                async for d in adapter.client.collection("movebooks_model_controls").stream()
            ]
            assert sum(d.get("state") == "RESPONSE_RECEIVED" for d in records) == 4
            assert "synthetic-test-owner" not in str(records)

    asyncio.run(scenario())


def test_sdk_kill_switch_and_ambiguous_attempt_never_refund(monkeypatch):
    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            value = authority(adapter, settings, monkeypatch)
            ref = await seed(adapter, value)
            await value.claim()
            await value.reserve("advisor", 10, "f" * 64)
            with pytest.raises(ControlDenied):
                await value.reserve("advisor", 10, "f" * 64)
            await value.finish(1, {"usage": {}, "usage_status": "partial"})
            await (
                adapter.client.collection("movebooks_model_controls")
                .document("policy")
                .update({"enabled": False})
            )
            with pytest.raises(ControlDenied):
                await value.reserve("advisor", 10, "f" * 64)
            await value.halt()
            stored = (await ref.get()).to_dict()
            assert stored["state"] == "HALTED" and stored["calls"] == 1
            assert stored["reserved_microusd"] == 20120

    asyncio.run(scenario())
