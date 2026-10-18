"""Owner-scoped ephemeral persistence for the public demonstration slice."""

from threading import RLock
from typing import Protocol
from uuid import UUID

from domain.discovery_assessment.models import MigrationSession

from . import listing


class MigrationSessionRepository(Protocol):
    """Persistence port for owner-scoped migration-session state."""

    def put(self, session: MigrationSession) -> MigrationSession: ...

    def create(self, session: MigrationSession) -> MigrationSession:
        """Insert only: raises ValueError when a session with this ID already exists."""
        ...

    def get(self, session_id: UUID, owner_subject: str) -> MigrationSession | None: ...

    def put_if_unchanged(
        self, original: MigrationSession, updated: MigrationSession
    ) -> MigrationSession: ...

    def put_uploaded(self, session: MigrationSession, limit: int) -> MigrationSession: ...

    def list_for_owner(
        self, owner_subject: str, *, after: tuple[str, str] | None = None, limit: int = 20
    ) -> listing.MigrationPage: ...


class InMemoryMigrationSessionRepository:
    """Stores sessions for one process; no production durability is implied."""

    def __init__(self) -> None:
        self._sessions: dict[UUID, MigrationSession] = {}
        self._lock = RLock()

    def put(self, session: MigrationSession) -> MigrationSession:
        with self._lock:
            self._sessions[session.id] = session.model_copy(deep=True)
        return session.model_copy(deep=True)

    def create(self, session: MigrationSession) -> MigrationSession:
        with self._lock:
            if session.id in self._sessions:
                raise ValueError("Session already exists; refresh before retrying.")
            return self.put(session)

    def get(self, session_id: UUID, owner_subject: str) -> MigrationSession | None:
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None or session.owner_subject != owner_subject:
                return None
            return session.model_copy(deep=True)

    def list_for_owner(self, owner_subject, *, after=None, limit=listing.DEFAULT_LIMIT):
        with self._lock:
            owned = [s for s in self._sessions.values() if s.owner_subject == owner_subject]
        incomplete = len(owned) > listing.MAX_SCAN_ROWS
        owned = sorted(owned, key=lambda s: str(s.id))[: listing.MAX_SCAN_ROWS]
        summaries = [
            listing.MigrationSummary(
                id=str(s.id),
                company_name=s.company_name[:120],
                status=s.status.value,
                workflow_status=s.workflow_status.value,
                created_at=s.created_at.isoformat(),
            )
            for s in owned
        ]
        return listing.build_page(
            owner_subject,
            summaries,
            after=after,
            limit=limit,
            incomplete=incomplete,
            reason="scan_limit" if incomplete else None,
            scanned=len(summaries),
            skipped=0,
        )

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
