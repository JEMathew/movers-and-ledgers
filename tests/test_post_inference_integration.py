"""Recorded live evidence and scripted ADK responses only; no ADC or live client."""

import asyncio
import hashlib
import json
from copy import deepcopy
from pathlib import Path

import pytest
from fastapi import HTTPException
from test_assisted_analysis import business, run, settings, setup

from agents.reasoning.provider import ProviderResult

EVIDENCE = (
    Path(__file__).resolve().parents[1]
    / "tests/fixtures/gemini-recorded-pair.json"
)
SHA256 = "6f01c83a9085358ecfe29a1bc34156b59291d8a21e9bab9628356dc7cec75b33"


@pytest.fixture(autouse=True)
def prohibit_provider_client(monkeypatch):
    import google.auth
    from google import genai

    def forbidden(*args, **kwargs):
        pytest.fail("No credentials or generation client permitted in recorded integration tests")

    monkeypatch.setattr(google.auth, "default", forbidden)
    monkeypatch.setattr(genai, "Client", forbidden)


def recorded():
    raw = EVIDENCE.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == SHA256
    return json.loads(raw)


def test_recorded_fixture_reconciles_counts_without_inventing_thinking():
    bundle = recorded()
    assert bundle["source_evidence_sha256"] == (
        "b87d0537e5b74203236b66b63379f263a062d4f756cc2b5b5679f69363f313f7"
    )
    result = bundle["evaluation"]
    traces = result["sanitized_transport_traces"]
    assert len(traces) == 4
    assert sum(t["input_tokens"] for t in traces) == 5207
    assert sum(t["output_tokens"] for t in traces) == 557
    assert sum(t["counted_input_tokens"] for t in traces) == 4382
    assert all(t["thinking_tokens"] is None for t in traces)
    assert result["transport_estimated_cost_usd"] is None
    for role in ("advisor", "reviewer"):
        saved = result["evidence_and_results"][role]
        assert saved["input_tokens"] == sum(t["input_tokens"] for t in traces if t["role"] == role)
        assert saved["output_tokens"] == sum(
            t["output_tokens"] for t in traces if t["role"] == role
        )
        # Keep the historical defect visible; do not rewrite the original record.
        assert saved["usage_status"] == "complete"


@pytest.mark.parametrize("thinking", [None, 0, 7, "missing-last"])
@pytest.mark.parametrize("role", ["advisor", "reviewer"])
def test_recorded_usage_through_actual_adk_is_partial_unless_thinking_explicit(
    thinking, role
):
    from google.adk.models.base_llm import BaseLlm
    from google.adk.models.llm_response import LlmResponse
    from google.genai import types

    from agents.reasoning.adk import run_advisor
    from agents.reviewer.agent import RECOMMENDATION_INSTRUCTION, review_context
    from domain.reasoning.models import Advice
    from domain.reasoning.reviewer import ReviewFinding

    _, session, mapping = setup()
    context = review_context(session, mapping.id)
    result = recorded()["evaluation"]
    saved = result["evidence_and_results"][role]
    output = deepcopy(saved["advice" if role == "advisor" else "finding"])
    output["evidence_references"] = [context.facts[0].reference]
    traces = [t for t in result["sanitized_transport_traces"] if t["role"] == role]

    class Scripted(BaseLlm):
        model: str = "offline-recorded"
        calls: int = 0

        async def generate_content_async(self, llm_request, stream=False):
            trace = traces[self.calls]
            self.calls += 1
            part = (
                types.Part(function_call=types.FunctionCall(name="read_evidence", args={}))
                if self.calls == 1 else types.Part(text=json.dumps(output))
            )
            yield LlmResponse(
                content=types.Content(role="model", parts=[part]),
                usage_metadata=types.GenerateContentResponseUsageMetadata(
                    prompt_token_count=trace["input_tokens"],
                    candidates_token_count=trace["output_tokens"],
                    thoughts_token_count=(
                        (7 if self.calls == 1 else None)
                        if thinking == "missing-last" else thinking
                    ),
                ),
            )

    usage = asyncio.run(run_advisor(
        context, "gemini-3.5-flash-lite", settings(), llm=Scripted(),
        output_contract=Advice if role == "advisor" else ReviewFinding,
        role_instruction=None if role == "advisor" else RECOMMENDATION_INSTRUCTION,
        role_name=None if role == "advisor" else "independent_mapping_reviewer",
    ))
    assert usage.model_calls == 2 and usage.tool_calls == 1
    assert usage.input_tokens == saved["input_tokens"]
    reported_thinking = 7 if thinking == "missing-last" else 2 * (thinking or 0)
    assert usage.output_tokens == saved["output_tokens"] + reported_thinking
    assert usage.usage_status == (
        "partial" if thinking in (None, "missing-last") else "complete"
    )


