# MoveBooks AI V2: release readiness

Branch `v2/full-experience`. The last code commit is `3d4cb07`; this document is committed after it. All work was done locally on 19 Oct 2026. Nothing has been pushed, merged or deployed, and Gemini is not activated. Production (`movebooks-si.web.app`) was checked on 19 Oct and still serves V1. GitHub `main` is still `4e31e29`.

## Recommendation

**The candidate is ready for a private hosted preview. It is not yet ready for production promotion.**

Every check this environment can run passes. The fixes from this sprint are listed under "Findings fixed". What remains unproven is all environment-dependent:

- Real Google sign-in and two-account isolation on a hosted build.
- Container build and image scan.
- CI on a pull request.

Each of these needs an action only you can authorise. The decisions, in order:

1. Authorise the push and draft PR (commands in `PR.md`). CI then runs on GitHub.
2. Approve the private preview in `PREVIEW-PLAN.md`. It uses a new `--no-allow-unauthenticated` web service on the existing service account, with no production traffic, IAM, secret or database change.
3. Run `ACCEPTANCE-CHECKLIST.md` on the preview with the two test accounts.
4. Decide on production promotion. That stays your call, using the runbook steps in `PREVIEW-PLAN.md`.

## Release matrix

| Gate | Status | Evidence |
|---|---|---|
| Source preserved, ancestry and integrity | PASS | `4e31e29`, `0c6c757` and `16e31e9` are ancestors; `git fsck` is clean. Importable bundle in outputs. |
| Changed-file scope | PASS | Changes are confined to `apps/web` and `docs/v2`. API, tools, infra and lockfiles are unchanged since the foundations. Route files are identical to `main`. |
| Secrets scan of the diff | PASS | No keys, tokens, private keys or credentials. Only `*.example` emails, in tests. |
| Frontend unit and component tests | PASS | vitest: 63 files, 814 passed, 0 failed, 0 skipped. |
| Typecheck and lint | PASS | `tsc --noEmit` and `eslint` are clean. |
| Production build (Firebase mode) | PASS | `next build` passes with 27 route entries. Bundle deltas are listed under "Performance baseline". |
| Backend regression | PASS | pytest: 663 passed, 86 skipped. With a local PostgreSQL 16 server: 678 passed, 71 skipped. |
| Firestore emulator tests | BLOCKED | Needs the explicit emulator runner, which is not available here. |
| Primary journey, 1440 and 390 | PASS | 49/49 UI steps at each width. The API reports `VERIFIED_FIRST_PRODUCTIVE_USE`, invoice USD 107.25, 17/17 checks. |
| New, resume and select migration; evidence review | PASS | Picker opens the chosen migration. A new tab resumes the last migration read. Evidence shows exactly one "First invoice approved" row. |
| Financial approvals: invoice consent | PASS (fixed) | One approval decision per invoice; 12 were recorded before the fix. The decision hash matches the contract. |
| Batch approval (9 properties) | PASS | 22 unit and acceptance tests. Live: 6 items, consent unticked, one audited call per item, set comment, owner actor. |
| Rejected-mapping recovery and reconsideration | PASS | Live: plan approval is unavailable while rejected. Reconsideration approves with both decisions kept, then plan review is enabled. |
| Blocked mapping (Northstar `vendor-002`) | PASS | Live: no approve or reject control; batch approval is off while readiness findings are open. |
| Controlled exception recovery (Move) | PASS | Journey: one paused batch, fix approved, batch retried, migration complete. |
| Accessibility: axe WCAG 2.2 AA | PASS | 23 routes × 2 widths (46 checks): 0 violations, including `/play` after the fix. Dark mode: 6 key screens, 0 violations. |
| Keyboard and focus | PASS | 18 routes × 2 widths: every tab stop has a focus indicator, and no focus lands on hidden elements. The vision video ring was fixed and checked visually. |
| Reduced motion | PASS | No animation or transition over 50 ms on any checked route. |
| Screen-reader structure | PASS | 20 routes: one `h1`, no skipped heading levels, one `main`, a header and footer, `lang=en`. |
| Responsive (no horizontal scroll at 390) | PASS | 46 route checks plus every journey screenshot. |
| Route preservation | PASS | Same route files as `main`; all 15 primary routes return 200 in the smoke test. |
| HTML and asset cache consistency | PASS (fixed) | Prerendered HTML is cached for at most 60 s (it was one year). Dynamic pages are `no-store`; hashed assets are immutable. |
| V2 smoke checks on a production build | PASS | `smoke-v2.sh`: 24/24, direct and through the HTTPS tunnel. |
| Google sign-in, sign-out, refresh | BLOCKED | No Firebase access here. Harness and checklist are ready. |
| Cross-account isolation, hosted | BLOCKED | Needs the two test accounts. API isolation tests pass: 25 named tests plus 4 Postgres-backed. Local probes: no token or a bad token gets 401; an unknown reference gets 404. |
| Container build and image scan | BLOCKED | No container registry or Cloud access here. Use `build-and-scan.sh` in Cloud Shell. |
| Hosted preview | BLOCKED | No Google Cloud credentials. Commands, isolation and rollback are in `PREVIEW-PLAN.md`. |
| Draft PR and CI | BLOCKED | GitHub write access is not linked (`add_repo`: link your GitHub account). Commands are in `PR.md`. |
| Gemini activation | NOT APPLICABLE | Out of scope. `AI_ASSISTANCE_STATUS` is still `planned`, guarded by a test. The attribution reads "Built on Google Cloud · Gemini AI planned". |
| Production promotion | NOT APPLICABLE | Not requested; requires your separate approval. |

