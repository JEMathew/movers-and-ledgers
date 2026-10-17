"""Optional local transactional outbox for sanitized migration-phase telemetry.

This metadata is deliberately separate from the financial schema bootstrap. Neither this
module nor the application creates tables, clients, indexes or cloud resources. The sink
accepts an explicitly injected loopback Firestore emulator client only.
"""

import asyncio
import hashlib
import hmac
import json
import re
from contextlib import aclosing
from datetime import UTC, datetime
from urllib.parse import urlparse

from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    insert,
    select,
    update,
)
from sqlalchemy.pool import NullPool, QueuePool

from domain.planning_mapping.models import WorkflowStatus

migration_activity_metadata = MetaData()
migration_activity_outbox = Table(
    "migration_activity_outbox_v1",
    migration_activity_metadata,
    Column("event_key", String(64), primary_key=True),
    Column("owner_key", String(64), nullable=False, index=True),
    Column("created_at", String(27), nullable=False),
    Column("payload", Text, nullable=False),
    Column("delivered", Boolean, nullable=False, default=False),
    Column("quarantined", Boolean, nullable=False, default=False),
    Column("attempts", Integer, nullable=False, default=0),
    Column("error_code", String(24), nullable=True),
)

PHASE_STATUSES = {
    "UNDERSTAND": {"CREATED", "DISCOVERED", "ASSESSED"},
    "PREPARE": {"PLANNED", "MAPPING", "AWAITING_APPROVAL", "APPROVED", "MIGRATION_READY"},
    "MOVE": {
        "MIGRATING",
        "MIGRATION_PAUSED",
        "RESOLVING",
        "RETRY_PENDING",
        "MIGRATION_COMPLETE",
        "MIGRATION_BLOCKED",
    },
    "VERIFY": {
        "VALIDATING",
        "VALIDATION_BLOCKED",
        "VALIDATED",
        "CONFIGURING",
        "CONFIGURATION_REVIEW_REQUIRED",
        "CONFIGURED",
    },
    "START": {
        "ONBOARDING",
        "ONBOARDING_BLOCKED",
        "READY_FOR_FIRST_PRODUCTIVE_USE",
        "FIRST_PRODUCTIVE_USE_IN_PROGRESS",
        "FIRST_PRODUCTIVE_USE_BLOCKED",
        "VERIFIED_FIRST_PRODUCTIVE_USE",
    },
}
STATUS_PHASE = {status: phase for phase, statuses in PHASE_STATUSES.items() for status in statuses}
EVENT_KEYS = {
    "schema_version",
    "event_key",
    "owner_key",
    "journey_key",
    "phase",
    "status",
    "created_at",
}
HEX_KEY = re.compile(r"[0-9a-f]{64}\Z")
MAX_EVENTS = 20
MAX_PAYLOAD_BYTES = 1024
COLLECTION = "movebooks_migration_activity"


def validate_event(value, owner_key=None):
    """Reject extra fields, unknown enums, mismatched phases/owners and invalid times."""
    if not isinstance(value, dict) or set(value) != EVENT_KEYS:
        raise ValueError("Invalid migration activity projection")
    if type(value["schema_version"]) is not int or value["schema_version"] != 1:
        raise ValueError("Invalid migration activity schema")
    if any(
        not isinstance(value[k], str) or not HEX_KEY.fullmatch(value[k])
        for k in ("event_key", "owner_key", "journey_key")
    ):
        raise ValueError("Invalid migration activity pseudonym")
    status, phase = value["status"], value["phase"]
    if not isinstance(status, str) or STATUS_PHASE.get(status) != phase:
        raise ValueError("Invalid migration activity phase/status")
    if owner_key is not None and value["owner_key"] != owner_key:
        raise ValueError("Migration activity owner mismatch")
    created = value["created_at"]
    if not isinstance(created, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z", created
    ):
        raise ValueError("Invalid migration activity time")
    try:
        parsed = datetime.fromisoformat(created.replace("Z", "+00:00"))
    except ValueError:
        raise ValueError("Invalid migration activity time") from None
    if parsed.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S.%fZ") != created:
        raise ValueError("Invalid migration activity time")
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"))
    if len(encoded.encode()) > MAX_PAYLOAD_BYTES:
        raise ValueError("Migration activity capacity exceeded")
    return dict(value)


def bounded_limit(limit, maximum=MAX_EVENTS):
    if type(limit) is not int or not 1 <= limit <= maximum:
        raise ValueError("Invalid migration activity limit")
    return limit


