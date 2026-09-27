# Review: Migrate → Resolve vertical slice

Review date: `2026-09-27`

Branch / baseline: `feature/migrate-resolve` / `64b8a92`

## Scope and user journey

- **Customer problem:** a migration owner needs financial-data movement to be visible, resumable,
  and safely stopped when an exception needs a decision.
- **In scope:** approved-manifest enforcement; ordered deterministic batches; a provider-neutral
  synthetic target; checksums, idempotency, checkpoints, progress, controlled failures, bounded
  resolution specialists, evidence-backed remediation, human decisions, retry/resume, audit events,
  owner-scoped APIs, a responsive UI, and fourteen executable golden cases.
- **Out of scope:** real accounting-provider APIs or writes, customer data, reconciliation,
  Validate, Configure, Onboard, First Productive Use, deployment, durable workers, and production
  readiness.
- **Journey:** Approved mappings → Start migration → Progress → Controlled failure → Safe pause →
  Resolution explanation → Human decision → Retry/resume → Completion → locked future Validate
  handoff.
- **Readiness scope:** GREEN applies only to this synthetic public-reference Beta slice. It is not a
  production migration, reconciliation, security, or availability claim.

## Agent workflow, deterministic tools, and target

The [slice architecture](../architecture/migrate-resolve.md) and
[canonical workflow](../architecture/AGENT_WORKFLOWS.md) define the boundaries. One Migration
Orchestrator owns `APPROVED → MIGRATION_READY → MIGRATING → MIGRATION_PAUSED → RESOLVING →
RETRY_PENDING → MIGRATING → MIGRATION_COMPLETE`, plus an explicit blocked terminal state. A future
Validate handoff requires completion, `safe_to_validate`, and zero unresolved blocking failures.

The Migration Agent consumes the approved plan version and mapping IDs/checksum, creates ordered
batches, and invokes deterministic extraction, canonical transformation, validation, idempotent
synthetic load, checkpoint, progress, pause/resume, and event controls. It cannot calculate
financial results, reinterpret mappings, or call provider APIs.

The Resolution Agent uses versioned failure policy and repository knowledge, then delegates to a
bounded Duplicate, Referential Integrity, Tax/Configuration, or Retry/Recovery specialist. A
Migration Recovery Coordinator owns non-retryable escalation. Each path has a structured failure
input, allowlisted tools, structured proposal, evidence, confidence, risk, and escalation rule.
Simple ETL operations remain tools rather than agents.

The target is an inspectable process-local dictionary keyed by canonical entity. Source records are
copied, retain source ID/checksum lineage, and are never mutated. No production target adapter,
credential, external egress, or paid resource exists.

## Model routing, Gemini, ADK, Knowledge, and HITL

Capability-level policy routes migration execution and governance to deterministic controls,
resolution reasoning to an ADK-compatible Gemini 2.5 Pro path, concise explanation to an
ADK-compatible Gemini 2.5 Flash path, and knowledge to the versioned repository. The active fallback
is entirely deterministic and works without credentials. No Gemini result is claimed or evaluated
in this release.

Migration and Resolution have optional ADK-compatible leaf definitions. They have no import-time
network side effect and no authority over policy, target writes, or approvals. Parent/sub-agent
delegation, session state, and evaluation remain owned by local typed orchestration; managed Agent
Runtime, model callbacks, Vertex AI Search, and production model monitoring are later hardening.

Low-risk retryable failures with a deterministic remedy may auto-resolve. Medium/high-risk and
accounting-sensitive remediation requires an attributable human approval. Rejection, unsupported
actions, non-retryable failures, and exhausted retries block. The Resolution Agent cannot approve
its proposal or mutate free-form financial data.

## Idempotency, recovery, APIs, events, and metrics

Start requires a bounded idempotency key. Repeating the same key returns the same execution; a
different key cannot start a second execution for the manifest. Batch keys prevent duplicate loads.
Successful batches append completed IDs and a target checksum. Retry begins at the failed batch and
preserves prior checkpoints. Retry limits are authoritative. `CheckpointStore` is the durable port;
the Beta session repository remains intentionally ephemeral.

Owner-scoped resources expose execution, batches, progress, failures, resolution proposals,
decisions, retry, resume, activity, and the synthetic target. Internal migration events cannot be
submitted through the browser event endpoint. The event taxonomy covers every requested start,
batch, pause, resolution, retry, resume, completion, and blocked state.

The [metrics framework](../METRICS_FRAMEWORK.md) defines future contracts for completion, duration,
batch success, exceptions, auto/human resolution, retry success, blocking, recovery time,
escalation, duplicate prevention, and customer intervention. There is no production instrumentation,
owner, baseline, target, or measured value, and none is fabricated.

## Evaluations

`migrate_resolve_cases.json` declares fourteen golden cases and executable tests cover:

