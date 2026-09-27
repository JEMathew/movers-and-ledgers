# Google Cloud validation — preflight and security checkpoint

Date: 2026-09-28. Branch: `feature/google-cloud-validation`.
Baseline: `41b73cea100e166bb7e3ea661c33650264755cec` (merged PR #12).
Authorized target: `movebooks-ai`, primary region `asia-southeast1`, dev/test only.

**AMBER. Live application validation has not executed; project access is now verified.**
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

## Resumed live preflight — 2026-09-28

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

## Fresh local checks and remote CI evidence

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
| Architecture | Existing topology retained; no fallback store or test identity introduced. Access resolved; finish inventory and approve scoped provisioning. |
| Security | Actual IAM, identity, private storage, secrets, log redaction and hosted dependency risk require live review. Do not guess grants or weaken auth to proceed. |
| Metrics | Log/monitoring contracts are not measured visibility. No fabricated SLOs, outcomes or successful cloud checks. |
| Accessibility | No UI changes; no new accessibility certification or live protected-route UX claim. |
| Release Readiness | AMBER: required runtime evidence absent. Product Management, Agentic AI and Migration rubric cloud assessments remain pending, without aggregate scores. |

Remaining prior follow-ups: fresh image and remote verification of the dependency remediation,
broader dependency/image review, production operational hardening (P2), and the
Starlette warning (P3). Severity of undiscovered live issues is unknown; these prior classifications
do not authorize exposing a vulnerable or misconfigured service. No live P0/P1 clearance is claimed.

## Exact blockers and continuation

1. Approve the specific workload permissions/API setup and the billable resource budget/lifetime.
   Project access is resolved; no credentials or keys should be supplied in conversation.
2. Complete resource inventory after approved API enablement, then create/reuse bounded dev/test
   resources. Real Firebase setup and two authorized test identities still need verification.
3. Verify the remediated dependency tree in fresh images and remote CI, then build/push/deploy only the bounded dev/test
   environment and collect all live evidence above, including two real authorized test identities.
4. Run relevant remote CI for any implementation changes; finish security/rubric review and fix all
   P0/P1 before declaring GREEN. Keep cloud uploads rejected and models inactive throughout.

The immediate next step is **provisioning approval**, not Gemini/ADK activation. See the
[validation boundary](../architecture/google-cloud-validation.md). This documentation checkpoint
does not represent completion of the requested cloud validation.
