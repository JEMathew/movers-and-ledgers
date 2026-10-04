"""Full HTTP journeys: no slice/demo loaders, recreated manifests, or seeded approvals."""

from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from movebooks_api.auth import Principal, require_principal
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.main import app

from agents.orchestrator.onboard_fpu import OnboardFpuOrchestrator
from tools.activation.invoice import verification_checks
from tools.migration import stable_checksum

AUTH = {"Authorization": "Bearer demo-user"}
CASES = (
    "full_verified_fpu",
    "blocked_readiness",
    "mapping_rejection",
    "migration_failure_retry",
    "validation_mismatch_repair",
    "high_risk_configuration",
    "onboarding_prerequisite",
    "fpu_failure_retry",
    "model_unavailable",
    "checkpoint_resume",
    "duplicate_execution",
    "approval_attribution",
    "deterministic_repeatability",
    "unsafe_stage_bypass",
)


class Journey:
    def __init__(self, sample="harbor-light-migrate-demo"):
        self.client = TestClient(app)
        response = self.client.post(
            "/v1/migration-sessions", headers=AUTH, json={"sample_company_id": sample}
        )
        assert response.status_code == 201
        self.id = response.json()["id"]
        self.root = f"/v1/migration-sessions/{self.id}"

    def post(self, path, body=None, status=200, key=None):
        headers = {**AUTH, **({"Idempotency-Key": key} if key else {})}
        result = self.client.post(self.root + path, json=body, headers=headers)
        assert result.status_code == status, (path, result.text)
        return result.json()

    def get(self):
        response = self.client.get(self.root, headers=AUTH)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == self.id
        return data

    def inject_test_fault(self, operation):
        # Deliberate server-side fault injection only; no browser/API route exposes this.
        session = service.get_session("demo-user", UUID(self.id))
        before = session.model_copy(deep=True)
        operation(session)
        service.repository.put_if_unchanged(before, session)

    def prepare(self):
        self.post("/discovery")
        self.post("/assessment")
        self.post("/plan")
        self.post("/mappings")

    def approve_mappings(self):
        for mapping in self.get()["mappings"]:
            self.post(f"/mappings/{mapping['id']}/approve", {"comment": "Reviewed source evidence"})
        self.post("/plan", {"action": "approve", "plan_id": self.get()["plan"]["id"]})


