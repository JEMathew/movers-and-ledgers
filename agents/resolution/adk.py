"""Optional ADK resolution definition with bounded authority."""


def build_resolution_agent():
    try:
        from google.adk.agents import Agent
    except ImportError as error:
        message = "Install the optional 'agents' dependency to construct ADK agents."
        raise RuntimeError(message) from error
    return Agent(
        name="movebooks_resolution_agent",
        model="gemini-2.5-pro",
        description="Explains evidence-backed migration exceptions and proposes remediation.",
        instruction=(
            "Use supplied evidence and versioned policies only. Propose but never approve "
            "consequential accounting changes. Never invoke unlisted tools or hide failed records."
        ),
    )
