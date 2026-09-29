# Plan → Map → Approve architecture

## Governed reconsideration of a final rejection (2026-09-28)

The preserved synthetic cloud workspace contains a final Catalog preparation rejection. A later
human change of intent must not erase that decision or require a new workspace. Reconsideration
is therefore an explicit, owner-only, pre-execution workflow; it is not an agent override or a
relaxation of `apply_mapping_decision`'s final-decision guard.

- The mapping remains `REJECTED` while a separate reconsideration record is `REVIEW_REQUIRED`.
- Requesting emits `mapping_reconsideration_requested`; it does not approve or unlock migration.
- A separate human review creates a **new** mapping decision, resulting in `APPROVED` or
  `REJECTED`. It emits `mapping_reconsideration_reviewed` and either
  `mapping_reconsideration_approved` or `mapping_reconsideration_rejected`, in addition to the
  existing mapping-decision event. A further reconsideration must reference the latest rejection.
- Only `AWAITING_APPROVAL` sessions without execution are eligible. Approved mappings and
  execution manifests cannot be reopened. Existing deterministic compatibility/evidence checks
  run on the requested target and again before approval; ordinary stage/handoff gates remain.

The request record links mapping ID, latest prior human-decision ID, original actor/time/comment/
target/evidence, requesting actor/time, required reason and proposed target. Review adds reviewer,
time, outcome/comment and the new human-decision ID. Original `human_decisions` and product events
remain untouched and in order. Original projection fields are copied into the linked record
before the current mapping projection can change. This is application-level append-preserving
history in the existing durable snapshot, not a new tamper-proof/WORM storage claim.

Both HTTP actions resolve the workspace through the authenticated server principal. Request
models forbid extra fields, including client-supplied actor identity. No agent/model or browser
event submission may authorize or fabricate these events. The same owner may request and review;
this slice requires two explicit actions, not a newly introduced two-person approval policy.

`POST /v1/migration-sessions/{session}/mappings/{mapping}/reconsiderations` requires a UUID
`request_id`, `prior_decision_id`, nonblank bounded `reason`, and `proposed_target`.
`POST .../reconsiderations/{request_id}/review` requires `action: approve|reject` and optional
bounded `comment`. Identical retries return the recorded result without another decision/event;
changed payload/key reuse, conflicting reviews and concurrent pending requests fail closed.
Snapshot compare-and-swap commits record/projection/audit changes together; a stale write leaves
no partial audit or decision. Existing rows load an empty reconsideration list by default. Empty
lists are omitted from persistence encoding to preserve legacy snapshot hashes on the first
write; no schema bootstrap, data rewrite or elevated privilege is needed.

The existing mapping card gains a required reason, Request reconsideration, prior decision
history and separate Approve/Reject reconsideration controls. The minimal UI requests the
displayed target, uses labeled native controls and live status/error text, and moves focus to
history after the review state changes. Prior rejection evidence stays visible after approval.
See the [focused review](../reviews/mapping-reconsideration.md) for verified scope and limits.

## Purpose and boundary

This slice turns deterministic Discover → Assess evidence into a dependency-aware migration plan
and governed source-to-target mapping decisions. It ends with an approved, versioned handoff for a
future Migration Agent. It does not resolve source-data blockers, connect to a provider, execute a
target write, or claim migration completion.

```text
Assessment evidence
       │
       ▼
Migration Orchestrator ──► Planning Agent ──► plan builder + dependency validator
       │
       ▼
Mapping Agent ──┬─► Account Mapping Specialist
                ├─► Tax Mapping Specialist
                ├─► Entity Mapping Specialist
                └─► Configuration Mapping Specialist
                         │ recommendation provider
                         ▼
                deterministic mapping controls
                         │
                         ▼
            authenticated owner approval / modification / rejection
                         │
                         ▼
       approved mappings + no plan blockers ──► future Migration Agent handoff
```

The orchestrator alone advances workflow state. Planning and mapping agents return structured
artifacts; deterministic tools enforce constraints; an authenticated human owns every final mapping
decision. `APPROVED` means ready to hand off, never migrated.

## State and stopping rules

```text
DISCOVERED → ASSESSED → PLANNED → MAPPING → AWAITING_APPROVAL → APPROVED
```

- Planning requires discovery, assessment, and `ASSESSED` state.
- Mapping requires a valid versioned plan and `PLANNED` state.
- Decisions require `AWAITING_APPROVAL` and owner-scoped session access.
- `BLOCKED`, `REJECTED`, or undecided mappings stop handoff.
- All mappings must be `APPROVED` or `MODIFIED`, and the plan must have no unresolved blockers,
  before `ready_for_migration` can be emitted.
- No path in this slice invokes a target adapter or write tool.

## Plan contract

