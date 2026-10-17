# Submission packaging

Reviewable content package, 17 October 2026. **Not a completed official submission.** The prescribed `Submission Template | AI Builder Cup.pptx` has not been located. The editable deck below follows the supplied section list, but exact-template compliance remains open. Team roster/contact and exact selected BFSI challenge wording require owner input.

- [Editable PowerPoint content draft](assets/movebooks-submission-draft.pptx)
- [PDF content draft](assets/movebooks-submission-draft.pdf), 15 pages, below the 5 MB portal limit
- [Product description](product-description.txt), 1,022 characters before trailing newline
- [Authentic working-product video storyboard](video-storyboard.md), planned runtime 3:30
- [Draft captions](video-captions-draft.srt), to retime against final narration
- [Packaging status and open submission checks](packaging-status.md)
- [Packaging validation record](packaging-validation.json)
- [PM artifact index](../product-management/README.md), [Working Backwards](../working-backwards/README.md), [editable diagrams](../architecture-experience/README.md)

The PPTX retains editable text and a native architecture diagram. Its embedded screenshots are authentic historical repository evidence and are labeled accordingly. The PDF is a faithful raster export of the rendered content deck. No PowerPoint desktop compatibility check is claimed. No invented customer impact, adoption, accuracy, competitor result or financial cost appears in the deck. Candidate screenshots and actual test results must replace or supplement historical evidence once accepted.

## Reproduction

Use the bundled Node runtime and `@oai/artifact-tool`. Copy `source/build-deck.mjs` into a private `.packaging-build/` directory and symlink that directory's `node_modules` to the bundled runtime packages. Run from repository root with `RUNTIME_NODE_MODULES` and `RUNTIME_NODE` set to the bundled paths. The builder renders all 15 slides, exports a private draft and uses the presentation skill's package/geometry/font/import finalizer before writing a new output. Finalizer intentionally refuses to overwrite an existing final PPTX. Use a new filename for revisions.

`source/export-pdf.py` uses reportlab to assemble the rendered slides into the PDF and enforces the 5 MB limit. `../architecture-experience/source/render-diagrams.mjs` renders shared semantic JSON to editable SVG and PNG with Graphviz and sharp. Put it in the same private build directory to resolve bundled packages. Diagram Mermaid files remain independently editable.

## Release conditions

Import the exact official template, reconcile team/challenge fields and all candidate claims, inspect the final deck/PDF, verify the prototype and public repository links, capture an authentic accepted-candidate video and validate its 3–4 minute duration. Script, captions, conceptual artwork and historical screenshots are preparation and evidence sources, not substitutes for the required final video. Public release, model/cloud activation and hosted upload authorization remain separate gates.
