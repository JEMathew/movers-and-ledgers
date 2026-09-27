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
| Migration Agent | Invoke approved, idempotent transformation and target-write tools. | Future slice; approved manifests only. |
| Resolution Agent | Classify exceptions and propose reversible remedies. | Future slice; cannot hide or self-accept exceptions. |
| Validation Agent | Request and explain deterministic validation and reconciliation. | Future slice; cannot declare its own checks passed. |
| Configuration Agent | Propose target configuration and feature alternatives. | Future slice; consequential settings require approval. |
| Onboarding Agent | Guide role-aware adoption and operating readiness. | Future slice; cannot substitute for customer action. |
| First Productive Use / Activation Agent | Coordinate the versioned activation contract and evidence. | Future slice; cannot self-declare First Productive Use. |
| Trust & Governance Agent | Explain policy, surface control state, and route escalation. | Advisory; deterministic policy remains authoritative. |
| Knowledge Agent | Retrieve versioned mapping, migration, compatibility, and canonical definitions. | Retrieved material is reference evidence, not authorization. |

Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential
decisions. Deterministic tools are capabilities, not agents. A specialist is introduced only when it
has a bounded context, tool set, structured output, evaluation set, state, and escalation contract.

## Current implemented slice

After the Plan → Map & Approve branch, the implemented product path is:

```text
Discover ✓ → Assess ✓ → Plan ● → Map & Approve ●
```

Planning produces a structured, versioned migration plan. Mapping produces evidence-backed
recommendations through bounded Account, Tax, Entity, and Configuration specialists. Compatibility,
evidence completeness, target-field requirements, account-type rules, and approval policy are
deterministic. An authorized owner may approve, reject, or modify a proposal. The orchestrator stops
at `APPROVED` and prepares a handoff; it performs no target write.

The implementation runs without Gemini. `MappingRecommendationProvider` is the model integration
boundary: the shipped deterministic fallback uses versioned repository knowledge and emits the same
structured recommendation contract. A future Gemini provider may propose semantic matches and concise
explanations, but deterministic validation and approval policy remain authoritative and raw financial
records are not required.

## Future slices

The following remain architectural commitments rather than implemented behavior:

```text
Migrate → Resolve → Validate → Configure → Onboard → Verified First Productive Use
```

Future implementations must preserve the canonical model, owner isolation, append-only audit intent,
versioned policy, safe stopping, deterministic reconciliation, scoped approvals, and verified First
Productive Use contract. Google ADK remains an optional runtime boundary: each parent and specialist
agent already exposes explicit inputs, tools, outputs, evidence, confidence, state, and escalation so
it can be adapted without moving financial controls into the model runtime.
