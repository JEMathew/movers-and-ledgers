# Google Cloud dev/test deployment and validation

## Authorized validation checkpoint — 2026-09-28

### Hardened deployment and stopped handoff (current)

The 2026-09-28 live window began 11:29:14 UTC (deadline 15:29:14 UTC); rollback began at
11:59:19 UTC while awaiting human Google consent. Compute is stopped again. Overall **AMBER**,
PR #13 draft/unmerged; do not treat frontend reachability as real Firebase sign-in success.

The existing regional registry now contains these exact deployed, previously scanned images:

| Service / revision | Tag | Deployed image index digest |
| --- | --- | --- |
| `movebooks-beta-api` / `00004-n92` | `api:hardened-c80c920` | `sha256:854cee81ce688cb1a853b4e690925762d3038ab23c74e26d0b45c82ecfff6a56` |
| `movebooks-beta-web` / `00003-ngl` | `web:firebase-hardened-1fa818e` | `sha256:eab08023f3ffd8385436e939a4c86db75dc54bef9da01966ddaf680ee80c5ede` |

Registry: `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta`.
Both revisions became Ready with 100% traffic; no old-image fallback. Config/identity/probe
snapshots compared equal. Manual instance counts are now **0**, with maximum **1** retained.
Cloud SQL is **STOPPED/NEVER**, no validation jobs are running, schema identity and synthetic
secret version 1 are disabled. No bootstrap/runtime database privilege was added.

Only the two Run services temporarily received the explicitly confirmed public invoker binding.
Both bindings were removed at 11:59 UTC and final service policies contain no bindings. Ordinary
web/API routes displayed **Service is disabled** (503). Health-path 404 responses are recorded
separately, not counted as application-auth denials. SQL, GCS and Secret Manager stayed private.
Exact IAM timestamps, deployment evidence and HTTP-probe limitations are in the
[review record](../reviews/google-cloud-validation.md).

Next operator action: coordinate a human-present resumption within an agreed budget/window;
User A must click **Continue** on Google's **Sign in to movebooks-ai.firebaseapp.com** consent
page and handle any Google password/MFA prompt directly. Never copy credentials/tokens into
evidence. Until compute resumes the app may return 503. Then complete User B HTTP denial,
approval attribution, canonical synthetic FPU, restart/resume, authenticated disabled-intake
rejection and full negative-path/log-safety evidence. Remove public bindings and stop compute
again regardless of result. Do not reactivate schema bootstrap, Gemini, ADK or cloud intake.

Published `1fa818e` retains six green CI jobs. Fresh local checks pass: 255 backend tests
(10 database-only skips), 76 frontend tests, Ruff/lint/typecheck/build, zero-vulnerability
production npm audit. Exact deployed images retain zero High/Critical; no rescan is claimed
for this deployment-only continuation. Final live P0/P1 counts remain unassessed.

Normal terminal push failed authentication. Preserve documentation commit `03659c2` and its
follow-up; publish through GitHub Desktop/manual normal push without duplicate commits or force.
Retained SQL disk/network, registry images, private bucket/soft-delete objects, disabled secret,
logs and definitions may charge. Session-attributable billed cost is unavailable; US$10 is a
working target, not a guaranteed cap. No production/customer/provider data was used.

### Live-resumption preflight (historical)

Published source `1fa818e` passes all six jobs in
[CI run 36406806226](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36406806226).
The owner renewed the US$10/four-hour dev/test task. Application compute has not restarted and
the new compute window has not begun. Minimum temporary service exposure awaits action-time
confirmation; do not infer an invoker grant from the general continuation request.

Read-only preflight confirms the stopped API/web services still reference the older images:
`movebooks-beta-api-00003-v42` and `movebooks-beta-web-00002-2tf`. **Do not expose those revisions
on the basis of the replacement images' successful scans.** Prepare and scan the Firebase-configured
frontend, retain the exact hardened API image, and deploy the replacement digests before validation.
Preserve existing runtime identities and fail-closed configuration. The schema exists and its
bootstrap identity remains disabled; no new schema/admin grant is needed.

Both services remain manual-zero with no public invoker binding; SQL is STOPPED/NEVER; the bucket
has uniform access/public-access prevention; the probe secret remains disabled and no cloud job
is running. The current revision template allows up to 20 instances: reduce to a one-instance
dev/test bound on resumption, rather than relying on the previous default autoscaling ceiling.
The [latest review](../reviews/google-cloud-validation.md) records evidence and remaining gates.