`migration-plan-v1` contains an ID, version, seven ordered phases, dependencies, prerequisites,
blockers, risks, checkpoints, approval gates, customer actions, relative complexity, evidence
references, and status. Relative complexity is a transparent `Low` / `Medium` / `High` policy
classification; no precise duration is fabricated.

The phase dependency graph is validated for matching order, unique IDs, known predecessors, and no
forward dependencies. Assessment findings remain visible as blockers and risks instead of being
silently cleared by planning.

## Mapping and specialist contracts

`mapping-policy-v1` covers Chart of Accounts, Customers, Vendors, Products / Services when present,
Tax configuration, and General configuration. Each proposal includes source identity, recommended
and selected targets, calibrated confidence, risk, evidence, rationale, alternatives, policy
reasons, deterministic checks, specialist ownership, and decision attribution.

The four specialists are justified by distinct accounting contexts, allowed tools, target schemas,
risk, and escalation rules. They share a structured input/output contract and do not approve or
apply mappings. Simple schema, compatibility, evidence, duplicate, and target lookups remain tools,
not agents.

Authoritative controls include:

- mapping schema and canonical-area validation;
- canonical entity and tax-target compatibility;
- allowed account-type targets;
- required target-field validation;
- configuration compatibility;
- evidence completeness;
- duplicate account-target detection;
- confidence, sensitivity, and high-risk approval policy;
- final-decision validation and minimized audit-event creation.

The 90% auto-acceptable threshold only affects review presentation. Every proposal still requires a
human decision in this Beta slice. A model or specialist cannot override a failed deterministic
control.

## Gemini and ADK seam

The shipped `MappingRecommendationProvider` is provider-neutral and uses a deterministic,
repository-owned fallback. The experience therefore works without Gemini credentials or network
egress. A future Gemini implementation may provide structured semantic recommendations, ambiguity
interpretation, and concise explanations; it must send only minimized fields and return the same
contract before deterministic controls run.

Planning, mapping, and specialist boundaries already expose explicit context, tools, structured
outputs, confidence, evidence, escalation, state ownership, and evaluation cases. Those interfaces
can be adapted to Google ADK without relocating policy, approval, or financial correctness into the
agent runtime.

## API resources

All routes are under `/v1`, require the existing identity dependency, and resolve data through the
owner-scoped migration session.

| Method | Resource | Purpose |
| --- | --- | --- |
| POST / GET | `/migration-sessions/{id}/plan` | Create idempotently or retrieve a migration plan. |
| GET | `/migration-sessions/{id}/plan/status` | Retrieve version, status, and phase count. |
| POST / GET | `/migration-sessions/{id}/mappings` | Create idempotently or retrieve proposals. |
| GET | `/migration-sessions/{id}/mappings/{mapping_id}/evidence` | Retrieve proposal evidence. |
| POST | `/migration-sessions/{id}/mappings/{mapping_id}/approve` | Record owner approval. |
| POST | `/migration-sessions/{id}/mappings/{mapping_id}/modify` | Validate and record an owner-selected target. |
| POST | `/migration-sessions/{id}/mappings/{mapping_id}/reject` | Record owner rejection and stop handoff. |
| GET | `/migration-sessions/{id}/activity` | Retrieve customer-safe agent and tool activity. |

Internal lifecycle events cannot be submitted by the browser event endpoint. The implemented event
contracts are `plan_started`, `plan_generated`, `mapping_started`, `mapping_proposed`,
`mapping_review_required`, `mapping_approved`, `mapping_modified`, `mapping_rejected`,
`mapping_blocked`, and `ready_for_migration`. Events retain session, timestamp, bounded attributes,
and provenance through their producing service/action; activity contains no chain-of-thought or raw
financial rows.

## Evaluation and metrics

`plan-map-approve-golden-v1` contains the twelve required plan, mapping, decision, control,
repeatability, and safe-stop scenarios. Unit, orchestration, API, and UI tests add owner isolation,
browser event restrictions, audit activity, and error recovery.

Development event contracts support future plan completion, recommendation acceptance, override,
approval/rejection, low-confidence review, escalation, approval-time, and ready-for-migration
metrics. There is no production analytics pipeline, owner, baseline, target, or measured result;
none is implied by these events.

## Security, persistence, and production gaps

- Data remains repository-owned and synthetic; no production credentials or provider egress exist.
- Session reads and decisions are owner-scoped through the API identity boundary.
- Event and activity attributes are minimized; raw financial rows are not logged.
- Current sessions, decisions, and events are process-local. Production requires durable,
  append-only audit storage, transaction/concurrency controls, retention/deletion rules, idempotency
  keys, jobs, retries, timeouts, recovery, and telemetry.
- Knowledge retrieval is repository-local. Vertex AI Search / Agent Search remains a future adapter.
- The next product slice is Migrate → Resolve; it must consume only an approved manifest and add
  idempotent writes, reconciliation checkpoints, exception recovery, and rollback controls.
