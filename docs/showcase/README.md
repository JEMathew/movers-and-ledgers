# Product Showcase

**MoveBooks AI — Built on Google Cloud and powered by Gemini AI.**

[Explore the product](https://movebooks-si.web.app) · [Product demos](../../README.md#see-movebooks-ai-in-action) · [Capability evidence](EVIDENCE.md) · [Repository overview](../../README.md)

Eight artifacts explain the customer journey, human authority and platform. Design proposals and
recorded implementation examples are identified separately. Original diagrams and screenshots are
linked as source records; their labels describe the context in which they were created.
[Source provenance and file hashes](manifest.json) · [Verified capability evidence](EVIDENCE.md).

Open each PNG at full size for small labels; the wireframe and prototype overviews are navigation
sheets. Their editable decks provide individual readable slides. Screenshots within the prototype
deck remain pixels; titles and captions are editable.

| Artifact | Evidence class | Editable source |
| --- | --- | --- |
| 01 — [End-to-end process](#01-end-to-end-process) | C — locally demonstrated synthetic process | [PowerPoint](assets/01-process.pptx) |
| 02 — [Use-case diagram](#02-use-case-diagram) | C — synthetic implementation; D — target personas/connectors | [PowerPoint](assets/02-use-cases.pptx) |
| 03 — [Multi-agent swimlane](#03-multi-agent-swimlane) | C — deterministic roles; D — model-led delegation | [PowerPoint](assets/03-swimlane.pptx) |
| 04 — [Solution wireframes](#04-solution-wireframes) | D — proposed layouts, grounded in C — synthetic behavior | [PowerPoint](assets/04-wireframes.pptx) |
| 05 — [Prototype showcase](#05-prototype-showcase) | C — genuine local UI, synthetic records | [PowerPoint](assets/05-prototype.pptx) |
| 06 — [Solution architecture](#06-solution-architecture) | C — source architecture; documented service boundaries | [Mermaid](../architecture-experience/source/c4-container.mmd) · [SVG](../architecture-experience/svg/c4-container.svg) |
| 07 — [Technology stack](#07-technology-stack) | Recorded implementation snapshot; D — explicitly proposed services | [PowerPoint](assets/07-technology.pptx) |
| 08 — [Future development roadmap](#08-future-development-roadmap) | D — planned; no delivery-date commitment | [PowerPoint](assets/08-roadmap.pptx) |

## 01 End-to-end process

**Status: C — locally demonstrated synthetic process.** Shows readiness, approvals, migration, reconciliation and first use, including the return paths when checks fail.

[View original end-to-end process](assets/01-process.png)

**User benefit:** Know what must be true before the next step can proceed.

**Product / platform relevance:** Defines a completion contract and measurable handoffs across a long customer journey.

[Full-size preview](assets/01-process.png) · [Original editable PowerPoint](assets/01-process.pptx).

## 02 Use-case diagram

**Status: C — synthetic implementation; D — target personas/connectors.** Maps business owners, accountants, human reviewers and external interfaces to migration tasks. Persona labels are not an implemented delegated-permissions model.

[View original use-case diagram](assets/02-use-cases.png)

**User benefit:** Understand who supplies evidence and who authorizes a decision.

**Product / platform relevance:** Separates customer jobs, authority boundaries and future integrations from implementation detail.

[Full-size preview](assets/02-use-cases.png) · [Original editable PowerPoint](assets/02-use-cases.pptx).

## 03 Multi-agent swimlane

**Status: C — deterministic roles; D — model-led delegation.** Distinguishes the user, orchestrator, specialists, Reviewer/Judge and deterministic tools. Not every labelled agent is a model runtime; internal Judges are offline evaluators.

[View original multi-agent swimlane](assets/03-swimlane.png)

**User benefit:** See why an AI recommendation cannot move money or approve itself.

**Product / platform relevance:** Makes orchestration, escalation, independent review and tool authority explicit.

[Full-size preview](assets/03-swimlane.png) · [Original editable PowerPoint](assets/03-swimlane.pptx).

## 04 Solution wireframes

**Status: D — proposed layouts, grounded in C — synthetic behavior.** Six editable layouts explore discovery, readiness, mapping, exceptions, verification and first use. These are mockups, not product screenshots.

[View original solution wireframes](assets/04-wireframes.png)

**User benefit:** Makes the current task, evidence and approval understandable at each stage.

**Product / platform relevance:** Connects interaction design to decision rights and financial safeguards without claiming release.

[Full-size preview](assets/04-wireframes.png) · [Original editable PowerPoint](assets/04-wireframes.pptx).

## 05 Prototype showcase

**Status: C — genuine local UI, synthetic records.** Eight authentic local screenshots cover landing, discovery, readiness, mapping, recovery, validation, FPU and evidence. [Capture context and provenance](manifest.json).

[View original prototype showcase](assets/05-prototype.png)

**User benefit:** See real implemented screens and the evidence behind an approved synthetic invoice.

**Product / platform relevance:** Demonstrates an integrated outcome while retaining capture and environment provenance.

[Full-size preview](assets/05-prototype.png) · [Original editable PowerPoint](assets/05-prototype.pptx).

### Authentic public product screenshots

[Guided demo](assets/demo-public-20261024.jpg) · [Landing page](assets/product-public-20261024.jpg) · [Video Academy](assets/academy-public-20261024.jpg)

These original signed-out captures show public sample evidence, product presentation and learning
resources. The guided demo performs no migration and grants no approval. The local prototype
screenshots show a separate synthetic record. [Original capture context](manifest.json).

### Genuine saved Gemini results

The accepted production example includes an Advisor explanation and independent Reviewer **QUESTION**
assessment, grounding and uncertainty. Saved analysis is restored without another model call.
[Acceptance evidence and attribution](EVIDENCE.md#four-p0-acceptance) ·
[Watch the Gemini product demo](https://movebooks-si.web.app/learn?tab=demos#demo-gemini-advisor-independent-reviewer).
Original private acceptance screenshots remain owner-held; only the approved video derivatives are offered for publication.

## 06 Solution architecture

**Status: C — source architecture; documented service boundaries.** Reuses the existing C4 container diagram and editable Mermaid/SVG. It distinguishes the authenticated API, deterministic workflow, transactional state, bounded advice and gated operational adapters. It is a logical view, not a current deployment inventory.

[View original solution architecture](../architecture-experience/png/c4-container.png)

**User benefit:** Keep financial state and authority separate from optional explanations.

**Product / platform relevance:** Explains platform boundaries, protected state and the difference between adapters and activated services.

[Editable Mermaid](../architecture-experience/source/c4-container.mmd) · [Editable SVG](../architecture-experience/svg/c4-container.svg) · [Architecture catalogue](../architecture-experience/README.md).

## 07 Technology stack

**Status: Recorded implementation snapshot; D — explicitly proposed services.** Groups the UI, API, identity, accounting core, optional reasoning, managed infrastructure and quality checks. Original service labels retain their source context; refer to the capability evidence for verified behavior.

[View original technology stack](assets/07-technology.png)

**User benefit:** Understand the technology behind reliable workflow, identity and explainable decisions.

**Product / platform relevance:** Shows build-versus-managed choices and the evidence required before claiming a service is operational.

[Full-size preview](assets/07-technology.png) · [Original editable PowerPoint](assets/07-technology.pptx).

## 08 Future development roadmap

**Status: D — planned; no delivery-date commitment.** A Now / Next / Later proposal progresses from trustworthy Beta through a controlled pilot to a broader migration platform. Current status must be read separately.

[View original future development roadmap](assets/08-roadmap.png)

**User benefit:** Sets expectations for improvements without presenting a future connector as available.

**Product / platform relevance:** Uses outcome, safety and economic gates to sequence investment and expansion.

[Full-size preview](assets/08-roadmap.png) · [Original editable PowerPoint](assets/08-roadmap.pptx).

## Source provenance and attribution

[Original source manifest](manifest.json) · [Detailed capability and release evidence](EVIDENCE.md).
Original assets, timestamps and editable decks are retained unchanged. Proposed services and layouts
are not presented as activated production features.

Attribution remains Movers & Ledgers / MoveBooks AI. Provider marks identify referenced technologies,
not affiliation or endorsement. Original sources and existing repository licensing remain authoritative.
