"""Offline contracts plus PostgreSQL CI parity; never require a Google account."""

import json
import os
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
from unittest.mock import Mock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from movebooks_api.auth import DemoIdentity, FirebaseIdentity
from movebooks_api.discover_assess.repository import InMemoryMigrationSessionRepository
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.main import app
from movebooks_api.runtime.contracts import AnalyticsEvent, DisabledAnalytics
from movebooks_api.runtime.observability import safe_fields
from movebooks_api.runtime.persistence import SqlSessionRepository, decode, encode, metadata
from movebooks_api.runtime.secrets import GoogleSecrets, LocalSecrets, SecretUnavailable
from movebooks_api.runtime.storage import (
    ArtifactService,
    GoogleArtifacts,
    MemoryArtifacts,
    StorageUnavailable,
    object_name,
)
from movebooks_api.settings import Settings
from pydantic import ValidationError
from sqlalchemy import create_engine, event
from sqlalchemy.exc import DatabaseError
from test_beta_v1_integration import CASES
from test_beta_v1_integration import test_integrated_golden as run_golden

from domain.discovery_assessment.models import MigrationSession

CLOUD = dict(
    env="cloud-dev",
    persistence_backend="cloud-sql",
    storage_backend="gcs",
    identity_mode="firebase",
    demo_identity_enabled=False,
    google_project="test-project",
    sql_instance="test-project:us-central1:test",
    sql_database="movebooks",
    sql_iam_user="runtime@test-project.iam",
    storage_bucket="private-artifacts",
    cors_origins=["https://beta.example.com"],
)


def sample(owner="owner"):
    return MigrationSession(
        owner_subject=owner,
        sample_company_id="harbor-light-migrate-demo",
        company_name="Synthetic business",
    )


@pytest.fixture
def durable(tmp_path):
    url = os.environ.get("MOVEBOOKS_TEST_DATABASE_URL", f"sqlite:///{tmp_path}/sessions.db")
    engine = create_engine(url, hide_parameters=True)
    metadata.create_all(engine)
    yield SqlSessionRepository(engine), url
    engine.dispose()


@pytest.mark.parametrize("mode", ["local", "development", "test"])
def test_local_modes_need_no_credentials(mode):
    settings = Settings(env=mode, _env_file=None)
    assert not settings.cloud and settings.persistence_backend == "memory"


@pytest.mark.parametrize("mode", ["cloud-dev", "staging", "production"])
def test_cloud_modes_fail_closed(mode):
    with pytest.raises(ValidationError):
        Settings(env=mode, _env_file=None)
    assert Settings(**{**CLOUD, "env": mode}, _env_file=None).cloud


@pytest.mark.parametrize(
    "field,value",
    [
        ("demo_identity_enabled", True),
        ("sql_instance", ""),
        ("storage_bucket", ""),
        ("identity_mode", "demo"),
        ("persistence_backend", "memory"),
        ("cors_origins", ["*"]),
        ("cors_origins", ["http://beta.example.com"]),
        ("model_provider_mode", "model-assisted"),
        ("logging_mode", "off"),
    ],
)
def test_unsafe_cloud_configuration_rejected(field, value):
    with pytest.raises(ValidationError):
        Settings(**{**CLOUD, field: value}, _env_file=None)


def test_no_cloud_emulator_bypass(monkeypatch):
    monkeypatch.setenv("FIREBASE_AUTH_EMULATOR_HOST", "localhost:9099")
    with pytest.raises(ValidationError):
        Settings(**CLOUD, _env_file=None)


def test_identity_adapters_and_revocation_contract():
    assert DemoIdentity().verify("demo-user").subject == "demo-user"
    with pytest.raises(ValueError):
        DemoIdentity().verify("unknown")
    verifier = object.__new__(FirebaseIdentity)
    verifier.app = object()
    verifier.verify_token = Mock(
        return_value={"uid": "verified-owner", "email": "test@example.com"}
    )
    assert verifier.verify("opaque-test-token").subject == "firebase:verified-owner"
    verifier.verify_token.assert_called_once_with(
        "opaque-test-token", app=verifier.app, check_revoked=True
    )


