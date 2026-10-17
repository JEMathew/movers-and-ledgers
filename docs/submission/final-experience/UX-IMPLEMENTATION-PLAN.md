# UX implementation plan (PROPOSED — no application code edited)

Scope rule: copy, ordering, visibility and navigation only. Keep every safety disclosure, approval gate, financial check and evidence record. Source reviewed: `app/page.tsx`, `Nav.tsx`, `public-surfaces/content.ts`, `WorkspaceEntry`, `MyMigration`, `member-home.ts`, `Trust.tsx`, `OperationalActivity.tsx`, stage-experience button labels. **Rendered screens were not viewed**; items marked (verify) need a browser look before commit.

## Top ten improvements (value / risk / time)
| # | Change | Pri | Value | Risk | Time |
|---|---|---|---|---|---|
| 1 | Landing: single dominant CTA "Start a sample migration"; Demo becomes a text link | P0 | High (judge first click) | Low | 30 m |
| 2 | Landing: remove Play promo panel and inline Vision block from main flow; fold into "How it works" disclosure/footer; one scope line replaces badge + boundary + demo-intro | P0 | High | Low | 30 m |
| 3 | Advisory Operations: rename "AI activity", plain-language copy, $ not micro-USD, anchor `#ai-activity`, link from My Migration | P0 | High (Firestore visibility, judge-critical) | Low | 45 m |
| 4 | My Migration: one nav row, collapse "Operational steps" + link/history into one "Details" disclosure; add "AI activity" shortcut | P0 | Med | Low | 45 m |
| 5 | Sign-in handoff: signed-out CTA goes to sign-in with `next=/assess?sample=harbor-light-migrate-demo` (one fewer click) (verify sign-in `next` handling) | P1 | High | Med | 30 m |
| 6 | Sentence-case, verb-first stage CTAs across the 6 stage screens (`COPY-AND-CTA-MATRIX.md`) | P1 | Med | Low (labels asserted in tests) | 60 m |
| 7 | Assess screen: default selection Harbor Light; hide "Use My Test Export" in cloud mode if uploads are disabled (verify) | P1 | Med | Med | 45 m |
| 8 | Nav: public = Demo · Learn · Trust (+Play quiet); member = My Migration · Evidence · Play; drop duplicate explore/footer lists | P1 | Med | Low | 45 m |
| 9 | Shorten repeated "No progress is assumed…" boilerplate to one shared line per screen (keep meaning) | P2 | Low-Med | Med (tests assert strings) | 90 m |
| 10 | Unify 5-phase vs 12-label naming (Understand/Prepare/Move/Verify/Start vs route names) | P2 | Med | Med | 90 m |

P0 total ≈ 2.5 h coding + focused tests ≈ 30 m, then R6–R8 (≈ 1.5–2 h). Recommend P0 only; P1 #5 and #6 if time at Sun 08:00.

## Commit plan (branch `ux/final-experience` in a new worktree from `aacd3a5`; never edit the release worktree)
1. `ux: landing single primary action` (#1,#2) — tests: `public-surfaces/surfaces.test.tsx`, `public-content.test.tsx`, `ProductVision.test.tsx`
2. `ux: AI activity panel copy and anchor` (#3) — `OperationalActivity.test.tsx`
3. `ux: My Migration decluttered` (#4) — `MyMigration.test.tsx`, `journey/cross-page-parity.test.tsx`
4. (P1) `ux: sign-in handoff` (#5), (P1) `ux: CTA copy normalisation` (#6) — the stage `*.test.tsx` files that assert labels
Run only the named files (`npx vitest run <files>`), then `npx tsc --noEmit` and `next lint` for the app. No full suites.

## Acceptance tests per altered interaction
- Landing: exactly one element with the primary button style above the fold; Demo link present and reachable; no Play panel/Vision section on `/`; Play still in nav; scope line present and links to `/trust#beta-limitations`; Tab order hero→CTA→demo link; passes at 375 px without horizontal scroll.
- AI activity: heading "AI activity"; button text; DISABLED / AVAILABLE-empty / AVAILABLE-with-event / UNAVAILABLE / fetch-failure states each render the specified copy; a RESERVED event never says a model call occurred; `aria-live` retained; `#ai-activity` scrolls and focuses the heading.
- My Migration: one task CTA; attention block unchanged; exactly one secondary nav; every previous destination still reachable (parity test); refresh still read-only.
- Sign-in handoff: after Google sign-in the user lands on Assess with Harbor Light preselected; no session is created until the explicit start button.
- CTA copy: each renamed label asserted in its stage test; destinations unchanged.

## Responsive and accessibility requirements
Single `h1` per route; visible focus; targets ≥ 44 px; state not conveyed by colour alone; `prefers-reduced-motion` respected (no new motion); live regions kept for loading/error; mobile (375 px) shows nav behind existing menu button; contrast ≥ 4.5:1 (existing tokens only).

## Compact wireframes
```
LANDING (above fold)               MY MIGRATION                       EVIDENCE (bottom)
[logo] Demo Learn Trust Play  [Acct]  [logo] My Migration Play [Acct]   … Evidence records …
H1 Move your books. Keep…            H1 <next-task heading>             ── AI activity ──
one-sentence value                   task text   [ ONE primary CTA ]    what ran / fell back
[ Start a sample migration ]         Needs attention (≤3)                [Check AI activity]
Explore the demo (no sign-in)        Progress (5 phases)                 result list (≤20)
Synthetic data only · limits         ▸ Details (steps, link, history)
▸ How it works ▸ Why migrate ▸ Trust Evidence · AI activity · Help
```
