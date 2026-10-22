# Track C release coordination — 23 October 2026

Latest owner-scope verification: [FINAL-READINESS.md](FINAL-READINESS.md). Current production was read back; 04/05/09 now have demonstrable stale Gemini UI evidence and remain restricted. Missing matching captions/transcripts still block the nine-video release. Historical evidence below is retained.

**NO-GO for publication. Track C source is integrated with the confirmed released Gemini web baseline. The final media-bearing image still awaits original subtitles, content review and the remaining acceptance gates.** Machine-readable state: [release-candidate.json](release-candidate.json).

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
| Exact released Gemini web revision and source integration | PASS | Track B deployment receipt confirms movebooks-beta-web-b20-live-sdk1 at 100%, serving digest sha256:617b943f3abc4e1e32400b765d1867d173941308f494947097990defec52e0ad. All 228 frozen source files compared; its exact live-status selector is preserved. Authenticated public Gemini execution proof remains pending. |
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

## Released baseline integration

Track B's `DEPLOYMENT-RECEIPT-PENDING-PUBLIC-PROOF.json` records the completed promotion. Its exact web source is `b20ef668736a520387753dee4c8c19e4f66ae8da` plus the one-line approved live-status selector. Track C copied that exact file; every other runtime difference from the 228-file released source inventory is confined to Academy integration and its additive guide links, styles and Learn caching. AI components, API proxy, identity, package lock, Dockerfile and release inputs remain byte-identical to the released source. This does not claim that the pending public inference verification has passed.

The integrated build uses the released Firebase identity, same-origin `/api`, synthetic-analysis enablement, project and auth-domain build settings. No production environment was changed. A localhost-only build smoke test returned private/no-store for `/learn`, all nine tiles and both tabs, and denied all 27 current unapproved media URLs even with the development review flag present.

A broader regression run exposed `/learn` still listed as static HTML after Track C made it dynamic. The only middleware correction removes `/learn` from that cache list; protected prefixes, identity checks and route matcher are unchanged. Tests now check that Learn retains Next's private/no-store policy. Eight test files had historical Planned expectations; only those expectations were aligned with the exact released limited-live status, retaining strict labels and all finance/invocation assertions.

552 focused tests across 36 files, typecheck, lint and the production-source build pass. Three unrelated footer/copy assertions also fail on a fresh, byte-identical copy of the released source: two expect the old Contact-only footer and one rejects the released synthetic-analysis capitalization. They remain unchanged and explicitly recorded in the full-suite and baseline-comparison logs. No test failure was hidden by changing the product or release controls.

Evidence is in `evidence/released-baseline-2026-10-23/`. The current web-only rollback reference is `movebooks-beta-web-b20-live-sdk1` at `sha256:617b943f3abc4e1e32400b765d1867d173941308f494947097990defec52e0ad`; revalidate it immediately before any future approved publication. Preserve the serving Gemini API and its policy/campaign. No Track C image has been built or published yet, since the required approved MP4/JPG/VTT bundle is still incomplete. The exact final image digest remains null.
