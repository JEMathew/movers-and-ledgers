"""ADK entry point. Install the `agents` extra before importing this module."""

from google.adk.agents import Agent

from agents.contracts import AgentRole
from agents.registry import AGENT_RESPONSIBILITIES


def describe_control(control: str) -> dict[str, str]:
    """Explain which authority owns a migration control; this tool never performs writes."""
    controls = {
        "financial_truth": "Deterministic rules",
        "prediction": "Versioned AI/ML models",
        "interpretation": "GenAI with cited evidence",
        "orchestration": "Agents operating within policy",
        "consequential_decision": "An authorized human",
    }
    return {"control": control, "authority": controls.get(control, "Unknown; escalate to a human")}


root_agent = Agent(
    name="movebooks_migration_orchestrator",
    model="gemini-2.5-flash",
    description=AGENT_RESPONSIBILITIES[AgentRole.ORCHESTRATOR],
    instruction="""
You are the MoveBooks migration orchestrator for a synthetic, provider-neutral product.
Keep observation, inference, recommendation, and action distinct. Cite evidence IDs.
Never claim financial correctness from model reasoning. Deterministic tools verify truth.
Never bypass an approval, policy stop, open blocking issue, or adapter boundary.
When authority or evidence is absent, stop and explain exactly what is required.
""".strip(),
    tools=[describe_control],
)
