# Gemini Advisor/Reviewer post-inference integration contract — 20 October 2026

**GO for controlled local integration with the refreshed UX using flags off, mocks or deterministic fallback. NO-GO for live activation, a complete request-evidence workflow, or production readiness.** The separate UX branch/worktree was neither inspected nor modified in this review; compatibility here means a tested contract for its integrator, not a completed cross-branch merge or hosted acceptance test.

The one approved Cloud Shell evaluation completed at 11:48:40–11:48:49 UTC with four generation attempts. Its persistent authorization is consumed. No new generation, authentication, cloud inspection, installation or ledger operation occurred in this review. Do not reset, delete, move or bypass the ledger. Historical approval and readiness reports are superseded by this status; they are not authorization to repeat the evaluation.

## Recorded evidence and accounting

Immutable source: [live evidence bundle](evidence/gemini-v2-live-evidence-20261020T114840Z.json), SHA-256 `b87d0537e5b74203236b66b63379f263a062d4f756cc2b5b5679f69363f313f7`. Its four original file hashes, derived role responses, and ledger snapshot hash are checked locally. Raw live evidence and prior staging receipts remain unchanged and untracked; they are intentionally absent from the integration commit. The portable [derived synthetic fixture](../../tests/fixtures/gemini-recorded-pair.json) retains the source SHA and exact response/usage projection, with no authentication or authorization-ledger data. See [reconciliation](evidence/post-inference-reconciliation.json).

| Role/call | countTokens input | Reported input | Reported candidate output | Thinking | Latency ms |
| --- | ---: | ---: | ---: | --- | ---: |
| Advisor 1 | 964 | 1,161 | 10 | missing | 959 |
| Advisor 2 | 1,158 | 1,363 | 319 | missing | 1,539 |
| Reviewer 1 | 901 | 1,107 | 10 | missing | 808 |
| Reviewer 2 | 1,359 | 1,576 | 218 | missing | 1,274 |
| Total | 4,382 | 5,207 | 557 | unknown | 4,580 transport time |

Application totals exactly match the transport's reported input and candidate-output totals. The application previously added missing thinking counts as zero and called usage complete whenever metadata existed for every response. The focused adapter fix now requires explicit nonnegative integer prompt, candidate and thinking counts on every call before labeling usage `complete`. Explicit zero is valid. Missing components leave `partial`; no metadata leaves `unknown`. Known components remain reported totals, not a complete billing meter. API shapes and persistence encoding are unchanged. Historical records are not rewritten or backfilled.

The known-component estimate is `(5207 × $0.30 + 557 × $2.50) / 1,000,000 = $0.0029546`, using the prices recorded at execution. Complete token cost and actual billed cost are **UNVERIFIED**, never zero. The pre-call planning bound was $0.08048 against $0.20; this was not a hard cloud billing cap. The transport correctly retained null complete cost. The revised adapter makes future application completeness agree with that uncertainty; it cannot recover missing historical thinking usage.

Generation reported 825 more input tokens than countTokens (per call: 197, 205, 206, 217). The harness counted the assembled token-bearing wire fields; SDK retries were disabled. Raw request/response bodies were deliberately not retained, only hashes, validated outputs and allowlisted metadata. The precise counting difference cannot be proven from these artifacts. Do not invent a correction factor or treat countTokens as a guaranteed billing meter. All counted and reported inputs were far below 50,000.

The Advisor escalated the ambiguous clearing account. The Reviewer accepted that investigation recommendation while challenging the mapping and requesting source purpose. No recommendation disagreement was observed in the live run; QUESTION/REJECT are exercised only with mocks. Separate run/context IDs and separately supplied source facts demonstrate procedural separation, not statistically independent errors from the same model. Neither output establishes the correct accounting classification. Confidence is uncalibrated; do not show it as verified accuracy. Qualified accounting assessment and broader synthetic coverage remain outstanding.

## Exact API boundary

Backend: `services/api/src/movebooks_api/analysis.py`; reused services `reasoning.py` and `reviewer.py`. Complete request/response JSON Schemas are generated directly from the current Pydantic models in [analysis-api-schema.json](analysis-api-schema.json).

