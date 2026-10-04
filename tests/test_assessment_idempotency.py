"""Starting an assessment is idempotent per owner and creation key.

A lost create response must never leave an orphan session behind a retry, and a key must
never replay another owner's session or a different assessment.
"""

from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient
from movebooks_api.discover_assess.repository import InMemoryMigrationSessionRepository
from movebooks_api.discover_assess.service import (
    CreationConflictError,
    DiscoverAssessService,
    session_repository,
)
from movebooks_api.main import app
from movebooks_api.runtime.persistence import SqlSessionRepository, metadata, sessions
from sqlalchemy import create_engine

AUTH = {"Authorization": "Bearer demo-user"}
NORTHSTAR, HARBOR = "northstar-supplies", "harbor-light-migrate-demo"


@pytest.fixture(params=["memory", "durable"])
def service(request, tmp_path):
    if request.param == "memory":
        yield DiscoverAssessService(InMemoryMigrationSessionRepository())
        return
    engine = create_engine(f"sqlite:///{tmp_path}/sessions.db")
    metadata.create_all(engine)
    yield DiscoverAssessService(SqlSessionRepository(engine))
    engine.dispose()


def stored(service: DiscoverAssessService) -> int:
    repository = service.repository
    if isinstance(repository, InMemoryMigrationSessionRepository):
        return len(repository._sessions)
    with repository.engine.connect() as connection:
        return len(connection.execute(sessions.select()).all())


def test_same_owner_key_and_intent_returns_the_same_session(service):
    first = service.create_session("owner-a", NORTHSTAR, "attempt-1")
    retries = [service.create_session("owner-a", NORTHSTAR, "attempt-1") for _ in range(5)]
    assert {session.id for session in retries} == {first.id}
    assert stored(service) == 1


def test_lost_response_retry_returns_the_committed_session_even_after_progress(service):
    created = service.create_session("owner-a", NORTHSTAR, "attempt-1")  # response lost
    service.discover("owner-a", created.id)
    service.assess("owner-a", created.id)
    retry = service.create_session("owner-a", NORTHSTAR, "attempt-1")
    assert retry.id == created.id
    assert retry.assessment is not None
    assert stored(service) == 1


def test_a_new_key_is_a_new_assessment(service):
    first = service.create_session("owner-a", NORTHSTAR, "attempt-1")
    second = service.create_session("owner-a", NORTHSTAR, "attempt-2")
    assert first.id != second.id
    assert stored(service) == 2


def test_the_same_key_never_replays_another_owners_session(service):
    mine = service.create_session("owner-a", NORTHSTAR, "shared-key")
    theirs = service.create_session("owner-b", NORTHSTAR, "shared-key")
    assert theirs.id != mine.id
    assert service.repository.get(mine.id, "owner-b") is None
    assert service.repository.get(theirs.id, "owner-a") is None
    assert stored(service) == 2


def test_the_same_key_for_a_different_assessment_is_rejected(service):
    original = service.create_session("owner-a", NORTHSTAR, "attempt-1")
    with pytest.raises(CreationConflictError):
        service.create_session("owner-a", HARBOR, "attempt-1")
    assert service.repository.get(original.id, "owner-a").sample_company_id == NORTHSTAR
    assert stored(service) == 1


def test_concurrent_retries_create_exactly_one_session():
    service = DiscoverAssessService(InMemoryMigrationSessionRepository())
    with ThreadPoolExecutor(max_workers=8) as pool:
        ids = set(
            pool.map(
                lambda _: service.create_session("owner-a", NORTHSTAR, "attempt-1").id, range(16)
            )
        )
    assert len(ids) == 1
    assert stored(service) == 1


@pytest.fixture
def client():
    session_repository.clear()
    with TestClient(app) as test_client:
        yield test_client
    session_repository.clear()


def create(client, sample, key=None):
    headers = {**AUTH, **({"Idempotency-Key": key} if key else {})}
    return client.post(
        "/v1/migration-sessions", headers=headers, json={"sample_company_id": sample}
    )


def test_api_retry_with_the_same_key_returns_the_same_session(client):
    first, retry = (
        create(client, NORTHSTAR, "a1b2c3d4-key"),
        create(client, NORTHSTAR, "a1b2c3d4-key"),
    )
    assert first.status_code == retry.status_code == 201
    assert retry.json()["id"] == first.json()["id"]
    assert len(session_repository._sessions) == 1


def test_api_rejects_a_reused_key_for_a_different_assessment(client):
    first = create(client, NORTHSTAR, "a1b2c3d4-key")
    conflict = create(client, HARBOR, "a1b2c3d4-key")
    assert conflict.status_code == 409
    assert "a1b2c3d4-key" not in conflict.text
    assert first.json()["id"] not in conflict.text
    assert len(session_repository._sessions) == 1


@pytest.mark.parametrize("key", ["", "has space", "x" * 121, "semi;colon"])
def test_api_rejects_malformed_keys_without_creating(client, key):
    response = client.post(
        "/v1/migration-sessions",
        headers={**AUTH, "Idempotency-Key": key},
        json={"sample_company_id": NORTHSTAR},
    )
    assert response.status_code == 422
    assert len(session_repository._sessions) == 0


def test_api_without_a_key_keeps_creating_distinct_sessions(client):
    first, second = create(client, NORTHSTAR), create(client, NORTHSTAR)
    assert first.json()["id"] != second.json()["id"]


def test_api_requires_an_identity_before_any_replay(client):
    first = create(client, NORTHSTAR, "a1b2c3d4-key")
    anonymous = client.post(
        "/v1/migration-sessions",
        headers={"Idempotency-Key": "a1b2c3d4-key"},
        json={"sample_company_id": NORTHSTAR},
    )
    assert anonymous.status_code == 401
    assert first.json()["id"] not in anonymous.text
