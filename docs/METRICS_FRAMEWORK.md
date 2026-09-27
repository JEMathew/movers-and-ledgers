# Metrics framework

## Hierarchy

```text
North Star
├─ Customer outcomes
├─ Business outcomes
├─ Product leading indicators
└─ Guardrails and delivery health
   ├─ Migration and deterministic quality
   ├─ Agent and GenAI quality
   ├─ Safety, trust, security, and privacy
   └─ Reliability and operations
```

The framework separates value outcomes from the signals and controls that help deliver them. Customer success is not interchangeable with business efficiency, product activity, model quality, or operational health. Every outcome metric needs safety, quality, and operational guardrails.

## Proposed North Star

**Percentage of eligible migration journeys reaching verified First Productive Use.**

This is a **Proposed** definition, not a measured production result or numeric target.

- **Denominator:** eligible migration journeys in a start-date cohort whose defined observation window has elapsed, with exclusions fixed before analysis. Also report still-open journeys separately rather than silently excluding them.
- **Numerator:** journeys that satisfy the versioned First Productive Use contract and deterministic completion controls.
- **First Productive Use contract:** names the agreed productive task and acceptance criteria before execution; requires an authorized customer user to complete it in the intended target environment; links passing data, reconciliation, configuration, access, integration, onboarding, and exception-disposition controls; and records the observation time and evidence. A support operator performing the task for the customer does not satisfy the contract.
- **Assistance treatment:** assisted and self-service journeys remain in the outcome denominator and are reported as segments. Assistance rate, intensity, reason, and cost are separate health and business measures, not conditions for counting customer success.
- **Required segments:** journey cohort, migration complexity/risk class, source and target adapters, customer type, and assistance level.
- **Guardrails:** no material regression in reconciliation, data loss, unsupported-item detection, policy adherence, approval integrity, security/privacy, CSAT, or cost-to-serve.

## Supporting metrics

| Metric | Definition | Classification |
| --- | --- | --- |
| Migration completion | Eligible journeys satisfying the versioned migration completion contract / eligible journeys started | Lagging, outcome, product |
| First Productive Use | Eligible cohort journeys satisfying the versioned First Productive Use contract / eligible cohort journeys whose observation window elapsed | Lagging, outcome, customer |
| Median time-to-value | Median elapsed time from defined journey start to First Productive Use; report paused time separately | Lagging, outcome, product/business |
| Support-assisted migration | Journeys requiring human support, segmented by reason and intensity / eligible journeys | Leading and lagging, health, business/operational |
| Abandonment | Eligible journeys inactive beyond a defined window before completion / eligible journeys started | Leading, outcome, product |
| Mapping acceptance | Recommendations approved without edit / mapping recommendations reviewed | Leading, health, product/model |
| Mapping override | Recommendations changed or rejected / mapping recommendations reviewed | Leading, health, product/model |
| Reconciliation success | Completed validation runs passing all required deterministic reconciliation controls / eligible runs | Lagging, outcome, migration quality |
| Validation failure | Validation runs failing one or more required controls / eligible validation runs | Leading, health, migration quality |
| Exception rate | Classified exceptions / relevant entities or transactions processed; always report denominator and severity | Leading, health, migration quality |
| Autonomy | Permitted tasks completed without human intervention / tasks eligible for autonomy | Leading, health, agent |
| Escalation | Correct escalations / tasks requiring escalation, paired with unnecessary-escalation rate | Leading, health, agent/safety |
| Agent task success | Agent tasks reaching the defined correct terminal state / evaluated agent tasks | Leading, health, agent |
| Tool success | Valid tool calls returning the expected terminal result / eligible tool calls | Leading, health, operational |
| Retry success | Transient-failure tasks recovered within policy / retry-eligible failed tasks | Leading, health, operational |
| Groundedness | Evaluated claims supported by cited, valid evidence / evaluated factual claims | Leading, health, model |
| CSAT | Responses to a versioned satisfaction question, with response rate and context reported | Lagging, outcome, customer |

### Migrate → Resolve future metric contracts

These are uninstrumented contracts, not measured results. Every rate requires the stated eligible
denominator, and every production implementation still requires an owner, observation window,
privacy/retention review, baseline, target, segments, and data-quality checks.

| Metric | Future definition |
| --- | --- |
| Migration completion | Eligible executions reaching the versioned completion contract / eligible executions started. |
| Migration duration | Elapsed start-to-completion time, with paused and human-wait time separately reported. |
| Batch success rate | Batches completed without a failed attempt / eligible batches started. |
| Exception rate | Classified exceptions / relevant records or batches processed, segmented by kind and severity. |
| Auto-resolution rate | Policy-eligible low-risk exceptions resolved without human action / exceptions eligible for auto-resolution. |
| Human-resolution rate | Exceptions closed by an attributable human-approved remediation / exceptions requiring human approval. |
| Retry success | Failed retry-eligible batches completing within policy / retry-eligible failed batches. |
| Blocked migration rate | Executions reaching a blocked terminal state / eligible executions started. |
| Recovery time | Elapsed failure-to-success time, separating system work from customer wait time. |
| Escalation rate | Correct escalations / exceptions requiring escalation, paired with unnecessary-escalation rate. |
| Duplicate execution prevented | Conflicting or repeated execution attempts rejected or safely replayed, reported as a count with request context. |
| Customer intervention count | Attributable customer decisions per execution, segmented by reason and risk; diagnostic only. |

## Classification rules

- **Leading** metrics expose conditions likely to affect a later outcome; **lagging** metrics confirm the outcome after it occurs.
- **Outcome** metrics describe customer or business value; **health** metrics describe the system’s ability to deliver it safely and repeatedly.
- **Product** metrics describe behavior in the journey; **model** metrics isolate probabilistic capability and must not substitute for product results.
- **Business** metrics describe sustainable value; **operational** metrics describe service performance and intervention burden.

Assistance, autonomy, recommendation acceptance, tool success, and similar activity metrics are diagnostic. They may not be optimized or presented as success without the customer outcome and guardrail view. In particular, autonomy is measured only for tasks already eligible for autonomy and must be paired with correctness, escalation, override, safety, and downstream outcome.

Metric definitions must include event source, owner, formula, denominator, unit, window, exclusions, segmentation, data-quality checks, privacy/retention treatment, and known limitations. A dashboard without these contracts is exploratory, not release evidence.

**Improving agent metrics alone does not constitute product success if customer, migration, business, safety, or trust outcomes worsen.**
