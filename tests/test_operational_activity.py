"""Offline SDK-port and API contracts; no Firestore access or deployment evidence."""

import asyncio
import hashlib
import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from movebooks_api.auth import Principal, require_principal
from movebooks_api.operational_activity import router
from movebooks_api.runtime.operational_activity import project_event, read_activity
from movebooks_api.settings import Settings
from test_google_runtime import CLOUD

OWNER = "firebase:accountant"
OWNER_HASH = hashlib.sha256(OWNER.encode()).hexdigest()
NOW = datetime(2026, 10, 17, 10, 30, tzinfo=UTC)


def settings(**changes):
    return Settings(
        **{
            **CLOUD,
            "synthetic_beta_authorized": True,
            "model_controls_backend": "firestore",
            **changes,
        }
    )


def event(**changes):
    return {
        "owner_hash": OWNER_HASH,
        "capability": "mapping",
        "state": "RESERVED",
        "created_at": NOW,
        "reserved_calls": 2,
        "reserved_microusd": 100000,
        **changes,
    }


class Query:
    """Only the exact read/query SDK port is implemented; any write fails the test."""

    def __init__(self, values):
        self.values, self.calls, self.closed = values, [], False

    def collection(self, name):
        assert name == "movebooks_model_controls"
        self.calls.append("collection")
        return self

    def where(self, *, filter):
        assert (filter.field_path, filter.op_string, filter.value) == (
            "owner_hash",
            "==",
            OWNER_HASH,
        )
        self.calls.append("owner_filter")
        return self

    def order_by(self, field, *, direction):
        assert (field, direction) == ("created_at", "DESCENDING")
        self.calls.append("created_desc")
        return self

    def limit(self, count):
        assert count == 20
        self.calls.append("limit20")
        return self

    async def stream(self, *, timeout, retry):
        assert 0 < timeout <= 2 and retry is None
        self.calls.append("stream")
        try:
            for value in self.values:
                yield SimpleNamespace(to_dict=lambda value=value: value)
        finally:
            self.closed = True


def read(values, **changes):
    query = Query(values)
    result = asyncio.run(read_activity(settings(**changes), OWNER, SimpleNamespace(client=query)))
    return result, query


def test_filtered_query_and_strict_projection_never_disclose_payload_ids_or_hashes():
    result, query = read(
        [
            event(
                prompt="secret-prompt",
                owner="private-owner",
                request_id="private-request",
                payload={"amount": "123.45"},
            )
        ]
    )
    assert result["status"] == "AVAILABLE"
    assert query.calls == ["collection", "owner_filter", "created_desc", "limit20", "stream"]
    assert set(result["events"][0]) == {
        "capability",
        "state",
        "created_at",
        "reserved_calls",
        "reserved_microusd",
        "completed_at",
        "model_calls",
        "tool_calls",
        "input_tokens",
        "output_tokens",
        "usage_status",
    }
    text = json.dumps(result)
    for canary in [OWNER_HASH, "secret-prompt", "private-owner", "private-request", "123.45"]:
        assert canary not in text
    assert result["events"][0]["model_calls"] is None


def test_owner_is_independently_verified_even_if_fake_store_ignores_where_filter():
    result, _ = read([event(owner_hash="another-owner"), event(), event(owner_hash=None)])
    assert len(result["events"]) == 1


@pytest.mark.parametrize(
    "changes",
    [
        {"state": "APPROVED"},
        {"capability": "financial-write"},
        {"created_at": "secret-date"},
        {"created_at": NOW.replace(tzinfo=None)},
        {"reserved_calls": True},
        {"reserved_calls": -1},
        {"reserved_calls": 3},
        {"reserved_microusd": "100"},
        {"reserved_microusd": 1_000_000_000_001},
        {"owner_hash": [OWNER_HASH]},
    ],
)
def test_malformed_events_are_omitted_not_echoed_or_treated_as_success(changes):
    result, _ = read([event(**changes)])
    assert result == {"status": "AVAILABLE", "events": []}


def test_query_output_is_bounded_even_when_fake_sdk_ignores_limit():
    result, query = read([event()] * 100)
    assert len(result["events"]) == 20
    assert query.closed


def test_optional_reported_usage_and_completion_are_bounded_and_unknown_is_not_zero():
    projected = project_event(
        event(
            state="COMPLETED",
            completed_at=NOW + timedelta(seconds=1),
            model_calls=1,
            tool_calls=0,
            input_tokens=100,
            output_tokens=20,
            usage_status="complete",
        ),
        OWNER_HASH,
    )
    assert projected["model_calls"] == 1 and projected["tool_calls"] == 0
    assert projected["completed_at"] == "2026-10-17T10:30:01+00:00"
    unknown = project_event(
        event(
            model_calls=True,
            tool_calls=-1,
            input_tokens=2_000_000,
            output_tokens="private-token",
            usage_status="private-status",
            completed_at=NOW + timedelta(seconds=1),
        ),
        OWNER_HASH,
    )
    for key in [
        "model_calls",
        "tool_calls",
        "input_tokens",
        "output_tokens",
        "usage_status",
        "completed_at",
    ]:
        assert unknown[key] is None
    assert (
        project_event(
            event(state="COMPLETED", completed_at=NOW - timedelta(seconds=1)), OWNER_HASH
        )["completed_at"]
        is None
    )


