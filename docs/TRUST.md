# Trust and agent operations

The responsibility and decision boundaries in the [AI and agent constitution](AI_AGENT_CONSTITUTION.md) are authoritative. This document defines the operational trace and control baseline.

Every agent action should emit a trace containing the workspace revision, actor/agent identity, prompt and model configuration version, proposed action, tool inputs (redacted), tool result, evidence IDs, policy decision, token/latency data, and terminal outcome.

## Control classes

| Concern | Authority | Example |
|---|---|---|
| Financial truth | Deterministic rule | debits equal credits |
| Prediction | Versioned ML model | duplicate likelihood |
| Interpretation | GenAI | semantic mapping suggestion |
| Sequencing | Agent | choose next permitted tool |
| Consequential change | Human + policy | approve target write |

Agents must distinguish observation, inference, recommendation, and action. A model response is never evidence by itself. Policy stops are fail-closed. Retrying a write requires the same idempotency key.

## Evaluation gates

- deterministic unit and invariant tests;
- tool-selection and policy-stop trace tests;
- groundedness and evidence-citation scoring;
- adversarial prompt and data-poisoning cases;
- migration golden sets and reconciliation thresholds;
- human review of high-impact failure slices;
- canary rollout with regression and cost/latency budgets.
