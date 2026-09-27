"""Optional explanation adapter. It owns no workflow or financial-write authority."""

from pydantic import BaseModel

from agents.model_policy import route_for


class ConfigurationExplanation(BaseModel):
    proposal_id: str
    explanation: str
    evidence_references: list[str]
    limitations: list[str]


def build_configuration_agent(*, before_agent_callback=None, after_agent_callback=None):
    try:
        from google.adk.agents import Agent
    except ImportError as error:
        raise RuntimeError(
            "Install the optional agents dependency to construct ADK agents."
        ) from error
    return Agent(
        name="movebooks_configuration_explainer",
        model=route_for("configuration_recommendation").model,
        description="Advisory explanations of checksum-bound configuration proposals.",
        instruction=(
            "Use only supplied proposal evidence from session state. Cite evidence identifiers. "
            "Missing evidence means abstain. Never approve, apply, verify finances, or advance "
            "the workflow. Parent ValidateConfigureOrchestrator owns all handoffs and tools."
        ),
        output_schema=ConfigurationExplanation,
        output_key="configuration_explanation",
        before_agent_callback=before_agent_callback,
        after_agent_callback=after_agent_callback,
    )
