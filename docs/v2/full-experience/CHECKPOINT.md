# Checkpoint: V2 full experience

Updated 19 Oct 2026. Branch `v2/full-experience`. Nothing pushed, merged or deployed. Gemini not activated.

## Done on this branch

| Commit | Workstream | Change |
|---|---|---|
| `8f49156` | A | Clear Ledger theme across the app, new landing, navigation, footer, Play flag, attribution gate |
| `9a8e499` | A | Shared workflow pattern (`components/v2/Workflow.tsx`), five-stage bar on task pages, sentence-case journey labels |
| `22b4944` | A | Rules, attribution decision and file ownership (`README.md`) |
| `fcbfe05` | D | Trust, evidence and results, resume link, demo, guide, help, Try your data |
| `80a1c1d` | D | Help answer as one recovery card |

Test status at `80a1c1d`: vitest 749 passed, 0 failed; `tsc --noEmit` clean; eslint clean. The 36-step Harbor Light
journey completed through the UI at `9a8e499` (API: `VERIFIED_FIRST_PRODUCTIVE_USE`, invoice total 107.25).

## In progress (separate worktrees, to be merged here)

- B on `v2/fx-b`: sign-in and entry, My migration and picker, Understand, Prepare, low-risk batch approval.
- C on `v2/fx-c`: Move, Verify, Start and the verified first invoice.

## Next tasks

1. Merge `v2/fx-b` and `v2/fx-c`; resolve conflicts; full vitest, tsc, lint, `next build`, pytest.
2. Update the try-your-data badge to sentence case (one line in the B-owned Understand test needs the same change).
3. Full QA: journey via `flow.py`, Northstar blocked mapping, rejected-mapping recovery, screenshots at 1440 and
   390 for every route, axe, keyboard order and reduced motion; before/after against `main`.
4. Report with product-value reporting per workstream and remaining work.
