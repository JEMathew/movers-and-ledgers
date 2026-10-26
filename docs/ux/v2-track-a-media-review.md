# Track A video accessibility review

20 October 2026. **Review material only; caption and equivalent-alternative gates remain open.**

Owner follow-up at approximately 16:52 IST: keep captions pending human review; do not publish an unverified transcript. No transcript, cue timing or meaningful-sound review has been approved.

## Local listening handoff: 10–16 seconds

Original file (unchanged):

`/Users/jincenmathew/Downloads/Intuit/movebooks-ai/apps/web/public/media/movebooks-ai-product-vision.mp4`

Open in QuickTime Player, seek to **00:10**, play and pause at **00:16**. Continue to approximately **00:17** to hear the end of the sentence. A local Terminal shortcut to open the original is:

```sh
open -a "QuickTime Player" "/Users/jincenmathew/Downloads/Intuit/movebooks-ai/apps/web/public/media/movebooks-ai-product-vision.mp4"
```

The proposed wording below is **unverified machine output**, not approved captions. Timings are machine estimates:

| Approximate time | Draft wording for listening review |
|---|---|
| 10.00–11.14 | “…before moving forward.” (“before” begins around 9.88s.) |
| 11.92–13.66 | “Your numbers are **[uncertain: ASR says ‘determinatively’]** verified,” |
| 14.38–16.00 | “while important decisions stay in…” |
| 16.00–16.58, context beyond requested segment | “…your control.” (“in” spans approximately 15.90–16.10s.) |

Confirm the uncertain word by listening; do not substitute a plausible adverb. The complete sentence proposed by ASR is “Your numbers are determinatively verified, while important decisions stay in your control.” Full-video transcript, cue timing and meaningful sounds still require human review even after this word is resolved. The original video, player implementation and draft VTT remain unchanged.

The approved 25.042-second MP4, poster, hero image, single play control and dialog are unchanged. Its SHA256 is `6ba11a2dfcdebe4f38750e0762349fc8d0ed766531ac6fc19b922d65abcc3ada`. The longer working-demo SRT files in `docs/submission` belong to a different recording and must not be attached to this video.

## What was examined

Local PyAV decoding confirmed an audio stream. Local faster-whisper `base.en` transcription produced six speech segments. The model was downloaded; the product audio was not sent to a transcription service. The output is retained as [raw machine evidence](../v2/release/evidence/ux-production-2026-10-20/track-a-gate-closure/audio-assessment.json) and an [unreviewed VTT draft](../v2/release/evidence/ux-production-2026-10-20/track-a-gate-closure/captions-unreviewed.vtt). Neither is served by the application.

Frame samples at approximately four-second intervals and the final frame were inspected. They show an illustrative transition from stacked computers, spreadsheets and paper records on the left to an accounting dashboard on a laptop on the right. The five stages illuminate sequentially. A warning symbol appears during the move sequence; later stages illuminate green. The final badge reads “BUSINESS READY · VERIFIED” and “Verified First Productive Use.” The laptop depicts example dashboard totals and a successful invoice state; these are conceptual video imagery, not measured results from the current viewer's migration.

The existing expandable description covers the title, tagline, phase names and three supporting statements. It does not transcribe the narration and does not describe the full visual transition or final secondary badge text. It therefore must not be treated as a verified complete equivalent alternative.

## Required caption review

The machine transcript contains uncertain words and timing. In particular:

- 3.46–6.14 and 21.98–24.54: it writes the brand as “Movebooks.ai”; confirm the spoken branding and use the approved written brand if appropriate.
- 11.92–13.66: it transcribes “Your numbers are determinatively verified.” The adverb requires listening against the original; do not silently replace it with a plausible word.
- The final word has a zero-length word timestamp even though the segment is longer. Confirm its actual onset/end and allow a readable final cue.
- Review all cue boundaries, speech accuracy, speaker identification if needed, and meaningful non-speech audio. A waveform or an ASR confidence score cannot establish these.

After review, split the longer draft segments into readable cues, serve a UTF-8 WebVTT track through the existing native player, and verify cue loading, synchronization, mobile controls and keyboard access. This can preserve the original encoded video and approved landing composition. It requires a new source identity and subsequent candidate validation. Do not count the draft file as a completed caption implementation.

## Proposed visual supplement for review

“This conceptual illustration begins with stacks of paper records and computers showing spreadsheets. Five cards connect that source material to a laptop with an illustrative accounting dashboard. They light up in order: Understand, Prepare, Move, Verify and Start. A warning symbol appears during the move sequence, and the later stages turn green. The closing badge says ‘Business ready · verified’ and ‘Verified First Productive Use.’ Dashboard totals and the invoice success illustration are part of the concept video, not evidence that your own migration or business has been verified.”

Combine an approved version of this supplement with the reviewed narration and existing on-screen text description to assess a complete media alternative. Do not change the video's historical claims or the application's capability rules in this workstream.

Missing synchronized captions remain a blocker for WCAG A/AA acceptance. Completeness of the media alternative remains an acceptance gate. Automated axe checks do not establish either requirement, and no full WCAG compliance or release waiver is claimed. The [existing disclosure review](v2-release-disclosure-drafts.md) retains the W3C references and legal-review boundaries.