Prepared Cloud Shell tags are `movebooks-api:validation` (unchanged tested API) and
`movebooks-web:firebase-1fa818e` (fresh no-cache Firebase-configured frontend). Both fresh scans
have zero High/Critical, with six/four Medium respectively and zero ignores. The configured
frontend's isolated non-root/read-only HTTP sign-in smoke passed. Exact image/report/archive hashes
are in the review. These images have **not** been pushed to Artifact Registry or deployed; do not
confuse their local index digests with the older deployed digests. No authenticated live gate is
closed by these preparation checks.

### Image-only gate closure (previous checkpoint)

Source `c80c920` passes both clean production-image scans and all six jobs in
[CI run 36405067750](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36405067750).
API High findings reduced 50 to zero; web one to zero (historically nine before npm removal).
The [image ledger](../reviews/google-cloud-image-security.md) records immutable base/image IDs,
all advisory classifications, vendor patch/native-call evidence, raw report hashes and six API /
four web residual Medium matches. No threshold weakening or suppression was used.

API image now uses matching digest-pinned Chainguard Python 3.14 development/minimal stages.
The final image contains no shell or pip: use the existing explicit Python schema command when
separately authorized, not `sh -c`. The shell-free entrypoint preserves supplied PORT and graceful
shutdown. Runtime remains UID 65532. A separate test stage must never be deployed. Web remains
Node 22, installed as pinned `nodejs-22-minimal` on a pinned Wolfi base; its glibc Node builder
preserves the Sharp native-module ABI. Rebuild/rescan when updating any pin; never silently switch
to public `latest` Python/Node major versions. Frontend Firebase public configuration remains
build-time configuration; these validation builds are not a deployment or live identity test.

Keep services/SQL stopped and PR #13 draft/unmerged. No endpoints, IAM, Firebase or cloud data
were touched during this image-only task. Overall cloud readiness remains AMBER. Human review
of image closure comes next; a separately resumed bounded live window is required for remaining
identity/E2E/recovery/monitoring checks. No blanket readiness claim follows from a scanner pass.

### Earlier image-security continuation (historical)

The earlier documentation head `05dc580` was published to draft PR #13. Its
[CI run](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36399079607) passed all four
existing jobs. This is not a result for the subsequent security changes.

Commit `54bb635` removes unused npm/npx from the final web runtime and adds a separate production
image scan matrix with retained raw JSON and an unsuppressed High threshold. Review the
[per-advisory ledger](../reviews/google-cloud-image-security.md) before resuming; no ignore rules,
test identities or auth bypasses are approved. Do not deploy an image merely because npm audit
passes. Raw scan output must survive the operator session and be tied to the exact image.

The prior operating window expired at 2026-09-28 00:37 UTC. A renewed window and the pending
action-time confirmation for temporary minimum Run invoker exposure are required. SQL and both
Run services remain stopped; no additional IAM/database grants were made in this continuation.
Firebase configuration does not substitute for real browser sign-in or two-user isolation.

### Resumed bootstrap procedure (supersedes the earlier bootstrap blocker)

The owner explicitly approved the existing built-in PostgreSQL administrator for one-time,
narrow bootstrap. The operator imported [the reviewed SQL](../../scripts/cloud_bootstrap_grants.sql)
into database `movebooks` as `postgres`; no administrator password, token or key was exported.
The SQL grants CONNECT and public-schema USAGE to the API and schema IAM DB users, and CREATE
only to the dedicated schema user. Neither gets database ownership or `cloudsqlsuperuser`.

The schema job then created `migration_sessions` and granted the API only SELECT/INSERT/UPDATE.
The operator imported [the cleanup SQL](../../scripts/cloud_bootstrap_revoke.sql), revoking the
schema identity's explicit CONNECT/USAGE/CREATE grants, and disabled its service account. This
revokes explicit bootstrap grants; it does not claim to remove privileges inherited from PUBLIC.
The disabled account retains ownership of its table for future explicitly approved migrations.

