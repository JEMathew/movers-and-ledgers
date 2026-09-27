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

    def put_if_unchanged(self, original: MigrationSession, updated: MigrationSession):
        """Atomic compare-and-swap for governed validation/configuration decisions."""
        with self._lock:
            current = self._sessions.get(original.id)
            if current != original:
                raise ValueError(
                    "Session changed concurrently; refresh and review before retrying."
                )
            return self.put(updated)
