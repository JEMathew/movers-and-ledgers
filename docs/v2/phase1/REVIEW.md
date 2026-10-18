# Phase 1 candidate: review record

Branch `v2/phase1-foundations`, from GitHub `main` `4e31e29` (web and API identical to production release `16e31e9`).
Prepared 19 Oct 2026. Not merged, not pushed, not deployed. Gemini not activated.

## What changed

| Commit | Change | User-visible |
|---|---|---|
| `06066c5` | Phase 1 scope, contract reconciliation, bulk-approval requirements, AI status rule (docs only) | No |
| `ef0949f` | V2 tokens scoped to `.mb-v2`, self-hosted Schibsted Grotesk, primitives, one five-stage model shared with the V1 rail | No |
| `f6bcf1f` | V2 component sheet on internal `/design-system` (noindex) | Internal page only |
| `00ddf02` | Unique page title on every route | Tab titles |
| `de20931` | Harbor Light default on Understand; Northstar labelled practice | Assess sample picker |
| `afcc45d` | Needs review / Blocked / Rejected as distinct states with recovery text; misleading "keep it out of the plan" copy fixed | Mapping cards |
| `90da17a` | AI copy matches the Beta; Planned badge on reasoning and independent-review panels | Landing, Trust, demo, guide, panels |
| `83f36f0`, `c6ae1c6` | Fixes found by browser-to-design comparison | Component sheet |

Scope guard: no file outside `apps/web` and `docs/v2` changed; no change to middleware, identity, the API proxy,
`next.config`, routes, the API, domain rules, tools or saved-session formats. No button is enabled or disabled
differently; no decision path changed.

## Results (19 Oct 2026, local, demo identity, in-memory API)

| Check | Baseline `main` | Candidate |
|---|---|---|
| Web unit and component tests (vitest) | 697 passed | 744 passed (47 new) |
| Typecheck, lint | pass | pass |
| API tests (pytest, with cloud and agents extras) | 663 passed, 86 skipped | 663 passed, 86 skipped (API unchanged) |
| Production build (`next build`) | pass | pass |
| Full Harbor Light journey through the UI (36 steps: assess, plan, 12 mapping confirmations, plan approval, migrate, approve batch fix, retry, verify, 5 settings, onboarding essentials, invoice, post and verify) | complete | complete |
| API after the journey | `VERIFIED_FIRST_PRODUCTIVE_USE`, 17/17 checks, invoice total 107.25 | same |
| Routes screenshotted (14 routes × 1440 and 390 px) | 28 | 28 |
| Distinct page titles (desktop) | 4 | 13 (the two /assess variants share one route) |
| Horizontal scroll at 390 px | 0 | 0 |
| axe (WCAG 2.2 AA rules), routes | 2 serious contrast nodes on /play | same 2 on /play (pre-existing, untouched) |
| axe on the V2 component sheet, light, dark, 390 px | n/a | 0 |
| Browser page errors | 0 | 0 |

Visual regression, baseline vs candidate (pixel diff, threshold 24/255): 19 of 34 screenshots identical. Changed by
design: landing chip, Trust, Understand (default sample and Northstar text), mapping card, blocked card,
`/design-system`. Changed by data only: `/workspace` and the final invoice screen (their migration lists, IDs and
times come from a shared in-memory API).

Before/after crops: `docs/v2/phase1/evidence/` (landing chip, Trust copy, default sample,
mapping card with state and Planned badge, blocked vendor-002, design-system page, design vs build).

## Known limitations

1. Preview is local only. No hosted preview exists; Firebase sign-in, Cloud SQL persistence and the Hosting CDN were
   not exercised. A tagged Cloud Run preview needs its own approval.
2. Short-lived HTML caching and the browser-level two-identity isolation test are deferred (see README).
3. `/play` has two serious colour-contrast nodes on `main`; Phase 1 does not touch `/play`.
4. V2 screens (My migration, Map and approve, Start) are not built; Phase 1 ships their foundation and the V1 fixes.
5. Contract gaps for Phase 2: the FPU invoice and journal carry customer, product and account ids, not names; the
   "difference between old and new books" in the design must be shown as the trial-balance check's `difference`.
6. The unmerged attribution branch (`7cd40e7`, "Featuring Gemini AI") conflicts with the AI status rule and should be
   revised or closed before any merge.
7. Python 3.13 was used locally; CI uses 3.12.

## Approval needed next

Phase 1 release acceptance: approve this candidate for a pull request to `main` (reviewed, CI green), and separately
decide whether to approve a tagged, no-traffic Cloud Run preview revision for hosted verification. Production
promotion, Gemini activation and Phase 2 each remain separate gates.
