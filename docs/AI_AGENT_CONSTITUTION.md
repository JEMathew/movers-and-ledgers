# AI and agent constitution

**Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential decisions.**

This separation of responsibility is a system invariant. Model output can propose or explain; it cannot become financial truth, evidence, approval, or authorization merely by being generated.

## Responsibilities

| Capability | Responsible for | Must not replace |
| --- | --- | --- |
| Deterministic software | Financial calculations; schema validation; counts; referential integrity; checksums; reconciliation; transformation constraints; approval enforcement; authorization | Human policy decisions or unexplained probabilistic judgment |
| AI / ML | Duplicate detection; entity matching; anomaly detection; similarity; migration-risk prediction | Reconciliation, authorization, or definitive accounting classification |
| GenAI | Semantic interpretation; mapping recommendations; explanations; feature-gap analysis; natural-language interaction | Source evidence, accounting truth, or required approval |
| Agentic AI | Goal interpretation; permitted tool selection and execution; workflow orchestration; explicit state management; recovery; controlled retry; escalation | Policy ownership, privilege assignment, or declaration of migration success |

## Decision contract

Every material recommendation or action must carry a structured record containing:

- task and workflow identifiers, actor or agent identity, and versioned prompt/model/configuration;
- observation, inference, recommendation, and proposed action as separate fields;
- evidence references and deterministic control results;
- confidence with a defined scale, calibration source, and uncertainty reason;
- alternatives, expected impact, reversibility, and required approval;
- selected tool, validated inputs, authority scope, idempotency key where applicable, and terminal outcome.

Private chain-of-thought is never required or exposed. Store concise decision rationale, evidence, policy outcomes, and structured intermediate results instead.

## Confidence and evidence

- Confidence is decision support, not permission. High confidence does not bypass a control.
- Thresholds are versioned by task and evaluated against representative cases.
- Missing, contradictory, stale, or untraceable evidence lowers confidence and can require a safe stop.
- A model response is not evidence by itself. Evidence must resolve to an attributable source fact, deterministic result, approved policy, or recorded human decision.
- Explanations must distinguish known facts from inference and clearly name unsupported assumptions.

## Approval boundaries

Human or explicitly authorized policy approval is required before consequential actions such as target writes, destructive changes, account reclassification, tax treatment changes, permission changes, integration cutover, exception acceptance, rollback decisions, and declaration of First Productive Use. Approval must be scoped, attributable, informed by evidence, and enforced by deterministic software.

## Safe stopping, retry, and escalation

An agent stops safely when authority is missing, evidence is insufficient or conflicting, a deterministic gate fails, a tool result is ambiguous, the requested action exceeds scope, sensitive data could be exposed, an idempotency guarantee is absent, or retry limits are reached. A safe stop preserves state, prevents further writes, records the reason, and presents the next responsible action.

Retries are allowed only for classified transient failures, within a versioned attempt and time budget. Write retries reuse the same idempotency key and verify prior outcome before re-execution. Validation, policy, authorization, and semantic failures are not blindly retried.

Escalation records the blocker, evidence, attempted recovery, current state, impact, urgency, and accountable human or service owner. Agents must not escalate their own privileges to recover.

## Auditability and structured outputs

Tool calls and decisions must be reconstructable from append-only, redacted audit records. Schemas are versioned; unknown fields fail safely at authority boundaries. Logs must preserve evidence references and outcomes without copying raw sensitive financial data unnecessarily. See [Trust and agent operations](TRUST.md) for the trace baseline.

## Prohibited autonomous actions

Agents must never:

- treat LLM output as financial truth;
- silently delete data or configuration;
- silently reclassify accounts or accounting treatment;
- bypass reconciliation or required validation;
- bypass, fabricate, or self-approve required approvals;
- autonomously escalate privileges, weaken policy, or expand tool scope;
- expose private chain-of-thought;
- conceal unsupported items, failed tools, uncertainty, or partial completion;
- claim migration completion before deterministic controls and First Productive Use criteria are satisfied.
