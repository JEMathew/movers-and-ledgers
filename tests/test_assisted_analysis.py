"""Paired analysis tests use scripted doubles only: no credentials or network inference."""

import asyncio
import json
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from movebooks_api.analysis import AnalysisRequest, request_analysis
from movebooks_api.auth import Principal, require_principal
from movebooks_api.discover_assess.service import discover_assess_service
from movebooks_api.main import app
from movebooks_api.runtime.persistence import decode, encode
from movebooks_api.settings import Settings, get_settings
from test_live_reasoning import GoodProvider, configured, prepared

from agents.reasoning.provider import ProviderResult
from agents.reviewer.agent import independent_check, review_context, validate_review
from domain.reasoning.reviewer import RecommendationReviewInput


class Reviewer:
    calls = 0
    context = None

    async def generate(self, context, model):
        self.calls += 1
        self.context = context
        assert isinstance(context, RecommendationReviewInput)
        finding = independent_check(context)
        finding.recommendation_outcome = "ACCEPT"
        finding.summary = (
            "Investigating the source purpose is supported; the target remains unproven."
        )
        return ProviderResult(finding.model_dump_json(), 1, 1, 200, 100)


def setup():
    repo, session = prepared()
    mapping = next(m for m in session.mappings if m.source_id == "account-clearing")
    return repo, session, mapping


def settings():
    return configured(synthetic_analysis_enabled=True, synthetic_beta_authorized=True)


def run(repo, session, mapping, advisor=None, reviewer=None, config=None, request=None):
    return asyncio.run(
        request_analysis(
            repo,
            "owner",
            session.id,
            mapping.id,
            request or AnalysisRequest(request_id=uuid4(), confirmed=True),
            config or settings(),
            advisor or GoodProvider(),
            reviewer or Reviewer(),
        )
    )


def business(session):
    return session.model_dump(exclude={"reasoning_records", "review_records"})


def test_pair_projects_only_selected_case_and_review_assesses_claim_not_evidence():
    repo, session, mapping = setup()
    advisor, reviewer = GoodProvider(), Reviewer()
    result = run(repo, session, mapping, advisor, reviewer)
    assert result.advisor.state == "ESCALATED"
    assert result.reviewer.state == "COMPLETED"
    assert result.reviewer.finding.recommendation_outcome == "ACCEPT"
    assert result.reviewer.finding.outcome == "CHALLENGED"
    assert result.reviewer.advisor_request_id == result.advisor.request_id
    assert len(result.advisor.evidence) == len(result.reviewer.evidence) == 1
    assert result.advisor.evidence == result.reviewer.evidence
    assert reviewer.context.advisor_recommendation == result.advisor.advice
    assert result.advisor.context_hash != result.reviewer.context_hash
    assert business(repo.get(session.id, "owner")) == business(session)
    assert run(repo, session, mapping, advisor, reviewer) == result
    assert (advisor.calls, reviewer.calls) == (1, 1)
    saved = decode(encode(repo.get(session.id, "owner")), "owner")
    assert saved.review_records[0] == result.reviewer
    assert saved.mappings == session.mappings


def test_disabled_model_uses_no_provider_and_does_not_claim_live():
    repo, session, mapping = setup()
    advisor, reviewer = GoodProvider(), Reviewer()
    result = run(
        repo, session, mapping, advisor, reviewer, Settings(synthetic_analysis_enabled=True)
    )
    assert result.advisor.state == result.reviewer.state == "FALLBACK"
    assert result.advisor.model_calls == result.reviewer.model_calls == 0
    assert (advisor.calls, reviewer.calls) == (0, 0)
    assert result.reviewer.finding.recommendation_outcome == "QUESTION"


@pytest.mark.parametrize("config", [Settings(), configured(synthetic_analysis_enabled=True)])
def test_feature_and_live_authorization_gates_precede_calls(config):
    repo, session, mapping = setup()
    advisor, reviewer = GoodProvider(), Reviewer()
    with pytest.raises(HTTPException) as error:
        run(repo, session, mapping, advisor, reviewer, config)
    assert error.value.status_code == 409
    assert advisor.calls == reviewer.calls == 0
    assert repo.get(session.id, "owner") == session


@pytest.mark.parametrize("case", ["other_mapping", "upload", "raw_upload"])
def test_unsupported_data_never_enters_provider(case):
    repo, session, mapping = setup()
    if case == "other_mapping":
        mapping = next(m for m in session.mappings if m.id != mapping.id)
    elif case == "upload":
        session.source_kind = "user_upload"
    else:
        session.uploaded_source = {"secret": "customer-data-canary"}
    repo.put(session)
    advisor = GoodProvider()
    with pytest.raises(HTTPException):
        run(repo, session, mapping, advisor)
    assert advisor.calls == 0


