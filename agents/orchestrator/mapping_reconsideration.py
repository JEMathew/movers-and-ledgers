"""Explicit owner-reviewed supersession; historical decisions are never edited."""

from datetime import UTC, datetime

from domain.discovery_assessment.models import ProductEvent, ProductEventName
from domain.planning_mapping.models import (
    MappingDecision,
    MappingReconsideration,
    MappingState,
    WorkflowStatus,
)
from tools.mapping.controls import MappingPolicyError, validate_mapping_compatibility


def _guard(session, mapping, actor):
    if actor != session.owner_subject:
        raise MappingPolicyError("Only the authenticated workspace owner may reconsider.")
    if session.workflow_status is not WorkflowStatus.AWAITING_APPROVAL or session.execution:
        raise MappingPolicyError("Reconsideration is limited to pre-execution mapping review.")
    if mapping.state is not MappingState.REJECTED:
        raise MappingPolicyError("Only a final rejected mapping may be reconsidered.")


def _event(session, name, record, actor):
    session.events.append(
        ProductEvent(
            migration_session_id=session.id,
            name=name,
            attributes={
                "mapping_id": str(record.mapping_id),
                "reconsideration_id": str(record.id),
                "prior_decision_id": str(record.prior_decision_id),
                "decision_id": str(record.decision_id) if record.decision_id else "",
                "actor": actor,
                "state": record.state,
            },
        )
    )


def request_reconsideration(session, mapping, request, actor, source):
    existing = next((r for r in mapping.reconsiderations if r.id == request.request_id), None)
    if existing:
        if (
            existing.requested_by,
            existing.prior_decision_id,
            existing.reason,
            existing.proposed_target,
        ) != (actor, request.prior_decision_id, request.reason, request.proposed_target):
            raise MappingPolicyError("Reconsideration request ID was reused with different input.")
        return False
    _guard(session, mapping, actor)
    if any(r.state == "REVIEW_REQUIRED" for r in mapping.reconsiderations):
        raise MappingPolicyError("A reconsideration is already awaiting human review.")
    prior = next(
        (
            d
            for d in reversed(session.human_decisions)
            if d.affected_entity == str(mapping.id) and d.stage == "map_approve"
        ),
        None,
    )
    if not prior or prior.id != request.prior_decision_id or prior.decision != "REJECTED":
        raise MappingPolicyError("Refresh and reference the current final rejection.")
    if not mapping.decided_by or not mapping.decided_at:
        raise MappingPolicyError("Original rejection attribution is required.")
    candidate = mapping.model_copy(update={"selected_target": request.proposed_target})
    errors = validate_mapping_compatibility(candidate, source)
    if errors:
        raise MappingPolicyError(" ".join(errors))
    record = MappingReconsideration(
        id=request.request_id,
        mapping_id=mapping.id,
        prior_decision_id=prior.id,
        prior_actor=mapping.decided_by,
        prior_timestamp=mapping.decided_at,
        prior_reason=mapping.decision_comment,
        prior_evidence=list(mapping.evidence),
        prior_target=mapping.selected_target,
        requested_by=actor,
        reason=request.reason,
        proposed_target=request.proposed_target,
    )
    mapping.reconsiderations.append(record)
    _event(session, ProductEventName.MAPPING_RECONSIDERATION_REQUESTED, record, actor)
    return True


def review_reconsideration(session, mapping, record_id, review, actor, source, orchestrator):
    outcome = "APPROVED" if review.action == "approve" else "REJECTED"
    record = next((r for r in mapping.reconsiderations if r.id == record_id), None)
    if record is None:
        raise MappingPolicyError("Request reconsideration before reviewing it.")
    if record.state != "REVIEW_REQUIRED":
        if (record.state, record.reviewed_by, record.review_comment) != (
            outcome,
            actor,
            review.comment,
        ):
            raise MappingPolicyError("Reconsideration already has a different final review.")
        return False
    _guard(session, mapping, actor)
    # Only this explicit review path may derive a new candidate from the final projection.
    # The prior snapshot, human decision and product audit event remain unchanged.
    index = session.mappings.index(mapping)
    session.mappings[index] = mapping.model_copy(
        update={
            "state": MappingState.REVIEW_REQUIRED,
            "selected_target": record.proposed_target,
        }
    )
    orchestrator.decide_mapping(
        session,
        mapping.id,
        MappingDecision(
            decision=MappingState.APPROVED if review.action == "approve" else MappingState.REJECTED,
            comment=review.comment,
        ),
        actor,
        source,
    )
    record.state = outcome
    record.reviewed_by = actor
    record.reviewed_at = datetime.now(UTC)
    record.review_comment = review.comment
    record.decision_id = session.human_decisions[-1].id
    _event(session, ProductEventName.MAPPING_RECONSIDERATION_REVIEWED, record, actor)
    _event(
        session,
        ProductEventName.MAPPING_RECONSIDERATION_APPROVED
        if review.action == "approve"
        else ProductEventName.MAPPING_RECONSIDERATION_REJECTED,
        record,
        actor,
    )
    return True
