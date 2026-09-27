"""Owner-scoped ephemeral persistence for the public demonstration slice."""

from threading import RLock
from typing import Protocol
from uuid import UUID

from domain.discovery_assessment.models import MigrationSession


class MigrationSessionRepository(Protocol):
    """Persistence port for owner-scoped migration-session state."""

    def put(self, session: MigrationSession) -> MigrationSession: ...

    def get(self, session_id: UUID, owner_subject: str) -> MigrationSession | None: ...

    def put_if_unchanged(
        self, original: MigrationSession, updated: MigrationSession
    ) -> MigrationSession: ...

    def put_uploaded(self, session: MigrationSession, limit: int) -> MigrationSession: ...


class InMemoryMigrationSessionRepository:
    """Stores sessions for one process; no production durability is implied."""

    def __init__(self) -> None:
        self._sessions: dict[UUID, MigrationSession] = {}
        self._lock = RLock()

    def put(self, session: MigrationSession) -> MigrationSession:
        with self._lock:
            self._sessions[session.id] = session.model_copy(deep=True)
        return session.model_copy(deep=True)

    def get(self, session_id: UUID, owner_subject: str) -> MigrationSession | None:
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None or session.owner_subject != owner_subject:
                return None
            return session.model_copy(deep=True)

    def clear(self) -> None:
        with self._lock:
            self._sessions.clear()

    def put_uploaded(self, session: MigrationSession, limit: int) -> MigrationSession:
        with self._lock:
            if sum(s.source_kind == "user_upload" for s in self._sessions.values()) >= limit:
                raise ValueError(
                    "Local uploaded workspace capacity reached; restart the local API."
                )
            return self.put(session)

    def put_if_unchanged(self, original: MigrationSession, updated: MigrationSession):
        """Atomic compare-and-swap for governed validation/configuration decisions."""
        with self._lock:
            if original.id != updated.id or original.owner_subject != updated.owner_subject:
                raise ValueError("Session identity cannot change")
            current = self._sessions.get(original.id)
            if current != original:
                raise ValueError(
                    "Session changed concurrently; refresh and review before retrying."
                )
            return self.put(updated)
