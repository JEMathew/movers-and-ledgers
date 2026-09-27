"""Optional deterministic ADK adapter; financial checks never invoke a language model."""

from agents.validation import ValidationAgent


def build_validation_agent(load_context, *, eval_hook=None):
    """Host supplies authorized (session, fixture); parent alone persists/hands off.

    load_context receives ADK session state. No browser-supplied owner or fixture is trusted.
    eval_hook receives the structured report for offline evaluation, not mutation authority.
    """
    try:
        from google.adk.agents import BaseAgent
        from google.adk.events import Event, EventActions
    except ImportError as error:
        raise RuntimeError(
            "Install the optional agents dependency to construct ADK agents."
        ) from error

    class DeterministicValidationAgent(BaseAgent):
        async def _run_async_impl(self, ctx):
            session, fixture = load_context(ctx.session.state)
            report = ValidationAgent().run(session, fixture)
            output = report.model_dump(mode="json")
            if eval_hook:
                eval_hook(output)
            yield Event(
                author=self.name,
                actions=EventActions(state_delta={"validation_report": output}),
            )

    return DeterministicValidationAgent(name="movebooks_validation_agent")
