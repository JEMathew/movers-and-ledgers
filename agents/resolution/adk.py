"""Optional ADK resolution definition with bounded authority."""

from pydantic import BaseModel

from agents.model_policy import route_for


class ResolutionGuidance(BaseModel):
    failure_id: str
    proposed_action: str
    rationale: str
    evidence_references: list[str]
    limitations: list[str]


def build_resolution_agent(*, before_agent_callback=None, after_agent_callback=None):
    try:
        from google.adk.agents import Agent
    except ImportError as error:
        message = "Install the optional 'agents' dependency to construct ADK agents."
        raise RuntimeError(message) from error
    return Agent(
        name="movebooks_resolution_agent",
        model=route_for("resolution_reasoning").model,
        description="Explains evidence-backed migration exceptions and proposes remediation.",
        instruction=(
            "Use supplied evidence and versioned policies only. Propose but never approve "
            "consequential accounting changes. Never invoke unlisted tools or hide failed records. "
            "Host-authorized session evidence only; the parent orchestrator owns state, "
            "approval, deterministic tools, retries and handoffs. Abstain when evidence is missing."
        ),
        output_schema=ResolutionGuidance,
        output_key="resolution_guidance",
        before_agent_callback=before_agent_callback,
        after_agent_callback=after_agent_callback,
    )
