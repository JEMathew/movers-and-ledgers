# Gemini Advisor/Reviewer integration gate — 20 October 2026

**GO for local integration review with flags off. NO-GO for live enablement or deployment.**
The paired application service and authenticated mapping UI are implemented and tested.
Fresh inference on this implementation has **not** been authorized or performed.

## Branch, base and ownership

- Repository: `JEMathew/movers-and-ledgers`
- Branch: `feature/gemini-advisor-v2`
- Worktree: `/Users/jincenmathew/Downloads/Intuit/movebooks-gemini-advisor-v2`
- Base: `e7f1e288fd7f378045950fc94d5d7c89e298575f`, including UX checkpoint `9ed2273`.
- Starting state: clean. Thread 1's source checkout was not edited.
- Delivery identifier: the local commit at `feature/gemini-advisor-v2`; obtain with
  `git rev-parse feature/gemini-advisor-v2`. The final chat handoff records its exact SHA.
- Exact changed paths: [changed-files.txt](evidence/changed-files.txt).
- No push, PR, merge, deployment, IAM/API change, database provisioning or production model enablement.

## What the accountant receives

Open the synthetic Harbor Light sample, complete assessment and planning, and select
**1200 · Misc Clearing** in Prepare → Mappings. In an opted-in development preview,
**Run AI-Assisted Analysis** sends one confirmed POST. Loading the page invokes no model.

The Advisor receives only that mapping's bounded source facts and deterministic controls.
A separate Reviewer run receives freshly projected source facts and the validated Advisor
recommendation in a separate `advisor_recommendation` field. The recommendation is explicitly
an untrusted claim to examine, never a source citation or instruction.

The UI separates the recommendation, rationale, evidence and uncertainty from the Reviewer's
`ACCEPT`, `QUESTION` or `REJECT` assessment. Accepting a recommendation to investigate does
not clear the ambiguous mapping: the mapping evidence can still be `CHALLENGED`.
The accountant must establish business purpose/settlement history and use the existing
decision controls. Deterministic validation remains authoritative.

The original evidence-only independent rule check remains available. No generic chat or
public landing changes were introduced. `AI_ASSISTANCE_STATUS` remains `planned`.

## Implementation and boundaries

- `POST /v1/migration-sessions/{session_id}/analysis/mapping/{mapping_id}` requires authentication,
  ownership, `request_id` and `confirmed: true`. Extra client fields are forbidden.
- Only repository synthetic samples with source ID `account-clearing`, an account mapping,
  and no migration execution are admitted. Uploads/raw uploaded context are rejected before calls.
- Reuses `request_advice`, `request_review`, existing Gemini/ADK providers, projections,
  strict output validation, CAS reservations, model policy and optional Firestore controls.
- Fresh ADK role/session for each agent. Only the read-only evidence tool is registered.
  No approval, accounting, mapping or execution tool is exposed to either agent.
  Independence is at the role/context level; both use the configured Gemini model.
- Advisor/review records are bound by advisor request ID and context hash. Review hash
  includes the tested recommendation. Stale results are withheld; both UI panels are suppressed
  if the review observes changed evidence.
- Same-context results are cached; pending/interrupted runs are not automatically replayed.
  Browser retries retain the request ID. Existing limits remain: 10 Advisor records and
  3 Reviewer records per session, plus cloud owner/global quotas.
- Each role permits at most two generation calls and two evidence reads; one pair permits
  four generation calls. Transport retries and semantic retries are zero.
- Each call allows 2,048 output tokens and now rejects serialized model requests above
  65,536 UTF-8 bytes, including tool schemas/history. This byte guard is not a token meter.
  Per-role timeout defaults to 30 seconds, maximum 60; only the paired proxy route receives
  a 130-second upstream deadline and the browser a 135-second deadline.
- Invalid/unavailable Advisor output produces labeled deterministic fallback and does not
  trigger a paid Reviewer. Invalid/unavailable Reviewer output produces its independent
  deterministic check. Unknown token counts remain unknown.
- No model-supplied authority or financial assertions can enter business-state decisions.
  Telemetry retains allowlisted counters and failure categories; raw provider errors,
  unvalidated output, prompts, actor IDs and credentials are not logged.

