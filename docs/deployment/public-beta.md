# Public Beta connectivity and release gate

**AMBER — public web/private API deployed; public-origin SSO/owner checks pending.**
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

## Deployment settings

| Setting | Required value / intent |
| --- | --- |
| Browser build `NEXT_PUBLIC_API_BASE_URL` | `https://movebooks-beta-web-411600344727.asia-southeast1.run.app/api` |
| Server `MOVEBOOKS_PRIVATE_API_ORIGIN` | Actual private API HTTPS service origin, also the workload token audience |
| Server `MOVEBOOKS_PUBLIC_WEB_ORIGIN` | `https://movebooks-beta-web-411600344727.asia-southeast1.run.app` |
| Firebase build/runtime | Existing app/project configuration; `NEXT_PUBLIC_IDENTITY_MODE=firebase`; project ID required server-side too |
| API service IAM | Existing web SA: `roles/run.invoker`; no public principals |
| Web service IAM | `allUsers: roles/run.invoker` after hardened revision ready |
| Run scaling | Request billing, automatic scaling, min 0/max 1 each, initial bounded concurrency 8 |
| SQL availability | Existing tier/disk, RUNNABLE / ALWAYS for the authorized public-Beta gate checks |

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
No IAM, Run, SQL or Firebase configuration changes had been applied at that preflight.
The scoped changes and fresh read-back below supersede that baseline.

Local verification covers signed-token negatives, dual authorization headers,
cross-origin/path rejection, unchanged mutation/idempotency forwarding, backend
denial preservation, upload rejection before reading, template preservation, body
bounds and safe failure. **34 new proxy/auth tests; 130 total frontend tests passed**.
Frontend lint, TypeScript and production build passed. Repository checks covered
94 Markdown / 361 text files with 0 findings; whitespace checks passed.
Focused backend runtime/owner tests: **68 passed**, existing
Starlette test-client deprecation warning only. Production npm audit: **0 vulnerabilities**.
The full historical acceptance suite is intentionally not rerun.

Image preparation and remaining gates:

1. Fresh production image build/High-Critical scans. Local Docker absent; Cloud Build
   disabled (not enabled). Cloud Shell authorization was completed. The official
   gcloud Cloud Shell SSH/SCP path builds the exact `7e4a82c` archive using existing
   Docker and normal user authentication, without a new build service or workload
   privilege. Existing public Firebase browser settings are reused; no user tokens
   or service-account keys are extracted. Both clean builds and strict image scans
   passed: API **0 High / 0 Critical, 6 Medium**; web **0 High / 0 Critical, 4 Medium**.
   No suppressions or threshold changes were used.
2. Approved service IAM/scaling applied and read back; other runtime privileges preserved.
3. Public HTTPS, real Firebase SSO on that origin, A access/navigation/sign-out denial,
   anonymous denial, B owner denial. No preserved approvals/invoice repeated.
4. Nine public surfaces/responsive themes/focus passed on the first deployed image;
   minimal authenticated synthetic entry/read-only workspace smoke remains pending.
5. Fresh image, IAM/privacy/runtime/cost read-back and final P0/P1 clearance.

Preserved FPU workspace/invoice untouched by this attempt. The previous successful
FPU and single posting are historical evidence until authenticated read-back; no
new workspace, approvals or financial writes were performed. No merge, release tag
or custom domain. The web URL is publicly reachable but **not yet cleared for
sharing**. Local success does not clear live gates. Keep the authorized runtime
available for human-present sign-in; if validation is abandoned or a security gate
fails, return services private/manual-zero and SQL STOPPED/NEVER without deleting
data/images. A successful public Beta may retain SQL running under the approved
target; do not reuse the expired earlier one-shot negative-validation cleanup window.

### Applied changes and read-back — 29 September 2026

- SQL resume operation `bfe1174e-6d93-4ea8-9f0a-98f000000031` ran
  **15:57:42–16:09:02 UTC**, completed without error. No tier, disk, network,
  database grant, backup or retention change.
