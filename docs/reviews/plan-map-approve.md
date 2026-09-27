# Review: Plan → Map → Approve vertical slice

Review date: `2026-09-27`

Branch / baseline: `feature/plan-map-approve` / `6cdb03b`

## Scope and customer problem

- **Customer problem:** a migration owner needs a credible sequence and evidence-backed mapping
  decisions before authorizing any financial data movement.
- **In scope:** the complete 13-agent Beta V1 architecture; Planning and Mapping agent
  implementations; four bounded mapping specialists; deterministic plan and mapping controls;
  owner-scoped approve, modify, and reject decisions; customer-safe activity and events; a
  responsive experience; and executable golden evaluations.
- **Out of scope:** source remediation, provider connections, production data, target writes,
  Migrate → Resolve, deployment, durable operations, and a live Gemini / Google ADK runtime.
- **Credible blast radius:** the new `/plan-map-approve` route and Plan/Mapping resources attached to
  the existing process-local migration session. The feature reads repository-owned synthetic data
  and performs no external or financial mutation.
- **Expected outcome:** users understand what happens, why the sequence is ordered, which actions
  they own, and why a mapping is safe, reviewable, or blocked. No measured customer, migration, or
  First Productive Use outcome is claimed.

## Architecture, agents, and tools

The canonical [Beta V1 agent architecture](../architecture/beta-v1-agent-architecture.md) preserves
the complete journey and 13 logical agents. The implemented path is now Discover → Assess → Plan →
Map & Approve. Migrate through verified First Productive Use remains future work.

The [slice architecture](../architecture/plan-map-approve.md) records workflow state, stopping
rules, contracts, routes, events, security boundaries, the Gemini seam, and ADK readiness. The
Migration Orchestrator alone advances `ASSESSED → PLANNED → MAPPING → AWAITING_APPROVAL → APPROVED`.
The Planning Agent builds and validates seven ordered phases. The Mapping Agent coordinates:

- Account Mapping Specialist;
- Tax Mapping Specialist;
- Entity Mapping Specialist;
- Configuration Mapping Specialist.

These are bounded specialists because their input context, target schema, tools, risk, evidence,
confidence, and escalation rules differ. Dependency ordering and schema/compatibility checks remain
deterministic capabilities rather than being inflated into agents.

Authoritative tools cover plan construction and dependency validation, mapping schema, canonical
targets, account-type compatibility, required target fields, configuration compatibility, evidence
completeness, duplicate account targets, versioned rule lookup, approval enforcement, decision
validation, handoff readiness, and minimized audit-event creation.

## Gemini, Knowledge, and ADK readiness

No live Gemini call runs in this branch. `MappingRecommendationProvider` is the structured GenAI
boundary, and `DeterministicMappingRecommendationProvider` is the shipped controlled fallback. It
works without credentials, does not egress raw financial rows, and always runs before authoritative
deterministic validation. A future Gemini provider may offer semantic recommendations and concise
explanations but cannot approve a proposal or override policy.

The Knowledge Agent is scaffolded as the future retrieval boundary for versioned accounting,
mapping, migration, compatibility, and canonical definitions; repository-owned knowledge supplies
the current implementation. Explicit parent/specialist ownership, structured inputs/outputs,
declared tools, evidence, confidence, escalation, session state, and evaluation hooks preserve a
clean Google ADK adaptation path without coupling financial controls to ADK.

## Human approval and audit behavior

Proposals use `PROPOSED`, `AUTO_ACCEPTABLE`, `REVIEW_REQUIRED`, `APPROVED`, `MODIFIED`, `REJECTED`,
and `BLOCKED`. The 90% threshold only changes review classification; every proposal still requires
an authenticated owner decision in this Beta. High-risk, sensitive, low-confidence, incomplete,
unsupported, or invalid proposals cannot progress silently. Modifications are revalidated by the
same server-side controls, and final decisions record actor, timestamp, comment, policy version,
evidence, activity, and a bounded event. Browser clients cannot forge internal lifecycle events.

The handoff is emitted only when every proposal is approved or validly modified **and** the plan has
no unresolved assessment blockers. `APPROVED` means prepared for a future Migration Agent, not that
data was migrated.

## Evaluation, events, and metrics

`plan-map-approve-golden-v1` contains twelve executable cases:

