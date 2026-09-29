# Bounded Gemini / Google ADK reasoning

Status: implemented and tested locally; **live activation AMBER, not verified**. This is an
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

There is **no default live model ID** and no verified model choice in this record. The existing
legacy `route_for` suggested model table is not the live selector. `live_route` accepts only these
five capabilities; financial/reconciliation/execution routes cannot be selected. Each request has
a 30-second default deadline (operator range 1–60), at most two model calls, two evidence reads and
2048 output tokens per call. Latency and price expectations must be checked for the selected models;
no measured live latency or currency estimate exists yet.

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
are required by the code, and none were made; actual Vertex API/IAM availability is still unverified.

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
| Latency | Host elapsed milliseconds per terminal request, including fallback; no live baseline yet |
| Fallback rate | FALLBACK terminal records / all terminal records; pending is reported separately |
| Escalation rate | Records with advice.next_action=ESCALATE / terminal records with advice; do not equate escalation frequency with quality |
| Reference validity | Pass only for a provider output accepted by schema/reference checks; null for rejected/unavailable output |
| Semantic grounding / task correctness | Human claim-level assessment of live answers; currently NOT ASSESSED, not replaced by reference validity |
| Tool selection / policy | Actual ADK allowlist and forbidden-tool tests; live selection still unassessed |
| Cost | API currency is null until verified model-specific prices exist; retain known tokens and reserved exposure, including unobserved interrupted usage |
| Customer outcome | Future comprehension/decision-burden study; neither model usage nor acceptance substitutes for verified FPU |

## Bounded validation runbook

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
