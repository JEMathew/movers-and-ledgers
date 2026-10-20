# Request Source Evidence — proposed contract

**UNAPPROVED; NOT IMPLEMENTED.** This document is for product/API review. It adds no endpoint, state, permission or working UI control. Until separately approved and implemented, the refreshed UX may explain missing source-purpose evidence but must not render a working “Request Source Evidence” button or claim a request was sent. Existing approve/reject actions remain separate.

## Scope and authority

The user explicitly asks for source-purpose evidence for an ambiguous mapping. The current migration session is the workspace boundary; use its existing owner and session UUID together with the mapping UUID. Do not introduce a second client-controlled workspace owner. Bind each request to the current server-computed mapping context hash. Optional Advisor/Reviewer record references must belong to that same session and mapping.

Persist the request and audit event in the session's durable repository transaction. An in-memory-only implementation is insufficient for this action. Ownership comes from the authenticated principal. Initially, only the existing session owner may create, read, submit or review; shared collaborator roles require a separate permission design. No automatic messages, uploads, external destinations, model calls or accounting integrations are part of this proposal.

## Minimal proposed API

All routes below are under `/v1/migration-sessions/{session_id}/mappings/{mapping_id}/source-evidence-requests`. These are proposed additions, absent from the current generated analysis schema.

| Method / suffix | Request | Result |
| --- | --- | --- |
| POST `/` | `request_id: UUID` (idempotency), `expected_context_hash: string`, `question: string` (1–800 trimmed characters) | 201 request in OPEN; identical replay returns the existing request without another event |
| GET `/` | No body | Owner-scoped requests, their submission/review history and current hold status |
| POST `/{request_id}/submissions` | `operation_id: UUID`, `expected_version: integer`, `expected_context_hash: string`, `answer: string` (1–4000 trimmed characters), `evidence_references: string[]` (1–10 existing source references) | Updated request in SUBMITTED; no automatic review |
| POST `/{request_id}/review` | `operation_id: UUID`, `expected_version: integer`, `expected_context_hash: string`, `decision: ACCEPT_EVIDENCE \| REQUEST_MORE`, `comment: string` (1–800 trimmed characters) | Updated request in SATISFIED or OPEN, respectively |

Response fields: `request_id`, `session_id`, `mapping_id`, `context_hash`, `version`, `state`, `question`, server-generated `created_at`/`updated_at`, submissions and review history with actor identifiers/timestamps, `human_approval_required: true`, `financial_authority: false`. Evidence references resolve to existing owner-scoped source facts; references to an Advisor or Reviewer claim alone are not source evidence. Preserve submissions immutably. No confidence percentage is returned.

Use strict request models: reject extra fields, client actor/owner/timestamps and attempted approval flags. Return 401 for missing authentication; 404 for non-owned session, mapping, request or evidence reference (including nested identifier substitution); 422 for malformed bodies; 409 for stale version/context, wrong state, unsupported case, post-execution state or idempotency-key reuse with a different payload. Store idempotency results with the request; scope keys by authenticated owner and session. Identical replays return the original result before stale-version validation.

## State machine and unresolved hold

| Current state | Explicit human event | Next state | Mapping effect |
| --- | --- | --- | --- |
| Absent | Create request on an unresolved, pre-execution mapping | OPEN | Create required-evidence hold atomically |
| OPEN | Submit valid source answer/references | SUBMITTED | Hold remains; evidence awaits human review |
| SUBMITTED | REQUEST_MORE with explanation | OPEN | Hold remains; prior submission stays in history |
| SUBMITTED | ACCEPT_EVIDENCE after checking current context | SATISFIED | This request's hold clears; mapping remains unresolved and requires a separate approve/reject decision |

SATISFIED is terminal for that request; any further evidence question is a new request. No cancellation, deletion, automatic expiration, model-driven transition or “approve anyway” bypass is proposed. Evidence acceptance acknowledges sufficiency for subsequent mapping review, not correctness of the target account.

The smallest initial contract freezes mapping edits/reconsideration while a required request is OPEN or SUBMITTED (409); read, evidence submission and human rejection remain available. Rejecting the mapping does not satisfy or delete its evidence request and cannot make it executable. This restriction requires product review; a later context-replacement workflow must not silently discard a hold.

