# Google Cloud validation — blocked preflight record

Date: 2026-09-28. Branch: `feature/google-cloud-validation`.
Baseline: `41b73cea100e166bb7e3ea661c33650264755cec` (merged PR #12).
Authorized target: `movebooks-ai`, primary region `asia-southeast1`, dev/test only.

**AMBER. Live Google Cloud validation has not executed.** User authorization identifies the target;
it does not establish that the current authenticated account can access it. No resources, IAM,
APIs, secrets, deployments or billing settings were changed. No replacement project was created.
No production, customer-data, provider, compliance, Gemini or managed ADK readiness is claimed.

## Observed preflight

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

| Required gate | Current result |
| --- | --- |
| Project/region | User-authorized values recorded; live project access blocked; region not independently verified. |
| Existing resources/APIs/registry | NOT ASSESSED: cannot inventory the target; no resources assumed absent. |
| Cloud Run backend/frontend | NOT RUN: no build push, deployment, revision, URL, live probe or shutdown evidence. |
| Cloud SQL | NOT RUN: live connector/IAM, schema, rollback, concurrency, pooling and recovery unverified. |
| Identity | NOT RUN: app Firebase sign-in, cross-user denial and real approval attribution unverified. Console sign-in is not application identity validation. |
| GCS | NOT RUN: private policy, scoped artifact operations and actual denial behavior unverified. |
| Secret Manager | NOT RUN: runtime retrieval, unavailable-secret behavior and actual least-privilege grants unverified. |
| IAM | NOT ASSESSED: actual service accounts/grants unavailable; no broad roles removed or added. |
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

## Security and review disposition

No runtime implementation changed. No newly demonstrated P0/P1 defect arose from these read-only
checks, but **live P0/P1 clearance is NOT ASSESSED**, not zero by assumption. A complete cloud security
or criterion-level rubric sign-off cannot be issued while the environment is inaccessible.

| Review lens | Disposition / required follow-up |
| --- | --- |
| Product / Customer Outcome / Demo | AMBER: cloud continuity to verified FPU untested; keep local versus cloud claims explicit. |
| Agentic AI / FinTech Trust | Existing deterministic and HITL contracts retained; actual cloud attribution/recovery not verified. No live-model activation. |
| Architecture | Existing topology retained; no fallback store or test identity introduced. Resolve access before inventory/provisioning. |
| Security | Actual IAM, identity, private storage, secrets, log redaction and hosted dependency risk require live review. Do not guess grants or weaken auth to proceed. |
| Metrics | Log/monitoring contracts are not measured visibility. No fabricated SLOs, outcomes or successful cloud checks. |
| Accessibility | No UI changes; no new accessibility certification or live protected-route UX claim. |
| Release Readiness | AMBER: required runtime evidence absent. Product Management, Agentic AI and Migration rubric cloud assessments remain pending, without aggregate scores. |

Remaining prior follow-ups: documented Next.js/PostCSS hosting advisory and dependency/image review
(P2 in local-only scope, an uncleared hosting gate), production operational hardening (P2), and the
Starlette warning (P3). Severity of undiscovered live issues is unknown; these prior classifications
do not authorize exposing a vulnerable or misconfigured service. No P0/P1 remediation is claimed.

## Exact blockers and continuation

1. An authorized account must be able to open the named `movebooks-ai` project, or the user must
   correct the project ID. No tokens or service-account keys should be supplied in conversation.
2. Once access works, inventory actual resources, APIs, billing/cost limits, deployment settings,
   service identities and Firebase setup; agree any required grants/exposure before mutation.
3. Clear the documented hosting-security gate, then build/push/deploy only the bounded dev/test
   environment and collect all live evidence above, including two real authorized test identities.
4. Run relevant remote CI for any implementation changes; finish security/rubric review and fix all
   P0/P1 before declaring GREEN. Keep cloud uploads rejected and models inactive throughout.

The immediate next step is **project access**, not Gemini/ADK activation. See the
[validation boundary](../architecture/google-cloud-validation.md). This documentation checkpoint
does not represent completion of the requested cloud validation.
