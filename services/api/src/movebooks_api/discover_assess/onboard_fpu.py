"""Owner-scoped, versioned synthetic onboarding and FPU resources."""

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, ConfigDict

from agents.orchestrator.onboard_fpu import OnboardFpuOrchestrator
from domain.onboarding_fpu.models import DecisionInput, InvoiceInput
from domain.validation_configuration.models import ConfigurationDecision
from movebooks_api.auth import Principal, require_principal
from tools.activation.invoice import verify_accounting_impact
from tools.onboarding.checks import operating_context

from .demo_creation import create_demo
from .service import discover_assess_service as service
from .service import journey_evidence
from .validate_configure import build_demo, context
from .validate_configure import orchestrator as configure_orchestrator

router = APIRouter(prefix="/v1", tags=["onboard-fpu"])
Auth = Annotated[Principal, Depends(require_principal)]
orchestrator = OnboardFpuOrchestrator()


class DemoInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scenario: Literal[
        "clean",
        "posting_failure",
        "missing_customer",
        "missing_product",
        "invalid_tax",
        "invalid_mapping",
        "totals_mismatch",
        "missing_role",
        "incomplete_configuration",
        "verification_interrupted",
    ] = "clean"


def view(session, fixture):
    gate_error = None
    try:
        orchestrator.guard(session, fixture)
    except ValueError as error:
        gate_error = str(error)
    state = session.onboarding
    tasks = orchestrator.onboarding_agent.run(session) if state and not gate_error else []
    data, settings = (
        operating_context(session) if session.execution and session.configuration else ({}, {})
    )
    verified = orchestrator.verified(session, fixture) if state else False
    stale_success = session.workflow_status == "VERIFIED_FIRST_PRODUCTIVE_USE" and not verified
    balances = {}
    if state and state.fpu and state.fpu.journal and not gate_error:
        try:
            _, balances = verify_accounting_impact(session, state.fpu, state.fpu.journal)
        except (ValueError, KeyError, TypeError, ArithmeticError):
            balances = {}
    return {
        "session_id": session.id,
        "company_name": session.company_name,
        "workflow_status": session.workflow_status,
        "effective_status": "FIRST_PRODUCTIVE_USE_BLOCKED"
        if gate_error or stale_success
        else session.workflow_status,
        **journey_evidence(session),
        "gate_error": gate_error
        or ("Previously verified evidence changed; investigate." if stale_success else None),
        "tasks": tasks,
        "onboarding": state,
        "verified_fpu": verified,
        "ready": bool(tasks and all(t.status == "COMPLETED" for t in tasks) and not gate_error),
        "customers": data.get("customers", []),
        "products": data.get("products", []),
        "settings": settings,
        "accounting_impact": balances,
        "activity": session.activity[-12:],
    }


def mutate(session_id, principal, operation):
    session, fixture = context(session_id, principal)
    before = session.model_copy(deep=True)
    try:
        operation(session, fixture)
        service.repository.put_if_unchanged(before, session)
    except (ValueError, KeyError) as error:
        raise HTTPException(409, str(error)) from error
    return view(session, fixture)


@router.post("/onboarding-demo-sessions", status_code=201)
def demo(
    request: DemoInput,
    principal: Auth,
    idempotency_key: Annotated[str | None, Header(min_length=1, max_length=120)] = None,
):
    # Only prior synthetic approvals are replayed; onboarding/FPU still require the owner.
    def build(staged, creation_key):
        session = build_demo(staged, principal.subject, creation_key)
        fixture = staged.source_for(session)
        configure_orchestrator.validate(session, fixture)
        configure_orchestrator.configure(session, fixture)
        for proposal in session.configuration.proposals:
            if proposal.state != "APPLIED":
                configure_orchestrator.decide(
                    session,
                    fixture,
                    proposal.id,
                    ConfigurationDecision(action="approve", comment="Synthetic prior-stage replay"),
                    principal.subject,
                )
        configure_orchestrator.apply(session, fixture)
        orchestrator.start(
            session, fixture, [] if request.scenario == "clean" else [request.scenario]
        )
        return session

    return create_demo(
        service.repository,
        principal.subject,
        "onboarding",
        request.scenario,
        idempotency_key,
        build,
        lambda s: view(s, service.source_for(s)),
    )


@router.get("/migration-sessions/{session_id}/onboarding")
@router.get("/migration-sessions/{session_id}/fpu")
@router.get("/migration-sessions/{session_id}/fpu/readiness")
@router.get("/migration-sessions/{session_id}/fpu/verification")
def state(session_id: UUID, principal: Auth):
    return view(*context(session_id, principal))


@router.get("/migration-sessions/{session_id}/onboarding/blockers")
def blockers(session_id: UUID, principal: Auth):
    snapshot = view(*context(session_id, principal))
    return {
        "gate_error": snapshot["gate_error"],
        "tasks": [t for t in snapshot["tasks"] if t.status != "COMPLETED"],
    }


@router.post("/migration-sessions/{session_id}/onboarding")
def start(session_id: UUID, principal: Auth):
    return mutate(session_id, principal, orchestrator.start)


@router.post("/migration-sessions/{session_id}/onboarding/tasks/{task_id}/decision")
def decide_task(session_id: UUID, task_id: str, request: DecisionInput, principal: Auth):
    return mutate(
        session_id,
        principal,
        lambda s, f: orchestrator.decide_task(s, f, task_id, request, principal.subject),
    )


@router.post("/migration-sessions/{session_id}/fpu/task")
def prepare(session_id: UUID, request: InvoiceInput, principal: Auth):
    return mutate(
        session_id, principal, lambda s, f: orchestrator.prepare(s, f, request, principal.subject)
    )


@router.post("/migration-sessions/{session_id}/fpu/decision")
def decide_fpu(session_id: UUID, request: DecisionInput, principal: Auth):
    return mutate(
        session_id,
        principal,
        lambda s, f: orchestrator.decide_fpu(s, f, request, principal.subject),
    )


@router.post("/migration-sessions/{session_id}/fpu/execute")
def execute(
    session_id: UUID,
    principal: Auth,
    idempotency_key: Annotated[str, Header(min_length=1, max_length=120)],
):
    return mutate(
        session_id,
        principal,
        lambda s, f: orchestrator.execute(s, f, idempotency_key, principal.subject),
    )


@router.post("/migration-sessions/{session_id}/fpu/verify")
def verify(session_id: UUID, principal: Auth):
    return mutate(session_id, principal, orchestrator.finish_verification)


@router.post("/migration-sessions/{session_id}/onboarding/remediation")
def remediate(session_id: UUID, request: DecisionInput, principal: Auth):
    return mutate(
        session_id, principal, lambda s, f: orchestrator.remediate(s, f, request, principal.subject)
    )
