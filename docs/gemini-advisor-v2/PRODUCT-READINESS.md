# Gemini product completion checklist — October 20, 2026

Scope: Gemini worktree only, starting at `ccc58311256cae50ccb9317ea2d075cfed6458dc`. No new inference, cloud operation, real-ledger operation, UX change or integration worktree.

| Work item | Rubric link | Completion evidence |
| --- | --- | --- |
| Verify source and preserve original artifacts | Technical merit (40%) | Baseline and prior manifest inspected; final checksum receipt required |
| Close Gemini account/result-isolation gap | Technical merit (40%); UX (10%) | Existing identity subscription, request invalidation and mock race tests |
| Validate current API and independent human decisions | Technical merit (40%); UX (10%) | Current generated schema, focused API/proxy/component tests |
| Resolve source-evidence implementation boundary | Innovation (25%); UX (10%) | Proposal remains unimplemented pending permission/durability/workflow decisions |
| Probe five accounting exception categories | Problem alignment (25%); technical merit (40%) | Synthetic contract matrix; not measured model accuracy |
| Assemble honest historical/current evidence narrative | All four categories | Judge-readable evidence pack and dated provenance |
| Check UX immutable checkpoint read-only | UX (10%) | Final Git/report snapshot; do not combine without new authorization |
| Run checks, review diff and commit Gemini scope | Technical merit (40%) | Final focused test/check receipts and Gemini-only commit |

Official rubric reference: https://aibuildercup.com/themes.html, checked October 20, 2026. Weights organize evidence; they are not predicted judging scores.

## Requirement completion matrix

| Requirement | Status | Evidence / practical limit |
| --- | --- | --- |
| Explicit invocation, no page-load model call | VALIDATED locally | Confirmed POST, no-fetch render tests, duplicate-click and pending-credentials tests |
| Advisor explanation / separate Reviewer | VALIDATED locally + one real October 20 case | Separate records, contexts, source facts and visible role sections; same model is not statistically independent |
| Missing evidence and uncertainty | VALIDATED locally + recorded | Nonempty grounding/uncertainty requirements; source-purpose gap is explicit |
| Agreement/disagreement | VALIDATED locally | Live ACCEPT investigation / CHALLENGED mapping; mock QUESTION/REJECT; no live disagreement claim |
| Owner/workspace/mapping isolation | VALIDATED locally | API owner admission, selected mapping link and exact citation prefix; selection clears prior/in-flight results |
| Account-change handling | IMPLEMENTED and VALIDATED locally | Existing Firebase runtime subscription; sign-out/UID switch aborts, clears results and retry ID; post-await runtime checks; no parent remount required for this panel |
| Loading/error/unavailable/empty | VALIDATED locally | Safe messages, no leaked raw errors, failed identity disables action; malformed and inconsistent stale pairs rejected |
| Human decisions / no financial mutation | VALIDATED locally + recorded unchanged live business state | Approve/reject callbacks stay separate; model findings cannot grant authority |
| Disabled Gemini / deterministic enforcement | VALIDATED locally | Explicit Settings configuration fails tests if either provider or Gemini adapter is entered; ordinary release flags remain off |
| Duplicates/replays/stale results | VALIDATED locally | Stable same-account request ID on uncertain errors; pending duplicate refusal; stale context and role link tests; account transitions get a new ID |
| Durable Request Source Evidence | NOT IMPLEMENTED | Approval-ready proposal; permissions, durable audit/retention, mapping hold and stale replacement choices unresolved |
| Exception categories / quality metrics | CONTRACT PROBES COMPLETE; financial accuracy UNVERIFIED | Five categories, nine new test cases; metric denominators defined, no fabricated percentages |
| October 20 real evidence | PRESERVED | Raw bundle/role responses/archives remain unchanged and untracked; no ledger access or inference |
| Rubric evidence and historical distinction | COMPLETE as local documentation | Four weighted categories, explicit A/B/C/D evidence classes and technical demo narrative |
| Refreshed UX integration | WAITING FOR UX CHECKPOINT | No combined tree or hosted/browser acceptance produced |
| Production / live beta | NO-GO | Separate authorization and unresolved operational, financial-quality and hosted gates |

## Final focused checks

**116 backend tests passed; 75 frontend tests passed.** TypeScript (`--noEmit --incremental false`), affected-file ESLint, Ruff and whitespace checks passed. Python tests denied socket connect/DNS; scripted providers, recorded fixtures and temporary test ledgers were used. One existing Starlette/httpx deprecation warning remains.

Backend selection: `test_post_inference_integration.py`, `test_assisted_analysis.py`, `test_live_reasoning.py`, `test_gemini_evaluation_guards.py`, `test_gemini_exception_matrix.py`. Frontend selection: `AssistedAnalysis.test.tsx` and `private-api-proxy.test.ts`. The earlier 44-test Cloud Shell runtime suite was not rerun. No dependencies were installed.

Local logs, excluded from the commit:

- `evidence/product-completion-backend-tests.txt`
- `evidence/product-completion-frontend-tests.txt`
- `evidence/product-completion-checks.json`
- `evidence/product-completion-commit.json`

The first new-test Ruff run found a long line; it was fixed and the final check passed. A citation fixture formerly used `mapping:1`; it now uses the actual selected synthetic mapping UUID, matching the newly enforced contract.

