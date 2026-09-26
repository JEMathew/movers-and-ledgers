# Product scorecard

Use this scorecard for discovery, feature review, release review, and portfolio decisions. It defines what to examine; it does **not** claim that production measurement exists. Record evidence, time window, population, owner, and status for every assessed dimension. Any numeric objective must be labelled **Illustrative**, **Proposed**, or **Beta target**.

## Assessment scale

- **GREEN** — evidence supports the intended outcome and no blocking risk is open.
- **AMBER** — evidence is incomplete or a material risk has an owned, time-bound mitigation.
- **RED** — evidence shows unacceptable outcome or risk, or a required control is absent.
- **NOT ASSESSED** — no defensible evidence; never treat this as GREEN.

## Dimensions

| Dimension | Questions | Metric set |
| --- | --- | --- |
| User | Can users complete and understand the task without avoidable error or burden? | Task completion, abandonment, time-on-task, comprehension, user error, CSAT |
| Customer Outcome | Does the journey deliver a usable migration outcome? | Migration completion, First Productive Use, time-to-value, self-service completion, assisted completion |
| Business | Does value scale sustainably for customer and operator? | Conversion, activation, migration throughput, support deflection, cost-to-serve, retention where relevant |
| Product | Are intended capabilities adopted through a meaningful funnel? | Adoption, funnel progression, feature completion, repeat usage where meaningful |
| Migration Quality | Is the migration complete, correct, explicit about gaps, and recoverable? | Reconciliation success, data loss, exception rate, retry success, unsupported-item detection, recovery success |
| Agent Quality | Does orchestration choose and execute permitted actions effectively? | Task success, tool-selection accuracy, tool execution, autonomy rate, escalation rate, recovery rate |
| GenAI Quality | Are interpretations and recommendations grounded and useful? | Groundedness, recommendation accuracy, hallucination rate, explanation quality, unsupported claims |
| Deterministic Quality | Are rules correct, stable, and repeatable? | Rule consistency, false pass, false block, reconciliation repeatability, validation accuracy |
| Safety / Trust | Do users retain informed control and do policies prevent unsafe behavior? | Policy violations, unsafe actions prevented, human overrides, approval bypasses, confidence calibration |
| Security / Privacy | Are identity, isolation, data handling, and secrets protected? | Authentication failures, authorization failures, isolation defects, data leakage, sensitive-data exposure, secret exposure, retention violations |
| Reliability / Operations | Does the service complete work predictably and recover safely? | Uptime, latency, tool failures, retries, recovery, error rate |
| Engineering Quality | Can the team change the system safely? | Test health, build health, dependency health, complexity, technical debt |
| Evaluation Maturity | Can important behavior and regressions be measured? | Eval coverage, golden-case coverage, regression detection, automated coverage, human-evaluation coverage |
| UX / Accessibility | Is the experience usable across input, assistive technology, theme, and viewport? | Keyboard task completion, accessibility defects, contrast failures, responsive defects, interaction errors |
| Platform Scalability | Can sources and targets be added without core leakage or duplication? | Adapter effort, reuse, coupling, source-specific leakage, configuration reuse |
| Feedback / Support | Does feedback produce timely resolution and durable learning? | Feedback submission rate, helpfulness, support contact rate, first-response time, resolution time, repeat-contact rate, cases converted into regression/eval cases |
| Demo Readiness | Can the product communicate credible value without fragile workarounds? | Demo success, manual workarounds, time to meaningful value, story clarity, failure risk |

## Scorecard record

For each dimension record:

```text
Status: GREEN | AMBER | RED | NOT ASSESSED
Question / decision:
Evidence and measurement window:
Metric movement expected:
Customer and risk impact:
Owner:
Open findings (P0/P1/P2/P3):
Mitigation or next experiment:
Target label, if numeric: Illustrative | Proposed | Beta target
```

Cross-metric guardrail: a local improvement is not success when it worsens customer outcome, migration correctness, safety, trust, privacy, reliability, or sustainable cost.
