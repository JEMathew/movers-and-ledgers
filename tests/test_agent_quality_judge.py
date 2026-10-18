"""The internal Judge is a read-only report generator, never a financial authority."""

import copy
import json
from pathlib import Path

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