@pytest.mark.parametrize("case", CASES)
def test_integrated_golden(case):
    journey = Journey(
        "northstar-supplies" if case == "blocked_readiness" else "harbor-light-migrate-demo"
    )
    if case == "unsafe_stage_bypass":
        for path in (
            "/assessment",
            "/plan",
            "/mappings",
            "/migration/start",
            "/validation",
            "/configuration",
            "/configuration/apply",
            "/onboarding",
            "/fpu/verify",
        ):
            journey.post(path, status=409, key="bypass")
        for name in (
            "mapping_approved",
            "migration_completed",
            "fpu_verified",
            "first_productive_use_completed",
        ):
            journey.post("/events", {"name": name}, status=422)
    journey.prepare()
    prepared = journey.get()
    if case == "blocked_readiness":
        assert prepared["assessment"]["blocker_count"] > 0
        assert prepared["plan"]["blockers"]
        journey.post("/migration/start", status=409, key="start")
        assert journey.get()["execution"] is None
        return
    if case == "mapping_rejection":
        for i, mapping in enumerate(prepared["mappings"]):
            journey.post(f"/mappings/{mapping['id']}/{'reject' if i == 0 else 'approve'}", {})
        journey.post("/migration/start", status=409, key="start")
        assert journey.get()["execution"] is None
        return
    journey.approve_mappings()
    approved = journey.get()
    execution = journey.post("/migration/start", key="canonical-migration")
    assert execution["status"] == "RESOLVING"
    assert execution["plan_id"] == prepared["plan"]["id"]
    assert execution["approved_mapping_ids"] == [m["id"] for m in approved["mappings"]]
    checkpoint = execution["checkpoints"][-1]
    completed_ids = checkpoint["completed_batch_ids"]
    if case == "duplicate_execution":
        assert journey.post("/migration/start", key="canonical-migration") == execution
        journey.post("/migration/start", key="different", status=409)
    journey.post("/migration/retry", status=409)
    resolution = execution["resolutions"][-1]
    journey.post(f"/migration/resolutions/{resolution['id']}/decision", {"approve": True})
    execution = journey.post("/migration/resume")
    assert execution["status"] == "MIGRATION_COMPLETE"
    assert execution["checkpoints"][0] == checkpoint
    assert all(b["attempt_count"] == 1 for b in execution["batches"] if b["id"] in completed_ids)
    assert len(execution["loaded_idempotency_keys"]) == len(execution["batches"]) == 8
    assert journey.get()["mappings"] == approved["mappings"]
    for entity in ("accounts", "customers", "vendors", "products", "taxes", "configuration"):
        for row in execution["target_state"][entity]:
            mapping = next(
                m for m in approved["mappings"] if m["id"] == row["approved_mapping"]["mapping_id"]
            )
            assert row["approved_mapping"]["selected_target"] == mapping["selected_target"]
    if case == "validation_mismatch_repair":
        journey.inject_test_fault(
            lambda s: s.execution.target_state["invoices"][0]["payload"].update(total="1.00")
        )
    validated = journey.post("/validation")
    if case == "validation_mismatch_repair":
        assert validated["report"]["status"] == "BLOCKED"
        journey.post("/configuration", status=409)
        proposed = journey.post(
            "/validation/resolutions", {"entity": "invoices", "record_id": "invoice-001"}
        )
        repair_id = proposed["repairs"][-1]["resolution_id"]
        journey.post(f"/validation/resolutions/{repair_id}/approve")
        journey.post("/configuration", status=409)
        validated = journey.post("/revalidation")
    assert validated["report"]["status"] == "VERIFIED"
    assert validated["report"]["target_checksum"] == stable_checksum(
        journey.get()["execution"]["target_state"]
    )
    configuration = journey.post("/configuration")["configuration"]
    journey.post("/configuration/apply", status=409)
    journey.post("/onboarding", status=409)
    for proposal in configuration["proposals"]:
        if proposal["state"] != "APPLIED":
            journey.post(f"/configuration/{proposal['id']}/decision", {"action": "approve"})
    configured = journey.post("/configuration/apply")
    assert configured["ready_for_onboarding"]
    onboard = journey.post("/onboarding")
    journey.post(
        "/fpu/task", {"customer_id": "customer-001", "product_id": "product-001"}, status=409
    )
    for task in onboard["tasks"]:
        if task["approval_required"]:
            journey.post(f"/onboarding/tasks/{task['id']}/decision", {"action": "approve"})
    faults = {
        "onboarding_prerequisite": "missing_role",
        "fpu_failure_retry": "posting_failure",
        "checkpoint_resume": "verification_interrupted",
    }
    if case in faults:
        journey.inject_test_fault(lambda s: s.onboarding.faults.append(faults[case]))
    if case == "onboarding_prerequisite":
        journey.post(
            "/fpu/task", {"customer_id": "customer-001", "product_id": "product-001"}, status=409
        )
        journey.post("/onboarding/remediation", {"action": "approve"})
    journey.post("/fpu/task", {"customer_id": "customer-001", "product_id": "product-001"})
    journey.post("/fpu/decision", {"action": "approve"})
    result = journey.post("/fpu/execute", key="canonical-invoice")
    if case == "fpu_failure_retry":
        assert not result["verified_fpu"] and not result["onboarding"]["invoices"]
        journey.post("/onboarding/remediation", {"action": "approve"})
        result = journey.post("/fpu/execute", key="canonical-invoice")
    if case == "checkpoint_resume":
        assert not result["verified_fpu"]
        assert result["onboarding"]["fpu"]["checkpoint"] == "POSTED"
        result = journey.post("/fpu/execute", key="canonical-invoice")
        assert result["onboarding"]["fpu"]["attempts"] == 1
    assert result["verified_fpu"], result
    final = journey.get()
    assert final["discovery"] == prepared["discovery"]
    assert final["assessment"] == prepared["assessment"]
    assert final["plan"] == approved["plan"]
    assert {k: v for k, v in final["plan"].items() if k != "approval"} == {
        k: v for k, v in prepared["plan"].items() if k != "approval"
    }
    assert final["mappings"] == approved["mappings"]
    assert len(final["onboarding"]["invoices"]) == len(final["onboarding"]["journals"]) == 1
    assert final["onboarding"]["fpu"]["invoice"]["total"] == "107.25"
    assert {d["stage"] for d in final["human_decisions"]} >= {
        "map_approve",
        "resolve",
        "configure",
        "onboard",
        "first_productive_use",
    }
    for decision in final["human_decisions"]:
        assert decision["actor"] == "demo-user" and decision["role"] == "DEMO_WORKSPACE_OWNER"
        assert all(
            decision[k] for k in ("occurred_at", "decision", "evidence", "stage", "affected_entity")
        )
    # Browser refresh and replay of earlier endpoints may not rewind or regenerate evidence.
    for path in ("/discovery", "/assessment", "/plan", "/mappings"):
        journey.post(path)
    journey.post("/fpu/execute", key="canonical-invoice")
    assert journey.get() == final
    if case == "deterministic_repeatability":
        session = service.get_session("demo-user", UUID(journey.id))
        assert verification_checks(session) == verification_checks(session.model_copy(deep=True))
    if case == "model_unavailable":
        flow = OnboardFpuOrchestrator()
        assert flow.onboarding_agent.active_provider == "deterministic-fallback"


