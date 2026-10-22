# Track C nine-video release readiness — 23 October 2026

**GO for the final publication decision. No deployment has occurred.** This receipt supersedes the earlier missing-subtitle and stale-Gemini blockers. Work resumed from `8e9ee4ba71c21ee3fb9dd1a38db9a3c068400cdf`; the exact image uses source commit `5515ee1002265c18d098e718761db4b3292d041a` on `feature/video-academy-v1`.

| Check | Result | Evidence / scope |
|---|---|---|
| Nine final narrated MP4s | PASS — READY | All nine H.264/AAC files fully decode. Six original approved recordings unchanged; 04/05/09 corrected copies. Original nine SHA-256 hashes unchanged. |
| Nine synchronized caption sets | PASS — VERIFIED | Local ASR from original audio, technical spelling corrected, word timestamps and exact edit retiming, bounded non-overlapping SRT/VTT. All nine render in actual browser screenshots; matching transcripts included. |
| Gemini 04/05/09 fidelity | PASS — VERIFIED | Existing authenticated production result captures show actual Advisor and independent Reviewer, `gemini-3.5-flash-lite`. Removed obsolete controls, labels, quota claims and never-reads-Advisor assertion. No new inference or invented response. Original audio edited, never synthesized. |
| Original restricted cut isolation | PASS | Exact corrected MP4 hashes pinned server-side. Wrong/replaced binaries remain 404 even with publication flags. Original restricted cuts are absent from the candidate bundle. |
| Media delivery | PASS in production build and exact image | 36 asset GETs + 36 seek-range requests pass in each environment, matching bundle bytes. Existing Firebase catch-all routes to the same web service; no Hosting change needed. |
| Public production media URLs | NOT VERIFIED after release | Production is deliberately unchanged. The final publication and its same-origin smoke checks are pending authorization. |
| Learn navigation / ten concepts | PASS | Two tabs, keyboard switching, nine lesson tiles, original concept text unchanged; 195 focused tests pass. |
| Contextual video help | PASS | Existing journey links retained; Advisor/Reviewer guide links added beside existing analysis without changing control logic. |
| Existing player controls | PASS, reused plus focused checks | Prior six-video pause/resume/seek/mute/speed/fullscreen/error checks retained. Three corrected copies complete uninterrupted in browser (04/05 at 1×, 09 at 2×); all nine caption tracks render. |
| Numeric volume / Cillian identity | NOT VERIFIED independently | No new claim of voice-actor certification or numeric-volume UI test. The supplied narration is retained; no new audio generated. |
| Responsive light/dark layouts | PASS | Desktop 1440, tablet 768, mobile 390; both tabs, no mobile horizontal overflow; real captures saved. |
| Gemini / identity / finance compatibility | PASS source parity | Exact released Gemini, auth proxy, landing, concept and dependency sources retained. Only additive guide links in MappingReview. No API, inference, tenant, financial or release-control modifications. |
| Build / focused checks | PASS | Typecheck, lint, production build, 195 tests. Prior unrelated full-suite failures remain documented; no broad acceptance cycle repeated. |
| Image security | PASS | Offline Syft/Grype, zero vulnerability matches, zero ignored findings, valid 21 October database. Non-root 65532, read-only smoke container. |
| Rollback | READY | Captured web revision remains Ready and 100% serving; immutable base pulled and retained. Exact web-only traffic rollback below. |

## Exact candidate and media

- Proposed revision (not yet created): `movebooks-beta-web-c5515ee1-academy`.
- Deployment image: `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/web@sha256:ed88d48d45372a59adf3bc081cadca4252bab112f3cb5bf7de9bd843705d79e4` (local image built; registry push pending authorization).
- OCI index digest: `sha256:9fc3ce1cecd87f464517c0df96a1d98f33027b529594067e37081a5a6f604201`.
- Media bundle: `/Users/jincenmathew/Downloads/Intuit/movebooks-academy-media/approved-bundle-v2`; archive `/Users/jincenmathew/Downloads/Intuit/movebooks-academy-candidate-20261023/academy-media-v2.tar`; SHA-256 `143f16defd56106b7c4176bf39ca5358e123e4cf72c24f770ef45315ad198f1b`.
- Files resolve at `/api/academy-media/{01..09}/{mp4,jpg,vtt,txt}`; SRT source files are included in the handoff archive. No new provider, bucket, Firebase rewrite or production configuration change is needed.
- Measured corrected runtimes: 04 **63.853s**, 05 **67.147s**, 09 **169.007s**. Tiles show measured durations rather than obsolete inventory lengths.
- Preview: http://127.0.0.1:3112/learn?tab=videos (exact Linux candidate), http://127.0.0.1:3111/learn?tab=videos (native production build).

## Final authorization required

Authorize pushing the preserved image to the existing web registry and creating `movebooks-beta-web-c5515ee1-academy` at **0% traffic**, then promoting **only the web service to 100%** after release smoke checks. Preserve the current service settings, Firebase Hosting, DNS, IAM, API, Gemini campaign and budgets. This publication includes the corrected 04/05/09 copies; their obsolete originals remain restricted.

If verification fails or the released baseline changes, stop promotion. Roll back any promoted web traffic to `movebooks-beta-web-b20-live-sdk1` with:

```sh
gcloud run services update-traffic movebooks-beta-web --project=movebooks-ai --region=asia-southeast1 --account=jeasom@gmail.com --to-revisions=movebooks-beta-web-b20-live-sdk1=100
```

This changes web traffic only and returns to image `sha256:617b943f3abc4e1e32400b765d1867d173941308f494947097990defec52e0ad`. No API or data rollback is required. Production deployment has not been performed by Track C.

All new evidence is in `evidence/completion-2026-10-23/`; machine-readable receipt: `release-candidate.json`. Earlier dated evidence is retained for provenance, not asserted as new execution.