1. straightforward high-confidence mapping;
2. ambiguous account mapping;
3. tax mapping requiring approval;
4. unsupported target mapping;
5. missing evidence;
6. owner approval;
7. owner rejection;
8. owner modification;
9. unsafe deterministic-rule block;
10. repeated deterministic policy outcome;
11. valid plan dependencies;
12. incomplete approval stopping handoff.

Tests additionally cover missing target fields, arbitrary canonical-target bypass attempts, final
decision enforcement, stage guards, clean approved handoff, plan status, evidence resources,
owner-scoped access, audit activity, browser event restrictions, UI error recovery, and the
Discover → Assess regression suite.

The implemented event contracts are `plan_started`, `plan_generated`, `mapping_started`,
`mapping_proposed`, `mapping_review_required`, `mapping_approved`, `mapping_modified`,
`mapping_rejected`, `mapping_blocked`, and `ready_for_migration`. They support future plan completion,
mapping acceptance/override, approval/rejection, low-confidence, escalation, time-to-approve, and
ready-for-migration metrics. There is no production analytics pipeline or measured value, and none
is fabricated.

## Review evidence and perspectives

- **Evidence:** full branch diff; constitutions and principles; scorecard and metrics framework;
  architecture and threat model; agent, domain, tool, service, event, and UI contracts; synthetic
  fixture; twelve golden cases; automated tests; production build; and live browser interaction.
- **Reviewers:** Product, Customer Outcome, Migration, Agentic AI, GenAI Quality, FinTech Trust, UX,
  Accessibility, Architecture, Security, Reliability / Operations, Metrics, Release Readiness, and
  Demo.
- **Browser verification:** desktop light and dark, narrow mobile viewport, mobile navigation,
  complete journey/plan/mapping reading order, evidence disclosure, approve/modify/reject controls,
  error safe-stop, native keyboard traversal, visible focus, semantic text statuses, and native
  dialog focus/escape restoration. The shared reduced-motion rule was verified to collapse
  animation/transition duration and iteration while all state remains textually exposed.
- **Evidence gaps:** no production/customer study, screen-reader lab, live reduced-motion OS session,
  load/chaos exercise, durable-store recovery, production identity, Gemini quality set, or telemetry
  pipeline exists; none is claimed for this synthetic public-reference Beta slice.

## Initial findings and remediation

| ID | Reviewer | Finding | Why it matters | Severity | Remediation and status |
| --- | --- | --- | --- | --- | --- |
| PMA-001 | Migration / FinTech Trust | The first handoff condition considered mapping decisions but not unresolved plan blockers. | A fully approved mapping set could appear ready despite deterministic source-data blockers. | P1 | Handoff now also requires a present plan with zero blockers; API and clean-fixture tests cover both stopped and ready outcomes. **Resolved.** |
| PMA-002 | Security / Deterministic Quality | Initial modify validation constrained account/config targets but allowed arbitrary entity, product, or tax target strings through a direct API call. | A client could bypass UI options and record an unsupported consequential mapping. | P1 | Added canonical entity/product and jurisdiction-specific tax compatibility controls, removed the missing-field exemption, and added bypass/missing-field regressions. **Resolved.** |
| PMA-003 | Product / UX / Demo | Future unimplemented phases rendered as `IN PROGRESS`. | The experience overstated current product capability and confused journey state. | P1 | Added the semantic, icon-backed `NOT STARTED` status and a UI regression assertion; desktop and mobile browser re-review passed. **Resolved.** |
| PMA-004 | Accessibility | Keyboard focus and modal restoration needed browser evidence after the new dense decision interface was added. | A mouse-only mapping flow would block keyboard users from consequential decisions. | P2 | Verified native traversal, a visible 3 px focus ring, labelled selects/buttons, modal initial focus, Escape close, and invoker focus restoration. **Resolved.** |
| PMA-005 | Architecture / Agentic AI | Canonical architecture and reviewer prompts originally reflected the earlier implemented slice. | Future reviewers could mistake current implementation for full V1 or omit later agent boundaries. | P2 | Added the 13-agent canonical architecture and updated reviewer/agent indexes to distinguish full V1, current slice, and future slices. **Resolved.** |
| PMA-006 | Architecture | The orchestrator package initially reassigned `__all__`, hiding its pre-existing workflow exports from wildcard consumers. | A public package surface could regress even though direct imports still passed. | P2 | Consolidated old and new orchestrator symbols into one explicit export list and re-ran import/test gates. **Resolved.** |