## Final closeout review packet — no publication

All speech below remains **ASR-derived and pending listening review**. This is the complete proposed narration sequence, with the uncertain word explicitly withheld; it is not an accurate-final-transcript claim. Keep the raw ASR/VTT evidence unchanged. Do not copy the raw adverb into a served caption track.

| Draft cue interval | Proposed text for human verification |
|---|---|
| 00:00.000–00:02.960 | Moving your books shouldn't mean losing confidence in them. |
| 00:03.460–00:06.140 | MoveBooks AI helps you understand what you have, |
| 00:06.600–00:11.140 | prepare the move, migrate safely, and resolve blockers before moving forward. |
| 00:11.920–00:16.580 | Your numbers are **[WORD NOT VERIFIED]** verified, while important decisions stay in your control. |
| 00:17.440–00:21.240 | Then we help you configure, onboard, and complete your first real task. |
| 00:21.980–00:24.540 | MoveBooks AI, business-ready, verified. |

“MoveBooks AI” is proposed written-brand normalization, not a verified change to spoken wording. These six broad intervals are listening guides; the long cues need human-verified splits, not guessed word timing. Do not use “[WORD NOT VERIFIED]” as a final caption. Meaningful sounds and music remain unassessed for caption inclusion; do not invent labels such as “[upbeat music]”. No new transcription model or external audio processing was run for closeout.

Proposed complete alternative structure, for review alongside the original:

1. Identify this as the unchanged 25-second **conceptual Product Vision**, not a recording of a completed customer migration. Include the title and “From Migration Uncertainty to Business-Ready Accounting.”
2. Interleave the approved narration from the table with the observed visual sequence: paper/computer/spreadsheet source material → five stage cards → illustrative accounting dashboard. Review the ordering against the original before assigning exact visual time ranges.
3. Include all stage labels and subtitles: Understand (Discover + Assess); Prepare (Plan, Map & Approve); Move (Migrate + Resolve); Verify (Validate + Configure); Start (Onboard + First Real Task). Describe the warning during Move, subsequent green stages and the three human-control/validation statements already transcribed by the existing description.
4. Include the final “Business ready · verified” and “Verified First Productive Use” badge text. Explain that dashboard totals and invoice success belong to illustrative video imagery, not the viewer's verified business results.
5. Preserve the application's existing capability-accurate deterministic/Gemini-unavailable wording. Do not rewrite the historical narration into a stronger claim or certify live AI/financial execution from the concept video.

This structure plus the visual supplement above is a **draft alternative**, not a complete approved equivalent until the missing speech, ordering and essential information are checked. A text alternative does not automatically replace synchronized captions or satisfy every Level AA media requirement; the reviewer must also assess whether essential visual information needs audio description under the intended conformance target.

Approval record (all currently PENDING): reviewer/name and date; original MP4 hash; exact full transcript and unresolved-word resolution; cue-by-cue timing and reading pace; meaningful sound decisions; final alternative text/visual order; intended accessibility target and manual acceptance result. A wording-only approval is insufficient to approve timing or accessibility. After approval, the minimal prospective application scope is the existing HeroVideo component, its test, and one English VTT asset; keep MP4/poster/hero unchanged. See action A2 in the final closeout for benefit and evidence rationale.

## Inline playback update — local review, 20 October 2026

The owner subsequently requested inline playback in the hero frame. The proposed component now uses the unchanged desk photograph as its native poster, with explicit play, native controls, Replay after completion, Restore photograph and Escape/focus return. The MP4 is unchanged. A visible pending-captions notice and the existing limited visual description are available inside the player; neither is a reviewed equivalent alternative. No VTT track or uncertain narration has been published. A captions control cannot be accepted until a reviewed track is actually present. The narration/timing/sound/alternative approvals above remain required, including manual mobile Safari and assistive-technology acceptance after content approval.

## Final acceptance — manual media and assistive-technology procedure

The 20 October local error-recovery build is on port 3118; the prior port 3117 is preserved. No speech guess, new VTT or approved alternative has been published. The unresolved 11.92–13.66-second word remains unresolved; the six cue intervals and visual supplement above are the complete available draft packet, not verified final captions. Do not replace uncertainty with a plausible adverb.

After content approval, record the exact source/build, MP4 hash, browser/OS, assistive technology and reviewer. On actual iOS Safari and Android Chrome, verify explicit inline playback, native pause/seek/sound, no unwanted fullscreen, stable framing, Restore and replay. With keyboard only, Tab to named Play, activate with Enter and Space, pause/resume using native controls, reach Restore and Video description, and verify Escape returns to Play. With VoiceOver/Safari or NVDA/Chrome, verify names/order, media error announcement and focused Restore, expandable-description access, and no hidden duplicate player. Verify visible focus, 200% text/zoom and mobile pinch zoom without lost actions. Simulate media failure only in an approved local test and recover without changing the source URL.

After a human-approved VTT exists, turn captions on/off with native controls, verify cue order/timing/readability and meaningful sounds against the original, then assess the complete equivalent alternative and whether audio description is required for essential visuals. Record each outcome rather than treating an axe scan or a wording-only approval as acceptance. This procedure is prepared; real-device/screen-reader/caption acceptance is NOT RUN/BLOCKED.
