"""Fail-closed cloud reservations; no Firestore infrastructure access in this suite."""

import asyncio
from threading import Lock

import pytest
from movebooks_api.runtime.model_controls import ControlDenied, decide, reserve_live
from movebooks_api.settings import Settings
from test_google_runtime import CLOUD
from test_live_reasoning import GoodProvider, configured, prepared, run

from domain.reasoning.models import Capability

POLICY = {"enabled": True, "synthetic_beta_authorized": True}


def decision(policy=POLICY, owner=None, usage=None, reservation=None, **kwargs):
    return decide(
        policy,
        owner or {},
        usage or {},
        reservation or {},
        calls=2,
        cost=100,
        owner_limit=4,
        global_limit=6,
        budget_limit=300,
        **kwargs,
    )


def test_reservation_consumes_owner_global_and_cost_allowance_before_call():
    owner, usage = decision()
    assert owner == {"reserved_calls": 2}
    assert usage == {"reserved_calls": 2, "reserved_microusd": 100}
    owner, usage = decision(owner=owner, usage=usage)
    assert owner["reserved_calls"] == 4 and usage["reserved_microusd"] == 200
    with pytest.raises(ControlDenied, match="owner_model_quota"):
        decision(owner=owner, usage=usage)


@pytest.mark.parametrize(
    "policy",
    [
        {},
        {"enabled": True},
        {"enabled": "true", "synthetic_beta_authorized": True},
        {"enabled": False, "synthetic_beta_authorized": True},
    ],
)
def test_missing_or_disabled_policy_stops_all_calls(policy):
    with pytest.raises(ControlDenied, match="model_kill_switch"):
        decision(policy)


@pytest.mark.parametrize(
    "usage,category",
    [
        ({"reserved_calls": 6}, "global_model_quota"),
        ({"reserved_microusd": 300}, "global_model_budget"),
        ({"reserved_calls": -1}, "model_control_integrity"),
        ({"reserved_calls": True}, "model_control_integrity"),
        ({"reserved_microusd": "100"}, "model_control_integrity"),
    ],
)
def test_global_limits_and_corrupt_counters_fail_closed(usage, category):
    with pytest.raises(ControlDenied, match=category):
        decision(usage=usage)


def test_existing_reservation_never_reauthorizes_a_billable_replay():
    with pytest.raises(ControlDenied, match="already_exists"):
        decision(reservation={"state": "RESERVED"})


class TransactionDouble:
    """Serialized port double, not evidence of live Firestore behavior."""

    def __init__(self):
        self.lock = Lock()
        self.owner, self.usage, self.keys = {}, {}, set()

    async def reserve(self, owner, key, capability):
        with self.lock:
            self.owner, self.usage = decision(
                owner=self.owner,
                usage=self.usage,
                reservation={"exists": True} if key in self.keys else {},
            )
            self.keys.add(key)


def cloud_settings(**changes):
    return Settings(
        **{
            **CLOUD,
            "synthetic_beta_authorized": True,
            "model_controls_backend": "firestore",
            **changes,
        },
        _env_file=None,
    )


def test_concurrent_port_reservations_cannot_exceed_quota():
    controls = TransactionDouble()

    async def scenario():
        async def call(index):
            try:
                await reserve_live(
                    cloud_settings(), "firebase:owner", str(index), "mapping", controls
                )
                return True
            except ControlDenied:
                return False

        return await asyncio.gather(*(call(index) for index in range(20)))

    results = asyncio.run(scenario())
    assert sum(results) == 2 and controls.usage["reserved_calls"] == 4


@pytest.mark.parametrize(
    "changes,owner",
    [
        ({"synthetic_beta_authorized": False}, "firebase:owner"),
        ({"model_controls_backend": "disabled"}, "firebase:owner"),
        ({}, "spoofed-owner"),
    ],
)
def test_public_activation_needs_explicit_synthetic_policy_and_verified_owner(changes, owner):
    controls = TransactionDouble()
    with pytest.raises(ControlDenied, match="public_model_controls_required"):
        asyncio.run(reserve_live(cloud_settings(**changes), owner, "key", "mapping", controls))
    assert not controls.keys


