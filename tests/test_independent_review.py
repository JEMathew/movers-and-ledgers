"""Independent review quality/authority tests; all providers here are offline doubles."""

import asyncio
import json
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from movebooks_api.auth import Principal, require_principal
from movebooks_api.discover_assess.service import discover_assess_service
from movebooks_api.main import app
from movebooks_api.reviewer import request_review
from movebooks_api.runtime.persistence import decode, encode
from movebooks_api.settings import Settings
from test_live_reasoning import configured, prepared

from agents.reasoning.provider import ProviderResult
from agents.reviewer.agent import independent_check, review_context, validate_review
from domain.reasoning.models import ReasoningRequest


def setup():
    repo, session = prepared()
    mapping = next(m for m in session.mappings if m.source_id == "account-clearing")
    return repo, session, mapping


def business(session):
    return session.model_dump(exclude={"review_records"})


class OfflineReviewer:
    calls = 0

    async def generate(self, context, model):
        self.calls += 1
        return ProviderResult(independent_check(context).model_dump_json(), 1, 1)


def run(repo, session, mapping, provider=None, request=None, settings=None):
    return asyncio.run(
        request_review(
            repo,
            "owner",
            session.id,
            mapping.id,
            request or ReasoningRequest(request_id=uuid4()),
            settings or configured(),
            provider or OfflineReviewer(),
        )
    )


def test_clearing_is_challenged_independently_and_never_changes_business_state():
    repo, session, mapping = setup()
    before = business(session)
    provider = OfflineReviewer()
    result = run(repo, session, mapping, provider)
    assert result.state == "COMPLETED" and result.finding.outcome == "CHALLENGED"
    assert "business purpose" in result.finding.summary
    assert result.finding.suggested_next_action == "INSPECT_SOURCE_PURPOSE"
    assert result.finding.financial_authority is False
    assert business(repo.get(session.id, "owner")) == before
    assert run(repo, session, mapping, provider) == result and provider.calls == 1
    assert decode(encode(repo.get(session.id, "owner")), "owner").review_records[0] == result


def test_projection_uses_no_advisor_output_financial_values_or_actors():
    _, session, mapping = setup()
    context = review_context(session, mapping.id)
    text = context.model_dump_json()
    assert "opening_balance" not in text and "owner_subject" not in text
    assert "reasoning_records" not in text and "decision_comment" not in text
    assert len(context.facts) == 1


@pytest.mark.parametrize(
    "bad", ["forged", "authority", "approval", "unsupported_clear", "invoice", "extra"]
)
def test_review_contract_rejects_forgery_and_false_clearance(bad):
    _, session, mapping = setup()
    context = review_context(session, mapping.id)
    output = independent_check(context).model_dump()
    if bad == "forged":
        output["evidence_references"] = ["invented"]
    if bad == "authority":
        output["financial_authority"] = True
    if bad == "approval":
        output["human_approval_required"] = False
    if bad == "unsupported_clear":
        output["outcome"] = "NO_CONTRADICTION_FOUND"
    if bad == "invoice":
        output["summary"] = "Post the invoice now."
    if bad == "extra":
        output["approve_mapping"] = True
    with pytest.raises(ValueError):
        validate_review(json.dumps(output), context)


def test_invalid_model_and_timeout_fall_back_without_claiming_model_success():
    repo, session, mapping = setup()

    class Invalid:
        async def generate(self, context, model):
            return ProviderResult('{"secret-canary":"not-a-review"}', 1, 0)

    result = run(repo, session, mapping, Invalid())
    assert result.state == "FALLBACK" and result.finding.outcome == "CHALLENGED"
    assert "secret-canary" not in result.model_dump_json()


def test_stale_model_output_is_discarded_without_reverting_mapping():
    repo, session, mapping = setup()

    class Mutating(OfflineReviewer):
        async def generate(self, context, model):
            before = repo.get(session.id, "owner")
            after = before.model_copy(deep=True)
            next(m for m in after.mappings if m.id == mapping.id).selected_target = "Fixed Asset"
            repo.put_if_unchanged(before, after)
            return await super().generate(context, model)

    result = run(repo, session, mapping, Mutating())
    assert result.state == "UNAVAILABLE" and result.finding is None
    assert (
        next(
            m for m in repo.get(session.id, "owner").mappings if m.id == mapping.id
        ).selected_target
        == "Fixed Asset"
    )


