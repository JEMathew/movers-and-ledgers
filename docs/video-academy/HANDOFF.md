# Video Academy v1 — Track C handoff

Implementation status: **six original videos play in the local review preview; caption acceptance remains blocked on original SRT access**.

Latest release coordination: [media-path correction and pending candidate](RELEASE-COORDINATION.md). Latest complete verification: [PASS/FAIL/NOT VERIFIED acceptance report](ACCEPTANCE.md). Recommendation: **NO-GO for production handoff**.

## Branch and baseline

Worktree: `movebooks-video-academy`, branch `feature/video-academy-v1`.
Baseline: `b20ef66` (`integration/ux-gemini-v2-local`), the committed combined UX/Gemini source with approved disclosures. This is a development integration baseline, not production approval. Track A/B and private acceptance worktrees were not edited. No merge, deployment, IAM change, media generation or credit expenditure occurred.

Before eventual integration, compare this feature against the final owner-approved release commit, especially Learn, task utilities and public disclosures. Private acceptance overlay changes and subsequent Track B proofs remain independently controlled.

## Delivered behavior

- Existing `/learn` and navigation with exactly two tabs; Video Guides defaults, old concept fragment links open Learn the Concepts.
- Nine entries in four collections; 3/2/1-column desktop/tablet/mobile layout. Six originals have real extracted posters and measured runtimes. Three review cuts remain unavailable.
- All ten original topics, copy, questions, accordions, task return, Synthetic Beta and legal notices preserved. Accordion state survives tab switches.
- Native inline MP4 player with original AAC audio, controls, speed, keyboard play/pause/seek/mute, loading/error/retry and conditional WebVTT captions. No autoplay; selection mounts the player and changing tabs removes it.
- Watch guide links in task utilities (Understand, Prepare, Move, Verify, Start), Explore Demo and Trust. Valid session/stage context retained; Gemini review-cut links omitted; no workflow writes introduced.
- Landing page, hero photo, overview MP4, both CTAs and original concept content unchanged (hashes in `preservation.json`).
- Server-only media manifest; no actual media is approved for production. Approved production bundles now use the same origin and route as development. Local files stay outside Git. Media routes enforce lesson/extension allowlists, realpath containment, byte ranges, MIME, no-store and nosniff. Videos 04/05/09 return 404 even with injected approval metadata. Missing/unverified captions do not expose a VTT route or a phantom track.

## Actual source assets and limitations

macOS denied access to the original Downloads folder even after escalation. The latest user request explicitly renewed permission to retrieve original Higgsfield assets. Nine original MP4 uploads were downloaded once into `/Users/jincenmathew/Downloads/Intuit/movebooks-academy-media/`, identified by actual title frames, hashed and fully decoded. No upload order assumptions, generated footage, transcription or paid credits were used. The original Downloads folder was not modified.

All nine files are 1920×1080 H.264 with stereo 48 kHz AAC and non-silent audio. All passed full FFmpeg decoding. Six byte-identical MP4 copies and extracted JPEG posters are in `review-preview-v1/`. The three restricted MP4s are absent from the serving directory. Source hashes were rechecked unchanged after preview work.

**All retrieved videos visibly include a REVIEW CUT watermark**, including the six listed as completed in owner inventory. The six therefore play only in an explicitly labeled local review mode; none received publication approval. Title and sampled middle frames were inspected, but comprehensive sensitive-content review, exact release-UI fidelity and Cillian narrator identity are not certified.

No MP4 has an embedded subtitle stream. Accessible Higgsfield project data did not expose the accompanying SRT files. Captions remain unavailable; the UI states this plainly and emits no caption track. No subtitle text was invented.

**Remaining owner action:** copy the original `Subtitles` folder into `/Users/jincenmathew/Downloads/Intuit/movebooks-academy-media/source/`. There is no need to download or regenerate the nine videos again. Then map the originals to these verified identities, convert SRT to VTT and check beginning/middle/end synchronization in the actual player.

## Preview configuration

Running preview: http://127.0.0.1:3107/learn (local machine only).

The ignored `apps/web/.env.development.local` points to external preview assets:

```dotenv
MOVEBOOKS_ACADEMY_MEDIA_DIR=/Users/jincenmathew/Downloads/Intuit/movebooks-academy-media/review-preview-v1
MOVEBOOKS_ACADEMY_REVIEW_PREVIEW=1
```

