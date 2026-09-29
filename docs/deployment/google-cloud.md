# Google Cloud dev/test deployment and validation

Public-Beta connectivity is a separate approved release slice; see the
[public-Beta deployment gate](public-beta.md). The stopped checkpoints below are
historical validation evidence, not a claim that the public release is deployed.

## Final bounded checkpoint — 2026-09-29, stopped/private

**GREEN for the exercised synthetic Google Cloud Beta runtime; P0=0, P1=0.**
PR #13 remains draft/unmerged for human review. Do not restart resources, post another invoice,
repeat approvals, create a replacement workspace or enable cloud intake/Gemini/managed ADK.

The explicit two-user localhost Firebase negative tests passed: User B approval/read/plan/audit
denial, owner actor-spoof rejection, invalid lifecycle/replay rejection, and post-restart isolation.
The preserved workspace remains Verified FPU with one invoice/journal/posting attempt and unchanged
snapshot/approval/audit hashes. See the [final review](../reviews/google-cloud-validation.md) and
[sanitized request evidence](../reviews/google-cloud-negative-validation-2026-09-29.json).

Latest API revision: `movebooks-beta-api-negative-resume-0702`, Ready at 07:02:59 UTC with
the same hardened API index `sha256:1849f94c8f4eaf34e5aab7c32789cb8196ea559c48dac39eaff2ae95db2d09cb`.
Web image remains `sha256:88e16b89053a83e5ffb1b4d86f1def5893a4493b37dc22e42ccf4d2e60ae8674`.
No environment, Firebase, schema or workload privilege change was made. Existing recorded image
scans remain 0 High/Critical; six published CI jobs pass. No fresh scanner-DB result is claimed.

Rollback started 07:05:28 UTC; independent read-back at 07:06 UTC verified both services private,
invoker IAM checks enabled, manual/min counts zero, SQL STOPPED/NEVER, no pending SQL operation,
no running job and no public project/broad workload IAM. GCS remains private with enforced public
access prevention; Secret Manager remains private. The memory-only localhost client was cleared
and terminated, with no listener left on port 8765. The scheduled cleanup is a fallback, not the
evidence for this shutdown. No additional live run is authorized by this completed checkpoint.

Retain the SQL disk/workspace/history, private GCS retention, registry images, inactive revisions,
job definitions, disabled probe secret/bootstrap identity and logs. Retention/storage charges can
continue; actual session cost was unavailable. The run stayed within its four-hour maximum.
Production alert/support/retention hardening remains maintainer-owned follow-up before broader use.
Next: publish the documentation evidence normally, then human review of PR #13; do not auto-merge.

Historical checkpoints below are retained for chronology and do not supersede this final status.

## Authorized validation checkpoint — 2026-09-28

### Negative-path continuation: test-client authorization required

Published `1e80215` and all six jobs in CI run 36476245003 were green at preflight. Images are
unchanged. A new bounded window began at 20:17:07 UTC, with hard cutoff 00:17:07 UTC September
29 and cleanup at 00:00 UTC. API was not started and neither service received public invoker.
Web briefly resumed privately, then returned to manual zero when the test-client blocker arose.

The blocked step is explicit authorization of an ephemeral authenticated HTTP test client (or
provision of an existing approved one). Normal Google CLI credentials fail Firebase's audience
check; do not broaden allowed audiences or use a workload identity to simulate either human.
The proposed client would use ordinary Firebase Google sign-in and in-memory identity only;
its creation was denied by the execution security review, so it was not run. Do not ask the
human to paste tokens, cookies or MFA codes. No approvals or invoice requests were sent.
Use the [current review](../reviews/google-cloud-validation.md) for final shutdown verification.
Rollback is verified: API/web manual zero with empty IAM policies, SQL STOPPED/NEVER,
zero active executions among 19 records, no project public binding. No new cloud resource or
permission was created. Keep compute stopped while the test-client authorization is unresolved.

### Verified FPU continuation (historical; then AMBER)

The preserved workspace `efbf72e9-aff5-489c-b17e-d2edced3237b` has reached Verified First
Productive Use. **Do not prepare/post another invoice, repeat approvals or load a new scenario.**
Invoice `7cd5ca8c-8091-4402-8e3c-c6eab2c31c72` is posted and deterministically verified at
USD 107.25 with balanced journal, expected deltas and one attempt. An authenticated reload after
API redeploy retained success; read-only snapshot/invoice/journal/event/approval hashes match.

