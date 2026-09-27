# Onboard → Verified First Productive Use

## Scope and governing references

Movers & Ledgers / MoveBooks AI. Branch `feature/onboard-fpu`, based on `d0795f0`.
This completes the minimum synthetic Beta journey through one verified productive accounting task.
It does not certify production books, connect a bank, write to a provider, deploy infrastructure,
or add live Gemini calls. Existing public-reference/IP and licensing positioning is unchanged.

Canonical authorities: [Product Constitution](../PRODUCT_CONSTITUTION.md),
[AI / Agent Constitution](../AI_AGENT_CONSTITUTION.md),
[Migration Principles](../MIGRATION_PRINCIPLES.md),
[Evaluation Principles](../EVALUATION_PRINCIPLES.md),
[Scorecard](../PRODUCT_SCORECARD.md), and [Release Readiness](../RELEASE_READINESS.md).
Prior handoff: [Validate → Configure](validate-configure.md).

Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential
decisions. No model confidence, page view, checklist click, or migration-complete flag is an FPU
success condition.

## State ownership and handoff

`agents/orchestrator/onboard_fpu.py` is the stage orchestrator. API callers cannot set workflow
states, actor identity, policy, approval scope, fault lists, or internal lifecycle events.

```text
CONFIGURED → ONBOARDING → READY_FOR_FIRST_PRODUCTIVE_USE
                 ↕                     ↓
         ONBOARDING_BLOCKED     FIRST_PRODUCTIVE_USE_IN_PROGRESS
                                       ↕
                            FIRST_PRODUCTIVE_USE_BLOCKED
                                       ↓
                            VERIFIED_FIRST_PRODUCTIVE_USE
```

Each transition records from/to state and evidence in owner-scoped session events. A blocked
invoice resumes through the same contract and key, never by skipping verification. A rejected
setup choice can be revised; an unattempted draft can be replaced with fresh approval. Once a
posting attempt starts, changing drafts or onboarding decisions is forbidden. After three failed
posting attempts the task remains stopped for investigation; creating a new draft cannot reset
that budget. A fresh synthetic demo is a new, explicitly identified session, not a recovery claim.

Every operation rechecks VERIFIED validation, approved/applied configuration, manifest and mapping
integrity, source fixture and migrated snapshot. Onboarding approvals are bound to configuration ID
and a hash of configuration, validation report, and target. Changed evidence fails closed. Reads
recompute effective verification; stale success is exposed as blocked, not trusted from a flag.

The only earlier-stage changes are a reusable configured-evidence predicate (the old CONFIGURED
handoff semantics remain) and the Configure screen's link to `/onboard-fpu?session=…`.

## Agents, specialists, and tool ownership

| Component | Contract and authority |
| --- | --- |
| Onboarding Agent | Reads configured context; returns ten structured `OnboardingTask` checks, status, explanation, next action, choices and knowledge/evidence references. Context supplies company entities, tax, invoice preferences, settings and scoped faults. |
| First Productive Use / Activation Agent | Proposes `fpu-invoice-v1`; returns deterministic checks. Parent alone authorizes posting, persists state and emits success. |
| Knowledge Agent | Bounded `knowledge:onboarding-v1:<task>` interface; no open web retrieval, generated accounting facts, or confidence-as-truth. |
| Guided Setup specialist responsibility | Checklist explanations and explicit next actions; deterministic fallback, not a separate reasoning agent. |
| Opening Balance specialist responsibility | Existing validated ledger checks, read-only; no silent opening-balance adjustment. |
| Bank / Synthetic Integration specialist responsibility | Explicit OFFLINE_DEMO or SANDBOX_READ_ONLY choice, a local representation only. No connection or credentials. |
| Roles & Access specialist responsibility | Owner-confirmed SYNTHETIC_INVOICE_OPERATOR grant; does not elevate configured FINANCE_REVIEWER or grant provider permissions. READ_ONLY blocks posting. |
| Workflow Readiness specialist responsibility | All prerequisites and the productive-task contract must pass; no independent authority to waive a blocker. |

Independent reasoning is not justified for these bounded checks. Therefore specialist responsibilities
remain deterministic tools rather than five cosmetic agent instances. Ambiguous, unsupported, or
changed real context stops with workspace-owner investigation instead of autonomous repair.