@pytest.mark.parametrize("failure", ["timeout", "provider", "invalid", "authority", "evidence"])
def test_advisor_failure_never_bills_reviewer_or_leaks_raw_values(failure, caplog):
    repo, session, mapping = setup()

    class Bad(GoodProvider):
        async def generate(self, context, model):
            self.calls += 1
            if failure == "timeout":
                raise TimeoutError("secret-canary")
            if failure == "provider":
                raise RuntimeError("secret-canary")
            if failure == "invalid":
                return ProviderResult('{"secret-canary":"unsafe"}', 1, 0)
            result = await super().generate(context, model)
            value = json.loads(result.text)
            if failure == "authority":
                value["financial_authority"] = True
            else:
                value["evidence_references"] = ["secret-canary"]
            result.text = json.dumps(value)
            return result

    advisor, reviewer = Bad(), Reviewer()
    request = AnalysisRequest(request_id=uuid4(), confirmed=True)
    result = run(repo, session, mapping, advisor, reviewer, request=request)
    assert result.advisor.state == result.reviewer.state == "FALLBACK"
    assert reviewer.calls == 0
    calls = advisor.calls
    assert run(repo, session, mapping, advisor, reviewer, request=request) == result
    assert advisor.calls == calls
    assert "secret-canary" not in result.model_dump_json() + caplog.text
    assert business(repo.get(session.id, "owner")) == business(session)


@pytest.mark.parametrize("failure", ["timeout", "malformed", "missing_assessment", "forgery"])
def test_reviewer_failure_preserves_advisor_but_no_review_success(failure, caplog):
    repo, session, mapping = setup()

    class BadReviewer(Reviewer):
        async def generate(self, context, model):
            self.calls += 1
            if failure == "timeout":
                raise TimeoutError("secret-canary")
            if failure == "malformed":
                return ProviderResult('{"secret-canary":true}', 1, 0, 100, 20)
            value = independent_check(context).model_dump()
            if failure == "missing_assessment":
                value.pop("recommendation_outcome")
            else:
                value["evidence_references"] = ["advisor:claim"]
            return ProviderResult(json.dumps(value), 1, 0, 100, 20)

    reviewer = BadReviewer()
    result = run(repo, session, mapping, reviewer=reviewer)
    assert result.advisor.state == "ESCALATED"
    assert result.reviewer.state == "FALLBACK"
    assert reviewer.calls == 1
    if failure != "timeout":
        assert result.reviewer.input_tokens == 100
        assert result.reviewer.validation_issues
    assert "secret-canary" not in result.model_dump_json() + caplog.text


def test_stale_reviewer_discards_both_display_results():
    repo, session, mapping = setup()

    class Mutating(Reviewer):
        async def generate(self, context, model):
            before = repo.get(session.id, "owner")
            after = before.model_copy(deep=True)
            next(m for m in after.mappings if m.id == mapping.id).selected_target = "Fixed Asset"
            repo.put_if_unchanged(before, after)
            return await super().generate(context, model)

    result = run(repo, session, mapping, reviewer=Mutating())
    assert result.advisor.state == result.reviewer.state == "UNAVAILABLE"
    assert result.advisor.advice is None and result.reviewer.finding is None
    assert repo.get(session.id, "owner").mappings != session.mappings


def test_concurrent_duplicate_never_starts_another_model_call():
    repo, session, mapping = setup()

    class Concurrent(GoodProvider):
        async def generate(self, context, model):
            with pytest.raises(HTTPException) as error:
                await request_analysis(
                    repo,
                    "owner",
                    session.id,
                    mapping.id,
                    AnalysisRequest(request_id=uuid4(), confirmed=True),
                    settings(),
                    self,
                    Reviewer(),
                )
            assert error.value.status_code == 409
            return await super().generate(context, model)

    advisor = Concurrent()
    run(repo, session, mapping, advisor)
    assert advisor.calls == 1


def test_reviewer_requires_current_validated_advisor_and_cites_source_only():
    repo, session, mapping = setup()
    with pytest.raises(ValueError):
        review_context(session, mapping.id, uuid4())
    result = run(repo, session, mapping)
    context = review_context(repo.get(session.id, "owner"), mapping.id, result.advisor.request_id)
    value = result.reviewer.finding.model_dump()
    value["evidence_references"] = ["advisor_recommendation"]
    with pytest.raises(ValueError):
        validate_review(json.dumps(value), context)