Creation and human approval must use the same transaction/version boundary: creation only succeeds on an unresolved, pre-execution mapping; concurrent approval either observes the hold or wins first and causes creation to fail. While any required request is OPEN or SUBMITTED, mapping approval, plan approval and migration execution must fail closed on the server. The UI alone is not an enforcement boundary. If source facts change externally, submission/review fails with 409 and the hold remains; resolving that stale context requires a separately reviewed replacement workflow. Do not auto-clear it. Do not implement this proposal partially in the integration UX.

## Audit and security

Persist `SOURCE_EVIDENCE_REQUESTED`, `SOURCE_EVIDENCE_SUBMITTED`, `SOURCE_EVIDENCE_MORE_REQUESTED` and `SOURCE_EVIDENCE_ACCEPTED` atomically with their state change. Each includes server time, authenticated actor, session/mapping/request IDs, operation ID, context hash, old/new state and version, and source reference IDs. Idempotent replay creates no duplicate event. Record denied operations through the existing sanitized security log, without exposing another owner's resource details.

Treat all evidence text as untrusted data. Render escaped text, validate every reference against the same owner/session/mapping, and never interpret text as tool instructions. Keep full answer bodies in the access-controlled evidence record, not transport logs. No financial record, selected target, migration job or approval decision is modified by submitting or accepting evidence.

## Acceptance tests required before implementation can be accepted

These are **proposed tests, not current passing coverage**:

1. Explicit create only; no request on render, page load, Advisor completion or Reviewer ACCEPT. No working control before backend capability exists.
2. Missing identity, cross-owner sessions, cross-session mappings/requests and foreign evidence references fail without data disclosure or mutation.
3. Every permitted transition succeeds; all other transitions, empty evidence, unsupported references, stale context/version and authority injection fail closed.
4. Requests and submissions survive process restart in durable storage. Failed writes roll back request, hold and audit event together.
5. Concurrent duplicate creation and submission are idempotent; conflicting payloads return 409. Concurrent approval/create cannot lose the required-evidence hold.
6. OPEN and SUBMITTED block mapping approval, plan approval and migration execution through direct API calls as well as the UI; mapping edits/reconsideration fail while held. Rejection cannot clear a hold.
7. ACCEPT_EVIDENCE clears only its own hold. Other outstanding requests still block; a separately initiated human approval remains necessary even after every request is SATISFIED.
8. Submission, review, hostile evidence text, errors and retries never invoke Gemini, apply a target, execute migration or send external messages. Audit events contain provenance, no secrets or raw answer bodies.
9. Workspace/mapping/auth changes clear private UI; loading/error/unavailable/stale states preserve unresolved status. Existing approve/reject and recorded Advisor/Reviewer separation tests continue to pass.

Review must approve the routes, owner-only permission model, mapping-edit restriction, stale-context limitation and durable transaction support before implementation begins.

## October 20 completion decision — contract only

No persistence, route, state machine or working button has been added. Existing session ownership and `put_if_unchanged(original, updated)` establish useful conventions, but do not themselves approve a new workflow. The in-memory repository is explicitly ephemeral; an owner-scoped SQL repository also exists. Selecting a durable deployment mode, retention policy and transactional audit encoding is still required.

| Decision to approve | Proposed minimum | Why implementation remains blocked |
| --- | --- | --- |
| Requester/reviewer authority | Existing authenticated owner only | Whether the requester may also accept evidence, or a separate accountant must do so, has not been approved; do not invent separation-of-duty roles |
| Persistence/audit | Versioned session aggregate and audit events committed together using existing CAS conventions | Durable backend, retention/deletion, record size limits and audit access need an explicit choice and restart/concurrency validation |
| Outstanding request hold | Block approval/execution; preserve unresolved status | Mapping-edit/reconsideration freeze and the ability to reject while held require product acceptance |
| Stale context | Fail with 409 and preserve the hold | How an authorized user replaces or supersedes a stale request is unresolved; current proposal deliberately has no unsafe automatic release |
| Evidence intake | Bounded text plus existing owner-scoped source references | New document uploads, external requests and sharing are outside this contract; evidence references must support the requested source purpose |
| Idempotency/review | Durable operation key, expected version/context, explicit human decision | Replay storage/retention and conflicting-payload behavior must be accepted with the lifecycle |

The acceptance tests above are the review checklist for these choices, not passing implementation tests. The safe Gemini-owned supporting work is the separate role/citation/uncertainty contract and the tested absence of a working evidence-request action. `SATISFIED` remains an evidence status only in this proposal and never grants financial approval.
