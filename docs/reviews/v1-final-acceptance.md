# V1 final acceptance — 2026-09-29

## Decision and baseline

**GREEN — technically ready for human V1.0 tag/release review within the bounded synthetic scope.**
The remaining real SSO/sign-out, post-merge Gemini smoke and final safe-cloud-state gates passed.
Final exercised-scope findings: **P0: 0; P1: 0; P2: 6; P3: 2**. Non-blocking limitations remain below.
This is the primary agent's release assessment, not independent human approval, production readiness
or compliance certification. No merge, tag or deployment was performed.

- Branch: `release/v1-final-acceptance`.
- Reviewed HEAD: `22f2883fe396d64a7757dae12111dcd835a463fa`, identical to freshly fetched `origin/main`.
- Clean working tree before validation. PR #15 (`1b6b150`) and PR #16 (`22f2883`) are present;
  Google Cloud PR #13 (`2c62b22`) and User Guide PR #14 (`6ddf7db`) are also merged.
- Only this evidence record and two historical/current architecture clarifications were edited.
  No application, model, auth, financial, runtime-source, dependency or lockfile change was made.
  Existing private dev/test compute was temporarily resumed and then stopped; IAM was unchanged.
- Existing valid evidence is reused explicitly below. Historical findings remain historical;
  the initial Gemini AMBER ledger does not supersede its later accepted Mapping correction.

## Final acceptance gates

| Gate | Evidence available / missing | Required next action | Release blocker |
| --- | --- | --- | --- |
| G1: real Google SSO sign-out regression | **PASS**: fresh Safari owner access, navigation continuity, actual product sign-out, signed-out UI denial, anonymous backend 401 and authenticated User B cross-owner 404 at 14:45:31 UTC. | None for this gate. | No |
| G2: minimal post-merge live Gemini regression | **PASS**, 2026-09-29 13:42:02 UTC; one Mapping case accepted with required escalation. Exact current-code hashes verified; details below. | No further model call needed for this gate. | No |
| G3: fresh cloud-state read-back | **PASS**, final read-back begun at 14:49:56 UTC: API/web private/manual zero; SQL STOPPED/NEVER; pending operations and running executions zero; GCS/secrets private; project IAM fingerprint unchanged. Temporary clients/proxies terminated. | Keep compute stopped; no further live run required. | No |

At the initial attempt, no Cloud Run/SQL start, exposure, IAM change, approval, invoice or workspace mutation occurred.
Cloud Shell reconnection/normal authorization was attempted; connection completion
was not established. The last verified shutdown remains the prior checkpoint, **not a fresh
independent read-back**. Do not infer current cloud state from an earlier terminal display.

### Gate-closure retry — 13:25 UTC, 2026-09-29

The release head remains `22f2883`; only the three expected documentation edits are present.
No full suite was rerun. Chrome is absent from the available browser connections. The existing
authenticated in-app Console tab displays “The connection to your Google Cloud Shell was lost.”
Its Reconnect button was inspected through accessibility and the embedded-frame DOM, but control
attempts failed without establishing a terminal connection. No `gcloud` executable or normal local
ADC file was found by the bounded fallback check; no credential contents were read.

G1 sign-in/navigation/sign-out/denial and G2 live smoke therefore remain **NOT EXERCISED in this
retry**, blocked by authenticated control availability, not a model-quality failure. There is no
new model, latency, token-usage or cost observation. G3 final cloud read-back is also **NOT VERIFIED
freshly**. No cloud command, IAM modification, resource startup, model call or business-state mutation
was performed. Prior shutdown and private-storage evidence remain historical, not newly certified.

Required human action: reconnect Chrome to Codex, open the existing `movebooks-ai` Cloud Console,
click Cloud Shell **Reconnect** and complete **Authorise** if requested, then confirm the terminal
is ready. No token/password/cookie transfer is needed. Keep the no-IAM-change constraint for the
resumed checks; no public-invoker grant is authorized by this retry.

### Connection restored; authentication handoff — after 13:28 UTC

The human restored the in-app Cloud Shell connection. A `date -u` / `pwd` probe executed successfully;
terminal control now works using its currently focused input. The read-only service-description
command failed with **no active account selected**, and `gcloud auth list` confirmed **No credentialed
accounts**. This is a normal authentication prerequisite, not a model-quality failure or cloud
shutdown result. The normal `gcloud auth login` flow was opened and handed to the human at its
continuation/sign-in prompt; no credentials or tokens were requested in chat or extracted.

