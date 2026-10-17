# Architecture and experience diagrams

Version 1, source baseline `8f750d9`, 17 October 2026. Mermaid files and SVGs are editable sources; PNG exports support presentations. `source/diagrams.json` is the shared semantic specification and `source/render-diagrams.mjs` reproduces SVG/PNG exports. Sequence message names are conceptual operations anchored in the source below, not claims of undocumented API routes.

**Evidence boundary:** public Beta hosting is documented; candidate cloud services are not newly verified here. Last-known cloud mode is deterministic-only. Vertex API enablement does not prove inference permission or regional access. Firestore operational controls are a gated design, not live integration. Existing audit records remain separate. Reviewer is a candidate until implementation/test/deployment evidence establishes its status. Internal Judges remain outside financial execution. Trust & Governance is a logical policy responsibility, not an active LLM runtime.

## Catalogue

| Diagram | Editable Mermaid | Editable SVG | PNG export |
| --- | --- | --- | --- |
| Three entries, one governed customer journey | [Mermaid](source/customer-journey.mmd) | [SVG](svg/customer-journey.svg) | [PNG](png/customer-journey.png) |
| User and system responsibilities | [Mermaid](source/user-system-swimlane.mmd) | [SVG](svg/user-system-swimlane.svg) | [PNG](png/user-system-swimlane.png) |
| Logical roles and actual execution boundaries | [Mermaid](source/agent-subagent-swimlane.mmd) | [SVG](svg/agent-subagent-swimlane.svg) | [PNG](png/agent-subagent-swimlane.png) |
| Service blueprint and recovery evidence | [Mermaid](source/service-blueprint.mmd) | [SVG](svg/service-blueprint.svg) | [PNG](png/service-blueprint.png) |
| C4 system context: bounded synthetic Beta | [Mermaid](source/c4-system-context.mmd) | [SVG](svg/c4-system-context.svg) | [PNG](png/c4-system-context.png) |
| C4 container architecture | [Mermaid](source/c4-container.mmd) | [SVG](svg/c4-container.svg) | [PNG](png/c4-container.png) |
| Google Cloud deployment intent and evidence boundary | [Mermaid](source/google-cloud-deployment.mmd) | [SVG](svg/google-cloud-deployment.svg) | [PNG](png/google-cloud-deployment.png) |
| Reasoning, tools and internal evaluation | [Mermaid](source/agent-tool-architecture.mmd) | [SVG](svg/agent-tool-architecture.svg) | [PNG](png/agent-tool-architecture.png) |
| Data flow and trust boundaries | [Mermaid](source/data-flow-trust-boundaries.mmd) | [SVG](svg/data-flow-trust-boundaries.svg) | [PNG](png/data-flow-trust-boundaries.png) |
| Firestore operational control design: not live evidence | [Mermaid](source/firestore-operational-controls.mmd) | [SVG](svg/firestore-operational-controls.svg) | [PNG](png/firestore-operational-controls.png) |
| Synthetic migration and verification architecture | [Mermaid](source/synthetic-migration.mmd) | [SVG](svg/synthetic-migration.svg) | [PNG](png/synthetic-migration.png) |
| Ambiguous account mapping | [Mermaid](source/sequence-ambiguous-mapping.mmd) | [SVG](svg/sequence-ambiguous-mapping.svg) | [PNG](png/sequence-ambiguous-mapping.png) |
| User-triggered Gemini advisory | [Mermaid](source/sequence-gemini-advisory.mmd) | [SVG](svg/sequence-gemini-advisory.svg) | [PNG](png/sequence-gemini-advisory.png) |
| Independent review candidate | [Mermaid](source/sequence-independent-review.mmd) | [SVG](svg/sequence-independent-review.svg) | [PNG](png/sequence-independent-review.png) |
| Human approval and rejection | [Mermaid](source/sequence-human-decision.mmd) | [SVG](svg/sequence-human-decision.svg) | [PNG](png/sequence-human-decision.png) |
| Automatic retry versus human escalation | [Mermaid](source/sequence-retry-escalation.mmd) | [SVG](svg/sequence-retry-escalation.svg) | [PNG](png/sequence-retry-escalation.png) |
| Sensitive configuration approval | [Mermaid](source/sequence-sensitive-configuration.mmd) | [SVG](svg/sequence-sensitive-configuration.svg) | [PNG](png/sequence-sensitive-configuration.png) |
| Deterministic reconciliation | [Mermaid](source/sequence-reconciliation.mmd) | [SVG](svg/sequence-reconciliation.svg) | [PNG](png/sequence-reconciliation.png) |
| Approved synthetic FPU invoice | [Mermaid](source/sequence-fpu-invoice.mmd) | [SVG](svg/sequence-fpu-invoice.svg) | [PNG](png/sequence-fpu-invoice.png) |

## Source anchors

- Customer lifecycle: `apps/web/components/journey/journey.ts`, `docs/PRODUCT_CONSTITUTION.md`, `docs/architecture/beta-v1-integration.md`.
- Deterministic orchestration/specialists: `agents/orchestrator/plan_map_approve.py`, `migrate_resolve.py`, `validate_configure.py`, `onboard_fpu.py`, `docs/architecture/beta-v1-agent-architecture.md`.
- Model direction, five contexts and safety: `services/api/src/movebooks_api/reasoning.py`, `tests/test_live_reasoning.py`, `docs/architecture/live-gemini-adk.md`.
- Identity, persistence, adapters: `services/api/src/movebooks_api/auth.py`, `runtime/persistence.py`, `runtime/storage.py`, `docs/architecture/google-native-runtime.md`.
- Intake: `services/api/src/movebooks_api/intake.py`, `intake_api.py`, `apps/web/components/try-your-data/package-contract.json`, `docs/architecture/try-your-data.md`.
- Recovery/reconciliation/FPU: `tests/test_migrate_resolve.py`, `test_validate_configure.py`, `test_onboard_fpu.py`, `test_beta_v1_integration.py`.
- Cloud truth: `docs/deployment/public-beta.md`, `docs/reviews/google-cloud-validation.md`, user-provided last-known cloud facts. Current deployment must be independently rechecked before presentation as live.

## Important reading rules

Gemini starts with an explicit user request and returns advice to that user. Advice is never automatically consumed by orchestration. Source and target adapters are separate. Transient retries occur automatically only within deterministic policy. Sensitive configuration and consequential remediations need human approval. Raw uploaded source never enters model context. Cloud SQL is financial authority. Firestore activity/operational controls do not replace audit evidence. A successful synthetic FPU outcome does not claim production provider migration.

## Candidate source reconciliation

The integration workstream now supplies `agents/reviewer/agent.py`, `domain/reasoning/reviewer.py`, `services/api/src/movebooks_api/reviewer.py` and `tests/test_independent_review.py`. It uses a separate review instruction/output contract with deterministic challenge fallback. This is source evidence, not a claim of live-model execution or deployment. `runtime/model_controls.py` implements a Firestore transaction reservation boundary with explicit synthetic authorization, kill switch, owner/global allowances and conservative consumed reservations on failure. No refund/finalization or live activity-stream integration is claimed. `tests/test_model_controls.py` exercises a serialized port double and pure decisions; it is not live Firestore proof.