## Exact completed-change file selection

1. `apps/web/components/plan-map-approve/AssistedAnalysis.tsx` — authentication lifecycle and safe request invalidation; existing layout retained.
2. `apps/web/components/plan-map-approve/AssistedAnalysis.test.tsx` — account races, auth failures, duplicate requests, HTTP failures, citation/stale-pair rejection and absent working evidence-request control.
3. `apps/web/components/plan-map-approve/analysis-contract.ts` — selected-mapping citations and consistent unavailable states.
4. `tests/test_gemini_exception_matrix.py` — synthetic exception, authority, admission, disagreement and semantic-limitation probes.
5. `docs/gemini-advisor-v2/HANDOFF.md` — current invocation/identity/citation contract and waiting status.
6. `docs/gemini-advisor-v2/INTEGRATION-VALIDATION.md` — distinguishes historical ccc5831 validation from current completion.
7. `docs/gemini-advisor-v2/REQUEST-SOURCE-EVIDENCE-PROPOSAL.md` — explicit unresolved decisions and nonimplementation boundary.
8. `docs/gemini-advisor-v2/FINANCIAL-QUALITY-MATRIX.md` — five exception categories, metrics and measurement limits.
9. `docs/gemini-advisor-v2/AI-BUILDER-EVIDENCE.md` — rubric-aligned technical pack, provenance and narrative.
10. `docs/gemini-advisor-v2/PRODUCT-READINESS.md` — this checklist, matrix, validation and remaining gates.

No backend production behavior, schema, model prompt, guard, original fixture, cloud configuration, landing/navigation layout or UX worktree file is changed. Generated logs and original inference artifacts remain outside the commit.

## Integration contract delta

`AssistedAnalysis({mappingId})` remains the same component API. The existing `session` URL parameter is its workspace boundary. Cloud identity subscribes through `prepareGoogleIdentity()`; it does not introduce a new identity service, client owner assertion or model request on mount. Existing backend authentication remains authoritative.

Results and retry identity are scoped to the observed account lifecycle as well as workspace/mapping. Identity initialization failure and sign-out disable invocation. UID changes abort old requests and clear both panels. A late old response/error/finalizer cannot overwrite or end the new account's request. Same-UID token refresh preserves the result and makes no analysis request. The refreshed shell must still clear its other private state and rerender on workspace navigation.

Every supplied/cited fact in this one-case frontend contract must refer to `mapping:<selected UUID>`. Reviewer request linkage is checked against the returned Advisor; both records must agree on unavailable status. Generated backend schemas are unchanged and still checked against current models. Request Source Evidence is text/proposal only; no functional button, route or lifecycle is introduced.

## UX status and integration plan

Read-only source inspection found branch `feature/v2-landing-final` still at `e7f1e288fd7f378045950fc94d5d7c89e298575f`, with the tested mobile CSS fix uncommitted. The latest `docs/ux/v2-release-closeout.md` calls its seven-file selection **READY FOR REVIEW**, not accepted or committed. No source-thread staging/commit authorization was inferred.

**WAITING FOR UX CHECKPOINT.** Do not create or combine worktrees now. Once an immutable UX checkpoint is accepted, record both SHAs, compare changes since their common ancestor and inspect overlapping Gemini component/contracts before resolving them in a separately authorized integration worktree. The known UX base is already an ancestor of ccc5831; pending UX deltas must not be silently omitted. Re-run these suites plus the complete responsive/accessibility/auth-switch journey against the combined source. Mock integration is not live inference evidence.

## Remaining blockers and effort

| Priority / gate | Remaining work | Scope |
| --- | --- | --- |
| P0 for local combination | Accepted immutable UX checkpoint and separate integration authorization | Owner/UX dependency; independent Gemini deliverables complete |
| P0 for live activation | Fresh authorization; reviewed application call/cost controls, kill switch and durable distributed admission; never reuse consumed ledger | Not authorized here |
| P0 for a financial-quality beta claim | Accountant adjudication and a labeled broader case set; semantic assertions are not comprehensively verified by citation/regex checks | One synthetic live case is insufficient |
| P0 for hosted release | Final-artifact identity/isolation/session acceptance and UX security/media/legal owner gates | Outside this local Gemini scope; no hosted acceptance claimed |
| P1 product capability | Decide and implement durable evidence requests, if included in beta scope | Can be omitted only with truthful UI and explicitly limited scope |
| P1 reliability/accounting | Missing thinking/billed-cost reconciliation, token-count discrepancy, sustained latency/load/fault recovery and observability | No inference or cloud investigation performed |
| P1 usability | Complete combined desktop/mobile, keyboard/accessibility and stale-account journey | Requires accepted combined source |

Conditional planning estimate: **4–8 engineering hours** for local deterministic integration and journey evidence after the UX checkpoint. A scoped controlled beta may require **2–5 additional engineering days** for accepted fixes and acceptance preparation, excluding human/legal/accountant/security decisions, account access, fresh inference approvals and any new evidence-request feature. No calendar launch date is defensible while those dependencies remain open.

**Decision: standalone deterministic Gemini work is reviewable; local combination WAITING FOR UX CHECKPOINT; live/production NO-GO.** Zero new Gemini/countTokens calls, real-ledger operations, cloud changes, pushes, merges or deployments.