def test_cloud_identity_never_falls_back(monkeypatch):
    import movebooks_api.auth as auth

    monkeypatch.setattr(auth, "get_settings", lambda: Settings(**CLOUD, _env_file=None))
    verifier = Mock()
    verifier.verify.side_effect = ValueError("private-token-error")
    monkeypatch.setattr(auth, "firebase_identity", lambda project: verifier)
    client = TestClient(app)
    for token in [None, "Bearer demo-user", "Bearer revoked-token", "Basic unsupported"]:
        response = client.post("/v1/workspaces", headers={"Authorization": token} if token else {})
        assert response.status_code == 401 and "private-token" not in response.text
    assert client.get("/v1/product").status_code == 200


@pytest.mark.parametrize("kind", ["memory", "durable"])
def test_owner_cas_and_identity_immutable(durable, kind):
    repo = durable[0] if kind == "durable" else InMemoryMigrationSessionRepository()
    original = repo.put(sample())
    assert repo.get(original.id, "other-owner") is None
    changed = original.model_copy(deep=True)
    changed.stage = "assess"
    repo.put_if_unchanged(original, changed)
    with pytest.raises(ValueError):
        repo.put_if_unchanged(original, original)
    changed.owner_subject = "other-owner"
    with pytest.raises(ValueError):
        repo.put_if_unchanged(original, changed)


def test_durable_insert_cannot_overwrite(durable):
    repo, _ = durable
    session = repo.put(sample())
    with pytest.raises(ValueError):
        repo.put(session)
    with pytest.raises(ValueError):
        decode(encode(session), "other-owner")


@pytest.mark.parametrize(
    "fields", [{"C": "23505", "D": "private-driver-detail"}, {"C": "42501"}, "23505"]
)
def test_cloud_dbapi_duplicate_classification_is_narrow_and_redacted(durable, fields):
    repo, _ = durable
    session = sample()
    driver_error = DatabaseError("private-sql", None, Exception(fields))

    def fail_insert(conn, cursor, statement, parameters, context, executemany):
        if statement.lstrip().startswith("INSERT INTO migration_sessions"):
            raise driver_error

    event.listen(repo.engine, "before_cursor_execute", fail_insert)
    try:
        if isinstance(fields, dict) and fields.get("C") == "23505":
            with pytest.raises(ValueError, match="Session already exists") as raised:
                repo.put(session)
            assert "private" not in str(raised.value)
        else:
            with pytest.raises(DatabaseError) as raised:
                repo.put(session)
            assert raised.value is driver_error
    finally:
        event.remove(repo.engine, "before_cursor_execute", fail_insert)
    assert repo.get(session.id, session.owner_subject) is None


def test_concurrent_independent_connections(durable):
    repo, url = durable
    original = repo.put(sample())

    def update_stage(stage):
        engine = create_engine(url)
        updated = original.model_copy(deep=True)
        updated.stage = stage
        try:
            SqlSessionRepository(engine).put_if_unchanged(original, updated)
            return True
        except ValueError:
            return False
        finally:
            engine.dispose()

    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(update_stage, ["assess", "plan"])) == [False, True]


@pytest.mark.parametrize("case", CASES)
def test_durable_full_journey_reload_and_idempotency(durable, monkeypatch, case):
    repo, url = durable

    class ReopeningRepository(SqlSessionRepository):
        def get(self, session_id, owner_subject):
            # New engine/connection pool on every read: no Python object can supply state.
            engine = create_engine(url)
            try:
                return SqlSessionRepository(engine).get(session_id, owner_subject)
            finally:
                engine.dispose()

    monkeypatch.setattr(service, "repository", ReopeningRepository(repo.engine))
    run_golden(case)


def test_uploads_not_automatically_persisted(durable, monkeypatch, caplog):
    repo, _ = durable
    session = sample()
    session.source_kind, session.uploaded_source = (
        "user_upload",
        {"private": "raw-accounting-marker"},
    )
    with pytest.raises(ValueError):
        repo.put(session)
    with pytest.raises(ValueError):
        repo.put_uploaded(session, 16)
    import movebooks_api.intake_api as intake

    monkeypatch.setattr(intake, "get_settings", lambda: Settings(**CLOUD, _env_file=None))
    response = TestClient(app).post(
        "/v1/intake/validate",
        content=b"raw-accounting-marker",
        headers={"Authorization": "Bearer demo-user"},
    )
    assert response.status_code == 503
    assert "raw-accounting-marker" not in caplog.text