Retain API `movebooks-beta-api-fpu-resume-1947` on index digest
`sha256:1849f94c8f4eaf34e5aab7c32789cb8196ea559c48dac39eaff2ae95db2d09cb`
and the unchanged web `movebooks-beta-web-00004-xtb` image. Both retain their same-day zero
High/Critical scans. The existing probe now performs narrow read-only FPU/approval verification;
its successful post-restart execution is `movebooks-beta-probe-khkx6`. No new privilege or identity
was granted and no schema/application change was made.

Shutdown started at 19:50:44 UTC, before the original 20:30 cleanup/20:37:55 cutoff. Read-back
confirmed empty service IAM bindings, manual zero for both services, SQL STOPPED/NEVER,
zero active executions among 19 records and no project public bindings. Stopped endpoints
returned 503 without application data. See the [latest review](../reviews/google-cloud-validation.md)
for financial fingerprints and retained storage/cost caveats.
The next session is only for missing live User B approval-POST denial, actor anti-spoofing,
post-restart cross-user denial and lifecycle/replay/storage failure monitoring evidence.
It requires human-present account access; never extract tokens or synthesize a user principal.
Preserve the existing completed workspace and disabled cloud intake/Gemini/managed ADK boundaries.
PR #13 remains draft; successful FPU alone is not complete cloud-release security clearance.

### Published fixed-image continuation (previous; cloud validation AMBER)

`4f4e138` is published, with six green CI jobs. API tag `ownerfix-4f4e138` was rebuilt/scanned
at 0 High/Critical and deployed as `movebooks-beta-api-ownerfix-ready-1853`; retain the unchanged
web image. See [image digests and hashes](../reviews/google-cloud-image-security.md).
Before starting Cloud Run after a SQL stop, wait for the SQL activation operation to finish
and then confirm RUNNABLE. An early RUNNABLE value alone did not establish readiness here.

The preserved workspace has five approval categories and six historical decision records,
including two Opening balances entries. Do not repeat or consolidate them. The read-only
workload probe verified latest owner/role/timestamp/audit attribution and zero posted invoices;
the fixed prerequisite function also passed all ten checks against that same durable snapshot.
full history fingerprints are in the [review](../reviews/google-cloud-validation.md).
The existing `movebooks-beta-probe` job now uses the fixed scanned image and a narrowly scoped
read-only approval-evidence command; no new identity, database privilege or IAM grant was added.
Do not run its previous vulnerable image or bootstrap command.

Browser recognition and the separate human invoice approval/posting/FPU steps remain pending.
No public invoker was added in this continuation; temporary exposure still requires the pending
action-time confirmation. The original 20:37:55 UTC cutoff is not extended by this checkpoint.
At the pause, read-back verified both services private/manual-zero, SQL STOPPED/NEVER and
zero active executions among all 14 job records. Retain the fixed image and workspace; do not
restart compute while awaiting the human-present continuation. No invoice has been posted.

### Owner-role correction (previous local-only checkpoint)

Do not ask the owner to repeat the five onboarding approvals: they are already persisted.
The live build incorrectly compares their `WORKSPACE_OWNER` role to a demo-only label.
The bounded local correction aligns readiness, invoice authorization/verification and new
audit attribution; it does not migrate, replace or delete historical decisions.

Next: publish the same-branch correction normally, pass fresh CI, rebuild and scan the API
image with unchanged thresholds, then deploy only in an explicitly authorized bounded window.
Do not use the previous image scan to claim the new source/image is cleared. Retain the existing
web image unless a build/configuration reason requires replacement. Resume the preserved
workspace `efbf72e9-aff5-489c-b17e-d2edced3237b` at onboarding; do not load a scenario or start
Discover again. Verify the five existing decisions now satisfy readiness without rewriting
history, prepare the synthetic invoice and stop for separate human invoice approval. Complete
the remaining live owner-mutation/anti-spoofing, FPU, restart and monitoring gates, then shut down.
No new bootstrap, workload privilege, schema or static key is required. PR #13 remains draft.
See the [review](../reviews/google-cloud-validation.md) for final rollback verification and checks.

### Live reconsideration requested (previous; human UI review pause)

The owner confirmed temporary service-only public invoker for both app services. Compute resumed
at 17:00:04 UTC within the existing window. A bounded API-only fresh revision on the same scanned
digest (`movebooks-beta-api-resume-1710`) recovered startup/no-instance failures without changes
to probes, limits, identity or source code. Real readiness is 200 and anonymous workspace access
401. Web remains `movebooks-beta-web-00004-xtb`; SQL/GCS/Secret Manager privacy is unchanged.

