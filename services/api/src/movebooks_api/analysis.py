"""One explicit, synthetic-only Advisor/Reviewer action using the existing governed services."""

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from agents.reviewer.agent import review_context
from domain.reasoning.models import Capability, ReasoningRecord, ReasoningRequest, StrictModel
from domain.reasoning.reviewer import ReviewRecord

from .auth import Principal, require_principal
from .discover_assess.service import discover_assess_service
from .reasoning import request_advice
from .reviewer import request_review
from .settings import get_settings

router = APIRouter(prefix="/v1/migration-sessions", tags=["synthetic assisted analysis"])
CASE_ID = "account-clearing"


class AnalysisRequest(ReasoningRequest):
    confirmed: Literal[True]


class AnalysisResult(StrictModel):
    case_id: Literal["account-clearing"] = CASE_ID
    advisor: ReasoningRecord
    reviewer: ReviewRecord | None
    human_approval_required: Literal[True] = True
    financial_authority: Literal[False] = False


async def request_analysis(
    repository,
    owner,
    session_id,
    mapping_id,
    request,
    settings,
    advisor_provider=None,
    reviewer_provider=None,
):
    session = repository.get(session_id, owner)
    if session is None:
        raise HTTPException(404, "Workspace not found")
    if not settings.synthetic_analysis_enabled:
        raise HTTPException(409, "Synthetic assisted analysis is disabled; use the rule check.")
    if settings.model_provider_mode == "gemini-adk" and not settings.synthetic_beta_authorized:
        raise HTTPException(
            409, "Live synthetic inference requires explicit operator authorization."
        )
    mapping = next((m for m in session.mappings if m.id == mapping_id), None)
    if mapping is None or mapping.source_id != CASE_ID:
        raise HTTPException(409, "Only the synthetic 1200 · Misc Clearing case is supported.")
    try:
        review_context(session, mapping_id)  # Admission before reserving any model call.
    except ValueError as error:
        raise HTTPException(409, str(error)) from None
    advisor = await request_advice(
        repository,
        owner,
        session_id,
        Capability.MAPPING,
        request,
        settings,
        advisor_provider,
        mapping_id=mapping_id,
    )
    if advisor.state == "UNAVAILABLE":
        return AnalysisResult(advisor=advisor, reviewer=None)
    # A separate provider, role, fresh ADK session and independently projected source facts.
    # A fallback Advisor must not trigger a paid Reviewer of nonexistent model reasoning.
    review_settings = (
        settings.model_copy(update={"model_provider_mode": "deterministic-only"})
        if advisor.state == "FALLBACK"
        else settings
    )
    reviewer = await request_review(
        repository,
        owner,
        session_id,
        mapping_id,
        request,
        review_settings,
        reviewer_provider,
        advisor_request_id=advisor.request_id,
    )
    # A concurrent mapping change invalidates the pair, including the earlier Advisor panel.
    if reviewer.state == "UNAVAILABLE":
        advisor = advisor.model_copy(update={"state": "UNAVAILABLE", "advice": None})
    return AnalysisResult(advisor=advisor, reviewer=reviewer)


@router.post("/{session_id}/analysis/mapping/{mapping_id}", response_model=AnalysisResult)
async def generate(
    session_id: UUID,
    mapping_id: UUID,
    request: AnalysisRequest,
    principal: Annotated[Principal, Depends(require_principal)],
):
    return await request_analysis(
        discover_assess_service.repository,
        principal.subject,
        session_id,
        mapping_id,
        request,
        get_settings(),
    )
