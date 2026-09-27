"""Optional advisory adapters; the parent orchestrator exclusively owns writes."""

from pydantic import BaseModel

from agents.model_policy import route_for


class SetupGuidance(BaseModel):
    task_id: str
    explanation: str
    evidence_references: list[str]
    limitations: list[str]


def build_onboarding_agent(*, before_agent_callback=None, after_agent_callback=None):
    try:
        from google.adk.agents import Agent
    except ImportError as error:
        raise RuntimeError(
            "Install the optional agents dependency for ADK construction."
        ) from error
    return Agent(
        name="movebooks_onboarding_explainer",
        model=route_for("onboarding_guidance").model,
        description="Grounded advisory setup explanations, never financial truth.",
        instruction=(
            "Use only checklist and configuration evidence supplied in session state. "
            "Cite evidence; abstain when absent. Do not approve, post, or advance state. "
            "OnboardFpuOrchestrator owns tools, decisions and the activation handoff."
        ),
        output_schema=SetupGuidance,
        output_key="onboarding_guidance",
        before_agent_callback=before_agent_callback,
        after_agent_callback=after_agent_callback,
    )