## Findings fixed in this sprint

| Severity | Finding | Fix | Commit |
|---|---|---|---|
| P1 (release) | Next.js cached prerendered HTML at the CDN for a year (`s-maxage=31536000`). After the V2 deploy, cached V1 HTML could reference CSS and JS that no longer exist. This is the stale-asset failure seen before. | 60 s shared cache on the 14 static pages only. A Hosting release after promotion purges the CDN. Verified on a Firebase-mode build. | `3ec4c8c` |
| P2 (financial audit) | Reopening "Review invoice approval" added a new consent decision, audit record and event every time; the old harness recorded 12. No duplicate invoice or posting was possible: posting needs the original idempotency key, and concurrent writes are rejected. | Once the latest approval covers this exact contract hash, the approve control is replaced by "Invoice terms approved by … · time". An approval of other terms is treated as stale. Re-approving an approved essential is no longer offered (re-deciding also revoked an unposted invoice approval). | `ac77ea9` |
| P2 | Switching panes during a batch could hide the per-item result. | The queue is locked while a request runs, and the outcome is kept. | `cc68305` |
| P2 | Move said "That step was not completed" when only the activity refresh failed after a recorded decision. | The refresh failure is reported separately; the action stays shown as recorded. | `cc68305` |
| P2 | Revisiting Verify for a completed migration offered "Apply reviewed configuration" as the primary next step. Revisiting Move pointed back to Verify. | Both now reflect a migration that has moved on. | `e360514` |
| P2 (a11y) | The vision video's focus ring was clipped by its rounded frame (also on `main`). | The ring is drawn on the frame. | `3d4cb07` |
| P2 (a11y) | Play wall sign contrast 3.48:1 and 2.74:1 (also on `main`). | A dark plaque gives 7.5:1 and 5.9:1. | `38f8390` |
| P3 | Batch: the readiness gate failed open without an assessment; a lost connection was shown as "refused". | Gate fails closed; a lost connection reads "not confirmed". | `cc68305` |
| P3 | Copy: "Difference between old and new books" → "Trial balance difference"; loading-state guides; "Return to my migration". | Copy corrected. | `cc68305`, `e360514` |

The independent review (a separate agent that had not seen the work) found no P0 and no P1. Every finding was verified against the code before fixing.

## Outstanding issues

There are no open P0 or P1 issues in the candidate.

| Severity | Issue | Why open | Proposed handling |
|---|---|---|---|
| P2 (backend, not blocking) | `POST /fpu/decision` is not idempotent. Two tabs, or a direct API call, can still add a duplicate approval for the same contract. The configuration and resolution endpoints already refuse replays. | Backend financial semantics were out of scope. The UI no longer offers a repeat; posting can't duplicate. | Make `decide_fpu` a no-op when the last decision already approves the same contract hash, mirroring `replays_decision` in configuration. Needs your authorisation. |
| P2 (performance) | Self-hosted Schibsted Grotesk adds 74–99 kB of fonts per page. | Typeface choice from the approved design. | Drop the 500 weight or subset further. Measure on the hosted preview first. |
| P3 | The difference is shown as "No difference" rather than "USD 0.00"; the journal shows account ids; there is no evidence-pack export. | API contract gaps. | Backend follow-ups, carried over from the earlier report. |
| P3 | Shared financial display helpers live in `migrate-resolve/stage-kit.tsx`; `plural`/`sentence` are duplicated. | Refactor only; no behaviour change. | Move them to `components/v2/` in a later clean-up PR. |
| P3 | On stage pages the stage bar sits above the stage title; the design has the title first. | Cosmetic. | Optional reorder. |

