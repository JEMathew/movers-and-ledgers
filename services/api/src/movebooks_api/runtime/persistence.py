"""Transactional session snapshots. PostgreSQL in cloud; SQLite only for offline tests."""

import hashlib
import json
import threading

from sqlalchemy import (
    Column,
    MetaData,
    String,
    Table,
    Text,
    cast,
    func,
    insert,
    select,
    tuple_,
    update,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.exc import DatabaseError, IntegrityError, OperationalError

from domain.discovery_assessment.models import MigrationSession
from movebooks_api.discover_assess import listing

metadata = MetaData()
sessions = Table(
    "migration_sessions",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("owner", String(256), nullable=False, index=True),
    Column("digest", String(64), nullable=False),
    Column("snapshot", Text, nullable=False),
)


# Optional plan fields added in V1.0. Rows written before them have no such keys, so an
# unset value is not stored: a harmless read never changes a row's concurrency identity, and
# a session that does not use them stays in the shape the previous release can still write.
OPTIONAL_PLAN_FIELDS = ("summary", "approval")


def encode(session, *, explicit_nulls=False):
    # Private fields intentionally excluded from API serialization must not be lost.
    # Raw uploads cannot enter durable storage by reusing the ordinary session port.
    if session.source_kind != "synthetic_sample" or session.uploaded_source is not None:
        raise ValueError("Uploaded workspaces are local-only; durable intake is not enabled.")
    payload = {
        "schema": 1,
        "owner": session.owner_subject,
        "session": session.model_dump(mode="json"),
    }
    # Keep pre-reconsideration snapshots byte-compatible for optimistic CAS. Old
    # rows have no empty list field; decoding supplies it without a schema rewrite.
    for mapping in payload["session"]["mappings"]:
        if not mapping["reconsiderations"]:
            mapping.pop("reconsiderations")
    if not payload["session"]["review_records"]:
        payload["session"].pop("review_records")
    if not payload["session"]["reasoning_records"]:
        payload["session"].pop("reasoning_records")
    plan = payload["session"]["plan"]
    if plan and not explicit_nulls:
        for key in OPTIONAL_PLAN_FIELDS:
            if plan[key] is None:
                plan.pop(key)
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    if len(encoded.encode()) > 16 * 1024 * 1024:
        raise ValueError("Session evidence capacity reached; no state was committed.")
    return encoded


def digest(encoded):
    return hashlib.sha256(encoded.encode()).hexdigest()


def stored_digests(session):
    """Every digest a stored row may carry for exactly this state: the canonical encoding,
    and the V1.0 (3bd23d0) encoding that wrote unset optional plan fields as explicit nulls.
    Each encodes the same state, so compare-and-swap still fails on any real concurrent change."""
    return {digest(encode(session)), digest(encode(session, explicit_nulls=True))}


def decode(encoded, owner):
    data = json.loads(encoded)
    if data["schema"] != 1 or data["owner"] != owner:
        raise ValueError("Stored session schema or owner mismatch")
    return MigrationSession.model_validate({**data["session"], "owner_subject": owner})


class SqlSessionRepository:
    def __init__(self, engine, *, migration_activity=None):
        self.engine = engine
        if migration_activity is not None and migration_activity.engine is not engine:
            raise ValueError("Migration activity must use the same local transaction engine")
        self.migration_activity = migration_activity

    def _enqueue_activity(self, connection, original, updated, encoded_digest):
        activity = getattr(self, "migration_activity", None)
        if activity is not None:
            activity.enqueue(connection, original, updated, encoded_digest)

    def ready(self):
        with self.engine.connect() as connection:
            connection.execute(select(sessions.c.id).limit(1))

    def put(self, session):
        """Insert only. Existing state can only be mutated through atomic CAS."""
        encoded = encode(session)
        try:
            with self.engine.begin() as connection:
                connection.execute(
                    insert(sessions).values(
                        id=str(session.id),
                        owner=session.owner_subject,
                        digest=digest(encoded),
                        snapshot=encoded,
                    )
                )
                self._enqueue_activity(connection, None, session, digest(encoded))
        except DatabaseError as error:
            # The Cloud SQL connector uses pg8000.dbapi rather than pg8000's
            # legacy connection. Its unique violation is a plain DatabaseError.
            # Classify only the structured SQLSTATE, never localized error text.
            fields = error.orig.args[0] if error.orig.args else None
            unique_violation = isinstance(fields, dict) and fields.get("C") == "23505"
            if not isinstance(error, IntegrityError) and not unique_violation:
                raise
            raise ValueError("Session already exists; refresh before retrying.") from error
        return session.model_copy(deep=True)

    def create(self, session):
        """put is already insert-only: an existing ID is a unique violation, never a replace."""
        return self.put(session)

    def get(self, session_id, owner_subject):
        with self.engine.connect() as connection:
            row = connection.execute(
                select(sessions.c.snapshot, sessions.c.digest).where(
                    sessions.c.id == str(session_id),
                    sessions.c.owner == owner_subject,
                )
            ).first()
        if row and digest(row[0]) != row[1]:
            raise ValueError("Stored session integrity check failed")
        return decode(row[0], owner_subject) if row else None

    def _created_at_expr(self):
        """Creation time inside the stored snapshot (there is no created_at column)."""
        name = self.engine.dialect.name
        if name == "postgresql":
            return cast(sessions.c.snapshot, JSONB)["session"]["created_at"].astext
        if name == "sqlite":
            return func.json_extract(sessions.c.snapshot, "$.session.created_at")
        return None

    def _list_ordered(self, owner_subject, *, after, limit):
        """Exact newest-first order computed by the database; only the page is decoded here.

        The owner filter stays in the WHERE clause. Returns None to request the bounded scan:
        unsupported dialect, too many rows to order server-side, or any unreadable snapshot.
        """
        created = self._created_at_expr()
        if created is None:
            return None
        with self.engine.connect() as connection:
            total = connection.execute(
                select(func.count()).select_from(sessions).where(sessions.c.owner == owner_subject)
            ).scalar_one()
            if total > listing.MAX_SORT_ROWS:
                return None
            query = select(sessions.c.id, created.label("created")).where(
                sessions.c.owner == owner_subject
            )
            if after is not None:
                query = query.where(tuple_(created, sessions.c.id) < tuple_(*after))
            rows = connection.execute(
                query.order_by(created.desc(), sessions.c.id.desc()).limit(limit + 1)
            ).all()
            window = rows[:limit]
            items, skipped, decoded = [], 0, 0
            for row_id, _created in window:
                snapshot = connection.execute(
                    select(sessions.c.snapshot).where(
                        sessions.c.id == row_id, sessions.c.owner == owner_subject
                    )
                ).scalar_one_or_none()
                if snapshot is None:
                    continue
                decoded += len(snapshot)
                if decoded > listing.MAX_DECODED_BYTES:
                    return None
                try:
                    items.append(listing.summarize_snapshot(snapshot, row_id, owner_subject))
                except (ValueError, KeyError, TypeError):
                    skipped += 1
        more = len(rows) > limit and bool(window)
        return listing.MigrationPage(
            items=items,
            next_cursor=listing.encode_cursor_at(owner_subject, window[-1][1], window[-1][0])
            if more
            else None,
            incomplete=False,
            reason=None,
            scanned=len(window),
            skipped=skipped,
        )

    def list_for_owner(self, owner_subject, *, after=None, limit=listing.DEFAULT_LIMIT):
        """Owner-scoped listing, newest first. Never omits a recent session silently."""
        try:
            page = self._list_ordered(owner_subject, after=after, limit=limit)
        except (DatabaseError, OperationalError):
            page = None  # e.g. an unreadable snapshot: the bounded scan skips and counts it
        if page is not None:
            return page
        return self._list_by_scan(owner_subject, after=after, limit=limit)

    def _list_by_scan(self, owner_subject, *, after, limit):
        """Fallback: bounded scan of owner rows (by id) with client-side ordering."""
        with self.engine.connect() as connection:
            ids = [
                row[0]
                for row in connection.execute(
                    select(sessions.c.id)
                    .where(sessions.c.owner == owner_subject)
                    .order_by(sessions.c.id)
                    .limit(listing.MAX_SCAN_ROWS + 1)
                )
            ]
            incomplete, reason = len(ids) > listing.MAX_SCAN_ROWS, None
            if incomplete:
                reason, ids = "scan_limit", ids[: listing.MAX_SCAN_ROWS]
            summaries, scanned, skipped, decoded = [], 0, 0, 0
            for row_id in ids:
                row = connection.execute(
                    select(sessions.c.snapshot).where(
                        sessions.c.id == row_id, sessions.c.owner == owner_subject
                    )
                ).first()
                if row is None:
                    continue
                decoded += len(row[0])
                if decoded > listing.MAX_DECODED_BYTES:
                    incomplete, reason = True, "byte_limit"
                    break
                scanned += 1
                try:
                    summaries.append(listing.summarize_snapshot(row[0], row_id, owner_subject))
                except (ValueError, KeyError, TypeError):
                    skipped += 1
        return listing.build_page(
            owner_subject,
            summaries,
            after=after,
            limit=limit,
            incomplete=incomplete,
            reason=reason,
            scanned=scanned,
            skipped=skipped,
        )

    def put_if_unchanged(self, original, updated):
        if original.id != updated.id or original.owner_subject != updated.owner_subject:
            raise ValueError("Session identity cannot change")
        encoded = encode(updated)
        with self.engine.begin() as connection:
            result = connection.execute(
                update(sessions)
                .where(
                    sessions.c.id == str(original.id),
                    sessions.c.owner == original.owner_subject,
                    sessions.c.digest.in_(stored_digests(original)),
                )
                .values(snapshot=encoded, digest=digest(encoded))
            )
            if result.rowcount != 1:
                raise ValueError(
                    "Session changed concurrently; refresh and review before retrying."
                )
            self._enqueue_activity(connection, original, updated, digest(encoded))
        return updated.model_copy(deep=True)

    def put_uploaded(self, session, limit):
        raise ValueError("Uploaded workspaces remain local-only in this runtime foundation.")


def cloud_engine(settings):
    from google.cloud.sql.connector import Connector
    from sqlalchemy import create_engine

    connector = Connector(refresh_strategy="LAZY", timeout=10)
    engine = create_engine(
        "postgresql+pg8000://",
        pool_size=3,
        max_overflow=0,
        pool_timeout=10,
        pool_recycle=1800,
        pool_pre_ping=True,
        hide_parameters=True,
        creator=lambda: connector.connect(
            settings.sql_instance,
            "pg8000",
            user=settings.sql_iam_user,
            db=settings.sql_database,
            enable_iam_auth=True,
            timeout=10,
        ),
    )
    return engine, connector


class LazyCloudSessionRepository(SqlSessionRepository):
    """Cloud SQL engine/connector are built on first database use, not at import.

    Constructing the connector resolves application default credentials, so doing it
    at import blocked the server from binding before any SQL was needed. Readiness and
    every session operation still create and use the same fail-closed engine.
    """

    def __init__(self, settings):
        self._settings = settings
        self._engine = None
        self._connector = None
        self._lock = threading.Lock()

    @property
    def engine(self):
        with self._lock:
            if self._engine is None:
                self._engine, self._connector = cloud_engine(self._settings)
            return self._engine

    @property
    def started(self):
        return self._engine is not None

    def close(self):
        with self._lock:
            engine, connector = self._engine, self._connector
            self._engine = self._connector = None
        if engine is not None:
            engine.dispose()
        if connector is not None:
            connector.close()


def session_repository(settings):
    if settings.persistence_backend == "memory":
        from movebooks_api.discover_assess.repository import InMemoryMigrationSessionRepository

        return InMemoryMigrationSessionRepository()
    return LazyCloudSessionRepository(settings)
