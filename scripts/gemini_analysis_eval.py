"""Reproduce the paired application service on one synthetic case.

Default: deterministic, zero model calls. Live requires fresh human approval and explicit flags.
Uses the same owner-scoped service as the UI, an ephemeral repository, and normal Vertex ADC.
No API deployment, Firestore, SQL, IAM mutation, customer data or financial writes.
"""

import argparse
import asyncio
import json
import os
import sys
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / "services/api/src"), str(ROOT / "scripts")]

from live_advisor_reviewer_demo import OWNER, synthetic_mapping  # noqa: E402
from movebooks_api.analysis import AnalysisRequest, request_analysis  # noqa: E402
from movebooks_api.discover_assess.repository import (  # noqa: E402
    InMemoryMigrationSessionRepository,
)
from movebooks_api.settings import Settings  # noqa: E402

MODEL = "gemini-3.5-flash-lite"


async def run(settings, live=False):
    if not live:
        return await _run_pair(settings, live=False)
    from gemini_eval_guard import EvaluationGuard, guarded_clients

    guard = EvaluationGuard()
    try:
        with guarded_clients(guard):
            result = await _run_pair(settings, live=True)
        result["pre_inference_guard"] = {
            "maximum_input_tokens_per_call": 50_000,
            "count_tokens_requests": guard.counts,
            "generation_attempts_reserved": guard.calls,
            "blocked": guard.blocked,
            "ledger_path": str(guard.path),
            "reruns_permitted": False,
        }
        result["sanitized_transport_traces"] = guard.traces
        result["independent_role_runs"] = guard.role_runs
        result["project_id"] = settings.reasoning_project
        result["returned_model_versions"] = sorted({
            trace["model_version"] for trace in guard.traces if trace.get("model_version")
        })
        result["evaluation_criteria"] = {
            "both_roles_live_and_validated": "PASS" if result["status"] == "accepted" else "FAIL",
            "business_state_unchanged": "PASS" if result["business_state_unchanged"] else "FAIL",
            "guard_completed": "FAIL" if guard.blocked else "PASS",
            "usage_and_cost_known": (
                "PASS" if guard.traces and all(
                    trace.get("estimated_cost_usd") is not None for trace in guard.traces
                ) else "UNVERIFIED"
            ),
            "independent_role_contexts": (
                "PASS" if [role["role"] for role in guard.role_runs] == ["advisor", "reviewer"]
                else "FAIL"
            ),
            "semantic_correctness": "UNVERIFIED: qualified human review required",
        }
        result["overall_evaluation"] = (
            "FAIL" if "FAIL" in result["evaluation_criteria"].values()
            else "UNVERIFIED: human semantic assessment pending"
        )
        result["transport_estimated_cost_usd"] = (
            sum(trace["estimated_cost_usd"] for trace in guard.traces)
            if guard.traces and all(
                trace.get("estimated_cost_usd") is not None for trace in guard.traces
            ) else None
        )
        if guard.blocked:
            result["status"] = "guard-blocked"
        return result
    finally:
        guard.close()


async def _run_pair(settings, live=False):
    session, mapping = synthetic_mapping()
    repo = InMemoryMigrationSessionRepository()
    repo.put(session)
    started = datetime.now(UTC)
    result = await request_analysis(
        repo,
        OWNER,
        session.id,
        mapping.id,
        AnalysisRequest(request_id=uuid4(), confirmed=True),
        settings,
    )
    after = repo.get(session.id, OWNER)
    business_fields = {"reasoning_records", "review_records"}
    unchanged = session.model_dump(exclude=business_fields) == after.model_dump(
        exclude=business_fields
    )
    records = [result.advisor, result.reviewer]
    accepted = all(
        record is not None and record.state in {"COMPLETED", "ESCALATED"} for record in records
    )
    known_usage = all(
        record is not None
        and record.input_tokens is not None
        and record.output_tokens is not None
        and record.usage_status == "complete"
        for record in records
    )
    estimate = None
    if live and known_usage:
        estimate = sum(
            (record.input_tokens * 0.30 + record.output_tokens * 2.50) / 1_000_000
            for record in records
        )
    return {
        "mode": "live-model" if live else "deterministic-fallback; no model called",
        "started_at": started.isoformat(),
        "completed_at": datetime.now(UTC).isoformat(),
        "status": "accepted" if live and accepted else "fallback",
        "model_id": MODEL if live else None,
        "endpoint": "https://aiplatform.googleapis.com" if live else None,
        "location": "global" if live else None,
        "synthetic_case_id": "account-clearing",
        "source": "1200 · Misc Clearing",
        "evidence_and_results": result.model_dump(
            mode="json",
            exclude={"advisor": {"requested_by"}, "reviewer": {"requested_by"}},
        ),
        "output_validation": {
            "advisor": result.advisor.failure_category or "accepted structured/grounded contract",
            "reviewer": (
                result.reviewer.failure_category or "accepted structured/grounded contract"
                if result.reviewer
                else "not run; stale advisor"
            ),
            "semantic_quality": (
                "requires qualified human review; schema acceptance is insufficient"
            ),
        },
        "business_state_unchanged": unchanged,
        "human_control": (
            "No approval or financial write tools. Existing human controls are required."
        ),
        "estimated_cost_usd": estimate,
        "pricing": {
            "usd_per_million_input": 0.30,
            "usd_per_million_output_including_thinking": 2.50,
            "source": "https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing",
            "checked_date": "2026-10-20",
            "note": (
                "Standard global text list-price estimate, not billed spend. Unknown is not zero."
            ),
        },
        "limits": {
            "maximum_generation_calls": 4,
            "transport_retries": 0,
            "maximum_output_tokens_per_call": 2048,
            "maximum_request_bytes_per_call": 65536,
            "deadline_seconds_per_role": settings.reasoning_timeout_seconds,
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--confirm-usd020-synthetic-test", action="store_true")
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    if args.live and not args.confirm_usd020_synthetic_test:
        parser.error("Live requires fresh approval and --confirm-usd020-synthetic-test")
    # Reject bad output destinations before any paid work.
    if args.out.exists() or not args.out.parent.is_dir():
        parser.error(
            "Use a new output file in an existing directory; evidence is never overwritten"
        )
    settings = (
        Settings(_env_file=None)
        if args.live
        else Settings(
            _env_file=None,
            model_provider_mode="deterministic-only",
            synthetic_analysis_enabled=True,
        )
    )
    if args.live and (
        settings.reasoning_project != "movebooks-ai"
        or settings.env not in {"local", "test", "development"}
        or settings.reasoning_location != "global"
        or set(settings.reasoning_models.values()) != {MODEL}
        or settings.model_provider_mode != "gemini-adk"
        or not settings.synthetic_analysis_enabled
        or not settings.synthetic_beta_authorized
    ):
        parser.error("Live requires approved local synthetic configuration and exact model pins")
    result = asyncio.run(run(settings, live=args.live))
    with os.fdopen(os.open(args.out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "w") as output:
        json.dump(result, output, indent=2)
        output.write("\n")
    print(
        json.dumps(
            {
                "mode": result["mode"],
                "status": result["status"],
                "business_state_unchanged": result["business_state_unchanged"],
                "estimated_cost_usd": result["estimated_cost_usd"],
            }
        )
    )
    return (
        0
        if result["business_state_unchanged"] and (not args.live or result["status"] == "accepted")
        else 1
    )


if __name__ == "__main__":
    raise SystemExit(main())