`tools/onboarding/checks.py` owns `verify_onboarding_prerequisites`,
`verify_opening_balance_readiness`, `verify_role_access`, `verify_invoice_readiness`,
`verify_tax_readiness`, `verify_customer_usability`, `verify_product_usability`, and
`record_onboarding_event`. The ten activities also cover first-report readiness,
first-reconciliation readiness, and overall checklist completion. Readiness is not a claim that a
report or reconciliation productive task has been completed.

`tools/activation/invoice.py` owns `verify_first_productive_use_prerequisites`,
`create_synthetic_invoice`, `calculate_invoice_totals`, `validate_invoice_posting`,
`verify_accounting_impact`, `calculate_fpu_status`, and `record_fpu_event`.
All financial truth stays in these deterministic tools.

## Productive invoice contract

`domain/onboarding_fpu/models.py` contains typed decisions, tasks, contract/checkpoint records and
operational storage. The contract binds selected migrated customer/service, quantity, exact unit
price, approved unique A/R and income accounts, configured tax code/rate, currency, invoice prefix,
payment terms, validated migration checksum and configuration ID. Approval binds the contract hash.

Only USD, a usable service, supported configuration choices and a unique account mapping are
implemented in this fixture. The canonical synthetic records omit an active flag; absence means
active **only for this documented demo schema**. An explicit inactive flag blocks selection. A live
adapter must supply explicit provider eligibility and operational permissions before release.
Customers must be present; all supplied vendors must have usable IDs/names (a company with no
vendors is not inherently blocked from creating a customer invoice).

Exact decimal money rejects floats, booleans, nonfinite values, more than two decimal places,
nonpositive price and excessive values. Quantity is a strict integer 1–1000; unit price is capped
at 100000 for this Beta. Tax uses decimal rate 0–1 and explicit line-level half-up two-decimal
rounding. The default example is subtotal 100.00 + tax 7.25 = total 107.25, with NET_30 terms.
This policy is synthetic arithmetic, not jurisdictional tax advice or a production tax engine.

The owner explicitly approves a separate synthetic tax-liability control account. Posting debits
A/R 107.25, credits income 100.00 and credits tax payable 7.25. Tax is not misclassified as revenue
or trade accounts payable. The journal must balance, and all three account deltas must match.

Operational invoices/journals are stored **separately** from the immutable migration snapshot.
The accounting-impact view derives before/after balances without invalidating migration checksums.
For the default fixture A/R moves from 420.00 to 527.25, income from -1420.00 to -1520.00 and the
new tax control from 0.00 to -7.25; bank and A/P do not change. These are signed ledger balances.

Six verification groups cover: (1) customer/product/mapping/tax contract, (2) recalculated totals,
(3) exact posted invoice/journal and single-record store, (4) balanced accounting impact,
(5) attributable posting audit, and (6) current owner approval. Success also requires a verified
checkpoint/time, verification hash matching the recomputed checks, and matching verification and
completion events. Modified financial, configuration, approval, or audit evidence invalidates success.

## Human governance, failure, recovery

Five setup decisions require approve/modify/reject: opening balances, role scope, invoice preferences,
tax control, and synthetic bank setup. Explanation is read-only and grounded in displayed evidence.
The invoice requires separate approval after showing totals, tax, accounts and terms. Actor, role,
timestamp, decision, selection, evidence hash and optional note are recorded server-side. A draft
revision invalidates prior invoice approval; rejection never authorizes a write.

Declared synthetic faults: missing customer, missing product, invalid tax, invalid mapping, missing
role, incomplete configuration, totals mismatch, posting failure, and verification interruption.
They live in the synthetic operating adapter, not in original source/configuration data. Removal
requires attributable approval and records fault history; it cannot repair arbitrary real records.

Posting preflight validates before any write. Invoice, journal, receipt and events are persisted as
one compare-and-swap session update. Concurrent stale operations return 409. The idempotency key is
bound to the prepared task; a changed key is rejected. DRAFT → POSTED → VERIFIED checkpoints make
verification retry independent of posting: an interrupted POSTED receipt is reverified without
another write or another posting attempt. Verified repeats do not append success events.
Failures preserve detailed checks, a safe-stop explanation, owner and next action. A three-attempt
limit is terminal for that task. Unsupported evidence requires investigation, not an override.