Snapshot compatibility: old snapshots retain their original encoding when the new optional
review fields are absent. **New paired-review records are not readable by an older strict
backend schema.** Keep this preview ephemeral until a deployment/rollback plan is approved;
do not roll an older backend onto persistent sessions that contain paired-review records.

## Evidence: deterministic, mocked and live are distinct

| Evidence | What it proves | What it does not prove |
| --- | --- | --- |
| [deterministic-service.json](evidence/deterministic-service.json) | Actual paired service with models disabled; timestamps, one synthetic case, projected evidence, validated fallback, unchanged business state, zero calls | Gemini execution or semantic quality |
| [backend-tests.txt](evidence/backend-tests.txt) | 184 passing focused tests, including scripted providers and real ADK orchestration with scripted LLMs | Live networking, workload inference access or paid usage |
| [frontend-tests.txt](evidence/frontend-tests.txt) | 54 passing frontend/proxy tests | Hosted acceptance |
| [Advisor screenshot](evidence/browser-deterministic.png), [Reviewer screenshot](evidence/browser-reviewer-deterministic.png), [accessibility tree](evidence/browser-accessibility.txt) | Actual localhost UI → API flow; explicit click, separate fallback panels, human control, zero recorded decisions | Live Gemini UI output; mobile/zoom or full accessibility certification |
| [Read-only preflight](evidence/cloud-preflight.json) | Existing service identity, role binding and APIs; current public model documentation | Effective access under every org policy, quota availability, or successful generation |
| [18 October historical trace](../reviews/live-gemini-l1-16e31e9.md) | Owner-reported earlier live harness result on the same model | This new flow: that Reviewer never received Advisor output; underlying trace is held privately |

No new live trace or live-model screenshot is supplied. No mocked result is represented as
Gemini evidence. A successful schema check is not a human assessment of accounting quality.

## Verification performed

Python: **184 passed, zero skipped**, including paired explicit invocation, grounding,
Reviewer separation, owner isolation, spoof/unauthorized-write rejection, unchanged business state,
disabled gates, output rejection, timeout/cancellation, bounded retries/calls, input capacity,
stale evidence, pending/replay protection, quotas, human approval, secret canaries and snapshot CAS.
The only warning is the existing Starlette/httpx test-client deprecation.

Frontend: **54 passed** across `AssistedAnalysis`, `IndependentReview`, mapping-state and
private-proxy tests. Covers opt-in/case gating, click-only invocation, loading/error status,
separate role regions, fallback labels, stale-workspace discard, abort on unmount, stable retry ID,
authenticated same-origin proxying and the paired deadline.

`npm run typecheck`, targeted ESLint, targeted Ruff and `git diff --check` pass.
Full unrelated suites and a production build were not run.
Exact verification commands are in [verification.txt](evidence/verification.txt).

Browser: local demo identity, normal sample assessment/plan/mapping flow, explicit analysis,
separate results, keyboard Enter expands/collapses evidence, original mapping remains Needs review,
and Recorded decisions remains zero. No human mapping decision or migration was executed.

## Model, environment and IAM

The [current model page](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)
documents `gemini-3.5-flash-lite`, structured output/function calling and global Standard PayGo.
The [lifecycle table](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions)
lists retirement no earlier than 21 July 2027; the older `gemini-2.5-flash` retires on 20 October 2026.
This verifies documented availability, not an actual workload invocation.

- Endpoint: `https://aiplatform.googleapis.com`
- Resource: `projects/movebooks-ai/locations/global/publishers/google/models/gemini-3.5-flash-lite`
- Location: explicit `global`; this does not promise Singapore-resident processing.
- Generation: existing replacement-specific LOW thinking, no thought disclosure, no custom sampling.
- Read-only Cloud Run inspection verified service identity
  `movebooks-beta-api@movebooks-ai.iam.gserviceaccount.com`.
- Existing project-level `roles/aiplatform.user` binding and enabled `aiplatform.googleapis.com`
  and `firestore.googleapis.com` were observed. No roles/APIs were changed.
