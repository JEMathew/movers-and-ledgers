# Review: Discover → Assess vertical slice

Review date: `2026-09-27`

Branch / baseline: `feature/discover-assess` / `c50d217`

## Scope and customer problem

- **Customer problem:** a migration owner needs to understand source-data readiness and credible
  blockers before committing to planning, mapping, credentials, or target writes.
- **In scope:** protected synthetic-company selection; Discovery and Assessment agents;
  deterministic profiling, schema, reference, duplicate, configuration, and readiness tools;
  evidence-backed findings; audit-safe activity; owner-scoped ephemeral API state; product-event
  contracts; responsive UX; and golden evaluations.
- **Out of scope:** customer uploads, provider connections, Plan → Map & Approve, financial writes,
  durable infrastructure, production identity, production analytics, and deployment.
- **Credible blast radius:** the new `/assess` route and versioned session API. The feature reads one
  repository-owned synthetic fixture and performs no external or financial mutation.
- **Expected outcome:** users can identify what is ready, what needs attention, what blocks progress,
  why, and the corrective action. No measured business or First Productive Use result is claimed.

## Architecture and journey

The user enters the protected Assess experience, selects **Northstar Supplies**, and starts one
owner-scoped migration session. The Discovery Agent invokes deterministic tools and packages their
evidence into profiles and findings. The Assessment Agent applies
`discover-assess-readiness-v1`. The result page shows ready, warning, and blocked areas, recommended
actions, and customer-safe agent activity. **Continue to Planning** records intent and explains that
Plan → Map & Approve is future, human-governed work; it does not advance workflow state.

The detailed boundary, persistence port, and routes are recorded in the
[Discover → Assess architecture](../architecture/discover-assess.md).

## Deterministic rules

| Tool / policy | Authority and output |
| --- | --- |
| `profile_dataset` | Counts source rows and required-value gaps. |
| `validate_schema` | Blocks absent datasets and financial-critical field gaps; warns on non-critical gaps. |
| `validate_referential_integrity` | Blocks unresolved critical invoice relationships. |
| `detect_duplicates` | Warns on deterministic legal-suffix-normalized candidates; never merges records. |
| `validate_configuration` | Warns on unknown keys or values outside declared target assumptions. |
| `calculate_readiness` | Any blocker → `BLOCKED`; warnings without blockers → `NEEDS ATTENTION`; otherwise → `READY`. |

The agents call these tools, collect evidence, and format results. They do not inspect model output,
send raw rows to an LLM, mutate source data, approve decisions, or write to a target. Every finding
records its rule, category, affected entity/count, evidence, next action, tool, deterministic
provenance, and customer-action flag. Every activity records session, agent, tool, timestamp, risk,
provenance, evidence references, and approval/action flags without chain-of-thought.

## Synthetic data and evaluation

Northstar Supplies includes Company, Customers, Vendors, Chart of Accounts, Invoices, Transactions,
and Configuration. The published fixture intentionally yields one blocker and three warnings:

- one invalid invoice-to-customer relationship;
- one missing vendor display name;
- one duplicate-customer candidate group;
- one unsupported inventory-valuation setting;
- clean Company, Chart of Accounts, and Transactions areas.

The executable `discover-assess-golden-v1` suite contains six cases:

| Scenario | Expected result |
| --- | --- |
| Clean company | `READY` |
| Duplicates only | `NEEDS ATTENTION` |
| Required dataset missing | `BLOCKED` |
| Critical reference failure | `BLOCKED` |
| Unsupported non-critical configuration | `NEEDS ATTENTION` |
| Published fixture repeated twice | Identical findings and readiness |

Tests verify tool choice, expected rules/categories, evidence presence, readiness, repeatability,
owner isolation, audit records, precondition stops, and rejection of forged internal events. No
unsupported autonomous action is present in the tool or agent contracts.

## Metrics and event contracts

The lightweight contracts are `assessment_started`, `discovery_started`, `discovery_completed`,
`finding_generated`, `assessment_completed`, `assessment_blocked`, and
`continue_to_plan_selected`. Internal lifecycle events are emitted only by the application service;
the customer endpoint accepts only the customer-originated Planning-selection event. Events remain
ephemeral. There is no production pipeline, owner, baseline, target, or outcome claim.

