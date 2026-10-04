# Plan → Map → Approve in the current UX

Review date: 2026-10-04 (Asia/Kolkata)
Branch: `feature/plan-map-approve`, based on main `b0753d0`.
Comparison source: `backup/plan-map-approve-old` at `cdb34b7ada5546eb475d69979ff622af7c5846ac`, including `f300e4677253099d4862541f2a589853c91977f4` and `cdb34b7`.

## Scope and comparison

The current main already contains the old planning and mapping capability, plus owner isolation, semantic guards, mapping reconsideration, and downstream execution controls. No old commit was cherry-picked. Porting whole files would remove later protections and the UX reset.

| Area | Classification | Decision |
| --- | --- | --- |
| Planning agent and deterministic plan tools | ADAPT | Keep the narrow agent and dependency policy; add source-backed scope, execution batch order, review counts and validation expectations. |
| Mapping agent, specialists and canonical policies | REUSE AS-IS / ADAPT | Keep compatibility, risk and evidence checks; expose configuration source values without changing legacy serialized manifest checksums. |
| Orchestrator, domain models, API/service | ADAPT | Retain owner checks and atomic persistence; replace implicit whole-plan approval with explicit consent and recheck source coverage and executable treatments. |
| Audit records and rejected-mapping reconsideration | REUSE AS-IS | Keep the separate attributable request/review and immutable prior decisions. Adapt only local action styling and integration. |
| Synthetic data and golden journey tests | REUSE AS-IS / ADAPT | No fixture changes. Downstream tests now grant separate plan consent before execution. |
| Old PlanMapApproveExperience presentation | REBUILD | Replace the technical seven-phase-first page with outcome, scope, mapping review and a separate approval confirmation. |
| Old Nav.tsx | DROP | Do not restore old global Plan & Map navigation. Current signed-in/signed-out navigation is untouched. |
| Old Discover/Assess handoff | DROP | Keep the current direct session-preserving handoff; no two-click notice or silent sample creation. |
| Old CTA wording and optimistic journey assumptions | DROP | One dominant next action; progress uses validated authoritative reads, never successful POST payloads or inferred approval. |
| Current session persistence and nine-step journey | REUSE AS-IS / ADAPT | Preserve validated initial adoption and failed-read behavior. Distinguish pending Map review from whole-plan Approve in My Migration. |
| Route compatibility and Learn handoffs | REUSE AS-IS | Retain canonical `/plan-map-approve`, `/approvals` and `/reports` compatibility, My Migration and existing Learn context behavior. |
| Approval gating | REBUILD explicit boundary | Every mapping must be reviewed, source coverage exact, owner/evidence attributable, source unchanged, executable treatment supported and hard blockers absent. |
| Canonical product, migration, agent and reviewer rubrics | REUSE AS-IS | Already present from `cdb34b7`; used as review lenses without copying old product surfaces. |

## Resulting contract

- Plan leads with “Your migration plan is ready.” It shows included source objects, blockers, batches, expected review decisions and required human review. Primary: Review mappings.
- Map supports accounts, customers, vendors, products, tax and general configuration. Source, destination, rationale, relevant evidence, full planning context and decision attribution remain accessible. Statuses: Suggested, Reviewed, Changed, Approved, Needs attention. Risk/confidence is shown only when closer review is useful. Primary: Review N mappings, then Review migration plan.
- Approval shows scope, reviewed mappings, blockers, configuration source/destination values, validation expectations and consequences. Confirmation records server identity/time, mapping decision IDs, plan identity and a scope checksum. Migration writes require a separate start.
- POST `/v1/migration-sessions/{id}/plan` still creates a plan with an empty body. `{action: "approve", plan_id: ...}` grants explicit consent. Unknown fields and client-supplied audit identity are rejected. The proxy allowlist and authentication/security files are unchanged.
- Newly consented scope is checked against its approval checksum before execution/resume. Existing approved sessions without the new approval snapshot retain their prior contract and show truthful legacy attribution limitations. Dedicated synthetic demo constructors retain their already-labelled approval replay behavior.
- Failed initial reads, failed writes and failed post-mutation reads do not infer progress or change the selected migration. A successful retry of an initial read can adopt its now-validated deep link. Later-stage Plan resumes show the actual journey position and return to My Migration.

## Validation

- Backend: **356 passed, 22 skipped**, one existing TestClient deprecation warning. This includes the new approval gate, audit attribution, idempotency, scope tampering, unsupported conversion, legacy serialization, uploaded source/bills, durable persistence and complete governed FPU journeys.
- Frontend: **300 passed** across 29 files. Targeted Plan/Map/Approve and journey tests: **66 passed**.
- Frontend lint, typecheck and production build: passed.
- Changed Python modules: Ruff passed. Git whitespace check: passed.
- Repository checks: passed: 98 Markdown files and 393 text files, zero findings.
- Browser: real local synthetic session walked from assessed Plan through all 11 mapping confirmations, separate plan consent, same-session Start migration and governed pause. A final API revision replay confirmed the consent checksum passes execution and later-stage Plan remains read-only.
- Browser: expired canonical Plan deep link with a valid stored migration showed no current/completed progress, disabled advance, and preserved the original My Migration session. Expired Assess also remained unconfirmed. Loading/404/500 coverage is in regression tests.
- Browser: blocked Northstar readiness stays visible; no plan approval or Start migration action is exposed for incomplete review. Backend independently rejects blocked/pending/rejected/incomplete/unsupported approval.
- Browser: desktop 1280 × 720 and phone 390 × 844, light/dark. Page width stayed equal to viewport width; journey scrolling stays inside its own container. Phone mapping controls worked.
- Browser: shared approval dialog centers on desktop and phone. Escape restores the opener; successful approval restores the durable page heading. Phone dialogs measured 352 × 492 at x=19, y≈176 in 390 × 844. No console errors on final valid paths.
- Evidence screenshots are saved locally outside the repository in the task visualization directory; no screenshots or generated build artifacts are committed.
- Evidence limitations: synthetic data/local demo identity and server-principal owner tests. Live Google sign-in, production accounting providers, paid model calls and cloud deployment were not exercised. No representative customer usability metrics are claimed.