### Initial severity summary

- P0: 0
- P1: 3
- P2: 3
- P3: 0

Re-review found every P1 and P2 resolved with no regression in owner isolation, stage guards,
deterministic outcomes, decision attribution, event provenance, or Discover → Assess behavior.

## Remaining P2 / P3 follow-ups

| ID | Finding | Severity | Owner / treatment |
| --- | --- | --- | --- |
| PMA-007 | Sessions, decisions, events, and audit records are process-local; production needs durable append-only storage, retention/deletion, transactions, concurrency controls, idempotency keys, jobs, retries/timeouts, recovery, and telemetry. | P2 | Platform / Reliability before any production-data or multi-instance release. Current storage is explicitly labelled ephemeral. |
| PMA-008 | The inherited Next.js/PostCSS advisory remains deferred because automated remediation requires the separate breaking Next.js 16 upgrade. | P2 | Web / Security in the existing dependency-upgrade follow-up; no dependency changed here. |
| PMA-009 | A blocked required source field is correctly stopped, but remediation occurs outside this slice rather than through a dedicated repair/deep-link workflow. | P2 | Product / Migration in Migrate → Resolve and source-remediation design; the blocker and required action remain visible. |
| PMA-010 | Production event instrumentation, privacy review, metric owners, denominators, baselines, targets, and data-quality monitoring do not exist. | P3 | Product / Metrics before measured-outcome reporting. Contracts only are claimed. |
| PMA-011 | Proposal evidence includes the plan-wide assessment set in addition to the proposal-specific mapping rule, which is safe but broader than the ideal reviewer context. | P3 | Knowledge / UX refine relevance ranking when the evidence corpus grows. No raw rows are exposed. |
| PMA-012 | Activity shows the most recent twelve items without filters or collapse controls. | P3 | UX when durable activity volume is introduced. Current activity remains semantically ordered. |
| PMA-013 | Backend tests emit the inherited Starlette `TestClient` deprecation warning. | P3 | Engineering during dependency maintenance. |
| PMA-014 | Gemini and a production Knowledge retrieval adapter are not active; only the structured seam and deterministic fallback ship. | P3 | Agent / Platform immediate enhancement after product value justifies model and retrieval evaluation. |

These follow-ups are non-blocking for the synthetic public-reference Beta slice and remain blockers
for any unsupported production claim where applicable.

## Canonical rubric verification

The post-implementation governance audit found one additional issue:

| ID | Reviewer | Finding | Severity | Remediation and status |
| --- | --- | --- | --- | --- |
| RV-001 | Product / Agentic AI / Migration | The three canonical depth rubrics and explicit reviewer mappings were absent, so the declared reviewers had no stable criterion-level scoring contract. | P1 | Added all three canonical rubrics with the required seven-field criterion contract, wired each reviewer explicitly, indexed the documents, and applied every relevant criterion below. **Resolved.** |

Scores below are evidence summaries per criterion. They are intentionally not averaged or converted
into an overall vanity score. `None` in the severity column means the criterion produced no finding
for the declared synthetic Beta scope.

### Product Management Rubric application

