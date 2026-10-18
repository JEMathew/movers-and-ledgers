"""Replacement endpoint/configuration checks; no ADC, network or model requests."""

import pytest
from movebooks_api.settings import Settings

from domain.reasoning.models import Capability

REPLACEMENT = "gemini-3.5-flash-lite"


def replacement_settings(**changes):
    return Settings(
        **{
            "_env_file": None,
            "model_provider_mode": "gemini-adk",
            "reasoning_project": "synthetic-test",
            "reasoning_location": "global",
            "reasoning_models": {c.value: REPLACEMENT for c in Capability},
            **changes,
        }
    )


def test_defaults_remain_singapore_deterministic_and_disabled():
    settings = Settings(_env_file=None)
    assert settings.reasoning_location == "asia-southeast1"
    assert settings.model_provider_mode == "deterministic-only"
    assert settings.reasoning_models == {}
    assert settings.model_controls_backend == "disabled"
    assert settings.synthetic_beta_authorized is False


def test_replacement_requires_explicit_global_and_all_capability_routes():
    from agents.model_policy import live_route

    settings = replacement_settings()
    assert {live_route(c, settings).model for c in Capability} == {REPLACEMENT}
    with pytest.raises(ValueError, match="requires explicit global"):
        replacement_settings(reasoning_location="asia-southeast1")
    with pytest.raises(ValueError, match="all five"):
        replacement_settings(reasoning_models={"mapping": REPLACEMENT})


@pytest.mark.parametrize("location", ["us-central1", "https://example.invalid", "GLOBAL"])
def test_unapproved_locations_rejected(location):
    with pytest.raises(ValueError):
        replacement_settings(reasoning_location=location)


@pytest.mark.parametrize("env", ["staging", "production"])
def test_global_does_not_allow_live_staging_or_production(env):
    with pytest.raises(ValueError, match="synthetic dev/test"):
        replacement_settings(env=env)


@pytest.mark.parametrize(
    "location,model,endpoint",
    [
        ("global", REPLACEMENT, "https://aiplatform.googleapis.com"),
        ("asia-southeast1", "gemini-2.5-flash", "https://asia-southeast1-aiplatform.googleapis.com"),
    ],
)
def test_explicit_vertex_client_endpoint_timeout_and_no_retries(
    monkeypatch, location, model, endpoint
):
    from google import genai

    from agents.reasoning.adk import vertex_client

    captured = {}
    sentinel = object()

    def client(**kwargs):
        captured.update(kwargs)
        return sentinel

    # Intercept construction before the real SDK could discover credentials.
    monkeypatch.setattr(genai, "Client", client)
    settings = replacement_settings(
        reasoning_location=location,
        reasoning_models={c.value: model for c in Capability},
    )
    assert vertex_client(settings) is sentinel
    assert captured["vertexai"] is True
    assert captured["project"] == "synthetic-test"
    assert captured["location"] == location
    assert captured["http_options"].base_url == endpoint
    assert captured["http_options"].timeout == 30000
    assert captured["http_options"].retry_options.attempts == 1
    assert "api_key" not in captured


def test_replacement_generation_serialization_has_levels_and_no_legacy_budget():
    from agents.reasoning.adk import generation_config

    config = generation_config(REPLACEMENT)
    wire = config.model_dump(mode="json", by_alias=True, exclude_none=True)
    assert wire == {
        "maxOutputTokens": 2048,
        "thinkingConfig": {"includeThoughts": False, "thinkingLevel": "LOW"},
    }


def test_legacy_generation_settings_are_preserved():
    from agents.reasoning.adk import generation_config

    config = generation_config("gemini-2.5-flash")
    assert config.temperature == 0 and config.max_output_tokens == 2048
    assert config.thinking_config.thinking_budget == 128
    assert config.thinking_config.thinking_level is None
    assert config.thinking_config.include_thoughts is False
