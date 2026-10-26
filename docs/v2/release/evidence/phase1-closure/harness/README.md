# Phase 1 closure QA harness

Local browser and HTTP checks used for the Phase 1 closure evidence. They drive a local API on 127.0.0.1:8100 and
the web dev server on localhost:3101 (demo identity), plus a production build on localhost:3100 for route checks.
Ports were chosen to avoid other local MoveBooks servers on 3000/8000.

- `fresh-api.sh` restarts the in-memory API so every run starts clean. Edit the repository path at the top.
- `lib.mjs` launches Chromium through `playwright-core`; set `CHROME` to a local Chromium or Chrome for Testing.
- `walk.mjs <width> <outdir>`: the full journey, choosing the visible next action on each screen, with axe and
  overflow checks per workflow state and the API's final state.
- `routes.mjs <base> <outdir>`: axe (WCAG 2.2 AA tags), headings, landmarks, keyboard focus, reduced motion,
  overflow and Play-in-navigation for 16 routes × 2 widths × light/dark (dark selected as a person would, via the
  stored theme).
- `recovery.mjs rejected|blocked`: rejected → reconsideration, and the Northstar blocked mapping.
- `idempotency_live.py <api>`: invoice approval replays (sequential, concurrent, changed note) and posting replay.

Install: `npm i playwright-core@1.56.1 @axe-core/playwright@4.11.0 axe-core@4.11.0` in a scratch directory.
These are local checks with synthetic data and the development identity. They are not hosted or real-device evidence.
