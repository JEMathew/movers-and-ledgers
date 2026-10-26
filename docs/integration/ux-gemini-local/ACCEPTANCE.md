# Combined UX + Gemini local acceptance — 21 October 2026 IST

**GO for the approved local deterministic integration. NO-GO for hosted release or live Gemini activation.**

The owner's explicit approval accepts the immutable UX checkpoint for local integration only, excluding its three dirty workflow/smoke paths and unrelated untracked files. No final UX release approval is inferred. Both original source worktrees retain their HEADs, tracked status and working-diff hashes.

| Source | Immutable SHA |
|---|---|
| Track A, `feature/v2-landing-final` | `4178e9784cef827af9d87021401971c109b72f86` |
| Track B, `feature/gemini-advisor-v2` | `db2ef1fe078fbc28a800241d4456e23bc5b06d81` |
| Validated Gemini runtime | `9ce33e52ff99f8d666062e916bdc595e759d87b0` |
| Merge base | `e7f1e288fd7f378045950fc94d5d7c89e298575f` |

Branch: `integration/ux-gemini-v2-local`. Worktree: `/Users/jincenmathew/Downloads/Intuit/movebooks-ux-gemini-integration`. The final local receipt records the resulting merge commit and its two parents.

There were **zero conflicts**: Track A changes 29 paths relative to the merge base, Track B changes 61, and these path sets do not overlap. Every source-delta file matches its approved commit byte-for-byte. The approved visual assets, layout, navigation and application runtime needed no edits. [Integrated files](integrated-files.txt) lists the complete 61-path change from the UX baseline; `preservation-and-scope.json` records both source deltas. The only new integration files committed alongside them are this acceptance report, that inventory and three local verification helpers.

Explicitly excluded: `.github/workflows/ci.yml`, `.github/workflows/ux2-web-candidate.yml`, `docs/v2/release/smoke-v2.sh` **working-copy modifications**. Their committed baseline versions remain. No unrelated untracked source artifact was copied. Historical evidence already committed in Track B remains historical; the original raw inference evidence, judge archive and consumed authorization ledger remain separate and untouched.

## Combined validation

| Check | Actual result |
|---|---|
| Focused backend/application/guard/contract suites | **433 passed**, 15 skipped |
| Additional complete five-phase HTTP integration suite | **20 passed**; **453 passing backend tests total** |
| Focused frontend: roles, identity, proxy, journey, approval, UX/branding | **607 passed**, 37 files |
| Pydantic API schema snapshot, role linkage, default-disabled provider | PASS, included above |
| Offline Judge | **18/18** expected contract decisions; deterministic contract validation, not financial accuracy |
| Scripted Advisor/Reviewer cases | **23/23**; in-memory model doubles, zero real model calls |
| TypeScript, affected ESLint/Ruff, diff checks | PASS |
| Next.js production build | PASS with `NEXT_PUBLIC_SYNTHETIC_ANALYSIS_ENABLED=false` |
| Desktop/mobile browser | PASS within the observed scope below |
| New Gemini generation / countTokens calls | **0 / 0** |

The 15 skips are PostgreSQL variants of migration-listing tests: `MOVEBOOKS_TEST_POSTGRES_URL` is absent. SQLite owner-isolation variants ran. No database was installed or connected. One existing Starlette/httpx deprecation warning remains. The initial helper-only Ruff import ordering error was corrected; final checks pass. An initial API-verification helper assumed a `status` field; it was corrected to the actual `state` schema before verification passed. Neither was an application defect.

Existing dependencies were reused without installation. Python SDK pins remain Google ADK **1.39.1**, Google GenAI **2.28.0**; versions are recorded in `python-dependencies.json`. The new worktree has its own node_modules cache root and development/production build directories; package contents are linked read-only from the existing installation.

Backend tests and the preview API reject socket connections and DNS resolution through a Python audit hook. Tests use mock transports, anonymous SDK credentials, temporary ledgers and recorded fixtures. Subprocess guard tests use deterministic mode or isolated mock claims; they do not operate on the consumed authorization. The preview explicitly constructs settings with `_env_file=None`, in-memory storage, demo identity, `deterministic-only`, synthetic analysis enabled and live-beta authorization false. No cloud credentials are needed.

## Browser evidence and end-user capabilities

Browser tests used the combined dev server at `http://localhost:3331`, with the isolated API at loopback port 8331. The responsive viewports were **1440 × 900** and **390 × 844**, with Dark and Light homepage checks. Viewport overrides were reset afterward. These are local browser observations, not real-device or hosted Firebase acceptance.

| Capability | Evidence and boundary |
|---|---|
| Five-phase migration | Understand → Prepare → Move → Verify → Start remains visible; complete success/recovery/approval paths pass HTTP integration tests. The observed browser exception stays held in Prepare after rejection. |
| Explicit analysis | Page load produced zero reasoning, review or decision records. Keyboard invocation produced one separate Advisor and one Reviewer record. Both are labeled deterministic fallback; no model was called. |
| Missing purpose and uncertainty | Reviewer QUESTIONS the recommendation and CHALLENGES mapping sufficiency; missing business purpose and settlement history are visible. Advisor fallback does not invent an explanation or accuracy percentage. |
| Independent human authority | Every workspace field except the two advisory collections was identical before/after analysis. A separate keyboard-triggered Reject produced exactly one owner-attributed decision and no execution. Approve, replay and forged-decision negatives pass HTTP/component tests. |
| Mapping/workspace isolation | Mapping switch removes both displayed results. A separate new workspace starts with no inherited advice or decision. Subsequent explicit analysis is linked to its own workspace. |
| Account changes and auth | Component/proxy tests cover account switch, sign-out, same-account refresh, pending authorization, old responses and retry IDs. Local missing/invalid demo identity GETs return 401. Real hosted Firebase A/B isolation remains unverified. |
| Loading/error/unavailable | Loading disables actions; an invalid workspace shows an accessible stopped-review alert and no assumed progress. Mock tests cover provider-disabled fallback, malformed/empty evidence, timeout, unavailable roles and retries. |
| Keyboard/accessibility | Analysis and rejection work with Enter; mobile menu opens with keyboard, Escape closes it and restores focus. Inspected pages have one h1, labeled visible buttons, separate named role regions/status and no horizontal overflow. |
| Request Source Evidence | No working button or request-sent claim. The durable workflow remains an unapproved proposal; reconsideration is a separate existing action. |
| Offline Judge | CLI/evidence capability, explicitly deterministic. It is not a newly added UI agent or a semantic accounting-accuracy assessment. |

