"""Persisted-session compatibility across releases.

Fixtures are real rows written by earlier releases (see their provenance). A new optional model
field must never change the concurrency identity of an older row just because it was read, or
existing sessions stop advancing after a deployment. Regenerate fixtures only from the release
they name, never from newer code.
"""

import json
from pathlib import Path
from uuid import UUID

import pytest
from movebooks_api.discover_assess.service import DiscoverAssessService
from movebooks_api.runtime.persistence import (
    SqlSessionRepository,
    decode,
    digest,
    encode,
    metadata,
    sessions,
    stored_digests,
)
from sqlalchemy import create_engine, insert, select

from domain.migration_resolution.models import ResolutionDecision
from domain.planning_mapping.models import MappingDecision, MappingState

FIXTURES = Path(__file__).parent / "fixtures" / "persisted_sessions"
RELEASES = {
    name: json.loads((FIXTURES / f"{name}.json").read_text()) for name in ("b0753d0", "3bd23d0")
}
ROWS = [(release, state) for release, data in RELEASES.items() for state in data["rows"]]


def row(release, state):
    return RELEASES[release]["rows"][state]


class Database:
    """A SQL-backed store that can be 'restarted': a new engine and repository on the same file."""

    def __init__(self, path):
        self.url = f"sqlite:///{path}"
        metadata.create_all(create_engine(self.url))
        self.restart()

    def restart(self):
        self.engine = create_engine(self.url)
        self.service = DiscoverAssessService(SqlSessionRepository(self.engine))
        return self.service

    def load(self, stored):
        with self.engine.begin() as connection:
            connection.execute(
                insert(sessions).values(
                    id=stored["id"],
                    owner=stored["owner"],
                    digest=stored["digest"],
                    snapshot=stored["snapshot"],
                )
            )

    def raw(self, session_id):
        with self.engine.connect() as connection:
            return connection.execute(
                select(sessions.c.snapshot, sessions.c.digest).where(
                    sessions.c.id == str(session_id)
                )
            ).one()


@pytest.fixture
def db(tmp_path):
    return Database(tmp_path / "sessions.db")


def advance(service, owner, session_id):
    """The legitimate next step for the session's workflow state."""
    session = service.get_session(owner, session_id)
    status = session.workflow_status
    if status == "ASSESSED":
        return service.plan(owner, session_id)
    if status == "PLANNED":
        return service.map(owner, session_id)
    if status == "AWAITING_APPROVAL":
        pending = [m for m in session.mappings if m.state not in {"APPROVED", "MODIFIED"}]
        if not pending:
            return service.approve_plan(owner, session_id, session.plan.id)
        return service.decide_mapping(
            owner,
            session_id,
            pending[0].id,
            MappingDecision(decision=MappingState.APPROVED, comment="Compatibility review"),
        )
    if status == "APPROVED":
        return service.start_migration(owner, session_id, f"compat-{session_id}")
    if status == "RESOLVING":
        return service.decide_resolution(
            owner,
            session_id,
            session.execution.resolutions[-1].id,
            ResolutionDecision(approve=True, comment="Compatibility review"),
        )
    if status == "RETRY_PENDING":
        return service.retry_migration(owner, session_id)
    raise AssertionError(f"No next step for {status}")


@pytest.mark.parametrize("state", list(RELEASES["b0753d0"]["rows"]))
def test_golden_legacy_rows_reencode_byte_for_byte(state):
    stored = row("b0753d0", state)
    session = decode(stored["snapshot"], stored["owner"])
    # A harmless read must not change the stored representation or its digest. If this fails,
    # a newly added optional field is being written for rows that predate it.
    assert encode(session) == stored["snapshot"]
    assert digest(encode(session)) == stored["digest"]


@pytest.mark.parametrize("release,state", ROWS)
def test_every_stored_row_keeps_a_valid_concurrency_identity(release, state):
    stored = row(release, state)
    assert stored["digest"] in stored_digests(decode(stored["snapshot"], stored["owner"]))


@pytest.mark.parametrize("release,state", ROWS)
def test_stored_rows_advance_across_restarts(db, release, state):
    stored = row(release, state)
    sid, owner = UUID(stored["id"]), stored["owner"]
    db.load(stored)
    service = db.restart()
    read = service.get_session(owner, sid)
    assert db.raw(sid) == (stored["snapshot"], stored["digest"])  # a read never rewrites
    assert read.workflow_status == stored["workflow_status"]
    first = advance(service, owner, sid)
    assert first.workflow_status != stored["workflow_status"] or first.events != read.events
    service = db.restart()
    assert service.get_session(owner, sid).model_dump() == first.model_dump()
    second = advance(service, owner, sid)
    assert db.restart().get_session(owner, sid).model_dump() == second.model_dump()


@pytest.mark.parametrize("release,state", ROWS)
def test_genuinely_concurrent_writers_still_conflict(db, release, state):
    stored = row(release, state)
    sid, owner = UUID(stored["id"]), stored["owner"]
    db.load(stored)
    repository = db.service.repository
    first, second = repository.get(sid, owner), repository.get(sid, owner)
    changed = first.model_copy(deep=True)
    changed.stage = "first-writer"
    repository.put_if_unchanged(first, changed)
    stale = second.model_copy(deep=True)
    stale.stage = "second-writer"
    with pytest.raises(ValueError, match="changed concurrently"):
        repository.put_if_unchanged(second, stale)
    assert repository.get(sid, owner).stage == "first-writer"


@pytest.mark.parametrize("state", list(RELEASES["b0753d0"]["rows"]))
def test_legacy_sessions_stay_in_the_legacy_shape_until_new_data_is_used(db, state):
    stored = row("b0753d0", state)
    sid, owner = UUID(stored["id"]), stored["owner"]
    db.load(stored)
    session = db.service.repository.get(sid, owner)
    original = session.model_copy(deep=True)
    session.stage = "touched-by-new-release"
    db.service.repository.put_if_unchanged(original, session)
    plan = json.loads(db.raw(sid)[0])["session"]["plan"]
    if plan is not None:
        assert "summary" not in plan and "approval" not in plan


def test_current_sessions_round_trip_everything_through_restarts(db):
    service, owner = db.service, "current-owner"
    sid = service.create_session(owner, "harbor-light-migrate-demo").id
    for step in (service.discover, service.assess, service.plan, service.map):
        step(owner, sid)
    for mapping in service.get_session(owner, sid).mappings:
        service.decide_mapping(
            owner, sid, mapping.id, MappingDecision(decision=MappingState.APPROVED, comment="ok")
        )
    session = service.get_session(owner, sid)
    service.approve_plan(owner, sid, session.plan.id)
    before = service.start_migration(owner, sid, "current-start")
    snapshot, stored_digest = db.raw(sid)
    after = db.restart().get_session(owner, sid)
    assert after.model_dump() == before.model_dump()
    assert after.plan.summary is not None and after.plan.approval is not None
    assert after.plan.approval.plan_id == after.plan.id
    assert after.mappings and all(m.decided_by == owner for m in after.mappings)
    assert after.human_decisions and after.events and after.activity
    assert after.execution.idempotency_key == "current-start"
    assert after.workflow_status == before.workflow_status
    # Deterministic: re-encoding the same state reproduces the stored bytes exactly.
    assert encode(after) == snapshot and digest(snapshot) == stored_digest
    # The idempotent start replays against the restored state.
    assert db.service.start_migration(owner, sid, "current-start").execution == after.execution