These guarantees are **process-local**. Production requires durable transactional storage, immutable
audit, distributed idempotency, crash recovery and real authorization; restart loses demo sessions.

## Routing and ADK status

Capability routes remain separate. `onboarding_guidance` permits optional Gemini explanation;
`productive_use_verification` is deterministic. Knowledge and governance retain bounded retrieval
and deterministic policy routes. The active UI/API path uses deterministic fallback, no credentials
and no live model calls. Financial checks never consume generated accounting truth.

Optional factories in `agents/onboarding/adk.py` and `agents/activation/adk.py` define structured
advisory output, session-state handoff and a read-only deterministic verification sub-agent. The host
resolves authorized context; the parent owns tools and persistence. Explanation callbacks and a
verification eval hook are exposed. Contract tests use lightweight SDK doubles: no installed/live
ADK runner, managed runtime, SDK integration certification or deployment is claimed.

## API and events

All resources are under `/v1`. Owner-scoped session routes use authenticated identity; missing auth
is 401 and another owner's session is 404. Invalid request fields are 422; stale/concurrent or
disallowed operations are 409. Demo identity is local-only under existing auth policy.

| Resource | Method / role |
| --- | --- |
| `/onboarding-demo-sessions` | POST, explicitly replay earlier synthetic steps; no new-stage approvals seeded |
| `/migration-sessions/{id}/onboarding` | GET snapshot; POST begin from configured evidence |
| `/migration-sessions/{id}/onboarding/blockers` | GET outstanding checks and handoff gate |
| `/migration-sessions/{id}/onboarding/tasks/{task}/decision` | POST approve/modify/reject supported choice |
| `/migration-sessions/{id}/onboarding/remediation` | POST explicitly approve declared demo-fault removal |
| `/migration-sessions/{id}/fpu` and `/fpu/readiness` | GET task, status, current evidence and readiness |
| `/migration-sessions/{id}/fpu/task` | POST prepare/revise unattempted draft |
| `/migration-sessions/{id}/fpu/decision` | POST approve/reject current contract |
| `/migration-sessions/{id}/fpu/execute` | POST with required `Idempotency-Key`; post or resume verification |
| `/migration-sessions/{id}/fpu/verify` and `/fpu/verification` | POST reverify posted receipt; GET current verification snapshot |
| Existing session activity/events routes | GET owner-scoped audit; snapshots also expose recent activity |

Server-owned events: `onboarding_started`, `onboarding_task_completed`, `onboarding_blocked`,
`onboarding_completed`, `fpu_ready`, `fpu_started`, `fpu_failed`, `fpu_blocked`,
`fpu_remediation_required`, `fpu_verified`, `first_productive_use_completed`.
Additional trace events: `onboarding_decision`, `fpu_contract_proposed`, `fpu_decision`,
`fpu_posted`, `fpu_remediated`. Existing browser-event allowlisting excludes all these events.
Events are local evidence, not a deployed analytics pipeline.

## UX and demo runbook

`/onboard-fpu` uses shared semantic cards/statuses, evidence disclosure, labeled inputs and the
native focus-contained dialog. Users see complete/remaining tasks, reasons, next actions, a real
checklist count, contract approval and blocked/retry/posted/verified distinctions. Final copy is
**VERIFIED FIRST PRODUCTIVE USE**, with invoice, journal, accounting impact and attribution.
Color is supplementary; status text is always present. Restrained shared `motion-enter` transitions
inherit the reduced-motion stylesheet.

For a failure/recovery demo: load posting failure → review five setup decisions → prepare invoice →
approve → post (blocked with no write) → approve declared remediation → retry same task → inspect
six passing verification groups and posted accounting artifact. For checkpoint demonstration load
verification interruption, approve/setup/post, then Resume verification. From the actual earlier
journey, use Configure's continuation link; the server rechecks the same session evidence.

## Executable evaluations

`tests/test_onboard_fpu.py::test_golden_onboard_fpu` executes all fourteen required cases:
happy onboarding; incomplete setup; missing role; invalid tax; missing customer; missing product;
invalid mapping; totals mismatch; successful invoice; remediation/retry; waiting for approval;
unavailable-model fallback; checkpoint resume; identical-input deterministic verification.
Additional tests cover invalid money, unconfigured handoff, rejected/revised approval, actor/role,
invoice/journal/audit/configuration tampering, key changes, exhausted retry budgets, concurrent CAS,
unauthenticated/cross-owner API access and forged lifecycle events. ADK definition tests are separate.
Frontend tests verify gating, modification, rejection, dialog errors, repair approval, checkpoint
resumption and evidence-only success. See [review and validation](../reviews/onboard-fpu.md).