def test_http_owner_isolation_spoof_rejection_and_visible_fallback():
    _, session, mapping = setup()
    discover_assess_service.repository.put(session)
    client = TestClient(app)
    path = f"/v1/migration-sessions/{session.id}/reviewer/mapping/{mapping.id}"
    body = {"request_id": str(uuid4())}
    assert client.post(path, json=body).status_code == 401
    try:
        app.dependency_overrides[require_principal] = lambda: Principal("other", "")
        assert client.post(path, json=body).status_code == 404
        app.dependency_overrides[require_principal] = lambda: Principal("owner", "")
        assert client.post(path, json={**body, "actor": "other"}).status_code == 422
        result = client.post(path, json=body)
        assert result.status_code == 200 and result.json()["state"] == "FALLBACK"
        assert result.json()["finding"]["outcome"] == "CHALLENGED"
    finally:
        app.dependency_overrides.clear()


def test_upload_and_executed_context_rejected_and_old_snapshot_round_trips():
    _, session, mapping = setup()
    assert "review_records" not in encode(session)
    assert encode(decode(encode(session), "owner")) == encode(session)
    session.source_kind = "user_upload"
    with pytest.raises(ValueError):
        review_context(session, mapping.id)
    session.source_kind = "synthetic_sample"
    session.uploaded_source = {"unsafe": "data"}
    with pytest.raises(ValueError):
        review_context(session, mapping.id)


def test_pending_review_never_replayed():
    repo, session, mapping = setup()

    class Concurrent(OfflineReviewer):
        async def generate(self, context, model):
            with pytest.raises(HTTPException) as error:
                await request_review(
                    repo,
                    "owner",
                    session.id,
                    mapping.id,
                    ReasoningRequest(request_id=uuid4()),
                    configured(),
                    self,
                )
            assert error.value.status_code == 409
            return await super().generate(context, model)

    run(repo, session, mapping, Concurrent())


def test_deterministic_review_not_live_model_evidence():
    repo, session, mapping = setup()
    provider = OfflineReviewer()
    result = run(repo, session, mapping, provider, settings=Settings())
    assert result.state == "FALLBACK" and result.model_calls == 0 and provider.calls == 0


def test_real_adk_reviewer_uses_separate_output_contract_offline():
    pytest.importorskip("google.adk")
    from google.adk.models.base_llm import BaseLlm
    from google.adk.models.llm_response import LlmResponse
    from google.genai import types

    from agents.reasoning.adk import run_advisor
    from agents.reviewer.agent import INSTRUCTION
    from domain.reasoning.reviewer import ReviewFinding

    _, session, mapping = setup()
    context = review_context(session, mapping.id)
    expected = independent_check(context)

    class ScriptedReviewer(BaseLlm):
        model: str = "offline-reviewer"
        calls: int = 0

        async def generate_content_async(self, llm_request, stream=False):
            self.calls += 1
            if self.calls == 1:
                part = types.Part(function_call=types.FunctionCall(name="read_evidence", args={}))
            else:
                part = types.Part(text=expected.model_dump_json())
            yield LlmResponse(content=types.Content(role="model", parts=[part]))

    output = asyncio.run(
        run_advisor(
            context,
            "offline-reviewer",
            configured(),
            llm=ScriptedReviewer(),
            output_contract=ReviewFinding,
            role_instruction=INSTRUCTION,
            role_name="independent_mapping_reviewer",
        )
    )
    assert validate_review(output.text, context) == expected
    assert output.model_calls == 2 and output.tool_calls == 1


def test_rejected_review_preserves_known_usage_and_sanitized_provider_failure():
    from agents.reasoning.provider import ProviderFailure
    from agents.reviewer.agent import review

    _, session, mapping = setup()
    context = review_context(session, mapping.id)

    class Invalid:
        async def generate(self, context, model):
            return ProviderResult('{"secret-canary":"not-a-review"}', 1, 1, 100, 50)

    finding, usage, error = asyncio.run(review(context, "test", Invalid(), 1))
    assert error and finding.outcome == "CHALLENGED"
    assert (usage.model_calls, usage.tool_calls, usage.input_tokens) == (1, 1, 100)

    class SchemaFailure:
        async def generate(self, context, model):
            raise ProviderFailure(ProviderResult("", 2, 1, 130, 60), "schema_validation")

    _, usage, error = asyncio.run(review(context, "test", SchemaFailure(), 1))
    assert error == "schema_validation" and usage.model_calls == 2
    assert "secret-canary" not in str(usage.validation_issues)
