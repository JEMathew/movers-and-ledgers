"""Versioned HTTP contracts for the Discover → Assess vertical slice."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from domain.discovery_assessment.models import (
    AgentActivity,
    AssessmentResult,
    DiscoveryResult,
    Finding,
    MigrationSession,
    ProductEvent,
    ProductEventName,
)
from movebooks_api.auth import Principal, require_principal

from .fixtures import sample_company_catalog
from .service import (
    DiscoveryRequiredError,
    MigrationSessionNotFoundError,
    SampleCompanyNotFoundError,
    discover_assess_service,
)

router = APIRouter(prefix="/v1", tags=["discover-assess"])
AuthenticatedPrincipal = Annotated[Principal, Depends(require_principal)]


class CreateMigrationSessionRequest(BaseModel):
    sample_company_id: str = Field(min_length=1)


class RecordProductEventRequest(BaseModel):
    name: ProductEventName
    attributes: dict[str, str | int | bool] = Field(default_factory=dict)


def _not_found(error: LookupError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


def _conflict(error: RuntimeError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))


@router.get("/sample-companies")
async def list_sample_companies(principal: AuthenticatedPrincipal) -> list[dict[str, str | bool]]:
    del principal
    return sample_company_catalog()


@router.post(
    "/migration-sessions", response_model=MigrationSession, status_code=status.HTTP_201_CREATED
)
async def create_migration_session(
    request: CreateMigrationSessionRequest, principal: AuthenticatedPrincipal
) -> MigrationSession:
    try:
        return discover_assess_service.create_session(principal.subject, request.sample_company_id)
    except SampleCompanyNotFoundError as error:
        raise _not_found(error) from error


@router.get("/migration-sessions/{session_id}", response_model=MigrationSession)
async def get_migration_session(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> MigrationSession:
    try:
        return discover_assess_service.get_session(principal.subject, session_id)
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error


@router.post("/migration-sessions/{session_id}/discovery", response_model=DiscoveryResult)
async def run_discovery(session_id: UUID, principal: AuthenticatedPrincipal) -> DiscoveryResult:
    try:
        session = discover_assess_service.discover(principal.subject, session_id)
        assert session.discovery is not None
        return session.discovery
    except (MigrationSessionNotFoundError, SampleCompanyNotFoundError) as error:
        raise _not_found(error) from error


@router.get("/migration-sessions/{session_id}/discovery", response_model=DiscoveryResult)
async def get_discovery(session_id: UUID, principal: AuthenticatedPrincipal) -> DiscoveryResult:
    try:
        return discover_assess_service.get_discovery(principal.subject, session_id)
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    except DiscoveryRequiredError as error:
        raise _conflict(error) from error


@router.get("/migration-sessions/{session_id}/findings", response_model=list[Finding])
async def get_findings(session_id: UUID, principal: AuthenticatedPrincipal) -> list[Finding]:
    try:
        return discover_assess_service.get_discovery(principal.subject, session_id).findings
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    except DiscoveryRequiredError as error:
        raise _conflict(error) from error


@router.post("/migration-sessions/{session_id}/assessment", response_model=AssessmentResult)
async def run_assessment(session_id: UUID, principal: AuthenticatedPrincipal) -> AssessmentResult:
    try:
        session = discover_assess_service.assess(principal.subject, session_id)
        assert session.assessment is not None
        return session.assessment
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    except DiscoveryRequiredError as error:
        raise _conflict(error) from error


@router.get("/migration-sessions/{session_id}/assessment", response_model=AssessmentResult)
async def get_assessment(session_id: UUID, principal: AuthenticatedPrincipal) -> AssessmentResult:
    try:
        session = discover_assess_service.get_session(principal.subject, session_id)
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    if session.assessment is None:
        raise _conflict(DiscoveryRequiredError("Assessment has not run for this session"))
    return session.assessment


@router.get("/migration-sessions/{session_id}/activity", response_model=list[AgentActivity])
async def get_activity(session_id: UUID, principal: AuthenticatedPrincipal) -> list[AgentActivity]:
    try:
        return discover_assess_service.get_session(principal.subject, session_id).activity
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error


@router.post(
    "/migration-sessions/{session_id}/events",
    response_model=ProductEvent,
    status_code=status.HTTP_201_CREATED,
)
async def record_product_event(
    session_id: UUID, request: RecordProductEventRequest, principal: AuthenticatedPrincipal
) -> ProductEvent:
    if request.name is not ProductEventName.CONTINUE_TO_PLAN_SELECTED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Only customer-originated product events are accepted on this route",
        )
    try:
        return discover_assess_service.add_event(
            principal.subject, session_id, request.name, request.attributes
        )
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
