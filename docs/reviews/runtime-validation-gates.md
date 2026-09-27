# Runtime validation gates — author-run review

Date: 2026-09-27. Branch: `feature/runtime-validation-gates`.
Baseline: `d4e5a1e550de3a01f8ae63923c138ed39b0d70d4` on `feature/google-native-runtime`.
The baseline and working tree were verified before branching; no unrelated edits were present.

**GREEN for credential-free, synthetic local runtime validation only.**
The broader Google-native/cloud release remains **AMBER**: no GCP resources, live Firebase identity,
Cloud SQL IAM, GCS, Secret Manager, Gemini or managed ADK were exercised. No hosting/production claim.
No push, merge, image publication or deployment is authorized by this review.

References: [foundation architecture](../architecture/google-native-runtime.md),
[prior review](google-native-runtime.md), [operator handoff](../deployment/google-cloud.md).
Existing public-reference/IP and licensing positioning is unchanged.

## Executed environment and results

An isolated Linux ARM64 Docker VM ran on the ARM64 macOS host: Lima 2.2.0, four CPUs, 6 GiB RAM,
30 GiB virtual disk, no host-directory mounts. Standalone Docker CLI 28.1.0 and Buildx 0.37.1 used a
task-specific configuration/socket, not the user's Docker context or credentials. Only synthetic
test identities and disposable PostgreSQL credentials were used. Images were built from a clean Git
archive of the reviewed tree; ignored local environments, dependencies and credentials were absent.

| Gate | Actual result / evidence |
| --- | --- |
| API production image | PASS: Python 3.12, `.[cloud]` installs and application wheel builds; runtime fixtures present. |
| Web production image | PASS: Node 22, `npm ci`, production Next.js build and standalone image. |
| Production container smoke | PASS: nondefault PORTs 18761/18762, HTTP health, API readiness, fixture session creation, anonymous rejection, HTML/static asset serving, production demo-auth 404. |
| Runtime isolation | PASS: both images non-root with read-only rootfs, dropped capabilities and no-new-privileges; no host mounts; test hooks, `.env` and source tests absent from production images. |
| PostgreSQL | PASS: PostgreSQL 17, real pg8000 connections, no SQLite substitute; 67 targeted runtime tests. |
| Full backend suite | PASS: 257 tests, including real PostgreSQL cases and all existing deterministic suites; no skipped PostgreSQL cases in this run. |
| Frontend | PASS: 76 tests, TypeScript, lint and production build; no UI implementation changed. |
| Repository gates | PASS: Ruff, Markdown links, bounded secret-pattern scan and whitespace checks. This is not a comprehensive dependency/image vulnerability assessment. |
| Container restart journey | PASS: four distinct application containers, one PostgreSQL database, exact snapshot comparisons at each restart boundary. |
| SIGTERM | PASS: production API and web exit zero without OOM; Uvicorn reports shutdown complete. A test-only bounded worker finishes its in-flight response before API shutdown. |
| CI | Explicit jobs configured; equivalent local commands passed. Remote GitHub Actions and Linux AMD64 execution are not claimed. |

An initial API dependency resolution attempt reported no compatible `aiohttp` candidate. The same
Dockerfile/dependency constraints built successfully on retry, including `aiohttp`; no constraints
were loosened. The precise transient fetch/resolution cause was not established. An initial database
test invocation raced the initial image pull and failed to connect; reruns after PostgreSQL readiness
passed. These attempts are not counted as successful runs.

## Persistence, restart and financial evidence

`tests/test_postgres_runtime.py` asserts a PostgreSQL dialect, initializes schema v1 twice, verifies
insert-only behavior and owner predicates, and tests actual PostgreSQL transactions. An UPDATE is
followed by division-by-zero inside the same transaction: PostgreSQL aborts it and the complete prior
snapshot remains exact. A real connection is terminated with `pg_terminate_backend` after an uncommitted
write; the commit fails, prior state survives and the pool recovers. Two simultaneous CAS writers
produce exactly one winner; the old digest is rejected afterward. A real failed SQL statement at
the API returns a redacted 503 with the same durable repository, never an in-memory fallback.