Representative screenshots: [desktop entry](desktop-home-light.png), [mobile entry](mobile-home-light.png), [combined role results](desktop-final-results-light.png), [mobile role results](mobile-reviewer.png), [human rejection](mobile-human-rejection.png), [safe invalid-workspace error](mobile-invalid-workspace.png). AX trees, DOM checks and `browser-api-verification.json` retain the observations. Full WCAG/axe, screen-reader, real iOS/Android, prolonged session-refresh and hosted account acceptance are **not** claimed.

## Defect inventory and hosted gaps

No new P0 or P1 application regression was reproduced in this scoped integration. No product logic or approved design was changed to obtain passing results.

| Outstanding gate | Owner / disposition |
|---|---|
| API base scanner findings and frontend development High | Security/release. Prior API scan had 14 Medium, 3 Low, 14 Unknown rows across seven CVE families; frontend build-chain High remains open. No waiver. No combined container was built/scanned; previous image scans do not certify this new source candidate. |
| Hosted tenant/data/native runtime | Identity, data and release owners. Verify synthetic A/B eligibility, distinct ownership, approved isolated backend/data boundary, exact images, native limits, session refresh and denial tests. Fifteen PostgreSQL cases remain skipped locally. |
| Deployed approval-replay disposition | Backend/security. Passing local replay tests do not fix or certify the older serving API. |
| Live application input/cost controls | Track B/operator. Application byte limits are not the consumed harness's counted-token budget. Approve and validate operational token/pricing/reservation controls before any separately authorized live activation. |
| Public release requirements | Track A/legal/accessibility/platform. Final UX release acceptance, media/disclosures, brand-use, domain and real-device requirements remain separate. |
| Durable evidence-request workflow | Product/accounting/security. Contract review follows this combined validation, as the owner chose. No persistence implementation or financial hold is silently claimed. |

No cloud query, image publication, IAM/configuration change, push, protected-branch merge, deployment or traffic change was performed. Serving state is only the previously recorded `r16e31e9-1041` baseline; it was not freshly certified here.

## Judging and Intuit product relevance

The candidate now joins the approved UX to the tested advisory contract in one reproducible local source tree. Show the five-phase entry, ambiguous clearing-account case, explicit invocation, distinct role panels, missing evidence and separate rejection. This demonstrates orchestration and human control without presenting mock output as live Gemini.

The unchanged October 20 real evaluation separately demonstrates actual Vertex Gemini escalation and independent review of one case: four consumed attempts, 5,207 reported input and 557 candidate-output tokens, $0.0029546 known-component estimate. Thinking usage is missing, the 825-input-token counting difference remains unexplained, and complete billable cost is unverified. One synthetic case establishes neither broad financial accuracy nor calibrated confidence.

For Intuit migration/onboarding, the concrete value is separating technical mapping compatibility from business-purpose evidence, maintaining tenant and approval boundaries, and guiding users from assessment through verified first use. No customer savings, financial accuracy rate or official judging score is inferred.

## Reproduction and next approval

From this worktree, use the existing Python environment:

```sh
/Users/jincenmathew/Downloads/Intuit/movebooks-ai/.venv/bin/python -B \
  docs/integration/ux-gemini-local/offline-tests.py
```

The same helper accepts a focused test path. `backend-tests.txt`, `five-phase-tests.txt`, `frontend-tests.txt`, `static-checks.json`, `production-build.txt` and the final receipt preserve exact results; `static-checks.json` records type/lint commands. The frontend selection covers the six journey component directories, v2 components, AssistedAnalysis, shared advisory hook, proxy/auth and account/Google identity suites.

For the local preview only, start `local-preview.py`, then from `apps/web`:

```sh
NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_IDENTITY_MODE=demo \
NEXT_PUBLIC_SYNTHETIC_ANALYSIS_ENABLED=true \
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8331 \
node_modules/.bin/next dev -H 127.0.0.1 -p 3331
```

Enter `/workspace` through the local demo link, choose Harbor Light, explicitly check readiness, create the plan, review Misc Clearing, and invoke analysis. No customer files or credentials. The verification helper contains only the two disposable in-memory session IDs from this run; recreating the preview creates new sessions and requires updating those IDs for a new verification.

**Next hosted gate:** first prepare and security-review immutable combined images, synthetic data/identity boundaries and a populated candidate/rollback manifest. Then obtain explicit authorization naming the **integration commit, exact registry digests, isolated services/URLs, verified A/B accounts, deterministic flags, workload/cost limits, smoke scope and cleanup/rollback window** for private publication and a no-production-traffic hosted acceptance run. The old pending manifest remains blocked. No permission to reuse production data, alter IAM, promote traffic or activate Gemini follows from local GO. Any infrastructure/IAM change needs its own scope. No defensible hosted date exists before these decisions.
