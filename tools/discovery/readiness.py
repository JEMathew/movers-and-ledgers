"""Deterministic readiness calculation; this is not an AI confidence score."""

from domain.discovery_assessment.models import (
    AssessmentResult,
    DatasetStatus,
    DiscoveryResult,
    FindingCategory,
    ReadinessStatus,
)
from domain.discovery_assessment.policy import (
    READINESS_POLICY_VERSION,
    TARGET_CAPABILITY_ASSUMPTIONS,
)


def calculate_readiness(discovery: DiscoveryResult) -> AssessmentResult:
    blockers = [
        finding
        for finding in discovery.findings
        if finding.category is FindingCategory.BLOCKER
    ]
    warnings = [
        finding
        for finding in discovery.findings
        if finding.category is FindingCategory.WARNING
    ]
    if blockers:
        readiness = ReadinessStatus.BLOCKED
    elif warnings:
        readiness = ReadinessStatus.NEEDS_ATTENTION
    else:
        readiness = ReadinessStatus.READY

    unresolved = [finding.title for finding in [*blockers, *warnings]]
    next_actions = list(
        dict.fromkeys(finding.recommended_action for finding in [*blockers, *warnings])
    )
    if readiness is ReadinessStatus.BLOCKED:
        next_actions.append("Resolve all blocker evidence before planning can begin.")
    elif readiness is ReadinessStatus.NEEDS_ATTENTION:
        next_actions.append("Carry reviewed warnings into Plan and Map & Approve.")
    else:
        next_actions.append("Continue to Planning when the customer is ready.")

    basis = [
        f"{len(blockers)} deterministic blocker(s)",
        f"{len(warnings)} deterministic warning(s)",
        "Required structures and critical relationships determine hard stops.",
        "No model confidence or generated prose affects this decision.",
    ]
    return AssessmentResult(
        readiness=readiness,
        policy_version=READINESS_POLICY_VERSION,
        blocker_count=len(blockers),
        warning_count=len(warnings),
        ready_areas=[
            profile.label for profile in discovery.profiles if profile.status is DatasetStatus.READY
        ],
        unresolved_areas=unresolved,
        recommended_next_actions=next_actions,
        decision_basis=basis,
        target_assumptions=list(TARGET_CAPABILITY_ASSUMPTIONS),
    )
