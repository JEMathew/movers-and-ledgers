# Push and draft PR handoff

This environment has no GitHub write access: HTTPS has no stored credential, and the SSH key is not authorised. The
branch therefore could not be pushed from here. Push the exact reviewed branch yourself, then open a **draft** PR.
Do not merge until the release decision in `RELEASE-READINESS.md`.

## Option A: from your existing checkout (simplest)

`~/Downloads/Intuit/movebooks-ai` already contains `v2/full-experience`. The Phase 1 worktree shares its refs.

```bash
cd ~/Downloads/Intuit/movebooks-ai
git log --oneline -1 v2/full-experience          # must match the SHA in the handoff message
git push -u origin v2/full-experience
```

## Option B: from the bundle (a fresh clone or another machine)

```bash
git clone https://github.com/JEMathew/movers-and-ledgers.git && cd movers-and-ledgers
git bundle verify ~/Downloads/movebooks-v2-phase1-closure.bundle          # "is okay"; needs main 4e31e29
git fetch ~/Downloads/movebooks-v2-phase1-closure.bundle v2/full-experience:v2/full-experience
git log --oneline -1 v2/full-experience                                    # must match the SHA in the handoff message
git push -u origin v2/full-experience
```

## Open the draft PR

With the GitHub CLI:

```bash
gh pr create --draft --base main --head v2/full-experience \
  --title "MoveBooks AI V2: Phase 1 release candidate (draft)" \
  --body-file docs/v2/release/PR-BODY.md
```

Or in a browser:
1. Open https://github.com/JEMathew/movers-and-ledgers/compare/main...v2/full-experience?expand=1
2. Paste `docs/v2/release/PR-BODY.md` as the description.
3. Choose **Create draft pull request**.

These steps push one new branch and open one draft PR. They do not touch `main`, deploy anything or change any
Cloud resource. CI runs on the PR; report its result as it is.
