"""Uniform server-authored, session-scoped human-decision evidence (synthetic identity)."""

from domain.discovery_assessment.models import HumanDecisionRecord


def record_decision(session, actor, decision, stage, entity, evidence, selected=None):
    if actor != session.owner_subject or not evidence:
        raise ValueError("A workspace-owner decision with attributable evidence is required.")
    session.human_decisions.append(
        HumanDecisionRecord(
            actor=actor,
            role="WORKSPACE_OWNER" if actor.startswith("firebase:") else "DEMO_WORKSPACE_OWNER",
            decision=decision,
            stage=stage,
            affected_entity=str(entity),
            evidence=list(evidence),
            selected_value=selected,
        )
    )