The previously temporary source directory and AI virtualenv no longer exist in this refreshed
Cloud Shell, but the prior synthetic source archive remains in the home directory. After normal
authentication, verify its recorded hash and restore only the bounded test environment as needed.
No Cloud Run/SQL startup, IAM change, model request or business-state mutation occurred. G1/G2 and
fresh G3 read-back remain pending; AMBER is unchanged.

### Gate closure after normal authentication — 2026-09-29

The human completed normal gcloud login. Active account/project were confirmed without printing
credentials. The retained synthetic archive SHA-256 matched
`abd19d39335d6f0da871dfac5ff99429538ae34e1c3815e75c8ee973444909c0`.
It was restored to a new temporary Cloud Shell directory with ADK 1.39.1, Gen AI SDK 2.25.0,
Pydantic 2.13.5 and pydantic-settings 2.15.0; `pip check` passed. Provider/prompt/ADK/model-contract
file hashes matched this release checkout exactly, and the reasoning-source diff from the accepted
pre-merge source remains empty. This is current-code equivalence, not a claim that an older archive
contains the release branch's unrelated files.

**G2 PASS.** Exactly one synthetic `mapping-low-confidence` request completed at
**13:42:02.425604 UTC**, using explicit `gemini-2.5-flash`, region `asia-southeast1`, prompt
`bounded-reasoning-v4`. Latency **3928 ms**, **836 input / 355 output tokens**, one model call,
zero evidence-tool calls, complete usage, STOP finish. Strict schema accepted; `validation_issues=[]`,
`error=null`, no fallback. Confidence **0.9** is uncalibrated model confidence, distinct from the
supplied deterministic mapping confidence **0.4**. Disposition **ESCALATE**, human approval required,
financial authority false. Advice cites only `eval:mapping-low-confidence`, retains uncertainty,
and does not invent an acceptance threshold. The corrected exact uncertainty sentence passes without
rewriting the answer or relaxing other guards. Input context hash remained
`46bcda12453687094ae3639a80a3f0852cd2ca1db3cde22c0cdfbf8d1567b1a0` before/after.
No business repository/API, approval path, financial write or workspace was invoked.

Estimated cost **USD 0.0011383**, at the freshly checked
[Google published Flash rates](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)
of USD 0.30/M input and 2.50/M output including reasoning. This is an estimate, not billing read-back.
No other capability was rerun; prior valid evidence is reused. No full acceptance suite was rerun.

**G3 cloud checkpoint PASS.** Fresh authenticated reads returned:

- `movebooks-beta-api` and `movebooks-beta-web`: manual instance count 0, no revision min-scale
  override, no `allUsers`/`allAuthenticatedUsers` bindings; maximum remains 1.
- `movebooks-beta-pg`: STOPPED / activationPolicy NEVER; pending SQL operations **0**.
- Three retained Cloud Run job definitions; unfinished executions **0**; shell background jobs none.
- Project public bindings none; workload Owner/Editor grants none. Read-only project IAM fingerprint:
  `e504eb9dfc8467ebd2e8a52e9cd654aafd9afb131b7efa2dc2b7bdf21e3781a5`.
- `movebooks-ai-beta-artifacts`: no public bindings, public-access prevention enforced, uniform
  bucket-level access true. `movebooks-beta-probe`: no public bindings. No secret value was accessed.
- No IAM, Firebase setting, service configuration, SQL activation or business-state change was made.

Retained SQL disk/backups, registry images, bucket/soft-delete objects, secret versions, logs and
resource definitions may incur storage/logging charges. Fresh billing spend was not queried.

**G1 private-access preparation (historical handoff; resumed below).** A Firebase token does not replace
Cloud Run IAM invocation authorization. To avoid public grants, a temporary local Google CLI was
downloaded from the official source, checksum verified, and extracted without changing global PATH
or installing system packages. SDK 587.0.0 uses an isolated temporary configuration. Its normal login
is waiting for the human at Google's account chooser, with a localhost:8085 callback. This temporary
authentication listener is intentionally retained for the handoff; it is not a running cloud job.
No Firebase test client/proxy or cloud application compute has started yet. This is preparation,
not proof that the proposed private proxy SSO path works. Complete normal local authentication,
verify the private path before any service startup, then exercise G1 and terminate temporary clients.