The same preserved workspace now has separate reconsideration request
`c9e06084-6517-4c64-8f13-a1e2208e159d` in **REVIEW_REQUIRED**. Original rejection/history is
intact; no approval was submitted. **Next action is the owner's Approve reconsideration or
Reject reconsideration click in the existing User A Chrome tab**, not another request, new
workspace or Discover/Plan run. The previous User B tab is unavailable and later isolation testing
requires a separate human-controlled sign-in again. Do not extract credentials or fake a principal.

During this explicit review pause both service invoker grants and manual count one remain active;
SQL is RUNNABLE/ALWAYS. This is not completed rollback. A local one-time cleanup safeguard is
scheduled for 20:30 UTC (02:00 Asia/Kolkata September 29), before the unchanged 20:37:55 UTC
cutoff; keep the local host available. Complete the mandated private/zero/SQL-stopped checks
earlier when validation completes. No new cloud scheduler, workload identity or IAM role was
created. The [review](../reviews/google-cloud-validation.md) distinguishes verified evidence,
pending checks and the startup caveat. PR #13 stays draft/unmerged and cloud readiness AMBER.

### Reconsideration images deployed (previous; stopped/private, live recovery not exercised)

Source `a7e0b17298fed48ec68ae5de08bc06c9f2a07892` is published and all six CI jobs pass.
Both production images were rebuilt from a clean Cloud Shell clone, scanned with the unchanged
High threshold (zero High/Critical/ignored matches), and published to the existing private registry.
Ready revisions are API `movebooks-beta-api-00005-dh7` and web `movebooks-beta-web-00004-xtb`.
The [review](../reviews/google-cloud-validation.md) records their exact deployed platform digests
and the [image review](../reviews/google-cloud-image-security.md) links them to scanned image IDs.
Environment, workload identities, probes and application resource settings are unchanged.

SQL resume at 16:37:55 UTC began a new authorized four-hour window; cutoff remains 20:37:55 UTC.
Service-only public invoker was blocked pending action-time confirmation and neither grant was
applied. Do not assume the application is browser-reachable just because the revisions were Ready.
No preserved-workspace mutation or reconsideration request was made. Overall cloud readiness
remains AMBER and PR #13 stays draft/unmerged. No new schema permission or bootstrap is needed.
Shutdown began 16:52:13 UTC and was verified: both Run manual counts zero, both service IAM
policies empty, SQL STOPPED/NEVER, no running job/scanner container. New images/revisions,
existing SQL/GCS state, logs and scan evidence remain retained; storage/logging costs may continue.
No public grant or extra workload/database privilege was introduced. Actual session cost is unknown.

Next continuation: confirm temporary `allUsers` / `roles/run.invoker` on **only** the two app
services, resume minimum compute within the valid authorized window, verify Ready/scanned digests,
then open the same preserved session. Request Catalog preparation → Service reconsideration with
a reason, inspect the preserved original rejection and **stop for the owner to approve/reject in
the UI**. Do not auto-approve or create a replacement workspace. Complete the remaining live
gates and mandatory private/zero/SQL-stopped rollback. Reconfirm the window if the cutoff expired.

### Reconsideration code ready locally (previous checkpoint; before deployment)

The requested narrow reconsideration flow is implemented and locally verified on the same branch.
See [review and operator sequence](../reviews/mapping-reconsideration.md). Cloud state was not
changed: services remain at the prior stopped/private checkpoint and the preserved workspace
still has its final rejection. Do not expect the old deployed images to expose the new controls.
Publish normally, pass fresh CI, rebuild and scan both images, then deploy in an authorized bounded
window. No schema bootstrap or extra database/IAM privilege is required. Request reconsideration
for Catalog preparation → Service on the same session, then explicitly approve it in the new
review action; keep the original rejection visible. Do not create a replacement workspace or
auto-apply the owner's prior authorization. Overall cloud readiness remains AMBER until the
remaining live gates pass. Preserve final private-endpoint rollback and compute shutdown.

### Preserved-workspace handoff (previous live checkpoint, AMBER)

The latest 13:38–14:05 UTC continuation used the same hardened digests and preserved session
`efbf72e9-aff5-489c-b17e-d2edced3237b`. Local and published `80dbf1e` are synchronized; all six
published CI jobs pass and PR #13 remains draft/open/unmerged. No manual push is needed for the
older documentation chain. A new documentation-only evidence commit follows this checkpoint.

