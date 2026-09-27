# Google Cloud Beta validation boundary

Status: **AMBER — project access verified; provisioning approvals pending**, 2026-09-28.
This is a validation plan and observed preflight record, not a deployment or success claim.
See the [review evidence](../reviews/google-cloud-validation.md) and
[operator handoff](../deployment/google-cloud.md).

## Authorized scope

- Project ID: `movebooks-ai`; primary region: `asia-southeast1`.
- Dev/test only; synthetic migration sessions and permitted non-sensitive artifacts only.
- Normal Google Console, Cloud Shell or gcloud authentication; no service-account keys or raw tokens.
- Cloud Try Your Data intake stays disabled. Verify rejection, not upload-to-workspace completion.
- No Gemini, managed ADK, accounting-provider connectivity or production customer-data persistence.

Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential decisions.
The existing [runtime architecture](google-native-runtime.md) remains authoritative; no product,
storage, identity or lifecycle architecture is replaced by this validation slice.

## Intended validation topology — not provisioned

The existing deployable frontend uses Firebase sign-in and the backend verifies Firebase identity.
The API uses Cloud SQL PostgreSQL snapshots through the IAM connector, owner-scoped private GCS
artifact access and the allowlisted Secret Manager adapter. Cloud Run captures safe structured logs.
Live Monitoring evidence must demonstrate the requested failure signals rather than assume that
event contracts are already collectors or dashboards. No test-harness identity may be deployed.

Before provisioning, inventory existing services, enabled APIs, registry, database, bucket, secrets,
Firebase configuration, service identities, grants, billing/cost boundaries and deployment settings.
Reuse equivalent resources. Do not infer an empty project from an access-denied response. Do not
select a similarly named project or create a replacement without confirming the intended target.

Live preflight now confirms project number `411600344727`, ACTIVE state and enabled billing.
No service accounts or storage buckets were returned by their list APIs. Logging and Monitoring
APIs are enabled; Cloud Run, SQL Admin, Artifact Registry, Secret Manager, Firebase and Identity
Toolkit APIs were absent from the enabled list. Other service inventories remain unqueried until
their APIs can be enabled; their absence is not inferred solely from disabled APIs.

The next proposed setup uses dedicated backend/frontend identities, no workload Owner/Editor,
IAM SQL connectivity plus table-only runtime grants, a single private scoped-artifact bucket,
one synthetic test secret and repository-scoped image access. Specific security grants and a
billable resource spending/lifetime boundary require approval before applying them. No public
invoker grant is implied. The human owner binding remains unchanged to avoid lockout.

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
override; audit, tests and production build pass. Fresh image and remote CI verification for that
change remain required before exposure. Public reachability,
resource costs and new security-sensitive grants must be reviewed before applying them. GREEN is
restricted to the actually exercised Beta environment with no open P0/P1; production, compliance,
provider, customer-data, Gemini/ADK and production SLA/SLO claims remain excluded.
