# Google Cloud validation — bounded live execution checkpoint

Date: 2026-09-28. Branch: `feature/google-cloud-validation`.
Baseline: `41b73cea100e166bb7e3ea661c33650264755cec` (merged PR #12).
Authorized target: `movebooks-ai`, primary region `asia-southeast1`, dev/test only.

**AMBER. Schema and durable adapter gates pass; identity/E2E remain incomplete and image gates fail. Keep the environment stopped and private.**

## Latest security continuation — 2026-09-28, after 08:42 UTC

This section supersedes the earlier checkpoints where their status differs. **AMBER**, not ready
for merge or public runtime validation. The prior four-hour window expired; renewal and temporary
endpoint action-time confirmation were requested, not assumed. No SQL/Run compute restart,
public invoker grant, schema grant, live-model activation or customer-data handling occurred.

### Publication, remediation and verified checks

- Prior documentation commit `05dc580` reached PR #13. Fresh
  [CI run 36399079607](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36399079607)
  passed all four existing jobs. This is evidence for that head only.
- Security commit `54bb635` removes runtime npm/npx and adds unsuppressed High image gates with
  raw artifact retention. See the [per-advisory ledger](google-cloud-image-security.md) for all
  thirteen API advisories (50 matches) and eight web advisories (nine matches), their exploit
  preconditions, evidence gaps and remediation. No blanket waiver, severity downgrade or ignore.
- An exact-image web derivative was rebuilt and its non-root health/HTML smoke passed. Completed
  Grype rescan: **1 High / 3 Medium / 0 Critical**, down from nine High by physical npm removal.
  Residual zlib CVE-2026-85091 remains unresolved. This image was not pushed or deployed, and
  this is not a full-source CI rebuild. A completed repeat scan of the unchanged exact API image
  confirms **50 High / 58 Medium / 9 Low / 45 Negligible / 0 Critical** (exit 2); all thirteen
  advisory counts agree with the ledger. Raw reports and SHA-256 digests are retained. API
  native/tooling applicability remains unclosed, not waived.
- Fresh local Ruff and the runtime/configuration/fault backend selection pass (**65 tests**).
  Frontend lint and TypeScript pass. The first suite run exposed one focus-effect assertion race
  (75/76 pass); the test now awaits the same observable focus requirement with `waitFor`, without
  an arbitrary sleep or product behavior change. Focused identity suite **9 pass**, complete
  frontend suite **76 pass**, production build **PASS**. No tests skipped or assertions weakened.
  Fresh production npm audit reports **zero vulnerabilities**; repository checks cover **84
  Markdown / 319 text files with zero findings**, and whitespace checks pass. This does not clear
  OS/native image findings.
- New security changes still require publication and fresh remote CI. Normal CLI Git authentication
  is unavailable; Desktop's stale/inconsistent window did not yield a verified push of `54bb635`.
  No token extraction or alternate credential access was attempted.

### Remaining required evidence

| Gate | Disposition |
| --- | --- |
| Image security | OPEN: web zlib and API native/tooling findings need supported fixes or complete narrow applicability evidence; preserve raw scans and rerun production images. |
| Google sign-in / public-protected routes | Configured, not exercised with the authorized browser users. No public protected-data access is authorized. |
| Two-user isolation / approval attribution | Adapter owner isolation passed previously; real User B HTTP denial and persistent User A approval attribution remain unverified. |
| Canonical E2E / financial truth / FPU | No authenticated cloud journey to verified FPU receipt. Local/synthetic success does not close this gate. |
| Restart/resume | Prior SQL sentinel/adapter persistence passes; real journey checkpoints, approvals, owner isolation and duplicate-execution protection across redeploy remain unverified. |
| Cloud intake | Remains disabled; authenticated deployed rejection and payload-free logging still unverified. |
| Monitoring/security | Existing safe startup/probe evidence retained; actual auth, persistence, storage, readiness, lifecycle and replay failure visibility across the full live path remains incomplete. |
| P0/P1 | Prior DB-API P1 is resolved; no new product P0 was observed in these checks. Final live P0=0/P1=0 clearance is **not established**. CVE match counts are not product finding counts. |

### Resources, permissions, cost and next step

Read-only live preflight confirmed SQL STOPPED/NEVER and both Run services manually scaled to zero.
Final readback again showed `manualInstanceCount=0` for both services and zero service IAM bindings
(no public invoker grant).
No additional cloud resources or permissions were created in this continuation. The local web
smoke container was stopped; both scanners completed and final Docker running-container list was
empty. Retained SQL disk/network allocation, registry images, private
bucket/soft-deleted synthetic objects, disabled secret, logs and definitions remain as described
below. New non-sensitive scan/image evidence is retained in Cloud Shell home. No current billed
cost was obtained; earlier planning estimates are not a current spend measurement or hard cap.

Next: publish the committed security/docs changes through normal GitHub authentication, finish
unsuppressed API/web image clearance, then obtain the renewed bounded compute window and minimum
temporary endpoint confirmation. Only then perform the authorized two-user browser/canonical FPU,
restart and negative-path checks, remove temporary endpoint grants and stop compute again.
PR #13 must stay draft/unmerged until all required evidence and P0/P1 clearance are complete.

## Earlier resumed live validation — 2026-09-28 local time

This section supersedes the historical checkpoints below. The same authorized project, region,
US$10 operating target and four-hour window apply. SQL was restarted around 21:09 UTC. All data
is synthetic; cloud intake, provider integrations, Gemini, managed ADK and production remain off.

Times in this continuation are **2026-09-27 UTC** (2026-09-28 local time). Compute was stopped
again at approximately 21:47 UTC, within the approved window.

### Identity configuration and narrow bootstrap

Following explicit owner approval, Firebase was attached on Blaze, Analytics disabled, Google
sign-in enabled, and a dev/test web app registered. Its authorized frontend domain is
`movebooks-beta-web-411600344727.asia-southeast1.run.app`. No Firebase Hosting, email/password
or anonymous provider was activated. Two owner-authorized test accounts are available, but their
addresses are deliberately not repeated in this public record. Configuration is not sign-in proof.

The owner separately approved use of the **existing built-in PostgreSQL administrator** for the
reviewed one-time grants, without exporting a credential. Import
`188fd48b-cd66-4891-ab9c-4eaf00000031` completed at 21:29:47.806 UTC. SQL is preserved in
[cloud_bootstrap_grants.sql](../../scripts/cloud_bootstrap_grants.sql): CONNECT on `movebooks`
and USAGE on `public` for API/schema identities; CREATE on `public` only for the schema identity.
No workload received database ownership, `cloudsqlsuperuser`, Owner or Editor.

Schema execution `movebooks-beta-schema-jstn5` passed at 21:33:15 UTC. It created schema v1 and
granted API SELECT/INSERT/UPDATE on `migration_sessions`, not DELETE or DDL. Revocation import
`8879061f-904f-42a2-95dc-59b000000031` completed at 21:34:20.569 UTC using
[cloud_bootstrap_revoke.sql](../../scripts/cloud_bootstrap_revoke.sql). The schema account was
disabled, its explicit CONNECT/USAGE/CREATE grants revoked, and its narrow existing IAM bindings
left attached to the disabled account. Explicit revocation does not claim to revoke inherited
PUBLIC permissions; disabling the identity is an additional control.

Temporary import access was limited to one non-sensitive object:
`gs://movebooks-ai-beta-artifacts/operator/cloud_bootstrap_grants.sql`.
Custom `movebooksBetaSqlImport` gave the managed SQL instance service agent only
`storage.objects.get`. Custom `movebooksBetaBootstrapUpload` gave the existing human operator
create/get/delete only. Both bucket bindings used an exact-object condition. CLI upload initially
requested list permission; that permission was **not granted**. An exact-object SDK upload with
normal Cloud Shell authentication succeeded. Both conditional bindings were removed after cleanup;
the bootstrap/revocation object was soft-deleted with seven-day recovery. Final bucket policy again
contains only the API artifact binding. Role definitions without bindings confer no access.

### Live finding and remediation

**P1 — cloud DB-API duplicate rejection classification**: the first persistence execution
`movebooks-beta-probe-8jmcg` failed. A redacted diagnostic (`movebooks-beta-probe-57m6p`) identified
SQLSTATE `23505` without printing SQL, parameters, records, credentials or driver messages.
The Google connector returns `pg8000.dbapi.Connection`, while SQLAlchemy's ordinary pg8000 URL
uses its legacy facade. The connector path reports this unique violation as `DatabaseError`,
not the `IntegrityError` expected by the repository. PostgreSQL's
[SQLSTATE reference](https://www.postgresql.org/docs/current/errcodes-appendix.html) identifies
23505 as a unique violation and recommends code-based classification over message matching.

Commit `ce5ad3015ae94777ed1a38f209b855072c6ea2c5` narrowly classifies that structured code as
duplicate rejection. Other database errors still propagate to the existing safe failure boundary.
No automatic retry, overwrite, identity bypass or permission expansion was introduced. Added
redaction/non-duplicate tests and PostgreSQL coverage for both legacy and DB-API connections.
Fresh live execution `movebooks-beta-probe-vdbkl` passed all runtime assertions after rebuilding.
This finding is resolved in the exercised adapter scope; full cloud P0/P1 clearance is not inferred.

Operator command failures (incompatible job flags, a diagnostic quoting error/empty diagnostic
execution, and a Monitoring quoting error) are not successful checks. They made no product-data
or IAM bypass. Only the named successful executions and explicit PASS records count below.

### Current evidence

| Gate | Actual evidence and limits |
| --- | --- |
| Run | Backend `movebooks-beta-api-00003-v42` and frontend `movebooks-beta-web-00002-2tf` are platform Ready. Backend startup/liveness JSON records return 200. Private CLI proxy `/healthz` still returns platform 404, so external HTTP/browser reachability is not a pass. |
| Cloud SQL | Schema, attached IAM identity, no runtime schema CREATE/row DELETE, insert/read, repository owner filtering, duplicate rejection, actual transaction rollback, simultaneous CAS single winner, stale write rejection, killed-connection rollback/pool recovery all PASS in `movebooks-beta-probe-vdbkl`. |
| GCS | Actual ArtifactService operations PASS: consented synthetic safe-summary put/read/delete, cross-owner denial, controlled-package rejection and missing-object failure. Bucket remains private. This is repository/adapter authorization, not real browser-user proof. |
| Secret Manager | Actual runtime marker retrieval/redaction and unavailable/unallowlisted-secret safe failure PASS. Prior web-identity denial remains valid; no project-wide secret access added. |
| Restart | Cloud SQL restart `f3440c74-7ce8-4597-92f7-8e8900000031` DONE at 21:43:00.941 UTC. New execution `movebooks-beta-probe-fvwsc` recovered the persisted sentinel. Read-only execution `movebooks-beta-probe-n7szq` then passed owner isolation and verified no runtime database ownership, no runtime cloudsqlsuperuser membership and no effective schema-identity CREATE. This proves adapter state survival, not interrupted canonical journey recovery. |
| Identity / canonical E2E | NOT VERIFIED: no Firebase browser sign-in, cross-user HTTP denial, approval attribution, canonical cloud FPU receipt or authenticated intake rejection. No fake/emulator principal deployed. |
| Logging / Monitoring | Safe structured startup, readiness and probe records inspected. Monitoring API returned HTTP 200 and eight instance-count series covering both Run services. Full auth/database/storage failure visibility and alert delivery remain unverified. No financial payload, prompt, token or secret was printed by the successful probes. |
| CI | [Fresh run 36352554377](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36352554377) SUCCESS on `ce5ad30`; all four jobs, including both PostgreSQL driver paths, container restart smoke and npm production audit. Earlier fresh run 36351177147 passed on `1978e9b`. Draft [PR #13](https://github.com/JEMathew/movers-and-ledgers/pull/13) remains unmerged. |
| Local checks | Ruff PASS; focused runtime/fault/config suite 65 passed; full backend 255 passed/10 PostgreSQL-only skips with inherited Starlette warning; 83 Markdown/318 text files, zero findings; whitespace PASS. Remote PostgreSQL CI covers the locally skipped database gates. |
| Image security | Grype v0.119.0 completed against both rebuilt image archives. Both failed the High threshold (exit 2): API 50 High / 58 Medium / 9 Low / 45 Negligible; web 9 High / 7 Medium / 1 Low. No Critical matches returned. Dependency-only audits do not supersede these image failures. |

Rebuilt image identities:

- API with DB-API remediation: `sha256:36c2cb038691ef2c6005519bc90590922bc71048e1567ab4ef26fccdeac6eec3`.
- Firebase-configured frontend: `sha256:598c7817dac46c4ee8f0f035deda1a13e5dc5a2aaf60a868faa7f470784846d1`.
- Remediation source transfer SHA-256: `0cc74e5163d500558e2a3cc350137d6d757cf06bff6339658e8fbb2f26d9c051`.

Both registry pushes encountered a transient connection refusal and succeeded on retry. No
credential workaround was used. Public Firebase client configuration is build-time configuration,
not a service-account key; its value is not included in this record.

### Image-security triage — not cleared

The official scanner image was pinned to
`anchore/grype@sha256:8c2c9234a345577a6d321a4753aa3ee1276d8975c8452d2344a56b57733ecad3`.
It ran without a Docker socket, host credentials or ADC mounts, with capabilities dropped and
no-new-privileges. Initial archive-permission failures were corrected; only completed scans count.
Cloud Shell reports are `/tmp/movebooks-api-grype.json` and `/tmp/movebooks-web-grype.json`;
these are ephemeral operator evidence, not durable CI artifacts.

Eight web High matches are under `/usr/local/lib/node_modules/npm/node_modules`, not the
standalone application's dependency tree: ip-address 10.1.0, brace-expansion 2.0.2,
pacote 19.0.2/20.0.1, picomatch 4.0.3 and sigstore 3.1.0. The ninth is Alpine zlib 1.3.2-r0
(`CVE-2026-85091`). Node runs `server.js` directly; npm is not the application entrypoint.
Removing unused package-manager tooling is a candidate runtime-image hardening, not a completed
remediation or proof that these findings are unreachable.

API High matches include Debian runtime packages (perl-base, ncurses, libc, util-linux/libmount,
libacl, zlib) and a Python match (`CVE-2026-82049`). Many have vendor `not-fixed`/`wont-fix`
status; that is **not** a risk acceptance. A source search found no direct application tarfile,
Perl or gzprintf usage, but indirect/native reachability remains unreviewed. Do not equate
50 package/advisory matches to 50 distinct product P1s or waive them based on a string search.
Preserve the High gate, retain the exact digests, assess vendor/version applicability and reachable
paths, then rebuild/rescan supported images. No blind major runtime upgrade or suppression was made.

One observed application P1 (duplicate classification) is resolved. No P0 was observed in the
exercised checks; **final P0/P1 clearance is incomplete**, especially image applicability and the
unexercised authenticated application path. The overall validation checkpoint remains AMBER,
not permission to expose or release these images.

### Shutdown, retained resources and cost

Verified after shutdown: SQL `STOPPED` / activation policy `NEVER`; both Run services manual
instance count `0` and Ready; latest probe executions running count `0`; schema service account
disabled; `movebooks-beta-probe` secret version 1 disabled; local service proxy exited. Both Run
IAM policies remain without `allUsers`. No public invoker grant was applied. A read against a
mistyped secret name returned NOT_FOUND; the actual named probe was then verified DISABLED.

New resources in this continuation: Firebase attachment/Google provider/web-app configuration,
two narrow custom role definitions, schema and synthetic rows in the existing database, new image
versions/revisions, and one-shot execution records. No additional SQL instance, bucket or static key.
Temporary exact-object import/upload bindings were removed; the bootstrap SQL object was
soft-deleted and is recoverable within the bucket's seven-day retention. The schema identity's
explicit bootstrap grants were revoked and its account disabled. Normal API privileges did not grow.

Retained: 10 GB SQL disk and network allocation, synthetic probe rows, old/new registry images,
private GCS artifacts/soft-deleted objects, disabled synthetic secret, logs, IAM/resource definitions,
Firebase configuration, and Cloud Shell source/image archives and scanner cache. Storage/network
allocation may continue to charge while compute is stopped. No project-specific actual spend was
available; the prior delayed billing card is not evidence of zero cost. Planning estimate for this
bounded session is roughly **US$0.20–$2**, not a billing measurement, excluding continuing retained
storage, taxes and unmeasured network charges; the US$10 target is not a hard cap.

### Remaining release gates

The action-time confirmation for temporary `allUsers` Run Invoker on **only** the API and web
services remains pending. Both service IAM policies were inspected and contain no public binding.
Do not conflate network ingress `all` with anonymous invocation authorization. Protected data
must still require Firebase tokens and owner checks when the temporary endpoints are enabled.
Even if that confirmation arrives, do not expose the current images before security triage.

Required remaining evidence: actual frontend reachability and two-user Firebase sign-in; protected
versus public routes; cross-user denial and approval actor attribution; one canonical synthetic
workspace through verified FPU; authenticated cloud-intake rejection; in-journey restart/replay/
lifecycle checks; full failure observability; image security and final criterion-level cloud review.
No production readiness, compliance, provider connectivity, customer intake or live-model claim.

## Historical first live execution ledger — 2026-09-28

The owner approved minimum dev/test provisioning, dedicated least-privilege identities, and
a US$10/four-hour cost target, explicitly not a guaranteed cap. Window: 2026-09-27 20:37 UTC
through 2026-09-28 00:37 UTC. Compute was stopped at approximately 21:01 UTC, well before the
deadline. No production, customer data, providers, Gemini or managed ADK.

Enabled Run, SQL Admin, Artifact Registry, Secret Manager, IAM, IAM Credentials, Firebase and
Identity Toolkit APIs. Cloud Build was not enabled: builds use normally authenticated Cloud
Shell Docker. Initial Run/SQL/registry/secret inventories were empty.

| Resource | Configuration / current evidence |
| --- | --- |
| `movebooks-beta-pg` | PostgreSQL 17, ENTERPRISE `db-f1-micro`, zonal asia-southeast1, 10 GB SSD, no auto-grow/backups. IAM auth, ENCRYPTED_ONLY and REQUIRED connector enforcement observed; no authorized networks. Database `movebooks` and API/schema IAM users created. Finally STOPPED with activation policy NEVER. |
| `movebooks-beta` | Regional Docker Artifact Registry repository created. |
| `movebooks-ai-beta-artifacts` | asia-southeast1; uniform access true, public access prevention enforced; default 604800-second soft-delete retention. |
| `movebooks-beta-api` | Dedicated service account; SQL Client and Instance User conditional on the named SQL instance; custom `firebaseauth.users.get`; custom bucket-only get/create/read/delete; Secret Accessor only on the named synthetic probe. No user-managed keys returned. |
| `movebooks-beta-web` | Dedicated service account; no project data roles granted. |
| `movebooks-beta-schema` | Temporary dedicated identity with conditional SQL Client/Instance User; no Owner/Editor or elevated database role. Bootstrap permissions unresolved; identity disabled at shutdown. |
| `movebooks-beta-probe` secret | One regional Secret Manager version containing only a synthetic non-credential marker; no customer data, key or token. Version 1 disabled at shutdown. |
| `movebooks-beta-api` / `movebooks-beta-web` Run services | Private invoker policy; dedicated identities; one CPU each, 512/256 MiB respectively; maximum one instance. Both finally set to manual scaling with zero instances. |
| `movebooks-beta-probe` / `movebooks-beta-denied` Run jobs | One task, zero retries, bounded 120/60-second timeouts. Both completed successfully; zero running tasks. No scheduler. |

Source archive is clean committed `4eacc8d295905820ba8cdbb591d141013de93761`, SHA-256
`7b7657608e35d27f5a4edd47f760c3ab344ebde5a3a63774d79de3a93fbd71cc`, matched in Cloud Shell.
Native file-picker upload succeeded after the extension file-upload permission error; no extension
security setting was changed. Backend/frontend Linux image builds passed. Frontend is intentionally
fail-closed until Firebase configuration is authorized and available; no demo fallback.

An immediate bucket custom-role binding initially failed during role propagation; retry succeeded
with the same four permissions, without broadening access. Default bucket legacy project-owner,
editor and viewer groups were observed and removed. Removal also removed the human owner's
implicit bucket-policy access; a custom three-permission bucket-policy role, conditional on this
one bucket, restored that narrower operator capability. Final bucket policy contains only the API
artifact binding. The original human project Owner binding was not modified.

API activation automatically created the default Compute service account with project Editor.
The audit detected it and removed Editor before using that identity; no validation workload uses
the default account. Google-managed service-agent bindings are not application workload roles.

Exact application grants: API and schema identities each have `roles/cloudsql.client` and
`roles/cloudsql.instanceUser` conditioned on
`projects/movebooks-ai/instances/movebooks-beta-pg`. API additionally has custom
`movebooksBetaIdentity` (`firebaseauth.users.get` only), bucket-bound `movebooksBetaArtifacts`
(`storage.buckets.get`, `storage.objects.create/get/delete`) and
`roles/secretmanager.secretAccessor` on `movebooks-beta-probe` only. Web has no data roles.
Custom `movebooksBetaBucketPolicy` restores the existing human operator's
`storage.buckets.get/getIamPolicy/setIamPolicy` only on this named bucket. No workload impersonation,
Owner, Editor or static key was granted. The disabled schema identity retains its two narrow IAM
bindings; re-enabling it is a separate operator action, not automatic cleanup reversal.

Cloud SQL reached RUNNABLE. A proposed `cloudsqlsuperuser` grant for the temporary schema identity
was rejected by the approval safeguard and was not executed or bypassed. Database bootstrap now
requires narrowly scoped DBA-issued CONNECT/USAGE/CREATE grants, or explicit approval for the
temporary broader role and immediate revocation. No database-admin success is assumed.

The initial API image audit found 12 advisory entries (including aliases/duplicates) in base-image
pip 25.0.1, and no reported application-package findings. The repository package is not published
on PyPI and is explicitly unauditable there. Dockerfile now upgrades pip to 26.2.1 from PyPI before
installing the application. The rebuilt image passed `pip check` and `pip-audit` with no known
dependency vulnerabilities; the unpublished application package is still explicitly skipped.
The scanner ran only in an ephemeral container, not by adding a scanner to the production image.
The first audit invocation used
an unsupported flag and was corrected, not counted as a pass. This is a Python dependency audit,
not an operating-system image scan.

Frontend revision `movebooks-beta-web-00001-5b4` reports Ready under the dedicated frontend
identity. Authenticated CLI proxy and unauthenticated HTTP probes returned platform 404 responses;
external reachability is not counted as a health pass. No public invoker grant was applied.

Firebase Console confirms Firebase is not attached. Confirming its Blaze pricing plan was blocked
by the approval safeguard; no alternative activation path was attempted. Explicit approval for
that billing activation and temporary public app endpoints was requested. Neither is assumed.
The initial preflight below is historical, not a statement that this approved run made no changes.

### Deployed artifacts and actual live evidence

| Artifact | Immutable identifier |
| --- | --- |
| Initial API image, retained but not selected for the service | `sha256:09790e8b4f001e73468093fe08031bb9cac1d37c5ca463b65f2e8140481dd3d6` |
| Patched API image (`api:pip2621`) | `sha256:4f9feb6d93ee0ad9528255d5a4a1b9dfbbd424b51daa93aafcc551c495acad45` |
| Frontend image (`web:4eacc8d`) | `sha256:85c292a2e3c2cc597e8d4524e2ba08f7042103c407ba85495edd29d85e6bcca3` |
| Backend revision | `movebooks-beta-api-00001-ct2` — NOT READY; startup readiness failed closed |
| Frontend revision | `movebooks-beta-web-00001-5b4` — platform Ready, HTTP route unverified |
| Transport job execution | `movebooks-beta-probe-nxsx4` — completed, one successful task |
| Denial job execution | `movebooks-beta-denied-bgwg6` — completed, one successful task |

Both jobs used the patched image and attached identities, never exported credentials. The bounded
probe source is [cloud_validation_probe.py](../../scripts/cloud_validation_probe.py); only its
`transport` and `denied` modes ran. Its schema, persistence and resume modes are prepared but
**not executed**, and none is an authenticated product journey.

| Required gate | Evidence / result from this live run |
| --- | --- |
| Cloud Run | PARTIAL: image builds/pushes, identities/configuration and frontend platform startup verified. Backend starts Uvicorn but `/readyz` returns 503/UNAVAILABLE because the schema is absent; the platform rejects that revision. Health checks were not weakened. Frontend numeric/hash URLs and authenticated CLI proxy returned platform 404, not an app-health pass. |
| Cloud SQL transport | PASS: actual IAM-authenticated encrypted connector, current_user matches API IAM DB user, SELECT 1 succeeds. Live application schema/persistence/rollback/CAS/concurrency/owner isolation remain blocked. |
| Identity | BLOCKED: Firebase not attached; Blaze activation needs confirmation. No real sign-in, two-user denial, revocation or HITL attribution claim. No emulator, demo fallback or synthetic-principal bypass deployed. |
| GCS | PARTIAL: private policy and real scoped synthetic marker create/read/duplicate rejection/delete/missing-object failure pass. Real workspace authorization is not yet proved. No customer package persisted. |
| Secret Manager | PASS for adapter scope: runtime retrieval, redacted representation, missing/unallowlisted secret rejection; actual frontend workload access denied. Only a non-credential marker was used. |
| IAM | Dedicated identities and narrow conditional/resource grants inspected. Frontend workload actually denied GCS and secret access. Automatically added default Compute Editor removed. No workload Owner/Editor remains; no static keys created. |
| Logging / Monitoring | PARTIAL: four job PASS records visible in Cloud Logging at 20:57:35–20:57:46 UTC, without payloads. Backend request/readiness records show safe 503/UNAVAILABLE. Full auth/storage/database/runtime failure visibility and Monitoring/alerts not validated. |
| Canonical E2E | NOT RUN: no live authenticated workspace through Discover → verified First Productive Use; no cloud audit/HITL/reconciliation receipt. |
| Restart/resume | NOT RUN: no durable application state yet; stopping infrastructure is not restart/resume proof. Uvicorn shutdown-complete/server-exit records observed at 20:59:08 UTC; graceful in-flight work preservation unverified. |
| Failure modes | PASS only for missing/disallowed secret, denied workload storage/secret access, duplicate/missing synthetic GCS object and unready database schema. Database outage/recovery, stale writes, duplicate product requests, replay and invalid lifecycle events untested live. |
| Cloud Try Your Data | Disabled in source/configuration, fresh local HTTP 503 and durable-write rejection tests pass. Authenticated deployed intake rejection remains BLOCKED; no upload was attempted or persisted. |
| CI / security | Fresh backend 252 passed/5 skipped (local PostgreSQL-only gates require a configured test DB); focused runtime/fault checks 62 passed; Ruff/link/whitespace/secret-pattern checks pass. Fresh Linux images build; patched Python dependency audit passes. Fresh frontend 76 tests/lint/typecheck/build pass; prior npm audit passes. New remote branch CI and OS-image scan remain outstanding. |

### Shutdown and retained charges

Both Run services report `scalingMode: manual`, `manualInstanceCount: 0`. Cloud SQL reports
`state: STOPPED`, `activationPolicy: NEVER`; the stop UPDATE completed without error at
2026-09-27 21:01:39.662 UTC. Both job executions report running count zero and succeeded count
one. All three dedicated identities returned zero user-managed keys. Temporary schema identity
and secret version 1 disabled. The local Cloud Shell service-proxy
process was stopped. No production compute exists in this validation setup.

Retained: SQL 10 GB disk and allocated networking, image repository/images (including the old
pip image for traceability), private bucket plus a soft-deleted tiny synthetic marker retained for
seven days, disabled synthetic secret version, logs, Run/job definitions and IAM/API configuration.
Only the disposable marker object was deleted, with seven-day soft-delete recovery. No repository
content, schema or customer data was deleted. Storage/network retention may keep accruing charges;
stopped compute is not a zero-cost project or a guaranteed US$10 cap.

Current project-specific billed spend is **unavailable**: the Billing report's project selector
returns no match for `movebooks`, although project billing is enabled. Account-wide data is not
attributed to this run. Planning estimate for this roughly 25-minute provisioning/validation period:
**US$0.10–US$1**, not a measured invoice or cap, excluding future retained storage/network costs,
taxes and without assuming free credits. The small SQL tier, two bounded single-CPU services and
two short tasks underpin this deliberately broad estimate; exact regional SKU usage is not yet
reconciled. Refer to [Cloud SQL pricing](https://cloud.google.com/sql/pricing) and
[Cloud Run pricing](https://cloud.google.com/run/pricing), and reconcile the actual project report
when delayed usage appears. Reconfirm a bounded window before a later restart.

## Historical preflight checkpoint (superseded by the live ledger above)

User authorization identifies the target, and normal Console/Cloud Shell authentication now succeeds.
No resources, IAM,
APIs, secrets, deployments or billing settings were changed. No replacement project was created.
No production, customer-data, provider, compliance, Gemini or managed ADK readiness is claimed.

## Initial preflight — access failure, subsequently resolved

The repository was clean on the requested branch. Its baseline tree matches the previously reviewed
`130742236c2ef87b609ef7a1e68509945130a072` tree. Canonical constitutions, principles, scorecard,
metrics, release policy, architecture, prior reviews, deployment guidance and three rubrics were read.

Using the existing authenticated Chrome session, the Google Cloud Console URL for project
`movebooks-ai` displayed **“You need additional access”** and **“No project selected.”** In the
project picker, searching All projects for `movebooks-ai` returned **“No resources to display.”**
The access page specifically lists `resourcemanager.projects.get` as missing. No access request
or suggested role grant was submitted; page suggestions are not a least-privilege deployment plan.
This does not prove the project does not exist: account access or the supplied ID must be resolved.
No unrelated listed project was selected. Local `gcloud` is unavailable on PATH; earlier preflight
also found no standard local ADC/configuration or configured project/region environment variables.
No credential stores or process credentials were accessed, and no token was copied or reused.

## Historical resumed preflight — 2026-09-28, before provisioning approval

Console shows the intended MoveBooks AI project. Cloud Shell was authorized through its normal
Google prompt; no service-account key, raw token, alternate account or credential export was used.
Read-only commands confirmed:

| Inspection | Actual result |
| --- | --- |
| `gcloud projects describe movebooks-ai` | ACTIVE; number `411600344727`. |
| `gcloud billing projects describe movebooks-ai` | `billingEnabled: true`. No billing setting changed. |
| `gcloud iam service-accounts list --project=movebooks-ai` | Empty list. |
| `gcloud storage buckets list --project=movebooks-ai` | Empty list. |
| `gcloud projects get-iam-policy movebooks-ai` | One human owner binding; no workload identity binding. Human Owner was not removed, avoiding lockout. |
| `gcloud services list --enabled --project=movebooks-ai` | Logging, Monitoring, Storage and service-management APIs enabled. Cloud Run, SQL Admin, Artifact Registry, Secret Manager, Cloud Build, Firebase and Identity Toolkit absent. |

Cloud Run/SQL/registry/secret/identity resource inventories have not been queried through disabled
APIs; no equivalent resource is assumed absent without querying after approved API enablement.
The configured primary region is the owner's `asia-southeast1` choice, not an observed deployment.
An initial batched shell command had a paste/input concatenation error; IAM was rerun separately
and its result verified. No mutation command was involved.

Approval was requested for dedicated least-privilege workload setup and a spending/resource-lifetime
limit before provisioning. The proposed US$10/four-hour operating budget is **not yet approved** and
is not a hard billing cap; stopping compute would still leave storage charges. No paid resource,
security-sensitive grant, public exposure or API activation has been performed.

| Required gate | Current result |
| --- | --- |
| Project/region | Project access, number and ACTIVE state verified; region is authorized, not yet deployed. |
| Existing resources/APIs/registry | PARTIAL: service accounts/buckets empty; required runtime APIs disabled; remaining inventory pending API enablement. |
| Cloud Run backend/frontend | NOT RUN: no build push, deployment, revision, URL, live probe or shutdown evidence. |
| Cloud SQL | NOT RUN: live connector/IAM, schema, rollback, concurrency, pooling and recovery unverified. |
| Identity | NOT RUN: app Firebase sign-in, cross-user denial and real approval attribution unverified. Console sign-in is not application identity validation. |
| GCS | NOT RUN: private policy, scoped artifact operations and actual denial behavior unverified. |
| Secret Manager | NOT RUN: runtime retrieval, unavailable-secret behavior and actual least-privilege grants unverified. |
| IAM | Human Owner only; no service accounts returned. Workload least privilege not yet provisioned or exercised. |
| Logging/Monitoring | NOT RUN: no target project log query, collector/dashboard or failure visibility evidence. |
| Canonical E2E | NOT RUN in cloud: no live session, approvals, recovery, reconciliation or verified FPU receipt. |
| Restart/resume | NOT RUN in Cloud Run/Cloud SQL; prior local container proof is not cloud proof. |
| Failure injection | NOT RUN live: no database/storage interruption, missing-secret, invalid-auth, stale-write, duplicate, replay, forged-event or in-flight restart exercise. |
| Cloud Try Your Data | Remains disabled in code; fresh local rejection test passes. Deployed rejection is unverified. No uploaded data was retained. |
| CI | Prior relevant remote run passed; no new run was triggered for this documentation checkpoint. |

## Earlier local checks and baseline remote CI evidence

The following command executed successfully: **19 passed**, with the inherited Starlette test-client
deprecation warning. Tests use local configuration overrides, SQLite/repository fixtures and SDK
doubles as applicable; none is counted as live GCP validation.

```sh
.venv/bin/pytest \
  tests/test_google_runtime.py::test_uploads_not_automatically_persisted \
  tests/test_google_runtime.py::test_cloud_identity_never_falls_back \
  tests/test_google_runtime.py::test_structured_logs_drop_payloads_and_untrusted_strings \
  tests/test_runtime_faults.py tests/test_validation_failures.py -q --tb=short
```

The cloud-intake test verifies HTTP 503 with cloud settings, no payload marker in captured logs,
and rejection of both ordinary and uploaded-session durable writes. Source inspection confirms
the browser's `cloudIdentity()` check stops upload before file transmission. No UI changes made.

GitHub API inspection confirmed [CI run 36342874463](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36342874463)
for the prior PR head `1307422`: all four jobs (`python`, `web`, `postgres-contract`, `containers`)
and their substantive steps succeeded. These cover backend/configuration tests, Ruff, link/secret
checks, whitespace, frontend tests/lint/typecheck/build, actual PostgreSQL and image builds/container
restart smoke. This is existing baseline evidence, not a new run or cloud deployment evidence.

## Dependency security remediation and fresh local verification

A fresh `npm audit --omit=dev` confirmed vulnerable PostCSS 8.4.31 beneath Next.js 15.5.26
(one high and one moderate dependency finding). The upstream
[PostCSS advisory](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) identifies patched 8.5.23;
the current 8.5.28 patch line was already used by the other build dependencies.
Added a narrow `overrides.next.postcss = 8.5.28`, removed the stale vulnerable lock entry and
regenerated the lock with npm. `npm ci` and `npm ls postcss` confirm Next resolves to 8.5.28;
Next remains 15.5.26. No major framework upgrade or product architecture change.

The first lock-only install retained the stale vulnerable entry and failed the audit. It was not
counted as success. After re-resolving that entry, `npm ci` and `npm audit --omit=dev` report zero
vulnerabilities. npm also refreshed bundled optional WASM lock metadata; no new direct feature
dependency was introduced. This resolves the reported npm gate, not all possible image/runtime risks.

Fresh checks after remediation: frontend **76 passed**, TypeScript **PASS**, frontend lint **PASS**,
production build **PASS**, Ruff **PASS**. CI now has an explicit `npm audit --omit=dev` gate; its
remote execution and a fresh deployable image build for this change remain pending. The existing
baseline CI evidence above must not be attributed to this new change.

## Security and review disposition

No application lifecycle, authentication or persistence implementation changed. The dependency
hosting finding was remediated locally, but **live P0/P1 clearance is NOT ASSESSED**, not zero by
assumption. Cloud security and criterion-level rubric sign-off await provisioned runtime evidence.

| Review lens | Disposition / required follow-up |
| --- | --- |
| Product / Customer Outcome / Demo | AMBER: cloud continuity to verified FPU untested; keep local versus cloud claims explicit. |
| Agentic AI / FinTech Trust | Existing deterministic and HITL contracts retained; actual cloud attribution/recovery not verified. No live-model activation. |
| Architecture | Existing topology retained; no fallback store or test identity introduced. Transport provisioned/exercised; schema and real Firebase path still blocked. |
| Security | Narrow IAM, private artifact/secret transport and safe startup logs verified in the exercised scope. Real identity, full failure visibility and OS-image audit still outstanding. Do not weaken auth to proceed. |
| Metrics | Log/monitoring contracts are not measured visibility. No fabricated SLOs, outcomes or successful cloud checks. |
| Accessibility | No UI changes; no new accessibility certification or live protected-route UX claim. |
| Release Readiness | AMBER: required runtime evidence absent. Product Management, Agentic AI and Migration rubric cloud assessments remain pending, without aggregate scores. |

Remaining follow-ups: fresh remote CI for the remediated dependencies, OS-image review,
production operational hardening (P2), and the
Starlette warning (P3). Severity of undiscovered live issues is unknown; these prior classifications
do not authorize exposing a vulnerable or misconfigured service. No live P0/P1 clearance is claimed.

## Exact blockers and continuation

1. Explicitly confirm Firebase's Blaze activation and the proposed temporary public Cloud Run
   app endpoints (application Firebase auth remains mandatory), or have the owner configure the
   approved identity path. Those actions were not silently included in generic provisioning approval.
2. Have a DBA grant both API/schema identities CONNECT on database `movebooks` and USAGE on
   schema `public`, with CREATE only for the temporary schema identity. It grants runtime access
   only to its newly created table, not database ownership or a database-wide grant option.
   The broader `cloudsqlsuperuser` proposal was blocked; no alternative admin route was used.
   Re-enable the temporary identity only for approved bootstrap, then disable it again.
3. Bootstrap schema, grant API only CONNECT/USAGE/SELECT/INSERT/UPDATE, resolve the frontend
   route/configuration and configure two authorized real test identities. Rebuild frontend with
   approved public Firebase configuration; do not expose the intentionally incomplete image.
4. In a bounded authorized continuation, rerun actual persistence, rollback, CAS, owner isolation,
   restart/outage, auth, intake rejection, replay/lifecycle, monitoring and canonical FPU checks.
5. Run fresh remote CI and OS-image security gates, complete cloud rubric/security review and fix
   every P0/P1 before GREEN. Existing CI triggers only PRs/main, not this unpublished feature head;
   no PR, push, merge or CI configuration expansion was performed in this run.

The immediate next step is **resolve the specific identity/ingress and database-bootstrap approvals**,
not restart compute or activate Gemini/ADK. Keep the stopped resources stopped until those blockers
are resolved; reconfirm the spending window if resuming after the approved deadline. See the
[validation boundary](../architecture/google-cloud-validation.md). This checkpoint is not completion
of the requested Google Cloud Beta runtime validation and does not assert P0=0/P1=0 clearance.
