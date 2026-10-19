# Checkpoint: V2 full experience

Updated 19 Oct 2026 after the release-readiness sprint. Branch `v2/full-experience`; the last code commit is `3d4cb07`.
Nothing has been pushed, merged or deployed, and Gemini is not activated. Current status, the release matrix and open
issues are in `docs/v2/release/RELEASE-READINESS.md`, which supersedes the test counts in `REPORT.md`. Those counts were
correct at `64f7953`.

Test status at `3d4cb07`:
- vitest 814 passed
- tsc and eslint clean
- `next build` (Firebase mode) passes
- pytest 663 passed and 86 skipped; with Postgres, 678 passed and 71 skipped
- journey 49/49 at 1440 and 390
- live rejected and blocked recovery passes
- axe 0 on 46 route checks
- `smoke-v2.sh` 24/24

## Next tasks (each needs an owner decision)

1. Push the branch and open a draft PR (`docs/v2/release/PR.md`); CI then runs on GitHub.
2. Approve the private preview (`docs/v2/release/PREVIEW-PLAN.md`) and run `ACCEPTANCE-CHECKLIST.md` with the two test accounts.
3. Decide on the backend `fpu/decision` replay guard (P2) and the API contract follow-ups.
4. Production promotion, then the Gemini activation gate, each as a separate decision.
