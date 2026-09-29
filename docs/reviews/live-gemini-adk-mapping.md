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

Ruff and repository/link/whitespace checks pass: 91 Markdown / 351 text files at the code
checkpoint, zero findings. These local gates completed before the paid acceptance rerun.

Diagnostic transfer archive SHA-256:
`a2701f3d000a78e49c7875990c717df2df7b695bbd772b740d702be96f94a4f3`.
Rates rechecked at [Google pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing):
USD 0.30/M text input and 2.50/M output including reasoning. Estimates are not billing read-back.

## Targeted live acceptance: GREEN

One post-fix Mapping call only, source `a0831806f749408fbef4849e2e1e99a43ae4274b`, unchanged
prompt v4, model/region/context as above. No other capability was rerun.

| Attempt | UTC 2026-09-29 | Latency ms | Input/output tokens | Estimated USD | Result |
| --- | --- | ---: | --- | ---: | --- |
| Diagnostic, before fix | 11:54:35.606842 | 3907 | 836 / 355 | 0.0011383 | False-positive rejection; safe fallback |
| Acceptance, after fix | 11:59:20.015726 | 4434 | 836 / 355 | 0.0011383 | Accepted original advice, ESCALATE, no fallback |

Both calls reported complete usage, one generation / zero evidence-tool calls and STOP finish.
Session total: two requests, two observed model calls (four maximum reserved attempts),
1672 input / 710 output tokens, **USD 0.0022766 estimated**. Previous ledgers remain separate,
including their unknown usage; this is not a claim that all historical spend is fully observed.

The accepted output is identical to the retained synthetic fixture, not regenerated host prose.
All 11 strict schema fields validate; `validation_issues=[]`, `error=null`, `fallback=false`.
Evidence membership and semantic inspection pass: ambiguity is grounded in the supplied observation,
and escalation in the explicit flag. Self-confidence 0.9 does not authorize mapping; human review
remains required, financial authority false. No acceptance threshold is asserted. Input hash and
post-call context are unchanged. No workspace was read or written, approval repeated, or invoice posted.

Fixed transfer archive SHA-256 (verified locally and in Cloud Shell):
`abd19d39335d6f0da871dfac5ff99429538ae34e1c3815e75c8ee973444909c0`.

## Scoped release review

- **P0=0 / P1=0** on this reviewed Mapping-only diff; the observed P2 false positive is fixed.
- Product/AI quality: correct advisory escalation, no invented policy, source reference and
  explicit uncertainty retained. This is one synthetic case, not representative accuracy evidence.
- Security/trust: strict authority booleans, evidence membership, unsafe-narrative gate and
  low-confidence escalation retained. Rejected claims still fall back with sanitized diagnostics.
- Architecture: only Mapping narrative screening changes; no business tool, deterministic
  compatibility, financial, lifecycle, auth/IAM, routing, SDK or schema change.
- Release: local gates and bounded live Mapping acceptance pass. This is the primary agent's scoped
  review, not independent human approval, deployed-image certification or remote-CI verification.
- Remaining non-blocking limitation: other safe phrasings can still conservatively fall back.
  The exception is intentionally exact, not a general natural-language policy verifier. Model
  self-confidence is uncalibrated, and response usefulness outside this case is not established.

**GREEN for the exercised Mapping semantic correction and bounded synthetic advisory live gate**,
not production, compliance, provider-connectivity or managed-ADK readiness. Cloud Try Your Data
remains disabled. Recommend publish the branch for remote CI and human review; do not merge or deploy.

## Final read-only cloud boundary check

After the two foreground model processes exited, service descriptions/IAM read-back showed both
`movebooks-beta-api` and `movebooks-beta-web` in manual scaling with instance count 0 and empty
public bindings. `movebooks-beta-pg` remained STOPPED / activationPolicy NEVER. Shell `jobs -pr`
returned no running background processes. No Cloud Run/SQL startup, deployment, endpoint exposure,
IAM modification, managed runtime activation or business-state mutation was performed.
Temporary source archives/extracted synthetic code remain in Cloud Shell; no credentials were
exported, copied or printed. This read-back is not a new project-wide IAM or running-cloud-jobs audit.
