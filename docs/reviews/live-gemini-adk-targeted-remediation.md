# Targeted advisory remediation — 2026-09-29

Branch: `feature/live-gemini-adk`. Prior evidence is retained unchanged in the
[first live ledger](live-gemini-adk-2026-09-29-evidence.md). No business controls are changed.

## Diagnosis and minimal correction

The first live run did not retain raw failing responses or rejected fields. Their exact historical
shape/path cannot be reconstructed, and no reproduction is presented as that missing evidence.
Resolution and onboarding both raised Pydantic ValidationError within ADK after generation.

Source inspection establishes a provider-schema mismatch: ADK 1.39.1's `SetModelResponseTool`
constructs parameters from `field_info.annotation`, losing Pydantic Field constraints such as
`min_length=1` for uncertainty/alternatives. Its later `model_validate(args)` still enforces them.
Thus a list accepted by the advertised tool declaration can be rejected by the retained strict
contract. This is adapter constraint loss, not evidence that the host schema should be loosened.
The adapter now sends the full wire JSON Schema for that response tool before each request.
All strict host authority fields, enum values, references and confidence checks remain unchanged.

Offline real-ADK reproductions cover resolution and onboarding independently:

| Response shape at field | Expected | Exact path | Rejection rule | Classification |
| --- | --- | --- | --- | --- |
| Empty array | 1–6 strings | `uncertainty` | `too_short` | Advertised-schema constraint loss / output mismatch |
| null | Required array | `alternatives` | `list_type` | Null/type mismatch, not an optional field |
| Non-enum string | One of three canonical actions | `next_action` | `literal_error` | Enum mismatch |

These are synthetic counterexamples, **not recovered historical model responses**. Prompt v2
explicitly describes required non-null fields, list bounds, enum and authority values without
adding automatic retry, coercion or default values to repair invalid responses.

Mapping prose previously conflated the advisor's self-confidence threshold with automated mapping
policy. Prompt v2 explicitly separates those quantities and forbids invented policy thresholds.
Configuration prose interpreted an ambiguous fixture's lack of write tools as a product deficiency.
The fixture now identifies the advisor's intentional read-only boundary and existing governed
product controls. Prompt v2 distinguishes proposals, recommendations, approval and application;
it does not advise expanding tool access or permissions.

## Safe failure accounting

ADK schema failures now propagate `schema_validation`, allowlisted field paths/rules, JSON kinds
(not field values) and partial observed token/call counters. Unknown remains explicit. SDK usage
is captured before ADK saves/validates output; all-response usage is distinguished from partial
or unknown usage. Application records, safe telemetry and eval output carry this metadata alongside
existing capability/model/elapsed time; currency remains unknown unless priced by the test client.
Unknown keys, Pydantic input/context/message/URL and raw response contents are never logged.
Host validation failures receive the same sanitized rule/path handling. Safe fallback still governs.

## Initial local gates (before live rerun)

Local focused tests: 35 passed. Full backend: 325 passed, 10 PostgreSQL-only skips, inherited
Starlette warning. Thirteen offline contract evals pass. Ruff and repository/link/whitespace checks
pass. These do not establish live acceptance. Targeted live rerun is pending at this checkpoint;
no Cloud Run/SQL startup, IAM changes, managed ADK activation or workspace mutation is authorized.

Historical exact-field diagnosis remains unavailable; any newly observed failure will now have
safe field-level evidence. Keep overall AMBER until the targeted cases and semantic review pass.

## Final targeted result: AMBER

Resolution/onboarding structured output and the observed configuration-tool wording defect passed
targeted reruns. **Mapping semantic acceptance remains P2/blocking. P0=0 / P1=0** for this bounded
synthetic no-write scope. This is the primary agent's scoped review, not a new independent reviewer
or production clearance. Historical exact rejected fields remain unrecoverable.

Normal ADC, project `movebooks-ai`, region `asia-southeast1`, explicit `gemini-2.5-flash` on all routes,
60-second deadline, two generation calls maximum per request, no paid tools or automatic retries.
Only the four requested case identities were tested; Planning was not rerun. All attempts retained:

| Attempt | UTC 2026-09-29 | Latency ms | Input/output tokens | Estimated USD | Outcome |
| --- | --- | ---: | --- | ---: | --- |
| v2 Resolution | 11:35:20.612879 | 4126 | 673 / 378 | 0.0011469 | Schema accepted; speculative unique-batch remedy found |
| v2 Onboarding | 11:35:22.413841 | 1800 | 684 / 286 | 0.0009202 | Accepted; human-review wording tightened later |
| v2 Mapping | 11:35:24.219212 | 1805 | Unknown | Unknown | Safe fallback, provider unavailable |
| v2 Mapping diagnostic | 11:36:05.295107 | 3858 | 675 / 0 partial | 0.0002025 partial | No final structured output; safe fallback |
| v3 Resolution | 11:39:24.389379 | 5249 | 730 / 327 | 0.0010365 | Accepted; checkpoint preserved, no unique-identifier remedy |
| v3 Onboarding | 11:39:26.932591 | 2543 | 741 / 302 | 0.0009773 | Accepted; pending invoice-access review, no execution claim |
| v3 Configuration | 11:39:29.510983 | 2578 | 732 / 369 | 0.0011421 | Accepted; governed product controls correctly distinguished |
| v3 Mapping | 11:39:32.182526 | 2671 | 732 / 392 | 0.0011996 | Schema accepted; invented typical policy threshold persisted |
| v4 Mapping | 11:42:40.171577 | 4062 | 836 / 355 | 0.0011383 | Schema valid; host `invalid_output`, safe escalation fallback |

