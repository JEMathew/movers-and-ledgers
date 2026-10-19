# Push and draft PR handoff

GitHub write access is not linked to this environment, so the branch could not be pushed from here. The commands
below push the exact reviewed branch from the bundle and open a **draft** PR. Do not merge it until the release
decision in `RELEASE-READINESS.md`.

```bash
git clone https://github.com/JEMathew/movers-and-ledgers.git && cd movers-and-ledgers
git bundle verify ~/Downloads/movebooks-v2-release-candidate.bundle          # "is okay"; needs main 4e31e29
git fetch ~/Downloads/movebooks-v2-release-candidate.bundle v2/full-experience:v2/full-experience
git log --oneline -1 v2/full-experience                                      # must match the SHA in the handoff message
git push -u origin v2/full-experience
gh pr create --draft --base main --head v2/full-experience \
  --title "MoveBooks AI V2: full experience (release candidate, draft)" \
  --body-file docs/v2/release/PR-BODY.md
```

The commands push one new branch and open one draft PR. They do not touch `main`, deploy anything or change any Cloud resource.
