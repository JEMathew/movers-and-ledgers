# Video Academy v1 — Track C handoff

Implementation status: **partial; UI and publication boundary verified, media acceptance blocked**.

## Branch and baseline

Worktree: `movebooks-video-academy`, branch `feature/video-academy-v1`.
Baseline: `b20ef66` (`integration/ux-gemini-v2-local`), the committed combined UX/Gemini source with approved disclosures. This is a development integration baseline, not a claim of production approval. The older `movebooks-prod-candidate` directory is not the latest integrated source. Active private acceptance overlay and Track A/B worktrees were not edited. Their uncommitted evidence was not copied. No merges, cherry-picks, deployment, permissions changes or cloud calls were performed.

Before eventual integration, compare this feature against the final owner-approved release commit, especially Learn, task utilities and public disclosures. Private acceptance overlay changes and subsequent Track B proofs are independently controlled.

## Delivered behavior

- Existing `/learn` and navigation, with exactly two tabs; Video Guides defaults, old concept fragment links open Learn the Concepts.
- Nine metadata entries in four collections; 3/2/1-column desktop/tablet/mobile layout. Missing assets are explicitly unavailable. Inventory durations are shown until measurements exist.
- Original ten topics, explanatory copy, questions, accordions, task return, Synthetic Beta and legal notices preserved. Open accordions persist when switching tabs.
- Native inline player prepared for MP4/AAC, posters, English WebVTT, native controls/fullscreen, playback speed, keyboard controls, loading/error/retry. No autoplay; no video element is mounted until selected; changing tabs unmounts playback. **Real Academy playback is not verified.**
- Watch guide links in the real task utilities (Understand, Prepare, Move, Verify, Start), Explore Demo and public Trust. Valid session/stage context is retained. Gemini review-cut links are omitted. No API mutations or workflow state writes are introduced.
- Existing landing page and Learn more link unchanged; that link now reaches Video Guides by default. Hero photo, overview MP4, both CTAs and existing attribution unchanged.
- Central server-only media registry; production publication is empty/closed. Local preview media is outside Git and served only in development. Exact lesson/extension allowlists, realpath containment, range requests, MIME headers, no-store and nosniff. Review cuts 04/05/09 return 404 even when their files and approval flags exist.

## Preview and verification

Running UI preview: http://127.0.0.1:3107/learn (local machine only).

Reproduce from repository root:

```sh
cd apps/web
npm ci
npm run typecheck
npm run lint
npm run test -- components/academy/academy.test.tsx lib/academy/media.test.ts components/public-surfaces components/journey
npm run build
./node_modules/.bin/next dev -H 127.0.0.1 -p 3107
```

This session reused the existing identical-baseline installed dependencies via an ignored node_modules symlink; no package/lockfile changes.

Verified: **308 tests across 20 files passed**, typecheck, lint, production build. The new range/publication tests use synthetic bytes and do not prove codec or playback compatibility. Player unit tests cover selection, no autoplay, tab cleanup, controls and failure handling. The preparation script was syntax checked; it has not been run against the missing Academy sources.

Real in-app browser: nine cards; two tabs; original accordion expansion and retained state; keyboard tab navigation; 1440px/768px/390px layouts (3/2/1 columns, no horizontal overflow); light and dark themes; original landing photo/CTAs; local demo sign-in and `/assess` Watch guide → lesson 02. No migration was created or advanced. No browser console errors were reported in the final inspection. This does not certify hosted identity isolation or financial execution; their implementation is unchanged.

Screenshots are in `evidence/`. Source/asset byte preservation hashes are in `preservation.json`. Asset-by-asset approval and QA gaps are in `media-manifest.json`.

## Media blocker and next owner action

Accessible project folders contained existing product/demo recordings but no nine-lesson Academy source set. macOS rejected broader Downloads enumeration, including an escalated attempt. Higgsfield returned nine recent upload candidates, but a request to download one for identification and validation was rejected by the user. No workaround was attempted. No generation, credits, uploads, or public media publication occurred.

**Next owner action:** place the original nine named MP4s and matching SRTs in `/Users/jincenmathew/Downloads/Intuit/movebooks-academy-media/source/`, which is within the authorized workspace, then resume asset verification. Alternatively explicitly authorize the previously rejected download; original SRT access will still be needed. Do not infer lesson identity from upload ordering.

Actual runtime, codecs/resolution, Cillian voice, audibility, caption synchronization, UI fidelity, sensitive-content review and source hashes are **unverified for all nine**. Placeholder frames are explicitly labeled; no substitute media or invented captions are used.

## Safe local media preparation

Create an external source map such as `{"01":{"video":"/absolute/01.mp4","captions":"/absolute/01.srt"}}`. Map identities only after checking titles/content. With ffmpeg/ffprobe already available, run:

```sh
python3 scripts/prepare-academy-media.py /absolute/source-map.json /absolute/new-preview-media
```

It validates MP4/H.264/AAC/1080p, inventory runtime tolerance, full decode and SRT order/bounds, computes SHA-256, converts existing SRT to browser VTT and extracts real poster frames. It never generates audio or video. Review-cut MP4s/posters/captions are never copied into the serving directory. The script leaves `previewApproved: false` for every entry. After actual human narration, synchronization, UI and sensitive-content review, set that field true only for the six completed lessons in the external manifest. This preview approval is separate from publication approval.

```sh
cd apps/web
MOVEBOOKS_ACADEMY_MEDIA_DIR=/absolute/new-preview-media ./node_modules/.bin/next dev -H 127.0.0.1 -p 3107
```

Then test each of the six videos in an actual browser: play/pause, scrub/end/replay, audible narration, captions at beginning/middle/end, speed, mute/volume, fullscreen and keyboard, network failure/retry, mobile and tab switching. Record runtime, hashes, tests and human reviewer in the manifest. No playback PASS exists yet.

## Publication gates

1. Verify source identity and every media QA item; use exact approved release UI. Human check that narration is Cillian and the content contains no sensitive material.
2. Complete Track B genuine Advisor/independent Reviewer captures for 04, 05 and 09, with actual capability/fallback labeling and human approval. Review-cut metadata and route restrictions must remain until a separately reviewed change.
3. Choose existing approved stable HTTPS object storage/CDN; no temporary CloudFront permanence assumption. Test video/mp4, text/vtt, image/webp, byte ranges and cross-origin access as needed. No new paid service or cloud/IAM change is authorized.
4. Obtain explicit owner publication and deployment approval, then add only approved HTTPS URLs to the server registry. Local paths are disabled in production; empty publication registry means all lessons stay unavailable on a production build.
5. Verify compatibility against the final integrated release, repeat browser/media QA, and obtain release-owner approval. This branch must not be merged/deployed automatically.

Acceptance remains partial until actual audio/captions/posters and six playback paths are verified. A pushed UI branch is not media publication or production readiness.
