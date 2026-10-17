"""Offline transactional and privacy contracts; no Google credentials or network."""

import asyncio
import json
import sqlite3
from copy import deepcopy
from types import SimpleNamespace

import pytest
from movebooks_api.runtime.migration_activity import (
    COLLECTION,
    STATUS_PHASE,
    FirestoreMigrationActivitySink,
    MigrationActivityOutbox,
    migration_activity_metadata,
    migration_activity_outbox,
    validate_event,
)
from movebooks_api.runtime.persistence import SqlSessionRepository, encode, metadata, sessions
from sqlalchemy import create_engine, event, select, update
from sqlalchemy.exc import OperationalError
from sqlalchemy.pool import StaticPool

from domain.discovery_assessment.models import MigrationSession
from domain.planning_mapping.models import WorkflowStatus

KEY = b"offline-test-only-not-a-real-secret-0001"


class MemorySink:
    def __init__(self):
        self.events = {}
        self.calls = 0
        self.fail = False
        self.after_write_fail = False

    async def create(self, value):
        self.calls += 1
        if self.fail:
            raise RuntimeError("PRIVATE SDK CREDENTIAL DETAILS")
        if value["event_key"] in self.events:
            assert self.events[value["event_key"]] == value
        self.events[value["event_key"]] = deepcopy(value)
        if self.after_write_fail:
            raise TimeoutError("The delivery response was lost")

    async def read(self, owner_key, *, limit):
        return [value for value in self.events.values() if value["owner_key"] == owner_key][:limit]


@pytest.fixture
def local(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path}/local-only.db")
    metadata.create_all(engine)
    # Explicit local test schema only; the application's schema bootstrap is unchanged.
    migration_activity_metadata.create_all(engine)
    outbox = MigrationActivityOutbox(engine, enabled=True, pseudonym_key=KEY)
    repo = SqlSessionRepository(engine, migration_activity=outbox)
    yield repo, outbox, engine
    engine.dispose()


def sample(owner="owner-a"):
    return MigrationSession(
        owner_subject=owner,
        sample_company_id="harbor-light-migrate-demo",
        company_name="PRIVATE COMPANY financial amount 123456.78",
    )


def rows(engine):
    with engine.connect() as connection:
        return connection.execute(select(migration_activity_outbox)).mappings().all()


def test_disabled_feature_has_no_optional_schema_queries_or_delivery(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path}/default.db")
    metadata.create_all(engine)  # No outbox table is created.
    disabled = MigrationActivityOutbox(engine)
    repo = SqlSessionRepository(engine, migration_activity=disabled)
    original = repo.create(sample())
    updated = original.model_copy(update={"workflow_status": WorkflowStatus.DISCOVERED})
    assert repo.put_if_unchanged(original, updated) == updated
    sink = MemorySink()
    assert asyncio.run(disabled.relay(sink))["status"] == "DISABLED"
    assert asyncio.run(disabled.read(sink, "owner-a")) == {"status": "DISABLED", "events": []}
    assert sink.calls == 0
    assert migration_activity_outbox.name not in metadata.tables
    engine.dispose()


@pytest.mark.parametrize("key", [None, b"short", "a" * 32])
def test_activation_requires_an_explicit_secret_key(local, key):
    with pytest.raises(ValueError, match="explicit pseudonym key"):
        MigrationActivityOutbox(local[2], enabled=True, pseudonym_key=key)


def test_activation_cannot_enable_a_cloud_sql_engine():
    postgres = SimpleNamespace(dialect=SimpleNamespace(name="postgresql"))
    with pytest.raises(ValueError, match="SQLite"):
        MigrationActivityOutbox(postgres, enabled=True, pseudonym_key=KEY)


@pytest.mark.parametrize("shared", [False, True])
def test_enabled_feature_rejects_memory_and_shared_single_connection_pools(tmp_path, shared):
    engine = create_engine(
        f"sqlite:///{tmp_path}/shared.db" if shared else "sqlite:///:memory:",
        **({"poolclass": StaticPool} if shared else {}),
    )
    try:
        with pytest.raises(ValueError, match="file-backed SQLite with independent connections"):
            MigrationActivityOutbox(engine, enabled=True, pseudonym_key=KEY)
    finally:
        engine.dispose()


