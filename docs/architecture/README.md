# Architecture

## System shape

```text
Public web ─┐
Protected web ─ auth boundary ─ API ─ orchestrator ─ deterministic tools
                                      │       │
                                      │       └─ approval policy / audit evidence
                                      ├─ source adapter → canonical model → governed transformation → target adapter
                                      └─ PostgreSQL | object storage | evaluation export
```

The browser never talks directly to an accounting provider. The API issues scoped jobs; adapters translate at system boundaries; the canonical model remains provider-neutral. Governed transformations are versioned, deterministic where accounting treatment is involved, attributable to evidence and approval, and applied before the target adapter. Agents can propose and invoke tools but cannot declare financial success, mutate policy, or manufacture evidence.

## Deployment target (not provisioned)

- Separate Cloud Run services for web, API, migration workers, and evaluation jobs.
- Artifact Registry for immutable images and workload identity federation for CI.
- Cloud SQL for workflow state, approvals, mappings, and audit metadata.
- Cloud Storage for encrypted import artifacts, manifests, and reports.
- BigQuery for de-identified evaluations and operational analytics.
- Vertex AI Gemini for reasoning through ADK; Secret Manager for configuration.
- Cloud Logging/Trace for correlated request, workflow, agent, and tool telemetry.

No paid resource is created by this repository. Production infrastructure should be added as reviewed IaC with deletion protection, least-privilege service accounts, private connectivity where justified, and environment isolation.

## Key decisions

1. **Modular monolith first.** Domain and controls stay easy to test; migration/evaluation processes have service boundaries ready when load or blast radius requires separation.
2. **Append-only evidence.** Results are reproducible, attributable, and hashable. Explanations reference evidence IDs.
3. **Explicit workflow state.** The orchestrator advances through guarded transitions, not free-form conversation state.
4. **Ports and adapters.** Provider data is normalized at the edges, preventing a source or target vendor from leaking into the core.
5. **ADK is an integration boundary.** Agent runtime code is optional during local deterministic development; financial controls do not depend on model availability.

## Implemented vertical slices

- [Discover → Assess](discover-assess.md) — synthetic discovery, deterministic findings,
  evidence-backed readiness, owner-scoped ephemeral sessions, and agent activity.
- [Plan → Map → Approve](plan-map-approve.md) — dependency-aware planning, specialist mapping,
  deterministic controls, owner decisions, and a governed future-migration handoff.
- [Migrate → Resolve](migrate-resolve.md) — synthetic deterministic execution, checkpoints,
  controlled exceptions, governed remediation, retry, and a safe future-Validation gate.
- [Canonical agent workflows](AGENT_WORKFLOWS.md) — stage ownership and handoff invariants.
- [Validate → Configure](validate-configure.md) — exact reconciliation, bounded repair,
  revalidation, approved configuration, and a future-Onboarding gate.
- [Beta V1 agent architecture](beta-v1-agent-architecture.md) — the complete 13-agent logical
  architecture, the currently implemented slice, future stages, approval boundaries, and ADK seam.

The implemented synthetic journey now reaches **Verified First Productive Use**:
[Onboard → FPU](onboard-fpu.md) and [integrated Beta V1 hardening](beta-v1-integration.md).
Older slice documents describe their original release boundaries. The integrated reference is
authoritative for current cross-stage continuity; none of this establishes production readiness.
