# Reviewer rubrics

Reviewers challenge evidence and expose risk; they do not provide generic praise. Reviewers are advisory by default and do not modify production code. The accountable builder and decision owner prioritize findings, implement changes, and request re-review.

## Severity

| Severity | Meaning |
| --- | --- |
| P0 | Immediate risk of material financial harm, data loss/exposure, security compromise, legal/regulatory breach, or broadly unusable critical path. Blocks release. |
| P1 | High-impact defect or missing control likely to cause an incorrect, unsafe, inaccessible, or failed important outcome. Normally blocks release. |
| P2 | Material quality, operability, or maintainability issue with a viable workaround or bounded exposure. Must be owned and planned. |
| P3 | Improvement that reduces friction, ambiguity, or future risk but does not materially block the current outcome. |

Severity reflects impact, likelihood, detectability, reversibility, and exposure—not reviewer preference. Avoid inflating severity to force prioritization.

## Finding contract

Every finding must include:

- **Finding:** one specific, testable problem.
- **Evidence:** file/line, trace, screenshot, test, metric, reproduction, or documented absence.
- **Why it matters:** affected user/outcome and credible failure mode.
- **Severity:** P0, P1, P2, or P3 with rationale.
- **Recommended remediation:** smallest durable control or change; note alternatives and verification.

Also record scope, assumptions, evidence gaps, and “no finding” for explicitly examined critical areas. Praise without decision-relevant evidence is omitted.

## Reviewer roles

| Reviewer | Primary questions |
| --- | --- |
| Product Reviewer | Does the work solve a significant customer problem, fit the canonical journey, respect beta boundaries, and avoid unjustified complexity? |
| Customer Outcome Reviewer | Will the change measurably advance comprehension, completion, time-to-value, or First Productive Use without shifting burden elsewhere? |
| Migration Reviewer | Are scope, lineage, transformations, unsupported items, reconciliation, exceptions, recovery, configuration, and onboarding correct? |
| Agentic AI Reviewer | Are goals, tools, state, authority, stopping, retries, escalation, evidence, and audit behavior bounded and evaluated? |
| GenAI Quality Reviewer | Are interpretations grounded, calibrated, useful, testable, and explicit about uncertainty and unsupported claims? |
| FinTech Trust Reviewer | Are accounting truth, consequential decisions, approvals, user control, evidence, and representations handled responsibly? |
| UX Reviewer | Can users understand what is happening, why, risk, progress, and next action with low cognitive load? |
| Accessibility Reviewer | Are keyboard, focus, semantics, names, errors, contrast, motion, reading order, viewport, and assistive-tech behavior sound? |
| Architecture Reviewer | Are boundaries, state, contracts, adapters, coupling, extensibility, failure isolation, and complexity appropriate? |
| Security Reviewer | Are identity, authorization, isolation, secrets, untrusted content, egress, logging, retention, and threat mitigations sufficient? |
| Reliability / Operations Reviewer | Are observability, idempotency, timeouts, retry, recovery, capacity, rollout, rollback, and support operations ready? |
| Metrics Reviewer | Are outcome and guardrail metrics defined with valid denominators, segments, ownership, data quality, and non-invented evidence? |
| Demo Reviewer | Does the demonstration reach meaningful value credibly, reliably, and without concealed manual intervention or misleading claims? |
| Release Readiness Reviewer | Were all 17 areas considered with scope-proportionate evidence, are findings handled consistently, and is the final decision supported? |

Role boundaries prevent duplicate findings: Product owns product intent and scope; Customer Outcome owns realized user/customer value and burden transfer; Metrics owns measurement validity. UX owns the coherent end-to-end experience, while Accessibility may run as a specialist depth review; consolidate overlapping evidence into one finding. Release Readiness integrates the recorded evidence and does not re-grade domain findings without new evidence.

## Internal build lenses

Reviews should apply the relevant internal quality lenses: problem significance, business impact, originality, product differentiation, agentic AI depth, technical execution, GenAI quality, deterministic rigor, responsible AI, trust, safety, security, evaluation, observability, UX, platform extensibility, customer value, demo quality, and purposeful Google-native architecture.

“Purposeful Google-native architecture” means choosing Google Cloud or AI capabilities where they create a justified operational or product advantage. It is not a quota, public positioning claim, or reason to provision paid infrastructure prematurely.

Do not publicly position MoveBooks AI as a hackathon or competition project.

## Review flow

```text
Builder → Reviewers → Findings → Prioritization → Fix → Re-review → Merge
```

Use [the review template](../reviews/TEMPLATE.md) for the consolidated record and [release readiness](../RELEASE_READINESS.md) for the decision.