Nine requests, 18 maximum reserved generation attempts, eight observed model calls plus unknown
initial-v2-mapping consumption. All known requests used one model call / zero evidence-tool reads.
Six host-accepted outputs, three fallbacks; accepted schema is not semantic correctness. Known
usage **5,803 input / 2,409 output tokens**, **US$0.0077634 estimated**, plus unknown first v2 mapping
usage. Prior session costs are separate. Rates: US$0.30/M input and US$2.50/M output including
thinking, from [published pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing).
Not billing read-back or a hard cap. Paid calls stopped; latency range 1.800–5.249 seconds.

### Exact shapes, paths and limitations

Successful resolution/onboarding outputs contained all 11 required fields: five strings (observation,
inference, recommendation, rationale, next_action), three arrays (references, uncertainty,
alternatives), confidence number, and two authority booleans. Strict validation passed with only
the supplied `eval:<case>` reference, human approval true and financial authority false. No rejected
field exists in those successful reruns. Do not present offline counterexamples as recovered
historical failures.

The new mapping diagnostic pinpointed `run_advisor:152` at `a11f652`: ValueError for **no final
structured output**, absent root shape (`$`), not an enum/null failure. V3 now preserves
`missing_output`, `$`/`missing`, observed partial usage and a bounded finish-reason enum. Its actual
historical finish reason was not captured; no quota/IAM/transport cause is inferred.

V3 mapping asserted typical automation/approval thresholds absent from evidence. V4 adds a
mapping-specific policy instruction and conservative host rejection. The v4 output has valid JSON
shape and STOP finish reason, but failed a host policy/narrative gate. Raw rejected text and the exact
host rule were not retained by that live revision. Thus it cannot prove semantic success or its
precise rejection cause. The final local diagnostics-only follow-up now records static path/rule/
reason for policy, narrative, reference and capacity rejections. It is tested offline, not live.
No response was rewritten into a purported model pass. Conservative negation false positives remain
possible. Next inspect the precise sanitized rule and synthetic answer in memory before changing
the smallest prompt/validator condition; do not remove the guard or retry until success.

V2 resolution proposed new batches/unique identifiers despite a completed checkpoint. V3 prohibits
this advice and adds a narrow rejection guard plus an exact regression. Its rerun called for
investigation, preserving checkpoint/human escalation. Onboarding v3 called for pending proposal
review, not claimed approval or invoice posting. Configuration v3 acknowledged existing product
controls and human approval before applying a proposal. These are single-case observations, not
representative human usefulness or general financial-quality validation.

### Provenance and regression

Archives contained tracked advisory code/settings and synthetic fixtures only. SHA-256 verified at
both ends; same pinned SDK environment as the first run, `pip check` passed:

| Commit / prompt | Archive SHA-256 |
| --- | --- |
| `a11f652` / v2 | `1d2d8271a9056b5c7b4cce7d2b1ac44b82a71513c40463617e0ce22b1e7dfb97` |
| `f398e92` / v3 | `1734e03bce37e0a3e54791f90b7d3f375384835439b40e660cb99b35c56f48c2` |
| `1709999` / v4 | `62dbde2a6204c4a4a00325fa44f4106f6b2a04c0b43fb31c75bfcc0e50b42660` |

Context SHA-256 remained identical before/after each call:

| Case | SHA-256 |
| --- | --- |
| Resolution | `0a6729ca163816848184c801c5c1e07f36d22aac9ce7f413eba63c262590a582` |
| Onboarding | `a47fc02309995f530fe965146c6d54c2dd6d14fa51b5360474fd9e34ac19ed1b` |
| Mapping | `46bcda12453687094ae3639a80a3f0852cd2ca1db3cde22c0cdfbf8d1567b1a0` |
| Configuration | `08871def7065fd9f09162519df3525728c4c3198a452fe6cd3ab2708ea1b9fbd` |

Final focused suite: 38 passed; full backend including the final diagnostics follow-up:
328 passed / 10 PostgreSQL-only skips;
13 offline contract evals, Ruff, repository/link/secret-pattern checks (90 Markdown / 348 text,
zero findings), whitespace pass. Inherited Starlette warning remains. The final diagnostics-only
follow-up also passed focused tests; no frontend or financial/orchestration code changed.
No Cloud Run/SQL start, IAM changes, managed ADK activation, business API calls, approvals, invoices,
deployment or merge. All evaluation processes exited. Synthetic context equality is not a new
durable cloud-workspace or financial E2E test. Uploaded sources/dependencies are retained in Cloud
Shell; existing storage/images/logs are unchanged and may retain normal storage charges.

Fresh post-run read-back confirmed both API/web services private (empty allUsers/allAuthenticatedUsers
bindings), manual instance count zero, no minimum annotation; SQL STOPPED/NEVER. Validation shell
`jobs -pr` was empty. No unrelated Cloud Run job executions or project-wide IAM audit is claimed.

Changed implementation files: `agents/reasoning/adk.py`, `agents/reasoning/provider.py`,
`agents/reasoning/prompts.py`, `domain/reasoning/models.py`, `scripts/live_reasoning_eval.py`,
`services/api/src/movebooks_api/reasoning.py`, `tests/test_live_reasoning.py`; documentation changes
are this record plus the existing architecture and review summaries.