The fourteen integrated golden scenarios in `tests/test_google_runtime.py` also run against
PostgreSQL, opening a fresh engine on reads. This covers governed recovery, exact reconciliation,
stage/replay protection and FPU, not just repository CRUD.

`scripts/container_smoke.py` runs the actual API/domain/repository in a separate **test-only** image:

1. Create a synthetic session; Discover, Assess, Plan, Map and approve; retain complete state.
2. Stop the first app, start a second against the same database; compare every serialized field.
   The same synthetic owner succeeds; another owner receives 404 and no identity receives 401.
3. Start controlled migration failure; persist RESOLVING, evidence and completed checkpoint; restart.
4. Exact state survives. Replayed start is unchanged, changed key conflicts and retry without approval
   conflicts. Approve remediation and resume; the original checkpoint and eight load keys survive.
5. Verify reconciliation, govern configuration/onboarding and approve/execute FPU. The persisted invoice
   total remains exactly `107.25`; each decision has actor, role, evidence, stage, timestamp and entity.
6. Stop PostgreSQL: liveness stays 200; readiness, reload and new session creation return 503.
   Restart the database: the complete FPU snapshot is unchanged, with no recreated/local state.
7. Synchronize SIGTERM with a bounded worker's start marker; the response completes before shutdown.
8. Start a fourth app: exact final snapshot survives; duplicate FPU execution changes neither state
   nor events and there is exactly one invoice and journal. Cross-owner access still fails.

The harness swaps only connectivity and authentication: direct PostgreSQL instead of Cloud SQL IAM,
and two fixed synthetic owner principals instead of Firebase. It refuses cloud mode and `K_SERVICE`.
Its fault route and identities are not copied into deployable images. It proves process/database
durability and application owner checks, **not** real authentication, Cloud Run termination behavior,
abrupt VM/power-loss recovery or managed-service connectivity. Schema v1 bootstrap was verified;
there is no new schema migration or production upgrade/rollback claim.

## Failure-mode matrix

| Failure | Verified safe behavior |
| --- | --- |
| PostgreSQL unavailable | Actual container stop: health 200; readiness/read/write 503; recovered state exact. |
| Connection interrupted | Real backend termination: failed commit rolls back and a subsequent connection reloads prior state. |
| Malformed DATABASE_URL | Explicitly unsupported generic variable fails startup without echoing value; test harness URL parser rejects malformed input too. Production still uses explicit Cloud SQL settings. |
| Missing cloud configuration | Production image exits nonzero; `K_SERVICE` cannot silently select local demo defaults. |
| Invalid secret reference | Five negative references rejected before any SDK call; no secret or raw error returned. |
| Stale concurrency token | Actual simultaneous transactions: one winner, one conflict; stale follow-up rejected. |
| Replayed request | Migration/FPU replay after process restart neither duplicates execution nor audit state; changed execution key conflicts. |
| Unauthorized owner | Owner predicate and authenticated API checks deny access after restarts; no client owner override. |
| Malformed artifact reference | Invalid workspace/artifact/kind rejected with no storage writes. Real GCS is not exercised. |
| Shutdown during bounded work | Start-marker synchronization, bounded response completes, app drains and exits zero; no arbitrary assertion sleep. |

No PostgreSQL-specific correctness difference required changing the snapshot/CAS implementation.
The actual transaction, rollback and connection behavior agreed with its contract. Two narrowly
scoped runtime findings were addressed below; no journey, approval or deterministic policy was changed.

## Author-run review and remediation

This is an author-run review, not independent certification. No aggregate score is assigned.

