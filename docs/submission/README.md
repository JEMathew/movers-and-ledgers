# Submission packaging

Reviewable content package, 17 October 2026. **Not a completed official submission.** The exact prescribed PowerPoint template has been located, preserved and populated. The primary review deck retains its 16-slide structure, branding and fonts. The confirmed roster is Team name **MoveBooks AI**, Team lead **Jincen E Mathew**, Team member **Kunal Nangia**. Contact remains explicitly pending owner input; the authorized public video link, deployed-candidate acceptance and portal acceptance remain open. The [selected BFSI challenge](problem-statement.md) is user-confirmed.

- [Official-template PowerPoint review deck](assets/movebooks-official-template-review.pptx)
- [Official-template PDF review deck](assets/movebooks-official-template-review.pdf), 16 pages, **2,347,471 bytes**, below the 5 MB limit
- [Preserved official source template](source/Submission%20Template%20%7C%20AI%20Builder%20Cup.pptx) and [template provenance](template-provenance.md)
- Earlier 15-slide content drafts, retained as historical preparation: [PowerPoint](assets/movebooks-submission-draft.pptx), [PDF](assets/movebooks-submission-draft.pdf)
- [Product description](product-description.txt), 953 characters before trailing newline
- [Authentic working-product video](assets/working-product-demo.webm), **3:51.88**, silent with visible captions
- [Matching captions](assets/working-product-demo.srt) and [capture/provenance/QA](browser-journey/README.md)
- [Planning storyboard](video-storyboard.md) and [superseded draft captions](video-captions-draft.srt), retained as preparation
- [Acceptance and release matrix](acceptance-report.md)
- [Machine-readable evidence manifest](evidence-manifest.json)
- [Independent Product Quality Judge](product-quality-judge.md)
- [Current cloud inspection and disclosed Firestore auto-enablement incident](cloud-inspection-2026-10-17.md)
- [Firestore provisioning proposal](../security/firestore-provisioning-proposal.md), including retained API drift, costs and staged approval
- [Scoped cloud validation and release authorization plan](release-authorization-plan.md)
- [Packaging status and open submission checks](packaging-status.md)
- [Packaging validation record](packaging-validation.json)
- [Independent model-control and Reviewer review](independent-model-control-review.md), 36 focused checks passed
- [PM artifact index](../product-management/README.md), [Working Backwards](../working-backwards/README.md), [editable diagrams](../architecture-experience/README.md)

The official-template deck retains editable text and native process/architecture diagrams, accepted local screenshots and the current dormant Google Cloud architecture PNG. All 16 source slides and filled slides were inspected; the exported PDF was rendered and inspected page by page. Package, geometry, font and first-party import validation [passed](evidence/official-template-finalization.json). Native PowerPoint desktop behavior and portal acceptance have not been tested. No invented impact, adoption, accuracy, competitor result or financial cost appears.

The accepted full-journey checkpoint remains explicit: core `1a24a2c`, **584 backend passed / 58 skipped**, **674 frontend passed / 51 files**, lint/types/build passed, **17/17** complete browser checks and **14/14** Play checks. Control-only follow-up `0c189f2` has **594 backend passed / 58 skipped** and is identified separately in the new deck. The current local Phase B checkpoint `6575004` is **628 backend passed / 71 skipped in 28.95 seconds**, with **13 emulator skips separately passed in 3.04 seconds** and **8 actual Firebase Web SDK denial checks**. The remaining **58 original optional/external checks are unverified**. See [the versioned Phase B evidence](firestore-phase-b-local.md); these results do not establish live cloud/IAM or inference. Dormant Firestore provisioning is documented separately and does not imply live application or model activation.

The video records API `fffd14c`; the newer source `1a24a2c` has a separate full acceptance run. Gemini/Reviewer explanations in the footage use explicitly labeled deterministic fallbacks. The final architecture segment is source evidence rather than a live cloud-console session. Public video publication and current cloud acceptance remain gated.

## Reproduction

Use the bundled Node runtime and `@oai/artifact-tool`. Copy [fill-official-template.mjs](source/fill-official-template.mjs) to an ignored `.packaging-build/official-template/` directory and symlink its `node_modules` to the bundled packages. Run from repository root with `RUNTIME_NODE_MODULES` and `RUNTIME_NODE` set. The script validates the exact template SHA-256, imports the source, fills the existing structure, renders all 16 slides, then runs package/geometry/font/import finalization. It deliberately refuses to overwrite an existing final PPTX or receipt; choose new review filenames for a new revision.

[export-official-template-pdf.py](source/export-official-template-pdf.py) assembles exactly 16 rendered slides and enforces the 5 MB limit. The PDF is a faithful raster export; the PowerPoint retains editable objects. [The earlier authoring sources](source/build-deck.mjs) and their PDF helper remain historical preparation. Diagram Mermaid/SVG sources remain independently editable. Build/render intermediates stay under the existing ignored `.packaging-build/` directory.

## Release conditions

Fill the pending contact field when supplied, review all candidate claims in the populated official template, verify the prototype and public repository links, publish the accepted 3:51.88 video only under release approval, and verify the resulting accessible link and portal compatibility. Script, captions, conceptual artwork and historical screenshots are preparation and evidence sources, not substitutes for the required final video. Public release, model/cloud activation and hosted upload authorization remain separate gates.