- Cloud mode still requires verified Firebase identity, explicit synthetic authorization,
  an enabled Firestore control policy, and atomic quota/cost reservations.
  The policy document was not read or changed in this task.
- No default local ADC file was present. CLI authentication does not prove ADC availability.
  The proposed live harness needs an existing approved ADC environment (such as the prior
  Cloud Shell environment). Do not create credentials or extend IAM as an implicit step.
- Existing guards reject live inference in staging/production. The new preview flag is
  also rejected in staging/production. All defaults keep inference off.

## Costs and proposed approval scope

[Published Standard global text rates](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing),
checked 20 October: **$0.30 per million input tokens; $2.50 per million output tokens,
including reasoning**. Estimate: `(input_tokens × 0.30 + output_tokens × 2.50) / 1,000,000`.
For example, 6,000 input and 2,000 output tokens across a pair would cost about **$0.0068**.
This is an illustration, not observed usage or a guaranteed bill.

Existing cloud controls conservatively reserve $0.10 per role, hence $0.20 for a pair,
with default global daily reservation budget $1 and owner/global daily call limits 20/100.
Local execution uses the per-session/per-run bounds; it does not create a cloud budget.
Output/call/byte caps constrain cost but do not implement a provider-side hard billing cap.

Proposed next approval: **one synthetic pair, maximum four generation calls, no retries,
$0.20 spend allowance, global processing**, using the pinned model and existing ADC permissions.
No deployment, IAM/API change, push or public claim is included. Stop after the pair even if it
falls back; review failures rather than repeatedly sampling until success.

## Reproduction and integration

From this worktree, with the repository's installed Python dependencies:

```sh
python scripts/gemini_analysis_eval.py --out /tmp/gemini-analysis-offline.json
```

The output path must be new, in an existing directory. Default execution is deterministic;
no provider client or credentials are used. It exercises the same application service as the UI.

For a local browser preview, start the existing API with
`MOVEBOOKS_MODEL_PROVIDER_MODE=deterministic-only` and
`MOVEBOOKS_SYNTHETIC_ANALYSIS_ENABLED=true`; start the web app with
`NEXT_PUBLIC_SYNTHETIC_ANALYSIS_ENABLED=true` and its matching API URL/CORS origin.
Use only local demo identity and a synthetic workspace. The test used web port 3002 and API 8012.
Both preview processes were stopped after verification.
No checked-in environment file enables these flags.

**Only after fresh approval**, in the approved ADC environment:

```sh
export MOVEBOOKS_ENV=local
export MOVEBOOKS_MODEL_PROVIDER_MODE=gemini-adk
export MOVEBOOKS_REASONING_PROJECT=movebooks-ai
export MOVEBOOKS_REASONING_LOCATION=global
export MOVEBOOKS_SYNTHETIC_ANALYSIS_ENABLED=true
export MOVEBOOKS_SYNTHETIC_BETA_AUTHORIZED=true
export MOVEBOOKS_REASONING_MODELS='{"planning":"gemini-3.5-flash-lite","mapping":"gemini-3.5-flash-lite","resolution":"gemini-3.5-flash-lite","configuration":"gemini-3.5-flash-lite","onboarding":"gemini-3.5-flash-lite"}'
python scripts/gemini_analysis_eval.py --live --confirm-usd020-synthetic-test \
  --out /tmp/gemini-analysis-live.json
```

The script uses normal ADC, creates only an in-memory synthetic repository, exports validated
redacted results and observed usage, and exits nonzero for live fallback or business-state change.
It never deploys, starts a hosted API or provisions operational storage.

Thread 1 integration, when approved: review the local commit/diff against `e7f1e28`, then
cherry-pick onto an integration branch. Keep both preview flags off for the UX production release.
Resolve any overlap in `MappingReview.tsx` and the proxy files with Thread 1; no public design
changes are included. Re-run the focused tests listed in the saved test output, typecheck and lint.
Do not deploy or change the public AI-status constant until a separate hosted authenticated
inference and human acceptance gate passes.

Remaining gate: approve and perform the bounded live test, inspect the actual recommendation
and Reviewer assessment for usefulness/grounding, then decide separately on hosted integration.
Stop here pending approval.