The second flag additionally requires per-lesson `reviewPreviewAllowed: true` and passed technical checks. It only works with `NODE_ENV=development`; it cannot expose 04/05/09. All external manifest entries keep `previewApproved: false`, `publicationApproved: false`, and `captionsVerified: false`. These local files and environment settings are not committed or shipped with the feature branch.

Start from `apps/web` using `./node_modules/.bin/next dev -H 127.0.0.1 -p 3107`. This session reused identical-baseline installed dependencies through an ignored node_modules symlink; no lockfile changes. Free FFmpeg/ffprobe was installed from Homebrew for inspection and poster extraction.

## Validation and evidence

**310 tests across 20 files, typecheck, lint and production build passed.**

```sh
cd apps/web
npm run test -- components/academy/academy.test.tsx lib/academy/media.test.ts components/public-surfaces components/journey
npm run typecheck
npm run lint
npm run build
```

Real in-app browser verification:

- All six eligible originals loaded and progressed with original audio enabled; lesson 03 reached its end. This proves browser playback and enabled audio, not a human voice-identity audit.
- Play/pause, keyboard seek, mute/unmute and 1.5× speed exercised. Subsequent acceptance verified native fullscreen entry/exit on 01 and 07; the other four remain unverified. Inline tab cleanup was independently retested. See ACCEPTANCE.md for exact coverage.
- Both tabs, all nine tiles, ten original topics and accordion behavior; desktop 1440px, tablet 768px and mobile 390px, 3/2/1 columns without horizontal overflow; light and dark appearances.
- Earlier focused browser check covered original landing photo/CTAs, local demo sign-in and `/assess` Watch guide → lesson 02. No migration was advanced.
- Actual six MP4 endpoints returned 206 byte ranges with video/mp4; restricted 04/05/09 returned 404. Boundary tests additionally cover absent caption routes, traversal, symlink containment and production denial.

Current screenshots and browser/HTTP receipts are under `evidence/media-review/`; screenshots directly under `evidence/` are historical UI-only evidence. `media-manifest.json` records each source hash, runtime, codec, audio check and remaining gap. `evidence-sha256.json` indexes the captured files.

Hosted identity isolation and financial execution were not rerun; their implementations are unchanged. Full media acceptance remains incomplete without original captions, synchronization and human content/narration review.

## Completing captions without changing sources

Create an external source map such as `{"01":{"video":"/absolute/original.mp4","captions":"/absolute/original.srt"}}`, using the verified title mapping in `media-manifest.json`. With ffmpeg/ffprobe on PATH:

```sh
python3 scripts/prepare-academy-media.py /absolute/source-map.json /absolute/new-preview-media
```

The script validates H.264/AAC/1080p, runtime tolerance, full decoding and SRT cue order/bounds, computes hashes, converts existing SRT to VTT and extracts JPEG posters. Original files are read-only inputs. Review-cut MP4s/posters/captions are never copied into the serving directory. It leaves `previewApproved` and `captionsVerified` false until actual human content and synchronization checks. Set them true only after those checks for eligible lessons; this remains separate from publication approval. The complete script awaits real SRT inputs; original MP4 technical validation was performed independently in this session.

## Publication gates

1. Verify original subtitles, Cillian narration identity, caption synchronization, exact approved release UI and sensitive-content absence.
2. Complete Track B genuine Advisor/independent Reviewer captures for 04/05/09, with capability/fallback labeling and human approval. Their hard restrictions require a separately reviewed change.
3. Package only the approved six-video bundle outside public/ in the future web-only image, with MOVEBOOKS_ACADEMY_MEDIA_DIR pointing to /app/academy-media. Keep existing same-origin /api/academy-media URLs; no CDN, DNS, IAM or Hosting change is needed. Verify real MP4/VTT/JPG bytes and range behavior on that exact candidate.
4. Production serving requires publicationApproved, technicalChecksPassed and captionsVerified for each eligible lesson, plus MP4/JPG/VTT presence. Review-preview flags do not bypass this. Current real assets remain unapproved and unavailable in production. Obtain final publication/deployment authorization only after a fully reviewed candidate is prepared.
5. Compare against the final integrated release, repeat relevant browser QA and obtain release-owner approval. Do not merge or deploy this feature automatically.
