# Metrics framework

## Hierarchy

```text
North Star
└─ Customer Outcomes
   └─ Product Metrics
      └─ Business Metrics
         └─ Migration Quality
            └─ Agent / AI Quality
               └─ Safety / Trust
                  └─ Reliability / Operations
```

The hierarchy expresses dependency, not permission to trade away lower-level health. Every outcome metric needs safety, quality, and operational guardrails.

## Proposed North Star

**Percentage of migration journeys reaching First Productive Use successfully with minimal assisted intervention.**

This is a **Proposed** definition, not a measured production result or numeric target.

- **Denominator:** eligible migration journeys started in the measurement window, with exclusions defined before analysis.
- **Numerator:** journeys that satisfy the versioned First Productive Use contract and deterministic completion controls.
- **Minimal assisted intervention:** no assistance, or assistance within a separately defined and reported threshold; never hide assisted journeys inside self-service success.
- **Required segments:** journey cohort, migration complexity/risk class, source and target adapters, customer type, and assisted versus self-service.
- **Guardrails:** no material regression in reconciliation, data loss, unsupported-item detection, policy adherence, approval integrity, security/privacy, CSAT, or cost-to-serve.

## Supporting metrics

| Metric | Definition | Classification |
| --- | --- | --- |
| Migration completion | Eligible journeys satisfying the versioned migration completion contract / eligible journeys started | Lagging, outcome, product |
| First Productive Use | Completed journeys with an observed agreed productive task / eligible journeys | Lagging, outcome, product |
| Median time-to-value | Median elapsed time from defined journey start to First Productive Use; report paused time separately | Lagging, outcome, product/business |
| Support-assisted migration | Journeys requiring human support beyond the declared threshold / eligible journeys | Leading and lagging, health, business/operational |
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

## Classification rules

- **Leading** metrics expose conditions likely to affect a later outcome; **lagging** metrics confirm the outcome after it occurs.
- **Outcome** metrics describe customer or business value; **health** metrics describe the system’s ability to deliver it safely and repeatedly.
- **Product** metrics describe behavior in the journey; **model** metrics isolate probabilistic capability and must not substitute for product results.
- **Business** metrics describe sustainable value; **operational** metrics describe service performance and intervention burden.

Metric definitions must include event source, owner, formula, denominator, unit, window, exclusions, segmentation, data-quality checks, privacy/retention treatment, and known limitations. A dashboard without these contracts is exploratory, not release evidence.

**Improving agent metrics alone does not constitute product success if customer, migration, business, safety, or trust outcomes worsen.**
