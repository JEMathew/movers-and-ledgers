"""Provider-neutral, non-authoritative reasoning gate with a visible safe fallback."""

import asyncio
import json
import re
from dataclasses import dataclass, field
from typing import Protocol

from pydantic import ValidationError

from domain.reasoning.models import Advice, ReasoningInput


@dataclass
class ProviderResult:
    text: str
    model_calls: int | None = None
    tool_calls: int | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    validation_issues: list[dict[str, str]] = field(default_factory=list)
    response_shape: dict[str, str] = field(default_factory=dict)
    usage_status: str = "unknown"
    finish_reason: str | None = None


def safe_shape(value):
    """Schema field names and JSON kinds only; never values or untrusted keys."""
    if not isinstance(value, dict):
        return {"$": "non_object"}
    kinds = {
        str: "string",
        bool: "boolean",
        int: "number",
        float: "number",
        list: "array",
        dict: "object",
        type(None): "null",
    }
    result = {
        name: kinds.get(type(value[name]), "other") if name in value else "missing"
        for name in Advice.model_fields
    }
    if set(value) - set(Advice.model_fields):
        result["$extra"] = "present"
    return result


def safe_validation_issues(error):
    """Only canonical paths and allowlisted rules; Pydantic messages can contain payloads."""
    allowed = {
        "missing",
        "too_short",
        "too_long",
        "string_type",
        "string_too_short",
        "string_too_long",
        "list_type",
        "literal_error",
        "float_parsing",
        "float_type",
        "finite_number",
        "greater_than_equal",
        "less_than_equal",
        "bool_parsing",
        "bool_type",
        "extra_forbidden",
        "json_invalid",
        "model_type",
    }
    issues = []
    for item in error.errors(include_input=False, include_context=False, include_url=False)[:16]:
        loc = item.get("loc", ())
        root = loc[0] if loc and loc[0] in Advice.model_fields else "$"
        path = root + ("[]" if len(loc) > 1 and isinstance(loc[1], int) else "")
        rule = item["type"] if item["type"] in allowed else "schema_violation"
        issues.append({"path": path, "rule": rule, "reason": "Response violates Advice contract"})
    return issues


class ProviderFailure(Exception):
    def __init__(self, result, category="schema_validation"):
        super().__init__("Structured response rejected")
        self.result = result
        self.category = category


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
        r"approval.{0,40}(?:granted|given)|post .{0,40}invoice|"
        r"(?:initiate|create|start).{0,30}new.{0,20}batch|unique identifiers",
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
        except ValidationError as error:
            result.validation_issues = safe_validation_issues(error)
            try:
                result.response_shape = safe_shape(json.loads(result.text))
            except (ValueError, TypeError):
                result.response_shape = {"$": "invalid_json"}
            return fallback(context), result, "schema_validation"
        except (ValueError, TypeError):
            return fallback(context), result, "invalid_output"
    except ProviderFailure as error:
        return fallback(context), error.result, error.category
    except TimeoutError:
        return fallback(context), ProviderResult(""), "timeout"
    except Exception:
        # Never log/return exception messages: providers can embed input, output or credentials.
        return fallback(context), ProviderResult(""), "provider_unavailable"
