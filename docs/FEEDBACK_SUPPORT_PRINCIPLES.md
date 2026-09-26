# Feedback and support principles

Feedback and support are part of the product control loop. This document defines the future operating model; it does not authorize a UI, backend, or automatic data collection in the current phase.

## Collection surfaces

**Public / landing surfaces** may offer **Share Feedback** and **Report an Issue** with clear expectations about response, privacy, and what not to submit.

**Authenticated product surfaces** may collect recommendation helpfulness, incorrect-recommendation reports, migration-step feedback, CSAT, and agent-explanation feedback in the context of the relevant workspace and stage.

**Internal support** should create a governed case with classification, severity, migration session ID, current migration stage, blocker/error code, failed tool or action, timestamp, affected entity count, and audit references.

Do not attach raw sensitive financial data automatically. Collect the minimum necessary context; show users what will be shared; redact secrets and personal or financial content; enforce workspace authorization, retention, deletion, and audit requirements. Case identifiers and audit references must be opaque and workspace-scoped; possession of a reference alone never grants access. Treat free text and attachments as untrusted content and apply redaction before they enter support, analytics, model, or evaluation systems.

## Closed loop

```text
Feedback / Support
→ Triage
→ Product / Bug / Knowledge / Agent-Eval classification
→ Fix
→ Regression or evaluation case
→ Release
→ Resolution
```

Triage must distinguish service incidents, security/privacy reports, migration blockers, product defects, documentation/knowledge gaps, model or agent quality issues, and requests. High-severity safety, security, data-loss, reconciliation, or approval-integrity issues follow incident escalation rather than ordinary backlog handling.

## Operating principles

- Acknowledge ownership and provide a traceable status without inventing resolution dates.
- Preserve linkage from report to evidence, remediation, test/eval case, release, and customer resolution.
- Measure response and resolution with severity and channel context; do not optimize contact deflection by making help harder to reach.
- Convert material escaped defects and agent failures into durable regression or evaluation cases.
- Keep support tooling advisory and least-privileged; support staff cannot bypass migration controls.
- Close the loop with the reporter when policy and privacy permit.
