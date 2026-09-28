"""Cloud-owner role parity without changing identity, approvals, or financial evidence."""

from copy import deepcopy

import pytest
from movebooks_api.discover_assess.fixtures import load_sample_company
from movebooks_api.discover_assess.service import (
    DiscoverAssessService,
    InMemoryMigrationSessionRepository,
)
from movebooks_api.runtime.persistence import decode, encode

from agents.orchestrator import MigrateResolveOrchestrator
from agents.orchestrator.onboard_fpu import OnboardFpuOrchestrator
from agents.orchestrator.validate_configure import ValidateConfigureOrchestrator
from domain.onboarding_fpu.models import DecisionInput, InvoiceInput
from domain.planning_mapping.models import WorkflowStatus
from domain.validation_configuration.models import ConfigurationDecision
from tools.onboarding.checks import TASKS


def configured(owner):
    service = DiscoverAssessService(InMemoryMigrationSessionRepository())
    session = service.create_migration_demo_session(owner)
    fixture = deepcopy(load_sample_company(session.sample_company_id))
    fixture.pop("migration_controls")
    MigrateResolveOrchestrator().start(session, fixture, "cloud-role-regression")
    prior = ValidateConfigureOrchestrator()
    prior.validate(session, fixture)
    prior.configure(session, fixture)
    for proposal in session.configuration.proposals:
        if proposal.state != "APPLIED":
            prior.decide(
                session, fixture, proposal.id, ConfigurationDecision(action="approve"), owner
            )
    prior.apply(session, fixture)
    flow = OnboardFpuOrchestrator()
    flow.start(session, fixture)
    for key, (_, choices) in TASKS.items():
        if choices:
            flow.decide_task(session, fixture, key, DecisionInput(action="approve"), owner)
    return flow, session, fixture


@pytest.mark.parametrize(
    "owner,role", [("owner", "DEMO_WORKSPACE_OWNER"), ("firebase:synthetic-a", "WORKSPACE_OWNER")]
)
def test_owner_approvals_survive_codec_and_reach_verified_fpu(owner, role):
    flow, session, fixture = configured(owner)
    history = deepcopy(session.onboarding.decisions)
    events = deepcopy(session.events)
    assert flow.refresh(session, fixture)
    assert all(t.status == "COMPLETED" for t in session.onboarding.tasks)
    assert all(d.role == role for values in history.values() for d in values)
    session = decode(encode(session), owner)
    assert flow.refresh(session, fixture)
    assert session.onboarding.decisions == history
    assert session.events == events
    flow.prepare(
        session, fixture, InvoiceInput(customer_id="customer-001", product_id="product-001"), owner
    )
    assert not session.onboarding.invoices
    flow.decide_fpu(session, fixture, DecisionInput(action="approve"), owner)
    assert session.events[-1].attributes["role"] == role
    flow.execute(session, fixture, "cloud-owner-fpu", owner)
    assert flow.verified(session, fixture)
    assert session.onboarding.fpu.invoice["total"] == "107.25"
    history = deepcopy(session.onboarding.decisions)
    session = decode(encode(session), owner)
    before = session.model_copy(deep=True)
    flow.execute(session, fixture, "cloud-owner-fpu", owner)
    assert session == before
    assert session.onboarding.decisions == history
    assert len(session.onboarding.invoices) == len(session.onboarding.journals) == 1


@pytest.mark.parametrize(
    "owner,bad_role",
    [
        ("firebase:synthetic-a", "DEMO_WORKSPACE_OWNER"),
        ("owner", "WORKSPACE_OWNER"),
        ("firebase:synthetic-a", "READ_ONLY"),
    ],
)
def test_mismatched_onboarding_role_cannot_authorize(owner, bad_role):
    flow, session, fixture = configured(owner)
    session.onboarding.decisions["role_access"][-1].role = bad_role
    assert not flow.refresh(session, fixture)
    with pytest.raises(ValueError, match="prerequisite"):
        flow.prepare(
            session,
            fixture,
            InvoiceInput(customer_id="customer-001", product_id="product-001"),
            owner,
        )
    assert not session.onboarding.invoices


