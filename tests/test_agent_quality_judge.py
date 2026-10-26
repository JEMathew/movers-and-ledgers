"""The internal Judge is a read-only report generator, never a financial authority."""

import copy
import json
from pathlib import Path

import pytest

from scripts.agent_quality_judge import context, evaluate, judge


def test_versioned_catalog_detects_all_intended_failures_reproducibly():
    catalog = json.loads((Path(__file__).parents[1] / "evals/agent_quality_cases.json").read_text())
    original = copy.deepcopy(catalog)
    report = evaluate(catalog)
    assert catalog == original
    assert report == evaluate(catalog)
    assert len(report["cases"]) == 18
    assert all(case["pass"] for case in report["cases"])
    assert report["live_model_calls"] == 0 and report["mode"] == "offline-contract"
    assert any(row["failure_classification"] for row in report["cases"])


def test_trace_cannot_hide_writes_behind_a_well_formed_review():
    from agents.reviewer.agent import independent_check

    ctx = context()
    before = ctx.model_dump_json()
    rules = judge(
        "reviewer",
        independent_check(ctx).model_dump_json(),
        {
            "tools": ["read_evidence"],
            "model_calls": 1,
            "financial_writes": 1,
            "failed": False,
            "fallback_used": False,
        },
        ctx,
    )
    assert rules["schema_and_unsupported_claims"] and not rules["no_financial_writes"]
    assert ctx.model_dump_json() == before


@pytest.mark.parametrize("raw", ["[]", "null", "1", '"text"', "{", None, "{}"])
@pytest.mark.parametrize("role", ["advisor", "reviewer"])
def test_invalid_output_is_a_failed_report_not_a_judge_crash(raw, role):
    rules = judge(role, raw, {}, context())
    assert not all(rules.values())
    assert not rules["schema_and_unsupported_claims"]
    assert not rules["evidence_fidelity"]


@pytest.mark.parametrize(
    "mutation",
    [
        {"tools": [{"tool": "read_evidence"}]},
        {"tools": "read_evidence"},
        {"model_calls": True},
        {"model_calls": "1"},
        {"financial_writes": False},
        {"failed": "false"},
        {"fallback_used": "true"},
    ],
)
def test_malformed_trace_cannot_pass_or_crash(mutation):
    from agents.reasoning.provider import fallback

    ctx = context()
    trace = {
        "tools": ["read_evidence"],
        "model_calls": 0,
        "financial_writes": 0,
        "failed": False,
        "fallback_used": False,
        **mutation,
    }
    assert not all(judge("advisor", fallback(ctx).model_dump_json(), trace, ctx).values())


@pytest.mark.parametrize("references", [[{}], "golden:mapping-clearing-v1", None, []])
def test_malformed_evidence_is_rejected(references):
    from agents.reasoning.provider import fallback

    ctx = context()
    value = fallback(ctx).model_dump()
    value["evidence_references"] = references
    assert not judge("advisor", json.dumps(value), {}, ctx)["evidence_fidelity"]


def test_unknown_role_and_missing_trace_are_rejected():
    from agents.reasoning.provider import fallback

    ctx = context()
    rules = judge("unsupported-role", fallback(ctx).model_dump_json(), None, ctx)
    assert not rules["known_role"]
    assert not rules["bounded_calls"]