### Private SSO handoff — 14:15 UTC, 2026-09-29

Normal local Google CLI authentication completed as the authorized operator. The official temporary
Cloud Run proxy component was installed; no IAM or Firebase configuration was changed. Its loopback
binding and separate serverless-authorization header preserve application Firebase authorization.
The SDK's optional macOS Python installation attempt failed without administrator permission; the
already-existing project Python runs the CLI successfully. No system Python installation was required.

Only `movebooks-beta-web` was temporarily changed from manual zero to one instance, retaining its
existing image and private IAM policy (fresh public-binding read-back: empty). API remains manual
zero; SQL freshly reads `STOPPED / NEVER`. A loopback-only read-only transport adapter presents the
existing deployed application UI at localhost:8765 via the official private web proxy. It only routes
GETs for the preserved workspace through the private API proxy; all business writes are blocked.
It does not replace the product's Firebase sign-in/sign-out implementation or retain credentials.
The original application uses its normal Firebase browser-session persistence. No existing browser
credential was copied, and no token is printed or manually stored by the adapter. Auth source files
are unchanged between cloud acceptance commit `2f6bab5` and the reviewed release head.

The real sign-in page loads, but automated Google sign-in ended with the generic unavailable/cancelled
message; no account chooser was observed. This is **not** an SSO pass or a diagnosed product defect.
The next step is a direct human click on **Sign in with Google** for User A. A 20-minute local adapter
expiry invokes web scale-to-zero cleanup; its success still requires read-back. The API/SQL have not
been started. No protected-workspace request, approval, invoice or data mutation occurred.

### Minimum private runtime / Safari SSO — 14:27–14:43 UTC, 2026-09-29

The user authorized the existing private API and dev/test SQL to resume for normal protected reads.
The same 20-minute local guard was re-armed for this phase and extended to stop both Run services
and set SQL to NEVER. No image, application, IAM, Firebase or startup-probe change was made.
The public-invoker bindings remained empty; the project IAM fingerprint stayed
`e504eb9dfc8467ebd2e8a52e9cd654aafd9afb131b7efa2dc2b7bdf21e3781a5`.

SQL resume began at 14:27:42 UTC and took approximately 11 minutes to become fully available.
While SQL was unavailable, the API's existing `/readyz` HTTP startup probe timed out; Cloud Run
retried instances. Temporary 429/404/500 responses and timeouts were infrastructure/startup
failures, not authorization verdicts. By approximately 14:39 UTC, `/readyz` returned HTTP 200
with `ready / cloud-dev`, and pending SQL operations were zero.

Fresh results from the actual deployed application in the user's Safari tab, through the private
loopback transport (Firebase application authorization preserved, no credential extraction):

- **14:39:47 UTC:** authenticated GET of the preserved workspace's `/onboarding` returned **200**.
  The UI showed Verified FPU, ten completed prerequisites, total **107.25**, and preserved attributed
  approvals. Invoice/journal/posting-attempt counts remained **1/1/1**. Response SHA-256:
  `47149c65968b99810526a014206e845ed45199e9a4d5755620cd40d609081e1e`.
- **14:40:24 UTC:** an anonymous protected GET through the IAM-authorized proxy returned application
  **401**, `Valid Google-compatible identity required`. No application identity was supplied.
- Navigated normally to Learn, then to `/assess?session=<preserved-id>`; the existing assessment
  loaded successfully without a new workspace or any POST. **14:40:46 UTC:** protected session GET
  returned **200** with FPU preserved and counts **1/1/1**. Session response SHA-256:
  `1b3dee11de8ed52ef4ec947e3546af81daabc40999f405cc85965ea3633e9136`.
- Used the application's actual **Sign out** button. It returned to `/sign-in`. Opening the same
  assessment URL afterward displayed **Sign in with Google to access this workspace**; no protected
  data rendered. This exercises the product's Firebase sign-out, not a substitute client logout.
- Backend identity remains derived by Firebase token verification (`check_revoked=True`); the
  protected route passes `principal.subject` to the owner-filtered SQL read. No client owner field
  or alternate business identity was supplied. Auth source is unchanged from the merged cloud slice.

