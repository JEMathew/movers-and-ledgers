# Bounded live Gemini / ADK evidence — 2026-09-29

Disposition: **AMBER**. Normal authenticated Gemini generation and bounded local ADK execution
worked, but resolution and onboarding did not produce accepted structured output. Accepted schema
is not equivalent to semantic correctness. No deployment or business-state validation is claimed.

## Provenance and boundaries

- Branch `feature/live-gemini-adk`; implementation `847a5b9cea9d14cae52e4f7ee1c4cde474b13231`;
  local pre-run head `394cd5133662ffd924fac88d20f81f4de97a9eba` (documentation-only successors).
- User-uploaded allowlisted source archive from `937a278`, SHA-256
  `c1df71aadee2accbe99a99b711dd28fff0de6a7cd283b34f75b564915849df1c`, verified in Cloud Shell.
  It contains advisory source/settings and synthetic fixtures, not credentials or workspace data.
- Normal Cloud Shell ADC; project `movebooks-ai`; pinned regional endpoint `asia-southeast1`.
  Only the explicitly approved Vertex AI API was enabled. No IAM changes were performed.
- Isolated temporary environment: Google ADK 1.39.1, Google Gen AI SDK 2.25.0, Pydantic 2.13.5,
  pydantic-settings 2.15.0; `pip check` passed. No API server or business repository was started.
- All five capability routes explicitly selected `gemini-2.5-flash`; no default/alternate model.
  This proves per-capability selection with one common model, not heterogeneous-model performance.
- Prompt version `bounded-reasoning-v1`; deadline 60 seconds; at most two model calls and two
  read-only evidence calls per request; 2,048 output tokens per call, thinking budget 128.
- Six distinct requested cases plus one diagnostic resolution retry: **seven requests**, maximum
  **14 reserved generation attempts**. No additional invalid-model request: actual validation failures
  exercised safe fallback. No repeated-until-success sampling. Paid calls stopped after this set.
- The inline evaluation called the existing `live_route`, `GeminiAdkProvider` and `reason` functions.
  Synthetic validated advice was inspected transiently for claim-level review, not logged by the
  application. Safe scalar evidence is transcribed below. Diagnostic wrapper re-raised exceptions
  after emitting only class, numeric status and allowlisted counters; no exception messages, raw
  response bodies, tokens, credentials or tracebacks were printed. It did not alter provider output.

## Attempt ledger

All times UTC on 2026-09-29. Planning finished before 11:18:15; exact timestamp was not captured.
Input/output tokens include SDK-reported thinking tokens in output. `partial` means counters observed
inside the failed runner, not a successful `ProviderResult`. Unknown does not mean zero.

| Case / attempt | Terminal time | Latency ms | Calls / evidence reads | Input / output tokens | Estimated USD | Structured result / fallback |
| --- | --- | ---: | --- | --- | ---: | --- |
| Planning sequence | Not captured | 5110 | 2 / 1 | 1154 / 440 | 0.0014462 | Accepted / no |
| Mapping high-confidence | 11:18:15.352374 | 3517 | 1 / 0 | 514 / 298 | 0.0008992 | Accepted / no |
| Mapping low-confidence | 11:18:17.277196 | 1924 | 1 / 0 | 513 / 280 | 0.0008539 | Accepted / no |
| Resolution duplicate, original | 11:18:18.822705 | 1545 | Unknown | Unknown | Unknown | `provider_unavailable` / yes |
| Resolution duplicate, diagnostic | 11:21:41.542753 | 3383 | 1 / 0 partial | 511 / 290 partial | 0.0008783 partial | `ValidationError` / yes |
| Configuration accounting | 11:21:58.762695 | 4147 | 1 / 0 | 513 / 298 | 0.0008989 | Accepted / no |
| Onboarding state | 11:22:00.808384 | 2045 | 1 / 0 partial | 522 / 258 partial | 0.0008016 partial | `ValidationError` / yes |

Denominators: **4/6 distinct cases accepted**, **4/7 requests accepted**, **3/7 requests fallback**.
Three of five capabilities had an accepted result; neither resolution nor onboarding did. These
tiny samples are not a reliability or quality baseline. Latency range for all requests: 1.545–5.110s;
accepted outputs: 1.924–5.110s. End-to-end application/browser latency was not measured.

Known usage, including partial failed-run observations: **3,727 input + 1,864 output tokens**;
known estimated cost **US$0.0057781**, plus unknown usage/cost for the first resolution failure.
Seven generation calls are observed across six requests; the original failure may add up to two.
This is a token-rate estimate, not billed project spend or proof of a hard billing cap. It uses
Flash text rates of US$0.30/M input and US$2.50/M output, including thinking, from the
[published pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing).
No paid external tool was enabled. The US$1 working target was not used as permission to expand
the sample. Missing usage is retained as a gap, not rounded down to free.

## Evidence binding

Each accepted output cited its single supplied `eval:<case>` fact. SHA-256 is of
`context.model_dump_json()` before invocation. Before/after equality held for all seven requests.

| Case | Context SHA-256 |
| --- | --- |
| planning-sequence | `3e9961048e3cab74b430a018b51dfb9e11055844fd8455c7219f531c490fc4e6` |
| mapping-account | `88f15a98ca3aa5cde3915ec00b5df5801dfceba886cbea4a7ad2aa80bb5a8bb0` |
| mapping-low-confidence | `af8cb24ad10354cb9379a28cc407a07319a70f4351637d225c5d3d85959f546c` |
| resolution-duplicate (both) | `c2e9226f7eabcdd5e32a8a27cae7c6b5ebbc30db322fecf09abdce59424c0879` |
| configuration-accounting | `21b1d7bd77c9d816d9ec5040a38eba6672c8a11f6e74e2f949a87db6f9a493d1` |
| onboarding-state | `d2412b847cdecbf42b77eda3ae6f8ca32389c40366bfd37e36b4e040418c0d97` |

