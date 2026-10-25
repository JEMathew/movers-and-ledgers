# MoveBooks AI Video Academy

[**Open all nine video guides**](https://movebooks-si.web.app/learn?tab=videos) · [Repository overview](../../README.md) · [Evidence status](../showcase/EVIDENCE.md)

Start with [**Three-Minute Journey**](https://movebooks-si.web.app/learn?tab=videos#lesson-09),
the current hosted product walkthrough. Its exact title is retained; its measured runtime is
**2:49.007**. This is distinct from the earlier final-demo V2 submission film.

## Nine published modules

**A — publicly available; checked 24 October 2026 IST.** Titles and learning objectives come
from the actual Academy catalogue. Durations are measured from the approved MP4 files with
`ffprobe`, rounded below to the nearest second. Phase associations are documentation guidance.

| # | Exact title | Learning objective | Duration | Migration phase | Video | Captions |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | Getting Started | Find your way around the demo and take your first step with synthetic books. | 1:28 | Understand | [MP4](https://movebooks-si.web.app/api/academy-media/01/mp4) | [English VTT](https://movebooks-si.web.app/api/academy-media/01/vtt) |
| 02 | Understand Your Migration | Read the migration scope, source evidence and items that need attention. | 1:10 | Understand | [MP4](https://movebooks-si.web.app/api/academy-media/02/mp4) | [English VTT](https://movebooks-si.web.app/api/academy-media/02/vtt) |
| 03 | Prepare and Approve | Review mappings and make informed decisions before your books move. | 1:34 | Prepare | [MP4](https://movebooks-si.web.app/api/academy-media/03/mp4) | [English VTT](https://movebooks-si.web.app/api/academy-media/03/vtt) |
| 04 | Gemini Advisor | Understand AI suggestions, their evidence and the decisions that stay yours. | 1:04 | Prepare (mapping) | [MP4](https://movebooks-si.web.app/api/academy-media/04/mp4) | [English VTT](https://movebooks-si.web.app/api/academy-media/04/vtt) |
| 05 | Independent Gemini Reviewer | See how independent review checks advice without replacing financial controls. | 1:07 | Prepare (mapping) | [MP4](https://movebooks-si.web.app/api/academy-media/05/mp4) | [English VTT](https://movebooks-si.web.app/api/academy-media/05/vtt) |
| 06 | Move and Verify | Follow migration checkpoints, resolve blockers and inspect reconciliation. | 1:31 | Move → Verify | [MP4](https://movebooks-si.web.app/api/academy-media/06/mp4) | [English VTT](https://movebooks-si.web.app/api/academy-media/06/vtt) |
| 07 | First Productive Use | Complete your first synthetic task and check the evidence of readiness. | 1:30 | Start | [MP4](https://movebooks-si.web.app/api/academy-media/07/mp4) | [English VTT](https://movebooks-si.web.app/api/academy-media/07/vtt) |
| 08 | Trust and Troubleshooting | Understand safeguards, find evidence and return safely to a paused task. | 1:30 | All stages | [MP4](https://movebooks-si.web.app/api/academy-media/08/mp4) | [English VTT](https://movebooks-si.web.app/api/academy-media/08/vtt) |
| 09 | Three-Minute Journey | A guided overview from understanding your books to verified first use. | 2:49 | Understand → Prepare → Move → Verify → Start | [MP4](https://movebooks-si.web.app/api/academy-media/09/mp4) | [English VTT](https://movebooks-si.web.app/api/academy-media/09/vtt) |

Captions are available through the player's CC controls; each player also links an English
transcript. The nine SRT source files remain in the approved local archive. The public endpoint
serves VTT, not SRT; no nonexistent SRT hosting link is supplied.

## Verification and scope

**25 October release closeout:** all nine modules and their approved caption links are retained.
Watch-guide playback remains usable; the thumbnail defect is explicitly deferred and is not one
of the four MVP acceptance blockers. The checks below retain their original 24 October scope;
this documentation update does not rerender media or repeat full playback/narration QA.
A read-only link recheck on 25 October passed for all nine MP4, VTT and transcript URLs.
MP4 signatures were valid; all nine VTT hashes still match the approved manifest.
These bounded requests do not repeat the earlier complete-file video hash checks.
[Current release and functional acceptance](../showcase/EVIDENCE.md).

- All nine local MP4 SHA-256 hashes and SRT hashes match the approved bundle manifest. All have H.264 video and AAC audio.
- All nine SRT files have ordered, non-overlapping cues within their measured duration: 25, 21, 28, 22, 18, 26, 29, 27 and 53 cues respectively.
- All nine public video, VTT and transcript requests succeeded. Public VTT hashes match the approved bundle. All nine public full-file MP4 hashes match the approved local files. Initial range requests returned HTTP 200/full files for 01–08 and HTTP 206/a matching 4,096-byte prefix for 09; a separate full GET then verified 09.
- The actual public Academy rendered nine cards; the 09 player loaded its 169.007-second duration and English caption track. Playback of 09 progressed from 0 to 18.879 seconds with English captions enabled, then was paused. Complete viewing, audio listening and word-level timing were not independently repeated for all nine.
- Earlier publication acceptance records describe full decoding and public playback/caption checks. Those private operational receipts are not republished or substituted for this audit's own checks.

[Machine-readable metadata and public checks](manifest.json) ·
[Actual Academy screenshot](../showcase/assets/academy-public-20261024.jpg).

The catalogue comes from pushed branch `feature/video-academy-v1`, inspected at `dbdd07f`;
original Academy implementation image source was `5515ee1`. The later accepted web release
is `movebooks-beta-web-p004-555eaac`; its image identity is recorded in the linked MVP receipt.
The Academy branch is not merged into the audited main baseline.
Public availability is independently supported by the current page/media responses, not inferred
from the branch or an approval flag. Corrected lessons 04/05/09 are the reviewed published cuts;
obsolete originals remain excluded. Lessons demonstrate bounded synthetic behavior, not universal
Gemini access or real accounting-provider migration.

## Separate product-demo archive

| Asset | Verified inventory | Publication decision |
| --- | --- | --- |
| `movebooks-ai-final-demo-v2.mp4` | 175.000 seconds; 1920 × 1080 H.264/AAC; matching `movebooks-demo-v2.srt` has 32 ordered cues ending at 174.600 seconds; 24,860,666 bytes; SHA-256 `ceba55df6bad7b77b14859442c562d058ccc5022b0899ded82a6e05099576a79` | Found in the local submission final-demo collection. No verified public URL; do not invent one. |
| `movebooks-final-demo-v2-delivery.zip` | 46,427,306 bytes; SHA-256 `85981359af59e4316a14437eb96b6ffc66a518e3ecfd1e63cd4154f45e02e15f` | Local delivery archive; excluded from Git history. |
| [Existing repository walkthrough](../submission/assets/movebooks-demo.mp4) | Earlier 3:43.7 local synthetic recording with [journey evidence](../submission/final-experience/evidence/journey-fa13e9e/README.md) | Existing public historical asset retained; not final-demo V2. |

Final-demo V2's 02:30–02:50 segment is an editorial summary of an owner-reported **separate harness**
result, not live Gemini footage. Its “hosted Beta remains deterministic-only” narration is dated.
Any future upload must preserve that historical context or receive a separately approved update.
No new release or media upload was made; the existing GitHub v1.0.0 release has no media assets.

Original asset archive: **My Drive / MoveBooks AI/ EMOS**. This refresh did not access, alter or
validate the Drive collection. Supplied narration is retained; narrator identity is not independently
certified. The portfolio links existing approved hosting and adds no video duplicates to Git.
