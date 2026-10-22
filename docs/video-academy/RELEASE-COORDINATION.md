# Track C release coordination — 23 October 2026

**NO-GO for publication. Media-path code is corrected; the final web-only production candidate is not yet buildable against a confirmed released Gemini revision.** Machine-readable state: [release-candidate.json](release-candidate.json).

## Smallest correction

The previous media handler rejected every production request based on NODE_ENV, regardless of asset presence. It now serves explicitly approved bundles from the existing same-origin `/api/academy-media/{id}/{extension}` URLs. No new host, service, CDN, Firebase rule or DNS change is required.

The bundle stays outside `public/`. Production requires `publicationApproved: true`, `technicalChecksPassed: true`, `captionsVerified: true`, a positive measured duration and existing MP4, JPG and VTT files. Development retains the separately labeled review preview. The development review flag cannot authorize production. IDs 04, 05 and 09 are rejected even when all manifest approval fields are injected as true; filename containment, extension restrictions and range handling remain intact.

This change does not approve or publish any original recording. All nine original hashes remain unchanged, all current real publication flags remain false, and the accessible source set still has no original SRT files. No missing captions were generated. The temporary HTTP test bundle contains plainly labeled synthetic bytes and was never shipped, shown as a video or treated as caption evidence.

## Verification

| Check | Result | Evidence and limits |
|---|---|---|
| Production-build route correction | PASS | Actual `next start`: 108 HTTP checks across approved fixture files, review-only metadata, unverified/missing captions, and all three restricted IDs. Approved byte ranges return 206; disallowed paths return 404. Synthetic bytes verify routing, not media playback. |
| Restricted 04/05/09 remain inaccessible | PASS | All MP4/JPG/VTT routes denied with injected approval flags, both unit tests and built-server checks. No restricted files added to serving bundle. |
| Focused regression | PASS | 311 tests in 20 files, production build, typecheck and lint. No UI, identity, Gemini, financial, tenant, release or infrastructure source changed in this correction. |
| Real original MP4 regression | PASS | Getting Started played from its existing local URL, 87.9-second duration, progressed beyond 46 seconds, audio enabled, no decoder error; screenshot and DOM receipt saved. This rerun does not certify narrator identity. Prior six-video completion evidence remains in ACCEPTANCE.md. |
| Both Learn tabs and mobile regression | PASS | Original topics present, switching tabs removes the video, mobile tabs and all nine entries remain available. Fresh desktop playback/mobile screenshots saved. Prior light/dark desktop/tablet/mobile coverage remains applicable because no UI changed. |
| All nine originals preserved | PASS | SHA-256 rechecked against the inventory; no original changed, redownloaded or regenerated. |
| Six original caption sets and actual rendering | FAIL | Original SRT inputs remain unavailable; no caption acceptance claimed. |
| Exact released Gemini web revision | NOT VERIFIED | Track B's latest receipt is still OWNER_DECISION_REQUIRED. Genuine private Gemini proof passed, but the public candidate has not been reported promoted. Its proposed image must not be represented as a released image. |
| 04/05/09 fidelity against released product | NOT VERIFIED | Retain restrictions. Genuine model proof alone cannot certify recordings, narration or precise UI fidelity. |
| Final Track C image digest and scan | NOT VERIFIED | No final candidate image built. Digest is null, not borrowed from Track B's proposed image. |

Evidence: [current run](evidence/release-coordination-2026-10-23/), [complete earlier acceptance](ACCEPTANCE.md). The production test server was stopped; the original review preview remains at http://127.0.0.1:3107/learn?tab=videos.

## Integration and media packaging boundary

1. Obtain the completed Track B release receipt and read back the exact serving web revision/image and source provenance. The currently proposed source is `b20ef668736a520387753dee4c8c19e4f66ae8da` plus the approved `AI_ASSISTANCE_STATUS` selection; preserve any final source delta in the actual released artifact. Do not substitute today's proposed artifact for a completed release.
2. Apply only Track C's changes to that exact web source in an isolated candidate checkout. Preserve Gemini modules, disclosure status, build arguments, runtime configuration and release controls. Do not edit Track B's branch or worktrees. Compare all protected paths before building.
3. Use the original SRTs, once available, with `scripts/prepare-academy-media.py`. Verify real captions against each original recording and review narration/content. Keep all nine source deliverables read-only; only six approved lessons belong in the serving bundle. Do not silently remove a recording's watermark or replace its audio.
4. Package that reviewed bundle as `/app/academy-media` in the separate web-only image and set `MOVEBOOKS_ACADEMY_MEDIA_DIR` to that absolute path. Include only `manifest.json` and the six MP4/JPG/VTT sets. Never copy raw source directories, 04/05/09, SRT source maps, test fixtures or secrets into `public/` or the image. Record every bundled file hash and the aggregate bundle hash. Media URLs remain same-origin; changing the selected web image also changes its matching media bundle atomically.
5. Build with the final released web's build/runtime inputs and existing release pipeline. Capture the exact OCI index and linux/amd64 manifest digests, scan/SBOM results and resource-limited runtime evidence. Execute genuine MP4/audio/caption browser QA on that exact artifact, not only unit fixtures. Check all nine tiles, both tabs, protected concept/landing content and contextual links. No automatic Gemini calls are authorized.
6. Present a single web-only candidate, its exact image/bundle references, QA and rollback target for the final publication authorization. Do not deploy, stage a hosted revision, publish an image, or alter production settings before that authorization.

## Web-only rollback

Immediately before a future approved Track C publication, capture the **then-serving Gemini-enabled web revision, immutable digest, source provenance and runtime configuration** as the rollback target. It cannot be filled with today's pre-Gemini web revision or a proposed revision. If Academy verification fails after an authorized publication, the release operator restores that captured web revision using the existing release controls; its image restores the matching previous media bundle. Keep the API traffic, Gemini campaign/policy, budgets, grants and financial records unchanged. Track B owns any Gemini rollback; Track C must not execute Track B's broader API/policy rollback procedure.

An hourly follow-up in this chat checks for changed Track B release evidence and newly available original subtitles. It stays quiet when dependencies are unchanged and resumes candidate preparation only when evidence supports it. It does not message or mutate Track B and does not authorize deployment.

## Controls follow-up during the production hold

Native fullscreen entry/exit is now verified on all six eligible originals. Fresh evidence for 02, 03, 06 and 08 is in `evidence/controls-followup-2026-10-23/`; earlier 01/07 evidence remains intact. No product source changed. Volume range remains NOT VERIFIED because the inspection bridge does not expose numeric volume and the native slider cannot be set through accessibility. Track B is actively promoting production; the hourly follow-up must wait for a completed receipt before selecting an integration baseline. The production hold remains in force.