- Explicit action: `POST /v1/migration-sessions/{session_id}/analysis/mapping/{mapping_id}`.
- Body: `{"request_id":"<UUID>","confirmed":true}`. Missing/false confirmation, client owner fields, approval flags and extra fields fail with 422. GET is 405 at the backend; the browser proxy refuses the route for GET.
- Authentication: existing `authHeaders()` and verified principal. Owner comes from authentication, never the body. Unknown/non-owned workspace returns 404; missing authentication 401. The hosted browser uses its configured same-origin `/api` base, whose allowlisted proxy forwards to `/v1`, verifies identity/origin, strips unapproved headers and uses no-store. No credentials belong in response fixtures.
- Admission: synthetic sample only, no uploaded context, source ID `account-clearing`, existing account mapping, pre-execution state, enabled synthetic analysis. Live mode additionally requires explicit operator authorization. Gate/unsupported/stale/concurrent/pending/budget failures return 409. A valid request does not guarantee a live result; fallback can return 200.
- One POST orchestrates Advisor, then Reviewer. Do not also POST the independent-review route automatically: that is a separate explicit action.
- `case_id` is `account-clearing`; top-level `human_approval_required` is true and `financial_authority` false.
- `advisor`: `request_id`, `capability`, `context_hash`, timestamps, provider/model/prompt version, state, advice or null, supplied evidence, deterministic results, failure category and validation details, usage fields. Advice contains observation, inference, recommendation, rationale, uncertainty, alternatives, next action and cited evidence references; authority literals remain true/false.
- `reviewer`: null only when Advisor is unavailable, otherwise a separate record with `mapping_id`, `advisor_request_id`, request ID/context hash/version/timestamps, provider/model/state, finding or null, its own evidence and usage. `advisor_request_id` links the reviewed claim. Shared request IDs may identify the pair; independence is not inferred from those IDs.
- Recommendation assessment: `ACCEPT | QUESTION | REJECT`. Mapping-evidence finding: `CHALLENGED | EVIDENCE_INCOMPLETE | NO_CONTRADICTION_FOUND | ESCALATE`. These are independent axes. ACCEPT never grants mapping approval. Suggested next action: `INSPECT_SOURCE_PURPOSE | REQUEST_MORE_EVIDENCE | HUMAN_REVIEW`.
- Each role cites supplied source references (`mapping:<mapping UUID>`), never another model's claim as evidence. Reviewer source facts are independently projected; the validated Advisor claim is supplied separately.
- Usage: nullable observed totals; `unknown | partial | complete`. `output_tokens` sums reported candidate and reported thinking components, so partial output is only the known sum. Cost remains nullable; completeness of token metadata does not prove billed cost. Historical `complete` records from the old adapter must retain the explicit caveat in this report.

Same-context requests may return an earlier cached pair. Do not require returned request IDs to equal a newly generated client ID; require the Reviewer to link to the returned Advisor and selected mapping. Reuse the client request ID after an uncertain HTTP failure. Pending/interrupted work is not replayed, and there is no automatic browser retry.

## Frontend integration and human controls

Reuse `AssistedAnalysis` and the exported `Analysis`/`parseAnalysis` contract in `apps/web/components/plan-map-approve/analysis-contract.ts`. The parser validates consumed fields, authority literals, nonempty grounded evidence and uncertainties, and role/mapping linkage before either panel renders. Backend metadata may be additive; this is not a second implementation of the entire financial validator. Current component props remain `{ mappingId: string }` and the selected workspace is the validated `session` URL parameter. The refreshed shell must rerender/remount on workspace navigation and clear private UI on identity change. It must not reuse a previously authorized workspace view after sign-out. No localStorage cache of advice is introduced.

| UI state/action | Required behavior | Validation/status |
| --- | --- | --- |
| Feature off | Keep `NEXT_PUBLIC_SYNTHETIC_ANALYSIS_ENABLED` off by default; only the supported case opts in. Preserve planned-product status. | Existing opt-in/case tests pass. |
| Idle/page load | No model POST. Show explicit invocation and what synthetic evidence would be sent. | Mock fetch remains untouched on render. |
| Explicit click | One confirmed POST, stable retry ID, no financial action. | Component and HTTP tests pass. |
| Loading | Disable duplicate invocation; expose busy/status text. No polling or background generation. | Component tests pass. |
| Valid pair | Distinct Advisor recommendation/explanation and Reviewer assessment; source-purpose gaps, uncertainty, evidence and provenance remain visible. Do not show a fabricated accuracy percentage. | Recorded pair rendered in tests. |
| Disagreement | Keep QUESTION/REJECT visible; do not collapse them into agreement or approval. | Mock tests pass; not observed live. |
| Fallback/disabled Gemini | Label deterministic fallback and failure reason, not successful model execution. Never automatically invoke a paid Reviewer after Advisor fallback. | UI/service tests pass. |
| Unavailable/stale | Suppress both panels on unavailable context; safe recovery to rule check/human review. | Service/UI tests pass. |
| Malformed/empty/ungrounded pair | Reject before rendering; show safe unavailable/error state without raw server/model errors. | New parser tests pass. |
| Workspace/mapping change | Abort/discard old in-flight response; clear prior result and request ID when selection rerenders; unmount also aborts. Server ownership remains authoritative. | Mock tests cover pending and completed results. |
| Approve/reject | Keep existing explicit human mapping controls; analysis must never call them. | Combined panel test proves no decision callback fires. |
| Request source evidence | Explain missing source-purpose evidence only. **Do not render a working Request Source Evidence button.** There is no implemented endpoint or durable workflow. Do not display “request sent” or reinterpret reconsideration as an evidence request. | [Proposal only](REQUEST-SOURCE-EVIDENCE-PROPOSAL.md); requires review and approval before implementation. |

