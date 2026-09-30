"""Cold-start regressions: deferred SQL construction, concurrent readiness, safe warm-up."""

import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient
from movebooks_api import auth, main
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.main import app, readiness_checks, run_readiness
from movebooks_api.runtime import persistence, storage
from movebooks_api.runtime.persistence import LazyCloudSessionRepository, session_repository
from movebooks_api.runtime.warmup import warm_cloud_dependencies
from movebooks_api.settings import Settings
from test_google_runtime import CLOUD


def cloud():
    return Settings(**CLOUD, _env_file=None)


def test_cloud_repository_defers_connector_until_first_database_use(monkeypatch):
    calls = []

    def fake_cloud_engine(settings):
        calls.append(settings)
        return Mock(name="engine"), Mock(name="connector")

    monkeypatch.setattr(persistence, "cloud_engine", fake_cloud_engine)
    monkeypatch.delitem(sys.modules, "google.cloud.sql.connector", raising=False)
    repository = session_repository(cloud())
    assert isinstance(repository, LazyCloudSessionRepository)
    assert calls == [] and not repository.started
    assert "google.cloud.sql.connector" not in sys.modules
    repository.close()  # Nothing to dispose before first use.
    assert calls == []
    with ThreadPoolExecutor(max_workers=8) as pool:
        engines = list(pool.map(lambda _: repository.engine, range(32)))
    assert len(calls) == 1 and len({id(engine) for engine in engines}) == 1
    assert repository.started
    engine, connector = engines[0], repository._connector
    repository.close()
    engine.dispose.assert_called_once_with()
    connector.close.assert_called_once_with()
    assert not repository.started


def test_readiness_checks_run_concurrently_and_fail_closed(monkeypatch):
    settings = cloud()
    barrier = threading.Barrier(2, timeout=5)
    repository = Mock()
    repository.ready.side_effect = barrier.wait
    artifacts = Mock()
    artifacts.ready.side_effect = barrier.wait
    monkeypatch.setattr(storage, "GoogleArtifacts", Mock(return_value=artifacts))
    checks = readiness_checks(settings, repository)
    assert len(checks) == 2
    run_readiness(checks)  # A sequential run would deadlock on the barrier and time out.
    storage.GoogleArtifacts.assert_called_once_with("test-project", "private-artifacts")
    artifacts.ready.side_effect = RuntimeError("bucket-policy-secret-marker")
    repository.ready.side_effect = None
    with pytest.raises(RuntimeError):
        run_readiness(readiness_checks(settings, repository))
    repository.ready.side_effect = RuntimeError("sql-secret-marker")
    artifacts.ready.side_effect = None
    with pytest.raises(RuntimeError):
        run_readiness(readiness_checks(settings, repository))


def test_readyz_stays_fail_closed_when_any_cloud_dependency_fails(monkeypatch):
    monkeypatch.setattr(main, "settings", cloud())
    repository = Mock()
    monkeypatch.setattr(service, "repository", repository)
    artifacts = Mock()
    monkeypatch.setattr(storage, "GoogleArtifacts", Mock(return_value=artifacts))
    client = TestClient(app)
    assert client.get("/readyz").json() == {"status": "ready", "mode": "cloud-dev"}
    artifacts.ready.side_effect = RuntimeError("bucket-policy-secret-marker")
    response = client.get("/readyz")
    assert response.status_code == 503 and "secret-marker" not in response.text
    artifacts.ready.side_effect = None
    repository.ready.side_effect = RuntimeError("sql-secret-marker")
    response = client.get("/readyz")
    assert response.status_code == 503 and "secret-marker" not in response.text


def test_warmup_only_constructs_the_cloud_verifier_without_verifying():
    identity = Mock()
    thread = warm_cloud_dependencies(cloud(), identity=identity)
    thread.join(timeout=5)
    assert not thread.is_alive()
    identity.assert_called_once_with("test-project")
    assert identity.return_value.verify.call_count == 0
    assert warm_cloud_dependencies(Settings(env="local", _env_file=None), identity=identity) is None
    identity.assert_called_once_with("test-project")


def test_warmup_failure_never_weakens_identity_verification(monkeypatch):
    monkeypatch.setattr(auth, "get_settings", cloud)
    verifier = Mock()
    verifier.verify.side_effect = ValueError("private-token-error")
    identity = Mock(side_effect=[RuntimeError("metadata-unavailable-marker"), verifier])
    monkeypatch.setattr(auth, "firebase_identity", identity)
    thread = warm_cloud_dependencies(cloud(), identity=identity)
    thread.join(timeout=5)
    assert not thread.is_alive()
    response = TestClient(app).get("/v1/identity", headers={"Authorization": "Bearer token"})
    assert response.status_code == 401
    assert "marker" not in response.text and "private-token" not in response.text
    assert identity.call_count == 2


def test_local_lifespan_never_starts_cloud_warmup(monkeypatch):
    identity = Mock()
    monkeypatch.setattr(auth, "firebase_identity", identity)
    with TestClient(app) as client:
        assert client.get("/healthz").status_code == 200
    identity.assert_not_called()