@pytest.mark.parametrize(
    "configured",
    [
        Settings(),
        settings(model_controls_backend="disabled"),
        settings(synthetic_beta_authorized=False),
    ],
)
def test_disabled_mode_never_initializes_adc_or_accesses_store(monkeypatch, configured):
    import movebooks_api.runtime.operational_activity as module

    async def forbidden(_):
        raise AssertionError("disabled must not initialize")

    monkeypatch.setattr(module, "configured_controls", forbidden)
    assert asyncio.run(read_activity(configured, OWNER)) == {"status": "DISABLED", "events": []}


def test_invalid_owner_never_accesses_store():
    assert asyncio.run(read_activity(settings(), "unverified-owner")) == {
        "status": "UNAVAILABLE",
        "events": [],
    }


def test_outages_and_adc_errors_are_sanitized(monkeypatch):
    import movebooks_api.runtime.operational_activity as module

    async def unavailable(_):
        raise RuntimeError("secret-credential-canary")

    monkeypatch.setattr(module, "configured_controls", unavailable)
    assert asyncio.run(read_activity(settings(), OWNER)) == {"status": "UNAVAILABLE", "events": []}


def test_slow_adc_is_off_loop_bounded_and_cached_not_restarted(monkeypatch):
    import time

    import movebooks_api.runtime.model_controls as controls_module

    calls = []

    class SlowFactory:
        def __init__(self, _):
            calls.append("init")
            time.sleep(0.2)
            self.client = Query([event()])

    monkeypatch.setattr(controls_module, "FirestoreModelControls", SlowFactory)

    async def scenario():
        ticked = asyncio.Event()

        async def ticker():
            await asyncio.sleep(0.01)
            ticked.set()

        ticker_task = asyncio.create_task(ticker())
        for _ in range(2):
            start = asyncio.get_running_loop().time()
            result = await read_activity(settings(model_control_timeout_seconds=0.05), OWNER)
            assert result["status"] == "UNAVAILABLE"
            assert asyncio.get_running_loop().time() - start < 0.12
            assert ticked.is_set()
        assert calls == ["init"]
        await ticker_task
        await asyncio.sleep(0.15)

    asyncio.run(scenario())


def test_query_timeout_has_bounded_pending_cleanup_and_recovers():
    class SlowQuery(Query):
        async def stream(self, **kwargs):
            try:
                await asyncio.sleep(0.2)
                yield SimpleNamespace(to_dict=event)
            finally:
                await asyncio.sleep(0.1)

    async def scenario():
        adapter = SimpleNamespace(client=SlowQuery([]))
        cfg = settings(model_control_timeout_seconds=0.05)
        start = asyncio.get_running_loop().time()
        for _ in range(3):
            assert (await read_activity(cfg, OWNER, adapter))["status"] == "UNAVAILABLE"
        assert asyncio.get_running_loop().time() - start < 0.14
        await asyncio.sleep(0.15)
        assert (await read_activity(cfg, OWNER, SimpleNamespace(client=Query([event()]))))[
            "status"
        ] == "AVAILABLE"

    asyncio.run(scenario())


def test_api_requires_auth_has_no_write_route_and_ignores_owner_in_client_parameters(monkeypatch):
    import movebooks_api.operational_activity as module

    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)
    assert client.get("/v1/operations/activity").status_code == 401
    for method in ["post", "put", "patch", "delete"]:
        assert getattr(client, method)("/v1/operations/activity").status_code == 405
    owners = []

    async def reader(cfg, owner):
        owners.append(owner)
        return {"status": "DISABLED", "events": []}

    app.dependency_overrides[require_principal] = lambda: Principal(OWNER, "private@example.test")
    monkeypatch.setattr(module, "read_activity", reader)
    response = client.get("/v1/operations/activity?owner=firebase:other&owner_hash=forged")
    assert response.status_code == 200 and owners == [OWNER]
    assert response.json() == {"status": "DISABLED", "events": []}


def test_source_only_index_and_rules_deny_all_direct_client_reads_and_writes():
    root = Path(__file__).resolve().parents[1]
    index = json.loads((root / "infra/firestore/firestore.indexes.json").read_text())
    assert index["indexes"][0]["fields"] == [
        {"fieldPath": "owner_hash", "order": "ASCENDING"},
        {"fieldPath": "created_at", "order": "DESCENDING"},
    ]
    rules = (root / "infra/firestore/firestore.rules").read_text()
    assert "allow read, write: if false;" in rules and "if true" not in rules


def test_reviewer_operational_outcome_uses_distinct_allowlisted_capability():
    from movebooks_api.operational_activity import OperationalEvent

    result, _ = read(
        [
            event(
                capability="mapping-review",
                state="FALLBACK",
                completed_at=NOW + timedelta(seconds=1),
                model_calls=1,
            )
        ]
    )
    assert result["events"][0]["capability"] == "mapping-review"
    assert OperationalEvent.model_validate(result["events"][0]).model_calls == 1
