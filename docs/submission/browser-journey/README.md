# Authentic local UI acceptance and working-product video

**Final video: 3 minutes 51.88 seconds, 1440 × 1000, 25 fps VP8 WebM, silent with visible captions and an SRT sidecar.** The official 3–4 minute requirement is met. This is continuous real UI footage; it is not a screenshot montage, concept film or simulated financial outcome.

- [Working-product video](../assets/working-product-demo.webm)
- [Matching captions](../assets/working-product-demo.srt)
- [Video manifest and SHA-256](recording/video-manifest.json)
- [Recorded acceptance trace](recording/browser-evidence.json): 15 passing checks.
- [Latest-source UI acceptance](dryrun/browser-evidence.json): 17 passing checks in 17.9 seconds.

## Source and runtime truth

The video started with Git HEAD `74066efbf4818fb4d5b769abd72c496069f2f817`; the API process remained on `fffd14c246dcec58347ac2b3155e2cf51b2b9662` throughout recording. The later read-only advisory operations changes are excluded from the video’s API-runtime claim.

After the final recording ended, the API restarted on `1a24a2ce45ab2814d2f2f26628c64fc05cb19abc`. A new browser and synthetic session completed the full governed journey again and separately verified the new Trust panel: zero automatic operational reads, then exactly one explicit GET returning HTTP 200 and **Operational Activity Is Disabled**. See the latest-source trace and [actual disabled-panel screenshot](dryrun/trust-explicit-disabled-advisory-operations.png).

Both runs use the explicitly entered local demo identity. The local browser origin is `http://localhost:3000`, with the API on port 8000. No deployed-candidate, live Gemini, Firestore availability or production-provider execution is claimed.

## What was actually exercised

Play: keyboard-controlled office, desk/ledger/cabinet evidence, a wrong Bank mapping and correction to clearing. Try Your Data: an actual template ZIP download, real browser-local rejection of an intentionally unbalanced synthetic journal, replacement by the downloaded ZIP, passing validation and explicit local review while hosted workspace creation remains unavailable.

Canonical Harbor Light journey: explicit demo sign-in, discovery and readiness, versioned planning, all 12 mapping confirmations, 1200 independent second opinion, an explicit advisory request with deterministic-fallback labels, separate plan consent, synthetic migration, duplicate-resolution approval and checkpoint retry, 17 matching deterministic validation checks, all eight configuration areas, required sensitive approvals, onboarding decisions, invoice preparation, explicit invoice approval, posting and Verified First Productive Use. The verified synthetic invoice is USD 100.00 + 7.25 tax = 107.25.

All financial actions came from actual UI buttons. The script never directly creates or changes financial API/session state, supplies fake API responses or injects success data. Response logging retains method/path/status only. The final architecture segment is a clearly labeled source diagram with runtime boundaries, not a fictional cloud-console session.

## Capture and visual QA

Representative frames across all stages were exported and inspected in [qa-frames](recording/qa-frames). The fixed-viewport capture keeps UI text readable. Only the Next.js development indicator was hidden. A noninteractive narration layer was added during capture; sidecar SRT timestamps follow observed narration events. The encoded video retains the final architecture frame after the 222-second UI clock; the final SRT cue covers the observed encoded tail.

An earlier capture passed functional checks but had a screenshot-induced resize artifact. Its trace, raw footage and reason are explicitly labeled under [superseded-resize-capture](superseded-resize-capture/README.md). It is not the accepted video. No stale `FAILURE.png` remains in the accepted dry run.

## Reproduce

With the approved local web/API processes running, use the bundled Node runtime to run [accept-and-record.cjs](accept-and-record.cjs). The script loads [entry-experiences.cjs](entry-experiences.cjs), uses installed Chromium 1228 explicitly, and requires the actual UI’s local demo sign-in. Use `--operations` for the fast latest-source acceptance, or `--record` for a new timed authentic capture. Each run creates a fresh synthetic migration through the UI.

After a recording, run [finalize-recording.py](finalize-recording.py), inspect the exported QA frames, then pass `--accept-visual-qa` only after review. This copies the authentic WebM unchanged, probes its duration, exports stills and aligns the sidecar’s final cue to the encoded duration. It does not reencode, substitute or fabricate footage.

The video is silent; no microphone or narration voice was recorded. Browser behavior was exercised through automation, not a user study or a screen-reader session. Public-link acceptance and release authorization remain separate from this local evidence.
