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
| Markdown local links | PASS — 74 Markdown files checked |
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
