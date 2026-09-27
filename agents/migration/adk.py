"""Optional Google ADK definition; importing this module has no network side effects."""

from pydantic import BaseModel

from agents.model_policy import route_for


class MigrationExplanation(BaseModel):
    execution_id: str
    explanation: str
    evidence_references: list[str]
    limitations: list[str]


def build_migration_agent(*, before_agent_callback=None, after_agent_callback=None):
    try:
        from google.adk.agents import Agent
    except ImportError as error:
        message = "Install the optional 'agents' dependency to construct ADK agents."
        raise RuntimeError(message) from error
    return Agent(
        name="movebooks_migration_agent",
        model=route_for("customer_explanation").model,
        description="Explains deterministic synthetic migration execution; it cannot write data.",
        instruction=(
            "Use provided execution evidence only. Never claim a provider write, never invent "
            "financial results, and defer all execution to deterministic allowlisted tools. "
            "The host supplies authorized session state; the parent orchestrator alone owns "
            "writes, checkpoints, approvals and handoffs. Abstain without cited evidence."
        ),
        output_schema=MigrationExplanation,
        output_key="migration_explanation",
        before_agent_callback=before_agent_callback,
        after_agent_callback=after_agent_callback,
    )