## Claim-level advisory review (not a human usefulness study)

| Case | Confidence / host next action | Evidence quality / gap |
| --- | --- | --- |
| Planning | 0.9 / REVIEW_EXISTING_PROPOSAL | Correctly retained Plan-before-mapping dependency and execution gate; admitted missing gate criteria. Does not prove sequencing benefit over fallback. |
| Mapping high | 0.9 / REVIEW_EXISTING_PROPOSAL | Referred to supplied Sales candidate and compatibility result, retained human review; no mapping applied. |
| Mapping low | 0.9 / ESCALATE | Correct escalation, but rationale asserted a threshold for automated processing not established by supplied evidence. **P2** unsupported policy wording. Model self-confidence 0.9 is not the candidate's deterministic 0.4. Host also forces escalation; no independent raw-model escalation score is claimed. |
| Resolution, both | 0 fallback / ESCALATE | No accepted model advice; do not award grounding/quality credit to deterministic fallback. |
| Configuration | 0.9 / REVIEW_EXISTING_PROPOSAL | Correctly advised review, but conflated the advisor's intentional lack of write tools with unavailable product functionality, suggesting escalation over missing tools. **P2** scope/grounding defect; schema/reference success is insufficient. |
| Onboarding | 0 fallback / REVIEW_EXISTING_PROPOSAL | No accepted model advice; live grounded guidance unproven. |

All accepted advice required human approval and denied financial authority. All fallbacks made no
model-inference claim, preserved those authority flags and returned to existing review/escalation.
No provider output reached business execution, approval, balance, reconciliation or FPU controls.
No workspace was connected, so unchanged synthetic context is **not** a fresh cloud FPU/replay or
durable reasoning-record test. Existing offline financial/owner/CAS regression evidence remains
separate. No invoices or approvals were created/repeated.

## Failure path and open blockers

The original resolution failure was caught as `provider_unavailable`; its specific exception and
usage were not retained. A single authorized diagnostic retry and onboarding each raised
`ValidationError` after one observed model call. No numeric HTTP error was reported. The exact
invalid field was not captured; do not label this a quota/IAM outage or claim a complete root-cause
diagnosis. Both failures were safely contained without relaxing output contracts or model switching.

- **P2, engineering:** resolution/onboarding structured-output failures block full five-capability
  acceptance. Next diagnose with safe schema field/error-code metadata and offline reproductions;
  never persist raw credential-bearing errors or weaken authority/schema constraints.
- **P2, engineering/metrics:** runner schema errors are coarsely categorized as provider unavailable
  and lose partial usage at the provider boundary. Preserve safe failure categories/known counters
  in a focused follow-up while retaining unknowns; do not infer zero billing.
- **P2, GenAI/Product:** unsupported mapping-policy and configuration-tool wording require prompt/
  evidence-projection clarification and regression cases, then a separately bounded targeted rerun.
- **P3:** confidence remains uncalibrated; no human study, latency baseline, raw-model escalation
  precision/recall, or heterogeneous-model comparison was performed.

Focused advisory review: Agentic AI, GenAI Quality, FinTech Trust, Architecture, Security and Release
Readiness found **P0=0 / P1=0 in this synthetic no-write scope**. The P2 acceptance blockers above
still require **AMBER**, not a blanket live-release GREEN. Optional image/deployed-runtime security,
new remote branch CI, durable live reasoning records and production/compliance remain unproven.

## Local verification and cloud boundary

Focused backend regression rerun: **28 passed**, one inherited Starlette test-client warning.
Thirteen offline contract evaluations and focused Ruff checks passed again; they do not substitute
for successful live model output or semantic quality.
The existing 318 backend passes / 10 PostgreSQL skips, 94 frontend passes, lint/typecheck/build and
dependency gates are prior implementation evidence, not claimed as rerun for this docs-only result.
Repository/Markdown/secret-pattern checks: **89 Markdown files, 347 text files, zero findings**.
Whitespace check passed. These bounded patterns are not an exhaustive security audit.

No Cloud Run/SQL start, endpoint exposure, deployment, IAM expansion, Firebase change, production
data handling, managed ADK activation, or business-state mutation was performed. All evaluation
Python processes returned to the shell; no persistent model runner was installed or started.
Fresh post-test read-back: both `movebooks-beta-api` and `movebooks-beta-web` have
`run.googleapis.com/scalingMode=manual`, `manualInstanceCount=0`, no minimum-scale annotation and
empty public IAM bindings (`allUsers` / `allAuthenticatedUsers`). SQL `movebooks-beta-pg` reports
`STOPPED` / `activationPolicy=NEVER`. `jobs -pr` returned no running jobs in the validation shell.
This check did not enumerate unrelated Cloud Run job executions or re-audit project-level IAM.
The authorized Vertex API remains enabled. Uploaded source and temporary dependency files contain
no credentials and may remain until ordinary Cloud Shell cleanup. Retained pre-existing storage,
images and logs were not deleted and may retain their usual charges.

Next: fix/diagnose only the named advisory output and evidence gaps locally, retain AMBER, and use
a separately bounded targeted live follow-up. Do not deploy, merge or restart cloud runtime.
