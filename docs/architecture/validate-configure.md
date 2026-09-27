# Validate → Configure

## Scope and authority

This slice implements deterministic validation and governed configuration of an **in-memory,
synthetic target**. It extends the [canonical workflow](AGENT_WORKFLOWS.md), not the locked Beta scope.
The complete journey remains Discover → Assess → Plan → Map & Approve → Migrate → Resolve → Validate
→ Configure → Onboard → Verified First Productive Use. The last two stages are not implemented here.

Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential
decisions. See the existing [agent constitution](../AI_AGENT_CONSTITUTION.md),
[migration principles](../MIGRATION_PRINCIPLES.md), and [release policy](../RELEASE_READINESS.md).
No live provider, production accounting certification, deployment, or new licensing grant is implied.

## State ownership and evidence

```text
MIGRATION_COMPLETE → VALIDATING ──checks pass──→ VALIDATED
                          │                         │
                          └→ VALIDATION_BLOCKED     ↓
                               │               CONFIGURING
                     approved bounded repair       ↓
                               │        CONFIGURATION_REVIEW_REQUIRED
                               └→ revalidation     │
                                             approvals + preflight
                                                   ↓
                                               CONFIGURED
                                                   │
                                  readiness contract only; no Onboard action
```

`ValidateConfigureOrchestrator` alone owns these transitions. Every transition includes from/to
states and execution/report/plan references in the existing event ledger. Reports and configuration
history live in `MigrationSession`; revalidation archives the old configuration and invalidates its
readiness. Owner-scoped API calls operate on copies, then atomically compare-and-swap the session;
a concurrent stale decision receives 409 and cannot silently overwrite another decision.

Verification binds the fixture, target, and executed manifest checksums. Configure, decisions,
application, and `can_handoff` recheck these bindings and current approved mappings. Ready means:
VERIFIED, zero blocking discrepancies, unchanged evidence, complete migration, exactly eight valid
applied settings, required approvals with actor/time/action, and the CONFIGURED workflow state.
The saved readiness flag alone is never authority. Durable storage, cross-worker transactions,
production authorization, tamper-evident retention, and support operations are future work.

## Agent and tool contracts

| Owner | Inputs | Bounded work / tools | Output and stop condition |
| --- | --- | --- | --- |
| Validation Agent | Completed execution, immutable source fixture, approved manifest | Count/completeness/reference checks; A/R, A/P, trial/opening reconciliation; mapping and transformation checks | Structured `ValidationReport`; any missing/invalid evidence or discrepancy blocks Configuration |
| Configuration Agent | Current verified report, source preferences, validated target checksum | Grounded Knowledge lookup; versioned constraints; safe unchanged settings versus sensitive proposals | Eight `ConfigurationProposal` records; missing evidence is BLOCKED, consequential areas REVIEW_REQUIRED |
| Resolution Agent (reused) | Checksum-bound identified discrepancy | Existing proposal/decision contract; `restore_approved_source_payload` is the sole new repair tool | Attributable approval, before payload retained, failure resolved; must revalidate, never marks verification itself |
| Orchestrator | Session, tool results, owner decision | Stage gates, authorized tool invocation, audit events, compare-and-swap persistence | Explicit state and safe future handoff; no Onboarding implementation |
| Knowledge Agent | Allowlisted configuration area | Versioned repository policy lookup | Reference, definition, and guardrail; unknown area fails closed |

No new reasoning specialist is justified for bounded arithmetic, identity comparison, or setters.
Reconciliation, balance verification, completeness, and reference integrity therefore remain tools.
Accounting, tax, access, and integration configuration use versioned policy, not decorative agent
wrappers. A future specialist requires independent reasoning, evidence, evaluation, and escalation.

Validation tools in `tools/validation/checks.py` implement all required functions:
`compare_record_counts`, `validate_referential_integrity`, `reconcile_accounts_receivable`,
`reconcile_accounts_payable`, `reconcile_trial_balance`, `validate_opening_balances`,
`validate_entity_completeness`, `validate_mapping_completeness`, `validate_transformation_integrity`,
`calculate_validation_status`, and `record_validation_event`.

Configuration tools in `tools/configuration/controls.py` implement `validate_fiscal_year`,
`validate_currency`, `validate_tax_configuration`, `validate_inventory_configuration`,
`validate_payment_terms`, `validate_role_policy`, `validate_configuration_dependency`,
`apply_safe_configuration`, and `record_configuration_event`. Full application preflights the entire
plan before changing settings. Repeated final application is idempotent.

## Financial truth boundary

Policy `validation-v1-exact-decimal` uses finite exact decimal strings (or integers), at most two
fractional places, magnitude at most 1e18, and **zero tolerance**. Binary floats, NaN, infinity,
overprecision, unbalanced/empty journals, missing opening balances, missing/duplicate identities,
unsupported datasets, invalid references, changed manifests, and changed payload lineage block.
The synthetic contract supports one company currency; no exchange rates or cross-currency netting.