1. clean migration success;
2. retryable transient failure;
3. duplicate conflict resolution;
4. referential-integrity failure;
5. tax/configuration resolution;
6. user approval;
7. user rejection;
8. successful retry;
9. retry-limit blocking;
10. non-retryable blocking;
11. duplicate execution prevention;
12. deterministic policy repeatability;
13. checkpoint-preserving resume;
14. unresolved-exception denial of the future Validate handoff.

Additional checks cover approved-manifest prerequisites, owner/authentication isolation, forged
event rejection, remediation records, knowledge evidence, UI failure explanation, and dialog
decisions.

## Initial reviewer findings and remediation

| ID | Reviewer | Finding | Severity | Remediation and status |
| --- | --- | --- | --- | --- |
| MR-001 | Migration / Agentic AI / Trust | Non-retryable failures initially stopped without invoking the recovery coordinator, and rejected/exhausted paths did not preserve an explicit session-level blocked state. | P1 | Added `MIGRATION_BLOCKED`, a structured escalated recovery proposal, blocked-state events, and regression coverage. **Resolved.** |
| MR-002 | Architecture / FinTech Trust | The first Resolution Agent implementation directly changed execution/failure state, leaving the remediation authority in agent code. | P1 | Moved authorized remediation into `apply_resolution_control`, which validates approval, retryability, evidence, idempotent action recording, and retry state. **Resolved.** |
| MR-003 | Migration / Audit | The initial execution stored only a plan version, not the approved mapping identities or manifest checksum. | P1 | Execution now records approved mapping IDs and a stable plan/mapping manifest checksum, emitted at start. **Resolved.** |
| MR-004 | Accessibility / UX | The failure path required explicit evidence that the decision remained understandable without orb animation and was keyboard-operable. | P2 | Status text/progress remain independent of motion; native labelled dialog, explicit buttons, focus styling, responsive reading order, and reduced-motion fallback were verified. **Resolved.** |
| MR-005 | Security / Metrics | Browser clients could have corrupted internal completion evidence if the pre-existing event boundary were broadened. | P1 | The browser route remains limited to its one customer-originated event; a regression rejects `migration_completed`. **Resolved.** |

Initial summary: P0 **0**, P1 **4**, P2 **1**, P3 **0**. Re-review found no unresolved P0/P1.

## Canonical rubric results

Scores are criterion-level evidence summaries and are not averaged into a vanity score. `None`
means the criterion produced no finding for this declared synthetic scope.

### Product Management Rubric

| Criterion | Score | Evidence | Gap | Why it matters to MoveBooks AI | Why it matters to the end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Problem significance and target user | 3 | Scope names the migration owner, safe execution/recovery job, and bounded outcome. | No representative customer research. | Focuses investment on consequential migration risk. | Makes failure recovery understandable and actionable. | P3 | Validate the workflow with migration owners before production prioritization. |
| Canonical journey and outcome alignment | 4 | Ten-stage UI and guarded handoff stop before Validate/FPU. | None for scope. | Preserves one coherent product. | Prevents movement from being mistaken for verified success. | None | Keep future completion gates explicit. |
| Scope, non-goals, and beta boundary | 4 | UI, docs, fixture, target, and tests consistently say synthetic/no-provider-write. | None for scope. | Prevents false capability commitments. | Users know what is and is not being changed. | None | Retain misuse tests and explicit copy. |
| User value and actionability | 3 | Progress, batches, current agent, failure, evidence, remediation, retry, and next gate are visible. | No representative usability study. | Converts agent activity into a governed decision. | Users can approve, reject, retry, or stop with context. | P3 | Run task-based comprehension and recovery testing. |
| Progressive trust and decision ownership | 4 | Risk-based policy, attributable approval/rejection, safe pause, and no self-approval are enforced. | None for scope. | Trust differentiates financial migration. | Consequential action remains under user control. | None | Add delegated-role tests with production identity. |
| Metrics and evidence discipline | 2 | Future formulas and event taxonomy exist; no values are claimed. | No production instrumentation, owners, baselines, or quality controls. | Prevents activity/autonomy from masquerading as success. | Keeps correctness and burden visible. | P3 | Complete production metric contracts before outcome reporting. |
| Product coherence, business fit, and truthful demo | 3 | Reuses journey, design system, agent model, API, and synthetic fixture without paid services. | Strategic value/cost is unvalidated. | Avoids a disconnected AI demonstration. | Delivers a consistent, honest experience. | P3 | Validate customer value and cost-to-serve before commercial claims. |

### Agentic AI Rubric

