"""Provider-neutral, non-authoritative reasoning gate with a visible safe fallback."""

import asyncio
import json
import re
from dataclasses import dataclass
from typing import Protocol

from domain.reasoning.models import Advice, ReasoningInput


@dataclass
class ProviderResult:
    text: str
    model_calls: int | None = None
    tool_calls: int | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None


class ReasoningProvider(Protocol):
    async def generate(self, context: ReasoningInput, model: str) -> ProviderResult: ...


class GeminiAdkProvider:
    def __init__(self, settings):
        self.settings = settings

    async def generate(self, context, model):
        from .adk import run_advisor

        return await run_advisor(context, model, self.settings)


def fallback(context: ReasoningInput) -> Advice:
    return Advice(
        observation=f"{len(context.facts)} evidence references at {context.workflow_state}.",
        inference="No model inference is asserted by this versioned fallback.",
        recommendation="Inspect the existing deterministic proposal and evidence in this workflow.",
        rationale="A model explanation cannot change a control, approval, or financial result.",
        evidence_references=[f.reference for f in context.facts],
        confidence=0,
        uncertainty=["No calibrated model recommendation is available."],
        alternatives=["Stop and request qualified human review."],
        next_action="ESCALATE" if context.requires_escalation else "REVIEW_EXISTING_PROPOSAL",
        human_approval_required=True,
        financial_authority=False,
    )


def validate_advice(raw: str, context: ReasoningInput) -> Advice:
    if len(raw.encode()) > 16000:
        raise ValueError("Output capacity exceeded")
    advice = Advice.model_validate_json(raw)
    allowed = {f.reference for f in context.facts}
    if not set(advice.evidence_references) <= allowed:
        raise ValueError("Untraceable evidence")
    # Defense in depth for narrative text; authority is enforced by absence of write tools
    # and by never feeding this record into a business-state decision.
    text = json.dumps(advice.model_dump()).lower()
    if re.search(
        r"bypass|ignore (?:the )?(?:approval|policy|rules)|auto.?approve|"
        r"mark .{0,30}(?:verified|complete)|api[_ -]?key|bearer\s|"
        r"balances?.{0,40}reconcil|journal.{0,40}balanc|"
        r"(?:fpu|first productive use).{0,40}(?:verified|complete)|"
        r"(?:verified|completed).{0,40}(?:fpu|first productive use)|"
        r"approval.{0,40}(?:granted|given)|post .{0,40}invoice",
        text,
    ):
        raise ValueError("Unsafe output")
    if context.requires_escalation or advice.confidence < 0.8:
        advice.next_action = "ESCALATE"
    return advice


async def reason(context, model, provider, timeout):
    """No blind semantic retries. Transport and ADK have separate bounded call caps."""
    try:
        result = await asyncio.wait_for(provider.generate(context, model), timeout=timeout)
        try:
            return validate_advice(result.text, context), result, None
        except (ValueError, TypeError):
            return fallback(context), result, "invalid_output"
    except TimeoutError:
        return fallback(context), ProviderResult(""), "timeout"
    except Exception:
        # Never log/return exception messages: providers can embed input, output or credentials.
        return fallback(context), ProviderResult(""), "provider_unavailable"
