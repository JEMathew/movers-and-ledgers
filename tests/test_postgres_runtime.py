"""Real PostgreSQL-only gates. Opt-in locally; CI requires the database URL explicitly."""

import json
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Barrier
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from movebooks_api.discover_assess.service import DiscoverAssessService
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.main import app
from movebooks_api.runtime.persistence import SqlSessionRepository, metadata, sessions
from sqlalchemy import create_engine, delete, event, insert, inspect, select, text
from sqlalchemy.exc import DBAPIError

from domain.discovery_assessment.models import MigrationSession
from domain.planning_mapping.models import MappingDecision, MappingState


@pytest.fixture(params=["legacy", "cloud-dbapi"])
def postgres(request):
    url = os.environ.get("MOVEBOOKS_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Real PostgreSQL gate requires MOVEBOOKS_TEST_DATABASE_URL")
    import pg8000.dbapi

    # The Google connector returns this DB-API connection, while the ordinary
    # SQLAlchemy URL uses pg8000's legacy facade. Exercise both error taxonomies.
    options = {"module": pg8000.dbapi} if request.param == "cloud-dbapi" else {}
    engine = create_engine(url, pool_pre_ping=True, hide_parameters=True, **options)
    assert engine.dialect.name == "postgresql", "SQLite cannot satisfy this gate"
    metadata.create_all(engine)
    yield SqlSessionRepository(engine), engine
    engine.dispose()


def sample():
    return MigrationSession(
        owner_subject=f"owner-{uuid4()}",
        sample_company_id="harbor-light-migrate-demo",
        company_name="Synthetic",
    )


def test_schema_bootstrap_idempotent_and_transactional_snapshot(postgres):
    repository, engine = postgres
    metadata.create_all(engine)
    assert "migration_sessions" in inspect(engine).get_table_names()
    original = repository.put(sample())
    assert repository.get(original.id, original.owner_subject) == original
    assert repository.get(original.id, "unauthorized") is None
    with pytest.raises(ValueError):
        repository.put(original)
    assert repository.get(original.id, original.owner_subject) == original


def test_failed_repository_transaction_rolls_back_all_state(postgres):
    repository, engine = postgres
    original = repository.put(sample())
    updated = original.model_copy(deep=True)
    updated.stage = "assess"

    def fail_after_update(conn, cursor, statement, parameters, context, executemany):
        if statement.lstrip().startswith("UPDATE migration_sessions"):
            # PostgreSQL aborts this transaction, after the actual UPDATE already ran.
            cursor.execute("SELECT 1 / 0")

    event.listen(engine, "after_cursor_execute", fail_after_update)
    try:
        with pytest.raises(DBAPIError):
            repository.put_if_unchanged(original, updated)
    finally:
        event.remove(engine, "after_cursor_execute", fail_after_update)
    assert repository.get(original.id, original.owner_subject) == original
    assert repository.put_if_unchanged(original, updated) == updated


def test_concurrent_transactions_have_exactly_one_winner(postgres):
    repository, engine = postgres
    original = repository.put(sample())
    barrier = Barrier(2)

    def write(stage):
        updated = original.model_copy(deep=True)
        updated.stage = stage
        barrier.wait(timeout=5)
        try:
            repository.put_if_unchanged(original, updated)
            return True
        except ValueError:
            return False

    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(write, ["assess", "plan"])) == [False, True]
    assert repository.get(original.id, original.owner_subject).stage in {"assess", "plan"}
    with pytest.raises(ValueError):
        repository.put_if_unchanged(original, original)


def test_terminated_connection_rolls_back_and_pool_recovers(postgres):
    repository, engine = postgres
    original = repository.put(sample())
    with engine.connect() as interrupted:
        pid = interrupted.scalar(text("SELECT pg_backend_pid()"))
        interrupted.execute(
            sessions.update()
            .where(sessions.c.id == str(original.id))
            .values(snapshot="uncommitted-corruption")
        )
        with engine.begin() as killer:
            assert killer.scalar(text("SELECT pg_terminate_backend(:pid)"), {"pid": pid})
        with pytest.raises(DBAPIError):
            interrupted.commit()
    assert repository.get(original.id, original.owner_subject) == original


def test_actual_postgres_statement_failure_is_redacted_without_memory_fallback(
    postgres, monkeypatch, caplog
):
    repository, engine = postgres
    monkeypatch.setattr(service, "repository", repository)

    def failing_query(conn, cursor, statement, parameters, context, executemany):
        if statement.lstrip().startswith("INSERT INTO migration_sessions"):
            cursor.execute("SELECT 1 / 0")

    event.listen(engine, "before_cursor_execute", failing_query)
    try:
        response = TestClient(app).post(
            "/v1/migration-sessions",
            headers={"Authorization": "Bearer demo-user"},
            json={"sample_company_id": "harbor-light-migrate-demo"},
        )
        assert response.status_code == 503
        assert "division by zero" not in response.text + caplog.text
    finally:
        event.remove(engine, "before_cursor_execute", failing_query)
    assert service.repository is repository
    with engine.connect() as connection:
        assert connection.execute(select(sessions.c.id).limit(1)) is not None


def test_previous_release_rows_advance_and_still_conflict(postgres):
    """Golden rows written by the previous release, on real PostgreSQL: reads keep their
    concurrency identity, legitimate steps succeed after a restart, stale writers still fail."""
    _, engine = postgres
    fixture = Path(__file__).parent / "fixtures" / "persisted_sessions" / "b0753d0.json"
    rows = json.loads(fixture.read_text())["rows"]
    for name in ("planned", "mappings_in_review", "approved_legacy"):
        stored = rows[name]
        with engine.begin() as connection:  # Disposable CI database; fixture IDs are fixed.
            connection.execute(delete(sessions).where(sessions.c.id == stored["id"]))
            connection.execute(
                insert(sessions).values(
                    id=stored["id"],
                    owner=stored["owner"],
                    digest=stored["digest"],
                    snapshot=stored["snapshot"],
                )
            )
        sid, owner = UUID(stored["id"]), stored["owner"]
        stale = SqlSessionRepository(engine).get(sid, owner)
        restarted = DiscoverAssessService(SqlSessionRepository(engine))
        if name == "planned":
            assert restarted.map(owner, sid).workflow_status == "AWAITING_APPROVAL"
        elif name == "mappings_in_review":
            pending = [m for m in stale.mappings if m.state != "APPROVED"]
            decided = restarted.decide_mapping(
                owner, sid, pending[0].id, MappingDecision(decision=MappingState.APPROVED)
            )
            assert sum(m.state != "APPROVED" for m in decided.mappings) == len(pending) - 1
        else:
            assert restarted.start_migration(owner, sid, f"pg-{sid}").execution is not None
        changed = stale.model_copy(deep=True)
        changed.stage = "stale-writer"
        with pytest.raises(ValueError, match="changed concurrently"):
            SqlSessionRepository(engine).put_if_unchanged(stale, changed)
