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

## Local gates and live acceptance

Local focused tests: 35 passed. Full backend: 325 passed, 10 PostgreSQL-only skips, inherited
Starlette warning. Thirteen offline contract evals pass. Ruff and repository/link/whitespace checks
pass. These do not establish live acceptance. Targeted live rerun is pending at this checkpoint;
no Cloud Run/SQL startup, IAM changes, managed ADK activation or workspace mutation is authorized.

Historical exact-field diagnosis remains unavailable; any newly observed failure will now have
safe field-level evidence. Keep overall AMBER until the targeted cases and semantic review pass.
