"""Versioned HTTP contracts for the implemented migration journey."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from agents.orchestrator import WorkflowTransitionError
from domain.discovery_assessment.models import (
    AgentActivity,
    AssessmentResult,
    DiscoveryResult,
    Finding,
    MigrationSession,
    ProductEvent,
    ProductEventName,
)
from domain.migration_resolution.models import (
    MigrationBatch,
    MigrationExecution,
    MigrationFailure,
    ResolutionDecision,
    ResolutionProposal,
)
from domain.planning_mapping.models import (
    MappingDecision,
    MappingProposal,
    MappingState,
    MigrationPlan,
)
from movebooks_api.auth import Principal, require_principal
from tools.mapping import MappingPolicyError

from .fixtures import sample_company_catalog
from .service import (
    DiscoveryRequiredError,
    MigrationSessionNotFoundError,
    SampleCompanyNotFoundError,
    discover_assess_service,
)

router = APIRouter(prefix="/v1", tags=["migration-journey"])
AuthenticatedPrincipal = Annotated[Principal, Depends(require_principal)]


class CreateMigrationSessionRequest(BaseModel):
    sample_company_id: str = Field(min_length=1)


class RecordProductEventRequest(BaseModel):
    name: ProductEventName
    attributes: dict[str, str | int | bool] = Field(default_factory=dict)


class ModifyMappingRequest(BaseModel):
    selected_target: str = Field(min_length=1)
    comment: str | None = None


class MappingCommentRequest(BaseModel):
    comment: str | None = None


class ResolutionDecisionRequest(BaseModel):
    approve: bool
    comment: str | None = None


def _not_found(error: LookupError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


def _conflict(error: Exception) -> HTTPException:
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


@router.post("/migration-sessions/{session_id}/plan", response_model=MigrationPlan)
async def create_plan(session_id: UUID, principal: AuthenticatedPrincipal) -> MigrationPlan:
    try:
        session = discover_assess_service.plan(principal.subject, session_id)
        assert session.plan is not None
        return session.plan
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    except (DiscoveryRequiredError, WorkflowTransitionError) as error:
        raise _conflict(error) from error


@router.get("/migration-sessions/{session_id}/plan", response_model=MigrationPlan)
async def get_plan(session_id: UUID, principal: AuthenticatedPrincipal) -> MigrationPlan:
    try:
        return discover_assess_service.get_plan(principal.subject, session_id)
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    except DiscoveryRequiredError as error:
        raise _conflict(error) from error


@router.get("/migration-sessions/{session_id}/plan/status")
async def get_plan_status(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> dict[str, str | int]:
    try:
        plan = discover_assess_service.get_plan(principal.subject, session_id)
        return {
            "status": plan.status.value,
            "version": plan.version,
            "phase_count": len(plan.phases),
        }
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    except DiscoveryRequiredError as error:
        raise _conflict(error) from error


@router.post("/migration-sessions/{session_id}/mappings", response_model=list[MappingProposal])
async def create_mappings(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> list[MappingProposal]:
    try:
        return discover_assess_service.map(principal.subject, session_id).mappings
    except (MigrationSessionNotFoundError, SampleCompanyNotFoundError) as error:
        raise _not_found(error) from error
    except WorkflowTransitionError as error:
        raise _conflict(error) from error


@router.get("/migration-sessions/{session_id}/mappings", response_model=list[MappingProposal])
async def get_mappings(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> list[MappingProposal]:
    try:
        return discover_assess_service.get_mappings(principal.subject, session_id)
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    except DiscoveryRequiredError as error:
        raise _conflict(error) from error


@router.get(
    "/migration-sessions/{session_id}/mappings/{mapping_id}/evidence",
    response_model=list[str],
)
async def get_mapping_evidence(
    session_id: UUID, mapping_id: UUID, principal: AuthenticatedPrincipal
) -> list[str]:
    mappings = await get_mappings(session_id, principal)
    mapping = next((item for item in mappings if item.id == mapping_id), None)
    if mapping is None:
        raise _not_found(MigrationSessionNotFoundError(str(mapping_id)))
    return mapping.evidence


async def _decide_mapping(
    session_id: UUID,
    mapping_id: UUID,
    decision: MappingDecision,
    principal: Principal,
) -> MappingProposal:
    try:
        session = discover_assess_service.decide_mapping(
            principal.subject, session_id, mapping_id, decision
        )
        return next(item for item in session.mappings if item.id == mapping_id)
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    except (MappingPolicyError, WorkflowTransitionError) as error:
        raise _conflict(error) from error


@router.post(
    "/migration-sessions/{session_id}/mappings/{mapping_id}/approve",
    response_model=MappingProposal,
)
async def approve_mapping(
    session_id: UUID,
    mapping_id: UUID,
    request: MappingCommentRequest,
    principal: AuthenticatedPrincipal,
) -> MappingProposal:
    return await _decide_mapping(
        session_id,
        mapping_id,
        MappingDecision(decision=MappingState.APPROVED, comment=request.comment),
        principal,
    )


@router.post(
    "/migration-sessions/{session_id}/mappings/{mapping_id}/reject",
    response_model=MappingProposal,
)
async def reject_mapping(
    session_id: UUID,
    mapping_id: UUID,
    request: MappingCommentRequest,
    principal: AuthenticatedPrincipal,
) -> MappingProposal:
    return await _decide_mapping(
        session_id,
        mapping_id,
        MappingDecision(decision=MappingState.REJECTED, comment=request.comment),
        principal,
    )


@router.post(
    "/migration-sessions/{session_id}/mappings/{mapping_id}/modify",
    response_model=MappingProposal,
)
async def modify_mapping(
    session_id: UUID,
    mapping_id: UUID,
    request: ModifyMappingRequest,
    principal: AuthenticatedPrincipal,
) -> MappingProposal:
    return await _decide_mapping(
        session_id,
        mapping_id,
        MappingDecision(
            decision=MappingState.MODIFIED,
            selected_target=request.selected_target,
            comment=request.comment,
        ),
        principal,
    )


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


@router.post(
    "/migration-demo-sessions",
    response_model=MigrationSession,
    status_code=status.HTTP_201_CREATED,
)
async def create_migration_demo_session(
    principal: AuthenticatedPrincipal,
) -> MigrationSession:
    """Load a synthetic manifest whose earlier approvals are part of the demo fixture."""
    return discover_assess_service.create_migration_demo_session(principal.subject)


@router.post(
    "/migration-sessions/{session_id}/migration/start",
    response_model=MigrationExecution,
)
async def start_migration(
    session_id: UUID,
    principal: AuthenticatedPrincipal,
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=1)],
) -> MigrationExecution:
    try:
        session = discover_assess_service.start_migration(
            principal.subject, session_id, idempotency_key
        )
        assert session.execution is not None
        return session.execution
    except (MigrationSessionNotFoundError, SampleCompanyNotFoundError) as error:
        raise _not_found(error) from error
    except (WorkflowTransitionError, ValueError) as error:
        raise _conflict(error) from error


@router.get(
    "/migration-sessions/{session_id}/migration",
    response_model=MigrationExecution,
)
async def get_migration(session_id: UUID, principal: AuthenticatedPrincipal) -> MigrationExecution:
    try:
        return discover_assess_service.get_execution(principal.subject, session_id)
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    except DiscoveryRequiredError as error:
        raise _conflict(error) from error


@router.get("/migration-sessions/{session_id}/migration/progress")
async def get_migration_progress(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> dict[str, str | int | bool | None]:
    execution = await get_migration(session_id, principal)
    return {
        "status": execution.status.value,
        "progress_percent": execution.progress_percent,
        "current_batch_id": execution.current_batch_id,
        "current_agent": execution.current_agent,
        "safe_to_validate": execution.safe_to_validate,
        "unresolved_blocking_failures": execution.unresolved_blocking_failures,
    }


@router.get(
    "/migration-sessions/{session_id}/migration/batches",
    response_model=list[MigrationBatch],
)
async def get_migration_batches(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> list[MigrationBatch]:
    return (await get_migration(session_id, principal)).batches


@router.get(
    "/migration-sessions/{session_id}/migration/failures",
    response_model=list[MigrationFailure],
)
async def get_migration_failures(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> list[MigrationFailure]:
    return (await get_migration(session_id, principal)).failures


@router.get(
    "/migration-sessions/{session_id}/migration/resolutions",
    response_model=list[ResolutionProposal],
)
async def get_migration_resolutions(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> list[ResolutionProposal]:
    try:
        return discover_assess_service.get_resolutions(principal.subject, session_id)
    except MigrationSessionNotFoundError as error:
        raise _not_found(error) from error
    except DiscoveryRequiredError as error:
        raise _conflict(error) from error


@router.post(
    "/migration-sessions/{session_id}/migration/resolutions/{resolution_id}/decision",
    response_model=MigrationExecution,
)
async def decide_resolution(
    session_id: UUID,
    resolution_id: UUID,
    request: ResolutionDecisionRequest,
    principal: AuthenticatedPrincipal,
) -> MigrationExecution:
    try:
        session = discover_assess_service.decide_resolution(
            principal.subject,
            session_id,
            resolution_id,
            ResolutionDecision(approve=request.approve, comment=request.comment),
        )
        assert session.execution is not None
        return session.execution
    except (MigrationSessionNotFoundError, LookupError) as error:
        raise _not_found(error) from error
    except (WorkflowTransitionError, ValueError) as error:
        raise _conflict(error) from error


@router.post(
    "/migration-sessions/{session_id}/migration/retry",
    response_model=MigrationExecution,
)
async def retry_migration(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> MigrationExecution:
    try:
        session = discover_assess_service.retry_migration(principal.subject, session_id)
        assert session.execution is not None
        return session.execution
    except (MigrationSessionNotFoundError, SampleCompanyNotFoundError) as error:
        raise _not_found(error) from error
    except (WorkflowTransitionError, ValueError) as error:
        raise _conflict(error) from error


@router.post(
    "/migration-sessions/{session_id}/migration/resume",
    response_model=MigrationExecution,
)
async def resume_migration(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> MigrationExecution:
    """Resume a retry-pending execution from its recorded checkpoint."""
    return await retry_migration(session_id, principal)


@router.get("/migration-sessions/{session_id}/migration/target")
async def get_synthetic_target(
    session_id: UUID, principal: AuthenticatedPrincipal
) -> dict[str, list[dict[str, object]]]:
    return (await get_migration(session_id, principal)).target_state