Import access was restricted to the exact object
`operator/cloud_bootstrap_grants.sql` in the private validation bucket. The managed Cloud SQL
instance service agent temporarily received only `storage.objects.get`; the human operator
received create/get/delete only for that object. No bucket listing permission was added when
the CLI upload requested it: an exact-object SDK upload used normal Cloud Shell authentication.
After both imports completed, the object was soft-deleted and both conditional bindings removed.
The custom role definitions alone do not confer access. Bucket public-access prevention remained
enforced throughout. No runtime privilege was widened to fix the duplicate-write driver issue.

Firebase Blaze, Google sign-in provider, a dev/test web app and the numeric frontend Run domain
are now configured. Analytics, Firebase Hosting, Gemini and managed ADK were not enabled.
Public Firebase browser configuration belongs in build arguments, not a private credential file.
Configuration is not proof of actual user sign-in; consult the latest review for exercised gates.

The first live duplicate-write probe exposed a difference between pg8000's legacy facade and
the Cloud SQL connector's DB-API connection. Commit `ce5ad30` handles structured SQLSTATE 23505
as duplicate rejection without swallowing other database failures. CI tests both driver paths.
Do not weaken duplicate/stale-write tests or retry an ambiguous write automatically.

The owner authorized bounded dev/test validation in project `movebooks-ai`, region `asia-southeast1`.
Minimum provisioning is now approved with a US$10/four-hour operating target (not a hard cap).
The window begins 2026-09-27 20:37 UTC and ends 2026-09-28 00:37 UTC. Stop compute earlier
when checks finish; retain and disclose storage only. The latest execution ledger in the
[review](../reviews/google-cloud-validation.md) supersedes the initial preflight below.

**Current checkpoint: AMBER; compute stopped again at approximately 2026-09-27 21:47 UTC.**
The actual resource inventory, image digests, role grants, probes and limitations are recorded in
the review. Encrypted IAM SQL transport, private synthetic artifact operations and scoped secret
retrieval/denial passed. Schema bootstrap, rollback, concurrency, duplicate rejection and durable
adapter restart/owner-isolation checks now pass. Real Firebase browser identity and canonical
cloud FPU remain unverified. Completed image scans fail the High gate (API 50, web 9 matches);
dependency-only audit success is not image clearance. Do not count adapter probes as a canonical
migration or interrupted-journey restart/resume test.

### Stopped-resource handoff

- `movebooks-beta-api` and `movebooks-beta-web`: `--scaling=0` (manual mode), not merely min=0.
- `movebooks-beta-pg`: `--activation-policy=NEVER`, observed STOPPED; update operation DONE.
- Latest one-shot probe executions completed with zero running tasks; no scheduler was created.
- `movebooks-beta-schema` service account disabled; synthetic secret version 1 disabled.
- Local Cloud Shell service-proxy process stopped. No production service or live model was enabled.
- Retained SQL 10 GB disk/network allocation, regional images, private bucket with seven-day
  soft-deleted synthetic marker, disabled secret, logs and definitions can incur ongoing charges.
  No customer records were stored. Account-wide credits do not establish this run's actual cost.

Before restarting: triage/remediate the failed image gate without suppressions, obtain the pending
action-time confirmation for minimum temporary Run invoker exposure, and confirm the continuation
fits the approved window/budget. Do not expose the current images while security clearance is open.
The schema already exists: do not re-enable bootstrap merely to restart the runtime. No
`cloudsqlsuperuser` or database ownership was granted to workloads; runtime remains table-only.
The rebuilt frontend already contains Firebase configuration. Validate two real identities, deployed
intake rejection, the complete canonical journey and recovery/failure observability next. Do not
enable customer uploads, Gemini or managed ADK. The latest review lists all grants/removals,
exact execution/image identifiers, retained resources and the non-billing cost estimate.

### Initial preflight (historical)

The earlier access denial is resolved. Console and normally authorized Cloud Shell confirm ACTIVE
project `movebooks-ai`, number `411600344727`, with billing enabled. No service accounts or buckets
exist in the returned inventory. Required runtime APIs are not yet enabled (details in the review).
No project resources, grants, APIs or deployments were changed. Cloud readiness remains **AMBER**:
confirm the proposed least-privilege setup and spending/lifetime limit before provisioning.

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
eligible. The inherited npm PostCSS findings are now resolved locally by a tested dependency override;
fresh image/remote verification and the broader cloud security review remain hosting gates.

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
2. Verify the tested Next.js/PostCSS override in fresh images and remote CI; do not apply an unreviewed major upgrade.
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
