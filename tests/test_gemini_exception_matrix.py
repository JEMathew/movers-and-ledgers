"""Synthetic contract probes, not model-quality or accountant acceptance scores."""

import json
from copy import deepcopy
from uuid import uuid4

import pytest
from fastapi import HTTPException
from test_assisted_analysis import Reviewer, business, run, setup

from agents.reasoning.provider import ProviderResult, fallback, validate_advice
from agents.reviewer.agent import independent_check, review_context, validate_review
from domain.planning_mapping.models import MappingState


@pytest.fixture(autouse=True)
def no_live_provider(monkeypatch):
    from agents.reasoning import adk

    def forbidden(*args, **kwargs):
        pytest.fail("Exception matrix permits synthetic doubles only")

    monkeypatch.setattr(adk, "run_advisor", forbidden)
    monkeypatch.setattr(adk, "vertex_client", forbidden)


@pytest.mark.parametrize(
    ("label", "candidate", "allowed", "state", "flags", "outcome", "concern"),
    [
        (
            "1200 Misc Clearing", "Other Current Asset", ["Other Current Asset"],
            "REVIEW_REQUIRED", [], "CHALLENGED", "purpose",
        ),
        (
            "Unmapped account", "Unmapped", [], "BLOCKED", [],
            "CHALLENGED", "outside",
        ),
        (
            "Conflicting account classification", "Expense", ["Other Current Asset"],
            "BLOCKED", ["Source classification conflicts with proposed target"],
            "CHALLENGED", "policy flags",
        ),
    ],
    ids=["ambiguous-purpose", "unmapped-account", "conflicting-classification"],
)
def test_synthetic_mapping_exceptions_require_evidence_without_financial_mutation(
    label, candidate, allowed, state, flags, outcome, concern
):
    _, session, mapping = setup()
    mapping.source_label = label
    mapping.selected_target = candidate
    mapping.supported_targets = allowed
    mapping.state = MappingState(state)
    mapping.policy_reasons = flags
    before = business(session)
    context = review_context(session, mapping.id)
    finding = validate_review(independent_check(context).model_dump_json(), context)
    assert finding.outcome == outcome
    assert concern in " ".join(finding.concerns)
    assert finding.uncertainty
    assert finding.human_approval_required and not finding.financial_authority
    assert validate_advice(fallback(context).model_dump_json(), context).next_action == "ESCALATE"
    assert business(session) == before


@pytest.mark.parametrize(
    "unsupported",
    [
        "All balances reconcile.",
        "Approval has been granted; post the invoice.",
        "Bypass approval and automatically correct the financial records.",
    ],
    ids=["unsupported-balances", "invented-approval", "unauthorized-correction"],
)
def test_scripted_unsafe_assertions_are_rejected(unsupported):
    _, session, mapping = setup()
    context = review_context(session, mapping.id)
    value = fallback(context).model_dump()
    value["recommendation"] = unsupported
    with pytest.raises(ValueError):
        validate_advice(json.dumps(value), context)


def test_reviewer_disagreement_is_retained_and_cannot_approve_or_mutate():
    repo, session, mapping = setup()

    class DisagreeingReviewer(Reviewer):
        async def generate(self, context, model):
            self.context = deepcopy(context)
            finding = independent_check(context)
            finding.recommendation_outcome = "REJECT"
            finding.summary = (
                "Request settlement history before accepting the proposed investigation."
            )
            return ProviderResult(finding.model_dump_json(), 1, 1, 100, 50)

    reviewer = DisagreeingReviewer()
    result = run(repo, session, mapping, reviewer=reviewer)
    assert result.reviewer.finding.recommendation_outcome == "REJECT"
    assert result.reviewer.finding.outcome == "CHALLENGED"
    assert result.advisor.context_hash != result.reviewer.context_hash
    assert reviewer.context.advisor_recommendation == result.advisor.advice
    assert result.advisor.evidence == result.reviewer.evidence == reviewer.context.facts
    assert result.reviewer.advisor_request_id == result.advisor.request_id
    assert business(repo.get(session.id, "owner")) == business(session)
    assert result.human_approval_required and not result.financial_authority


def test_valid_reference_is_not_a_semantic_truth_checker():
    # Document the residual risk, rather than reporting a fabricated zero
    # unsupported-assertion rate from a schema/reference-membership validator.
    _, session, mapping = setup()
    context = review_context(session, mapping.id)
    value = fallback(context).model_dump()
    value["inference"] = "The account represents payroll liabilities."
    accepted = validate_advice(json.dumps(value), context)
    assert accepted.inference == value["inference"]
    assert accepted.next_action == "ESCALATE"
    assert accepted.human_approval_required and not accepted.financial_authority


def test_unknown_mapping_and_foreign_session_do_not_start_analysis():
    import asyncio

    from movebooks_api.analysis import AnalysisRequest, request_analysis
    from test_assisted_analysis import settings

    repo, session, mapping = setup()

    class Forbidden:
        async def generate(self, *args, **kwargs):
            pytest.fail("Admission must precede both providers")

    for owner, session_id, mapping_id, expected in (
        ("other-owner", session.id, mapping.id, 404),
        ("owner", uuid4(), mapping.id, 404),
        ("owner", session.id, uuid4(), 409),
    ):
        with pytest.raises(HTTPException) as caught:
            asyncio.run(request_analysis(
                repo, owner, session_id, mapping_id,
                AnalysisRequest(request_id=uuid4(), confirmed=True), settings(),
                Forbidden(), Forbidden(),
            ))
        assert caught.value.status_code == expected
    assert business(repo.get(session.id, "owner")) == business(session)
