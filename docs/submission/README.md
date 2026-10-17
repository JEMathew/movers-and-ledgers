# Submission packaging

Reviewable content package, 17 October 2026. **Not a completed official submission.** The prescribed `Submission Template | AI Builder Cup.pptx` has not been located. The editable deck below follows the supplied section list, but exact-template compliance remains open. Team roster/contact still requires owner input. The [selected BFSI challenge](problem-statement.md) is user-confirmed.

- [Editable PowerPoint content draft](assets/movebooks-submission-draft.pptx)
- [PDF content draft](assets/movebooks-submission-draft.pdf), 15 pages, below the 5 MB portal limit
- [Product description](product-description.txt), 953 characters before trailing newline
- [Authentic working-product video](assets/working-product-demo.webm), **3:51.88**, silent with visible captions
- [Matching captions](assets/working-product-demo.srt) and [capture/provenance/QA](browser-journey/README.md)
- [Planning storyboard](video-storyboard.md) and [superseded draft captions](video-captions-draft.srt), retained as preparation
- [Acceptance and release matrix](acceptance-report.md)
- [Machine-readable evidence manifest](evidence-manifest.json)
- [Independent Product Quality Judge](product-quality-judge.md)
- [Scoped cloud validation and release authorization plan](release-authorization-plan.md)
- [Packaging status and open submission checks](packaging-status.md)
- [Packaging validation record](packaging-validation.json)
- [Independent model-control and Reviewer review](independent-model-control-review.md), 36 focused checks passed
- [PM artifact index](../product-management/README.md), [Working Backwards](../working-backwards/README.md), [editable diagrams](../architecture-experience/README.md)

The PPTX retains editable text and a native architecture diagram. It includes authentic local Play, independent-review and verified-FPU screenshots. The PDF is a faithful raster export of the rendered deck, **1,412,574 bytes**, 15 pages. Native PowerPoint desktop behavior has not been tested. No invented customer impact, adoption, accuracy, competitor result or financial cost appears. Final local regression: **584 backend passed / 58 skipped**, **674 frontend passed / 51 files**, lint, types and production build passed; complete latest-source browser acceptance passed **17/17**, and Play passed **14/14**. [Finalization checks](evidence/presentation-finalization.json) passed package, geometry, font and first-party import validation.

The video records API `fffd14c`; the newer source `1a24a2c` has a separate full acceptance run. Gemini/Reviewer explanations in the footage use explicitly labeled deterministic fallbacks. The final architecture segment is source evidence rather than a live cloud-console session. Public video publication and current cloud acceptance remain gated.

## Reproduction

Use the bundled Node runtime and `@oai/artifact-tool`. Copy `source/build-deck.mjs` into a private `.packaging-build/` directory and symlink that directory's `node_modules` to the bundled runtime packages. Run from repository root with `RUNTIME_NODE_MODULES` and `RUNTIME_NODE` set to the bundled paths. The builder renders all 15 slides, exports a private draft and uses the presentation skill's package/geometry/font/import finalizer before writing a new output. Finalizer intentionally refuses to overwrite an existing final PPTX. Use a new filename for revisions.

`source/export-pdf.py` uses reportlab to assemble the rendered slides into the PDF and enforces the 5 MB limit. `../architecture-experience/source/render-diagrams.mjs` renders shared semantic JSON to editable SVG and PNG with Graphviz and sharp. Put it in the same private build directory to resolve bundled packages. Diagram Mermaid files remain independently editable.

## Release conditions

Import the exact official template, reconcile team fields and all candidate claims, inspect the final deck/PDF, verify the prototype and public repository links, publish the accepted 3:51.88 video only under release approval, and verify the resulting accessible link and portal compatibility. Script, captions, conceptual artwork and historical screenshots are preparation and evidence sources, not substitutes for the required final video. Public release, model/cloud activation and hosted upload authorization remain separate gates.
