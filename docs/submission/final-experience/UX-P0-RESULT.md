# UX P0 result — branch `ux/final-experience` (from `aacd3a5`); not deployed, not pushed

## Phase 1 — acceptance baseline: **NOT TESTED**
No Google credentials, candidate URLs or deployed-session access exist in this session. Nothing about sign-in, session creation, Assess, Prepare, approvals, Move, recovery, Verify, First Productive Use, Evidence or AI activity was executed against the candidate. Use `ACCOUNTANT-ACCEPTANCE.md` (A1–A12) unchanged; UI strings it quotes now read "Start a sample migration" (landing) and "AI activity" / "Check AI activity" (panel).

## Implemented (frontend copy/layout only)
| # | Item | Status |
|---|---|---|
| 1 | Landing dominant CTA "Start a sample migration" → `/workspace` (resumes existing session, else start) | done |
| 2 | Explore Demo is a text link "Explore Demo, no sign-in required" | done |
| 3 | Play panel removed; Play stays in nav + "Try MoveBooks Play" in How it works; Vision moved into collapsed "Watch the product vision" | done |
| 4 | My Migration: one task CTA, attention, progress, one **Details** disclosure, one shortcut row (Evidence & Results · AI activity · Help); Play/progress duplicates removed | done |
| 5 | AI activity: renamed, plain copy, dollars not micro-USD, `#ai-activity` anchor (scroll + focus), shortcut from My Migration | done |
| 6 | Sentence-case standardisation | **NOT done** — see deviation. Only "Try the Beta" → "Start a sample migration" renamed site-wide |
| 7 | New-user path: signed-out workspace copy explains new vs returning; no session is created or reset; Assess start remains explicit | done (copy only) |

Deviation (6): the product enforces Title Case for menus, journey steps and every next action in `test/ui-copy.test.tsx`; stage buttons and next-action links share labels across tests. A partial sentence-case pass made the system inconsistent (33 failures) and was reverted. Needs one deliberate product-wide convention decision (P2).
Other not-done: sign-in `next` handoff straight to Assess (P1), Assess export-option hiding (P1), nav consolidation (P1).

## Protected behaviour — unchanged
No backend, API route, auth, proxy, financial calculation, approval gate, validation, evidence projection or audit code touched. Diff is 15 `apps/web` files (`app/page.tsx`, `MyMigration.tsx`, `WorkspaceEntry.tsx`, `member-home.ts`, `OperationalActivity.tsx`, `Trust.tsx`, `Guide.tsx` + tests).

## Validation (device scratch copy of the branch)
- Frontend suite: **676/676** passed (baseline 674; +2 new). `tsc --noEmit` clean; `eslint` clean.
- New assertions: AI activity shortcut/evidence link/no Play duplicate/single Details; panel heading, `$0.10` copy, no "micro-USD"/"Advisory Operations", anchor scroll+focus.
- Browser (Chromium, dev server, landing only), before → after: document height 1880→959 px desktop, 1816→1042 mobile; above-fold interactive items 5→3 (desktop); exactly one primary button; one h1; no horizontal scroll at 1280, 375 and 200%-zoom (640×400); reduced-motion renders identically (no motion added); Tab order unchanged (nav first). Screenshots: `evidence/landing-{before,after}-{desktop,mobile}-fold.png`, `evidence/landing-metrics.json`.
- **Not browser-tested:** My Migration, Evidence/AI activity panel, keyboard flow inside them, failure/empty states beyond unit tests (need authenticated session). The Next dev badge visible in screenshots is not product UI.

## Final UX acceptance checklist (run on the rebuilt candidate)
- [ ] `/` shows one primary action; Demo text link works signed-out; no Play panel; vision opens and plays on request
- [ ] Returning signed-in user: nav "My Migration" resumes the existing session untouched
- [ ] New user: Start → sign-in → My Migration "Start a sample migration" → Assess; no session until explicit start
- [ ] My Migration: one CTA, Details opens steps/link/history, shortcut row has Evidence & Results, AI activity, Help
- [ ] AI activity link lands on the panel (scrolled, heading focused); Check AI activity returns AVAILABLE/DISABLED/UNAVAILABLE copy as in `ACCOUNTANT-ACCEPTANCE.md`
- [ ] Keyboard: all new controls reachable, visible focus; 200% zoom and 375 px no horizontal scroll; reduced motion OK
- [ ] Approvals, reconciliation, evidence, beta disclosures unchanged

## Next release step
Approve R6 in `RELEASE-HANDOFF.md`: archive the branch commit, update `build-and-scan.sh` constants (COMMIT/TREE/tar), rebuild + Grype-scan the web image only, then no-traffic web candidate and rerun A1–A12.
