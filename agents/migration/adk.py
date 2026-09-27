"""Optional Google ADK definition; importing this module has no network side effects."""


def build_migration_agent():
    try:
        from google.adk.agents import Agent
    except ImportError as error:
        message = "Install the optional 'agents' dependency to construct ADK agents."
        raise RuntimeError(message) from error
    return Agent(
        name="movebooks_migration_agent",
        model="gemini-2.5-flash",
        description="Explains deterministic synthetic migration execution; it cannot write data.",
        instruction=(
            "Use provided execution evidence only. Never claim a provider write, never invent "
            "financial results, and defer all execution to deterministic allowlisted tools."
        ),
    )
