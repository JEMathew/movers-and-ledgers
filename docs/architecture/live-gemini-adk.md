# Bounded Gemini / Google ADK reasoning

Status: implemented locally and exercised through authenticated Gemini/ADK; **GREEN for the
exercised bounded synthetic advisory live gate**, including accepted Mapping escalation after its
exact semantic false-positive correction. See the
[Mapping evidence](../reviews/live-gemini-adk-mapping.md) and
[earlier targeted remediation record](../reviews/live-gemini-adk-targeted-remediation.md). This is an
opt-in synthetic dev/test advisory path, not a replacement for stage agents or financial tools.
Cloud Run, Cloud SQL, Firebase, IAM and the preserved cloud workspace were not changed.

## Responsibility boundary

Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential
decisions. Authoritative financial truth remains deterministic.

The existing migration orchestrator owns every lifecycle transition. The five reasoning advisors
explain existing proposals; they cannot create/apply mappings, approve, retry, post invoices, compute
balances, reconcile, verify FPU or change workflow state. No model result is an input to a financial
or approval decision. The UI leaves the existing governed controls intact. The original mapping
provider contract and deterministic agents remain unchanged; a sibling `ReasoningProvider` port
provides structured, provider-neutral advisory inference without changing those contracts.

| Capability | Input and purpose | Model selection / rationale | Fallback and handoff |
| --- | --- | --- | --- |
| Planning | Existing phase order, dependencies, statuses; explain blockers | Explicit `reasoning_models.planning`; operator may select a stronger reasoning model after availability/price verification | Read existing deterministic plan; return to human review |
| Mapping | Synthetic account/entity/tax concepts, candidates, risks, review states | Explicit `reasoning_models.mapping`; ambiguity benefits from reasoning, not financial authority | Inspect compatibility and existing mapping proposal; rejected mappings still require governed reconsideration |
| Resolution | Recorded deterministic failure classifications | Explicit `reasoning_models.resolution`; diagnose ambiguity, not decide retry policy | Always escalate to existing governed remedy/retry controls |
| Configuration | Existing accounting/tax/access proposal states and approval requirements | Explicit `reasoning_models.configuration`; reasoning explains policy, never applies settings | Existing deterministic configuration review |
| Onboarding / Knowledge | Current governed checklist only; no external knowledge retrieval | Explicit `reasoning_models.onboarding`; a faster model may suffice for bounded guidance | Existing onboarding controls; unsupported requests escalate |

There is **no default live model ID**. The bounded 2026-09-29 run explicitly selected
`gemini-2.5-flash` for all five routes; the initial run accepted three capabilities, and subsequent
targeted remediation supplied accepted resolution/onboarding and Mapping escalation evidence.
This is not representative model-quality or production certification. The existing
legacy `route_for` suggested model table is not the live selector. `live_route` accepts only these
five capabilities; financial/reconciliation/execution routes cannot be selected. Each request has
a 30-second default deadline (operator range 1–60), at most two model calls, two evidence reads and
2048 output tokens per call. Latency and price expectations must be checked for the selected models;
measured request latency was 1.545–5.110 seconds. Known token cost was US$0.0057781 plus unknown
first-resolution failure usage, not billed spend. See the [attempt ledger](../reviews/live-gemini-adk-2026-09-29-evidence.md).

## ADK runner and typed contracts

`agents/reasoning/adk.py` constructs one `LlmAgent` per requested capability using pinned optional
`google-adk==1.39.1`. A fresh in-memory ADK session has no business identity, artifacts, long-term
memory, agent transfers, cloud Agent Engine or managed ADK hosting. The only registered business
tool is `read_evidence()`: a no-argument read of the supplied bounded synthetic projection. ADK also
serializes the typed final output; its serializer is not a business write tool. Runner sessions and
clients are closed in `finally`. SDK transport retries are limited to one attempt; there is no
automatic semantic retry or second-provider retry. Tool errors, call exhaustion, timeouts and invalid
responses produce visible fallback, not workflow success.

`ReasoningInput` separates facts, workflow state, deterministic boundaries and escalation need.
`Advice` requires observation, inference, recommendation, concise rationale, allowed evidence refs,
confidence, uncertainty, alternatives and an enumerated next action. Host validation requires human
review=true and financial authority=false, rejects extra fields/non-finite confidence/oversize text,
and forces escalation for low confidence or deterministic blockers. ADK's wire schema uses booleans
because its function converter cannot encode boolean literals; the stricter host schema revalidates
them. Versioned per-capability prompts specify tools, prohibited actions, untrusted-input treatment,
stopping rules and human boundaries. Prompts are not authorization controls.

