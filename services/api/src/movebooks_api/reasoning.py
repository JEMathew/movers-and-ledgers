"""Owner-scoped advisory requests. CAS reserves capacity before any billable call."""

import json
import logging
import time
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from agents.model_policy import live_route
from agents.reasoning.projection import context_hash, project
from agents.reasoning.provider import GeminiAdkProvider, ProviderResult, fallback, reason
from domain.reasoning.models import PROMPT_VERSION, Capability, ReasoningRecord, ReasoningRequest

from .auth import Principal, require_principal
from .discover_assess.service import discover_assess_service
from .settings import get_settings

router = APIRouter(prefix="/v1/migration-sessions", tags=["advisory reasoning"])
_log = logging.getLogger("movebooks.reasoning")


def safe_telemetry(record):
    # Explicit scalars only; no context, IDs, actor, text, prompts, exceptions or tokens.
    _log.warning(
        json.dumps(
            {
                "severity": "INFO",
                "action": "reasoning",
                "capability": record.capability.value,
                "provider": record.provider,
                "model": record.model,
                "state": record.state,
                "latency_ms": record.latency_ms,
                "model_calls": record.model_calls,
                "reserved_model_calls": record.reserved_model_calls,
                "tool_calls": record.tool_calls,
                "input_token_count": record.input_tokens,
                "output_token_count": record.output_tokens,
                "failure_category": record.failure_category,
                "fallback_used": record.state == "FALLBACK",
                "human_review_required": True,
                "estimated_cost_usd": record.estimated_cost_usd,
            },
            allow_nan=False,
        )
    )


async def request_advice(
    repository, owner, session_id, capability, request, settings, provider=None
):
    session = repository.get(session_id, owner)
    if session is None:
        raise HTTPException(404, "Workspace not found")
    try:
        context = project(session, capability)
        route = live_route(capability, settings)
    except ValueError as error:
        raise HTTPException(409, str(error)) from None
    fingerprint = context_hash(context)
    for r in session.reasoning_records:
        if r.request_id == request.request_id:
            if (r.context_hash, r.capability, r.provider, r.model, r.prompt_version) != (
                fingerprint,
                capability,
                route.provider,
                route.model,
                PROMPT_VERSION,
            ):
                raise HTTPException(
                    409, "Request already belongs to different evidence/configuration"
                )
            if r.state == "PENDING":
                raise HTTPException(409, "Reasoning pending or interrupted; no automatic replay")
            return r
    for r in session.reasoning_records:
        if (r.context_hash, r.capability, r.provider, r.model, r.prompt_version) == (
            fingerprint,
            capability,
            route.provider,
            route.model,
            PROMPT_VERSION,
        ):
            if r.state == "PENDING":
                raise HTTPException(409, "Reasoning pending or interrupted; no automatic replay")
            return r
    if len(session.reasoning_records) >= settings.reasoning_max_runs:
        raise HTTPException(
            409, "Reasoning budget exhausted; use deterministic workflow or escalate"
        )
    original = session.model_copy(deep=True)
    record = ReasoningRecord(
        request_id=request.request_id,
        capability=capability,
        context_hash=fingerprint,
        requested_by=owner,
        provider=route.provider,
        model=route.model,
        reserved_model_calls=2 if route.provider == "gemini-adk" else 0,
        deterministic_results=context.deterministic_results,
        evidence=context.facts,
    )
    session.reasoning_records.append(record)
    try:
        repository.put_if_unchanged(original, session)
    except ValueError:
        raise HTTPException(409, "Concurrent change; refresh before reasoning") from None
    safe_telemetry(record)
    started = time.monotonic()
    if route.provider == "gemini-adk":
        advice, usage, error = await reason(
            context,
            route.model,
            provider or GeminiAdkProvider(settings),
            settings.reasoning_timeout_seconds,
        )
    else:
        advice, usage, error = fallback(context), ProviderResult("", 0, 0), "live_disabled"
    current = repository.get(session_id, owner)
    if current is None:
        raise HTTPException(404, "Workspace no longer available")
    original = current.model_copy(deep=True)
    saved = next(r for r in current.reasoning_records if r.request_id == request.request_id)
    saved.completed_at = datetime.now(UTC)
    saved.latency_ms = round((time.monotonic() - started) * 1000)
    saved.model_calls, saved.tool_calls = usage.model_calls, usage.tool_calls
    saved.input_tokens, saved.output_tokens = usage.input_tokens, usage.output_tokens
    saved.failure_category = error
    saved.state = (
        "FALLBACK"
        if error
        else ("ESCALATED" if advice.next_action != "REVIEW_EXISTING_PROPOSAL" else "COMPLETED")
    )
    try:
        unchanged = context_hash(project(current, capability)) == fingerprint
    except ValueError:
        unchanged = False
    if unchanged:
        saved.advice = advice
    else:
        saved.state, saved.failure_category = "UNAVAILABLE", "stale_context"
    # Currency is unknown without verified, model-specific prices. The bounded
    # evaluation client supplies prices explicitly; never infer a free call.
    try:
        repository.put_if_unchanged(original, current)
    except ValueError:
        raise HTTPException(409, "Concurrent change; reserved request will not replay") from None
    safe_telemetry(saved)
    return saved


@router.post("/{session_id}/reasoning/{capability}", response_model=ReasoningRecord)
async def generate(
    session_id: UUID,
    capability: Capability,
    request: ReasoningRequest,
    principal: Annotated[Principal, Depends(require_principal)],
):
    return await request_advice(
        discover_assess_service.repository,
        principal.subject,
        session_id,
        capability,
        request,
        get_settings(),
    )


@router.get("/{session_id}/reasoning/{capability}")
def history(
    session_id: UUID,
    capability: Capability,
    principal: Annotated[Principal, Depends(require_principal)],
):
    session = discover_assess_service.repository.get(session_id, principal.subject)
    if session is None:
        raise HTTPException(404, "Workspace not found")
    try:
        fingerprint = context_hash(project(session, capability))
    except ValueError:
        fingerprint = None
    return {
        "records": [
            dict(r.model_dump(mode="json"), stale=r.context_hash != fingerprint)
            for r in session.reasoning_records
            if r.capability == capability
        ]
    }