- Record counts cover customers, vendors, accounts, invoices, transactions, products, taxes, configuration.
- A/R is open invoices (`total - paid`, explicit synthetic default of zero paid), also tied to A/R control accounts.
- A/P compares credit balances of explicit A/P control accounts. This fixture has no bills/payables
  subledger; this is **not** a claim of production vendor-subledger reconciliation.
- Trial balance checks both per-account equality and balancing, not merely matching grand totals.
- Opening balances must be explicit, equal per account, and balanced on both sides.
- Identity mappings and source payload hashes are checked against extraction snapshots and approved mappings.
- Financial comparisons are deterministic; UUIDs/timestamps identify runs and are not part of result equivalence.
- WARNING is a supported non-verified status and cannot advance; no tolerance policy currently emits it.

The versioned Harbor Light fixture has USD 420 A/R and USD 125 A/P. The controlled scenario alters
the target invoice total to USD 400: target minus source is **−20.00**. A/R and payload integrity
block configuration. The user reviews the exact record, approves restoration, and revalidates.
No balance plug, silent write-off, source mutation, replay of completed batches, or provider write occurs.
Only one repair may be pending. Unsupported missing/duplicate/source defects stop for investigation;
the synthetic demo can be restarted, not waived. External mutation during a pending repair fails closed
and requires operator investigation; durable repair rebase/cancellation is not claimed.

## Configuration and human decisions

Policy `configuration-v1` covers:

| Area | Supported synthetic values | Human gate |
| --- | --- | --- |
| Fiscal year | Start month 1–12, consistent with company metadata | Unchanged valid preference auto-applies |
| Base currency | USD / INR / GBP / EUR; must equal source/company/configuration evidence | Always required; currency conversion prohibited |
| Tax setup | Source-supported CA-SALES, or NONE only with no source tax rows | Always required; no inferred jurisdiction or tax treatment |
| Payment terms | NET_15 / NET_30 / DUE_ON_RECEIPT | Unchanged preference auto-applies |
| Inventory valuation | WEIGHTED_AVERAGE / FIFO | Always required, including modifications |
| Invoice preferences | HL- / INV- prefix | Unchanged preference auto-applies |
| Roles / access | FINANCE_REVIEWER / READ_ONLY | Always required; no admin grant or actual identity provisioning |
| Integrations / preferences | DISABLED / SANDBOX_READ_ONLY | Always required; no external connection or credentials |

PROPOSED and AUTO_APPLICABLE are supported contract states. Current proposals become APPLIED for
safe unchanged preferences, REVIEW_REQUIRED for supported sensitive choices, or BLOCKED for missing/
inconsistent evidence. Approve/Modify/Reject produce APPROVED/MODIFIED/REJECTED with actor, time,
selection, and comment. Rejected choices can be revised before application. Ask for explanation is
read-only and grounded. Applied settings cannot be silently edited; revalidation creates a new plan.
Sensitivity is independently derived from area/value, so a downgraded risk flag cannot bypass approval.

## UX

`/validate-configure` offers explicit reconciled/discrepancy demo replays, a completed-migration
handoff link, and tab-scoped session recovery. The demo visibly discloses replayed earlier approvals.
Discrepancies appear first; matching checks remain inspectable through a keyboard-operable disclosure.
Each check shows source, target, target-minus-source difference, textual/icon status, evidence,
contributing records, and recommended next action. Currency and exact-tolerance policy are explicit.

Eight configuration cards separate automatic settings from human decisions. Native dialogs include
visible labels, focus wrapping, Escape, and a status-focus fallback when an asynchronous repair
replaces its original trigger. Errors remain inside an open dialog; no success or handoff is inferred
from an unsuccessful request. Shared semantic tokens support light/dark and responsive layouts;
`motion-enter` uses the existing reduced-motion override. The final panel explicitly labels
Onboard → Verified First Productive Use as future work, with no active completion action.

## Model routing and optional ADK

`financial_reconciliation` and `governance_decision` are deterministic. The Configuration Agent
exposes `configuration_recommendation` as an optional Gemini explanation route but actively uses
the grounded deterministic fallback. No credentials, live calls, global hard-wired model, or model
output is required to complete this slice.

Optional factories in `agents/validation/adk.py` and `agents/configuration/adk.py` extend the existing
ADK seam. Validation is a custom deterministic BaseAgent emitting a structured report in an event
state delta. Its host must load authorized session/fixture context; it cannot persist or advance the
parent workflow. Configuration is an advisory structured-output explainer without write tools.
Callbacks/evaluation hooks are injectable. The optional dependency is not installed in this local
environment; **offline SDK-double contract tests are not real ADK runtime verification**. No managed
runner, deployment, model quality, or live Gemini operation is claimed. Before enabling it, validate
the repository's pinned ADK major and configured model, ownership, callbacks, and authorization.