The earlier **Read-only acceptance transport: business writes blocked** message is a deliberate
transport restriction, **not** a consequence of stopped SQL/API and not a product API error.
An assessment start without a preserved session requests a new scenario; that remains intentionally
blocked. Loading the existing assessment is a normal permitted workflow GET and now succeeds.
No approvals, invoices, lifecycle transitions, or preserved business data were mutated.

Fresh cross-owner access still requires the authorized User B sign-in. The Google sign-in handoff
was opened after User A logout. Readiness remains **AMBER** until that denial and final shutdown
read-back are captured. The runtime is temporarily active under the short guard, not yet finally
certified stopped. GCS/secrets remain private; no running job executions or broad IAM were found.

### Final G1/G3 closure — 14:45–14:50 UTC, 2026-09-29

The human confirmed Google sign-in as the authorized **User B**. At **14:45:31 UTC**, the ordinary
application request for the same User A session returned **HTTP 404 with application authorization
present**, versus User A's earlier **200** and anonymous **401**. The product UI showed **Assessment
stopped** and the requested session identifier, without workspace contents. This is fresh deployed
owner-isolation evidence: Firebase authentication precedes the principal-scoped SQL read. The
account selection was human-confirmed; no browser token, cookie or credential was inspected or copied.

All workspace requests in this narrow regression were GETs. The read-only transport forwarded no
business POST, created no workspace and repeated no approval or invoice. The last successful owner
reads retained Verified FPU, total **107.25**, and invoice/journal/posting-attempt counts **1/1/1**.
Normal permitted workflow **reads** passed; this gate does not claim a new successful write journey.
Prior complete journey/negative-mutation evidence remains separately attributed to its earlier run.

The 20-minute guard completed cleanup for both Run services and SQL with exit code zero. Final
independent read-back, started **14:49:56 UTC**, confirmed:

- API/web: private; no `allUsers` or `allAuthenticatedUsers` service bindings; manual count **0**;
  no revision minimum override (default zero), maximum remains one.
- SQL: **STOPPED / NEVER**, pending operations **0**. The first shutdown read had one operation
  still completing; the final result above supersedes it rather than assuming completion.
- Running Cloud Run job executions **0**; three inactive job definitions retained.
- Project public bindings **0**, workload Owner/Editor grants **0**. Project IAM fingerprint remains
  `e504eb9dfc8467ebd2e8a52e9cd654aafd9afb131b7efa2dc2b7bdf21e3781a5`, identical before/after.
- GCS public access prevention enforced, uniform bucket-level access true, no public bucket
  bindings. Secret Manager probe secret has no public bindings; no secret value was read.
- Local adapter exited; both identified official proxy processes and their parents were terminated.
  No listeners remain on ports **8765/8766/8767/8085**. The temporary Safari validation tab was closed.
  User A's actual product logout was verified above; no separate successful User B logout is claimed.

Read-only GitHub API confirmation still reports **all seven exact-head CI jobs successful**, including
both image-security jobs, on run `36568884616`. No workflow, full acceptance suite or model call was
rerun during this SSO closure. Only documentation/repository checks follow below.

**G1 and G3 PASS; final bounded acceptance GREEN.** P0/P1 remain zero in exercised scope. Retained
SQL disk/backups, registry images, bucket/soft-delete objects, secret versions, logs and resource
definitions can continue to incur storage/logging charges. Live session billing was not available;
no hard cost-cap or exact infrastructure spend is claimed. The Gemini smoke estimate remains
**USD 0.0011383**, not a total cloud bill.

## Fresh quality gates

