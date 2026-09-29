# Mapping semantic guard correction — 2026-09-29

Branch: `feature/live-gemini-adk`. Scope: only the remaining Mapping semantic rejection.
Prior attempts remain in the [targeted ledger](live-gemini-adk-targeted-remediation.md).

## Exact reproduction and root cause

Authenticated synthetic diagnostic at source `944c04c`, prompt `bounded-reasoning-v4`,
project `movebooks-ai`, region `asia-southeast1`, explicit `gemini-2.5-flash`:

- UTC: 2026-09-29T11:54:35.606842+00:00; latency 3907 ms.
- One model call, zero evidence-tool calls, 836 input / 355 output tokens (including thinking),
  complete reported usage, finish reason STOP. Estimated USD 0.0011383.
- Strict Advice schema valid; host `invalid_output`, rule `unsupported_mapping_policy`,
  path `$`, reason `Unsupported mapping policy claim`; visible safe fallback ESCALATE.
- Exact synthetic model output is retained in
  [the regression fixture](../../evals/mapping-semantic-reproduction.json), not general raw logging.
- Actual rejected field is `uncertainty[1]`: “The policy for acceptable confidence thresholds
  for automated processing is not provided.” The expression
  `threshold.{0,60}(?:automated.processing|automatic.processing)` matched
  `thresholds for automated processing`, ignoring “is not provided.”
- Evidence: `eval:mapping-low-confidence`; supplied observation says account candidate is uncertain
  with deterministic confidence 0.4. Input `requires_escalation=true`. Model self-confidence 0.9
  is separate; both original and host action are ESCALATE, human approval true, financial authority
  false. Inference cites the explicit flag, rationale acknowledges missing acceptance criteria.
- Context SHA-256 `46bcda12453687094ae3639a80a3f0852cd2ca1db3cde22c0cdfbf8d1567b1a0`;
  context unchanged after the call. No workspace or business-state access occurred.

Classification **E: conservative false positive in semantic guard**. The new exact output disclaims
policy knowledge; it neither invents a threshold nor conflicts with deterministic policy. It is not
a schema/parser failure. This reproduces the same rejection class, not a claim that the uncaptured
11:42:40 historical answer has been recovered.

## Precise correction and retained boundaries

Only the complete observed uncertainty sentence (case/whitespace normalized) is excluded from a
scan-only copy for `unsupported_mapping_policy`. It is not removed from the returned advice.
No general negation exemption, substring deletion or model-answer rewriting is used. An appended
claim, changed affirmative wording, another field/item or invented threshold still fails. The
existing regex and cross-field check remain; canonical field-level rejection paths are now reported
when locatable. Other narrative/authority checks still inspect the entire unmodified response.

No prompt/schema change, no prompt version bump, no evidence/confidence/escalation relaxation.
Existing persisted records/cached fallbacks are not rewritten or silently retried. Deterministic
compatibility, lifecycle, financial controls and human approvals are untouched.

## Local validation before paid rerun

50 focused tests pass (12 new Mapping tests plus 38 existing live-reasoning tests).
Full backend: 340 passed, 10 PostgreSQL-only skips; inherited Starlette warning.
Thirteen offline contract evals pass; these use canned outputs, not live quality evidence.
Regression cases cover exact output preservation, invented threshold assertions, mixed negation
and unsupported claims, independent evidence membership rejection, low-confidence/explicit-flag
escalation, unchanged context, safe fallback/diagnostics and unchanged human/financial authority.

Live rerun and final gates pending at this checkpoint: remain AMBER until verified.

Diagnostic transfer archive SHA-256:
`a2701f3d000a78e49c7875990c717df2df7b695bbd772b740d702be96f94a4f3`.
Rates rechecked at [Google pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing):
USD 0.30/M text input and 2.50/M output including reasoning. Estimates are not billing read-back.
