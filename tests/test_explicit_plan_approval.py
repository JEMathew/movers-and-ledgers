"""Plan consent is separate from mapping review and is bound to server evidence."""

from uuid import UUID

import pytest
from movebooks_api.discover_assess.service import discover_assess_service as service
from test_beta_v1_integration import Journey


def reviewed_journey():
    j = Journey()
    j.prepare()
    for mapping in j.get()["mappings"]:
        j.post(f"/mappings/{mapping['id']}/approve", {})
    return j


def test_last_mapping_does_not_approve_plan_or_allow_writes():
    j = reviewed_journey()
    before = j.get()
    assert before["workflow_status"] == "AWAITING_APPROVAL"
    assert before["plan"]["approval"] is None
    j.post("/migration/start", key="not-consented", status=409)
    assert j.get() == before


def test_explicit_plan_consent_is_attributed_bound_and_idempotent():
    j = reviewed_journey()
    before = j.get()
    plan = j.post("/plan", {"action": "approve", "plan_id": before["plan"]["id"]})
    approval = plan["approval"]
    after = j.get()
    assert after["workflow_status"] == "APPROVED"
    assert approval["actor"] == "demo-user"
    assert approval["approved_at"]
    assert approval["plan_id"] == plan["id"]
    assert len(approval["mapping_decision_ids"]) == len(before["mappings"])
    audit = next(d for d in after["human_decisions"] if d["id"] == approval["decision_id"])
    assert audit["decision"] == "PLAN_APPROVED" and audit["actor"] == approval["actor"]
    assert audit["occurred_at"] == approval["approved_at"]
    assert after["execution"] is None
    assert j.post("/plan", {"action": "approve", "plan_id": plan["id"]}) == plan
    assert j.get() == after
    j.post("/migration/start", key="consented")


@pytest.mark.parametrize(
    "fault",
    [
        "pending",
        "rejected",
        "blocked",
        "assessment_blocked",
        "wrong_plan",
        "foreign_actor",
        "missing_mapping",
    ],
)
def test_plan_gate_is_atomic(fault):
    j = reviewed_journey()

    def inject(s):
        if fault == "missing_mapping":
            s.mappings.pop()
        elif fault == "blocked":
            s.plan.blockers.append("Source reference cannot be waived")
        elif fault == "assessment_blocked":
            s.assessment.blocker_count = 1
        elif fault in {"pending", "rejected"}:
            from domain.planning_mapping.models import MappingState

            s.mappings[0].state = (
                MappingState.REVIEW_REQUIRED if fault == "pending" else MappingState.REJECTED
            )

    j.inject_test_fault(inject)
    before = j.get()
    plan_id = (
        "11111111-1111-4111-8111-111111111111" if fault == "wrong_plan" else before["plan"]["id"]
    )
    if fault == "foreign_actor":
        with pytest.raises(LookupError):
            service.approve_plan("foreign-owner", UUID(j.id), UUID(plan_id))
    else:
        j.post("/plan", {"action": "approve", "plan_id": plan_id}, status=409)
    assert j.get() == before


def test_approval_request_cannot_supply_audit_identity_or_timestamp():
    j = reviewed_journey()
    before = j.get()
    j.post(
        "/plan",
        {"action": "approve", "plan_id": before["plan"]["id"], "actor": "forged"},
        status=422,
    )
    j.post("/plan", {"action": "approve"}, status=422)
    assert j.get() == before


def test_summary_uses_execution_batch_order_and_real_review_counts():
    j = Journey()
    j.prepare()
    session = j.get()
    summary = session["plan"]["summary"]
    assert summary["company_name"] == session["company_name"]
    assert [b["dataset"] for b in summary["batches"]] == [
        "accounts",
        "customers",
        "vendors",
        "products",
        "taxes",
        "configuration",
        "invoices",
        "transactions",
    ]
    assert summary["mapping_review_count"] == len(session["mappings"])
    assert summary["record_count"] == sum(b["record_count"] for b in summary["batches"])
    assert summary["validation_expectations"]


def test_approved_scope_tampering_blocks_execution():
    j = reviewed_journey()
    j.post("/plan", {"action": "approve", "plan_id": j.get()["plan"]["id"]})
    j.inject_test_fault(lambda s: s.plan.risks.append("Unreviewed scope change"))
    before = j.get()
    j.post("/migration/start", key="tampered-consent", status=409)
    assert j.get() == before


def test_plan_approval_uses_verified_owner_and_survives_session_reload():
    from fastapi.testclient import TestClient
    from movebooks_api.auth import Principal, require_principal
    from movebooks_api.main import app

    app.dependency_overrides[require_principal] = lambda: Principal("firebase:owner-a", "")
    try:
        j = reviewed_journey()
        plan = j.post("/plan", {"action": "approve", "plan_id": j.get()["plan"]["id"]})
        assert plan["approval"]["actor"] == "firebase:owner-a"
        assert j.get()["human_decisions"][-1]["role"] == "WORKSPACE_OWNER"
        app.dependency_overrides[require_principal] = lambda: Principal("firebase:owner-b", "")
        assert (
            TestClient(app)
            .post(j.root + "/plan", json={"action": "approve", "plan_id": plan["id"]})
            .status_code
            == 404
        )
    finally:
        app.dependency_overrides.pop(require_principal, None)


def test_legacy_mapping_serialization_keeps_existing_manifest_shape():
    from domain.planning_mapping.models import MappingProposal

    j = reviewed_journey()
    mapping = j.get()["mappings"][0]
    assert "source_value" not in mapping
    assert MappingProposal.model_validate(mapping).model_dump(mode="json") == mapping
    setting = next(m for m in j.get()["mappings"] if m["area"] == "general_configuration")
    assert setting["source_value"]
    setting.pop("source_value")
    assert MappingProposal.model_validate(setting).model_dump(mode="json") == setting
    # Mappings stored before supported targets existed keep their exact serialized shape.
    legacy = {key: value for key, value in mapping.items() if key != "supported_targets"}
    assert MappingProposal.model_validate(legacy).model_dump(mode="json") == legacy
