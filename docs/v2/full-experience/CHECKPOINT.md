# Checkpoint: V2 full experience

Updated 19 Oct 2026. Branch `v2/full-experience`. Nothing pushed, merged or deployed. Gemini not activated.

Status: all five workstreams are integrated and verified. See `REPORT.md` for results, decisions and remaining work.

Test status at `64f7953`:
- vitest: 798 passed.
- tsc: clean.
- eslint: clean.
- next build: pass.
- pytest: 663 passed, 86 skipped.
- UI journey: 49/49 at 1440 and 390, ending in API `VERIFIED_FIRST_PRODUCTIVE_USE` with total 107.25 and 17/17 checks.
- Live rejected and blocked recovery: pass.
- axe: clean apart from the pre-existing `/play` issue.

## Next tasks (each needs an owner decision)

1. Approve a tagged, no-traffic Cloud Run preview for hosted verification of Firebase sign-in and Cloud SQL.
2. Authorise a push of `v2/full-experience` and a draft PR to `main`. Merging and production promotion stay separate gates.
3. Decide the API contract follow-ups in `REPORT.md`: difference as an amount, account names, and an evidence-pack export.
4. Decide on the Gemini activation gate. The attribution switches to the approved line only after that gate.
