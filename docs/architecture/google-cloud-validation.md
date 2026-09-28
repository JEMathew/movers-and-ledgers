# Google Cloud Beta validation boundary

Status: **AMBER — image gates and durable adapter validation passed; live identity/E2E incomplete; compute stopped**, 2026-09-28.
This is a validation plan and evidence boundary, not a success claim.
See the [review evidence](../reviews/google-cloud-validation.md) and
[operator handoff](../deployment/google-cloud.md).

## Authorized scope

### 2026-09-28 hardened deployment and stopped handoff (current)

The exact scanned API and Firebase-configured web images were published and deployed to Ready
revisions `movebooks-beta-api-00004-n92` and `movebooks-beta-web-00003-ngl`, with 100% traffic.
Environment, workload identities, commands and probes were unchanged. The dev/test instance
ceiling was reduced to one. Image digests, report hashes and timestamps are recorded in the
[review checkpoint](../reviews/google-cloud-validation.md).

Following the owner's explicit confirmation, only these two services temporarily received
`allUsers` / `roles/run.invoker`. The frontend loaded and Google consent for User A was reached,
but the required human **Continue** action was not completed. This is not authenticated identity
or backend owner-isolation evidence. The external HTTP probe aborted on a non-JSON response;
platform readiness/internal health probes must not be substituted for external route validation.

Both public bindings were removed at 11:59 UTC. Run manual counts are zero, Cloud SQL is
STOPPED/NEVER, jobs are idle, and temporary schema/secret identities remain disabled. Private
SQL/GCS/Secret Manager boundaries and runtime privileges were preserved throughout. Only new
image versions/revisions and evidence were added; product architecture and financial truth did
not change. Cloud intake, Gemini and managed ADK remain disabled.

Real two-user HTTP isolation, attributed approvals, canonical cloud FPU, journey restart/resume,
authenticated intake rejection and complete failure/log-safety coverage remain unverified.
Final live P0/P1 counts are not assessed, not zero. Overall readiness remains **AMBER**. Resume
only for a coordinated human-present bounded window, retaining shutdown/rollback obligations.

### 2026-09-28 live-resumption preflight (historical)

The owner renewed the bounded dev/test task. Published head `1fa818e` passes all six CI jobs,
but read-only preflight confirms the stopped Run revisions still use the old images. Image-gate
closure applies to tested replacements, not those deployed digests. Rebuild the frontend with
its approved public Firebase configuration, scan the exact result, and deploy hardened images
before any temporary exposure. No application code or architecture changes are required by this
preflight. Firebase configuration is present, but real sign-in remains unverified.

Application compute remains stopped; no temporary invoker grant has been applied and the renewed
application-compute window has not begun. Minimum endpoint exposure still requires action-time
confirmation. See the latest [review checkpoint](../reviews/google-cloud-validation.md) for the
exact deployed-image discrepancy, private-resource checks and remaining authenticated gates.

### 2026-09-28 security continuation

The image-only continuation closes the High gate for source `c80c920`: both clean image scans
and all six CI jobs pass. API uses a matched digest-pinned, shell/pip-free Python 3.14 runtime;
web retains Node 22 with vendor-patched Wolfi libraries and a glibc-compatible builder. Product
architecture, deterministic controls, identity and lifecycle behavior are unchanged. See the
[per-advisory record](../reviews/google-cloud-image-security.md) for patch/applicability proof
and residual Medium findings. This does not authorize deployment or prove live browser identity.

The previous four-hour window has expired. Application compute remains stopped while image
findings are investigated; a renewed bounded window and action-time endpoint confirmation are
required before live browser testing. The [per-advisory image ledger](../reviews/google-cloud-image-security.md)
distinguishes tooling from runtime reachability without suppressing findings. Runtime npm removal
and an unsuppressed CI image gate do not alter product architecture or authorize public exposure.
Real two-user identity, attributed approvals, canonical cloud FPU and interrupted-journey recovery
remain required and must not be inferred from adapter tests.

- Project ID: `movebooks-ai`; primary region: `asia-southeast1`.
- Dev/test only; synthetic migration sessions and permitted non-sensitive artifacts only.
- Normal Google Console, Cloud Shell or gcloud authentication; no service-account keys or raw tokens.
- Cloud Try Your Data intake stays disabled. Verify rejection, not upload-to-workspace completion.
- No Gemini, managed ADK, accounting-provider connectivity or production customer-data persistence.
- Owner approved minimum provisioning and a US$10/four-hour operating target, not a hard cap.
  Window starts 2026-09-27 20:37 UTC; compute must stop by 2026-09-28 00:37 UTC or earlier.
  Retained storage may continue charging. Firebase Blaze is now authorized and configured;
  temporary public application invocation still awaits action-time confirmation. Buckets/database
  must never be publicly accessible. Failed image gates also block public exposure.

Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential decisions.
The existing [runtime architecture](google-native-runtime.md) remains authoritative; no product,
storage, identity or lifecycle architecture is replaced by this validation slice.

## Validation topology

The existing deployable frontend uses Firebase sign-in and the backend verifies Firebase identity.
The API uses Cloud SQL PostgreSQL snapshots through the IAM connector, owner-scoped private GCS
artifact access and the allowlisted Secret Manager adapter. Cloud Run captures safe structured logs.
Live Monitoring evidence must demonstrate the requested failure signals rather than assume that
event contracts are already collectors or dashboards. No test-harness identity may be deployed.

