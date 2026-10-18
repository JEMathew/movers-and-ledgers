# MoveBooks AI V2: full experience (Phase 1 completion)

Branch `v2/full-experience`, from `v2/phase1-foundations` (`0c6c757`), which was created from GitHub `main` `4e31e29`.
Not merged, not pushed, not deployed. Gemini is not activated; `AI_ASSISTANCE_STATUS` stays `planned`.

## Design source

Approved A+B design: canvas "MoveBooks AI V2.0 Visual Directions", version `1792360852-a7bc` (frames V2-Landing,
V2-MyMigration, V2-PlanMap, V2-FPU, V2-States, V2-Mobile, Prototype) and the V2 component sheet at `/design-system`.
Clear Ledger supplies the visual system; Companion supplies guidance, recovery and next actions. Both are internal
design names only. The product is MoveBooks AI.

## Rules every screen follows

1. One five-stage model: Understand → Prepare → Move → Verify → Start. The recorded steps appear only as a breakdown
   of those stages ("Steps in each stage", closed by default).
2. Every primary workflow screen shows the current stage, completed work, outstanding decisions, one recommended next
   action, relevant evidence and, when blocked, a recovery path (`components/v2/Workflow.tsx`).
3. Figures come from API fields and are formatted, never computed or defaulted (`formatApiAmount`, `MoneyFigure`).
   Unknown is said plainly and never shown as zero.
4. Sentence case for headings, buttons and labels. Proper nouns, MoveBooks AI and the five stage names keep capitals.
5. One filled primary action per view. Secondary actions are outlined or text links.
6. AI Advisor and Reviewer are labelled Planned. No copy says AI is advising, reviewing or deciding today.
7. Route paths, API calls, request bodies, enabled/disabled rules and approval semantics are unchanged.

## Attribution

The owner-approved line is "Built on Google Cloud and powered by Gemini AI". The hosted Beta is deterministic-only,
so publishing that line now would claim active hosted inference. `components/v2/Attribution.tsx` therefore shows
"Built on Google Cloud · Gemini AI planned" while `AI_ASSISTANCE_STATUS` is `planned`, and switches to the exact
approved line when the status is `live` (a separate, verified release decision). One quiet line, on the landing page
and in My migration; no logos, badges or supporting paragraph.

## Play

Hidden from public and member navigation, the landing page, Learn and the demo while
`NEXT_PUBLIC_FEATURE_PLAY_NAV` is not `on` (`lib/features.ts`). `/play` and its source are unchanged; set the variable
to `on` to restore the links.

## Workstreams and file ownership

| Workstream | Scope | Owns |
|---|---|---|
| A | Theme, landing, navigation, footer, attribution, shared workflow pattern, stage bar | `app/globals.css`, `app/v2.css`, `app/v2-workflow.css`, `app/page.tsx`, `app/layout.tsx`, `components/v2/*`, `components/journey/journey.ts`, `PhaseProgress.tsx`, `MigrationJourney.tsx`, `Nav`, `Footer`, `content.ts` |
| B | Sign-in and entry, My migration and picker, Understand, Prepare, low-risk batch approval | `app/v2-journey.css`, `components/MyMigration.tsx`, `components/WorkspaceEntry.tsx`, `components/journey/{MemberProgress,MigrationSnapshot,ChecksTable,MigrationPicker,member-home,NextAction}*`, `components/journey/*.test.*`, `components/discover-assess/*`, `components/plan-map-approve/*`, `app/sign-in/*`, `components/IdentityEntry.tsx` |
| C | Move, Verify, Start and verified first invoice | `app/v2-stages.css`, `components/migrate-resolve/*`, `components/validate-configure/*`, `components/onboard-fpu/*` |
| D | Trust and evidence, Demo, Learn, Help, Try your data, feedback and remaining routes | `app/v2-surfaces.css`, `components/public-surfaces/*` (except `content.ts`), `components/try-your-data/*`, remaining `app/*` pages |
| E | Integration, QA, evidence, report | `docs/v2/full-experience/*` |

## Status

See `CHECKPOINT.md` in this folder.
