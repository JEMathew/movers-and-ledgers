# Agent contracts

The orchestrator owns state and delegation; specialist agents own bounded reasoning tasks. Each specialist must return a proposed action and evidence references rather than directly mutating workflow state. Only the orchestrator invokes approved write tools, and deterministic policy remains authoritative.

The ADK entry point is `agents/orchestrator/agent.py`. Install with `pip install -e '.[agents,dev]'`, configure Vertex AI credentials outside the repository, then use current ADK tooling. The scaffold follows the official ADK `Agent`/`root_agent` convention while keeping model-dependent code out of financial controls.

