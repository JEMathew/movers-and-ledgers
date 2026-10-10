# PR05 — Guided migration workflow

Baseline: `146dbd2ebbdb55893c8559d3ed1cc10c2c932858` (latest main, including merged PR #33). Initial working tree was clean. Branch: `feature/ux-v2-migration-journey`.

Design inputs: the five approved local IA/UX v2.0 deliverables, identified by filename and SHA-256 in [design-inputs.json](design-inputs.json). Previous acceptance evidence: [PR04](../pr04/README.md). The user's PR05 instruction explicitly consolidates all five task phases; the original roadmap numbered their presentation improvements PR05–PR09. No additional product capability is introduced.

## Current screens and result

| Phase / existing screens | Before | Implemented |
| --- | --- | --- |
| Understand / Discover, Assess | Large operational progress, findings before continuation, repeated source picker | Compact readiness outcome and continuation, deterministic basis and source counts, visible blockers, separate new-assessment disclosure. Creation keys, retry and superseded-read guards are retained. |
| Prepare / Plan, Mapping, Approval | All mapping cards, long plan review, execution-sounding handoff | One current mapping with the full selectable queue and recorded decisions; optional planning detail; approval consequence and complete material consent; **Continue to Move** navigates to a separately enforced Start Migration action. |
| Move / Migration, Exception Resolution | Standalone manifest explanation first, batch history before completion, duplicate remedy entry | Current start/recovery action, manifest identity, failure and checkpoint context; completion handoff before optional batch and agent history. Server-measured percentage is retained; no UI-generated estimate. |
| Verify / Validation, Configuration | Scenario loaders before task, financial checks and all settings before next action | Discrepancies remain visible; exact matched checks are expandable; one current setting with all eight areas reachable. Explicit repair, revalidation, review and apply remain separate. Revalidation's configuration-reset warning precedes its control inside the report disclosure. |
| Start / Onboarding, FPU | All ten prerequisite cards before invoice/checkpoint; multiple dominant actions | Current prerequisite and selectable ten-check overview, draft/approval/posting hierarchy, posted-checkpoint resume, full exact contract in consent, verified evidence handoff before history. Completed prerequisites remain reviewable; frozen terms cannot be revised. |

Frontend references: [Understand](../../../apps/web/components/discover-assess/DiscoverAssessExperience.tsx), [Prepare](../../../apps/web/components/plan-map-approve/PlanMapApproveExperience.tsx), [mapping queue](../../../apps/web/components/plan-map-approve/MappingReview.tsx), [plan consent](../../../apps/web/components/plan-map-approve/ApprovalReview.tsx), [Move](../../../apps/web/components/migrate-resolve/MigrateResolveExperience.tsx), [Verify](../../../apps/web/components/validate-configure/ValidateConfigureExperience.tsx), [Start](../../../apps/web/components/onboard-fpu/OnboardFpuExperience.tsx).

[PhaseProgress](../../../apps/web/components/journey/PhaseProgress.tsx) presents Understand → Prepare → Move → Verify → Start from the existing operational projection. The original nine steps stay in a native disclosure and retain cross-page parity. Missing/failed reads claim no completion; future phases do not offer forward navigation. Context links carry the selected migration into My Migration, Help and evidence mode. Optional advisory guidance is disclosed through the existing [WorkflowHelp](../../../apps/web/components/public-surfaces/WorkflowHelp.tsx); no reasoning activation or agent changes.

## Local acceptance

**ACCEPT for review**, subject to normal human review and required CI. No P0/P1 blocker demonstrated locally.

- **558 frontend tests / 44 files passed**, including existing identity, selected-owner continuity, all operational-state parity, creation idempotency, lost-response retry, rejected mapping/reconsideration, explicit plan approval, repair/configuration and productive-use checkpoint regressions. New tests cover compact phase projection, all-item queue access without mutation, next pending reviews and exact invoice consent material.
- **184 existing backend control tests passed**: explicit plan approval, planning/mapping, bounded migration recovery, exact validation/configuration, onboarding/productive use, owner isolation, integrated Beta journey, assessment idempotency and shared journey evidence. One inherited Starlette/httpx deprecation warning; no dependency change.
- Frontend lint, TypeScript and production build passed. Offline repository links/credential-pattern checks and whitespace checks are recorded in [validation.json](validation.json).
- Browser walkthrough used the **actual unchanged local API**, in-memory storage, demo identity and deterministic-only mode. It reviewed 11 mappings, separately approved the plan and started migration, explicitly approved recovery then retried, obtained 17 matching checks, reviewed five consequential configuration areas and applied the configuration separately, satisfied ten onboarding checks through five explicit decisions plus deterministic checks, then prepared, approved, posted and verified the synthetic USD 107.25 invoice.
- A separate interrupted case went **POSTED → VERIFIED** with the same invoice, original key and one posting attempt. No new consent or posting occurred. Backend reads before/after confirmed invoice/key equality; frontend checkpoint-key regression also passed.
- Native modal Shift+Tab stayed in the consent dialog; Escape cancelled without a decision and returned focus to its opener. Keyboard focus showed a 3px outline. Enter opened phase history at 320px with no horizontal overflow.
- Desktop 1440×900, tablet 768×1024, mobile 390×844 and narrow 320×700 each had one H1, one visible primary task action and no document horizontal overflow. All five selected primary actions fit the normal desktop and 390px mobile viewport. At 320×700, Prepare/Verify/Start require approximately 23/45/6px additional scrolling; consent evidence is deliberately not compressed to force a zero-scroll dialog.

Browser evidence: [journey and keyboard](browser-journey.json), [before measurements](baseline-measurements.json), [after measurements](viewport-measurements.json), [initial assessment entry](entry-measurement.json). Before captures come from an isolated archive of the exact baseline. Before/after use equivalent Harbor Light synthetic cases and the same workflow states. JPEG dimensions were checked after viewport settling; these are genuine local browser captures, not mockups or deployed-product screenshots.

| Mobile primary action | Before bottom | After bottom |
| --- | ---: | ---: |
| Understand: create plan | 981px | 654px |
| Prepare: review mappings | 780px | 665px |
| Move: review issue | 917px | 534px |
| Verify: review base currency | 2256px | 721px |
| Start: resume verification | 5237px | 706px |

## Screenshots

| Phase | Before | After |
| --- | --- | --- |
| Understand | [Desktop](before-understand-1440.jpg), [mobile](before-understand-390.jpg) | [Desktop](after-understand-1440.jpg), [mobile](after-understand-390.jpg) |
| Prepare | [Desktop](before-prepare-1440.jpg), [mobile](before-prepare-390.jpg) | [Desktop](after-prepare-1440.jpg), [mobile](after-prepare-390.jpg) |
| Move | [Desktop](before-move-1440.jpg), [mobile](before-move-390.jpg) | [Desktop](after-move-1440.jpg), [mobile](after-move-390.jpg), [320px](after-move-320.jpg) |
| Verify | [Desktop](before-verify-1440.jpg), [mobile](before-verify-390.jpg) | [Desktop](after-verify-1440.jpg), [mobile](after-verify-390.jpg), [tablet](after-verify-768.jpg) |
| Start | [Desktop](before-start-1440.jpg), [mobile](before-start-390.jpg) | [Desktop](after-start-1440.jpg), [mobile](after-start-390.jpg) |

Additional acceptance captures: [initial assessment](after-entry-390.jpg), [full plan consent](after-plan-consent-1440.jpg), [invoice consent](after-invoice-consent-390.jpg), [verified result](after-verified-390.jpg), [interrupted checkpoint resumed](after-resume-verified-390.jpg), [unavailable migration](after-unavailable-390.jpg), [expanded phase history](after-progress-expanded-320.jpg).

## Scope and verification boundaries

[Changed-file inventory](changed-files.txt) covers frontend presentation/tests and this evidence folder. No authentication contract, owner authorization, agent, backend workflow, financial tool, infrastructure, Docker, dependency, CI workflow or cloud resource changed. No hosted uploads, provider connector, live Gemini activation or game was added. All five task routes and nine operational steps, existing decision endpoints and posting keys are preserved. Independent/provider-neutral notices and synthetic Beta boundaries remain.

**Source/tests verified:** Firebase token handling and owner isolation; member header, Play and existing migration navigation; late response/selection boundaries; rejection, reconsideration, blocked/nonretryable/exhausted recovery, exact financial checks, supported settings and frozen posting terms. **Browser verified:** local demo mode and actual local synthetic workflow. **Not verified live:** Google sign-in, live authenticated workspaces, real provider integrations or production accounting. The local demo shell is not evidence of cloud authorization behavior.

**P2:** live authenticated visual review remains deferred per the user's source-verification preference. **P3:** small 320px vertical scroll noted above; full financial consent can be long; retained historical operational and backend enum terms remain available in disclosures/evidence. These do not introduce additional release prerequisites.

Rollback is a frontend presentation revert; do not rewrite recorded decisions, checkpoints or financial evidence. No automatic merge or deployment.
