"""Real PostgreSQL-only gates. Opt-in locally; CI requires the database URL explicitly."""

import json
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Barrier
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from movebooks_api.auth import Principal, require_principal
from movebooks_api.discover_assess.service import DiscoverAssessService
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.main import app
from movebooks_api.runtime.persistence import SqlSessionRepository, metadata, sessions
from sqlalchemy import create_engine, delete, event, insert, inspect, select, text
from sqlalchemy.exc import DBAPIError

from domain.discovery_assessment.models import MigrationSession
from domain.migration_resolution.models import ExecutionStatus
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
        # A forced TCP termination can surface as native ConnectionResetError on macOS.
        # Discard the dead connection; still assert rollback and pool recovery below.
        with pytest.raises((DBAPIError, ConnectionError)):
            try:
                interrupted.commit()
            finally:
                interrupted.invalidate()
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


DEMO_CASES = [
    ("validation", "clean"),
    ("validation", "ar_discrepancy"),
    *[
        ("onboarding", scenario)
        for scenario in (
            "clean",
            "posting_failure",
            "missing_customer",
            "missing_product",
            "invalid_tax",
            "invalid_mapping",
            "totals_mismatch",
            "missing_role",
            "incomplete_configuration",
            "verification_interrupted",
        )
    ],
]


@pytest.mark.parametrize("endpoint,scenario", DEMO_CASES)
def test_demo_loaders_insert_once_and_persist_response(postgres, monkeypatch, endpoint, scenario):
    repository, engine = postgres
    owner = f"demo-loader-{uuid4()}"
    baseline = sample()
    baseline.owner_subject = owner
    repository.put(baseline)
    monkeypatch.setattr(service, "repository", repository)
    monkeypatch.setitem(app.dependency_overrides, require_principal, lambda: Principal(owner, ""))
    inserts, sqlstates = [], []

    def track_insert(conn, cursor, statement, parameters, context, executemany):
        if statement.lstrip().startswith("INSERT INTO migration_sessions"):
            inserts.extend(row["id"] for row in context.compiled_parameters)

    def track_error(context):
        args = context.original_exception.args
        if args and isinstance(args[0], dict):
            sqlstates.append(args[0].get("C"))

    event.listen(engine, "before_cursor_execute", track_insert)
    event.listen(engine, "handle_error", track_error)
    try:
        client = TestClient(app)
        response = client.post(f"/v1/{endpoint}-demo-sessions", json={"scenario": scenario})
    finally:
        event.remove(engine, "before_cursor_execute", track_insert)
        event.remove(engine, "handle_error", track_error)
    assert response.status_code == 201, (
        f"HTTP {response.status_code}; insert IDs={inserts}; SQLSTATEs={sqlstates}; {response.text}"
    )
    sid = UUID(response.json()["session_id"])
    assert inserts == [str(sid)] and not sqlstates
    with engine.connect() as connection:
        ids = set(connection.scalars(select(sessions.c.id).where(sessions.c.owner == owner)))
    assert ids == {str(baseline.id), str(sid)}  # No abandoned extra session from this load.
    saved = SqlSessionRepository(engine).get(sid, owner)
    assert saved.workflow_status == response.json()["workflow_status"]
    assert saved.execution.status == ExecutionStatus.COMPLETE
    if endpoint == "onboarding":
        assert saved.configuration.ready_for_onboarding
        assert saved.onboarding is not None
        assert saved.onboarding.faults == ([] if scenario == "clean" else [scenario])
        read = client.get(f"/v1/migration-sessions/{sid}/onboarding")
    else:
        assert saved.configuration is None and saved.onboarding is None
        assert saved.workflow_status == "MIGRATION_COMPLETE"
        if scenario == "ar_discrepancy":
            assert saved.execution.target_state["invoices"][0]["payload"]["total"] == "400.00"
        read = client.get(f"/v1/migration-sessions/{sid}/validation-configuration")
    assert read.status_code == 200 and read.json() == response.json()
    assert repository.get(baseline.id, owner) == baseline
    stale = saved.model_copy(deep=True)
    updated = saved.model_copy(deep=True)
    updated.stage = "concurrent-winner"
    repository.put_if_unchanged(saved, updated)
    with pytest.raises(ValueError, match="changed concurrently"):
        repository.put_if_unchanged(stale, stale)
    assert repository.get(sid, owner).stage == "concurrent-winner"


@pytest.mark.parametrize("endpoint", ["validation", "onboarding"])
def test_demo_keyed_replay_keeps_one_row_and_current_state(postgres, monkeypatch, endpoint):
    repository, engine = postgres
    owner = f"demo-replay-{uuid4()}"
    monkeypatch.setattr(service, "repository", repository)
    monkeypatch.setitem(app.dependency_overrides, require_principal, lambda: Principal(owner, ""))
    client = TestClient(app)
    headers = {"Idempotency-Key": "same-intent"}
    path = f"/v1/{endpoint}-demo-sessions"
    first = client.post(path, json={"scenario": "clean"}, headers=headers)
    assert first.status_code == 201
    sid = UUID(first.json()["session_id"])
    saved = repository.get(sid, owner)
    changed = saved.model_copy(deep=True)
    changed.stage = "later-owner-progress"
    repository.put_if_unchanged(saved, changed)
    second = client.post(path, json={"scenario": "clean"}, headers=headers)
    assert second.status_code == 201 and second.json()["session_id"] == str(sid)
    assert repository.get(sid, owner) == changed  # Replay has no audit/reset side effects.
    conflict = "ar_discrepancy" if endpoint == "validation" else "missing_role"
    assert client.post(path, json={"scenario": conflict}, headers=headers).status_code == 409
    with engine.connect() as connection:
        assert list(connection.scalars(select(sessions.c.id).where(sessions.c.owner == owner))) == [
            str(sid)
        ]
    other = f"other-{uuid4()}"
    monkeypatch.setitem(app.dependency_overrides, require_principal, lambda: Principal(other, ""))
    assert client.get(f"/v1/migration-sessions/{sid}").status_code == 404
    response = client.post(path, json={"scenario": "clean"}, headers=headers)
    assert response.status_code == 201 and response.json()["session_id"] != str(sid)