| Check | Result / provenance |
| --- | --- |
| Full backend, AI-enabled environment | **340 passed, 10 PostgreSQL-only skipped**, 21.94 seconds; inherited Starlette test-client warning. Existing sibling virtualenv supplies ADK dependencies; pytest `pythonpath` selects this release checkout and `services/api/src`. |
| Default environment diagnostic | 328 passed, 22 skipped; superseded for AI coverage by the full result above. Missing optional ADK dependencies account for the extra skips, not test failures. |
| Frontend | **96 passed across 17 files**; lint, TypeScript and production build pass (25 pages). |
| Ruff / offline agent evaluations | Pass / **13 pass**. Canned contract evaluations are not live model-quality measurements. |
| Repository / links / credential-pattern scan | Initial pass: 92 Markdown / 353 text files; final pass: **93 Markdown / 354 text files, zero findings**. No secret values printed. This bounded scanner is not a comprehensive secret-leak guarantee. |
| Whitespace | `git diff --check` passes. |
| Dependency checks | Production npm audit: zero vulnerabilities; optional-AI `pip-audit --skip-editable`: no known vulnerabilities; `pip check`: no broken requirements. Editable first-party code is not audited by pip-audit. |
| Exact merged-head remote CI | [Run 36568884616](https://github.com/JEMathew/movers-and-ledgers/actions/runs/36568884616), completed successfully at 12:36:30 UTC, exact SHA above. **Seven jobs** pass: agents, python, web, postgres-contract, containers, API image-security, web image-security. |
| PostgreSQL / production images | Reuse exact-head successful CI: real PostgreSQL transactions/concurrency/faults/golden journeys, production container restart smoke, and both clean image builds with unsuppressed Grype `--fail-on high`. No new local Docker/PostgreSQL environment was available. |

The previous six-job count predates the added agents job. Both exact-head image High/Critical gates
pass without ignores or only-fixed filtering; this does not certify an unbuilt future deployment.
The current API Dockerfile installs the `cloud` extra, not `agents`; the separate agents CI job
audits/tests the optional AI environment. Successful base-image scans are not certification of a
future ADK-enabled deployed image. No such deployment is claimed here.

## Public surfaces / UX

Fresh browser checks on all nine routes found loaded design-system CSS (144 top-level CSS rules),
expected headings and no horizontal document overflow after the production build:
`/`, `/product`, `/simulator`, `/learn`, `/play`, `/guide`, `/trust`, `/feedback`, `/support`.
There is no observed regression to raw/default HTML rendering.

- Retain the unchanged PR #16 [visual matrix](frontend-styles.md) for `/`, `/product`, `/play`,
  `/learn`, `/guide`: desktop/mobile and light/dark, 20 combinations.
- Fresh screenshot inspection adds `/simulator`, `/trust`, `/feedback`, `/support` at 1440×1000
  and 390×844 in both themes: 16 combinations. Typography, spacing, panels, buttons and semantic
  status callouts render correctly. Trust's async data state is not a claim of live cloud monitoring.
- Mobile menu opens; all nine destinations are present. Mobile theme switching works after
  hydration. Keyboard focus on the menu has a visible 3px outline. Viewport override was reset.
- Existing automated coverage remains for dialog focus/Escape, status text/icons and reduced
  motion. This is not a complete assistive-technology audit or representative-user study.
- `/guide` remains procedural help and `/learn` concept learning. No Play redesign was performed.

## Journey, deterministic authority, recovery and security

The fresh full suite includes `test_integrated_golden` and its canonical Harbor Light journey:
Discover → Assess → Plan → Map & Approve → Migrate → Resolve → Validate → Configure → Onboard
→ Verified First Productive Use. It exercises a controlled failure, rejects retry before approval,
resumes approved work, preserves checkpoints and confirms eight idempotent completed batches.
Configuration/onboarding/FPU prerequisites reject early actions; forged lifecycle events reject.

The canonical result asserts invoice total **107.25**, one invoice and one journal. Deterministic
verification checks the live customer/product/tax contract, exact totals, posting/journal validity,
accounting impact, audit actor and current evidence-bound approval. Replay returns identical state.
Other regressions cover concurrent posting, changed accounting evidence, stale approved manifests,
failed posting recovery, verification interruption, and unsupported currency conversion.

Fresh mapping-reconsideration tests retain original rejection/actor/time/evidence, require explicit
request and review, reject spoofed events/actors, handle duplicates, survive persistence reload,
and reject stale writes without partial audit append. No preserved cloud workspace was mutated.

The prior [cloud negative-path record](google-cloud-negative-validation-2026-09-29.json) remains
valid evidence for real Firebase A/B authentication, cross-owner reads/approval POST denial before
and after restart, actor-field 422, forged lifecycle 422, wrong-idempotency 409 and unchanged owner
snapshot. Its preserved FPU has invoice/journal/posting-attempt counts **1 / 1 / 1**. Those are
retained historical observations; fresh owner reads and cross-owner GET denial are recorded in G1 above.

Live models have no financial/approval/write tool. Strict authority literals, reference membership,
semantic guards, context projection, low-trust escalation, budget/owner denial, cancellation,
stale-output suppression and reservation/replay controls all pass fresh tests. ADK uses bounded
runners, not a managed runtime. Financial success remains the deterministic verifier's decision.

Safe logging, secret-unavailable redaction, private artifact policy and cloud-upload rejection have
fresh offline coverage plus prior bounded live evidence. The initial disconnected pass could not
re-read cloud state; the subsequent authenticated G3 checkpoint above verifies private/stopped state.

## Gemini / ADK evidence reuse

`git diff 9f8a90b HEAD` for reasoning providers/prompts/ADK/contracts/routes/eval cases is empty.
Prior live records cover all five explicit `gemini-2.5-flash` routes in `asia-southeast1`:

| Capability | Retained accepted live result | Latency | Input / output tokens | Estimated USD |
| --- | --- | ---: | --- | ---: |
| Planning | Schema/reference valid; human proposal review, no financial authority | 5.110 s | 1154 / 440 | 0.0014462 |
| Mapping | Final corrected semantic guard accepts unchanged advice; ESCALATE, confidence 0.9, human review, no fallback | 4.434 s | 836 / 355 | 0.0011383 |
| Resolution | Corrected schema and checkpoint-preserving advice accepted | 5.249 s | 730 / 327 | 0.0010365 |
| Configuration | Advice versus governed product configuration correctly distinguished | 2.578 s | 732 / 369 | 0.0011421 |
| Onboarding / Knowledge | Grounded pending-review guidance; no approval/execution claim | 2.543 s | 741 / 302 | 0.0009773 |

Sources: [initial attempt ledger](live-gemini-adk-2026-09-29-evidence.md),
[targeted remediation](live-gemini-adk-targeted-remediation.md),
[final Mapping acceptance](live-gemini-adk-mapping.md). These are selected accepted observations,
not a total spend ledger; original failures and unknown usage remain in their source records.
Prices/costs are historical estimates, not billing read-back or a current quote. Confidence is
uncalibrated. Earlier real failures and current offline cases establish visible safe fallback.
No paid model call ran during the initial disconnected pass. The later single-call G2 closure above
adds fresh post-merge latency/token/cost evidence; it does not replace the historical ledgers.

## Rubric / release-area review

Reviewed the canonical [Product](../rubrics/PRODUCT_MANAGEMENT_RUBRIC.md),
[Agentic AI](../rubrics/AGENTIC_AI_RUBRIC.md),
[Migration & Onboarding](../rubrics/MIGRATION_ONBOARDING_RUBRIC.md),
[UX](../UX_PRINCIPLES.md), [reviewer](../reviewers/REVIEW_RUBRICS.md) and
[release-readiness](../RELEASE_READINESS.md) principles. No aggregate or vanity score is assigned.
All assessments are for the bounded synthetic reference implementation only.

| Required area | Assessment | Evidence / gap |
| --- | --- | --- |
| User | Bounded pass; P2 | Usable guide, governed actions and visual checks; representative-user comprehension not established |
| Customer outcome | Pass for synthetic scope | Canonical FPU and exact financial checks; no measured customer outcomes claimed |
| Business | Bounded pass; P2 | Tiny live cost ledgers and explicit no-production scope; no validated commercial metrics |
| Product | Bounded pass; P2 | Coherent journey; stale environment-independent public capability wording, F1 |
| Migration correctness | Pass | Manifest, mappings, reconciliation, rejection/reconsideration and recovery regressions |
| Agent behavior | Pass for tested contracts | Typed advisory boundaries, orchestration, stopping/escalation and replay tests |
| GenAI quality | Bounded pass; P2 | Prior five-capability evidence + fresh offline gates + accepted post-merge Mapping smoke; representative calibration remains deferred |
| Deterministic quality | Pass | Exact totals, ledger impact, repeatability and false-pass/block tests |
| Safety / trust | Pass for exercised scope | Human decisions and original rejections preserved; models cannot approve |
| Security / privacy | Pass for exercised scope | Fresh real sign-out/anonymous/cross-owner checks, prior negative-mutation coverage, private/stopped final read-back and unchanged IAM |
| UX / accessibility | Bounded pass; P3 | Visual matrix, named controls, focus and component tests; not a full assistive audit |
| Reliability | Bounded pass; P2 | CAS/rollback/checkpoints/restart and fault gates; production operations deferred |
| Engineering quality | Pass | Fresh tests/build/audits and seven exact-head green CI jobs |
| Platform architecture | Pass for scope | Provider-neutral modular boundary; runtime/model adapters do not own policy |
| Evaluation | Bounded pass; P2 | Golden/negative/ADK contracts and retained live sample; no calibrated representative accuracy claim |
| Feedback / support readiness | Bounded pass; P2 | Truthful local draft/self-help; no live inbox, SLA or production response operation |
| Demo readiness | Bounded pass; P2 | Local styled synthetic path and required live gates passed; public wording and denial/auth-state presentation need polish before broader presentation |

## Material findings and deferred work

Final observed defect counts in exercised scope: **P0: 0; P1: 0; open P2: 6; open P3: 2**.
G1/G2/G3 are now explicitly closed by evidence, not waived. F8 is the additional non-blocking
auth/denial presentation issue observed in the live browser check. No independent human approval is claimed.

| ID / severity | Evidence and gap | Why it matters / remediation / accountable role | Blocks bounded V1? |
| --- | --- | --- | --- |
| F1 / P2 | Home `app/page.tsx` still groups Google identity/live Gemini under “Building next”; Simulator says sessions expire on restart without conditioning on in-memory mode. Trust/Guide describe opt-in live capability correctly. | Users and reviewers cannot reliably distinguish local defaults from validated cloud capabilities. Product owner: align environment-sensitive scope wording before public Beta URL; no copy redesign in this validation pass. | No functional blocker; correct before public presentation |
| F2 / P2 | Live evidence is a tiny synthetic sample; self-confidence uncalibrated and Mapping exception intentionally exact. | Prevent false trust in model quality. AI/evaluation owner: representative semantic/calibration/unsupported-claim set before broader claims. | No, with advisory/HITL boundary; G2 remains separate |
| F3 / P2 | Bounded recovery/logging evidence is not production retention, immutable audit, SLO, delegated-role or incident-response certification. | Financial history and operational recovery need stronger controls at production scale. Security/runtime owner: separate hardening and independent assessment. | No for dev/test; yes before production |
| F4 / P2 | Metrics contracts lack production instrumentation/baselines; feedback is local-only and reviewer runtime is not operational automation. | Avoid inventing business success or support commitments. Product/operations owner: instrumentation and governed triage loop before live support claims. | No with explicit limitations |
| F5 / P2 | No representative-user research establishes comprehension, migration effort reduction or time-to-value. | Repository evidence does not prove customer benefit. Product/UX owner: bounded user evaluation without real financial data. | No for reference implementation |
| F6 / P3 | Existing agent accent can be violet despite blue-agent UX guidance (also noted in styling review). | Design consistency, not status ambiguity. Design owner: reconcile tokens/guidance in a later scoped change. | No |
| F7 / P3 | Starlette/httpx test-client deprecation warning persists. | Future test maintenance. Engineering owner: migrate supported test-client dependency deliberately; do not silence warning. | No |
| F8 / P2 | Cloud runtime banner shows Sign in and Sign out simultaneously; cross-owner Assess displays “Assessment stopped” plus the requested UUID rather than a clear unavailable/access-denied explanation. No protected data rendered and authorization worked. | Users cannot easily distinguish signed-out, non-owner and unavailable-runtime states. Product/UX owner: improve state-aware account controls and safe, understandable denial text in a separate scoped change. | No correctness/security blocker for this bounded reference release |

Documentation corrections in this pass distinguish provisioned dev/test from the larger deployment
target and mark PR #13's draft status as historical. They do not erase original evidence.

## Locked limitations and next action

Synthetic/reference Beta only; no production customer data, real accounting-provider integrations,
production/compliance readiness, or public production deployment. Cloud Try Your Data remains
disabled; supported local intake is limited to authorized de-identified test exports. Gemini is
optional advisory reasoning, deterministic fallback remains available, and managed ADK is disabled.
Play's planned 2D game-like experience is **post-V1**, not part of this acceptance or a release defect.

All requested remaining gates are closed. **GREEN for bounded synthetic V1 acceptance; technically
ready for the human tag/release decision**, not production deployment. Keep cloud compute stopped.
Human next action: review the three documentation changes and non-blocking limitations, commit/publish
the accepted evidence, then explicitly authorize the intended V1.0 tag/release. Address environment
wording before public presentation and track F8 separately; no unrelated UI change is included here.
Documentation edits remain uncommitted for human review; no branch publication, PR, merge, tag or
public deployment occurred in this pass.
