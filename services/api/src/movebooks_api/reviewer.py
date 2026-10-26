"""Owner-scoped, user-triggered independent mapping reviews. No financial write tools."""

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from agents.model_policy import live_route
from agents.reasoning.projection import context_hash
from agents.reasoning.transport import TransportDenied, cloud_guard
from agents.reviewer.agent import GeminiReviewProvider, independent_check, review, review_context
from domain.reasoning.models import Capability, ReasoningRequest
from domain.reasoning.reviewer import RECOMMENDATION_REVIEW_VERSION, REVIEW_VERSION, ReviewRecord

from .auth import Principal, require_principal
from .discover_assess.service import discover_assess_service
from .runtime.model_controls import ControlDenied, finish_live, reserve_live
from .settings import get_settings

router = APIRouter(prefix="/v1/migration-sessions", tags=["independent review"])


async def request_review(
    repository,
    owner,
    session_id,
    mapping_id,
    request,
    settings,
    provider=None,
    *,
    advisor_request_id=None,
):
    session = repository.get(session_id, owner)
    if session is None:
        raise HTTPException(404, "Workspace not found")
    try:
        context = review_context(session, mapping_id, advisor_request_id)
    except ValueError as error:
        raise HTTPException(409, str(error)) from None
    fingerprint = context_hash(context)
    route = live_route(Capability.MAPPING, settings)
    version = RECOMMENDATION_REVIEW_VERSION if advisor_request_id else REVIEW_VERSION
    for record in session.review_records:
        same_context = (
            record.context_hash == fingerprint
            and record.mapping_id == mapping_id
            and record.provider == route.provider
            and record.model == route.model
            and record.advisor_request_id == advisor_request_id
            and record.version == version
        )
        if record.request_id == request.request_id and not same_context:
            raise HTTPException(409, "Review request belongs to different evidence")
        if record.request_id == request.request_id or same_context:
            if record.state == "PENDING":
                raise HTTPException(409, "Review pending; no automatic replay")
            return record
    if len(session.review_records) >= 3:
        raise HTTPException(409, "Review budget exhausted; request qualified human review")
    original = session.model_copy(deep=True)
    record = ReviewRecord(
        version=version,
        advisor_request_id=advisor_request_id,
        request_id=request.request_id,
        mapping_id=mapping_id,
        context_hash=fingerprint,
        requested_by=owner,
        provider=route.provider,
        model=route.model,
        evidence=context.facts,
    )
    session.review_records.append(record)
    try:
        repository.put_if_unchanged(original, session)
    except ValueError:
        raise HTTPException(409, "Concurrent change; refresh before review") from None
    control_error = None
    if route.provider == "gemini-adk":
        try:
            if settings.cloud:
                guard = cloud_guard(settings)
                await guard.prepare()
            await reserve_live(
                settings, owner, f"review:{session_id}:{request.request_id}", "mapping-review"
            )
        except (ControlDenied, TransportDenied) as denied:
            control_error = str(denied)
    if route.provider == "gemini-adk" and control_error is None:
        finding, usage, error = await review(
            context,
            route.model,
            provider or GeminiReviewProvider(settings),
            settings.reasoning_timeout_seconds,
        )
    else:
        from agents.reasoning.provider import ProviderResult

        finding, usage, error = (
            independent_check(context),
            ProviderResult("", 0, 0),
            (control_error or "live_disabled"),
        )
    current = repository.get(session_id, owner)
    if current is None:
        raise HTTPException(404, "Workspace no longer available")
    original = current.model_copy(deep=True)
    saved = next(r for r in current.review_records if r.request_id == request.request_id)
    saved.completed_at = datetime.now(UTC)
    saved.model_calls, saved.tool_calls = usage.model_calls, usage.tool_calls
    saved.input_tokens, saved.output_tokens = usage.input_tokens, usage.output_tokens
    saved.usage_status = usage.usage_status
    saved.validation_issues, saved.response_shape = usage.validation_issues, usage.response_shape
    saved.failure_category = error
    saved.state = "FALLBACK" if error else "COMPLETED"
    try:
        unchanged = (
            context_hash(review_context(current, mapping_id, advisor_request_id)) == fingerprint
        )
    except ValueError:
        unchanged = False
    if unchanged:
        saved.finding = finding
    else:
        saved.state, saved.failure_category = "UNAVAILABLE", "stale_context"
    try:
        repository.put_if_unchanged(original, current)
    except ValueError:
        raise HTTPException(409, "Concurrent change; reserved review will not replay") from None
    if route.provider == "gemini-adk" and control_error is None:
        await finish_live(
            settings,
            owner,
            f"review:{session_id}:{request.request_id}",
            saved.state,
            usage,
        )
    return saved


@router.post("/{session_id}/reviewer/mapping/{mapping_id}", response_model=ReviewRecord)
async def generate(
    session_id: UUID,
    mapping_id: UUID,
    request: ReasoningRequest,
    principal: Annotated[Principal, Depends(require_principal)],
):
    return await request_review(
        discover_assess_service.repository,
        principal.subject,
        session_id,
        mapping_id,
        request,
        get_settings(),
    )