| Criterion | Score | Evidence | Gap | Why it matters to MoveBooks AI | Why it matters to the end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agent necessity and ownership | 3 | Two parent agents, four reasoning specialists, one recovery coordinator, and deterministic ETL tools have distinct authority. | Specialists lack live-model quality evidence. | Avoids agent-count theatre and conflicting ownership. | Handoffs and escalation stay predictable. | P3 | Evaluate model-backed specialists before activation. |
| Orchestration and workflow state | 4 | One orchestrator enforces prerequisites, pause, approval, retry, blocking, completion, and future handoff. | No multi-worker concurrency evidence. | Makes execution reproducible and governable. | Prevents skipped approvals and false completion. | None | Preserve single-owner transitions in durable workers. |
| Tool authority and least privilege | 4 | Typed deterministic tools own checksums, validation, loads, checkpoints, and remediation application. | No production IAM/tool sandbox. | Keeps financial constraints outside model variability. | A persuasive explanation cannot bypass policy. | None | Add scoped service identities with real adapters. |
| Evidence, provenance, confidence, and explanations | 3 | Failures/proposals cite batch, checksum, policy, knowledge, risk, and confidence without chain-of-thought. | Confidence is policy-static, not calibrated on representative data. | Supports later evaluation and audit. | Users can see why action or escalation is needed. | P3 | Calibrate any future model confidence independently. |
| Human governance and escalation | 4 | Consequential proposals require human action; reject, unsupported, exhausted, and non-retryable paths block/escalate. | No delegated enterprise roles. | Prevents privilege escalation and self-approval. | Users retain authority over accounting-sensitive remediation. | None | Add role/delegation policy before production. |
| Failure handling, idempotency, and safe stopping | 3 | Fourteen cases cover duplicate keys, checkpoints, partial progress, bounded retries, blocking, and resume. | Persistence and concurrency are process-local. | Prevents duplicate/divergent actions. | Recovery does not replay completed work. | P2 | Add transactional durable jobs and crash/concurrency tests. |
| Security, privacy, and auditability | 3 | Synthetic data, auth/owner scope, minimized events, no secrets/model egress, human attribution, forged-event rejection. | Audit is mutable/process-local; production identity absent. | Financial workflows need defensible isolation. | Records and decisions are not cross-user or falsely attributed. | P2 | Add production identity, immutable audit, retention, and privacy controls. |
| Evaluation, fallback, and runtime portability | 3 | Fourteen golden cases, deterministic repeatability, no-credential fallback, capability routing, optional ADK seam. | No live Gemini/ADK quality, outage, or drift evaluation. | Keeps controls independent of one runtime. | The demo stays safely usable without a model service. | P2 | Add representative model sets and fallback/adapter contract tests before activation. |

### Migration & Onboarding Rubric

| Criterion | Score | Evidence | Gap | Why it matters to MoveBooks AI | Why it matters to the end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source, target, and canonical boundaries | 3 | Immutable fixture copies, canonical entity envelopes, checksums, and synthetic target separation are tested. | Only one synthetic adapter shape. | Preserves provider-neutral expansion. | Source meaning is not silently overwritten. | P3 | Validate representative adapters before provider claims. |
| Readiness, planning, and dependencies | 3 | Start requires an approved, blocker-free plan and complete mapping decisions. | Earlier artifacts remain in-memory. | Prevents execution from erasing prior evidence. | Users know prerequisites were satisfied. | P2 | Persist versioned manifests transactionally. |
| Mapping and accounting compatibility | 3 | Execution binds plan/mapping IDs/checksum and cannot change classifications. | No post-load reconciliation in this slice. | Protects mapping decisions through execution. | Approved meaning is preserved while data moves. | None | Validation must independently reconcile later. |
| Human approval and migration handoff | 4 | Server gate checks every mapping, records manifest evidence, and separates start from resolution decisions. | None for scope. | Keeps recommendation, authorization, and execution distinct. | Users know what they authorized and when. | None | Add production role assurance later. |
| Blockers, unsupported items, and exception ownership | 4 | Seven exception kinds have owner, evidence, action, policy, specialist, retry/escalation, and visible blocking. | None for declared cases. | Prevents silent loss or transformed-away exceptions. | Every material issue has a safe outcome. | None | Expand the taxonomy only with regression cases. |
| Lineage, evidence, and audit integrity | 3 | Source IDs/checksums, manifest checksum, policy/knowledge versions, decisions, action records, events, and checkpoints connect the trace. | Records are not durable/immutable. | Makes outcomes reproducible. | Users can reconstruct what happened and why. | P2 | Use append-only durable audit and retention policy. |
| Execution, validation, and recovery boundary | 3 | Approved-only idempotent synthetic writes, recovery, completion gates, and locked future Validate handoff are implemented. | Reconciliation/rollback and production recovery are future work. | Prevents movement from being called financial correctness. | Users are not told the migration is validated. | P2 | Implement deterministic Validate → Configure next; production recovery later. |
| Onboarding and verified First Productive Use continuity | 2 | Stepper and docs preserve future stages and do not claim FPU. | No implemented downstream contract in this branch. | Keeps migration tied to customer value. | Avoids calling technical movement productive success. | P3 | Implement later stages against the versioned FPU contract. |