def test_artifact_owner_scope_and_consent():
    repo = InMemoryMigrationSessionRepository()
    session = repo.put(sample())
    artifacts = ArtifactService(repo, MemoryArtifacts())
    artifact = uuid4()
    with pytest.raises(ValueError):
        artifacts.put("owner", session.id, artifact, "report", b"safe")
    name = artifacts.put("owner", session.id, artifact, "report", b"safe", consent=True)
    assert (
        "owner/" not in name and artifacts.get("owner", session.id, artifact, "report") == b"safe"
    )
    with pytest.raises(PermissionError):
        artifacts.get("other", session.id, artifact, "report")
    with pytest.raises(ValueError):
        artifacts.put("owner", session.id, uuid4(), "controlled-package", b"raw", consent=True)
    artifacts.delete("owner", session.id, artifact, "report")
    with pytest.raises(KeyError):
        artifacts.get("owner", session.id, artifact, "report")


@pytest.mark.parametrize(
    "kind,artifact", [("public", uuid4()), ("report", "../secret"), ("report", "https://evil")]
)
def test_unsafe_object_names_rejected(kind, artifact):
    with pytest.raises(ValueError):
        object_name("owner", uuid4(), artifact, kind)


def test_google_storage_preconditions_and_public_policy():
    client = Mock()
    bucket = client.bucket.return_value
    bucket.iam_configuration = SimpleNamespace(
        uniform_bucket_level_access_enabled=True, public_access_prevention="enforced"
    )
    storage = GoogleArtifacts("project", "private", client)
    storage.put("scoped", b"safe")
    assert bucket.blob.return_value.upload_from_string.call_args.kwargs["if_generation_match"] == 0
    storage.delete("scoped")
    assert "if_generation_match" in bucket.blob.return_value.delete.call_args.kwargs
    bucket.iam_configuration.public_access_prevention = "inherited"
    with pytest.raises(StorageUnavailable):
        storage.put("scoped", b"safe")


def test_secret_unavailable_rotation_and_redaction():
    with pytest.raises(SecretUnavailable):
        LocalSecrets().get("model")
    client = Mock()
    client.access_secret_version.return_value.payload.data = b"not-a-real-secret"
    secrets = GoogleSecrets("project", ["model"], client)
    assert "not-a-real-secret" not in repr(secrets.get("model"))
    secrets.get("model")
    assert client.access_secret_version.call_count == 2
    with pytest.raises(SecretUnavailable):
        secrets.get("../other")
    client.access_secret_version.side_effect = RuntimeError("private-secret-marker")
    with pytest.raises(SecretUnavailable, match="^Secret unavailable$"):
        secrets.get("model")


def test_structured_logs_drop_payloads_and_untrusted_strings(caplog):
    clean = safe_fields(
        {
            "token": "private",
            "body": "raw",
            "action": "secret-action",
            "request_id": "secret",
            "stage": "migrate",
            "status": 200,
        }
    )
    assert clean == {"stage": "migrate", "status": 200}
    response = TestClient(app).get(
        "/healthz?secret=raw-accounting-marker",
        headers={"Authorization": "Bearer private-token-marker"},
    )
    assert response.status_code == 200 and response.headers["x-request-id"]
    assert "private-token-marker" not in caplog.text and "raw-accounting-marker" not in caplog.text
    records = [json.loads(r.message) for r in caplog.records if r.name == "movebooks.runtime"]
    assert records[-1]["action"] == "request"


def test_health_readiness_and_request_limit(durable, monkeypatch):
    client = TestClient(app)
    assert client.get("/healthz").status_code == client.get("/readyz").status_code == 200
    assert client.get("/v1/runtime").json()["model"] == "deterministic-fallback"
    assert client.post("/v1/workspaces", content=b"x" * (3 * 1024 * 1024 + 1)).status_code == 413
    broken = Mock()
    broken.ready.side_effect = RuntimeError("connection-password-marker")
    monkeypatch.setattr(service, "repository", broken)
    assert client.get("/readyz").status_code == 503
    assert "connection-password" not in client.get("/readyz").text


def test_analytics_rejects_raw_fields():
    with pytest.raises(ValidationError):
        AnalyticsEvent(raw_records="forbidden")
    assert DisabledAnalytics().emit(None) is None