| Criterion | Score | Evidence | Gap | Why it matters to MoveBooks AI | Why it matters to the end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Problem significance and target user | 3 | The review and slice architecture name the migration owner, the pre-write mapping decision, and the bounded outcome. | No representative customer research validates frequency or magnitude. | Keeps the product centered on consequential migration decisions. | Ensures planning and approvals reduce real uncertainty rather than add ceremony. | P3 | Validate the problem and decision model with representative migration owners before production prioritization. |
| Canonical journey and outcome alignment | 4 | The ten-stage stepper, guarded workflow states, seven-phase plan, and future-agent handoff preserve Discover through verified FPU. | None for the declared slice. | Maintains one coherent product journey and agent architecture. | Prevents preparation from being mistaken for completed migration or FPU. | None | Preserve the same state and completion contracts in later slices. |
| Scope, non-goals, and beta boundary | 4 | Architecture, UI, review record, and tests explicitly state synthetic data, no provider connection, no target write, and no production-readiness claim. | None for the declared slice. | Prevents accidental commitments and scope inflation. | Makes capability and risk understandable before a user authorizes anything. | None | Continue enforcing truthful status language in PR review. |
| User value and actionability | 3 | Plan cards answer sequence, dependency, customer action, and checkpoint; mapping cards expose rationale, confidence, evidence, and decisions; mobile/keyboard/error paths were verified. | No representative usability or comprehension study exists. | Turns agent output into governed progress rather than passive analysis. | Users can decide, defer, or stop with context. | P3 | Run task-based usability and comprehension tests before production UX sign-off. |
| Progressive trust and decision ownership | 4 | Every proposal requires an owner decision; sensitive, low-confidence, invalid, rejected, and blocked states stop handoff; decisions are attributed and revalidated server-side. | None for the declared slice. | Implements the product's progressive-trust differentiation. | Keeps accounting treatment under human control. | None | Retain approval isolation and adversarial bypass tests as execution is added. |
| Metrics and evidence discipline | 2 | Versioned product events support plan, review, decision, escalation, and handoff measures; the review explicitly avoids measured-result claims. | Instrumentation, owners, denominators, baselines, privacy review, and data-quality monitoring are absent. | Prevents activity and recommendation acceptance from replacing customer outcomes. | Keeps correctness, burden, and FPU visible when metrics are introduced. | P3 | Define production metric contracts and ownership before using event data for product decisions. |
| Product coherence, business fit, and truthful demo | 3 | The new route reuses the design system, session, canonical journey, provider-neutral contracts, and deterministic fallback; the browser run reaches meaningful governed decisions without credentials. | Strategic/customer value and cost-to-serve are not validated outside the reference implementation. | Avoids a disconnected demo or model-dependent cost structure. | Produces a consistent experience without hidden manual intervention. | P3 | Add customer and operating-cost evidence before commercial or adoption claims. |

### Agentic AI Rubric application

| Criterion | Score | Evidence | Gap | Why it matters to MoveBooks AI | Why it matters to the end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agent necessity and ownership | 3 | The canonical 13-agent model distinguishes implemented/future agents; four specialists have distinct areas, tools, structured outputs, evidence, confidence, and escalations; deterministic checks remain tools. | Specialist quality is covered by synthetic cases rather than representative live-model evaluations. | Avoids agent-count theatre and competing ownership. | Makes responsibility and escalation behavior predictable. | P3 | Expand per-specialist evaluation sets before enabling Gemini recommendations. |
| Orchestration and workflow state | 4 | One orchestrator enforces `ASSESSED → PLANNED → MAPPING → AWAITING_APPROVAL → APPROVED`, rejects out-of-order work, and requires clear blockers plus completed decisions. | None for the declared slice. | Makes agent activity reproducible and governable. | Prevents skipped stages and premature migration readiness. | None | Preserve single-owner transitions in Migrate → Resolve. |
| Tool authority and least privilege | 4 | Plan dependencies, target compatibility, account types, required fields, evidence, duplicates, and approval policy are server-side deterministic controls with bypass regressions. | None for the declared slice. | Keeps financial constraints outside probabilistic reasoning. | Prevents unsupported mappings even if a client or future model proposes them. | None | Require approved manifests and scoped write tools in the next execution slice. |
| Evidence, provenance, confidence, and explanations | 3 | Proposals expose confidence, risk, rationale, evidence, policy reasons, specialist, provenance, and decision attribution without chain-of-thought. | Plan-wide assessment evidence is broader than the ideal proposal-specific context. | Enables defensible reviews and later quality evaluation. | Helps users understand why a proposal is safe, ambiguous, or blocked. | P3 | Rank and display the smallest relevant evidence set as the corpus grows. |
| Human governance and escalation | 4 | High-risk, sensitive, low-confidence, incomplete, and unsupported proposals require review or block; agents cannot self-approve; approve/modify/reject actions are audited. | None for the declared slice. | Enforces human ownership of consequential financial choices. | Gives users control and a safe stop when automation is uncertain. | None | Add delegated-role authorization tests when production identity is introduced. |
| Failure handling, idempotency, and safe stopping | 2 | Repeated plan/mapping creation is locally idempotent, errors surface as stopped UI state, and incomplete/rejected/blocked proposals prevent handoff. | No durable jobs, idempotency keys, retry/timeout policy, concurrency control, or recovery testing. | Prevents duplicate or divergent migration actions as the platform scales. | Allows recovery without hidden or repeated financial changes. | P2 | Add durable workflow execution and recovery controls before production writes. |
| Security, privacy, and auditability | 2 | Synthetic-only data, owner-scoped sessions, minimized events, browser-event restrictions, decision attribution, and secret scans pass. | Demo identity and process-local audit records are not production-grade or immutable. | Financial migrations require defensible isolation and evidence. | Protects records and prevents decisions being exposed or falsely attributed. | P2 | Add production identity, durable append-only audit storage, retention, and independent authorization tests. |
| Evaluation, fallback, and runtime portability | 3 | Twelve executable golden cases cover normal, ambiguous, unsafe, decision, repeatability, plan, and handoff behavior; deterministic fallback works without Gemini; ADK remains an adapter boundary. | No live Gemini quality set, drift monitoring, or continuous representative evaluation exists. | Keeps product safety independent of model/runtime availability. | Provides predictable behavior during model outage or change. | P3 | Gate Gemini activation on representative quality, calibration, safety, and fallback evaluations. |