Four explicitly authorized mapping approvals returned HTTP 200 and survived reload. There are
now ten approvals and one final Catalog preparation rejection. Both frontend and backend prohibit
changing that rejected decision; no supported reopen transition exists. **Do not restart compute
just to retry the same approval.** First obtain authorization for a narrow audit-preserving
reconsideration/supersession implementation, retaining the original rejection and requiring a
new attributable decision. Do not directly edit SQL, weaken final-decision checks or replace the
workspace. Canonical migration/FPU and execution restart/replay remain unverified.

The manually selected synthetic file was explicitly rejected by the signed-in deployed browser
before transmission. A bounded 120-entry scan found no intake POST, canary, bearer-value or
JWT-shaped marker. User B's audit view remains denied; approval-POST denial and exact persisted
actor/anti-spoofing still require live evidence. Complete failure-path monitoring remains open.
Fresh focused regression: 77 tests and Ruff pass; final live P0/P1 clearance is unassessed.

Rollback began **14:05:33 UTC** within the unchanged original deadline. Public invoker bindings
were removed from both services; both manual counts are zero; SQL is STOPPED/NEVER; jobs idle.
No SQL/GCS/Secret Manager public access or additional workload/database privilege was introduced.
Final read-only checks found empty service IAM policies, no project public-principal binding or
MoveBooks workload Owner/Editor grant, schema identity disabled, probe-secret version 1 DISABLED,
and bucket uniform access/public-access prevention enforced. Ordinary service-root probes returned
503 `text/html` after shutdown; the IAM policies, not the HTTP code alone, prove private invocation.
The hardened image digests below remain deployed and unchanged. The old-image probe job was not
executed. Cloud intake, Gemini, managed ADK, provider integrations and production remain disabled.

Retain the synthetic session/audit evidence, SQL disk, registry images, private bucket objects
and soft-delete retention, logs, disabled secret and service/job definitions. These can incur
storage/logging charges; actual session cost is unavailable. No new resources were provisioned.
An unrelated local `apps/web/package-lock.json` change is preserved and excluded from the evidence
commit. Keep PR #13 draft and compute stopped until the recovery scope is explicitly authorized.

### Authenticated continuation handoff (previous checkpoint, AMBER)

The 12:48–13:25 UTC resumption completed real Google sign-in for Users A/B, User A synthetic
Discover/Assess/Plan, anonymous 401 checks, User B workspace-read/plan-mutation 404 checks,
audit-view denial, and pre-migration API restart persistence/isolation. The preserved session is
`efbf72e9-aff5-489c-b17e-d2edced3237b`; do not restart discovery in the next continuation.
Six approvals and one rejection survive restart, but five mappings still await approval.

The safety reviewer requires explicit authorization of the exact remaining synthetic decisions:
Independent Press Distribution → Vendor; Catalog preparation → Service; CA-SALES → California
sales tax; base_currency → USD; fiscal_calendar → Calendar Year. Do not circumvent that hold.
Chrome extension file-URL access also blocked the synthetic intake-canary selection before
upload; resolve the documented browser prerequisite or coordinate user-controlled selection.

No full cloud FPU, migration checkpoint recovery, live actor-spoofing/approval-POST denial or
authenticated intake rejection success is claimed. The Trust projection displays a generic
"Workspace owner" actor; inspecting that label alone does not prove the persisted Firebase actor.
The [review](../reviews/google-cloud-validation.md) distinguishes exercised gates from code/local
test evidence and records bounded log-marker findings. Final live P0/P1 clearance is unassessed.

Shutdown began 13:25:16 UTC. Both Run services now have no public IAM binding and manual count
zero; SQL is STOPPED/NEVER; jobs have no running tasks; schema identity and probe-secret version
remain disabled. The exact hardened revisions/digests below are unchanged. The retained legacy
probe job still references an older image: **do not execute it without image review/update**.
No workload privileges were added and SQL/GCS/Secret Manager remained private.

Fresh focused regression: 53 runtime/fault/security tests and Ruff pass. Published `1fa818e`
retains six green CI jobs; PR #13 remains draft/unmerged. The local documentation chain remains
unpublished because normal terminal authentication is blocked; use normal Desktop/manual push.
Retained SQL synthetic state/disk, images, bucket objects, disabled secret and logs may charge;
session-attributable billed cost is unavailable. Resume only after the two human prerequisites
are resolved and a bounded human-present window is available. Preserve mandatory final rollback.

### Hardened deployment and stopped handoff (previous checkpoint)

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
