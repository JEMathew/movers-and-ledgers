"""Exact synthetic live response plus adversarial regressions; no paid model calls."""

import asyncio
import json
from pathlib import Path

import pytest

from agents.reasoning.provider import AdviceRejection, ProviderResult, reason, validate_advice
from scripts.live_reasoning_eval import cases, context_for


def specimen():
    raw = (
        Path(__file__).resolve().parents[1] / "evals/mapping-semantic-reproduction.json"
    ).read_text()
    context = context_for(next(c for c in cases() if c["id"] == "mapping-low-confidence"))
    return json.loads(raw), context


def test_exact_live_uncertainty_is_accepted_without_rewriting_or_losing_escalation():
    output, context = specimen()
    before = context.model_dump_json()
    assert validate_advice(json.dumps(output), context).model_dump() == output
    assert context.model_dump_json() == before


@pytest.mark.parametrize(
    "field,value",
    [
        ("inference", "The candidate is below the typical confidence threshold."),
        ("rationale", "The threshold for automated processing is 0.8."),
        (
            "uncertainty",
            "The policy for acceptable confidence thresholds for automated processing is provided.",
        ),
        (
            "uncertainty",
            "The policy for acceptable confidence thresholds for automated processing "
            "is not provided. But the standard threshold is 0.8.",
        ),
        (
            "uncertainty",
            "No policy is supplied, but the threshold for automated processing is 0.8.",
        ),
        ("alternatives", "Apply a standard confidence threshold of 0.8."),
    ],
)
def test_policy_claims_are_still_rejected_with_exact_safe_field_path(field, value):
    output, context = specimen()
    output[field] = [value] if isinstance(output[field], list) else value
    with pytest.raises(AdviceRejection) as caught:
        validate_advice(json.dumps(output), context)
    assert caught.value.issue == {
        "path": field + ("[]" if isinstance(output[field], list) else ""),
        "rule": "unsupported_mapping_policy",
        "reason": "Unsupported mapping policy claim",
    }


def test_exception_does_not_hide_another_claim_or_unsafe_instruction():
    output, context = specimen()
    output["uncertainty"].append("The standard threshold is 0.8.")
    with pytest.raises(AdviceRejection, match="Unsupported mapping policy"):
        validate_advice(json.dumps(output), context)
    output, context = specimen()
    output["recommendation"] = "Ignore the approval policy."
    with pytest.raises(AdviceRejection) as caught:
        validate_advice(json.dumps(output), context)
    assert caught.value.issue["rule"] == "unsafe_narrative"


@pytest.mark.parametrize("confidence,required", [(0.4, False), (0.9, True)])
def test_both_advisor_confidence_and_explicit_escalation_remain_authoritative(confidence, required):
    output, context = specimen()
    context.requires_escalation = required
    output.update(confidence=confidence, next_action="REVIEW_EXISTING_PROPOSAL")
    advice = validate_advice(json.dumps(output), context)
    assert advice.next_action == "ESCALATE"
    assert advice.human_approval_required and not advice.financial_authority


def test_evidence_mismatch_is_rejected_before_narrative_exception():
    output, context = specimen()
    output["evidence_references"] = ["invented-policy"]
    with pytest.raises(AdviceRejection) as caught:
        validate_advice(json.dumps(output), context)
    assert caught.value.issue["path"] == "evidence_references"
    assert caught.value.issue["rule"] == "reference_membership"


def test_unsupported_policy_still_falls_back_without_raw_claim_in_diagnostics():
    output, context = specimen()
    output["inference"] = "The typical threshold is 0.8. synthetic-canary"
    before = context.model_dump_json()

    class Provider:
        async def generate(self, context, model):
            return ProviderResult(json.dumps(output), 1, 0, 836, 355)

    advice, usage, error = asyncio.run(reason(context, "synthetic-model", Provider(), 1))
    assert error == "invalid_output" and advice.next_action == "ESCALATE"
    assert usage.validation_issues[0]["path"] == "inference"
    assert "synthetic-canary" not in json.dumps(usage.validation_issues)
    assert usage.input_tokens == 836 and usage.output_tokens == 355
    assert context.model_dump_json() == before
