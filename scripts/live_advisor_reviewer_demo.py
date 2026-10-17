"""Bounded Advisor + independent Reviewer demonstration on one synthetic mapping.

Default is OFFLINE: the deterministic fallback Advisor and the deterministic independent check run
with no network, no credentials and no model. Nothing here is a live Gemini result.

Live inference (Vertex AI via the caller's own Application Default Credentials) requires every flag
below and the same project/location pins as scripts/live_reasoning_eval.py. It makes at most four
generation calls in total (Advisor and Reviewer: two each, no retries), uses synthetic
evidence only,
touches no API server, database, Firestore or business state, and prints scalar usage evidence.
"""

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / "services/api/src")]

from movebooks_api.discover_assess.repository import (  # noqa: E402
    InMemoryMigrationSessionRepository,
)
from movebooks_api.discover_assess.service import DiscoverAssessService  # noqa: E402
from movebooks_api.settings import Settings  # noqa: E402

from agents.reasoning.projection import project  # noqa: E402
from agents.reasoning.provider import (  # noqa: E402
    GeminiAdkProvider,
    ProviderResult,
    fallback,
    reason,
)
from agents.reviewer.agent import (  # noqa: E402
    GeminiReviewProvider,
    independent_check,
    review,
    review_context,
)
from domain.reasoning.models import Capability  # noqa: E402

OWNER = "synthetic-demo-owner"
CASE = "account-clearing"  # "1200 · Misc Clearing": type-compatible, business purpose unknown.


def synthetic_mapping():
    service = DiscoverAssessService(InMemoryMigrationSessionRepository())
    session = service.create_session(OWNER, "harbor-light-migrate-demo")
    for step in (service.discover, service.assess, service.plan, service.map):
        session = step(OWNER, session.id)
    mapping = next(m for m in session.mappings if m.source_id == CASE)
    return session, mapping


class OfflineAdvisor:
    async def generate(self, context, model):
        return ProviderResult(fallback(context).model_dump_json(), 0, 0, 0, 0)


class OfflineReviewer:
    async def generate(self, context, model):
        return ProviderResult(independent_check(context).model_dump_json(), 0, 0, 0, 0)


def usage_row(usage, started, error):
    return {
        "failure_category": error,
        "model_calls": usage.model_calls,
        "tool_calls": usage.tool_calls,
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "usage_status": usage.usage_status,
        "finish_reason": usage.finish_reason,
        "validation_issues": usage.validation_issues,
        "latency_ms": round((time.monotonic() - started) * 1000),
        "estimated_cost_usd": None,  # no currency estimate without verified model-specific rates
    }


async def run(settings, live):
    session, mapping = synthetic_mapping()
    advisor_context = project(session, Capability.MAPPING)
    reviewer_context = review_context(session, mapping.id)
    advisor_model = settings.reasoning_models.get("mapping", "offline") if live else "offline"
    started = time.monotonic()
    advice, advice_usage, advice_error = await reason(
        advisor_context,
        advisor_model,
        GeminiAdkProvider(settings) if live else OfflineAdvisor(),
        settings.reasoning_timeout_seconds,
    )
    advisor_ms = usage_row(advice_usage, started, advice_error)
    started = time.monotonic()
    finding, review_usage, review_error = await review(
        reviewer_context,
        advisor_model,
        GeminiReviewProvider(settings) if live else OfflineReviewer(),
        settings.reasoning_timeout_seconds,
    )
    return {
        "mode": "live" if live else "offline-fallback (no model was called)",
        "synthetic_case": {"source": "1200 · Misc Clearing", "candidate": mapping.selected_target},
        "deterministic_baseline": {
            "state": mapping.state.value,
            "approval_required": mapping.approval_required,
            "policy_flags": mapping.policy_reasons,
        },
        "advisor": {
            "model": advisor_model,
            "used_fallback": advice_error is not None or not live,
            "output": advice.model_dump(),
            "usage": advisor_ms,
        },
        "reviewer": {
            "independent_evidence": "mapping only; the Advisor output was not supplied",
            "used_fallback": review_error is not None or not live,
            "output": finding.model_dump(),
            "usage": usage_row(review_usage, started, review_error),
        },
        "authority": (
            "Advisory only. A human approves; deterministic rules verify; no state was changed."
        ),
        "human_scoring": {"semantic_correctness": "not_human_scored"},
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--confirm-usd1-synthetic-test", action="store_true")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    settings = (
        Settings(_env_file=None)
        if args.live
        else Settings(_env_file=None, model_provider_mode="fallback")
    )
    if args.live:
        models = set(settings.reasoning_models.values())
        location_ok = (
            settings.reasoning_location == "global"
            if "gemini-3.5-flash-lite" in models
            else settings.reasoning_location == "asia-southeast1"
        )
        if (
            not args.confirm_usd1_synthetic_test
            or settings.reasoning_project != "movebooks-ai"
            or settings.model_provider_mode != "gemini-adk"
            or len(models) != 1
            or not location_ok
        ):
            parser.error(
                "Live requires explicit confirmation, project movebooks-ai, one approved model "
                "and its matching location"
            )
    result = asyncio.run(run(settings, args.live))
    text = json.dumps(result, indent=2, default=str)
    if args.out:
        args.out.write_text(text)
    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