## Review evidence and perspectives

- **Evidence:** complete branch diff; governance; architecture; threat model; API and agent contracts;
  Northstar fixture; golden cases; automated tests; production build; and live local end-to-end run.
- **Reviewers:** Product, Customer Outcome, Migration, Agentic AI, FinTech Trust, UX,
  Accessibility, Architecture, Security, Metrics, Release Readiness, and Demo.
- **Browser verification:** desktop light and dark, 390 px mobile, mobile navigation, native keyboard
  traversal, visible focus, semantic headings/lists/statuses, loading/error handling, and future-state
  CTA. Reduced-motion behavior was verified from the shared media-query control: all animation and
  transition durations collapse while state text remains present.
- **Evidence gaps:** no customer research outcome, production load/chaos exercise, screen-reader lab
  test, durable-store recovery test, or production telemetry exists; none is claimed for this
  synthetic public-reference Beta slice.

## Initial findings and remediation

| ID | Reviewer | Finding | Evidence / why it matters | Severity | Remediation and status |
| --- | --- | --- | --- | --- | --- |
| DA-001 | Security / Metrics / Agentic AI | The first event endpoint accepted internal lifecycle event names from a browser client. | A caller could manufacture `assessment_completed` evidence and corrupt future trust or metrics semantics. | P1 | Restricted the route to `continue_to_plan_selected` and added a rejection test. **Resolved.** |
| DA-002 | Migration / Deterministic Quality | Configuration validation ignored keys absent from the supported-capability map. | An unknown source setting could be incorrectly presented as ready. | P1 | Unknown keys now generate `UNSUPPORTED_CONFIGURATION`; added a regression test. **Resolved.** |
| DA-003 | Product / UX / Accessibility | The first result composition did not explicitly summarize Ready, Needs Attention, and Blocked areas, and sample/upload labels did not match the journey contract. | Users had to infer the most important decision state from individual cards. | P1 | Added three named result groups, exact synthetic-company labelling, and disabled **Coming next** upload treatment. **Resolved.** |
| DA-004 | Deterministic Quality | Legal-suffix-only names could normalize to an empty duplicate key. | Unusual bad data could create a false duplicate warning. | P2 | Empty normalized names are excluded; required-field checks still expose missing/invalid names. **Resolved.** |
| DA-005 | Architecture | The initial ephemeral store was a concrete dependency without a persistence port. | A later durable adapter would otherwise couple application logic to process memory. | P2 | Added `MigrationSessionRepository` and kept the in-memory adapter behind it. **Resolved.** |
| DA-006 | UX / Demo | Initial activity labels only said “Checked dataset.” | The timeline did not explain what each tool established. | P2 | Activity now uses the deterministic evidence summary and retains tool, risk, provenance, and evidence ID. **Resolved.** |
| DA-007 | UX | Referential finding copy used “customers references.” | Awkward copy weakens trust in a financial migration assessment. | P3 | Singularized target-entity labels in user-facing findings. **Resolved.** |

### Initial severity summary

- P0: 0
- P1: 3
- P2: 3
- P3: 1

Re-review found every P1 resolved and no regression in deterministic outcomes, authorization,
activity, event emission, or the protected journey.

## Remaining P2 / P3 follow-ups

| ID | Finding | Severity | Owner / treatment |
| --- | --- | --- | --- |
| DA-008 | Sessions and events are single-process and ephemeral; production needs durability, retention/deletion, idempotency, job retry/timeouts, concurrency control, backups, and telemetry. | P2 | Platform / Reliability before any production-data or multi-instance release. The UI and architecture label current storage as ephemeral. |
| DA-009 | The inherited Next.js/PostCSS advisory remains deferred because automated remediation requires the separate breaking Next.js 16 upgrade. | P2 | Web / Security in the existing dependency-upgrade follow-up; no dependency changed here. |
| DA-010 | The complete activity timeline is long on mobile and has no filtering or collapse control. | P3 | UX when activity volume grows; all current evidence remains readable and semantically ordered. |
| DA-011 | Event taxonomy is implemented, but production instrumentation, privacy review, owners, baselines, and data-quality monitoring remain absent. | P3 | Product / Metrics before measured-outcome reporting. |
| DA-012 | Backend tests emit the inherited Starlette `TestClient` deprecation warning. | P3 | Engineering during dependency maintenance. |