def test_relay_during_open_financial_transaction_cannot_observe_uncommitted_event(local):
    repo, outbox, engine = local
    original = repo.create(sample())
    sink = MemorySink()
    assert asyncio.run(outbox.relay(sink))["delivered"] == 1
    observed = []

    def before_commit(connection, cursor, statement, parameters, context, executemany):
        if statement.startswith("INSERT INTO migration_activity_outbox"):
            # This runs after the outbox INSERT but before its financial transaction commits.
            assert connection.in_transaction()
            with engine.connect() as independent:
                assert (
                    independent.connection.driver_connection
                    is not connection.connection.driver_connection
                )
            assert repo.get(original.id, original.owner_subject) == original
            observed.append(asyncio.run(outbox.relay(sink)))
            assert len(sink.events) == 1

    event.listen(engine, "after_cursor_execute", before_commit)
    updated = original.model_copy(update={"workflow_status": WorkflowStatus.DISCOVERED})
    repo.put_if_unchanged(original, updated)
    event.remove(engine, "after_cursor_execute", before_commit)
    assert len(observed) == 1 and observed[0]["delivered"] == 0
    assert asyncio.run(outbox.relay(sink))["delivered"] == 1
    assert {value["status"] for value in sink.events.values()} == {"CREATED", "DISCOVERED"}


def test_successful_create_and_cas_emit_only_committed_phase_changes(local):
    repo, outbox, engine = local
    original = repo.create(sample())
    updated = original.model_copy(update={"workflow_status": WorkflowStatus.DISCOVERED})
    before_bytes = encode(updated)
    repo.put_if_unchanged(original, updated)
    # A same-status mutation is not a fabricated phase transition.
    renamed = updated.model_copy(update={"company_name": "PRIVATE ANOTHER NAME"})
    repo.put_if_unchanged(updated, renamed)
    assert len(rows(engine)) == 2
    assert before_bytes == encode(updated)
    sink = MemorySink()

    async def delivery():
        assert repo.get(original.id, original.owner_subject) == renamed
        assert await outbox.relay(sink) == {
            "status": "AVAILABLE",
            "delivered": 2,
            "failed": 0,
            "quarantined": 0,
        }
        return await outbox.read(sink, "owner-a")

    activity = asyncio.run(delivery())
    assert {value["status"] for value in activity["events"]} == {"CREATED", "DISCOVERED"}
    assert all(value["phase"] == "UNDERSTAND" for value in activity["events"])
    serialized = json.dumps([dict(row) for row in rows(engine)])
    for private in ("PRIVATE", "123456.78", "owner-a", str(original.id), "snapshot", "actor"):
        assert private not in serialized
    assert repo.get(original.id, "other-owner") is None


def test_failed_cas_and_rolled_back_session_create_never_enqueue(local):
    repo, _, engine = local
    original = repo.create(sample())
    updated = original.model_copy(update={"workflow_status": WorkflowStatus.DISCOVERED})
    repo.put_if_unchanged(original, updated)
    with pytest.raises(ValueError, match="concurrently"):
        repo.put_if_unchanged(
            original, original.model_copy(update={"workflow_status": WorkflowStatus.ASSESSED})
        )
    assert len(rows(engine)) == 2
    with pytest.raises(ValueError, match="already exists"):
        repo.create(original)
    assert len(rows(engine)) == 2


def test_outbox_insert_failure_rolls_back_financial_cas(local):
    repo, _, engine = local
    original = repo.create(sample())

    def reject_insert(connection, cursor, statement, parameters, context, executemany):
        if statement.startswith("INSERT INTO migration_activity_outbox"):
            raise OperationalError(
                "offline injected rollback", {}, sqlite3.OperationalError("injected")
            )

    event.listen(engine, "before_cursor_execute", reject_insert)
    updated = original.model_copy(update={"workflow_status": WorkflowStatus.DISCOVERED})
    with pytest.raises(OperationalError):
        repo.put_if_unchanged(original, updated)
    event.remove(engine, "before_cursor_execute", reject_insert)
    assert repo.get(original.id, original.owner_subject) == original
    assert len(rows(engine)) == 1