## Formal reviewer outcome

| Reviewer | Outcome | Evidence / conclusion |
| --- | --- | --- |
| Product | GREEN | Meaningful recovery decision, truthful bounded scope, and coherent journey. |
| Customer Outcome | GREEN | Actionable progress without an FPU or production-success claim. |
| Migration | GREEN | Approved manifest, lineage, exceptions, checkpoints, retries, and future validation gate hold. |
| Agentic AI | GREEN | Authority is bounded; deterministic tools and humans remain authoritative. |
| GenAI Quality | GREEN | Model routes and fallback are explicit; no unevaluated model output is represented as active. |
| FinTech Trust | GREEN | No financial calculation or provider write; consequential remedies require approval. |
| UX | GREEN | Failure, reason, evidence, action, retry, and completion are explicit across responsive layouts. |
| Accessibility | GREEN | Semantic statuses, keyboard controls, native labelled dialog, visible focus, and reduced motion hold. |
| Architecture | GREEN | Provider-neutral domain, model policy, ports, tools, and stage boundaries remain separable. |
| Security | GREEN | Synthetic-only, authenticated owner scope, no secret/model egress, and forged-event rejection. |
| Metrics | GREEN | Future contracts exist and no measured outcomes are fabricated. |
| Release Readiness | GREEN | No unresolved P0/P1; production gaps are explicit gates. |
| Demo | GREEN | The real local flow visibly fails, pauses, resolves, retries, completes, and stays synthetic. |

## Product scorecard

All 17 dimensions are GREEN for this bounded synthetic reference slice: user, customer outcome,
business, product, migration, agent, GenAI, deterministic quality, safety/trust, security/privacy,
reliability/operations, engineering quality, evaluation maturity, UX/accessibility, platform
scalability, feedback/support, and demo readiness. `Feedback/support` is GREEN only for truthful
non-production scope: no support capability is claimed, and production support remains a launch gate.

## Remaining non-blocking findings

| ID | Finding | Severity | Treatment |
| --- | --- | --- | --- |
| MR-006 | Sessions, checkpoints, target state, and audit records are process-local; production needs transactions, concurrency control, durable jobs, crash recovery, immutable audit, backup/restore, telemetry, and compensation design. | P2 | Platform / Reliability before any production data or multi-instance execution. |
| MR-007 | Gemini and managed ADK/Agent Runtime are not active; model quality, outage, safety, and drift are unevaluated. | P2 | Agent / Evaluation before enabling model-backed resolution. Deterministic fallback remains active. |
| MR-008 | The inherited Next.js/PostCSS advisory requires a separately reviewed breaking Next.js 16 upgrade. | P2 | Web / Security dependency-upgrade follow-up. |
| MR-009 | Production analytics instrumentation, metric owners, baselines, targets, privacy, and data-quality monitoring are absent. | P3 | Product / Metrics before using metrics for decisions. |
| MR-010 | Activity has no filtering/export and event timestamps describe in-process recording rather than durable worker chronology. | P3 | UX / Operations with durable activity infrastructure. |
| MR-011 | Backend tests emit the inherited Starlette `TestClient` deprecation warning. | P3 | Engineering dependency maintenance. |
| MR-012 | No representative-user study, assistive-technology lab, production load/chaos test, or independent security review exists. | P3 | Required before expanding the readiness claim. |

## Quality gates

| Gate | Result |
| --- | --- |
| Ruff | PASS |
| Backend tests | PASS — 67 tests; one known Starlette deprecation warning |
| Golden evaluation scenarios | PASS — 14 cases |
| Frontend lint | PASS |
| TypeScript / typecheck | PASS |
| Frontend tests | PASS — 18 tests |
| Production frontend build | PASS — Next.js 15.5.26; `/migrate-resolve` generated |
| Markdown local links | PASS |
| Whitespace / `git diff --check` | PASS |
| Secret scan | PASS |
| Light/dark, desktop/mobile, keyboard/focus/dialog, statuses, error recovery, retry/resume, reduced motion | PASS |

## Final readiness

- Final unresolved P0: **0**
- Final unresolved P1: **0**
- Remaining P2: **3**
- Remaining P3: **4**
- Release readiness: **GREEN for the synthetic public-reference Beta slice**
- Demo readiness: **GREEN**
- Accepted P1 risks: none
- Recovery: revert the feature commit; all execution is local, ephemeral, and synthetic.
- Merge recommendation: publish for CI and human review after the feature commit. Do not merge
  automatically.
- Recommended next phase after human approval: **Validate → Configure**. Do not implement it in
  this branch.
