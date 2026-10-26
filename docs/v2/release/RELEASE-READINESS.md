# MoveBooks AI V2: Phase 1 release readiness

Branch `v2/full-experience`. This update closes the Phase 1 items listed below on top of the earlier candidate
`d59501b`. Every result here comes from local runs on 19 Oct 2026, unless a row says otherwise.

On 19 Oct, a read-only check showed:
- Production (`movebooks-si.web.app`) still serves V1 ("Move your books with confidence").
- GitHub `main` is still `4e31e29`.

Nothing has been pushed, merged or deployed. Hosted live Gemini inference is **not active**: the Advisor and the
Reviewer stay Planned, and no runtime model evidence exists or is claimed.

## Recommendation

**CONDITIONAL GO for a private hosted preview.** This is **NO-GO for production promotion** until the preview gates pass.

- Every check that can run in this environment passes.
- The conditions all depend on environments this session has no access to:
  - push and CI;
  - a container build and image scan;
  - the private preview itself;
  - real Google sign-in with two accounts.

## What changed in Phase 1 closure

| Commit | Change |
|---|---|
| `2e41d20` | **Attribution.** The landing page and the signed-in workspace show the exact approved line "Built on Google Cloud and powered by Gemini AI". The switch on AI status that substituted "Built on Google Cloud · Gemini AI planned" is removed. `AI_ASSISTANCE_STATUS` stays `planned`, and the Planned badges and feature gates are unchanged. Tests assert the exact text, one instance, a `<p>`, and no logo or link. |
| `3f738d2` | **Invoice approval idempotency (`POST /fpu/decision`).** See "Financial idempotency" below. |
| `363c122` | **PostgreSQL gate** for racing and replayed invoice approvals. |
| `3463c25` | **Batch approval labelling.** A 5xx during batch approval (including the proxy's 503 after an upstream timeout) now reads "not confirmed, check its state in the list" instead of "refused", because that approval may already be committed. Only a 4xx is a refusal. **Also:** `smoke-v2.sh` failed every check on macOS bash 3.2 (an empty array under `set -u`); that is fixed. |

## Release matrix

| Gate | Status | Evidence |
|---|---|---|
| Source preserved | PASS | The V2 branch was imported from the verified bundle into a new worktree. `4e31e29`, `16e31e9` and `3d4cb07` are ancestors, and `git fsck` is clean. No unrelated local work was touched. |
| Frontend tests | PASS | vitest: 63 files, 815 tests, 0 failed. |
| Typecheck and lint | PASS (fixed) | `tsc --noEmit`, `eslint .` and repo-wide `ruff check .` are clean. CI runs `ruff check .`, and the earlier candidate would have failed it on `docs/v2/release/auth-isolation/isolation_check.py` (29 findings). That script is now formatted, and its dry run behaves the same. |
| Other CI steps, run locally | PASS | `repository_checks.py` (0 findings in 169 Markdown and 760 text files), `agent_quality_judge.py`, `live_reasoning_eval.py` (synthetic catalogue), the targeted pytest files (16 and 56 passed) and `git diff --check`. These are local equivalents, not GitHub CI. |
| Backend tests | PASS | pytest: 668 passed, 86 skipped. |
| PostgreSQL-backed tests | PASS | Run against a throwaway local PostgreSQL 18.6 server: 728 passed, 28 skipped. |
| Firestore emulator tests | BLOCKED | No emulator runner here. |
| Production build | PASS | `next build` passes with 25 routes. The static route list matches the middleware cache list. |
| Bundle size vs `d59501b` | PASS | Route sizes are within 0.1 kB. Shared first-load JS is +261 B gzipped (102,768 → 103,029 B). |
| V2 smoke on a production build | PASS | `smoke-v2.sh`: 24/24. Checks: approved attribution present; old copy absent; Play hidden; static HTML `s-maxage=60`; hashed CSS immutable; dynamic HTML `no-store`; all routes 200 or 307. |
| Full journey, 1440 and 390 | PASS | Landing → sign-in → My migration → Understand → Prepare (6 batch, 6 individual, plan approved) → Move (paused batch, fix approved, retry) → Verify → 5 settings → Start (5 essentials) → invoice approved once → posted. API: `VERIFIED_FIRST_PRODUCTIVE_USE`, USD 107.25, one invoice decision. 54 actions and 17 workflow screens at each width, with 0 axe violations and no horizontal scroll. |
| Rejected → reconsideration | PASS | Plan approval is not offered while a mapping is rejected. After reconsideration, the mapping keeps both decisions (REJECTED, then APPROVED). Plan approval stays gated while 6 mappings are still undecided. |
| Blocked mapping (Northstar `vendor-002`) | PASS | No approve or reject control. The recovery copy is shown, and batch approval is disabled while readiness findings are open. |
| Invoice evidence after refresh and replay | PASS | Reload shows the approved state. The evidence page has exactly one "First invoice approved" row. A replay after posting gets 409 and adds no record. |
| Independent safeguard review | PASS (no P0/P1) | A separate agent verified 10 human-approval safeguards in code and tests. See "Human-approval safeguards". |
| Accessibility, axe WCAG 2.2 AA | PASS | 16 routes × 2 widths × light and dark = 64 checks, 0 violations. Dark mode was selected the way a person selects it (stored theme), and was confirmed applied. |
| Keyboard and focus | PASS | 40 tab stops per route: every stop has a visible indicator, and none lands on a hidden element. |
| Screen-reader structure | PASS | One `h1` and one `main` per page, no skipped heading levels, `lang=en`, with a header and footer. Exception: the internal `/design-system` sheet has 3 `h1`s and is not a product route. |
| Reduced motion | PASS | No animation or transition over 50 ms with `prefers-reduced-motion: reduce`. |
| Play hidden | PASS | No `/play` link in the header, navigation or footer on any route. `NEXT_PUBLIC_FEATURE_PLAY_NAV` is unchanged and the source is kept. |
| Browser errors | PASS with P3 | The only error is `/favicon.ico` 404, which also happens on `main` (the app has no favicon). |
| Production dependency audit | PASS | `npm audit --omit=dev`: 0. **Dev tooling:** 5 High in the ESLint chain (`braces`), the same as `main`; they are not in the runtime image. **Python (`pip-audit`):** only the local venv's bootstrap `setuptools` is flagged; it is not a project dependency. |
| Container build and image scan | BLOCKED | Docker and Trivy are not available here. Run `scripts/release/build-and-scan.sh` in Cloud Shell (see `PREVIEW-PLAN.md`). No digest or Critical/High count is claimed. |
| Push, draft PR and CI | BLOCKED | No GitHub credentials here: HTTPS has no stored credential, and the SSH key is not authorised. The commands are in `PR.md`. CI has not run. |
| Hosted preview | BLOCKED | No Google Cloud credentials here. The plan, the auth-layering gate and the rollback are in `PREVIEW-PLAN.md`. |
| Google sign-in, refresh, two-account isolation | BLOCKED | Needs the preview and the two test accounts (`ACCEPTANCE-CHECKLIST.md`). API isolation tests pass, and the harness dry run works. |
| Gemini activation | NOT IN SCOPE | `AI_ASSISTANCE_STATUS` is `planned`, guarded by a test. |

## Financial idempotency (`POST /fpu/decision`)

**Before:** every submit of the same approval appended a new decision, an audit record and an `fpu_decision` event.

**Now** (`agents/orchestrator/onboard_fpu.py`, mirroring `replays_decision` in configuration):

- **An identical repeat is a no-op.** This applies when the latest invoice decision has the same action, the same owner with a valid owner role, the same contract hash and the same note. The repeat succeeds and records nothing. The original actor and timestamp are not rewritten.
- **A different note is refused.** The same action on unchanged terms with a different note returns 409, rather than recording a second decision or silently dropping the note.
- **These checks run in order before the replay check:** owner, configured evidence, unposted (DRAFT) task, unchanged contract. A replay can never pass on stale or posted terms.
- **Unchanged behaviour:**
  - A changed contract has no decisions and needs fresh approval.
  - Reject → approve reconsideration is recorded.
  - A setup change still revokes an unposted approval.
- **Untouched:** posting idempotency (the same key, one receipt), the repository compare-and-swap, tenant and owner checks, and every accounting calculation.

| Acceptance | Evidence |
|---|---|
| First approval recorded | `test_repeated_invoice_approval_records_one_decision`. **Live:** 1 decision and 1 audit record. |
| Repeat creates no decision or audit event | Unit and API tests. **Live:** 3 sequential repeats leave 1 decision and 1 audit record. |
| Concurrent identical requests | In-memory and **PostgreSQL** compare-and-swap tests: exactly one commits. **Live:** 4 concurrent repeats leave 1 decision. |
| Changed contract needs a fresh decision | `test_changed_invoice_contract_requires_a_fresh_decision`. |
| Rejection and reconsideration | `test_rejection_replay_and_reconsideration`. The existing retry, revocation and role tests still pass. |
| Actor, timestamp, hash and evidence preserved | **Live:** identical decision records before and after every replay. |
| Posting idempotency | **Live:** post and re-post with the same key give 1 invoice, verified. |
| Tests guard the fix | The 6 new tests fail on the pre-fix code and pass with it. |

Live output: `evidence/phase1-closure/invoice-idempotency-live.json`.

## Human-approval safeguards (independent review)

| Safeguard | Result |
|---|---|
| Explicit approval for mappings, plan, remediation, configuration and invoice | Verified. Low-risk `AUTO_APPLICABLE` configuration items are consented to by the explicit Apply step. |
| One audited decision per mapping, including in a batch | Verified (N separate calls, N records). |
| Blocked and rejected recovery; reconsideration keeps both decisions | Verified. |
| Batch eligibility excludes tax and sensitive mappings | Verified. The client rule is stricter than the requirements, and tax is always High on the server. |
| Accurate batch counts | Verified: the list, the sentence and the button must all agree before consent. |
| Pre-submit revalidation | Verified, client side (fresh read, then compare state, target and version). |
| Partial failure | Verified: stop at the first failure, with a per-item outcome. The 5xx labelling is fixed in `3463c25`. |
| No silent retries | Verified in every approval fetch path and in the proxy. |
| No hidden financial mutation; no hard-coded sample results in product screens | Verified. "107.25" and "17 of 17" appear only in labelled sample, demo and design-system content. |
| Evidence correct after refresh | Verified: the state is read back from the API. |

## Open items

| Severity | Item | Handling |
|---|---|---|
| Gate | Push, CI, container scan, private preview, Google sign-in and two-account isolation | Owner actions, in the order under "Next approvals". |
| Gate | **Auth layering on the preview.** It is not confirmed whether `gcloud run services proxy` sends its IAM token as `Authorization` (which would replace the Firebase token) or as `X-Serverless-Authorization`. The web-to-API hop already uses `X-Serverless-Authorization`. | `PREVIEW-PLAN.md` step 5a checks this before acceptance, with a fallback to the standalone `cloud-run-proxy`, which uses `X-Serverless-Authorization` by default. |
| P2 | An approved mapping cannot be reversed before plan approval. The requirements doc says reversal works "through the existing reconsideration flow"; in code, reconsideration is only for rejected mappings. Plan approval is still a separate consent step, so nothing moves. | Backend scope. Either extend reconsideration to approved mappings or correct the requirements text. Owner decision. |
| P2 (performance) | Self-hosted Schibsted Grotesk costs 74–99 kB per page. That is 3–4 latin weights at about 25 kB each; the files are already split by `unicode-range`. | **Kept.** Dropping 500, or moving to the variable font, changes how the 450, 500, 650, 680 and 750 weights render, so it is not fidelity-preserving. Measure LCP on the preview before deciding. |
| P3 | The batch comment is stored on the mapping proposal, not in the audit record. Approve has no server-side version precondition. The invoice replay does not normalise whitespace in the note (it fails closed). | Backend follow-ups. |
| P3 | No favicon (`/favicon.ico` 404), also on `main`. | Needs a brand asset decision. |
| P3 | Carried over: "No difference" rather than "USD 0.00"; the journal shows account ids; there is no evidence-pack export; shared helpers live in `migrate-resolve/stage-kit.tsx`; the stage bar sits above the stage title. | Later clean-up. |

## Next approvals (in order)

1. **Push and draft PR.** Run the commands in `PR.md` from your authenticated machine. CI then runs.
2. **Build and scan in Cloud Shell.** Approve `build-and-scan.sh` for the pushed commit. Pass means 0 Critical and 0 High.
3. **Private preview.** Approve `PREVIEW-PLAN.md` steps 3–5: a new `--no-allow-unauthenticated` service, with no production, IAM, secret or database change. Then run step 5a, the auth-layering gate.
4. **Hosted acceptance.** Run `ACCEPTANCE-CHECKLIST.md` with the two test Google accounts.
5. **Production promotion.** This is a separate decision, using the runbook in `PREVIEW-PLAN.md`.

## Product value traceability

| Capability | End-user problem | Outcome | AI Builder rubric | Migration/onboarding PM relevance | Evidence |
|---|---|---|---|---|---|
| One recorded consent per invoice | Duplicate consent records make an audit trail ambiguous | **Direct:** each approval reads as one act. **Indirect:** trust in the evidence page | Guardrails, human in the loop, auditability | Approval patterns that hold under retries, second tabs and concurrency | Unit, API, PostgreSQL and live tests |
| Honest batch outcome on server errors | "Refused" next to a mapping the list shows as decided is contradictory | **Direct:** the person rechecks only what is uncertain | Reliability, honest UX | Exception handling in bulk operations | Component test plus mutation check |
| Approved attribution | The platform line must be consistent everywhere | One quiet, consistent line; the AI status stays truthful | Product polish, Google Cloud alignment | Consistent brand surface across public and signed-in screens | Unit tests, smoke check, screenshots |
| Preview auth-layering gate | A private preview could reject every signed-in call without anyone noticing | The failure is found in minutes, with a documented fallback | Production readiness, security | Safe rollout of business-critical software | `PREVIEW-PLAN.md` step 5a |

No customer research, conversion change, or production performance or runtime result is claimed.