### Migration & Onboarding Rubric application

| Criterion | Score | Evidence | Gap | Why it matters to MoveBooks AI | Why it matters to the end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source, target, and canonical boundaries | 3 | The implementation reads a versioned synthetic fixture, uses canonical mapping areas and provider-neutral targets, and performs no source mutation or target write. | No representative source/target adapter pair has validated the canonical boundary. | Preserves extensibility beyond one accounting provider. | Reduces the chance that provider quirks silently change accounting meaning. | P3 | Validate the canonical contracts with representative adapters before provider claims. |
| Readiness, planning, and dependencies | 4 | Assessment findings become versioned plan blockers/risks; seven phases have ordered dependencies, customer actions, owners, and checkpoints; dependency and premature-handoff tests pass. | None for the declared slice. | Converts evidence into a governed execution strategy. | Shows what must happen, why, and what still blocks progress. | None | Preserve blocker lineage as resolution capabilities are added. |
| Mapping and accounting compatibility | 4 | Accounts, customers, vendors, products/services, tax, and configuration use versioned schema, required-field, canonical-target, account-type, evidence, duplicate, sensitivity, and jurisdiction controls. | None for the declared synthetic fixture. | Mapping correctness is central to migration quality. | Prevents misclassification of financial and operational records. | None | Expand golden coverage with more complex accounting and tax variants before production. |
| Human approval and migration handoff | 4 | Every mapping has an attributable approve/modify/reject path; modifications are revalidated; blocked/rejected/pending states stop; approved handoff performs no write. | None for the declared slice. | Separates recommendation, authorization, and future execution. | Makes exactly what was authorized visible before data movement. | None | Carry the immutable approved manifest into the next slice. |
| Blockers, unsupported items, and exception ownership | 3 | Missing fields and unsupported configuration produce visible blocked or review states and named customer actions; they cannot silently progress. | The current workspace cannot repair a blocked source field or deep-link to a dedicated resolution workflow. | Prevents false readiness and silent loss. | Users need a clear route from detection to correction. | P2 | Add explicit remediation ownership/deep links in the appropriate Resolve workflow, not this branch. |
| Lineage, evidence, and audit integrity | 2 | Plans and mappings retain evidence IDs, policy versions, actor, time, comments, events, and activity provenance. | Storage is process-local and audit immutability/recovery are not implemented. | Makes accounting decisions reproducible and defensible. | Lets users reconstruct what changed, why, and by whom. | P2 | Introduce durable append-only evidence and audit persistence before production use. |
| Execution, validation, and recovery boundary | 3 | The plan names future execution, validation, checkpoints, and authorization; the current orchestrator stops at a clean approved handoff and never claims a write or reconciliation. | Execution, reconciliation, exceptions, and rollback are intentionally unimplemented. | A truthful boundary is safer than partial financial execution. | Users are not told a migration succeeded before deterministic validation. | None | Implement these controls only in the future Migrate → Resolve and Validate slices. |
| Onboarding and verified First Productive Use continuity | 2 | The canonical journey and seven-phase plan retain Configure, Onboard, and verified FPU checkpoints and explicitly reject training-only completion. | Only the future boundary exists; configuration, onboarding, and FPU evidence are not implemented. | Keeps ultimate customer value visible beyond data movement. | Ensures eventual success means an authorized user can perform the intended task. | P3 | Preserve the versioned FPU contract through later slices; do not claim completion early. |

