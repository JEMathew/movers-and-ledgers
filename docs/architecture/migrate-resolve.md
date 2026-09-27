# Migrate → Resolve architecture

## Scope

This slice executes a previously approved synthetic manifest into an inspectable, provider-neutral
synthetic target. It demonstrates deterministic batches, idempotency, checkpoints, a controlled
failure, evidence-backed remediation, human approval, retry, and safe completion. It makes no
production-provider, reconciliation, deployment, or production-readiness claim.

Validate, Configure, Onboard, and verified First Productive Use are not implemented.

## Workflow and ownership

```text
APPROVED
  → MIGRATION_READY
  → MIGRATING
  → MIGRATION_PAUSED
  → RESOLVING
  → RETRY_PENDING
  → MIGRATING
  → MIGRATION_COMPLETE
```

The Migration Orchestrator alone advances workflow state and enforces prerequisites. It rejects an
unapproved manifest, unresolved plan blockers, incomplete mapping decisions, duplicate execution,
unapproved consequential remediation, retries beyond policy, and unsafe Validation handoff.

The Migration Agent creates ordered batches and invokes deterministic extract, transform,
validation, synthetic load, checkpoint, and progress tools. It does not perform financial
calculations, infer accounting classifications, or call provider APIs.

The Resolution Agent classifies structured failures, retrieves a versioned repository knowledge
record, delegates to the bounded specialist selected by policy, and returns a structured proposal.
Specialists are limited to duplicate, referential-integrity, tax/configuration, and retry/recovery
contexts. A recovery coordinator owns non-retryable escalation. They cannot mutate records or
approve their own proposals.

## Deterministic execution and target

The execution order is accounts, customers, vendors, products, taxes, configuration, invoices, and
transactions. Each batch records a source checksum, record count, scoped idempotency key, attempt
count, retry limit, outcome, and exception reference. Loads write only to the in-memory synthetic
target and use the batch idempotency key to avoid duplicate writes. Successful batches append a
checkpoint containing completed batch IDs and a target checksum.

Source data is copied, not mutated. Transformation retains the source ID and source-record checksum.
The target remains inspectable through an authenticated API. `CheckpointStore` is the durable
persistence port; the Beta embeds checkpoints in the owner-scoped in-memory session.

## Failure and recovery policy

Seven declared synthetic failures are supported: duplicate customer, missing reference,
unsupported tax code, invalid configuration dependency, transient execution, retryable batch, and
non-retryable blocked failure. Failures are never inferred as production outcomes.

- Low-risk retryable failures with a deterministic fix may auto-resolve under policy.
- Medium/high-risk or accounting-sensitive remediation requires an attributable human decision.
- Rejection blocks execution without changing prior target state.
- Retry resumes the failed batch; completed checkpoints are not replayed.
- Exceeding the retry limit or encountering a non-retryable failure blocks the migration.
- A future Validate handoff is allowed only after completion with zero unresolved blockers.

## Model and ADK boundary

`CAPABILITY_ROUTES` selects a runtime per capability rather than a global model:

| Capability | Route | Authority |
| --- | --- | --- |
| Migration execution | Deterministic | Authoritative for writes/checkpoints. |
| Resolution reasoning | ADK-compatible Gemini 2.5 Pro | Optional proposal/explanation only. |
| Customer explanation | ADK-compatible Gemini 2.5 Flash | Optional bounded explanation. |
| Governance decision | Deterministic/human | Authoritative for policy and approval. |
| Knowledge retrieval | Versioned repository | Current grounded source. |

The shipped flow uses deterministic fallback and requires no Gemini credentials. Optional ADK
definitions can be constructed when the extra is installed; importing the product has no model,
network, or credential side effect. Managed Agent Runtime, callbacks, production evaluation hooks,
and Vertex AI Search remain future hardening work.

## API resources and events

Authenticated, owner-scoped resources expose the execution, batches, progress, failures,
resolutions, decisions, retry/resume, activity, and synthetic target. The start route requires an
`Idempotency-Key`. The existing browser event route still accepts only its one customer-originated
event; internal migration lifecycle events cannot be forged by clients.

Lifecycle events cover migration and batch start/completion/failure, pause, resolution start/
proposal/approval/application, retry start/success/failure, resume, completion, and blocking.

## Security and operations boundary

Only repository-owned synthetic data is processed. There are no source/target credentials, real
provider adapters, external model calls, paid resources, or deployment changes. Identity and owner
predicates protect every resource. In-memory state is intentionally non-durable and unsuitable for
production, multi-instance execution, concurrency guarantees, or disaster recovery.