| Lens | Finding / severity / disposition |
| --- | --- |
| Backend engineer | **P2, resolved:** shutdown assumed every SQL repository had a Cloud SQL connector; direct PostgreSQL has only an engine. Guard connector cleanup; actual container shutdown now completes. Existing cloud connector cleanup remains intact. |
| Platform engineer | **P1, resolved:** generic `DATABASE_URL` was ignored and could misleadingly leave local memory selected. Reject it explicitly without printing the value; unit and production-container negative tests pass. No new production DB mode introduced. |
| SRE | **P2, remaining:** local probes/drain/outage recovery verified, but Cloud Run termination/concurrency, SLOs, quotas, backup restore and incident ownership need live operator validation. No production exposure in this slice. |
| Security engineer | No new unresolved P0/P1 within exercised scope. Synthetic hooks isolated from production images; non-root/read-only smoke, owner denial, reference validation and redacted SQL/config failures verified. **P2, remaining:** inherited Next.js/PostCSS advisory and image/dependency pinning/scanning remain pre-hosting gates. |
| Database engineer | Real PostgreSQL rollback, CAS contention, interrupted connection and exact reload passed. **P2, remaining:** actual IAM grants, Cloud SQL connector/network behavior, multi-instance cloud stress, future schema upgrades and backup restore remain unverified. |
| AI platform architect | No live model calls, credentials or managed session runtime added. Financial verification, orchestration, approval and replay controls stay deterministic. Model/ADK activation requires a separate reviewed slice. |
| Product engineer | Full governed synthetic journey survives restarts with evidence and FPU. No bypass, new UI, production migration claim or scope extension. **P3, remaining:** inherited Starlette test-client deprecation warning. |

Initial slice findings: P0: 0; P1: 1 (resolved); P2 cleanup finding resolved.
Final unresolved **P0: 0; P1: 0** in exercised local-runtime scope. Remaining operational/security
gates are non-blocking for this credential-free slice, but block broader hosting/production readiness.

## Reproduction and CI gates

From a clean checkout, with Python 3.11+ and Node 22:

```sh
pip install -e '.[dev,cloud]'
docker run -d --name movebooks-postgres-contract -p 127.0.0.1:15432:5432 \
  -e POSTGRES_USER=contract -e POSTGRES_PASSWORD=ephemeral-ci-only \
  -e POSTGRES_DB=contract postgres:17-alpine
docker exec movebooks-postgres-contract pg_isready -U contract
# Wait until pg_isready succeeds before running the following commands.
export MOVEBOOKS_TEST_DATABASE_URL=postgresql+pg8000://contract:ephemeral-ci-only@127.0.0.1:15432/contract
pytest tests/test_google_runtime.py tests/test_postgres_runtime.py \
  tests/test_runtime_faults.py tests/test_validation_failures.py -q
pytest -q
ruff check .
python scripts/repository_checks.py
git diff --check
npm --prefix apps/web ci
npm --prefix apps/web run test
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web run build
docker build -f services/api/Dockerfile -t movebooks-api:validation .
docker build -f apps/web/Dockerfile -t movebooks-web:validation .
python scripts/container_smoke.py
# Remove only this disposable test container and its anonymous test volume.
docker rm -f -v movebooks-postgres-contract
```

Local execution used `.venv/bin/python`, `.venv/bin/pytest`, `.venv/bin/ruff`, a standalone Docker
path and task-specific `DOCKER_HOST`/`DOCKER_CONFIG`. No persistent user Docker context was changed.
Without `MOVEBOOKS_TEST_DATABASE_URL`, the five new PostgreSQL-only unit cases explicitly skip;
that does **not** satisfy the PostgreSQL gate. CI supplies the URL and an actual health-checked
PostgreSQL service. The container gate fails without a working Docker daemon; there is no mock pass.

[CI](../../.github/workflows/ci.yml) separately gates backend/configuration/reference failures,
frontend test/lint/typecheck/build, real PostgreSQL integration, Docker builds and the container
journey. Existing Markdown/secret-pattern/whitespace checks are retained. All use synthetic data and
need no cloud credentials. Remote CI still requires authorized publication and execution.

## Remaining cloud validation and next phase

After human review/publication, require remote CI (including Linux AMD64). Before any exposure,
resolve inherited hosting advisories and authorize isolated synthetic cloud-dev validation:
Cloud Run PORT/probes/drain and two-instance concurrency; Cloud SQL IAM and least-privilege grants;
Firebase real sign-in/revocation/cross-owner behavior; private GCS policy/denials; live Secret Manager
rotation/outage; backups, rollback, retention, log policy and quotas. No such resources were used here.
Gemini and managed ADK remain inactive until the deterministic cloud substrate is separately proved.
