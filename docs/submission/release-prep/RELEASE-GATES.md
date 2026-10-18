# RELEASE GATES — remaining P0 checklist (PREPARED, NOTHING EXECUTED)

Every ★ step needs its own explicit user approval **at the time**. Stop at the first failure; do not change architecture; roll back by traffic routing.
Values come from the repo/docs unless marked **(confirm)**. Order matters: API before web (the web proxy uses the API's main URL as token audience and the new web calls new API routes).

```bash
R=asia-southeast1; P=movebooks-ai; REG=$R-docker.pkg.dev/$P/movebooks-beta; SHORT=01d105c
SA=movebooks-beta-api@$P.iam.gserviceaccount.com; SQL=movebooks-beta-pg
```

## G0. Stage A + Stage B pass (`STAGE-A.md`, `build-and-scan.sh`)
Done when: `RESULT: PASS`, evidence folder `~/evidence-01d105c-<ts>/` with `SHA256SUMS`. Anything else = stop.

## G1. Record rollback targets (read-only, no approval)
```bash
gcloud run services describe movebooks-beta-api --region $R --project $P --format='value(status.latestReadyRevisionName,status.traffic)'
gcloud run services describe movebooks-beta-web --region $R --project $P --format='value(status.latestReadyRevisionName,status.traffic)'
```
Save both revision names (API was `movebooks-beta-api-rel2997e20` on 17 Oct) in the evidence folder.

## G2. ★ Cloud SQL on-demand backup (automated backups are OFF — only data rollback point)
```bash
gcloud sql backups create --instance=$SQL --project=$P --description="pre-$SHORT candidate"
gcloud sql backups list --instance=$SQL --project=$P --limit=1     # status SUCCESSFUL before continuing
```

## G3. ★ Firestore least privilege (custom role + conditional binding; replaces the broader `roles/datastore.user` suggested earlier)
Source of truth: `docs/security/firestore-provisioning-proposal.md`, `infra/firestore/runtime-role.proposed.json`, `runtime-binding.proposed.json`.
```bash
gcloud iam roles create movebooksOperationalRuntime --project=$P --file=infra/firestore/runtime-role.proposed.json
gcloud projects add-iam-policy-binding $P --member=serviceAccount:$SA \
  --role=projects/$P/roles/movebooksOperationalRuntime \
  --condition='title=movebooks-operations-only,description=Restrict to the isolated operational database,expression=resource.name == "projects/movebooks-ai/databases/movebooks-operations"'
```
Preserve unrelated bindings. Verify only via the real workload (G6 readback); a console screenshot is not isolation evidence. Residual: negative access to another database cannot be tested without a service-account impersonation grant (not proposed) — record as untested.

## G4. ★ Push the two scanned images (digests are outputs, not guesses)
```bash
gcloud auth configure-docker $R-docker.pkg.dev
SRC_API=$(docker images --format '{{.Repository}}:{{.Tag}}' | grep "^mb-api:$SHORT" | head -1)   # confirm exactly one match
SRC_WEB=$(docker images --format '{{.Repository}}:{{.Tag}}' | grep "^mb-web:$SHORT" | head -1)
docker tag "$SRC_API" $REG/api:$SHORT && docker push $REG/api:$SHORT
docker tag "$SRC_WEB" $REG/web:$SHORT && docker push $REG/web:$SHORT
```
Record the pushed `sha256:` digests; deploy **by digest** below. The pushed image must be the scanned one: compare its local image ID with `~/evidence-01d105c-<ts>/{api,web}-image-id.txt`.

## G5. ★ API candidate, no traffic, deterministic-only, Firestore controls ON but policy still `false`
```bash
gcloud run deploy movebooks-beta-api --region $R --project $P --image $REG/api@<API_DIGEST> --no-traffic --tag cand --memory 1Gi \
  --update-env-vars MOVEBOOKS_MODEL_CONTROLS_BACKEND=firestore,MOVEBOOKS_FIRESTORE_DATABASE=movebooks-operations
```
`--update-env-vars` merges; existing env (SQL, identity, model mode `deterministic-only`) is preserved. Verify: revision Ready, clean startup logs, `/readyz` via `Authorization: Bearer $(gcloud auth print-identity-token)` on the tag URL **printed by deploy (confirm)**. If startup fails, stop; do not promote.
★ Promote: `gcloud run services update-traffic movebooks-beta-api --region $R --project $P --to-tags cand=100`

## G6. ★ Web candidate, no traffic
```bash
gcloud run deploy movebooks-beta-web --region $R --project $P --image $REG/web@<WEB_DIGEST> --no-traffic --tag cand \
  --update-env-vars '^@^MOVEBOOKS_ADDITIONAL_WEB_ORIGINS=https://movebooks-si.web.app,https://<TAG_HOST_FROM_DEPLOY_OUTPUT>'
```
(`^@^` makes `@` the separator; the value replaces the old one, so keep `https://movebooks-si.web.app`. Leave `MOVEBOOKS_PRIVATE_API_ORIGIN` untouched.)
★ Firebase Console → Authentication → Settings → Authorized domains: add `<TAG_HOST_FROM_DEPLOY_OUTPUT>` (temporary; remove after promotion if unused). Without it Google sign-in fails on the tagged URL.

## G7. Accountant end-to-end acceptance on the tagged web URL — **MANUAL**
`browser-journey/accept-and-record.cjs` hardcodes `http://localhost:3000` and a local demo identity; it **cannot** run against Google sign-in. A human signs in and completes: Explore Demo → Harbor Light → discovery/readiness → plan → 12 mappings incl. `1200 Misc Clearing` (+ Reviewer second opinion) → migrate → recover duplicate → validate (exact reconciliation) → configure → onboard → approve + post invoice → **Verified First Productive Use, synthetic invoice USD 107.25**. Also Play mission and browser-local Try Your Data fallback. Expected parity with `dryrun/browser-evidence.json` (17 checks). Capture screenshots + a screen recording.

## G8. Two-account isolation (tagged URL, two Google accounts A and B)
B cannot open A's workspace URL/session ID; B's advisor/reviewer/activity reads return only B's data (`/v1/operations/activity`); direct Firestore client write is denied (rules `infra/firestore/firestore.rules`); unauthenticated `/api/v1/*` returns 401.

## G9. Operational activity + deterministic fallback (policy still `false`)
Request an Advisor explanation: expect visible `FALLBACK`, **no model call**, activity readback shows the outcome, `/v1/runtime` reports deterministic fallback. This also proves the kill-switch default fails closed.

## G10. ★ Promote web (after G7–G9 pass)
`gcloud run services update-traffic movebooks-beta-web --region $R --project $P --to-tags cand=100` then re-check `https://movebooks-si.web.app` sign-in, G8, G9 on the public URL.

## G11. ★ Bounded live Gemini (SEPARATE approval; target Sat 19:30 IST, else Sun 10:00 IST cut-off)
Decide limits first **(user decision)**: defaults are owner 20/day, global 100/day, reservation $0.10, global budget $1/day (=only 10 reserved calls/day). Actual cost at 3.5 Flash-Lite is ~$0.01/call, so a $3/day budget (`…GLOBAL_DAILY_MICROUSD=3000000`) allows ~30 calls and bounds real spend far below it.
```bash
gcloud run deploy movebooks-beta-api --region $R --project $P --image $REG/api@<API_DIGEST> --no-traffic --tag gem \
  --update-env-vars '^|^MOVEBOOKS_MODEL_PROVIDER_MODE=gemini-adk|MOVEBOOKS_REASONING_PROJECT=movebooks-ai|MOVEBOOKS_REASONING_LOCATION=global|MOVEBOOKS_SYNTHETIC_BETA_AUTHORIZED=true|MOVEBOOKS_REASONING_MODELS={"planning":"gemini-3.5-flash-lite","mapping":"gemini-3.5-flash-lite","resolution":"gemini-3.5-flash-lite","configuration":"gemini-3.5-flash-lite","onboarding":"gemini-3.5-flash-lite"}'
```
Promote `gem` (policy is still `false`, so behaviour stays fallback). Then ★ set Firestore `movebooks_model_controls/policy` → `enabled:true` **and** `synthetic_beta_authorized:true` (Console edit). Run exactly one Advisor and one Reviewer call on account `1200 Misc Clearing` from the UI. Pass = stored result **not** `FALLBACK`, model `gemini-3.5-flash-lite`, latency recorded, no financial state/approval changed, reservation visible in activity readback. Vertex access is thereby proven by the attached workload identity. **Any failure → set policy `enabled:false` (kill switch, no redeploy) and, if needed, route API traffic back.**

## G12. Submission package (can run in parallel with G2–G11)
- Demo video 3:00–3:50: existing local footage is honest but not deployed; if G7 passes, re-record on the public URL (+ ~20 s Gemini segment only if G11 passed). Upload unlisted; test link in a private window.
- Deck: official template PDF (16 pages, 2.35 MB < 5 MB) — fill contact field.
- Description (≤1,024 chars): use the "validated in development" variant unless G11 passed. `docs/submission/product-description.txt`.
- ★ Git push/merge of `delivery/submission-integration` so the public repo matches the product. Check README claims match reality.
- Final check from a logged-out private window: prototype URL, GitHub, video, PDF.

## Rollback (any step)
```bash
gcloud run services update-traffic movebooks-beta-api --region $R --project $P --to-revisions <RECORDED_API_REVISION>=100
gcloud run services update-traffic movebooks-beta-web --region $R --project $P --to-revisions <RECORDED_WEB_REVISION>=100
```
No schema change since `main`, so traffic routing is a complete code rollback. Data rollback = the G2 backup only. Firestore kill switch = policy `enabled:false`.
