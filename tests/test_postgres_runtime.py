"""Real PostgreSQL-only gates. Opt-in locally; CI requires the database URL explicitly."""

import os
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.main import app
from movebooks_api.runtime.persistence import SqlSessionRepository, metadata, sessions
from sqlalchemy import create_engine, event, inspect, select, text
from sqlalchemy.exc import DBAPIError

from domain.discovery_assessment.models import MigrationSession


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