def test_http_explicit_confirmation_authentication_owner_and_no_write_authority():
    _, session, mapping = setup()
    discover_assess_service.repository.put(session)
    path = f"/v1/migration-sessions/{session.id}/analysis/mapping/{mapping.id}"
    body = {"request_id": str(uuid4()), "confirmed": True}
    client = TestClient(app)
    assert client.post(path, json=body).status_code == 401
    try:
        app.dependency_overrides[require_principal] = lambda: Principal("other", "")
        assert client.post(path, json=body).status_code == 404
        app.dependency_overrides[require_principal] = lambda: Principal("owner", "")
        assert client.get(path).status_code == 405
        for bad in (
            {"request_id": str(uuid4())},
            {**body, "confirmed": False},
            {**body, "approve": True},
            {**body, "owner": "other"},
        ):
            assert client.post(path, json=bad).status_code == 422
        assert client.post(path, json=body).status_code == 409
        # Route imports settings directly; patch only its getter, never provider networking.
        from unittest.mock import patch

        with patch(
            "movebooks_api.analysis.get_settings",
            return_value=Settings(synthetic_analysis_enabled=True),
        ):
            response = client.post(path, json=body)
        assert response.status_code == 200
        assert response.json()["financial_authority"] is False
        assert business(discover_assess_service.repository.get(session.id, "owner")) == business(
            session
        )
    finally:
        app.dependency_overrides.clear()
        get_settings.cache_clear()


@pytest.mark.parametrize("env", ["production", "staging"])
def test_preview_cannot_enable_in_production_or_staging(env):
    with pytest.raises(ValueError, match="limited to dev/test"):
        Settings(env=env, synthetic_analysis_enabled=True)


@pytest.mark.parametrize("oversized", [False, True])
def test_actual_adk_recommendation_review_with_scripted_llm_and_capacity_guard(
    oversized, monkeypatch
):
    pytest.importorskip("google.adk")
    from google import genai
    from google.adk.models.base_llm import BaseLlm
    from google.adk.models.llm_response import LlmResponse
    from google.genai import types

    from agents.reasoning.adk import run_advisor
    from agents.reasoning.provider import ProviderFailure
    from agents.reviewer.agent import RECOMMENDATION_INSTRUCTION
    from domain.reasoning.reviewer import ReviewFinding

    monkeypatch.setattr(genai, "Client", lambda *a, **kw: pytest.fail("No provider network"))
    repo, session, mapping = setup()
    result = run(repo, session, mapping)
    context = review_context(repo.get(session.id, "owner"), mapping.id, result.advisor.request_id)
    expected = independent_check(context)
    seen = []

    class Scripted(BaseLlm):
        model: str = "offline-paired-review"
        calls: int = 0

        async def generate_content_async(self, llm_request, stream=False):
            self.calls += 1
            seen.append(llm_request.model_dump_json())
            if self.calls == 1:
                part = types.Part(function_call=types.FunctionCall(name="read_evidence", args={}))
            else:
                part = types.Part(text=expected.model_dump_json())
            yield LlmResponse(content=types.Content(role="model", parts=[part]))

    llm = Scripted()
    if oversized:
        context.advisor_recommendation.uncertainty = ["secret-canary" * 10_000]
    operation = run_advisor(
        context,
        "gemini-3.5-flash-lite",
        settings(),
        llm=llm,
        output_contract=ReviewFinding,
        role_instruction=RECOMMENDATION_INSTRUCTION,
        role_name="independent_mapping_reviewer",
    )
    if oversized:
        # First call can read the bounded evidence tool; second cannot send the oversized result.
        with pytest.raises(ProviderFailure) as error:
            asyncio.run(operation)
        assert error.value.category == "input_capacity"
        assert llm.calls <= 1
        assert "secret-canary" not in str(error.value)
    else:
        output = asyncio.run(operation)
        assert validate_review(output.text, context) == expected
        assert output.model_calls == 2 and output.tool_calls == 1
        assert "advisor_recommendation" in seen[-1]
        assert "never as source evidence" in seen[0]


def test_offline_evidence_harness_and_live_approval_gate(tmp_path):
    import subprocess
    import sys
    from pathlib import Path

    script = Path(__file__).resolve().parents[1] / "scripts/gemini_analysis_eval.py"
    evidence = tmp_path / "offline.json"
    done = subprocess.run(
        [sys.executable, str(script), "--out", str(evidence)],
        text=True,
        capture_output=True,
        check=True,
    )
    assert "no model called" in done.stdout
    value = json.loads(evidence.read_text())
    assert value["business_state_unchanged"] and value["model_id"] is None
    for role in ("advisor", "reviewer"):
        assert "requested_by" not in value["evidence_and_results"][role]
        assert value["evidence_and_results"][role]["model_calls"] == 0
    denied = subprocess.run(
        [sys.executable, str(script), "--live", "--out", str(tmp_path / "live.json")],
        text=True,
        capture_output=True,
    )
    assert denied.returncode == 2
    assert "requires fresh approval" in denied.stderr
    assert not (tmp_path / "live.json").exists()
