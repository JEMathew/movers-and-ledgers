# Google Cloud preparation — no deployment performed

## Authorized validation checkpoint — 2026-09-28

The owner authorized bounded dev/test validation in project `movebooks-ai`, region `asia-southeast1`.
The current Console session reports **“You need additional access”**; the project picker search
returns no matching accessible resource. No project resources, grants or deployments were changed.
Cloud readiness remains **AMBER**. Resolve account/project access before inventorying or creating
resources; do not assume a denied project is empty or create a replacement.

Cloud Try Your Data intake must remain disabled; this slice validates safe rejection only.
No raw tokens or service-account keys are requested. See the
[validation boundary](../architecture/google-cloud-validation.md) and
[preflight evidence and blockers](../reviews/google-cloud-validation.md).

Existing remote CI run 36342874463 passed all four jobs for the reviewed PR #12 head. The historical
local-execution statements below describe that earlier checkpoint; remote CI is now verified for
that baseline, but no live GCP or new cloud-validation commit execution is implied.

Operator handoff, **not production readiness or deployment authorization**. Read the
[architecture](../architecture/google-native-runtime.md) and [review](../reviews/google-native-runtime.md).
Docker and real PostgreSQL gates passed locally; their remote CI execution and real cloud
smoke/IAM/identity verification remain required before exposure. See the
[runtime validation record](../reviews/runtime-validation-gates.md). Only synthetic workspaces are
eligible. The inherited dependency advisory remains a hosting gate.

## Configuration

Backend reads `MOVEBOOKS_` environment variables. `.env` is for developers, never image contents.
Frontend public values are **build-time** Next.js configuration, not private runtime secrets.

| Variable | Local/test default | Cloud-dev; future staging/production |
| --- | --- | --- |
| `MOVEBOOKS_ENV` | local; development compatibility alias; test | cloud-dev; staging/production reserved future operational profiles |
| `MOVEBOOKS_PERSISTENCE_BACKEND` | memory | cloud-sql |
| `MOVEBOOKS_STORAGE_BACKEND` | memory | gcs |
| `MOVEBOOKS_IDENTITY_MODE` | demo | firebase |
| `MOVEBOOKS_DEMO_IDENTITY_ENABLED` | true | false |
| `MOVEBOOKS_MODEL_PROVIDER_MODE` | deterministic-only | deterministic-only, fallback, gemini-ready; all execute deterministically today |
| `MOVEBOOKS_LOGGING_MODE` | structured; off optionally local | structured |
| `MOVEBOOKS_ANALYTICS_MODE` | contracts-only | contracts-only or disabled; neither emits analytics |
| `MOVEBOOKS_CORS_ORIGINS` | JSON array with http://localhost:3000 | Explicit HTTPS origin array, no wildcard |
| `MOVEBOOKS_GOOGLE_PROJECT` | Empty | Firebase/GCP project ID |
| `MOVEBOOKS_SQL_INSTANCE` | Empty | Project:region:instance connection name |
| `MOVEBOOKS_SQL_DATABASE` | Empty | Application database name |
| `MOVEBOOKS_SQL_IAM_USER` | Empty | Provisioned service-account IAM DB username |
| `MOVEBOOKS_STORAGE_BUCKET` | Empty | Dedicated private bucket |
| `NEXT_PUBLIC_IDENTITY_MODE` | demo for next dev | firebase |
| `NEXT_PUBLIC_API_BASE_URL` | http://localhost:8000 | HTTPS API origin, provided at build time |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Empty | Same project as API token verifier |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Empty | Public Firebase app configuration, not a service credential |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Empty | Approved Firebase auth domain |
| `PORT` | Image default 8080 | Supplied by platform; listen on all interfaces |

Missing cloud configuration fails closed. `K_SERVICE` with local defaults is rejected, as are identity
emulators in cloud and model-assisted activation. Use attached service-account ADC; never key files
or secrets in build args. Tests never need Google credentials. Frontend/backend configs must be deployed
as a matched pair; the frontend cannot enable a backend capability.
Generic `DATABASE_URL` is unsupported and fails startup without echoing its value. Configure the
explicit Cloud SQL fields above; do not expect a URL to activate persistence or fall back to memory.