API seams were checked against Google's [BaseAgent source](https://github.com/google/adk-python/blob/main/src/google/adk/agents/base_agent.py),
[structured-output documentation](https://github.com/google/adk-docs/blob/main/docs/agents/llm-agents.md),
and [session event contract](https://github.com/google/adk-docs/blob/main/docs/sessions/state.md).

## API and events

All resources are `/v1`, authenticated and session-owner scoped. The inherited development identity
is rejected in production; a shared demo token is not real tenant identity. Browser mutation schemas
forbid extra fields. Only the pre-existing allowlisted browser event is accepted; internal lifecycle
events are server-authored.

Relative to `/v1/migration-sessions/{id}`:

| Method | Resource | Contract |
| --- | --- | --- |
| GET | `/validation-configuration` | Latest report, plan, computed readiness, activity, repair references |
| POST | `/validation`, `/revalidation` | Append deterministic report, invalidate previous configuration |
| GET | `/validation`, `/validation/checks`, `/validation/discrepancies` | Inspect report and contributing evidence |
| POST | `/validation/resolutions` | Propose one checksum-bound record restoration |
| POST | `/validation/resolutions/{resolution_id}/approve` | Approve and apply synthetic repair; revalidation remains required |
| POST / GET | `/configuration` | Generate proposals / inspect configuration and computed handoff |
| POST | `/configuration/{proposal_id}/decision` | Attributable approve, modify, reject |
| GET | `/configuration/{proposal_id}/explanation` | Grounded explanation, evidence, policy |
| POST | `/configuration/apply` | Atomic deterministic preflight and final application |
| GET | `/activity`, `/events` | Existing full session activity and event resources |

`POST /v1/validation-demo-sessions` explicitly creates a synthetic earlier-stage replay with `clean`
or `ar_discrepancy`. No client-supplied report, configuration risk, evidence, actor, or target payload.

Server events: validation_started, validation_check_completed, validation_failed, validation_blocked,
validation_verified; configuration_started, configuration_proposed, configuration_review_required,
configuration_approved, configuration_modified, configuration_rejected, configuration_applied,
configuration_completed; ready_for_onboarding. Repairs reuse resolution events. Verification events
carry policy/report/checksum evidence; decisions carry actor/selection; handoff states explicitly
record `onboarding_implemented=false`. Events are process-local records, not production telemetry.

## Golden evaluations

`tests/test_validate_configure.py::test_golden` executes each named case (not a catalog-count proxy):
fully reconciled; record-count mismatch; A/R mismatch; A/P mismatch; trial-balance mismatch;
referential-integrity failure; repair then revalidation; safe auto-application; high-risk approval;
modification; rejection; missing evidence; incomplete handoff; identical deterministic results.
Additional checks cover invalid money, changed snapshots/mappings/settings, downgraded approval,
missing areas, atomic preflight, unsupported roles/currency/tax, inconsistent preferences,
concurrent stale writes, ownership, forged events, and the legacy-resolution bypass.

## Future metric contracts — not measured

Use server events deduplicated by event ID, session ID, report ID, and configuration ID. Exclude
synthetic demos from future production denominators; segment by policy version, adapter, cohort,
currency, and intervention category. Attempts and unique journeys must remain separate. Proposed
owner: repository maintainer until product/engineering/operations ownership is established.

| Metric | Numerator / denominator or observation | Event basis |
| --- | --- | --- |
| Validation pass rate | Unique completed validation runs VERIFIED / all completed runs | started + verified/blocked |
| Reconciliation success | Runs with all required financial checks VERIFIED / runs with those checks complete | check_completed + report ID |
| Discrepancy rate | BLOCKED checks / all completed checks, segmented by check type | check_completed |
| Revalidation rate | Eligible sessions with >1 validation run / eligible sessions with ≥1 run | validation_started |
| Configuration approval rate | Final human-approved proposals / proposals with final human decisions | approved/modified/rejected, latest per proposal |
| Configuration override rate | Final MODIFIED proposals / proposals with final human decisions | modified |
| Configuration rejection rate | Final REJECTED proposals / proposals with final human decisions | rejected |
| Time to configure | First configuration_started → configuration_completed duration per plan; report incomplete/censored cases separately | started/completed timestamps |
| Ready-for-onboarding rate | Unique eligible validated sessions reaching readiness / unique eligible validated sessions | verified + ready_for_onboarding |

Guardrails: false verification, missing approvals, unauthorized decisions, stale-evidence acceptance,
duplicate application, task comprehension, and abandonment. Event delivery, clocks, ownership,
baselines, production instrumentation, and analytical integrity must be validated before reporting
measured values. Assistance/autonomy are diagnostics, not the definition of migration success.

## Run and recover

Run the existing local API and web commands from the root README, then visit `/validate-configure`.
Load discrepancy → Run validation → Review repair → Approve restoration → Revalidate → Continue to
configuration → review five sensitive settings (modify/reject as desired) → Apply reviewed configuration.
Restarting the API discards synthetic sessions; the UI explains expiry and supports a new scenario.
Do not use this recovery model for real records. Roll back code by normal Git revert of this branch's
commit; there are no database migrations, external writes, or cloud resources to undo.

Review evidence, per-criterion scores, findings, follow-up owners, and final gate results are in the
[review record](../reviews/validate-configure.md).
