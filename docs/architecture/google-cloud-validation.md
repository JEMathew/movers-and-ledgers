# Google Cloud Beta validation boundary

Status: **AMBER — bounded transport validation complete; compute stopped**, 2026-09-28.
This is a validation plan and evidence boundary, not a success claim.
See the [review evidence](../reviews/google-cloud-validation.md) and
[operator handoff](../deployment/google-cloud.md).

## Authorized scope

- Project ID: `movebooks-ai`; primary region: `asia-southeast1`.
- Dev/test only; synthetic migration sessions and permitted non-sensitive artifacts only.
- Normal Google Console, Cloud Shell or gcloud authentication; no service-account keys or raw tokens.
- Cloud Try Your Data intake stays disabled. Verify rejection, not upload-to-workspace completion.
- No Gemini, managed ADK, accounting-provider connectivity or production customer-data persistence.
- Owner approved minimum provisioning and a US$10/four-hour operating target, not a hard cap.
  Window starts 2026-09-27 20:37 UTC; compute must stop by 2026-09-28 00:37 UTC or earlier.
  Retained storage may continue charging. Temporary public app ingress and Firebase Blaze
  activation are separate pending decisions; buckets/database must never be publicly accessible.

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

Actual Cloud Run jobs passed encrypted IAM SQL SELECT, private synthetic artifact transport,
Secret Manager transport and frontend-identity denial for artifacts/secrets. The backend revision
failed startup readiness with safe 503/UNAVAILABLE logs because schema bootstrap is blocked;
the frontend revision is platform Ready but its HTTP route was not verified. Firebase activation
and temporary public app ingress require separate confirmation. No authenticated journey, cloud
workspace isolation, persisted lifecycle or verified FPU success is claimed.

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
remediation passes a Python dependency audit. Fresh remote CI and OS-image review remain required
before exposure. Public reachability,
resource costs and new security-sensitive grants must be reviewed before applying them. GREEN is
restricted to the actually exercised Beta environment with no open P0/P1; production, compliance,
provider, customer-data, Gemini/ADK and production SLA/SLO claims remain excluded.