class MigrationActivityOutbox:
    """SQLite-only local slice; feature is absent from the default repository factory.

    Enqueue runs inside the financial transaction after its successful CAS. Relay runs
    separately, reads committed rows only and cannot write the financial session table.
    """

    def __init__(self, engine, *, enabled=False, pseudonym_key=None, timeout_seconds=2):
        self.engine = engine
        self.enabled = enabled is True
        if self.enabled and set(WorkflowStatus) != set(STATUS_PHASE):
            raise ValueError("Migration activity workflow projection is incomplete")
        if self.enabled and (
            engine.dialect.name != "sqlite"
            or not engine.url.database
            or engine.url.database == ":memory:"
            or engine.url.database.startswith("file:")
            or engine.url.query.get("mode") == "memory"
            or not isinstance(engine.pool, NullPool | QueuePool)
            or not isinstance(pseudonym_key, bytes)
            or not 32 <= len(pseudonym_key) <= 128
        ):
            raise ValueError(
                "Local activity requires file-backed SQLite with independent connections "
                "and an explicit pseudonym key"
            )
        if isinstance(timeout_seconds, bool) or not 0.01 <= timeout_seconds <= 2:
            raise ValueError("Invalid local activity deadline")
        self._key = pseudonym_key
        self.timeout_seconds = timeout_seconds

    def pseudonym(self, kind, value):
        if not self.enabled:
            raise ValueError("Migration activity is disabled")
        if kind not in {"owner", "journey", "event"}:
            raise ValueError("Invalid activity pseudonym kind")
        return hmac.new(self._key, f"{kind}-v1\0{value}".encode(), hashlib.sha256).hexdigest()

    def owner_key(self, owner):
        if (
            not isinstance(owner, str)
            or not 1 <= len(owner) <= 256
            or any(ord(letter) < 32 for letter in owner)
        ):
            raise ValueError("Invalid activity owner")
        return self.pseudonym("owner", owner)

    def enqueue(self, connection, original, updated, encoded_digest):
        if not self.enabled:
            return
        if connection.engine is not self.engine or not connection.in_transaction():
            raise ValueError("Activity must join its local financial transaction")
        if original and original.workflow_status == updated.workflow_status:
            return  # Mapping edits/reads are not invented phase transitions.
        if not updated.synthetic or updated.source_kind != "synthetic_sample":
            raise ValueError("Local activity accepts synthetic sample journeys only")
        status = WorkflowStatus(updated.workflow_status).value
        owner_key = self.owner_key(updated.owner_subject)
        journey_key = self.pseudonym("journey", f"{owner_key}:{updated.id}")
        previous = str(original.workflow_status) if original else "INITIAL"
        event_key = self.pseudonym(
            "event", f"{owner_key}:{journey_key}:{previous}:{encoded_digest}"
        )
        event = validate_event(
            {
                "schema_version": 1,
                "event_key": event_key,
                "owner_key": owner_key,
                "journey_key": journey_key,
                "phase": STATUS_PHASE[status],
                "status": status,
                "created_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            }
        )
        connection.execute(
            insert(migration_activity_outbox).values(
                event_key=event_key,
                owner_key=owner_key,
                created_at=event["created_at"],
                payload=json.dumps(event, sort_keys=True, separators=(",", ":")),
                delivered=False,
                quarantined=False,
                attempts=0,
            )
        )

    async def relay(self, sink, *, limit=10):
        """At most ten events, two-second cooperative timeout per event (up to twenty).

        This is not a hard total deadline for arbitrary uncooperative injected sinks.
        Failed/ambiguous delivery remains pending; no financial result is inferred.
        """
        bounded_limit(limit, 10)
        result = {"status": "DISABLED", "delivered": 0, "failed": 0, "quarantined": 0}
        if not self.enabled:
            return result
        result["status"] = "AVAILABLE"
        table = migration_activity_outbox
        with self.engine.connect() as connection:
            rows = (
                connection.execute(
                    select(table)
                    .where(table.c.delivered.is_(False), table.c.quarantined.is_(False))
                    .order_by(table.c.created_at, table.c.event_key)
                    .limit(limit)
                )
                .mappings()
                .all()
            )
        for row in rows:
            try:
                event = validate_event(json.loads(row["payload"]), row["owner_key"])
                if event["event_key"] != row["event_key"]:
                    raise ValueError("Outbox identity mismatch")
            except (ValueError, TypeError):
                with self.engine.begin() as connection:
                    connection.execute(
                        update(table)
                        .where(table.c.event_key == row["event_key"], table.c.delivered.is_(False))
                        .values(quarantined=True, error_code="INVALID_PROJECTION")
                    )
                result["quarantined"] += 1
                continue
            with self.engine.begin() as connection:
                claimed = connection.execute(
                    update(table)
                    .where(
                        table.c.event_key == row["event_key"],
                        table.c.delivered.is_(False),
                        table.c.attempts == row["attempts"],
                        table.c.quarantined.is_(False),
                    )
                    .values(attempts=min(row["attempts"] + 1, 1_000_000), error_code=None)
                )
            if claimed.rowcount != 1:
                continue
            try:
                await asyncio.wait_for(sink.create(event), timeout=self.timeout_seconds)
                with self.engine.begin() as connection:
                    connection.execute(
                        update(table)
                        .where(table.c.event_key == row["event_key"], table.c.delivered.is_(False))
                        .values(delivered=True, error_code=None)
                    )
                result["delivered"] += 1
            except asyncio.CancelledError:
                raise  # Committed rows remain pending, never inferred as delivered.
            except Exception:
                result["failed"] += 1
                try:
                    with self.engine.begin() as connection:
                        connection.execute(
                            update(table)
                            .where(
                                table.c.event_key == row["event_key"], table.c.delivered.is_(False)
                            )
                            .values(error_code="DELIVERY_UNCONFIRMED")
                        )
                except Exception:
                    pass  # A failed acknowledgement cannot alter financial authority.
        return result

    async def read(self, sink, owner, *, limit=MAX_EVENTS):
        """Caller supplies the authenticated owner, never a client-chosen owner hash."""
        bounded_limit(limit)
        if not self.enabled:
            return {"status": "DISABLED", "events": []}
        try:
            owner_key = self.owner_key(owner)
            values = await asyncio.wait_for(
                sink.read(owner_key, limit=limit), timeout=self.timeout_seconds
            )
            if not isinstance(values, list) or len(values) > limit:
                raise ValueError("Invalid activity read capacity")
            validated = [validate_event(value, owner_key) for value in values]
            # The owner envelope is internal. Readback reveals no owner or journey hash.
            events = [
                {key: event[key] for key in ("phase", "status", "created_at")}
                for event in validated
            ]
            return {"status": "AVAILABLE", "events": events}
        except asyncio.CancelledError:
            raise
        except Exception:
            return {"status": "UNAVAILABLE", "events": []}


class FirestoreMigrationActivitySink:
    """Injected loopback emulator only; never discovers credentials or creates a client.

    A future cloud adapter requires its own collection/index and release authorization.
    Required future index: owner_key ASC, created_at DESC on movebooks_migration_activity.
    The advisory-reservation index does not cover this collection's readback query.
    """

    def __init__(self, client):
        host = getattr(client, "_emulator_host", None)
        parsed = urlparse(f"http://{host}") if isinstance(host, str) else None
        if not parsed or parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
            raise ValueError("Migration activity accepts an explicit local emulator client only")
        try:
            port = parsed.port
        except ValueError:
            port = None
        if (
            not port
            or parsed.username
            or parsed.password
            or parsed.path
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError("Invalid local activity emulator endpoint")
        self.client = client

    async def create(self, value):
        from google.api_core.exceptions import AlreadyExists

        event = validate_event(value)
        ref = self.client.collection(COLLECTION).document(event["event_key"])
        try:
            await ref.create(event, timeout=2, retry=None)
        except AlreadyExists:
            snapshot = await ref.get(timeout=2, retry=None)
            if validate_event(snapshot.to_dict(), event["owner_key"]) != event:
                raise ValueError("Conflicting migration activity event") from None

    async def read(self, owner_key, *, limit=MAX_EVENTS):
        from google.cloud.firestore_v1.base_query import FieldFilter

        bounded_limit(limit)
        if not isinstance(owner_key, str) or not HEX_KEY.fullmatch(owner_key):
            raise ValueError("Invalid activity owner key")
        query = (
            self.client.collection(COLLECTION)
            .where(filter=FieldFilter("owner_key", "==", owner_key))
            .order_by("created_at", direction="DESCENDING")
            .limit(limit)
        )
        events = []
        async with aclosing(query.stream(timeout=2, retry=None)) as stream:
            async for snapshot in stream:
                events.append(validate_event(snapshot.to_dict(), owner_key))
                if len(events) >= limit:
                    break
        return events
