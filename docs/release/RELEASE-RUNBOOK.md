# Release runbook — integration candidate (`feat/migration-listing`)

Prepared and locally verified; **nothing here has been executed against Google Cloud**. Every ★ step needs explicit approval at that moment. Stop at the first failure. Roll back by traffic routing.
This supersedes the untracked `docs/submission/release-prep/*` scripts that pinned `01d105c` / `ae1124d`: the scripts below take the commit as an input, so committing them never invalidates them.

```bash
R=asia-southeast1; P=movebooks-ai; REG=$R-docker.pkg.dev/$P/movebooks-beta
```

## What changed since the deployed candidate (why both images are rebuilt)
| Change | Image | Commit |
|---|---|---|
| `GET /v1/migration-sessions` owner-scoped listing (SQL-ordered, bounded, owner-bound cursors) | API | `e7c7061`, `35183a2` |
| Proxy exposes that route with a strict `limit`/`cursor` allowlist (without it the picker 404s in Firebase mode) | web | `5b5d736` |
| Picker, post-sign-in states, 200% zoom fixes | web | `e7c7061`, `ccc031f` |

No database schema change (the listing reads existing columns), so traffic routing remains a complete code rollback. The API must be promoted **before** the web, because the new web calls the new route.

## Locally verified (sandbox, 18 Oct)
- Stage A + Stage B source checks: good archive verifies; wrong approved commit, tampered tree, tampered archive and re-run overwrite are all refused.
- `smoke-candidate.sh` against a Firebase-mode production build: **7/7 pass** on `5b5d736`; on `5ad03a0` the list check fails (`404`), reproducing the defect.
- Dependency audits: `npm audit --omit=dev` 0 vulnerabilities (145 prod packages); `pip-audit` 0 known vulnerabilities (141 resolved API packages); `pip check` clean; ADK/genai/Firestore imports OK.
- **Not verified here:** container builds and Grype image scans — this sandbox's network policy blocks every container registry (Docker Hub, `cgr.dev`, `mirror.gcr.io`, `ghcr.io`). They run in Cloud Shell (G0).

## G0. Build + scan (Mac, then ★ Cloud Shell)
```bash
# Mac, in the repo (read-only; writes 3 new files)
bash scripts/release/stage-a-archive.sh feat/migration-listing ~/Downloads
# Upload mb-<short>.tar, .sha256, .provenance and scripts/release/build-and-scan.sh to Cloud Shell, then ★:
EXPECT_COMMIT=<full sha printed by stage A> bash build-and-scan.sh ~/mb-<short>.tar
```
Pass = `RESULT: PASS`; `api-security.json` and `web-security.json` 0 Critical/High, 0 ignored, DB < 72 h; `provenance.json` records commit, tree, image IDs, archive hashes and pinned bases.

## G1. Record rollback targets (read-only)
```bash
for s in movebooks-beta-api movebooks-beta-web; do gcloud run services describe $s --region $R --project $P --format='value(status.latestReadyRevisionName,status.traffic)'; done
```

## G2. ★ Cloud SQL on-demand backup (automated backups are off)
`gcloud sql backups create --instance=movebooks-beta-pg --project=$P --description="pre-<short> candidate"`

## G4. ★ Push the scanned images; deploy by digest only
```bash
gcloud auth configure-docker $R-docker.pkg.dev
for n in api web; do SRC=$(docker images --format '{{.Repository}}:{{.Tag}}' | grep "^mb-$n:<short>-" | head -1)
  docker tag "$SRC" $REG/$n:<short> && docker push $REG/$n:<short>; done
gcloud artifacts docker images describe $REG/api:<short> --format='value(image_summary.digest)'
gcloud artifacts docker images describe $REG/web:<short> --format='value(image_summary.digest)'
```
The local image IDs must equal `provenance.json`. Add the two registry digests to the evidence folder.

## G5/G6. ★ No-traffic candidates (API first; env inherited, model mode stays `deterministic-only`)
```bash
gcloud run deploy movebooks-beta-api --region $R --project $P --image $REG/api@<API_DIGEST> --no-traffic --tag cand
gcloud run deploy movebooks-beta-web --region $R --project $P --image $REG/web@<WEB_DIGEST> --no-traffic --tag cand
bash scripts/release/smoke-candidate.sh https://cand---movebooks-beta-web-<hash>.a.run.app https://cand---movebooks-beta-api-<hash>.a.run.app
```
Pass = smoke `RESULT: … 0 failed` (includes: list route reachable but sign-in required; unknown query refused; anonymous API 403; `model_mode` = `deterministic-only`).
Check (read-only) where the web candidate's `MOVEBOOKS_PRIVATE_API_ORIGIN` points: it inherits the previous candidate's value (on 17 Oct that was the API **tag** URL). It must reach an API revision that has the listing route, and must be reset to the main API URL before web promotion (handoff R9). Add the web tag host to Firebase authorized domains for sign-in on the tag URL.

## G7/G8. Manual acceptance on the tagged URL (real Google sign-in)
Full journey to Verified First Productive Use; then a second Google account: B's picker lists none of A's migrations, B cannot open A's session URL (404), unauthenticated `/api/v1/*` → 401.

## G9. ★ Promote API, then web
```bash
gcloud run services update-traffic movebooks-beta-api --region $R --project $P --to-tags cand=100
gcloud run services update-traffic movebooks-beta-web --region $R --project $P --to-tags cand=100
bash scripts/release/smoke-candidate.sh https://movebooks-si.web.app
```

## Rollback (any step)
```bash
gcloud run services update-traffic movebooks-beta-web --region $R --project $P --to-revisions <G1 web revision>=100
gcloud run services update-traffic movebooks-beta-api --region $R --project $P --to-revisions <G1 api revision>=100
```
Web first, then API (the old web never calls the new route). Data rollback = G2 backup only.

## Known reproducibility gaps (P2)
- The web build stage uses `node:22-bookworm-slim` by tag (runtime base is digest-pinned); Python dependencies are resolved at build time, not hash-locked. The resolved set from this verification is in the evidence folder (`api-resolved-requirements.txt`) for comparison.
