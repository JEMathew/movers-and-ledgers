"""Bounded dev/test adapter probes, not an authenticated product E2E or HTTP endpoint.

Run as a one-shot Cloud Run job with its attached workload identity. Never supplies
credentials, changes identity verification, imports the test auth harness, or emits data.
The operator must provision the explicit environment and authorize the synthetic writes.
"""

import json
import sys
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import UUID, uuid4

from movebooks_api.runtime.persistence import SqlSessionRepository, cloud_engine, metadata, sessions
from movebooks_api.runtime.secrets import GoogleSecrets, SecretUnavailable
from movebooks_api.runtime.storage import ArtifactService, GoogleArtifacts, StorageUnavailable
from movebooks_api.settings import get_settings
from sqlalchemy import event, text
from sqlalchemy.exc import DBAPIError

from domain.discovery_assessment.models import MigrationSession

PROJECT = "movebooks-ai"
INSTANCE = "movebooks-ai:asia-southeast1:movebooks-beta-pg"
BUCKET = "movebooks-ai-beta-artifacts"
RUNTIME_USER = "movebooks-beta-api@movebooks-ai.iam"
SENTINEL = UUID("b7c7fc3e-1bed-48a4-a945-290fa5542063")
OWNER = "synthetic-cloud-validation-20260928"


def report(check):
    print(json.dumps({"severity": "INFO", "probe": check, "result": "PASS"}), flush=True)


def reject(operation, error):
    try:
        operation()
    except error:
        return
    raise AssertionError("Expected safe rejection")