def test_integrated_owner_and_forged_decision_boundary():
    journey = Journey()
    journey.prepare()
    mapping = journey.get()["mappings"][0]
    journey.post(f"/mappings/{mapping['id']}/approve", {"actor": "forged"}, status=422)
    app.dependency_overrides[require_principal] = lambda: Principal(
        subject="other", email="other@example.test"
    )
    try:
        for path in ("", "/activity", "/onboarding", "/validation-configuration", "/migration"):
            assert journey.client.get(journey.root + path, headers=AUTH).status_code == 404
        journey.post("/discovery", status=404)
    finally:
        app.dependency_overrides.clear()


def test_early_stage_concurrent_write_is_conflict_not_lost_approval(monkeypatch):
    journey = Journey()
    journey.post("/discovery")
    original = service.assessment_agent.run

    def concurrent(*args):
        from domain.discovery_assessment.models import ProductEventName

        service.add_event(
            "demo-user", UUID(journey.id), ProductEventName.CONTINUE_TO_PLAN_SELECTED, {}
        )
        return original(*args)

    monkeypatch.setattr(service.assessment_agent, "run", concurrent)
    journey.post("/assessment", status=409)
    assert journey.get()["assessment"] is None
    assert journey.get()["events"][-1]["name"] == "continue_to_plan_selected"


@pytest.mark.parametrize("stage", ["start", "resume"])
def test_stale_approved_manifest_cannot_load(stage):
    journey = Journey()
    journey.prepare()
    journey.approve_mappings()
    if stage == "resume":
        execution = journey.post("/migration/start", key="guard")
        journey.post(
            f"/migration/resolutions/{execution['resolutions'][-1]['id']}/decision",
            {"approve": True},
        )
    journey.inject_test_fault(
        lambda s: setattr(s.mappings[0], "selected_target", "Unapproved account")
    )
    before = journey.get()
    journey.post(f"/migration/{stage}", key="guard", status=409)
    assert journey.get() == before


def test_approval_cannot_authorize_unimplemented_currency_conversion():
    journey = Journey()
    journey.prepare()
    for mapping in journey.get()["mappings"]:
        if mapping["source_label"] == "base_currency":
            journey.post(f"/mappings/{mapping['id']}/modify", {"selected_target": "EUR"})
        else:
            journey.post(f"/mappings/{mapping['id']}/approve", {})
    before = journey.get()
    journey.post("/plan", {"action": "approve", "plan_id": before["plan"]["id"]}, status=409)
    assert journey.get() == before
    journey.post("/migration/start", key="unsupported", status=409)
    assert journey.get()["execution"] is None


def test_integrated_advisory_adk_contracts(monkeypatch):
    import sys
    from types import SimpleNamespace

    from agents.migration.adk import MigrationExplanation, build_migration_agent
    from agents.model_policy import route_for
    from agents.resolution.adk import ResolutionGuidance, build_resolution_agent

    class Definition:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)

    monkeypatch.setitem(sys.modules, "google.adk.agents", SimpleNamespace(Agent=Definition))
    callback = lambda *_: None  # noqa: E731
    for builder, schema, capability in (
        (build_migration_agent, MigrationExplanation, "customer_explanation"),
        (build_resolution_agent, ResolutionGuidance, "resolution_reasoning"),
    ):
        definition = builder(before_agent_callback=callback, after_agent_callback=callback)
        assert definition.model == route_for(capability).model
        assert definition.output_schema is schema
        assert definition.output_key
        assert definition.before_agent_callback is definition.after_agent_callback is callback
        assert not hasattr(definition, "tools")
    for capability in (
        "migration_execution",
        "financial_reconciliation",
        "productive_use_verification",
        "governance_decision",
    ):
        assert route_for(capability).model is None