## Identity and ingress

An operator configures Firebase Authentication's Google provider, authorized frontend domains and
browser app configuration. Backend verifies ID tokens including revocation; UID determines owner.
Demo cookies never authorize cloud data. API bearer auth is distinct from Cloud Run IAM invocation.
This branch assumes application-authenticated API requests, but does **not** configure public ingress.
Private/IAM-only API ingress would require a separately reviewed BFF/IAP/load-balancer design.
Test live sign-in, revocation, domains, CORS and cross-account isolation before hosting; none was
activated here. Source: [Firebase token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens).

## Cloud SQL and artifacts

Use one PostgreSQL database with IAM DB authentication and the backend service account registered
as a database user. The Python connector provides encrypted connectivity and IAM token refresh.
Current connector uses default public-IP mode authenticated through IAM, not a DB password or an
authorized-network bypass. Private connectivity is an operator design decision before deployment.
Source: [Cloud SQL connectors](https://cloud.google.com/sql/docs/postgres/connect-connectors).

`python -m movebooks_api.runtime.schema` is an **explicit operator command under a separate migration
principal**, with complete cloud config. It bootstraps schema v1; application startup never runs DDL.
Runtime needs SELECT, INSERT, UPDATE on `migration_sessions`, not schema ownership or DROP. Future
schema changes require reviewed migrations/backward-compatible codecs; never reset data to upgrade code.

GCS bucket must have uniform bucket-level access and **enforced** public access prevention. No public
grants, ACLs, public URLs or signed-URL feature. Review a lifecycle policy (proposed synthetic cloud-dev
artifact lifetime: seven days), soft-delete/versioning, backups, region and encryption before provisioning.
These policies are not created by this branch. Source: [uniform access](https://cloud.google.com/storage/docs/uniform-bucket-level-access),
[public access prevention](https://cloud.google.com/storage/docs/public-access-prevention).

Synthetic sessions remain until a reviewed operator retention job removes them. No automated customer
deletion, retention guarantee, orphan cleanup or immutable audit archive is claimed. Artifact deletion
removes the scoped current object; retained versions/backups may remain under bucket policy. Cloud
intake remains unavailable even when a bucket exists. Local upload review is not cloud retention consent.

## Least-privilege IAM

Separate frontend, backend, schema operator, build/deploy and future analytics identities per environment.
Restrict resource scope/conditions where supported; IAM does not replace application owner predicates.

| Principal / capability | Intended minimum scope |
| --- | --- |
| Frontend | No DB, storage, secrets, analytics or model access; public shell and Firebase configuration only. |
| Backend SQL | roles/cloudsql.client and roles/cloudsql.instanceUser, condition to intended instance where supported; table grants above. |
| Backend revocation checks | Custom role with firebaseauth.users.get on identity project; no identity mutation/admin grants. |
| Backend artifacts | Dedicated-bucket custom role: storage.buckets.get, storage.objects.create/get/delete; no IAM, ACL or listing administration. |
| Backend secrets (future consumption) | roles/secretmanager.secretAccessor on named secrets only; no project-wide enumeration/admin. |
| Logging | Cloud Run stdout capture needs no direct API role; future direct emitter uses logging.logWriter, not admin. |
| Monitoring | No API emitter today; future monitoring.metricWriter only if required. |
| Analytics (future) | Separate exporter, BigQuery data editor on one dataset; job user only if jobs are needed. Runtime has none. |
| Gemini/Vertex AI (future) | No grant now; review prediction permissions/model/data egress before activation. |
| Schema operator | Temporary reviewed DB DDL rights, not application identity. |
| Build/publish (future) | Repo/ref/environment-restricted Workload Identity Federation; Artifact Registry writer on one repository. |
| Deploy (future) | Separate deployer, scoped Cloud Run developer and actAs on intended runtime identity; human environment approval. |

No Owner/Editor, service-account keys or broad storage/secret/Firebase admin roles. Provisioning operator,
not runtime, owns bucket policy. Review rate limits, abuse protection, cost/tenant quotas before Internet
access; fixed body/snapshot limits are not DDoS controls. Restrict platform logs independently of app logs.

## Images and delivery

Build from repository root:

```sh
docker build -f services/api/Dockerfile -t movebooks-api:review .
docker build -f apps/web/Dockerfile -t movebooks-web:review .
```

Default frontend args produce an unconfigured fail-closed shell suitable for CI smoke, not hosted
workspace use. Cloud builds supply the five NEXT_PUBLIC Docker ARGs. Do not pass private secrets.
Pin/scan/publish reviewed images to Artifact Registry only after human authorization; no publication
or deployment is performed here.

Initial synthetic evaluation settings: API concurrency eight, reviewed small instance/cost cap,
sixty-second request timeout, startup/readiness `/readyz`, liveness `/healthz`; frontend `/healthz`.
Probe timeout must accommodate bounded DB/bucket checks. Process state is not durable storage.
SIGTERM reaches Uvicorn via exec, with eight-second graceful drain. Source: [Cloud Run container
contract](https://cloud.google.com/run/docs/container-contract).

PR CI builds both images, boots credential-free smoke containers, checks supplied ports, non-root and
read-only execution, health/readiness, assets, synthetic sessions, production demo-auth denial and
fail-closed configuration. A PostgreSQL 17 service runs rollback, connection termination, simultaneous
CAS and fourteen golden journeys. A separate test-only image runs the real API/repository through
four application containers against one database, preserving approval/checkpoint/FPU state and
owner isolation; it also tests DB outage/recovery and in-flight graceful drain.

These gates executed successfully locally on Linux ARM64 using an isolated Docker VM with no host
mounts. Remote GitHub Actions and Linux AMD64 execution are not claimed. To reproduce from a clean checkout:

```sh
docker build -f services/api/Dockerfile -t movebooks-api:validation .
docker build -f apps/web/Dockerfile -t movebooks-web:validation .
python3 scripts/container_smoke.py
```

The script creates and removes only its uniquely named disposable containers/network/volumes.
It accepts `--docker` for a standalone CLI and respects `DOCKER_HOST`. No cloud credentials are needed.
The test-only image under `tests/runtime_harness` substitutes synthetic principals and direct PostgreSQL
connectivity; its identity/fault hooks are absent from both production images. Never deploy that image.
`MOVEBOOKS_TEST_DATABASE_URL` is exclusively a test input, not production configuration.

## Before any cloud exposure

1. Pass both container builds/smokes and PostgreSQL concurrency/reload tests; review dependency findings.
2. Resolve inherited Next.js/PostCSS advisories in a separate tested change, not an unreviewed major upgrade.
3. Under new human authorization, provision isolated synthetic cloud-dev resources and verify IAM/identity/CORS/private bucket controls.
4. Test restart/two-instance CAS, token revocation/cross-owner rejection, secret rotation/unavailability, bucket denial with real SDKs.
5. Verify backups/restore, retention/deletion, schema rollback, log exclusions and incident ownership; measure actual baselines.
6. Review Internet ingress, abuse protection, quotas, cost limits and rollback before public access.

No production thresholds/outcomes have been measured. Monitoring/BigQuery activation remains separate.
Never put credentials/records in URLs; platform request-log policy is separate from application redaction.

## Local development and rollback

`make setup`, `make dev-api`, `make dev-web` require no Google credentials. Local samples and controlled
de-identified exports retain their scope. `docker compose up --build` is a local-development profile
using next dev and memory API, not deployment. The old unused local Postgres service is removed from
the compose definition; no existing volume or database was deleted.

Rollback uses reviewed revert/image rollback, never public-history reset or dropping data. Schema
changes require backward-compatible recovery. Ambiguous writes require owner-scoped reload and
existing idempotency checks. Close the runtime gates before live Gemini/ADK activation, then run
live-model evaluation and final UX/demo/release polish under separate reviews.
