"""Adapter contract tests, not a claim that the optional managed runtime is installed."""

import asyncio
import sys
from types import SimpleNamespace

from test_onboard_fpu import prepare, setup

from agents.activation.adk import build_activation_agent
from agents.onboarding.adk import SetupGuidance, build_onboarding_agent


def test_advisory_and_deterministic_adk_definitions(monkeypatch):
    class Definition:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)

    monkeypatch.setitem(
        sys.modules, "google.adk.agents", SimpleNamespace(Agent=Definition, BaseAgent=Definition)
    )
    monkeypatch.setitem(
        sys.modules, "google.adk.events", SimpleNamespace(Event=Definition, EventActions=Definition)
    )
    callback = lambda context: None  # noqa: E731
    explainer = build_onboarding_agent(before_agent_callback=callback)
    assert explainer.output_schema is SetupGuidance
    assert explainer.before_agent_callback is callback
    assert "Do not approve" in explainer.instruction
    flow, session, fixture = setup()
    prepare(flow, session, fixture)
    flow.execute(session, fixture, "adk", "owner")
    outputs = []
    adapter = build_activation_agent(
        resolve_context=lambda state: (session, fixture), eval_hook=outputs.append
    )

    async def run():
        return [
            event
            async for event in adapter._run_async_impl(
                SimpleNamespace(session=SimpleNamespace(state={}))
            )
        ]

    events = asyncio.run(run())
    assert outputs == [{"verified": True, "policy": "fpu-invoice-v1", "synthetic": True}]
    assert events[0].actions.state_delta["fpu_verification"] == outputs[0]
