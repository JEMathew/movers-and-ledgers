# Canonical agent workflows

This document is the stage-level workflow index for MoveBooks AI. The product constitution remains
authoritative for the complete journey.

```text
Discover → Assess → Plan → Map & Approve → Migrate → Resolve → Validate
→ Configure → Onboard → Verified First Productive Use
```

The Migration Orchestrator is the only owner of stage transitions. Stage agents receive bounded
context and tools, return structured evidence, and cannot approve their own consequential actions.
Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential
decisions.

Implemented workflows:

- [Discover → Assess](discover-assess.md)
- [Plan → Map → Approve](plan-map-approve.md)
- [Migrate → Resolve](migrate-resolve.md)

Validate onward remains a future contract. `MIGRATION_COMPLETE` permits a future Validation Agent
handoff only when all batches complete and unresolved blocking exceptions equal zero. It does not
mean reconciliation, configuration, onboarding, or First Productive Use has occurred.