Targeted correction: ADK's response-tool converter loses Pydantic Field constraints when it uses
annotations alone. The before-model callback now supplies the full wire JSON Schema for that tool;
the host contract is not loosened. Safe diagnostics retain canonical rejected paths/rules and JSON
kinds, never raw input/context/error messages. Usage captured before ADK output validation survives
schema and missing-output failures as partial evidence. Allowlisted finish reasons and explicit
unknowns distinguish missing output from a valid answer. Prompt v4 and narrow narrative guards
distinguish advisor limits from product functionality, reject invented mapping-policy thresholds
and speculative new-identifier duplicate remedies. Conservative false positives remain possible;
safe fallback is not semantic acceptance. No automatic retries were added.

Reference membership is **not semantic grounding**. A conservative narrative rejection filter catches
known approval-bypass and false financial/completion claims, including reviewer adversarial examples.
It is not a proof against every hallucination; even safe negations can fall back. UI labels AI prose
as unverified guidance and never presents it as financial verification. Confidence is self-reported,
uncalibrated and never grants authority. Representative live usefulness/claim-level evaluation is a
release gap, not an inferred pass.

## Owner, replay, persistence and audit

`POST /v1/migration-sessions/{id}/reasoning/{capability}` accepts only a UUID `request_id`.
The existing authenticated principal and owner-scoped repository lookup run before any provider
call. Client actor fields are rejected. Missing ownership returns 404; missing stage prerequisites
return 409. Uploaded/de-identified customer exports are excluded even in local mode: only repository
synthetic samples can be projected. Context excludes actors, comments, raw financial rows and amounts;
mapping source labels/candidates remain untrusted data. At most 40 mapping facts / last 20 failures
are sent; the projection is a partial advisory view, not a complete accounting inventory.

The host CAS-reserves a PENDING record before inference. Records bind request, owner, timestamp,
capability, provider/model, prompt version and evidence hash, then add terminal outcome/usage.
Repeated request IDs with different evidence/configuration fail; equivalent completed requests reuse
the record. PENDING/interrupted requests never automatically replay. Ten lifetime reservations per
workspace maximum imply at most 20 attempted model calls. This is not a project-wide billing cap.
There is no client reset of pending/budget state. Interrupted operations stop safely; operator
recovery policy remains a follow-up, not permission to edit approval history.

Completion reloads the workspace and checks the projection hash. Changed relevant evidence discards
advice as UNAVAILABLE. CAS prevents overwriting concurrent business writes. Durable session snapshots
include reasoning records while omitting an empty new field for legacy CAS byte compatibility.
SQLite restart/CAS and codec tests cover the additive field; PostgreSQL/cloud live revalidation of
this new record was not run. Reasoning records are attributable advisory traces, not forged
`human_decisions` or canonical lifecycle events. Existing approvals, audit events and invoice counts
remain untouched. GET history is owner-scoped and labels stale evidence. The UI remounts on workspace
query changes, clears old guidance, shows fact snapshots and never adds an approval button.

## Configuration and egress

Default `MOVEBOOKS_MODEL_PROVIDER_MODE=deterministic-only` remains credential-free. Install
`.[agents]` only in a deliberate advisory environment. The current production Dockerfile still
installs `.[cloud]`, not the optional ADK extra; deploying an AI-enabled image requires a separate
build/security gate. No hardened cloud image was replaced or rescanned in this slice.

Opt-in settings are `MOVEBOOKS_MODEL_PROVIDER_MODE=gemini-adk`, explicit
`MOVEBOOKS_REASONING_PROJECT`, `MOVEBOOKS_REASONING_LOCATION=asia-southeast1`, and
`MOVEBOOKS_REASONING_MODELS` JSON containing all five capability keys. Staging/production are
rejected. Normal Vertex ADC is used; no keys, raw tokens, credential files or browser-session
extraction are part of the adapter. Region and SDK base URL are pinned to the regional Google
endpoint. Ambient Gemini keys/endpoint overrides and configured OTLP export endpoints are rejected.
SDK content capture flags are forced off and SDK debug payload logging is suppressed process-wide.
Only allowlisted application scalar telemetry is intended for use. No Secret Manager/IAM changes
are required by the code, and none were made. Read-only Cloud Shell preflight on 2026-09-29 verified
normal ADC for `movebooks-ai`; Service Usage initially reported `aiplatform.googleapis.com` **DISABLED**.
The user subsequently approved enabling only that API; enablement succeeded and project IAM bindings
were unchanged in the immediate before/after read-back. No IAM-change command was run. A regional
`gemini-2.5-flash:countTokens` request returned HTTP 200 with seven synthetic input tokens. Actual
generation and local bounded ADK execution subsequently succeeded using that ADC. This does not
activate managed ADK, deploy an application, or prove all five capabilities. Resolution/onboarding
failed output validation; safe fallback preserved no-write and human-governance boundaries.

