# Integrated Beta V1.0 architecture

Scope: one synthetic, public-reference business journey. No production readiness, live provider,
live Gemini, managed Google ADK runtime, or customer deployment claim.

Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential
decisions. Existing public-reference/IP positioning and licensing remain unchanged.

## Canonical journey and state

The customer journey is Understand → Prepare → Move → Verify → Start. Its detailed stages remain
Discover → Assess → Plan → Map & Approve → Migrate → Resolve → Validate → Configure → Onboard →
Verified First Productive Use. Resolution is a governed recovery loop, not an unconditional success.

| State / stage | Required evidence and handoff |
| --- | --- |
| CREATED → DISCOVERED → ASSESSED | One owner/session, immutable fixture datasets checksum, discovery findings, deterministic readiness. Blocked readiness may produce a remediation plan, never authorize migration. |
| PLANNED → MAPPING → AWAITING_APPROVAL → APPROVED | Versioned dependency plan; all mappings have compatible targets, evidence, owner and time; no unresolved plan/readiness blockers. No implicit writes. |
| MIGRATION_READY → MIGRATING | Current approved manifest hash, plan ID, full mapping coverage and immutable source checksum rechecked before loading. |
| MIGRATION_PAUSED → RESOLVING → RETRY_PENDING → MIGRATING | Classified failure, bounded policy proposal, required owner approval and applied remediation. Completed batches/checkpoints are preserved; rejected/non-retryable work stays blocked. |
| MIGRATION_COMPLETE → VALIDATING → VALIDATED or VALIDATION_BLOCKED | All batches complete, no unresolved failures, exact source/target counts, identities, lineage, mappings, references, A/R, A/P and trial balance. Approval cannot override mismatch. |
| VALIDATION_BLOCKED → approved restoration → revalidation | Repair bound to current report, source and target hashes; old payload retained; revalidation required before configuration. |
| VALIDATED → CONFIGURING → CONFIGURATION_REVIEW_REQUIRED → CONFIGURED | Eight configuration areas derived from the verified target/report. Only safe unchanged preferences auto-apply; consequential choices require owner decisions. |
| CONFIGURED → ONBOARDING / ONBOARDING_BLOCKED → READY_FOR_FIRST_PRODUCTIVE_USE | Configured evidence/context hash and ten prerequisites, including five explicit owner decisions. |
| FIRST_PRODUCTIVE_USE_IN_PROGRESS / BLOCKED → VERIFIED_FIRST_PRODUCTIVE_USE | Approved invoice contract; exact Decimal totals, one invoice and journal, balanced accounting impact, attributable approval and audit evidence. DRAFT → POSTED → VERIFIED checkpoints support safe verification retry. |

`workflow_status` is the lifecycle authority. The older `status` field is an assessment-only
compatibility projection, not overall completion. Transient MAPPING/MIGRATING/VALIDATING states
are emitted during synchronous local operations; persisted snapshots can skip those transient
states without skipping their guards. Plan phase `FUTURE` means not yet started in that plan,
not unimplemented product capability. Migration is not shown completed while resolving a pause.

Discovery and assessment are create-once per session: replay returns the existing artifact without
rewinding workflow or erasing downstream evidence. Plan/mapping generation is similarly idempotent.
All normal session mutations use compare-and-swap commits. Concurrent stale copies return HTTP 409;
they do not overwrite a newer approval, event, checkpoint or FPU receipt. This is process-local
concurrency protection, not a distributed transaction or durable exactly-once guarantee.

## Cross-stage dependencies and financial truth

One `MigrationSession` carries discovery, assessment, plan, mappings, execution, validation reports,
configuration/history, onboarding/FPU/history, events, activity, and normalized human decisions.
No integrated test invokes `*-demo-sessions`. Separate demo loaders remain disclosed isolated
slice replays and are not evidence of integrated completion.

Migration verifies the plan identity, source datasets checksum and approved mapping manifest before
start/resume. Each mapped synthetic envelope carries `approved_mapping.mapping_id` and
`selected_target`; its source payload remains immutable. Validation checks this binding against the
approved selections. Invoice/transaction envelopes retain source identity, payload and checksum;
their financial relationships reference the mapped canonical entities. Unsupported changed product
or general-configuration treatment is rejected before loading: a currency selection is not an FX
conversion implementation. Canonical account classification remains explicit mapping metadata.