def test_failed_sql_create_leaves_no_financial_row_or_event(local):
    repo, _, engine = local

    def reject_insert(connection, cursor, statement, parameters, context, executemany):
        if statement.startswith("INSERT INTO migration_activity_outbox"):
            raise OperationalError(
                "offline injected rollback", {}, sqlite3.OperationalError("injected")
            )

    event.listen(engine, "before_cursor_execute", reject_insert)
    value = sample()
    with pytest.raises(OperationalError):
        repo.create(value)
    event.remove(engine, "before_cursor_execute", reject_insert)
    assert repo.get(value.id, value.owner_subject) is None
    assert rows(engine) == []


def test_relay_failure_and_ambiguous_response_retry_preserve_financial_state(local):
    repo, outbox, engine = local
    saved = repo.create(sample())
    sink = MemorySink()
    sink.fail = True
    result = asyncio.run(outbox.relay(sink))
    assert result["failed"] == 1 and result["delivered"] == 0
    assert rows(engine)[0]["error_code"] == "DELIVERY_UNCONFIRMED"
    assert "PRIVATE" not in json.dumps(result)
    sink.fail = False
    sink.after_write_fail = True
    assert asyncio.run(outbox.relay(sink))["failed"] == 1
    assert len(sink.events) == 1
    sink.after_write_fail = False
    assert asyncio.run(outbox.relay(sink))["delivered"] == 1
    assert len(sink.events) == 1  # Lost response replay never creates a duplicate.
    assert asyncio.run(outbox.relay(sink))["delivered"] == 0
    assert rows(engine)[0]["attempts"] == 3
    assert repo.get(saved.id, saved.owner_subject) == saved


def test_failed_delivery_ack_is_retried_without_overwriting_or_replaying_finance(local):
    repo, outbox, engine = local
    saved = repo.create(sample())
    sink = MemorySink()

    def fail_ack(connection, cursor, statement, parameters, context, executemany):
        if (
            statement.startswith("UPDATE migration_activity_outbox")
            and "SET delivered=" in statement
        ):
            raise OperationalError("offline lost ack", {}, sqlite3.OperationalError("injected"))

    event.listen(engine, "before_cursor_execute", fail_ack)
    assert asyncio.run(outbox.relay(sink))["failed"] == 1
    event.remove(engine, "before_cursor_execute", fail_ack)
    assert len(sink.events) == 1
    assert not rows(engine)[0]["delivered"]
    assert asyncio.run(outbox.relay(sink))["delivered"] == 1
    assert len(sink.events) == 1
    assert repo.get(saved.id, saved.owner_subject) == saved


def test_owner_isolation_read_limit_and_untrusted_readback(local):
    repo, outbox, _ = local
    repo.create(sample("owner-a"))
    repo.create(sample("owner-b"))
    sink = MemorySink()
    asyncio.run(outbox.relay(sink))
    owner_a = asyncio.run(outbox.read(sink, "owner-a", limit=1))
    owner_b = asyncio.run(outbox.read(sink, "owner-b"))
    assert len(owner_a["events"]) == len(owner_b["events"]) == 1
    assert set(owner_a["events"][0]) == {"phase", "status", "created_at"}

    async def wrong_owner(owner_key, *, limit):
        return [
            value
            for value in sink.events.values()
            if value["owner_key"] == outbox.owner_key("owner-b")
        ]

    sink.read = wrong_owner
    assert asyncio.run(outbox.read(sink, "owner-a")) == {"status": "UNAVAILABLE", "events": []}
    for limit in (0, 21, True, "1"):
        with pytest.raises(ValueError, match="limit"):
            asyncio.run(outbox.read(sink, "owner-a", limit=limit))


def test_malformed_financial_projection_is_quarantined_before_any_delivery(local):
    repo, outbox, engine = local
    repo.create(sample())
    row = rows(engine)[0]
    payload = json.loads(row["payload"])
    payload["amount"] = "PRIVATE 999.99"
    with engine.begin() as connection:
        connection.execute(update(migration_activity_outbox).values(payload=json.dumps(payload)))
    sink = MemorySink()
    assert asyncio.run(outbox.relay(sink))["quarantined"] == 1
    assert sink.calls == 0
    assert asyncio.run(outbox.relay(sink))["quarantined"] == 0
    assert rows(engine)[0]["error_code"] == "INVALID_PROJECTION"


