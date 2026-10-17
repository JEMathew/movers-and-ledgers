"""Opt-in real SDK / local emulator checks; never a cloud or IAM validation.

Run with scripts/run_firestore_emulator_tests.py. The demo project, loopback-only
endpoint and explicit anonymous credentials are independent fail-closed controls.
Each scenario uses a fresh, disposable named database inside the emulator.
"""

import asyncio
import hashlib
import json
import os
import re
from contextlib import asynccontextmanager
from types import SimpleNamespace
from uuid import uuid4

import pytest

pytestmark = pytest.mark.skipif(
    os.environ.get("MOVEBOOKS_LOCAL_FIRESTORE_TESTS") != "1",
    reason="Explicit local emulator runner required; never use ADC/cloud",
)

PROJECT = "demo-movebooks-local"
OWNER = "firebase:local-owner"
OTHER = "firebase:other-owner"
POLICY = {"enabled": True, "synthetic_beta_authorized": True}


@asynccontextmanager
async def database(monkeypatch, *, database_id=None, **changes):
    from google.auth.credentials import AnonymousCredentials
    from google.cloud import firestore
    from movebooks_api.runtime.model_controls import FirestoreModelControls

    endpoint = os.environ.get("FIRESTORE_EMULATOR_HOST", "")
    assert re.fullmatch(r"127\.0\.0\.1:[1-9][0-9]{0,4}", endpoint), "Loopback only"
    assert 0 < int(endpoint.rsplit(":", 1)[1]) < 65536

    def no_adc(*args, **kwargs):
        raise AssertionError("ADC is forbidden in local integration tests")

    monkeypatch.setattr("google.auth.default", no_adc)
    # This is an adapter-only test configuration, not a cloud Settings instance.
    # Production Settings intentionally reject FIRESTORE_EMULATOR_HOST.
    settings = SimpleNamespace(
        cloud=True,
        identity_mode="firebase",
        synthetic_beta_authorized=True,
        model_controls_backend="firestore",
        google_project=PROJECT,
        firestore_database=database_id or "phaseb-" + uuid4().hex,
        model_control_timeout_seconds=2,
        reasoning_reservation_microusd=100,
        reasoning_owner_daily_calls=4,
        reasoning_global_daily_calls=6,
        reasoning_global_daily_microusd=300,
        **changes,
    )
    client = firestore.AsyncClient(
        project=PROJECT,
        database=settings.firestore_database,
        credentials=AnonymousCredentials(),
    )
    assert client._emulator_host == endpoint
    assert client.project == PROJECT and client._database == settings.firestore_database
    adapter = FirestoreModelControls(settings, client)
    try:
        yield adapter, settings
    finally:
        api = client.__dict__.get("_firestore_api_internal")
        if api is not None:
            await api.transport.close()


async def seed(adapter, policy=POLICY):
    await adapter.client.collection("movebooks_model_controls").document("policy").set(policy)


def reservation(adapter, key):
    digest = hashlib.sha256(key.encode()).hexdigest()
    return adapter.client.collection("movebooks_model_controls").document("reservation-" + digest)


@pytest.mark.parametrize("policy", [None, {"enabled": False}, {"enabled": True}])
def test_missing_or_disabled_policy_has_no_durable_allowance(monkeypatch, policy):
    from movebooks_api.runtime.model_controls import ControlDenied

    async def scenario():
        async with database(monkeypatch) as (adapter, _):
            if policy is not None:
                await seed(adapter, policy)
            with pytest.raises(ControlDenied, match="model_kill_switch"):
                await adapter.reserve(OWNER, "blocked", "mapping")
            documents = [
                s.id async for s in adapter.client.collection("movebooks_model_controls").stream()
            ]
            assert documents == ([] if policy is None else ["policy"])

    asyncio.run(scenario())


def test_named_database_isolation_is_real_not_a_client_cache_claim(monkeypatch):
    from movebooks_api.runtime.model_controls import ControlDenied

    async def scenario():
        async with database(monkeypatch) as (selected, _), database(monkeypatch) as (other, _):
            await seed(selected)
            await selected.reserve(OWNER, "same-key", "mapping")
            with pytest.raises(ControlDenied, match="model_kill_switch"):
                await other.reserve(OWNER, "same-key", "mapping")
            assert (await reservation(selected, "same-key").get()).exists
            assert not (await reservation(other, "same-key").get()).exists

    asyncio.run(scenario())


def test_reservation_completion_owner_query_and_replay_share_real_store(monkeypatch):
    from movebooks_api.runtime.model_controls import ControlDenied
    from movebooks_api.runtime.operational_activity import read_activity

    from agents.reasoning.provider import ProviderResult

    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            await seed(adapter)
            await adapter.reserve(OWNER, "first", "mapping")
            await adapter.reserve(OTHER, "second", "mapping-review")
            before = (await reservation(adapter, "first").get()).to_dict()
            with pytest.raises(ControlDenied, match="owner_mismatch"):
                await adapter.finish(OTHER, "first", "COMPLETED", ProviderResult("private"))
            assert (await reservation(adapter, "first").get()).to_dict() == before
            await adapter.finish(
                OWNER,
                "first",
                "COMPLETED",
                ProviderResult("private-model-text", 1, 1, 10, 20, usage_status="complete"),
            )
            await adapter.finish(OWNER, "first", "FALLBACK", ProviderResult("private"))
            stored = (await reservation(adapter, "first").get()).to_dict()
            assert stored["state"] == "COMPLETED" and stored["reserved_microusd"] == 100
            assert stored["created_at"] <= stored["completed_at"]
            with pytest.raises(ControlDenied, match="already_exists"):
                await adapter.reserve(OWNER, "first", "mapping")
            result = await read_activity(settings, OWNER, adapter)
            assert result["status"] == "AVAILABLE" and len(result["events"]) == 1
            assert result["events"][0]["state"] == "COMPLETED"
            assert result["events"][0]["model_calls"] == 1
            encoded = json.dumps(result)
            assert not any(
                value in encoded for value in [OWNER, OTHER, "private", "owner_hash", "first"]
            )
            other = await read_activity(settings, OTHER, adapter)
            assert (
                len(other["events"]) == 1 and other["events"][0]["capability"] == "mapping-review"
            )

    asyncio.run(scenario())


