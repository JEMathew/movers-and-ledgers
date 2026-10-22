# Track C nine-video readiness — 23 October 2026

**NO-GO. Production remains on the working Gemini release.** This report supersedes earlier candidate planning where it differs. The only application change in this verification pass is the requested collection name, **Start Here**. All nine originals and the previous implementation remain preserved.

| Requested result | Status | Evidence / remaining work |
|---|---|---|
| Nine-video package | BLOCKED | Nine originals and tiles preserved; six local players already passed completion/fullscreen checks. Final captions, transcripts and three current-product recordings are unavailable. |
| Subtitles and synchronization | NOT VERIFIED | macOS denies the original Subtitles directory. Accessible media package has none. The local 175-second demo scripts do not match these lessons; the connected catalog exposes no matching Academy narration. No replacement text was invented. |
| Videos 04, 05, 09 | RESTRICTED; fidelity FAIL | 04 at 53s and 05 at 52s explicitly show “Live Gemini capture pending”, Planned and FALLBACK. 09 at 90s shows “Planned · not available in the Beta” and disabled Advisor/Reviewer. This differs from the released live-status source. See the extracted frames in current-production evidence. |
| Public media delivery | STOP | Read-only public checks: Learn returns 200 without the Academy video tab; all nine MP4 URLs return 404. Track C is not deployed. Its earlier production route defect is fixed and verified with 108 fixture checks, but real media cannot be approved merely to suppress 404s. |
| Gemini frontend compatibility | PASS for isolated source integration | Exact released source is base b20ef668736a520387753dee4c8c19e4f66ae8da plus the approved live-status selector. Existing 228-file comparison, 552 focused tests, typecheck/lint/build evidence reused. This pass: 14 Academy tests pass and actual browser shows Start Here. No new inference calls. Public authenticated inference proof is not asserted. |
| Rollback | NOT READY for final candidate | Recovery target exists, is Ready and serves 100%; digest is still in Artifact Registry. No Academy image/revision exists yet, so complete release rollback readiness cannot be claimed. |
| New web revision and digest | NOT CREATED | Both remain null. No candidate with incomplete or stale media was built, published or deployed. |
| Production promotion | BLOCKED | Production hold retained. No final publication approval requested prematurely. |
| Public verification | Executed; Academy unavailable | Current production, registry and public HTTP receipts are saved below. No production write, model generation, campaign mutation or paid service. |
| Indispensable owner action | Provide the complete source package | Copy the original Subtitles folder and any existing release-correct versions of 04/05/09 with their matching transcripts into the accessible media source directory. If those versions do not exist, the nine-video release remains blocked; the current recordings cannot be relabeled as genuine released Gemini demonstrations. |

## Exact current production and recovery target

Read back at 2026-10-22T21:13:56Z:

- Web: `movebooks-beta-web-b20-live-sdk1`, 100%, Ready=True.
- Full web image: `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/web@sha256:617b943f3abc4e1e32400b765d1867d173941308f494947097990defec52e0ad`.
- Web revision configuration SHA-256: `ccdf55ed1ed59a9f8164644e05a1260708822d97d134e93b305a7d99a0eed903`.
- API: `movebooks-beta-api-b20-judge-sdk1`, 100%, Ready=True; digest `sha256:a89eee7d3264c81c0a6fbf77991a1ac6dd8c38a305306bb2d3972dbccdd53a21`.
- Track C performed no production or campaign writes. API selection matches the release receipt. Campaign environment remains enabled; campaign Firestore contents were deliberately not re-read, so no independent campaign-record audit is claimed.

The existing web revision is ready and its immutable image is available. No redeployment was needed to verify those facts. Revalidate the serving revision, digest, traffic and competing release activity immediately before any future publication; never substitute a planned/disabled Gemini revision.

The following command is a **documented future web-only recovery operation, not executed or authorized by this report**. It requires the applicable publication/recovery authorization and a fresh target check:

```sh
gcloud run services update-traffic movebooks-beta-web \
  --project=movebooks-ai \
  --region=asia-southeast1 \
  --account=jeasom@gmail.com \
  --to-revisions=movebooks-beta-web-b20-live-sdk1=100
```

Read back the result with:

```sh
gcloud run services describe movebooks-beta-web \
  --project=movebooks-ai --region=asia-southeast1 \
  --account=jeasom@gmail.com --format='json(status.traffic,status.latestReadyRevisionName)'
gcloud run revisions describe movebooks-beta-web-b20-live-sdk1 \
  --project=movebooks-ai --region=asia-southeast1 \
  --account=jeasom@gmail.com --format='json(status.imageDigest,status.conditions)'
```

This restores the already verified Gemini-enabled web. It does not select an API revision, edit campaign/grants/budgets, change Firebase/DNS/IAM or delete media or financial data. No automatic rollback is claimed. Existing revision tags are recorded in the receipt; this command does not remove them.

## Final media publication requirements

Use the existing same-origin web service and an immutable bundle outside `public/`, at `/app/academy-media`. No new hosting service is required. Original MP4 sources stay read-only. Final approved copies, posters, derived VTT and human-readable transcripts must be associated with all nine lesson IDs and hashed before the exact web image is built. Current code deliberately excludes 04/05/09 and requires verified captions plus publication approval; do not lift those gates until actual content QA passes. Transcript delivery remains outstanding because matching source text is unavailable.

Media packaged with the future web image switches atomically with that image. Recovery to today's Gemini web returns to today's non-Academy experience; it must not depend on a mutable development directory or an external unversioned media store. Preserve original source assets independently. Record the exact candidate revision, OCI/platform digest, bundle hash, final nine-video audio/caption QA and cost estimate before requesting one final publication authorization. No new paid services or credits were consumed in this work.

Existing six-video playback, fullscreen, keyboard, responsive light/dark layouts, both Learn tabs, ten original concepts and landing-page preservation evidence remains applicable. Cillian voice identity and native numeric volume range remain NOT VERIFIED. The three unrelated full-suite footer/copy failures were also reproduced on the released baseline; they remain documented and were not changed to conceal failures.

Evidence: [current production and verification](evidence/current-production-2026-10-23/), [released source comparison](evidence/released-baseline-2026-10-23/), [earlier acceptance](ACCEPTANCE.md), [machine-readable candidate](release-candidate.json).