Production OAuth, provider adapters, upload security, reconciliation, support operations, and target
writes are explicit launch gates rather than implied capabilities of this slice.

## Product scorecard assessment

These statuses assess release of this synthetic public-reference slice, not production migration
readiness or measured customer impact.

| Dimension | Status | Evidence / action |
| --- | --- | --- |
| User | GREEN | One coherent entry, progress model, result, explanation, and next action. |
| Customer outcome | GREEN | The slice advances pre-planning comprehension; no FPU result is claimed. |
| Business | GREEN | Demonstration value and bounded cost are clear; no adoption/revenue claim or paid service is introduced. |
| Product | GREEN | Fits canonical Discover → Assess and stops before Plan. |
| Migration quality | GREEN | Versioned blocker/warning rules cover declared scope; no write or false reconciliation claim. |
| Agent quality | GREEN | Two bounded orchestrators, fixed tools, structured state/evidence, safe stop, and audit tests. |
| GenAI quality | NOT APPLICABLE | No GenAI executes or contributes to findings; Agentic AI reviewer confirmed the rationale. |
| Deterministic quality | GREEN | Six golden cases, repeatability, tool unit tests, and no numeric confidence score. |
| Safety / trust | GREEN | Evidence and provenance are visible; internal events cannot be client-forged; no consequential action occurs. |
| Security / privacy | GREEN | Synthetic-only data, required identity seam, owner predicates, no secrets/provider egress, and minimized activity data. |
| Reliability / operations | GREEN | Failure/retry UX and deterministic API behavior pass for the local Beta; DA-008 is a production gate. |
| Engineering quality | GREEN | Lint, typecheck, tests, build, Ruff, whitespace, local links, and secret scan pass. |
| Evaluation maturity | GREEN | Six executable golden cases plus API and UI journey coverage; production/human evidence remains future. |
| UX / accessibility | GREEN | Both themes, responsive layout, keyboard/focus, semantic status, error recovery, and reduced motion verified. |
| Platform scalability | GREEN | Provider-neutral domain and persistence port preserve adapter evolution; durable operations remain DA-008. |
| Feedback / support | NOT APPLICABLE | This synthetic demo stores no customer data and implements no support workflow; Product reviewer confirmed the bounded scope. |
| Demo readiness | GREEN | The real end-to-end path reaches meaningful blocker/warning evidence without credentials or hidden intervention. |

## Quality gates

| Gate | Result |
| --- | --- |
| Frontend lint | PASS |
| TypeScript / typecheck | PASS |
| Frontend tests | PASS — 12 tests |
| Production frontend build | PASS — Next.js 15.5.26; `/assess` generated successfully |
| Ruff | PASS |
| Backend tests | PASS — 27 tests; one known Starlette deprecation warning |
| Golden evaluation scenarios | PASS — 6 cases |
| Markdown local links | PASS |
| Whitespace / `git diff --check` | PASS |
| Secret scan | PASS — no credential/private-key patterns in tracked source outside lockfile integrity hashes |
| Live desktop / mobile journey | PASS — API calls and future-state CTA verified |
| Light / dark / keyboard / focus / statuses / reduced motion | PASS |

## Final readiness

- Final unresolved P0: **0**
- Final unresolved P1: **0**
- Remaining P2: **2**
- Remaining P3: **3**
- Release readiness: **GREEN** for the synthetic public-reference Beta slice
- Demo readiness: **GREEN**
- Accepted P1 risks: none
- Recovery: revert the feature commit; sessions are ephemeral and no external or financial state was
  created.
- Merge recommendation: ready for CI and human review after the feature branch is published. Do not
  merge automatically.
- Recommended next phase after human approval: **Plan → Map & Approve**. Do not implement it in this
  branch.