## Future metrics — definitions, not measured results

North Star remains: **Percentage of eligible migration journeys reaching verified First Productive Use.**
Assistance and autonomy are diagnostics, never part of that success definition. These contracts
extend the canonical [Metrics Framework](../METRICS_FRAMEWORK.md); they do not claim instrumentation.

Common proposed window: weekly UTC start cohorts, matured for 30 days, finalized after 72 hours for
late events. Count distinct eligible journey IDs, deduplicate event IDs and count first valid state
entry only. Never silently remove failed/abandoned eligible journeys. Eligibility follows the
canonical contract; synthetic demo cohorts remain separately labeled and excluded from real-user
North Star reporting. Show denominators and suppressed/late/invalid evidence, not invented values.
Durations report median/p90 plus censored unfinished counts. Segment by source/target, company size,
scenario, assisted/unassisted, device and policy version only when privacy thresholds permit.

| Future metric | Numerator / value | Denominator / population | Event evidence | Accountable role |
| --- | --- | --- | --- | --- |
| Onboarding completion rate | Journeys reaching complete checklist | Eligible journeys entering onboarding | onboarding_started → onboarding_completed | Product + Onboarding owner |
| Onboarding blocker rate | Journeys with at least one real prerequisite block | Eligible onboarding starters | onboarding_blocked; separate pending approvals | Onboarding owner |
| Time to onboarding completion | First complete time minus first onboarding start | Completed onboarding journeys; censor others | started/completed times | UX + Product Analytics |
| FPU readiness rate | Journeys reaching valid readiness | Eligible onboarding starters | fpu_ready with prerequisite evidence | Activation owner |
| FPU success rate | Journeys with current verified invoice evidence | Eligible journeys making a first posting attempt | fpu_started → fpu_verified | Activation + Finance controls |
| Time to first productive use | Verified FPU time minus canonical migration journey start | Verified eligible journeys; censor unfinished | session created_at → first_productive_use_completed; future start-event normalization | Product Analytics |
| Remediation rate | Attempting journeys needing remediation | Eligible FPU-attempting journeys | fpu_remediation_required; deduplicate per journey | Reliability owner |
| First-attempt FPU success | Verified journeys with exactly one posting attempt | Eligible FPU-attempting journeys | attempt=1 plus valid completion evidence | Activation owner |
| Abandonment before FPU | Matured starters without FPU and no activity for last 14 days | Eligible onboarding starters; report censoring/returners | last meaningful action + missing verified completion | Customer Outcome owner |
| Verified FPU conversion | Eligible journeys with verified FPU by maturity | All eligible migration journeys in start cohort | eligibility record + first_productive_use_completed evidence | Product owner |

Guardrails: false-success rate, duplicate-post rate, unauthorized decision rate, reconciliation
breaks, source-loss count, support burden and inaccessible-path reports. First-attempt success does
not exclude assisted users or punish verification-only retries. Missing state/evidence cannot be
imputed as success. Production must assign named people, approve taxonomy/versioning, validate event
quality and establish baselines before using these metrics for decisions. No raw invoices, names,
approval notes, financial amounts or credentials belong in analytics; use pseudonymous IDs,
least-privilege access, minimum cohort thresholds and approved retention.

## Operational limits and support

Durable operations, production metrics, real authentication/permissions, support UI/backend,
live provider/model adapters, managed ADK runtime, additional productive tasks and broader tax/
currency/entity support are future work. Inherited Next.js/PostCSS advisory and Starlette test-client
warning remain separate follow-ups. No dependency upgrade is mixed into this slice.

For this reference Beta, reproduce issues with scenario, policy version, task ID and sanitized
error/evidence references. Never request customer books or secrets in public issues. Follow the
canonical loop: Feedback / Support → Triage → Product / Bug / Knowledge / Agent Eval → Fix →
Regression / Eval Case → Release. Human owner makes publication/merge decisions. Rollback is a
normal revert of this branch's eventual commit; no public-history rewrite. Demo sessions are
ephemeral, and rollback/restart is not a durable recovery strategy.