- API revision `movebooks-beta-api-00011-c45` Ready at **16:10:04 UTC**;
  first web revision `movebooks-beta-web-00005-p7l` Ready at **16:04:18 UTC**.
  Both use the immutable digests below, existing service accounts, concurrency 8,
  max 1, automatic scaling/default min 0, request-based CPU allocation. Existing
  API environment is unchanged, including Firebase and `deterministic-only` routing.
- Exactly two service policy changes: web `allUsers: roles/run.invoker`; API
  `serviceAccount:movebooks-beta-web@movebooks-ai.iam.gserviceaccount.com` with
  `roles/run.invoker`. No API public principal or project-wide invocation grant.
- Read-back **16:16:45 UTC**: both Ready; API public bindings empty; web public
  binding exactly as authorized; SQL RUNNABLE/ALWAYS, pending operations 0;
  unfinished job executions 0; three existing inactive job definitions retained.
  Project IAM hash unchanged; no public project binding or workload Owner/Editor.
  GCS public access prevention enforced/uniform access, no public bucket binding;
  existing secret public bindings empty.
- Final read-back **16:24:42 UTC**, after the copy-corrected web rollout, confirms
  the same IAM/privacy/scaling/SQL state, unchanged project IAM hash and zero running
  jobs. Direct API **403** and anonymous protected web proxy **401** were reconfirmed.
- Live anonymous checks: direct API **403** after Ready; web protected proxy **401**
  with explicit Google sign-in requirement. These do not substitute for real-user
  verification of the dual-token proxy and owner isolation.
- All nine public routes inspected at desktop/dark and mobile/light (390×844),
  plus mobile/dark spot check. No raw/default HTML or horizontal overflow. Mobile
  menu opened with Enter, Product navigation closed it, keyboard focus had a visible
  3px solid outline. Status messaging includes text, not color alone. Viewport reset.
- Copy-only correction `14c7693` removes stale claims that Google identity is
  unavailable or all sessions expire on restart, and distinguishes persistent cloud
  workspaces from local demo state. No layout, auth, financial or workflow changes.
  Added assertions preserve this distinction. All 130 frontend tests, lint,
  typecheck, production build and repository/whitespace checks passed again.
  Replacement web revision `movebooks-beta-web-00006-5hx` became Ready at
  **16:23:11 UTC**. Corrected Product, Simulator and home wording was verified on
  that deployed revision, along with desktop/light styling. Its fresh scan has
  **0 High / 0 Critical, 4 Medium**; API image unchanged.
- The official gcloud SDK generated a temporary user SSH key for Cloud Shell
  transfers (not a workload/service-account key). After transfers finished, the
  matching public key was revoked with the Cloud Shell API, absence verified, and
  only that task-generated local keypair removed. Normal user OAuth and workload
  credentials were not changed. No temporary localhost auth client was started.

Public URL: `https://movebooks-beta-web-411600344727.asia-southeast1.run.app`.
Human next step: User A signs in normally, opens the preserved workspace read-only,
then verifies navigation/sign-out denial; User B verifies cross-owner denial. No
tokens, cookies, passwords or MFA codes should be copied into tools or evidence.

### Fresh image evidence — source `7e4a82c`

Source archive SHA-256:
`54c53819875e7fd3f7da13ee3ece0d49930e6cf55f9356c89cd56c7b42e31fad`.
Grype pinned image:
`anchore/grype@sha256:8c2c9234a345577a6d321a4753aa3ee1276d8975c8452d2344a56b57733ecad3`.