### Rubric verification outcome

- Canonical rubric structures: **verified**
- Product Reviewer → Product Management Rubric: **verified**
- Agentic AI Reviewer → Agentic AI Rubric: **verified**
- Migration Reviewer → Migration & Onboarding Rubric: **verified**
- Aggregate vanity score: **not created**
- Unresolved rubric P0: **0**
- Unresolved rubric P1: **0**
- **RUBRIC VERIFICATION: GREEN**

## Product scorecard assessment

Statuses apply to this synthetic public-reference slice, not production migration readiness or
measured customer impact.

| Dimension | Status | Evidence / action |
| --- | --- | --- |
| User | GREEN | One bounded start, explicit sequence, evidence, decisions, stop state, and next action. |
| Customer outcome | GREEN | Advances planning comprehension and governed decision completion; no FPU claim. |
| Business | GREEN | Demonstration value is credible and no paid dependency or unsupported adoption claim is added. |
| Product | GREEN | Fits the canonical journey and stops before Migrate → Resolve. |
| Migration quality | GREEN | Versioned dependencies, target constraints, blockers, approvals, and handoff guards are explicit and tested. |
| Agent quality | GREEN | Parent/specialist authority, tools, state, escalation, evidence, and stopping behavior are bounded. |
| GenAI quality | GREEN | No model result is represented as active; the structured seam and deterministic fallback are explicit and tested. |
| Deterministic quality | GREEN | Twelve golden cases plus compatibility, repeatability, bypass, and safe-stop regressions pass. |
| Safety / trust | GREEN | Consequential decisions remain human, evidence-backed, attributable, and unable to bypass failed controls. |
| Security / privacy | GREEN | Synthetic-only, owner-scoped, no credentials/model egress, minimized events, and no browser-forged internals. |
| Reliability / operations | GREEN | Idempotent local artifact creation and error safe-stop pass; PMA-007 is an explicit production gate. |
| Engineering quality | GREEN | Ruff, lint, typecheck, tests, build, links, whitespace, and secret patterns pass. |
| Evaluation maturity | GREEN | Twelve executable golden cases and backend/API/UI coverage match the declared scope. |
| UX / accessibility | GREEN | Both themes, desktop/mobile, keyboard/focus, native dialog, semantic states, errors, and reduced-motion controls verified. |
| Platform scalability | GREEN | Provider-neutral domain, persistence port, recommendation seam, ADK-ready contracts, and future agent boundaries are preserved. |
| Feedback / support | NOT APPLICABLE | The slice performs no production operation or customer-data handling; Product and Release reviewers confirmed support UI is outside this bounded artifact. |
| Demo readiness | GREEN | A real local path produces a plan, mappings, evidence, governed decisions, activity, and a truthful stopped state. |

## Quality gates

| Gate | Result |
| --- | --- |
| Ruff | PASS |
| Backend tests | PASS — 51 tests; one known Starlette deprecation warning |
| Golden evaluation scenarios | PASS — 12 cases |
| Frontend lint | PASS |
| TypeScript / typecheck | PASS |
| Frontend tests | PASS — 16 tests |
| Production frontend build | PASS — Next.js 15.5.26; `/plan-map-approve` generated successfully |
| Canonical rubric schema and reviewer wiring | PASS — 23 criteria across 3 rubrics |
| Markdown local links | PASS — 77 Markdown files checked |
| Whitespace / `git diff --check` | PASS |
| Secret scan | PASS — no credential/private-key patterns in source outside lockfile integrity hashes |
| Live desktop / mobile journey | PASS |
| Light / dark / keyboard / focus / dialog / statuses / reduced motion | PASS |

## Final readiness

- Final unresolved P0: **0**
- Final unresolved P1: **0**
- Remaining P2: **3**
- Remaining P3: **5**
- Release readiness: **GREEN for the synthetic public-reference Beta slice**
- Demo readiness: **GREEN**
- Accepted P1 risks: none
- Recovery: revert the feature commit; current sessions are ephemeral and no external or financial
  state was created.
- Merge recommendation: publish for CI and human review after the feature commit. Do not merge
  automatically.
- Recommended next phase after human approval: **Migrate → Resolve**. Do not implement it in this
  branch.
