# User Guide — merged runtime alignment

Date: 2026-09-29. Branch: `feature/user-guide`.

**GREEN for the static synthetic Beta User Guide update.** No cloud validation,
production readiness, customer-data intake or new runtime capability is claimed.

## Baseline and scope

- Preserved guide commit `29c32e1` and merged `origin/main` at `2c62b22`
  (merged PR #13) without conflicts; merge commit `2ea4234`.
- Confirmed mapping reconsideration in the merged UI, authenticated request/review
  routes and orchestrator. Requests are limited to final rejected mappings before
  execution; only the owner can request/review; prior decisions remain recorded.
- Removed Section F's temporary “Rolling out in Beta” qualifier. Documented reason
  entry, separate explicit review, original actor/time/reason/evidence retention,
  and the fact that reconsideration does not undo an executed migration or bypass checks.
- Corrected local-only identity/persistence wording: local demo uses memory; the
  validated cloud dev/test path uses Google identity and durable synthetic workspaces.
  Cloud access is bounded, uploads remain disabled, and Gemini/managed ADK remain disabled.
- `/guide` remains getting-started/how-to; `/learn` remains concept learning.
  No migration, orchestration, authorization, IAM or cloud runtime code was edited.
- The unrelated lockfile edit in the original cloud-validation worktree was untouched.

## Verification

| Check | Result |
| --- | --- |
| Frontend suite | PASS — 89 tests, 15 files, including 7 Guide tests |
| Frontend lint | PASS |
| TypeScript | PASS |
| Production build | PASS — `/guide` generated as a static route |
| Repository checks | PASS — 86 Markdown / 331 text files, zero findings |
| Whitespace | PASS |
| Desktop Chrome, 1440 × 1000 | PASS — light/dark layouts, contents and readable text |
| Mobile Chrome viewport, 390 × 844 | PASS — light/dark layouts, Section F wraps without horizontal overflow |
| Navigation / keyboard | PASS — contents anchor, Enter-operated native disclosure, mobile Guide/Learn links and Learn → Guide return |
| Browser console | No captured warnings/errors during the successful production-preview checks |

Visual inspection used a loopback-only production-build preview; no API or cloud
resources were started. Viewport override was reset and the temporary preview was
stopped afterward. This is browser viewport testing, not physical-device or screen-reader certification.

## Remaining gaps and handoff

No blocking findings for this guide update. Representative user comprehension,
screen-reader testing and broader physical-device coverage remain follow-ups.
Publish `feature/user-guide`, open a PR to `main`, and obtain human review after CI.
Do not merge automatically.