def test_control_outage_is_sanitized_and_no_refund_is_issued():
    class Unavailable:
        async def reserve(self, *args):
            raise RuntimeError("secret-token-canary")

    with pytest.raises(ControlDenied, match="^model_controls_unavailable$"):
        asyncio.run(
            reserve_live(cloud_settings(), "firebase:owner", "key", "mapping", Unavailable())
        )


def test_advisor_cloud_policy_denies_before_provider_and_returns_explicit_fallback():
    repo, session = prepared()
    original = repo.get(session.id, "owner")
    # Verified owner is required even when session ownership itself is valid.
    settings = configured(**CLOUD)
    provider = GoodProvider()
    result = run(repo, session, provider, settings=settings, cap=Capability.MAPPING)
    assert provider.calls == 0 and result.state == "FALLBACK"
    assert result.failure_category == "public_model_controls_required"
    assert original.mappings == repo.get(session.id, "owner").mappings


def test_firestore_adapter_builds_one_atomic_pseudonymous_reservation(monkeypatch):
    from google.cloud import firestore
    from movebooks_api.runtime.model_controls import FirestoreModelControls

    # Exercise the SDK port shape without network/emulator credentials. Firestore's
    # actual transaction isolation still needs separately authorized emulator/live evidence.
    monkeypatch.setattr(firestore, "async_transactional", lambda callback: callback)

    class Snapshot:
        def __init__(self, value):
            self.value = value

        def to_dict(self):
            return self.value

    class Reference:
        def __init__(self, client, key):
            self.client, self.key = client, key

        async def get(self, *, transaction, timeout, retry):
            assert transaction is self.client
            return Snapshot(self.client.data.get(self.key))

    class Client:
        def __init__(self):
            self.data = {"policy": dict(POLICY)}

        def collection(self, name):
            assert name == "movebooks_model_controls"
            return self

        def document(self, key):
            return Reference(self, key)

        def transaction(self, *, max_attempts):
            assert max_attempts == 3
            return self

        def set(self, ref, value):
            self.data[ref.key] = value

    client = Client()
    adapter = FirestoreModelControls(cloud_settings(), client)
    asyncio.run(
        adapter.reserve("firebase:private-owner", "private-session:private-request", "mapping")
    )
    reservation = next(v for k, v in client.data.items() if k.startswith("reservation-"))
    assert reservation["reserved_calls"] == 2 and reservation["state"] == "RESERVED"
    assert "private-owner" not in str(client.data) and "private-session" not in str(client.data)
    before = str(client.data)
    with pytest.raises(ControlDenied, match="already_exists"):
        asyncio.run(
            adapter.reserve("firebase:private-owner", "private-session:private-request", "mapping")
        )
    assert str(client.data) == before
    client.data["policy"]["enabled"] = False
    with pytest.raises(ControlDenied, match="kill_switch"):
        asyncio.run(adapter.reserve("firebase:private-owner", "new-request", "mapping"))