def test_cloud_other_owner_cannot_approve_or_prepare():
    flow, session, fixture = configured("firebase:synthetic-a")
    before = session.model_copy(deep=True)
    with pytest.raises(ValueError, match="authenticated workspace owner"):
        flow.decide_task(
            session, fixture, "bank_setup", DecisionInput(action="approve"), "firebase:synthetic-b"
        )
    with pytest.raises(ValueError, match="authenticated workspace owner"):
        flow.prepare(
            session,
            fixture,
            InvoiceInput(customer_id="customer-001", product_id="product-001"),
            "firebase:synthetic-b",
        )
    assert session == before


@pytest.mark.parametrize("bad_role", ["DEMO_WORKSPACE_OWNER", "READ_ONLY", "ADMIN"])
def test_cloud_invoice_wrong_role_cannot_post_or_verify(bad_role):
    owner = "firebase:synthetic-a"
    flow, session, fixture = configured(owner)
    flow.prepare(
        session, fixture, InvoiceInput(customer_id="customer-001", product_id="product-001"), owner
    )
    flow.decide_fpu(session, fixture, DecisionInput(action="approve"), owner)
    session.onboarding.fpu.decisions[-1].role = bad_role
    flow.execute(session, fixture, "invalid-role", owner)
    assert not session.onboarding.invoices
    assert session.onboarding.fpu.attempts == 0
    assert not flow.verified(session, fixture)
    flow.decide_fpu(session, fixture, DecisionInput(action="approve"), owner)
    flow.execute(session, fixture, "invalid-role", owner)
    assert flow.verified(session, fixture)
    session.onboarding.fpu.decisions[-1].role = bad_role
    assert not flow.verified(session, fixture)


@pytest.mark.parametrize("mutation", ["actor", "evidence", "reject", "read_only"])
def test_cloud_approval_still_requires_owner_current_evidence_and_consent(mutation):
    flow, session, fixture = configured("firebase:synthetic-a")
    decision = session.onboarding.decisions["role_access"][-1]
    if mutation == "actor":
        decision.actor = "firebase:synthetic-b"
    elif mutation == "evidence":
        decision.evidence_hash = "stale"
    elif mutation == "reject":
        decision.action = "reject"
    else:
        decision.selection = "READ_ONLY"
    assert not flow.refresh(session, fixture)
    assert not session.onboarding.invoices


def test_cloud_remediation_audit_uses_authenticated_owner_role():
    flow, session, fixture = configured("firebase:synthetic-a")
    session.onboarding.faults = ["posting_failure"]
    flow.remediate(session, fixture, DecisionInput(action="approve"), "firebase:synthetic-a")
    assert session.onboarding.fault_history[-1]["role"] == "WORKSPACE_OWNER"
    assert session.onboarding.fault_history[-1]["actor"] == session.owner_subject


def test_pre_fix_pending_projection_recovers_without_reapproving_history():
    flow, session, fixture = configured("firebase:synthetic-a")
    # The old deployed predicate left persisted projections pending despite valid decisions.
    session.workflow_status = WorkflowStatus.ONBOARDING
    session.onboarding.completed_task_ids = [
        "customer_vendor",
        "product_service",
        "first_report",
        "first_reconciliation",
    ]
    for task in session.onboarding.tasks:
        if task.approval_required or task.id == "checklist":
            task.status = "REVIEW_REQUIRED"
    session = decode(encode(session), session.owner_subject)
    decisions = deepcopy(session.onboarding.decisions)
    prior_events = deepcopy(session.events)
    assert flow.refresh(session, fixture)
    assert session.workflow_status == WorkflowStatus.READY_FOR_FIRST_PRODUCTIVE_USE
    assert session.onboarding.decisions == decisions
    assert session.events[: len(prior_events)] == prior_events
    assert session.onboarding.fpu is None
