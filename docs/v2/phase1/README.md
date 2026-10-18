# MoveBooks V2, Phase 1: foundations

Branch `v2/phase1-foundations`, created from GitHub `main` at `4e31e29` (the merge of PR #37, which contains the frozen
V1.0 release `16e31e9`). The web app and API on `main` are identical to `16e31e9`. Nothing here is deployed.

Owner decision (19 Oct 2026): A Clear Ledger as the visual foundation with B Companion's contextual guidance,
conditionally approved for Phase 1. Gates that apply to every Phase 1 change:

- No change to public URLs, Firebase Authentication, tenant permissions, financial logic or saved migrations.
- Gemini stays off and every AI surface says Planned (see `ai-status-rule.md`).
- No merge to `main` and no deployment without a separate release acceptance gate.

## Scope

| # | Increment | Visible change | Gate |
|---|---|---|---|
| 1 | V2 tokens, primitives and the five-stage model, scoped to `.mb-v2` | None on V1 screens | Unit tests; component sheet matches the design canvas |
| 2 | V2 component sheet on the internal `/design-system` page (noindex) | Internal page only | Visual comparison with the canvas; axe |
| 3 | A unique page title on every route | Browser tab titles | Every route has its own title |
| 4 | Harbor Light Books as the default sample on Understand; Northstar labelled as practice | Assess sample picker | FR4 |
| 5 | Needs review, Blocked and Rejected shown as distinct states, each with its recovery path | Mapping cards | FR3; no change to which buttons are enabled |
| 6 | Truthful AI copy and a Planned badge on Advisor and Reviewer surfaces | Landing, Trust, demo, AI panels | AI status rule |

Deferred from the Phase 1 backlog, with reasons:

- Short-lived HTML caching: Next.js overrides `Cache-Control` set in `next.config` for prerendered pages, so the fix
  depends on Hosting and Cloud Run behaviour that can only be verified on a hosted preview. It needs its own
  reviewed change and a preview deployment approval.
- Automated two-identity isolation in CI: the API already has owner-isolation tests across every stage (listed in
  `contract-reconciliation.md`); a browser-level two-identity test needs the two named test identities the owner has
  not yet provided.

## Design source

Approved editable source: design canvas "MoveBooks AI V2.0 Visual Directions", row "Selected (provisional): A Clear
Ledger with B Companion guidance", version `1792356300-ace3` (19 Oct 2026). Frames: Landing, My Migration,
Prepare: map and approve, Start: verified first invoice, States and recovery, four phone screens, plus the clickable
prototype. Phase 1 implements the foundation those frames share; screens move to V2 in Phase 2 behind a flag.

Components named by the design and their Phase 1 implementation (`apps/web/components/v2/`):

| Design component | Implementation | Notes |
|---|---|---|
| Stage bar (Understand → Prepare → Move → Verify → Start), compact on phones | `StageBar` + `stages.ts` | Stage names reuse the existing five phases; one model only |
| Status chips: Needs review, Blocked, Rejected, Approved, Changed, Low risk | `StatusChip` + `mapping-status.ts` | Derived from API `state` and `risk` |
| Recovery text per state | `V2_STATUS_RECOVERY` | Mirrors `apply_mapping_decision` |
| Planned badge for Advisor and Reviewer | `AiStatusBadge` + `ai-status.ts` | Constant, never runtime-derived |
| Guide sentence (Companion voice) | `GuideNote` | |
| Your next step panel (one dominant action) | `NextStepPanel` | |
| Money figure | `MoneyFigure` | Formats an API value; never computes or defaults one |
| Planned example container | `PlannedExample` | "Not live model output" |

Critical states covered by the design: Needs review, Blocked, Rejected, Approved, Low risk, no migrations yet,
service unavailable, Advisor unavailable, rejected mapping locking Move, all stages done.
