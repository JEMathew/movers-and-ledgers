# Beta V1 agent architecture

## Full V1 architecture

MoveBooks AI uses a provider-neutral, governed agent architecture for the complete synthetic Beta
V1 journey:

```text
Discover → Assess → Plan → Map & Approve → Migrate → Resolve → Validate
→ Configure → Onboard → Verified First Productive Use
```

The logical agent set is:

| Agent | V1 responsibility | Consequential boundary |
| --- | --- | --- |
| Migration Orchestrator | Own workflow state, delegation, safe stops, and handoffs. | Cannot bypass policy or approval. |
| Discovery Agent | Inventory source facts through deterministic tools. | Cannot alter source data. |
| Assessment Agent | Apply readiness policy to evidence-backed findings. | Cannot redefine evidence or financial truth. |
| Planning Agent | Propose phases, dependencies, checkpoints, and customer actions. | Cannot execute migration work. |
| Mapping Agent | Coordinate bounded specialists and assemble mapping proposals. | Cannot approve its own proposals. |
| Migration Agent | Invoke approved, idempotent transformation and synthetic-target tools. | Approved manifests only; no provider write authority. |
| Resolution Agent | Classify exceptions and propose reversible remedies. | Cannot hide or self-accept consequential exceptions. |
| Validation Agent | Request and explain deterministic validation and reconciliation. | Only deterministic results establish verification. |
| Configuration Agent | Propose target configuration and feature alternatives. | Consequential settings require approval. |
| Onboarding Agent | Guide role-aware adoption and operating readiness. | Future slice; cannot substitute for customer action. |
| First Productive Use / Activation Agent | Coordinate the versioned activation contract and evidence. | Future slice; cannot self-declare First Productive Use. |
| Trust & Governance Agent | Explain policy, surface control state, and route escalation. | Advisory; deterministic policy remains authoritative. |
| Knowledge Agent | Retrieve versioned mapping, migration, compatibility, and canonical definitions. | Retrieved material is reference evidence, not authorization. |

Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential
decisions. Deterministic tools are capabilities, not agents. A specialist is introduced only when it
has a bounded context, tool set, structured output, evaluation set, state, and escalation contract.

## Current implemented slice

The implemented product path is:

```text
Discover ✓ → Assess ✓ → Plan ✓ → Map & Approve ✓ → Migrate ✓ → Resolve ✓ → Validate ● → Configure ●
```

Planning produces a structured, versioned migration plan. Mapping produces evidence-backed
recommendations through bounded Account, Tax, Entity, and Configuration specialists. Compatibility,
evidence completeness, target-field requirements, account-type rules, and approval policy are
deterministic. An authorized owner may approve, reject, or modify a proposal. The orchestrator stops
at `APPROVED` and prepares a handoff; it performs no target write.

Migrate → Resolve adds ordered deterministic batches, idempotent synthetic loads, checksummed
checkpoints, controlled exceptions, bounded specialists, human-governed remediation, and safe retry.
Its execution stage stops at `MIGRATION_COMPLETE`. [Validate → Configure](validate-configure.md)
adds exact synthetic reconciliation, approved record restoration, revalidation, and eight governed
configuration areas. `CONFIGURED` is not Onboarding or First Productive Use.

The implementation runs without Gemini. `MappingRecommendationProvider` is one model integration
boundary: the shipped deterministic fallback uses versioned repository knowledge and emits the same
structured recommendation contract. A future Gemini provider may propose semantic matches and concise
explanations, but deterministic validation and approval policy remain authoritative and raw financial
records are not required.

## Future slices

The following remain architectural commitments rather than implemented behavior:

```text
Onboard → Verified First Productive Use
```

Future implementations must preserve the canonical model, owner isolation, append-only audit intent,
versioned policy, safe stopping, deterministic reconciliation, scoped approvals, and verified First
Productive Use contract. Google ADK remains an optional runtime boundary: each parent and specialist
agent already exposes explicit inputs, tools, outputs, evidence, confidence, state, and escalation so
it can be adapted without moving financial controls into the model runtime.
