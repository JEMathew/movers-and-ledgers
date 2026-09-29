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
- [Validate → Configure](validate-configure.md)
- [Onboard → Verified First Productive Use](onboard-fpu.md)
- [Optional Gemini / ADK advisory reasoning](live-gemini-adk.md) — synthetic-only, opt-in,
  non-authoritative explanations; live activation evidence remains pending.

`MIGRATION_COMPLETE` permits Validation only when all batches complete and unresolved migration
exceptions equal zero. Validation must be VERIFIED with no blocking discrepancies before
configuration. `CONFIGURED` permits Onboarding only with unchanged verification evidence, all eight
settings applied, and attributable required approvals. Onboarding requires ten prerequisite checks
and explicit consequential decisions. First Productive Use requires a separately approved invoice,
successful synthetic posting, deterministic accounting checks, and bound audit evidence. None of
the earlier states implies verified First Productive Use or production readiness.
