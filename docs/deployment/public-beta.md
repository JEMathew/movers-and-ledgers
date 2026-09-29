# Public Beta connectivity and release gate

**AMBER — local proxy validated; public deployment and public-origin SSO pending.**
Branch `release/public-beta`, based on `v1.0.0` / `76cebca`.
Project `movebooks-ai`; region `asia-southeast1`.

## Approved boundary

Only the existing Next.js web service becomes public. Its `/api/v1/...` handler is
an authenticated, explicitly allowlisted transport to the private API, not a new
business-logic layer. The existing web service identity receives `roles/run.invoker`
on `movebooks-beta-api` only. No project-wide invocation grant, service-account key,
new service, load balancer or VPC is required.

The proxy verifies Firebase RS256 signature, project audience/issuer, subject,
expiry, issued-at and authentication time before obtaining workload credentials.
The workload ID token goes in `X-Serverless-Authorization`; the original Firebase
token stays in `Authorization`. The API independently verifies Firebase identity
and revocation and retains every owner, approval, audit, lifecycle, financial,
retry and idempotency check. Client owner/actor headers confer no authority.

Transport: fixed deployment-owned HTTPS upstream/audience; explicit GET/POST route
allowlist; no arbitrary destination or query forwarding; same-origin mutations;
no forwarded cookies/owner/workload credential headers; 256 KiB streamed JSON
request limit; 8 MiB response limit; 60-second upstream timeout; no redirects,
automatic mutation retries, response caching or raw exception logs. The existing
idempotency header is preserved. Authenticated synthetic template download remains
available; cloud intake is rejected before reading or forwarding an upload body.

SQL retains encrypted (`ENCRYPTED_ONLY`), IAM-authenticated **public-IP** connector
access with **zero authorized networks**. This is not private-IP networking.
GCS and Secret Manager remain private. Private-IP/VPC migration is later hardening.
No production/customer/provider data, provider integrations or production/compliance
claim. Financial truth/HITL are unchanged. Optional live reasoning still requires
explicit operator configuration; do not silently enable model spend or managed ADK.

## Deployment settings — not yet applied

| Setting | Required value / intent |
| --- | --- |
| Browser build `NEXT_PUBLIC_API_BASE_URL` | `https://movebooks-beta-web-411600344727.asia-southeast1.run.app/api` |
| Server `MOVEBOOKS_PRIVATE_API_ORIGIN` | Actual private API HTTPS service origin, also the workload token audience |
| Server `MOVEBOOKS_PUBLIC_WEB_ORIGIN` | `https://movebooks-beta-web-411600344727.asia-southeast1.run.app` |
| Firebase build/runtime | Existing app/project configuration; `NEXT_PUBLIC_IDENTITY_MODE=firebase`; project ID required server-side too |
| API service IAM | Existing web SA: `roles/run.invoker`; no public principals |
| Web service IAM | `allUsers: roles/run.invoker` after hardened revision ready |
| Run scaling | Request billing, automatic scaling, min 0/max 1 each, initial bounded concurrency 8 |
| SQL availability | Existing tier/disk, ALWAYS only when live Beta gates are ready |

Current **manual zero** is a shutdown setting, not available autoscaling. Public
Beta needs automatic scaling/min 0 so requests can start an instance. Preserve
existing connector, identities and backend settings. Deploy freshly scanned immutable
digests, not historical cloud-validation images as a substitute for merged V1.

## Cost model — 29 September 2026

Soft operating target **US$25/month**; escalation ceiling **US$35/month**. Stop before
a configuration projected above the ceiling. No new always-on job/network service.
Official SQL page checked with **Singapore selected**; 730 hours/month, USD list
prices before tax/FX/credits, not a measured bill:

| Item | Estimate / qualification |
| --- | --- |
| Zonal Enterprise PostgreSQL 17 `db-f1-micro` | $0.0147/hour = **$10.731/month** running |
| Existing 10 GiB SSD | $0.000326027/GiB-hour = **$2.38/month** |
| Backups | Automated backups currently **disabled**. Used storage ~$0.112/GiB-month; hypothetical 10 GiB ~$1.12, not measured usage |
| Cloud Run | Min 0/request billing avoids provisioned idle instances. Reserve $0–5 for low-volume requests; active CPU/memory/requests/egress remain billable, free allowances account-shared |
| Artifact Registry | ~$0.10/GiB-month above first account-shared 0.5 GiB. 30 image/index records; 20 known manifest sizes sum 813,157,473 bytes before shared-layer deduplication; 10 indexes report no size. Not billed usage |
| GCS, secrets, logs, network | Reserve $1–3 at existing small evidence volume; confirm actual usage/billing before claiming exact spend |

Planning range **~$14–22/month**, assuming low traffic, small retained artifacts and
no live model calls. Public request abuse/heavy use can exceed it. Max instances and
billing alerts are **not hard spend caps**. Recalculate before increasing limits or
enabling new paid paths. SQL storage auto-resize is currently disabled. No retention
policy or existing evidence was deleted/changed. Backups disabled is an explicit
recoverability limitation to revisit before broader use, not a production durability
promise. Stopped SQL still incurs retained storage and potentially the published
idle IPv4 charge ($0.014/hour); never claim shutdown means zero total charges.

Sources: [SQL](https://cloud.google.com/sql/pricing),
[Run](https://cloud.google.com/run/pricing),
[Artifact Registry](https://cloud.google.com/artifact-registry/pricing),
[Logging](https://cloud.google.com/products/observability/pricing),
[service authentication](https://docs.cloud.google.com/run/docs/authenticating/service-to-service),
[Firebase verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens).

## Evidence and remaining gates

Fresh preflight **2026-09-29 15:19:43 UTC**: API/web public bindings empty, manual 0 /
max 1; SQL STOPPED/NEVER, pending operations 0; unfinished job executions 0 (3 inactive
definitions retained); public project IAM and workload Owner/Editor absent; GCS
public access prevention enforced/uniform access; secret public bindings empty.
Project IAM SHA-256:
`e504eb9dfc8467ebd2e8a52e9cd654aafd9afb131b7efa2dc2b7bdf21e3781a5`.
No IAM, Run, SQL or Firebase configuration changes have been applied in this slice.

Local verification covers signed-token negatives, dual authorization headers,
cross-origin/path rejection, unchanged mutation/idempotency forwarding, backend
denial preservation, upload rejection before reading, template preservation, body
bounds and safe failure. **34 new proxy/auth tests; 130 total frontend tests passed**.
Frontend lint, TypeScript and production build passed. Repository checks covered
94 Markdown / 361 text files with 0 findings; whitespace checks passed.
Focused backend runtime/owner tests: **68 passed**, existing
Starlette test-client deprecation warning only. Production npm audit: **0 vulnerabilities**.
The full historical acceptance suite is intentionally not rerun.

Remaining gates:

1. Fresh production image build/High-Critical scans. Local Docker absent; Cloud Build
   disabled (not enabled). Restore existing Cloud Shell Docker build authentication.
   Current Cloud Shell is at the human **Authorise Cloud Shell** prompt; no
   application services were started while waiting for this prerequisite.
2. Apply only approved service IAM/scaling; preserve all other runtime privileges.
3. Public HTTPS, real Firebase SSO on that origin, A access/navigation/sign-out denial,
   anonymous denial, B owner denial. No preserved approvals/invoice repeated.
4. Nine public surfaces/responsive themes/focus and one minimal safe synthetic smoke.
5. Fresh image, IAM/privacy/runtime/cost read-back and final P0/P1 clearance.

Preserved FPU workspace/invoice untouched. No deployment, merge, new tag, custom
domain or public sharing yet. Local success does not clear live gates. If blocked,
leave/return services private/manual-zero and SQL STOPPED/NEVER without deleting
data/images. A successful public Beta may retain SQL running under the approved
target; do not leave an obsolete validation-window shutdown automation active.
