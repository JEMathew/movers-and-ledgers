"""Transactional session snapshots. PostgreSQL in cloud; SQLite only for offline tests."""

import hashlib
import json

from sqlalchemy import Column, MetaData, String, Table, Text, insert, select, update
from sqlalchemy.exc import DatabaseError, IntegrityError

from domain.discovery_assessment.models import MigrationSession

metadata = MetaData()
sessions = Table(
    "migration_sessions",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("owner", String(256), nullable=False, index=True),
    Column("digest", String(64), nullable=False),
    Column("snapshot", Text, nullable=False),
)


def encode(session):
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
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    if len(encoded.encode()) > 16 * 1024 * 1024:
        raise ValueError("Session evidence capacity reached; no state was committed.")
    return encoded


def digest(encoded):
    return hashlib.sha256(encoded.encode()).hexdigest()


def decode(encoded, owner):
    data = json.loads(encoded)
    if data["schema"] != 1 or data["owner"] != owner:
        raise ValueError("Stored session schema or owner mismatch")
    return MigrationSession.model_validate({**data["session"], "owner_subject": owner})


class SqlSessionRepository:
    def __init__(self, engine):
        self.engine = engine

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
                    sessions.c.digest == digest(encode(original)),
                )
                .values(snapshot=encoded, digest=digest(encoded))
            )
            if result.rowcount != 1:
                raise ValueError(
                    "Session changed concurrently; refresh and review before retrying."
                )
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


def session_repository(settings):
    if settings.persistence_backend == "memory":
        from movebooks_api.discover_assess.repository import InMemoryMigrationSessionRepository

        return InMemoryMigrationSessionRepository()
    engine, connector = cloud_engine(settings)
    repository = SqlSessionRepository(engine)
    repository.connector = connector
    return repository
