# Evaluation principles

No agentic capability is complete without an evaluation approach. Evaluation must measure the product outcome and its control system, not only model quality.

## What to evaluate

- Task success against an explicit outcome and terminal state.
- Mapping accuracy, including accepted alternatives and consequential errors.
- Groundedness and correct evidence attribution.
- Tool-selection accuracy and tool-execution success.
- Escalation correctness: escalate when required and avoid unnecessary escalation.
- Human override frequency, reason, and downstream outcome.
- Policy adherence and prevention of prohibited actions.
- Deterministic consistency and reconciliation repeatability.
- End-to-end migration correctness, unsupported-item detection, and First Productive Use.
- Recovery effectiveness, retry safety, and state preservation.
- Latency and cost within a declared evaluation budget.
- Customer comprehension of what happened, why, risk, and next action.

Metrics must be segmented by task, risk class, migration stage, source/target adapter, model/configuration version, and outcome where sample size and privacy permit. Aggregate averages must not conceal high-impact failure slices.

## Evaluation layers

| Layer | Purpose |
| --- | --- |
| Unit tests | Verify isolated functions, schemas, transitions, and components. |
| Deterministic tests | Prove accounting invariants, validation rules, authorization, approvals, idempotency, and reconciliation behavior. |
| Integration tests | Verify contracts across adapters, tools, storage, policy, identity, and orchestrator boundaries. |
| Golden datasets | Provide versioned synthetic or properly governed cases with expected mappings, exceptions, transformations, and reconciliations. |
| Agent evals | Score orchestration, tool choice, state handling, retry, stopping, escalation, and policy behavior from traces. |
| Model evals | Score prediction, interpretation, groundedness, recommendation quality, and calibration independent of orchestration. |
| End-to-end evals | Exercise representative journeys through First Productive Use, including failure and recovery paths. |
| Human review | Judge accounting nuance, explanation usefulness, usability, safety, and novel failure modes that automated scores miss. |

## Evaluation discipline

Define success criteria and failure severity before running an evaluation. Version datasets, prompts, models, tools, policies, and scorers. Preserve reproducible traces with sensitive data redacted. Convert escaped defects, support cases, and important human overrides into regression or evaluation cases.

Do not tune and report on the same unsegmented cases. Report denominators, confidence limits where appropriate, known blind spots, and the difference between proposed targets and measured results. An improved model score cannot justify a release if migration correctness, customer outcomes, safety, trust, reliability, or cost regresses materially.