## Findings

P0: 0. P1: 0. P2: 0. P3: 2 inherited backlog items; no new open finding in this slice.

| ID | Finding | Evidence | Impact and smallest follow-up | Status |
| --- | --- | --- | --- | --- |
| P3-1 | Learn can open a future stage without checking the migration's current stage. | `apps/web/components/public-surfaces/LearningReturn.tsx:25–35` | Destination controls still enforce the workflow, but the handoff can surprise a customer. Later refine the link using a validated current stage. | Pre-existing backlog; intentionally unchanged. |
| P3-2 | Expired Assess link recovery offers retry rather than a direct return to an existing valid selected migration. | `apps/web/components/discover-assess/DiscoverAssessExperience.tsx:388–396` | Progress and selection stay safe; recovery takes an extra navigation. Add an explicit return to My Migration in a later scoped pass. | Pre-existing backlog; Plan now has an explicit My Migration recovery link. |

No finding for examined session adoption, Plan mutation gates, authoritative progress, hard blocker enforcement, approval attribution/idempotency, route compatibility, navigation/security diff scope or the existing rejected-mapping review boundary.

## Review lenses and practical limits

| Criterion | 0–4 assessment for this local slice | Evidence / remaining gap |
| --- | --- | --- |
| Product job, stage ownership, next action | 3 | Scope-first Plan, one page CTA, distinct mapping and plan consent; no representative user completion study. |
| Migration planning and compatibility | 3 | Structured batches, exact mapping source coverage, semantic policy tests; production provider transformations not in scope. |
| Human governance and handoff | 3 | Owner/time/audit-bound explicit consent; atomic retries, blockers and source/manifest guards; live production authorization not tested. |
| Evidence and lineage | 3 | Source references, policy versions, decision IDs and approved checksum; legacy audit absence is surfaced rather than fabricated. |
| Agent orchestration and tool authority | 3 | Existing bounded planning/mapping roles; deterministic orchestrator owns progression; agents cannot consent or write. |
| Confidence calibration and realized customer outcomes | 2 | Existing synthetic policy confidence remains advisory; no new calibration set or customer metrics. |
| Recovery and stopping | 3 | Initial/post-mutation failures become unconfirmed, idempotent approval, persisted golden journeys and read-only later-stage resume. |

These criterion assessments are not averaged and do not replace severity findings. This is a builder validation record; independent Codex review remains the next gate. No release, merge or deployment decision is made here.

## Local commits

1. `dc78bc5` — separate migration plan consent from mapping review.
2. `5873ca2` — outcome-first migration plan summary.
3. `72d31bc` — authoritative mapping review.
4. `34304b3` — explicit auditable approval review.
5. Final validation commit — regression coverage, browser refinements, exact source/executable scope guards, legacy checksum compatibility and this comparison record.

## Exact files changed from baseline

- `agents/mapping/specialists.py`
- `agents/orchestrator/migrate_resolve.py`
- `agents/orchestrator/plan_map_approve.py`
- `agents/planning/agent.py`
- `apps/web/components/MyMigration.tsx`
- `apps/web/components/journey/journey.test.ts`
- `apps/web/components/journey/journey.ts`
- `apps/web/components/plan-map-approve/ApprovalReview.tsx`
- `apps/web/components/plan-map-approve/MappingReconsideration.tsx`
- `apps/web/components/plan-map-approve/MappingReview.tsx`
- `apps/web/components/plan-map-approve/PlanMapApproveExperience.test.tsx`
- `apps/web/components/plan-map-approve/PlanMapApproveExperience.tsx`
- `apps/web/components/plan-map-approve/PlanSummary.tsx`
- `apps/web/components/plan-map-approve/types.ts`
- `apps/web/components/public-surfaces/session.ts`
- `docs/reviews/PLAN_MAP_APPROVE_CURRENT_UX.md`
- `domain/planning_mapping/models.py`
- `services/api/src/movebooks_api/discover_assess/api.py`
- `services/api/src/movebooks_api/discover_assess/service.py`
- `tests/test_beta_v1_integration.py`
- `tests/test_explicit_plan_approval.py`
- `tests/test_intake.py`
- `tests/test_mapping_reconsideration.py`
- `tests/test_plan_map_approve.py`
- `tools/planning/plan.py`

## Readiness

**READY FOR CODEX REVIEW**. No merge or deployment performed. The pre-existing untracked `files` entry was preserved and is not part of these commits.