def test_recorded_pair_remains_owner_scoped_non_authoritative_and_traceable():
    repo, session, mapping = setup()
    saved = recorded()["evaluation"]["evidence_and_results"]

    class RecordedProvider:
        def __init__(self, role):
            self.role = role
            self.calls = 0
            self.context = None

        async def generate(self, context, model):
            self.calls += 1
            self.context = context
            record = saved[self.role]
            value = deepcopy(record["advice" if self.role == "advisor" else "finding"])
            value["evidence_references"] = [context.facts[0].reference]
            return ProviderResult(
                json.dumps(value), 2, 1, record["input_tokens"], record["output_tokens"],
                usage_status="partial",
            )

    advisor, reviewer = RecordedProvider("advisor"), RecordedProvider("reviewer")
    response = run(repo, session, mapping, advisor, reviewer)
    assert response.advisor.state == "ESCALATED"
    assert response.reviewer.finding.recommendation_outcome == "ACCEPT"
    assert response.reviewer.finding.outcome == "CHALLENGED"
    assert response.advisor.usage_status == response.reviewer.usage_status == "partial"
    assert response.advisor.estimated_cost_usd is None
    assert response.human_approval_required and not response.financial_authority
    assert response.reviewer.advisor_request_id == response.advisor.request_id
    assert response.reviewer.mapping_id == mapping.id
    assert reviewer.context.advisor_recommendation == response.advisor.advice
    assert advisor.context.facts == reviewer.context.facts
    assert repo.get(session.id, "another-owner") is None
    assert business(repo.get(session.id, "owner")) == business(session)


def test_empty_source_evidence_fails_before_either_provider(monkeypatch):
    from movebooks_api import analysis

    from domain.reasoning.models import Capability, ReasoningInput

    repo, session, mapping = setup()

    def empty_projection(*args):
        return ReasoningInput(
            capability=Capability.MAPPING, workflow_state=session.workflow_status,
            facts=[], deterministic_results=[], requires_escalation=True,
        )

    monkeypatch.setattr(analysis, "review_context", empty_projection)
    with pytest.raises(HTTPException) as caught:
        run(repo, session, mapping)
    assert caught.value.status_code == 409
    assert business(repo.get(session.id, "owner")) == business(session)
    assert not repo.get(session.id, "owner").reasoning_records


def test_generated_contract_snapshot_matches_application_models():
    from movebooks_api.analysis import AnalysisRequest, AnalysisResult

    schema = json.loads((
        Path(__file__).resolve().parents[1]
        / "docs/gemini-advisor-v2/analysis-api-schema.json"
    ).read_text())
    assert schema["method"] == "POST"
    assert schema["path"] == (
        "/v1/migration-sessions/{session_id}/analysis/mapping/{mapping_id}"
    )
    assert schema["request_schema"] == AnalysisRequest.model_json_schema()
    assert schema["response_schema"] == AnalysisResult.model_json_schema()


def test_integration_configuration_cannot_reach_either_generation_provider(monkeypatch):
    from movebooks_api.settings import Settings

    from agents.reasoning import adk

    def forbidden(*args, **kwargs):
        pytest.fail("Deterministic integration must not enter the Gemini adapter")

    monkeypatch.setattr(adk, "run_advisor", forbidden)
    monkeypatch.setattr(adk, "vertex_client", forbidden)

    class ForbiddenProvider:
        async def generate(self, *args, **kwargs):
            forbidden()

    config = Settings(
        _env_file=None, env="local", model_provider_mode="deterministic-only",
        synthetic_analysis_enabled=True, synthetic_beta_authorized=False,
    )
    repo, session, mapping = setup()
    result = run(
        repo, session, mapping, ForbiddenProvider(), ForbiddenProvider(), config,
    )
    assert result.advisor.state == result.reviewer.state == "FALLBACK"
    assert result.advisor.model_calls == result.reviewer.model_calls == 0
    assert result.human_approval_required and not result.financial_authority
    assert business(repo.get(session.id, "owner")) == business(session)