## Financial safety summary

| Property | Status |
|---|---|
| Approval is explicit | Every consequential action is a separate, labelled control. Invoice, plan, remediation and settings approvals still go through confirmation dialogs. |
| Approved state shown immediately | The invoice shows "approved by … · time" and Post becomes the primary action. |
| Repeat submission prevented | Prevented in the UI for the invoice, essentials and batch. The server already refuses repeats for mappings, plan, resolution and configuration. |
| Refresh and concurrency | Handled honestly: posting reuses the stored idempotency key, the session store rejects concurrent writes (409), and a lost connection in a batch is shown as not confirmed. |
| Actor and timestamp evidence | Kept: decisions show actor and time; the evidence page lists each decision with its result. |
| Batch approval properties 1–9 | All verified: visibility, consent, count, eligibility, no tax or sensitive items, revalidation, per-item audit, stop on first failure, no retries. |

## Performance baseline (local synthetic, not customer production)

Both builds are Firebase-mode production builds of `main` and of V2, served on the same machine with medians of 5 cold loads. The "Throttled" columns use 4× CPU slowdown, 150 ms latency and 1.6 Mbps.

| Route | LCP ms, main → V2 (throttled) | Load ms, main → V2 (throttled) | JS kB | CSS kB | Fonts kB | CLS |
|---|---|---|---|---|---|---|
| `/` | 1656 → 864 | 1626 → 2084 | 177 → 160 | 17 → 23 | 0 → 74 | 0.021 → 0.021 |
| `/workspace` | 644 → 768 | 1452 → 1707 | 193 → 183 | 17 → 23 | 0 → 74 | 0.010 → 0.017 |
| `/plan-map-approve` | 660 → 812 | 1478 → 1871 | 186 → 184 | 17 → 23 | 0 → 99 | 0.071 → 0.067 |
| `/onboard-fpu` | 660 → 784 | 1423 → 1845 | 189 → 185 | 17 → 23 | 0 → 99 | 0.016 → 0.022 |

- **Landing LCP:** about 0.8 s faster, because the hero is now text and a proof card rather than the video poster.
- **Other pages:** LCP is 100–160 ms slower and load is 250–400 ms slower, almost entirely from fonts.
- **JavaScript:** first-load JS changed by between −3 and +5 kB per route.
- **Client route transition:** `/` → `/guide` takes 17–22 ms on both builds.
- **Browser errors:** 0 across every run.

Hosted and real-user numbers are not measured yet.

**Metrics to instrument later (not measured):**
- Landing-to-start conversion.
- First-step completion (readiness check started and finished).
- Abandonment by stage.
- Mapping approval effort: time and clicks per mapping, plus batch versus individual share.
- Exception recovery time (pause to retry complete).
- Time to verified First Productive Use, and the FPU completion rate.
- Help and assisted-migration demand per stage.

## Workstream value

| Workstream | Capability → user problem → value | AI Builder rubric | Intuit migration/onboarding PM relevance | Evidence |
|---|---|---|---|---|
| Financial safety | One recorded consent per invoice; batch outcomes are never hidden or overstated. Duplicate or ambiguous consent erodes trust in the audit trail. The audit now reads as one decision per act. | Guardrails, human-in-the-loop, auditability | Escalation and approval patterns that hold up under retries and concurrency | 814 tests; live consent count 1 |
| Release engineering | Bounded HTML caching plus a private preview path. Stale CSS after deploy breaks the product for every user. The release can be verified privately and is safe to roll forward. | Production readiness | Safe rollout for business-critical software | Headers measured; smoke 24/24 |
| Account isolation | Owner-scoped reads, a harness and a checklist. One business must never see another's books, and the hosted check can be run by a person without sharing credentials. | Security and privacy | Tenant boundaries at scale | 29 isolation tests; local 401/404 probes |
| Journey and recovery | Revisited stages reflect reality; rejected, blocked and paused states each have a way forward. This addresses migration anxiety at exceptions, with comprehension and recovery at every step. | UX, reliability | Exception recovery and time-to-value | 49/49 at two widths; live recovery |
| Accessible onboarding | 0 axe violations on every route, visible focus everywhere, and reduced motion respected. Keyboard and screen-reader users were blocked in places; the journey is now usable without a mouse. | Inclusive design | Accessible onboarding for SMB staff | axe, keyboard and semantics JSON |

No customer improvement is claimed: there has been no user research or live usage.
