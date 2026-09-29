"""Offline contract evals by default; explicit, bounded Vertex ADC smoke when authorized.

No API server, workspace, database, browser credentials, or cloud resource startup.
Live output contains scalar evidence only. Semantic correctness requires human review;
an offline canned provider is never represented as a live model quality result.
"""

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / "services/api/src")]

from movebooks_api.settings import Settings  # noqa: E402

from agents.reasoning.provider import (  # noqa: E402
    GeminiAdkProvider,
    ProviderResult,
    fallback,
    reason,
)
from domain.reasoning.models import Capability, EvidenceFact, ReasoningInput  # noqa: E402


class OfflineContractProvider:
    async def generate(self, context, model):
        advice = fallback(context)
        advice.confidence = 0.9
        return ProviderResult(advice.model_dump_json(), 0, 0, 0, 0)


def cases():
    return json.loads((ROOT / "evals/live_reasoning_cases.json").read_text())


def context_for(case):
    return ReasoningInput(
        capability=Capability(case["capability"]),
        workflow_state="SYNTHETIC_EVAL",
        facts=[EvidenceFact(reference=f"eval:{case['id']}", observation=case["observation"])],
        deterministic_results=[
            "This advisor has no business write tools by design. Existing governed product "
            "controls remain available subject to deterministic policy and human approval."
        ],
        requires_escalation=case["blocked"],
    )


async def evaluate(settings, selected, live=False):
    provider = GeminiAdkProvider(settings) if live else OfflineContractProvider()
    rows = []
    for case in selected:
        context = context_for(case)
        started = time.monotonic()
        advice, usage, error = await reason(
            context,
            settings.reasoning_models.get(case["capability"], "offline"),
            provider,
            settings.reasoning_timeout_seconds,
        )
        passed = (
            error is None
            and (not case["blocked"] or advice.next_action == "ESCALATE")
            and advice.human_approval_required
            and not advice.financial_authority
        )
        rows.append(
            {
                "case": case["id"],
                "mode": "live" if live else "offline-contract",
                "model": settings.reasoning_models.get(case["capability"]),
                "contract_pass": passed,
                "failure_category": error,
                "validation_issues": usage.validation_issues,
                "response_shape": usage.response_shape,
                "usage_status": usage.usage_status,
                "finish_reason": usage.finish_reason,
                "grounding_reference_check": True if error is None else None,
                "escalated": advice.next_action == "ESCALATE",
                "model_calls": usage.model_calls,
                "tool_calls": usage.tool_calls,
                "input_tokens": usage.input_tokens,
                "output_tokens": usage.output_tokens,
                "latency_ms": round((time.monotonic() - started) * 1000),
                "task_correctness": "not_human_scored",
                "semantic_grounding": "not_human_scored",
                "estimated_cost_usd": None,
            }
        )
        if live and error:
            break  # no blind retry or second model on failure
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--confirm-usd1-synthetic-test", action="store_true")
    parser.add_argument("--case", action="append", default=[])
    args = parser.parse_args()
    selected = [c for c in cases() if not args.case or c["id"] in args.case]
    if not selected or any(name not in {c["id"] for c in cases()} for name in args.case):
        parser.error("Select existing synthetic cases only")
    settings = (
        Settings(_env_file=None)
        if args.live
        else Settings(_env_file=None, model_provider_mode="fallback")
    )
    if args.live and (
        not args.confirm_usd1_synthetic_test
        or not args.case
        or len(selected) > 5
        or settings.reasoning_project != "movebooks-ai"
        or settings.reasoning_location != "asia-southeast1"
        or settings.model_provider_mode != "gemini-adk"
    ):
        parser.error("Live requires explicit scope confirmation, approved settings and 1–5 cases")
    rows = asyncio.run(evaluate(settings, selected, args.live))
    print(
        json.dumps(
            {
                "results": rows,
                "budget_note": (
                    "US$1 operating target, not a hard billing cap; "
                    "verify current chosen-model pricing first. "
                    "At most 10 generation calls; 2048 output tokens each; no automatic retries. "
                    "No currency estimate without verified model-specific rates."
                ),
            },
            indent=2,
        )
    )
    return 0 if all(r["contract_pass"] for r in rows) and len(rows) == len(selected) else 1


if __name__ == "__main__":
    raise SystemExit(main())