def test_reservation_timeout_does_not_block_other_requests_or_call_provider(monkeypatch):
    import movebooks_api.runtime.model_controls as module

    class SlowControls:
        async def reserve(self, *args):
            try:
                await asyncio.sleep(0.3)
            finally:
                # Model an SDK rollback slower than the caller's deadline.
                await asyncio.sleep(0.1)

    async def scenario():
        ticked = asyncio.Event()

        async def ticker():
            await asyncio.sleep(0.01)
            ticked.set()

        task = asyncio.create_task(ticker())
        started = asyncio.get_running_loop().time()
        with pytest.raises(ControlDenied, match="model_controls_timeout"):
            await reserve_live(
                cloud_settings(model_control_timeout_seconds=0.05),
                "firebase:owner",
                "timeout-key",
                "mapping",
                SlowControls(),
            )
        assert ticked.is_set()
        assert asyncio.get_running_loop().time() - started < 0.12
        await task
        await asyncio.sleep(0.12)  # Cancelled rollback finishes before loop closes.

    asyncio.run(scenario())
    repo, session = prepared()
    settings = configured(
        **{
            **CLOUD,
            "synthetic_beta_authorized": True,
            "model_controls_backend": "firestore",
            "model_control_timeout_seconds": 0.05,
        }
    )
    # Owner identity has already been enforced by auth; adapt fixture owner without business writes.
    original = repo.get(session.id, "owner")
    original.owner_subject = "firebase:owner"
    repo.put(original)
    provider = GoodProvider()
    monkeypatch.setattr(module, "FirestoreModelControls", lambda settings: SlowControls())
    from uuid import uuid4

    from movebooks_api.reasoning import request_advice

    from domain.reasoning.models import ReasoningRequest

    result = asyncio.run(
        request_advice(
            repo,
            "firebase:owner",
            session.id,
            Capability.MAPPING,
            ReasoningRequest(request_id=uuid4()),
            settings,
            provider,
        )
    )
    assert result.state == "FALLBACK" and result.failure_category == "model_controls_timeout"
    assert provider.calls == 0


def test_slow_adc_initialization_is_bounded_off_loop_and_not_duplicated(monkeypatch):
    import time

    import movebooks_api.runtime.model_controls as module

    calls = []

    class Factory:
        def __init__(self, settings):
            calls.append("init")
            time.sleep(0.2)

        async def reserve(self, *args):
            calls.append("reserved")

    monkeypatch.setattr(module, "FirestoreModelControls", Factory)

    async def scenario():
        ticked = asyncio.Event()

        async def ticker():
            await asyncio.sleep(0.01)
            ticked.set()

        ticker_task = asyncio.create_task(ticker())
        settings = cloud_settings(model_control_timeout_seconds=0.05)
        for _ in range(2):
            started = asyncio.get_running_loop().time()
            with pytest.raises(ControlDenied, match="model_controls_timeout"):
                await reserve_live(settings, "firebase:owner", "adc-timeout", "mapping")
            assert asyncio.get_running_loop().time() - started < 0.12
            assert ticked.is_set()
        assert calls == ["init"]
        await ticker_task
        await asyncio.sleep(0.15)
        assert calls == ["init"]  # Initialization did not authorize a late inference/reservation.

    asyncio.run(scenario())


def test_operational_completion_preserves_owner_and_never_refunds_or_rewrites():
    import hashlib
    from datetime import UTC, datetime

    from google.cloud import firestore
    from movebooks_api.runtime.model_controls import FirestoreModelControls

    from agents.reasoning.provider import ProviderResult

    owner = "firebase:owner"
    data = {
        "owner_hash": hashlib.sha256(owner.encode()).hexdigest(),
        "state": "RESERVED",
        "reserved_calls": 2,
        "reserved_microusd": 100000,
    }

    class Ref:
        async def get(self, **kwargs):
            class Snapshot:
                update_time = datetime(2026, 10, 17, tzinfo=UTC)

                def to_dict(self):
                    return data.copy()

            return Snapshot()

        async def update(self, values, **kwargs):
            data.update(values)

    class Client:
        write_option = staticmethod(firestore.AsyncClient.write_option)

        def collection(self, name):
            return self

        def document(self, name):
            return Ref()

    adapter = FirestoreModelControls(cloud_settings(), Client())
    usage = ProviderResult("secret-output-not-stored", 1, 1, 100, 50, usage_status="complete")
    asyncio.run(adapter.finish(owner, "key", "FALLBACK", usage))
    assert data["state"] == "FALLBACK" and data["model_calls"] == 1
    assert data["reserved_calls"] == 2 and data["reserved_microusd"] == 100000
    assert "secret-output" not in str(data)
    before = str(data)
    asyncio.run(adapter.finish(owner, "key", "COMPLETED", usage))
    assert str(data) == before
    with pytest.raises(ControlDenied, match="owner_mismatch"):
        asyncio.run(adapter.finish("firebase:other", "key", "COMPLETED", usage))
    with pytest.raises(ControlDenied, match="invalid_operational_outcome"):
        asyncio.run(adapter.finish(owner, "key", "FINANCIALLY_VERIFIED", usage))