## Measurement contract

Owner: engineering for runtime safety; product for usefulness; release owner for activation.
Window: each explicitly bounded evaluation session; segment by capability, model and prompt version.
The persisted record is the denominator source, **not raw log-line count**: PENDING and terminal
telemetry are two emissions for one reservation. SDK credentials, prompts, output narratives, raw
payloads, actors and exception messages are excluded from logs.

| Measurement | Definition / exclusions |
| --- | --- |
| Attempts / reserved calls | Number of unique durable reservations; two reserved calls per live request |
| Observed calls and usage | Provider-reported call/tool/input/output counts; unknown remains null on interrupted runs, never assumed zero |
| Latency | Host elapsed milliseconds including fallback; seven live observations are not a baseline |
| Fallback rate | FALLBACK terminal records / all terminal records; pending is reported separately |
| Escalation rate | Records with advice.next_action=ESCALATE / terminal records with advice; do not equate escalation frequency with quality |
| Reference validity | Pass only for a provider output accepted by schema/reference checks; null for rejected/unavailable output |
| Semantic grounding / task correctness | Representative human assessment remains absent; advisory inspection found two live semantic defects despite valid refs |
| Tool selection / policy | ADK allowlist/forbidden-tool tests; live planning used one evidence read and two model calls; no business writes |
| Cost | API currency is null until verified model-specific prices exist; retain known tokens and reserved exposure, including unobserved interrupted usage |
| Customer outcome | Future comprehension/decision-burden study; neither model usage nor acceptance substitutes for verified FPU |

The isolated Cloud Shell smoke did not create durable reservations. Its separate attempt ledger is
the denominator for that experiment only; this does not validate production telemetry aggregation.

## Bounded validation runbook

### Pricing and model preflight (2026-09-29)

Google's [model specification](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/2-5-flash)
lists `gemini-2.5-flash`, structured output and `asia-southeast1`. Its
[lifecycle table](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions)
lists retirement of the 2.5 Pro / Flash / Flash-Lite family on 2026-10-20. Recheck before any later
run; do not silently substitute a successor model. All five live evaluation routes were explicitly
configured with Flash in the isolated process; deployed application configuration was not changed.

Published [standard text pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing),
USD per million tokens, excluding separate paid tools:

| Documented model | Input | Output including reasoning | Actual use in this bounded session |
| --- | --- | --- | --- |
| Gemini 2.5 Flash | 0.30 | 2.50 | Six cases plus one diagnostic retry |
| Gemini 2.5 Pro, input at most 200K tokens | 1.25 | 10.00 | None |
| Gemini 2.5 Flash-Lite | 0.10 | 0.40 | None |

These rates support token-cost estimates, not project billing read-back. The reviewed source upload
was completed and hash-verified. Seven requests (six distinct cases and one diagnostic retry) yielded
four accepted outputs and three safe fallbacks; all five capability routes were attempted. Partial
failed-run usage is explicitly separate from successful provider telemetry. The first resolution
failure's consumption remains unknown. The 14 reserved-call ceiling included the diagnostic retry;
actual schema failures covered the negative path without an extra invalid-model request. No further
paid calls were made. Full semantic grounding and capability readiness remain unproven; keep AMBER.
Before any later bounded run, account for all attempts/unknowns and reconfirm model lifecycle/prices.

### Execution prerequisites

Offline: `python scripts/live_reasoning_eval.py`. Thirteen synthetic cases exercise host contracts,
not model reasoning quality. Backend tests separately exercise the real ADK runner with offline
model doubles, safety paths, original financial workflows and forbidden tools.

Live requires normal ADC in the validation process, verified available model IDs/current prices,
enabled Vertex API and authorized narrow permissions. Report any additional API/IAM need before
changing it. Authorized scope is project `movebooks-ai`, region `asia-southeast1`, US$1 model-call
operating target; **no Cloud Run/SQL startup**. No existing workspace is contacted.

After all local gates and prerequisites pass, run at most one selected case per capability using
`python scripts/live_reasoning_eval.py --live --confirm-usd1-synthetic-test` and explicit `--case`
arguments (one to five). It stops on the first invalid/unavailable response, never prints model text
or credentials and reserves at most ten calls. Verify chosen-model worst-case pricing against the
target first; this is not a hard billing cap. Safe scalar output alone cannot establish semantic
quality: a separate authorized in-memory human evaluation step is still required before claiming
representative grounded/useful live behavior. Do not save raw prompts or outputs as runtime logs.

References: [ADK LLM agents](https://google.github.io/adk-docs/agents/llm-agents/),
[Google Gen AI SDK](https://github.com/googleapis/python-genai).
See the [review and evidence record](../reviews/live-gemini-adk.md).
