# Track B local safety completion — October 20, 2026

Starting source: `ea0e3f061300b7faeae1ab5e5c76495b2b62521e`, following approved Gemini integration commit `ccc58311256cae50ccb9317ea2d075cfed6458dc`.

The existing optional guidance and independent rule-check panels now discard account-scoped results and in-flight requests on sign-out or UID change, recheck identity after awaits, reject duplicate in-flight invocation, bound client waits and retain a request ID on uncertain retries. Same-UID token refresh preserves results. Workspace/mapping changes reset the lifecycle. This extends the paired panel's existing isolation behavior without changing the production model adapter or financial policy. Model/network error strings are not rendered.

The opt-in clearing-account panel now labels itself “Synthetic preview · explicit invocation”; other mappings retain their planned/unavailable label and disabled model buttons. The independent deterministic rule check remains separate. No public-header or Track A branding change is included.

The existing offline Judge now returns failed rule results instead of crashing on non-object JSON, malformed evidence references, missing/malformed trace fields or unknown roles. Booleans do not count as integer usage/write counts. Its score measures expected contract acceptance/rejection detection; it does not measure financial correctness.

The new HTTP journey regression performs deterministic paired analysis, verifies zero calls and unchanged mappings/decisions, then makes a separate explicit synthetic owner approval or rejection. Replaying either final decision returns 409 without another audit entry. This demonstrates the current Gemini branch, not the older Track A replay-risk disposition or hosted behavior.

## Validation and provenance

Focused Python tests deny socket connection/DNS access; model tests use existing doubles/fixtures only. Frontend tests cover actual role panels, API proxy, request lifecycle, parent mapping flow and mapping states. Fresh results and immutable-original hash checks are in `evidence/track-b/`; the release/readiness report records final counts and candidate identity. Original live outputs, runtime archive and exhausted authorization ledger are unchanged. No generation/countTokens call, cloud configuration change, UX worktree write, publication or deployment is part of this change.

## Preserved boundaries and owner sequencing

All original requirements remain in scope. The owner selected **combined integration validation first, then Request Source Evidence contract review** on October 20. That durable workflow remains OPEN and unimplemented; no functional button is added. Its proposed permission, retention, hold and stale-context choices remain in `REQUEST-SOURCE-EVIDENCE-PROPOSAL.md`.

Track A has committed `3e55d8871175ae9dd31e14c14143352da40b0625`, but its authoritative `docs/ux/v2-owner-scope-acceptance.md` still blocks final acceptance and its working tree contains later changes. Do not combine the branches until an accepted immutable checkpoint exists. Preserve both source worktrees. All overlapping components and provider copy require explicit reconciliation in the isolated combined tree; never resolve by taking one side wholesale.

Production remains NO-GO. The historical one-case live result is not a production-quality benchmark. Application token admission/accounting must not be confused with the separate exhausted one-run harness authorization. Hosted identity/isolation, final artifact scans and runtime tests, combined responsive/accessibility acceptance, complete thinking-token/billing accounting, and the approved unfinished evidence workflow remain release gates.
