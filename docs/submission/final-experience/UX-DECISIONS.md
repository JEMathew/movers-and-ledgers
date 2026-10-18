# UX decisions (screen-by-screen). Lens applied per element: problem solved, need here, concise for an accountant, one next action, delivers promise, eliminate/merge/disclose, trust contribution.

| Screen | Decision | Detail | Pri |
|---|---|---|---|
| Landing hero | SIMPLIFY | one H1, one value sentence, one primary CTA, one demo text link, one scope line | P0 |
| Landing Play panel | REMOVE from `/` | stays in nav + Learn; progress is separate from migration so it adds no task value here | P0 |
| Landing Vision block | MOVE | into "How MoveBooks works" disclosure link; keep `/product` | P0 |
| Landing disclosures | KEEP | collapsed; keep Gemini-disabled-by-default sentence | — |
| Nav | SIMPLIFY | see matrix; Evidence link for members | P1 |
| Sign-in | KEEP; handoff via `next` | | P1 |
| My Migration | SIMPLIFY/MERGE | one CTA, attention, progress, single Details disclosure, one shortcut row | P0 |
| Assess | KEEP + trim | default Harbor Light; hide local export options in cloud (verify) | P1 |
| Plan/Map/Approve | KEEP gates; reorder tabs Plan → Mappings → Approval (verify current order) ; normalise case | approvals untouched | P1 |
| Move/Resolve | KEEP | only label case | P1 |
| Verify/Configure | KEEP | only label case | P1 |
| Onboard/FPU | KEEP | | — |
| Evidence | KEEP records; add anchor; AI activity block renamed | | P0 |
| Trust overview | KEEP | already principle list + 4 collapsed details; no AI activity here by design (needs session) | — |
| Simulator/Learn/Guide/Support | KEEP | not reviewed in depth this pass | — |

## Proposed information architecture
Public: Home · Demo · Learn (incl. Guide) · Trust · Play. Member: My Migration (hub) → five stages → Evidence & results (+ AI activity). Help is global; Feedback/Beta limits in footer.

## Top five problems / changes (for summary)
Problems: promo competition; extra start hops; buried technical AI-activity panel; dense My Migration; inconsistent labels/phase names.
Changes: single CTA landing; AI activity rename + anchor + $ copy; My Migration single Details; sign-in handoff; CTA casing/verb pass.

## Do-not-touch list
Approval dialogs, "blocked check cannot be approved away", reconciliation display, evidence record projections, boundary/synthetic disclosures (shorten wording only, never remove), `OperationalActivity` parsing/validation logic.
