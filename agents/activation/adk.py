"""Deterministic ADK-compatible verification, using parent-authorized session context."""


def build_activation_agent(*, resolve_context, eval_hook=None):
    try:
        from google.adk.agents import BaseAgent
        from google.adk.events import Event, EventActions
    except ImportError as error:
        raise RuntimeError(
            "Install the optional agents dependency for ADK construction."
        ) from error

    from agents.orchestrator.onboard_fpu import OnboardFpuOrchestrator

    class ActivationVerificationAgent(BaseAgent):
        async def _run_async_impl(self, ctx):
            # The parent injects owner-authorized snapshots; model text cannot select a session.
            session, fixture = resolve_context(ctx.session.state)
            result = OnboardFpuOrchestrator().verified(session, fixture)
            output = {
                "verified": result,
                "policy": "fpu-invoice-v1",
                "synthetic": True,
            }
            if eval_hook:
                eval_hook(output)
            yield Event(
                author=self.name, actions=EventActions(state_delta={"fpu_verification": output})
            )

    return ActivationVerificationAgent(
        name="movebooks_fpu_verifier",
        description="Read-only deterministic evidence verification; no posting authority.",
    )