Existing human mutation routes are separate `POST .../mappings/{mapping_id}/approve` and `/reject`, with `{ "comment": <string or null> }`, and `/modify` with `{ "selected_target": <string>, "comment": <string or null> }`. The same owner/state/policy checks still apply. Only a successful response to that separately initiated human action permits the UI to refresh decision status. Reviewer ACCEPT and suggestion text never call these routes. Existing reconsideration handles a prior rejection and is not an evidence-request workflow. Do not auto-apply recommended targets or claim migration/financial completion.

The paired proxy timeout remains 130 seconds; browser deadline 135 seconds; role timeout defaults to 30 seconds (maximum 60). Request/record limits, retries, generation configuration, owner controls and financial policies are unchanged. The 50,000-token pre-call check and persistent one-run ledger belong to the **evaluation harness**, not the regular application endpoint. Do not claim that the consumed evaluation authorization covers UI calls. The application retains its byte guard and configured cloud reservation controls; any future live integration requires separate authorization and an explicitly reviewed operational cost-control gate.

## Integration commit scope and validation

The exact commit file list, deterministic configuration, commands and acceptance checklist are in [integration validation](INTEGRATION-VALIDATION.md). The approved application changes correct usage completeness, parse consumed response fields fail-closed, and clear result/request state across workspace and mapping selection. No model, prompt, financial policy, approval route or UX design changes are introduced.

The commit also preserves the existing guarded evaluation harness and guard byte-for-byte, along with its historical read-only preflight dependency and focused tests. The preflight still pins baseline `4b71b28`; it must reject this newer integration revision for historical live authorization. Its test now uses isolated files and mocked Git metadata to verify that frozen gate instead of requiring every subsequent development commit to retain the old HEAD. No cloud authentication is performed.

The backend and frontend tests now use a 9,093-byte derived synthetic fixture rather than depending on the untracked original bundle. The generated API schema is tracked separately and checked for equality against the current application models. Copies of recorded responses are rebound to test mapping references only in memory. The original recorded `usage_status: complete` defect remains visible in the fixture; scripted tests establish the corrected `partial` result for missing thinking counts.

Final focused checks: **107 backend tests passed** (77 application/recorded integration tests plus 30 guard tests), **60 frontend tests passed**, TypeScript, targeted ESLint, Ruff and diff checks passed. The Python process denied socket connections and DNS; recorded integration tests additionally prohibited ADC/client creation. Guard tests replaced Google transports and wrote only temporary mock ledgers. Deterministic integration rejects entry into either provider or the Gemini adapter. Existing subprocess tests use deterministic mode or reject missing live approval before any execution. One existing Starlette/httpx deprecation warning remains.

Local receipts: [backend](evidence/integration-backend-tests.txt), [frontend](evidence/integration-frontend-tests.txt), [checks](evidence/integration-checks.json). These local receipts are intentionally outside the commit; the tracked validation document records results for reviewers without the evidence directory.

The live archive, original JSON, guard and harness remain unchanged. The updated adapter is validated with recorded metadata and mocks only; it is not present in the historical staged archive. No new runtime package was built, and the earlier Cloud Shell 44-test runtime validation was not repeated. Do not represent the archive's prior live validation as live validation of this fix. No cloud, real-ledger, production, push, merge or UX-worktree operation occurred.

## Minimum integration gates and recommendation

- Incorporate the focused adapter/parser fixes and this exact API contract into the controlled integration review; retain both preview flags off for any ordinary release. Do not push, merge or deploy from this task.
- The refreshed UX must preserve explicit click, distinct role panels, missing-evidence/uncertainty display, mapping/request linkage, safe state handling and separate human decisions. Resolve any overlap in `AssistedAnalysis` at integration time; no separate UX branch was read or modified here. Run these focused tests against the combined tree before a merge decision.
- Review and approve the separate [Request Source Evidence proposal](REQUEST-SOURCE-EVIDENCE-PROPOSAL.md) before implementing its routes, durable hold, states or controls. Until implementation passes its proposed acceptance tests, omit the working action. Existing approve/reject remain explicit and independent.
- Before any later live activation: investigate countTokens/reporting differences, approve operational call/cost controls separately from the consumed harness ledger, review qualified accounting feedback, and validate a broader synthetic set under fresh authorization. Preserve unknown costs rather than blocking display of valid advisory content or inventing zero usage.
- No production/customer-data assurance follows from one synthetic case. No hosted integration, refreshed-branch merge, calibrated confidence, actual invoice total, regional-residency guarantee, or production readiness is asserted.

**Decision: GO for local controlled UX integration with mocks/deterministic mode and the documented caveats. NO-GO for complete interactive or live product enablement. Four historical attempts remain consumed; this review used zero additional attempts.**