def test_competing_completion_cannot_overwrite_terminal_outcome(monkeypatch):
    """Exercise the real SDK precondition against two deliberately stale reads, offline."""
    import hashlib
    from datetime import UTC, datetime, timedelta

    import movebooks_api.runtime.model_controls as module
    from google.api_core.exceptions import FailedPrecondition
    from google.cloud import firestore
    from google.cloud.firestore_v1.types import Write

    from agents.reasoning.provider import ProviderResult

    owner = "firebase:owner"
    original_version = datetime(2026, 10, 17, tzinfo=UTC)
    data = {
        "owner_hash": hashlib.sha256(owner.encode()).hexdigest(),
        "state": "RESERVED",
        "reserved_calls": 2,
        "reserved_microusd": 100000,
    }

    async def scenario():
        both_read = asyncio.Barrier(2)
        current_version = original_version
        writes = []

        class Ref:
            async def get(self, **kwargs):
                from types import SimpleNamespace

                observed = data.copy()
                version = current_version
                await both_read.wait()
                return SimpleNamespace(to_dict=lambda: observed, update_time=version)

            async def update(self, values, *, option, timeout, retry):
                nonlocal current_version
                write = Write()
                option.modify_write(write)
                if write.current_document.update_time != current_version:
                    raise FailedPrecondition("private-error-canary")
                data.update(values)
                current_version += timedelta(microseconds=1)
                writes.append(values["state"])

        class Client:
            write_option = staticmethod(firestore.AsyncClient.write_option)

            def collection(self, name):
                return self

            def document(self, name):
                return Ref()

        adapter = module.FirestoreModelControls(cloud_settings(), Client())

        async def configured(_):
            return adapter

        monkeypatch.setattr(module, "configured_controls", configured)
        usage = ProviderResult("not-stored", 1, 0, 10, 20, usage_status="complete")
        results = await asyncio.gather(
            module.finish_live(cloud_settings(), owner, "key", "COMPLETED", usage),
            module.finish_live(cloud_settings(), owner, "key", "FALLBACK", usage),
        )
        assert sorted(results) == [False, True]
        assert len(writes) == 1 and data["state"] == writes[0]
        assert data["reserved_calls"] == 2 and data["reserved_microusd"] == 100000

    asyncio.run(scenario())


@pytest.mark.parametrize("name", ["", "abc", "UPPER", "a/bc", "other:db", "x" * 64])
def test_invalid_database_names_rejected_before_client_initialization(name):
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        cloud_settings(firestore_database=name)


def test_firestore_client_uses_the_selected_named_database(monkeypatch):
    from google.cloud import firestore
    from movebooks_api.runtime.model_controls import FirestoreModelControls

    calls = []
    monkeypatch.setattr(firestore, "AsyncClient", lambda **kwargs: calls.append(kwargs))
    FirestoreModelControls(cloud_settings())
    assert calls == [{"project": "test-project", "database": "movebooks-operations"}]


def test_control_clients_never_cross_database_cache_boundaries(monkeypatch):
    import movebooks_api.runtime.model_controls as module

    calls = []

    def factory(settings):
        calls.append(settings.firestore_database)
        return object()

    monkeypatch.setattr(module, "FirestoreModelControls", factory)

    async def scenario():
        selected = await module.configured_controls(cloud_settings())
        assert await module.configured_controls(cloud_settings()) is selected
        other = await module.configured_controls(
            cloud_settings(firestore_database="other-controls")
        )
        assert other is not selected

    asyncio.run(scenario())
    assert calls == ["movebooks-operations", "other-controls"]