@pytest.mark.parametrize(
    "changes",
    [
        {"status": "PRIVATE_RAW_FINANCIAL_ERROR"},
        {"phase": "MOVE", "status": "CONFIGURED"},
        {"schema_version": True},
        {"created_at": "2026-99-17T00:00:00.000000Z"},
        {"created_at": "2026-10-17T00:00:00"},
        {"owner_key": "raw-user-id"},
        {"actor": "PRIVATE@customer.example"},
        {"amount": 99},
        {"snapshot": {}},
    ],
)
def test_projection_rejects_bad_enums_times_owner_or_financial_fields(local, changes):
    repo, _, engine = local
    repo.create(sample())
    value = json.loads(rows(engine)[0]["payload"])
    with pytest.raises(ValueError):
        validate_event({**value, **changes})


def test_enum_coverage_and_pseudonym_domain_separation(local):
    _, outbox, _ = local
    assert set(STATUS_PHASE) == {str(status) for status in WorkflowStatus}
    assert outbox.pseudonym("owner", "same") != outbox.pseudonym("event", "same")
    assert COLLECTION != "movebooks_model_controls"
    another = MigrationActivityOutbox(local[2], enabled=True, pseudonym_key=b"x" * 32)
    assert outbox.owner_key("owner-a") != another.owner_key("owner-a")


def test_incomplete_enum_projection_fails_activation_before_financial_use(local, monkeypatch):
    monkeypatch.delitem(STATUS_PHASE, "DISCOVERED")
    with pytest.raises(ValueError, match="projection is incomplete"):
        MigrationActivityOutbox(local[2], enabled=True, pseudonym_key=KEY)
    assert not MigrationActivityOutbox(local[2]).enabled


def test_relay_batch_limit_preserves_remaining_pending_events(local):
    repo, outbox, engine = local
    for owner in ("owner-a", "owner-b", "owner-c"):
        repo.create(sample(owner))
    sink = MemorySink()
    assert asyncio.run(outbox.relay(sink, limit=2))["delivered"] == 2
    assert sum(bool(row["delivered"]) for row in rows(engine)) == 2
    assert asyncio.run(outbox.relay(sink, limit=2))["delivered"] == 1
    assert len(sink.events) == 3
    with pytest.raises(ValueError, match="limit"):
        asyncio.run(outbox.relay(sink, limit=11))


@pytest.mark.parametrize(
    "host", [None, "firestore.googleapis.com:443", "localhost", "a@localhost:9"]
)
def test_sink_rejects_nonlocal_or_missing_emulator_client(host):
    with pytest.raises(ValueError, match="emulator|endpoint"):
        FirestoreMigrationActivitySink(SimpleNamespace(_emulator_host=host))


def test_delivery_deadline_leaves_event_pending_and_sanitizes_read_failures(local):
    repo, _, engine = local
    outbox = MigrationActivityOutbox(engine, enabled=True, pseudonym_key=KEY, timeout_seconds=0.01)
    repo.create(sample())

    class SlowSink(MemorySink):
        async def create(self, value):
            await asyncio.sleep(1)

        async def read(self, owner_key, *, limit):
            raise RuntimeError("PRIVATE credentials")

    assert asyncio.run(outbox.relay(SlowSink()))["failed"] == 1
    assert not rows(engine)[0]["delivered"]
    assert asyncio.run(outbox.read(SlowSink(), "owner-a")) == {
        "status": "UNAVAILABLE",
        "events": [],
    }


def test_relay_never_writes_financial_table(local):
    repo, outbox, engine = local
    repo.create(sample())
    statements = []

    def record(connection, cursor, statement, parameters, context, executemany):
        statements.append(statement)

    event.listen(engine, "before_cursor_execute", record)
    asyncio.run(outbox.relay(MemorySink()))
    event.remove(engine, "before_cursor_execute", record)
    assert not any(sessions.name in statement for statement in statements)