@pytest.mark.parametrize("endpoint", ["validation", "onboarding"])
@pytest.mark.parametrize("failure", ["build", "render", "insert"])
def test_failed_demo_creation_publishes_no_partial_row(postgres, monkeypatch, endpoint, failure):
    from movebooks_api.discover_assess import onboard_fpu, validate_configure

    repository, engine = postgres
    owner = f"demo-failure-{uuid4()}"
    monkeypatch.setattr(service, "repository", repository)
    monkeypatch.setitem(app.dependency_overrides, require_principal, lambda: Principal(owner, ""))

    def fail(*args, **kwargs):
        raise RuntimeError("injected local failure")

    def fail_insert(conn, cursor, statement, parameters, context, executemany):
        if statement.lstrip().startswith("INSERT INTO migration_sessions"):
            cursor.execute("SELECT 1 / 0")  # Abort AFTER actual INSERT; transaction must roll back.

    with monkeypatch.context() as patch:
        if failure == "build":
            if endpoint == "onboarding":
                start = onboard_fpu.orchestrator.start

                def fail_late(*args, **kwargs):
                    start(*args, **kwargs)
                    fail()

                patch.setattr(onboard_fpu.orchestrator, "start", fail_late)
            else:
                build = validate_configure.build_demo

                def fail_late(*args, **kwargs):
                    build(*args, **kwargs)
                    fail()

                patch.setattr(validate_configure, "build_demo", fail_late)
        elif failure == "render":
            patch.setattr(
                onboard_fpu if endpoint == "onboarding" else validate_configure, "view", fail
            )
        else:
            event.listen(engine, "after_cursor_execute", fail_insert)
        try:
            response = TestClient(app).post(
                f"/v1/{endpoint}-demo-sessions",
                json={"scenario": "clean"},
                headers={"Idempotency-Key": "failed-intent"},
            )
            assert response.status_code == 503
        finally:
            if failure == "insert":
                event.remove(engine, "after_cursor_execute", fail_insert)
    with engine.connect() as connection:
        assert not list(connection.scalars(select(sessions.c.id).where(sessions.c.owner == owner)))
    retry = TestClient(app).post(
        f"/v1/{endpoint}-demo-sessions",
        json={"scenario": "clean"},
        headers={"Idempotency-Key": "failed-intent"},
    )
    assert retry.status_code == 201


@pytest.mark.parametrize("endpoint", ["validation", "onboarding"])
def test_concurrent_demo_creation_duplicate_insert_replays_winner(postgres, monkeypatch, endpoint):
    repository, engine = postgres
    owner = f"demo-race-{uuid4()}"
    monkeypatch.setattr(service, "repository", repository)
    monkeypatch.setitem(app.dependency_overrides, require_principal, lambda: Principal(owner, ""))
    barrier = Barrier(2)
    create = repository.create
    sqlstates = []

    def track_error(context):
        args = context.original_exception.args
        if args and isinstance(args[0], dict):
            sqlstates.append(args[0].get("C"))

    def race(session):
        barrier.wait(timeout=10)
        return create(session)

    monkeypatch.setattr(repository, "create", race)

    def post(_):
        return TestClient(app).post(
            f"/v1/{endpoint}-demo-sessions",
            json={"scenario": "clean"},
            headers={"Idempotency-Key": "raced-intent"},
        )

    event.listen(engine, "handle_error", track_error)
    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(post, range(2)))
    finally:
        event.remove(engine, "handle_error", track_error)
    assert [response.status_code for response in responses] == [201, 201]
    assert sqlstates == ["23505"]  # Actual PostgreSQL race is recovered as keyed replay.
    assert responses[0].json() == responses[1].json()
    with engine.connect() as connection:
        assert (
            len(list(connection.scalars(select(sessions.c.id).where(sessions.c.owner == owner))))
            == 1
        )


def test_demo_configuration_replays_do_not_duplicate_audit(postgres, monkeypatch):
    repository, _ = postgres
    owner = f"demo-configuration-{uuid4()}"
    monkeypatch.setattr(service, "repository", repository)
    monkeypatch.setitem(app.dependency_overrides, require_principal, lambda: Principal(owner, ""))
    client = TestClient(app)
    response = client.post("/v1/validation-demo-sessions", json={"scenario": "clean"})
    assert response.status_code == 201
    sid = UUID(response.json()["session_id"])
    root = f"/v1/migration-sessions/{sid}"
    assert client.post(root + "/validation").status_code == 200
    assert client.post(root + "/configuration").status_code == 200
    proposals = repository.get(sid, owner).configuration.proposals
    for proposal in proposals:
        if proposal.state == "APPLIED":
            continue
        path = f"{root}/configuration/{proposal.id}/decision"
        decision = {"action": "approve", "comment": "Explicit synthetic review"}
        assert client.post(path, json=decision).status_code == 200
        saved = repository.get(sid, owner)
        assert client.post(path, json=decision).status_code == 200
        assert repository.get(sid, owner) == saved
    assert client.post(root + "/configuration/apply").status_code == 200
    saved = repository.get(sid, owner)
    assert client.post(root + "/configuration/apply").status_code == 200
    assert repository.get(sid, owner) == saved
