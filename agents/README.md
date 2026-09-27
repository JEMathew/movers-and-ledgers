# Agent contracts

All agent behavior must comply with the [AI and agent constitution](../docs/AI_AGENT_CONSTITUTION.md) and the operational controls in [Trust and agent operations](../docs/TRUST.md).

The orchestrator owns state and delegation; specialist agents own bounded reasoning tasks. Each specialist must return a proposed action and evidence references rather than directly mutating workflow state. Only the orchestrator invokes approved write tools, and deterministic policy remains authoritative.

The canonical [Beta V1 agent architecture](../docs/architecture/beta-v1-agent-architecture.md)
defines the complete logical team: Migration Orchestrator, Discovery, Assessment, Planning, Mapping,
Migration, Resolution, Validation, Configuration, Onboarding, First Productive Use / Activation,
Trust & Governance, and Knowledge. Repository code currently implements Discover through Map &
Approve. Later agents remain explicit future boundaries, not implied capabilities of the current
slice.

Mapping uses bounded Account, Tax, Entity, and Configuration specialists because those areas have
different evidence, confidence, compatibility, and escalation requirements. Planning dependencies
and sequence remain deterministic capabilities; they are not inflated into agents.

The ADK entry point is `agents/orchestrator/agent.py`. Install with `pip install -e '.[agents,dev]'`, configure Vertex AI credentials outside the repository, then use current ADK tooling. The scaffold follows the official ADK `Agent`/`root_agent` convention while keeping model-dependent code out of financial controls.