| Component | Published immutable digest | Scan report SHA-256 |
| --- | --- | --- |
| API | `sha256:d7219fb2e30836ccc33d2c36082ed16127c24200c104547e93f636a9d9efaea5` | `9d4a9a5ec7c9a3a9a259eb16801522ca22848ad69356873a4dc1bb08b62d2a71` |
| Web, initial `7e4a82c` (superseded) | `sha256:2153a75d6ccd942dfb475c8ce025a846ab70a544c31b1495324d15fd6366dfd8` | `902b12e2187e738e93f050e5733419762395ae89404d1ab8a23e370f2f658858` |
| Web, current `14c7693` | `sha256:1b5da27a78f8bb0e899111f29ce2419454d62d8277169f7cdc9f45daca00545e` | `54dacc0d9158378e926a3b74b5be84246cf7cbe8d0df0299879c3fcb00d54eea` |

Copy-corrected source archive SHA-256:
`b3418d1fd17eb70eb36efe9d9a178c1503895a50f938c65e62066b167c706f85`.
Scanned current web image archive SHA-256:
`c02d750f1b5325e5a988a056f8cd9fa6a66097b211a58520b9d04a335ed9d501`.
Published config SHA-256:
`d58a1cc60f956a9aec29a8639fa3b4b5b00a191e7bc52698d42b61185fdab0e8`;
configuration/rootfs identity again verified equal to the scanned archive.

Docker's push network path refused connections, while host HTTPS reached the registry.
The same scanned archives were uploaded using Google's host-side
[crane v0.22.1](https://github.com/google/go-containerregistry/releases/tag/v0.22.1)
and the existing gcloud credential helper. The official tool archive checksum was
verified. Published configuration JSON, including root filesystem layer identities,
was checked equal to the scanned archives. Manifest serialization differs from
Docker's local index; deploy the **published digests above**, not the local index ID.
No IAM workaround, new Cloud Build service, TLS bypass or exported token was used.

Residual Medium triage (not suppression; no fixed versions reported by this scan):

| Advisory | Package / source | Bounded applicability and follow-up |
| --- | --- | --- |
| CVE-2026-87910 | API `python-3.14 3.14.7_git20260925-r0` | Archive-link extraction/filter issue. No application `tarfile` use found; cloud intake disabled. Track vendor update; do not claim Python package absence. |
| CVE-2025-15367 | Same Python runtime | POP command injection. No application `poplib` use or mail retrieval integration. Track vendor update. |
| CVE-2026-77117, CVE-2026-80489 | Both images `glibc-2.44 2.44-r6` | Specific Japanese character conversion loop. No application iconv/JIS conversion path found; bounded JSON/synthetic intake only. Reassess if charset conversion is added. |
| CVE-2026-8674 | Same glibc | Resolver search-list assertion. Runtime DNS configuration is platform-controlled, not request-supplied; no application `LOCALDOMAIN` control. Residual platform dependency to track. |
| CVE-2026-89092 | Same glibc | Requires running nscd/untrusted DNS. Images launch only Node/Python, not nscd. Track base-runtime patches. |

These are preliminary reachability conclusions from scanner advisory descriptions,
Dockerfiles and application source search, not proof of zero dependency risk. The
existing High/Critical gate passes; Medium base-runtime updates remain a follow-up.

## Release assessment at human sign-in handoff

**AMBER; not yet cleared for public sharing.** No new P0/P1 defect observed in the
completed local, image, public-route, anonymous-denial and IAM checks. Final P0/P1
clearance is withheld until real User A access/navigation/sign-out and User B owner
isolation pass through the new proxy. Historical V1/live-cloud evidence is not a
substitute for these deployment-specific gates. No public-origin authenticated
synthetic smoke or fresh FPU-count read-back is claimed yet.

Remaining non-blocking hardening: Medium base-runtime advisories above, currently
disabled SQL backups, low-volume cost/abuse monitoring (not a hard spend cap), and
later private-IP networking if warranted. Preserve synthetic-only scope, disabled
cloud uploads and deterministic-only deployment routing. No remote CI for the
unpublished public-Beta commits is claimed. After live gates pass: publish branch,
open PR, run CI and obtain human review; do not automatically merge/tag.
