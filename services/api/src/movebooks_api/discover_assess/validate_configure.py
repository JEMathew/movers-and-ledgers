"""Owner-scoped Validate → Configure resources, sharing the existing session repository."""

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from agents.orchestrator.validate_configure import ValidateConfigureOrchestrator
from domain.migration_resolution.models import ResolutionDecision
from domain.validation_configuration.models import ConfigurationDecision
from movebooks_api.auth import Principal, require_principal

from .demo_creation import create_demo
from .fixtures import load_sample_company
from .service import discover_assess_service as service
from .service import journey_evidence

router = APIRouter(prefix="/v1", tags=["validate-configure"])
PrincipalDependency = Annotated[Principal, Depends(require_principal)]
orchestrator = ValidateConfigureOrchestrator()


class DemoRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scenario: Literal["clean", "ar_discrepancy"] = "ar_discrepancy"


class RepairRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    entity: str = Field(min_length=1, max_length=80)
    record_id: str = Field(min_length=1, max_length=120)


def context(session_id: UUID, principal: Principal):
    try:
        session = service.get_session(principal.subject, session_id)
    except LookupError as error:
        raise HTTPException(404, "Migration session not found") from error
    fixture = service.source_for(session)
    if fixture is None:
        raise HTTPException(409, "Source evidence is unavailable")
    return session, fixture


def view(session, fixture):
    report = session.validation_reports[-1] if session.validation_reports else None
    return {
        "session_id": session.id,
        "company_name": session.company_name,
        "workflow_status": session.workflow_status,
        **journey_evidence(session),
        "report": report,
        "configuration": session.configuration,
        "activity": session.activity[-12:],
        "repairs": session.validation_repairs,
        "resolutions": session.execution.resolutions if session.execution else [],
        "ready_for_onboarding": orchestrator.can_handoff(session, fixture),
    }


def build_demo(staged, owner, creation_key=None):
    """Replay prior synthetic approvals in a private repository, using normal CAS steps."""
    session = staged.create_migration_demo_session(owner, creation_key)
    session = staged.start_migration(owner, session.id, f"validation-demo:{session.id}")
    staged.decide_resolution(
        owner,
        session.id,
        session.execution.resolutions[-1].id,
        ResolutionDecision(approve=True, comment="Synthetic scenario replay"),
    )
    return staged.retry_migration(owner, session.id)


@router.post("/validation-demo-sessions", status_code=201)
def demo(
    request: DemoRequest,
    principal: PrincipalDependency,
    idempotency_key: Annotated[str | None, Header(min_length=1, max_length=120)] = None,
):
    """Publish one complete synthetic replay; keyed retries only read the existing session."""

    def build(staged, creation_key):
        session = build_demo(staged, principal.subject, creation_key)
        if request.scenario == "ar_discrepancy":
            session.execution.target_state["invoices"][0]["payload"]["total"] = "400.00"
        return session

    return create_demo(
        service.repository,
        principal.subject,
        "validation",
        request.scenario,
        idempotency_key,
        build,
        lambda s: view(s, load_sample_company(s.sample_company_id)),
    )


@router.get("/migration-sessions/{session_id}/validation-configuration")
def state(session_id: UUID, principal: PrincipalDependency):
    return view(*context(session_id, principal))


def mutate(session_id, principal, operation):
    session, fixture = context(session_id, principal)
    original = session.model_copy(deep=True)
    try:
        operation(session, fixture)
        service.repository.put_if_unchanged(original, session)
    except LookupError as error:
        raise HTTPException(404, str(error)) from error
    except ValueError as error:
        raise HTTPException(409, str(error)) from error
    return view(session, fixture)


@router.post("/migration-sessions/{session_id}/validation")
@router.post("/migration-sessions/{session_id}/revalidation")
def validate(session_id: UUID, principal: PrincipalDependency):
    return mutate(session_id, principal, orchestrator.validate)


@router.get("/migration-sessions/{session_id}/validation")
def report(session_id: UUID, principal: PrincipalDependency):
    session, _ = context(session_id, principal)
    if not session.validation_reports:
        raise HTTPException(409, "Run validation first")
    return session.validation_reports[-1]


@router.get("/migration-sessions/{session_id}/validation/checks")
def checks(session_id: UUID, principal: PrincipalDependency):
    return report(session_id, principal).checks


@router.get("/migration-sessions/{session_id}/validation/discrepancies")
def discrepancies(session_id: UUID, principal: PrincipalDependency):
    return [c for c in report(session_id, principal).checks if c.status != "VERIFIED"]


@router.post("/migration-sessions/{session_id}/validation/resolutions")
def propose_repair(session_id: UUID, request: RepairRequest, principal: PrincipalDependency):
    return mutate(
        session_id,
        principal,
        lambda s, f: orchestrator.propose_repair(s, f, request.entity, request.record_id),
    )


@router.post("/migration-sessions/{session_id}/validation/resolutions/{resolution_id}/approve")
def repair(session_id: UUID, resolution_id: UUID, principal: PrincipalDependency):
    return mutate(
        session_id,
        principal,
        lambda s, f: orchestrator.repair(s, f, resolution_id, principal.subject),
    )


@router.post("/migration-sessions/{session_id}/configuration")
def configure(session_id: UUID, principal: PrincipalDependency):
    return mutate(session_id, principal, orchestrator.configure)


@router.get("/migration-sessions/{session_id}/configuration")
def configuration(session_id: UUID, principal: PrincipalDependency):
    session, fixture = context(session_id, principal)
    if not session.configuration:
        raise HTTPException(409, "Generate configuration after successful validation")
    return {
        "plan": session.configuration,
        "ready_for_onboarding": orchestrator.can_handoff(session, fixture),
    }


@router.post("/migration-sessions/{session_id}/configuration/{proposal_id}/decision")
def decide(
    session_id: UUID,
    proposal_id: UUID,
    request: ConfigurationDecision,
    principal: PrincipalDependency,
):
    return mutate(
        session_id,
        principal,
        lambda s, f: orchestrator.decide(s, f, proposal_id, request, principal.subject),
    )


@router.get("/migration-sessions/{session_id}/configuration/{proposal_id}/explanation")
def explanation(session_id: UUID, proposal_id: UUID, principal: PrincipalDependency):
    session, _ = context(session_id, principal)
    proposals = session.configuration.proposals if session.configuration else []
    proposal = next((p for p in proposals if p.id == proposal_id), None)
    if proposal is None:
        raise HTTPException(404, "Configuration proposal not found")
    return {
        "explanation": proposal.explanation,
        "evidence": proposal.evidence,
        "policy_reason": proposal.policy_reason,
        "provenance": "DETERMINISTIC",
    }


@router.post("/migration-sessions/{session_id}/configuration/apply")
def apply(session_id: UUID, principal: PrincipalDependency):
    return mutate(session_id, principal, orchestrator.apply)