Before provisioning, inventory existing services, enabled APIs, registry, database, bucket, secrets,
Firebase configuration, service identities, grants, billing/cost boundaries and deployment settings.
Reuse equivalent resources. Do not infer an empty project from an access-denied response. Do not
select a similarly named project or create a replacement without confirming the intended target.

Initial live preflight confirmed project number `411600344727`, ACTIVE state and enabled billing.
No service accounts or storage buckets were returned by their list APIs. Logging and Monitoring
APIs are enabled; Cloud Run, SQL Admin, Artifact Registry, Secret Manager, Firebase and Identity
Toolkit APIs were absent from the enabled list. Other service inventories remain unqueried until
their APIs can be enabled; their absence is not inferred solely from disabled APIs.

The approved setup uses dedicated backend/frontend identities, no workload Owner/Editor,
IAM SQL connectivity plus table-only runtime grants, a single private scoped-artifact bucket,
one synthetic test secret and repository-scoped image access. Specific security grants and a
billable resource spending/lifetime boundary were approved for this bounded run. No public
invoker grant is implied. The human owner binding remains unchanged to avoid lockout.

Following approval, required APIs were enabled and isolated resources provisioned: a zonal
PostgreSQL 17 `db-f1-micro` instance with 10 GB SSD, IAM authentication, encrypted connections
and connector enforcement; one regional image repository; a private uniform-access bucket;
dedicated API/frontend/temporary-schema identities; and a non-credential synthetic secret probe.
The SQL connector uses a public IP but no authorized networks: IAM-authenticated connector
access is required, not public database access. Backups are disabled for this disposable
synthetic validation database; this configuration is explicitly unsuitable for production.

The one-shot `scripts/cloud_validation_probe.py` exercises actual adapters using attached
identities. It is not an HTTP endpoint, does not override authentication, and is not copied into
the application image. Adapter checks cannot substitute for real Firebase identity, browser
E2E, HITL attribution or a verified FPU receipt. Exact evidence and resource disposition belong
in the review record.

The initial schema blocker is resolved using the owner-authorized built-in administrator for
one-time CONNECT/USAGE and schema-identity CREATE only. The dedicated schema job created the table
and granted API SELECT/INSERT/UPDATE. Explicit bootstrap grants and exact-object import bindings
were removed, the object soft-deleted, and the schema identity disabled. No workload received
cloudsqlsuperuser or database ownership. Runtime DDL/DELETE remain prohibited.

Actual Cloud Run jobs now pass schema-backed IAM persistence, duplicate/stale-write rejection,
rollback, concurrent CAS, interrupted-connection recovery, private owner-scoped ArtifactService
operations and scoped secret retrieval/failure. A Cloud SQL restart and new job preserved a
synthetic sentinel; a subsequent read-only check confirmed owner isolation and absence of runtime
admin privileges. This is adapter evidence, not a canonical journey or real two-user HTTP proof.

The live duplicate-write probe exposed a pg8000 DB-API classification difference. The narrow
SQLSTATE 23505 fix is covered by both legacy and connector-style PostgreSQL CI tests; unrelated
database failures still propagate. No write replay, overwrite or permission bypass was introduced.

Both rebuilt Run revisions are platform Ready. The private CLI proxy still returned platform 404,
so external HTTP reachability is not passed. Firebase Google sign-in/web-app configuration exists,
but actual browser sign-in, approval attribution, cross-user HTTP denial and cloud FPU are unverified.
Safe startup/probe logs and real Run instance-count Monitoring series were inspected; full failure
signal coverage and alert delivery remain unverified.

At the checkpoint both services use manual scaling zero, Cloud SQL is STOPPED/activation NEVER,
jobs have zero running tasks, and the temporary bootstrap identity/secret probe version are disabled.
Storage is retained and may charge. Keep compute stopped until blockers in the review are resolved.

## Required evidence before GREEN

Record deployed image digests/revisions and effective non-secret configuration. Exercise Cloud Run
startup, health/readiness and shutdown; actual IAM database connectivity, schema bootstrap, rollback,
concurrency, stale-write rejection and durable recovery; real identity and cross-user denial; private
artifact operations; secret retrieval/denial; IAM and safe logging/monitoring. Run one canonical
synthetic session through every approval, governed recovery and deterministic verified FPU check.
Recheck exact state, ownership, checkpoints, decisions, audit and replay after redeployment and a
bounded database interruption. Scope failure injection to confirmed isolated dev/test resources.

Cloud intake validation is a negative check: the browser must not send the selected package,
the API must reject intake, and the durable repository must reject uploaded workspace persistence.
Local mocked configuration tests are supporting evidence, not live cloud evidence.

The reported npm PostCSS advisory has been remediated locally with a targeted Next.js dependency
override; audit, tests and production build pass. Fresh Linux images build and the API's pip
remediation passes a Python dependency audit. Fresh remote CI passed on `ce5ad30`, but completed
Grype image scans failed the High threshold: API 50 High matches, web 9. These are package/advisory
matches, not automatically distinct product P1s; vendor/version/reachability triage and supported
image hardening remain mandatory. Do not weaken the gate or infer clearance from dependency-only
audits. Public reachability,
resource costs and new security-sensitive grants must be reviewed before applying them. GREEN is
restricted to the actually exercised Beta environment with no open P0/P1; production, compliance,
provider, customer-data, Gemini/ADK and production SLA/SLO claims remain excluded.