def run(mode):
    settings = get_settings()
    assert settings.env == "cloud-dev" and settings.google_project == PROJECT
    assert settings.sql_instance == INSTANCE and settings.storage_bucket == BUCKET
    assert settings.model_provider_mode == "deterministic-only"
    if mode == "denied":
        from google.api_core.exceptions import Forbidden
        from google.cloud import secretmanager

        reject(GoogleArtifacts(PROJECT, BUCKET).ready, Forbidden)
        client = secretmanager.SecretManagerServiceClient()
        reject(
            lambda: client.access_secret_version(
                request={
                    "name": f"projects/{PROJECT}/secrets/movebooks-beta-probe/versions/latest"
                },
                timeout=5,
                retry=None,
            ),
            Forbidden,
        )
        report("unprivileged-workload-denied-bucket-and-secret")
        return
    engine, connector = cloud_engine(settings)
    try:
        if mode == "transport":
            # These are SDK transport probes, not workspace ownership or product E2E proof.
            with engine.connect() as connection:
                assert connection.scalar(text("SELECT current_user")) == RUNTIME_USER
                assert connection.scalar(text("SELECT 1")) == 1
            report("iam-sql-encrypted-connector-select")
            storage = GoogleArtifacts(PROJECT, BUCKET)
            from movebooks_api.runtime.storage import object_name

            name = object_name(OWNER, uuid4(), uuid4(), "safe-summary")
            storage.put(name, b"synthetic transport probe")
            try:
                assert storage.get(name) == b"synthetic transport probe"
                reject(lambda: storage.put(name, b"duplicate probe"), StorageUnavailable)
            finally:
                storage.delete(name)
            reject(lambda: storage.get(name), StorageUnavailable)
            report("private-gcs-transport-create-read-duplicate-delete-missing")
            secrets = GoogleSecrets(PROJECT, ["movebooks-beta-probe", "movebooks-beta-missing"])
            secret = secrets.get("movebooks-beta-probe")
            assert secret.get_secret_value() == "synthetic-validation-marker-not-a-credential"
            assert "synthetic-validation" not in str(secret)
            reject(lambda: secrets.get("movebooks-beta-missing"), SecretUnavailable)
            reject(lambda: secrets.get("not-allowlisted"), SecretUnavailable)
            report("secret-transport-retrieval-redaction-unavailable")
            return
        if mode == "schema":
            assert settings.sql_iam_user == "movebooks-beta-schema@movebooks-ai.iam"
            # A DBA must pregrant CONNECT/USAGE to both identities and CREATE only
            # to this bootstrap identity. It never needs database ownership.
            metadata.create_all(engine)
            with engine.begin() as connection:
                connection.execute(
                    text(f'GRANT SELECT, INSERT, UPDATE ON migration_sessions TO "{RUNTIME_USER}"')
                )
            report("schema-bootstrap-and-runtime-table-grants")
            return

        assert settings.sql_iam_user == RUNTIME_USER
        repository = SqlSessionRepository(engine)
        repository.ready()
        with engine.connect() as connection:
            assert connection.scalar(text("SELECT current_user")) == RUNTIME_USER
            assert not connection.scalar(
                text("SELECT has_schema_privilege(current_user, 'public', 'CREATE')")
            )
            assert not connection.scalar(
                text("SELECT has_table_privilege(current_user, 'migration_sessions', 'DELETE')")
            )
        report("attached-identity-and-no-ddl-delete")

        if mode == "resume":
            persisted = repository.get(SENTINEL, OWNER)
            assert persisted is not None and persisted.company_name == "Synthetic restart sentinel"
            report("persisted-state-survives-new-job-execution")
            return

        original = repository.put(
            MigrationSession(
                owner_subject=OWNER,
                sample_company_id="harbor-light-migrate-demo",
                company_name="Synthetic adapter probe",
            )
        )
        report("synthetic-session-inserted")
        assert repository.get(original.id, OWNER) == original
        assert repository.get(original.id, "different-owner") is None
        report("synthetic-session-read-and-owner-filter")
        reject(lambda: repository.put(original), ValueError)
        report("persistence-owner-isolation-duplicate-rejection")
        updated = original.model_copy(deep=True)
        updated.stage = "assess"

        def fail_after_update(conn, cursor, statement, parameters, context, executemany):
            if statement.lstrip().startswith("UPDATE migration_sessions"):
                cursor.execute("SELECT 1 / 0")

        event.listen(engine, "after_cursor_execute", fail_after_update)
        try:
            reject(lambda: repository.put_if_unchanged(original, updated), DBAPIError)
        finally:
            event.remove(engine, "after_cursor_execute", fail_after_update)
        assert repository.get(original.id, OWNER) == original
        report("actual-database-transaction-rollback")

        barrier = Barrier(2)

        def write(stage):
            candidate = original.model_copy(deep=True)
            candidate.stage = stage
            barrier.wait(timeout=15)
            try:
                repository.put_if_unchanged(original, candidate)
                return True
            except ValueError:
                return False

        with ThreadPoolExecutor(max_workers=2) as pool:
            assert sorted(pool.map(write, ["assess", "plan"])) == [False, True]
        reject(lambda: repository.put_if_unchanged(original, updated), ValueError)
        report("concurrent-cas-single-winner-and-stale-write-rejection")

        with engine.connect() as interrupted:
            pid = interrupted.scalar(text("SELECT pg_backend_pid()"))
            interrupted.execute(
                sessions.update()
                .where(sessions.c.id == str(original.id))
                .values(snapshot="uncommitted synthetic fault")
            )
            with engine.begin() as killer:
                assert killer.scalar(text("SELECT pg_terminate_backend(:pid)"), {"pid": pid})
            reject(interrupted.commit, DBAPIError)
        assert repository.get(original.id, OWNER) is not None
        report("terminated-connection-rollback-and-pool-recovery")

        storage = GoogleArtifacts(PROJECT, BUCKET)
        artifacts = ArtifactService(repository, storage)
        artifact = uuid4()
        artifacts.put(
            OWNER, original.id, artifact, "safe-summary", b"synthetic probe", consent=True
        )
        assert artifacts.get(OWNER, original.id, artifact, "safe-summary") == b"synthetic probe"
        reject(
            lambda: artifacts.get("different-owner", original.id, artifact, "safe-summary"),
            PermissionError,
        )
        reject(
            lambda: artifacts.put(
                OWNER, original.id, uuid4(), "controlled-package", b"rejected", consent=True
            ),
            ValueError,
        )
        artifacts.delete(OWNER, original.id, artifact, "safe-summary")
        reject(
            lambda: artifacts.get(OWNER, original.id, artifact, "safe-summary"), StorageUnavailable
        )
        report("private-gcs-scoped-io-cross-owner-package-and-missing-object-rejection")

        secrets = GoogleSecrets(PROJECT, ["movebooks-beta-probe", "movebooks-beta-missing"])
        secret = secrets.get("movebooks-beta-probe")
        assert secret.get_secret_value() == "synthetic-validation-marker-not-a-credential"
        assert "synthetic-validation" not in str(secret)
        reject(lambda: secrets.get("movebooks-beta-missing"), SecretUnavailable)
        reject(lambda: secrets.get("not-allowlisted"), SecretUnavailable)
        report("runtime-secret-retrieval-redaction-and-safe-unavailable")
        if repository.get(SENTINEL, OWNER) is None:
            repository.put(
                MigrationSession(
                    id=SENTINEL,
                    owner_subject=OWNER,
                    sample_company_id="harbor-light-migrate-demo",
                    company_name="Synthetic restart sentinel",
                )
            )
        report("restart-sentinel-persisted")
    finally:
        engine.dispose()
        connector.close()


if __name__ == "__main__":
    try:
        mode = sys.argv[1]
        assert mode in {"schema", "runtime", "resume", "denied", "transport"}
        run(mode)
    except Exception as error:
        # No exception message/traceback: SDK errors may contain records or credentials.
        diagnostic = {"severity": "ERROR", "probe": "failed", "type": type(error).__name__}
        if isinstance(error, DBAPIError):
            # pg8000 exposes SQLSTATE in its structured driver fields. Never log
            # SQL, parameters, exception messages, detail or connection values.
            fields = error.orig.args[0] if error.orig.args else None
            code = fields.get("C") if isinstance(fields, dict) else None
            if isinstance(code, str) and len(code) == 5 and code.isalnum():
                diagnostic["sqlstate"] = code
        print(json.dumps(diagnostic))
        sys.exit(1)