Validation consumes the actual executed target, not a recreated fixture target. Configuration binds
to the current validation report and target. Onboarding binds to the applied configuration/context.
FPU uses migrated customers/products, approved A/R/income mappings, approved tax and liability
control, terms, permissions and exact invoice contract. The operating invoice/journal are separate
from the immutable migrated baseline. A posted task is not verified merely because its UI is green.

Neither confidence, explanatory prose, an approval button, nor an LLM response establishes financial
truth. Amounts use exact decimals; source evidence, policy and deterministic checks remain final.
Retries reuse original execution/task keys and never replay completed writes. Fault injection in
integrated tests is server-side test setup, not an exposed upload or browser mutation path.

## Human governance and audit reconstruction

Each accepted human decision appends a server-authored `human_decisions` record: actor, synthetic
role `DEMO_WORKSPACE_OWNER`, timestamp, decision, evidence, stage, affected entity and selected value.
Coverage includes mapping, migration resolution, validation repair, configuration, onboarding,
invoice approval/rejection and synthetic remediation. Original stage-specific records remain intact.
Automatic low-risk actions remain deterministic events, not fabricated human approvals.

The owner-scoped `GET /v1/migration-sessions/{id}` provides the complete trace. Reconstruct in order:
source/discovery evidence → assessed blockers → plan ID/version → mapping decision IDs → execution
manifest and mapping bindings → failure/proposal/approval → checkpoint/retry → validation reports
and before/after repair payloads → applied configuration → onboarding decisions → FPU contract,
posting, checks, verification hash and terminal events. Array order plus timestamps gives local
event ordering. This is attributable local evidence, not tamper-proof production storage.

## API, security and browser continuity

All stage routes remain `/v1/migration-sessions/{id}/...`; the authenticated principal scopes every
read/write. Unknown/other-owner sessions are 404, missing authentication 401, invalid transitions or
concurrent mutation 409. Decision inputs reject client-supplied actor/role fields. Browser event
submission accepts only `continue_to_plan_selected`, never lifecycle or success events. Unknown
sample IDs do not become filesystem/upload paths. Development demo identity is rejected in production.

The browser starts Harbor Light Books through ordinary creation/discovery/assessment, reviews all
mapping decisions, then passes `?session=` through each handoff. Refresh reads stored state; no stage
silently creates replacement upstream evidence. A shared session-storage pointer also supports
navigation to Verify and Start. Process restart expires sessions and is not advertised as durable
resume. Standalone demo buttons clearly disclose replay and creation of a different session.

The same semantic statuses, visible focus, keyboard-safe dialogs, light/dark tokens and reduced-motion
CSS apply across the flow. Planning does not describe implemented migration as future work. Native
dialogs restore focus to a stable fallback when the initiating button is removed.

## Capability routing and ADK status

`agents/model_policy.py` keeps migration execution, reconciliation, productive-use verification and
governance deterministic. Optional explanation/configuration/onboarding routes use capability-level
Gemini-ready definitions; resolution reasoning has its own route. Versioned repository knowledge is
separate. The working journey uses deterministic fallback and makes no live model calls.

Migration and resolution optional ADK definitions now match the later adapters: capability routing,
typed advisory outputs, named output state, before/after callbacks, supplied session evidence and
explicit parent ownership. They have no write tools. Validation and FPU adapters remain deterministic
with offline evaluation hooks; parent orchestrators alone persist state and authorize handoffs.
SDK doubles test contract shape, not Google service behavior. Managed sessions, callback execution,
provider latency, live model quality and deployment remain unverified future integration work.

## Evidence, operation and rollback

Run `tests/test_beta_v1_integration.py`: fourteen named full-journey scenarios plus adversarial and
adapter checks; run the complete test suites for prior slice regressions. See the
[integrated review](../reviews/beta-v1-integration.md) for exact gate results, browser evidence,
all rubric criteria, findings and scoped readiness.

Local demonstration only: no paid resources, provider egress or deployment. Stop the preview/API to
end the ephemeral demonstration. Roll back this hardening using a normal reviewed revert if needed;
do not reset public history. Production recovery, retention, immutable audit, real IAM, instrumentation
and support operations need a separate release assessment before customer use.