def test_concurrent_reservations_cannot_overspend_actual_transaction(monkeypatch):
    from movebooks_api.runtime.model_controls import ControlDenied, reserve_live

    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            await seed(adapter)
            admitted_provider_calls = []

            async def admit(index):
                try:
                    await reserve_live(settings, OWNER, f"concurrent-{index}", "mapping", adapter)
                    # A stand-in for the next provider step, never a model call.
                    admitted_provider_calls.append(index)
                    return True
                except ControlDenied as error:
                    assert str(error) in {
                        "owner_model_quota",
                        "model_controls_busy",
                        "model_controls_timeout",
                        "model_controls_unavailable",
                    }
                    return False

            results = await asyncio.gather(*(admit(i) for i in range(4)))
            assert sum(results) <= 2
            assert len(admitted_provider_calls) == sum(results)
            assert all(results[index] for index in admitted_provider_calls)
            documents = [
                s.to_dict()
                async for s in adapter.client.collection("movebooks_model_controls").stream()
            ]
            reservations = [d for d in documents if d.get("state") == "RESERVED"]
            assert sum(results) <= len(reservations) <= 2
            counters = [d for d in documents if "reserved_microusd" in d and "state" not in d]
            assert counters == (
                []
                if not reservations
                else [
                    {
                        "reserved_calls": 2 * len(reservations),
                        "reserved_microusd": 100 * len(reservations),
                    }
                ]
            )

    asyncio.run(scenario())


@pytest.mark.parametrize("limit", ["owner", "global", "budget"])
def test_exact_limit_denies_without_consuming_another_allowance(monkeypatch, limit):
    from movebooks_api.runtime.model_controls import ControlDenied

    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            if limit == "owner":
                settings.reasoning_owner_daily_calls = 2
            elif limit == "global":
                settings.reasoning_global_daily_calls = 2
            else:
                settings.reasoning_global_daily_microusd = 100
            await seed(adapter)
            await adapter.reserve(OWNER, "accepted", "mapping")
            expected = {
                "owner": "owner_model_quota",
                "global": "global_model_quota",
                "budget": "global_model_budget",
            }[limit]
            with pytest.raises(ControlDenied, match=expected):
                await adapter.reserve(OWNER if limit == "owner" else OTHER, "denied", "mapping")
            assert not (await reservation(adapter, "denied").get()).exists
            documents = [
                s.to_dict()
                async for s in adapter.client.collection("movebooks_model_controls").stream()
            ]
            assert next(d for d in documents if "reserved_microusd" in d and "state" not in d) == {
                "reserved_calls": 2,
                "reserved_microusd": 100,
            }

    asyncio.run(scenario())


def test_real_sdk_stale_completion_precondition_cannot_overwrite(monkeypatch):
    from google.api_core.exceptions import FailedPrecondition
    from movebooks_api.runtime.model_controls import FirestoreModelControls

    from agents.reasoning.provider import ProviderResult

    async def scenario():
        async with database(monkeypatch) as (adapter, settings):
            await seed(adapter)
            await adapter.reserve(OWNER, "race", "mapping")
            barrier = asyncio.Barrier(2)
            ref = reservation(adapter, "race")

            class DelayedRead:
                async def get(self, **kwargs):
                    snapshot = await ref.get(**kwargs)
                    await barrier.wait()
                    return snapshot

                async def update(self, *args, **kwargs):
                    return await ref.update(*args, **kwargs)

            class ScheduledClient:
                # Only synchronize the actual reads; writes/preconditions reach the emulator.
                write_option = staticmethod(adapter.client.write_option)

                def collection(self, name):
                    assert name == "movebooks_model_controls"
                    return self

                def document(self, name):
                    assert name == ref.id
                    return DelayedRead()

            scheduled = FirestoreModelControls(settings, ScheduledClient())
            results = await asyncio.gather(
                scheduled.finish(OWNER, "race", "COMPLETED", ProviderResult("", 1, 0)),
                scheduled.finish(OWNER, "race", "FALLBACK", ProviderResult("", 0, 0)),
                return_exceptions=True,
            )
            assert sum(r is None for r in results) == 1
            assert sum(isinstance(r, FailedPrecondition) for r in results) == 1
            stored = (await ref.get()).to_dict()
            assert stored["state"] in {"COMPLETED", "FALLBACK"}
            assert stored["reserved_calls"] == 2 and stored["reserved_microusd"] == 100

    asyncio.run(scenario())
