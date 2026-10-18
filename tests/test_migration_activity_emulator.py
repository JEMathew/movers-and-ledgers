"""Opt-in local SQLite outbox + real Async Firestore emulator vertical slice.

No cloud schema, credentials, deployed index or application activation is involved.
"""

import asyncio
import json
import os

import pytest
from movebooks_api.runtime.migration_activity import (
    COLLECTION,
    FirestoreMigrationActivitySink,
    MigrationActivityOutbox,
    migration_activity_metadata,
    migration_activity_outbox,
)
from movebooks_api.runtime.persistence import SqlSessionRepository, metadata
from sqlalchemy import create_engine, select, update
from test_firestore_emulator_integration import database

from domain.discovery_assessment.models import MigrationSession
from domain.planning_mapping.models import WorkflowStatus

pytestmark = pytest.mark.skipif(
    os.environ.get("MOVEBOOKS_LOCAL_FIRESTORE_TESTS") != "1",
    reason="Explicit loopback emulator runner required; never use ADC/cloud",
)
KEY = b"emulator-test-only-pseudonym-key-0000"


def local_repo(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path}/outbox.db")
    metadata.create_all(engine)
    migration_activity_metadata.create_all(engine)
    outbox = MigrationActivityOutbox(engine, enabled=True, pseudonym_key=KEY)
    return SqlSessionRepository(engine, migration_activity=outbox), outbox, engine


def sample(owner):
    return MigrationSession(
        owner_subject=owner,
        sample_company_id="harbor-light-migrate-demo",
        company_name="PRIVATE synthetic accounting details must not be emitted",
    )


def test_committed_outbox_real_create_replay_and_owner_filtered_readback(monkeypatch, tmp_path):
    async def scenario():
        repo, outbox, engine = local_repo(tmp_path)
        try:
            async with database(monkeypatch) as (adapter, _):
                sink = FirestoreMigrationActivitySink(adapter.client)
                original = repo.create(sample("firebase:owner-a"))
                other = repo.create(sample("firebase:owner-b"))
                updated = original.model_copy(update={"workflow_status": WorkflowStatus.MIGRATING})
                repo.put_if_unchanged(original, updated)
                assert [item async for item in adapter.client.collection(COLLECTION).stream()] == []
                assert (await outbox.relay(sink, limit=2))["delivered"] == 2
                assert (await outbox.relay(sink))["delivered"] == 1
                assert (await outbox.relay(sink))["delivered"] == 0
                owner_a = await outbox.read(sink, "firebase:owner-a")
                owner_b = await outbox.read(sink, "firebase:owner-b")
                assert len(owner_a["events"]) == 2 and len(owner_b["events"]) == 1
                assert {item["status"] for item in owner_a["events"]} == {"CREATED", "MIGRATING"}
                assert all(
                    set(item) == {"phase", "status", "created_at"} for item in owner_a["events"]
                )
                assert len((await outbox.read(sink, "firebase:owner-a", limit=1))["events"]) == 1
                assert (await outbox.read(sink, "firebase:unknown-owner"))["events"] == []
                # Simulate a lost SQL delivery acknowledgement, not a financial replay.
                with engine.begin() as connection:
                    connection.execute(update(migration_activity_outbox).values(delivered=False))
                assert (await outbox.relay(sink))["delivered"] == 3
                documents = [item async for item in adapter.client.collection(COLLECTION).stream()]
                assert len(documents) == 3
                serialized = json.dumps([item.to_dict() for item in documents])
                assert "PRIVATE" not in serialized
                assert "firebase:" not in serialized
                assert str(original.id) not in serialized
                assert repo.get(original.id, original.owner_subject) == updated
                assert repo.get(other.id, other.owner_subject) == other
        finally:
            engine.dispose()

    asyncio.run(scenario())


def test_existing_distinct_firestore_event_is_never_overwritten(monkeypatch, tmp_path):
    async def scenario():
        repo, outbox, engine = local_repo(tmp_path)
        try:
            async with database(monkeypatch) as (adapter, _):
                sink = FirestoreMigrationActivitySink(adapter.client)
                saved = repo.create(sample("firebase:owner-a"))
                with engine.connect() as connection:
                    row = connection.execute(select(migration_activity_outbox)).mappings().one()
                event = json.loads(row["payload"])
                conflicting = {**event, "status": "DISCOVERED"}
                ref = adapter.client.collection(COLLECTION).document(event["event_key"])
                await ref.create(conflicting)
                assert (await outbox.relay(sink))["failed"] == 1
                assert (await ref.get()).to_dict() == conflicting
                with engine.connect() as connection:
                    row = connection.execute(select(migration_activity_outbox)).mappings().one()
                assert not row["delivered"]
                assert row["error_code"] == "DELIVERY_UNCONFIRMED"
                assert repo.get(saved.id, saved.owner_subject) == saved
        finally:
            engine.dispose()

    asyncio.run(scenario())


def test_financial_or_malformed_firestore_fields_are_not_returned(monkeypatch, tmp_path):
    async def scenario():
        repo, outbox, engine = local_repo(tmp_path)
        try:
            async with database(monkeypatch) as (adapter, _):
                sink = FirestoreMigrationActivitySink(adapter.client)
                repo.create(sample("firebase:owner-a"))
                with engine.connect() as connection:
                    row = connection.execute(select(migration_activity_outbox)).mappings().one()
                value = {**json.loads(row["payload"]), "amount": "PRIVATE 25.00"}
                with pytest.raises(ValueError, match="projection"):
                    await sink.create(value)
                assert [item async for item in adapter.client.collection(COLLECTION).stream()] == []
                # A forged trusted-store record must fail the read projection too.
                await (
                    adapter.client.collection(COLLECTION).document(value["event_key"]).create(value)
                )
                assert await outbox.read(sink, "firebase:owner-a") == {
                    "status": "UNAVAILABLE",
                    "events": [],
                }
                assert (await outbox.read(sink, "firebase:other-owner"))["events"] == []
        finally:
            engine.dispose()

    asyncio.run(scenario())
