"""Offline adapter contract tests with a minimal SDK double; no live runtime claim."""

import asyncio
import sys
from types import SimpleNamespace

from agents.configuration.adk import ConfigurationExplanation, build_configuration_agent
from agents.model_policy import route_for
from agents.validation.adk import build_validation_agent


def test_adk_adapter_contracts_keep_validation_deterministic(monkeypatch):
    class Definition:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)

    monkeypatch.setitem(
        sys.modules, "google.adk.agents", SimpleNamespace(Agent=Definition, BaseAgent=Definition)
    )
    monkeypatch.setitem(
        sys.modules, "google.adk.events", SimpleNamespace(Event=Definition, EventActions=Definition)
    )
    callback = lambda *_: None  # noqa: E731
    config = build_configuration_agent(before_agent_callback=callback)
    assert config.model == route_for("configuration_recommendation").model
    assert config.output_schema is ConfigurationExplanation
    assert config.before_agent_callback is callback
    assert not hasattr(config, "tools")
    assert route_for("financial_reconciliation").model is None

    from test_validate_configure import completed

    _, session, fixture = completed()
    outputs = []
    validation = build_validation_agent(lambda state: (session, fixture), eval_hook=outputs.append)

    async def execute():
        return [
            event
            async for event in validation._run_async_impl(
                SimpleNamespace(session=SimpleNamespace(state={}))
            )
        ]

    events = asyncio.run(execute())
    assert events[0].actions.state_delta["validation_report"]["status"] == "VERIFIED"
    assert outputs[0]["status"] == "VERIFIED"
    # Adapter reports evidence; it cannot advance or persist the parent's workflow.
    assert session.workflow_status == "MIGRATION_COMPLETE"
