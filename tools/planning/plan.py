"""Deterministic migration-plan construction and validation."""

from domain.discovery_assessment.models import AssessmentResult, DiscoveryResult, ReadinessStatus
from domain.planning_mapping.models import (
    MigrationPlan,
    PlanPhase,
    PlanPhaseStatus,
    PlanStatus,
)
from domain.planning_mapping.policy import PLAN_PHASES, PLAN_POLICY_VERSION


def build_migration_plan(
    assessment: AssessmentResult, discovery: DiscoveryResult
) -> MigrationPlan:
    blockers = [
        finding.title for finding in discovery.findings if finding.category.value == "BLOCKER"
    ]
    warnings = [
        finding.title for finding in discovery.findings if finding.category.value == "WARNING"
    ]
    prerequisites = list(dict.fromkeys(assessment.recommended_next_actions))
    first_status = (
        PlanPhaseStatus.BLOCKED
        if assessment.readiness is ReadinessStatus.BLOCKED
        else PlanPhaseStatus.NEEDS_ATTENTION
        if warnings
        else PlanPhaseStatus.READY
    )
    phase_specs = [
        (
            "Resolve deterministic blockers and review warnings before execution preparation.",
            [],
            first_status,
            blockers + warnings,
            "Resolve or disposition every listed readiness finding.",
            "Planning Agent",
            "Customer confirms prerequisite disposition",
        ),
        (
            "Review evidence-backed source-to-target proposals and record each decision.",
            ["resolve-prerequisites"],
            PlanPhaseStatus.READY,
            ["Ambiguous or sensitive mappings require human judgment."],
            "Approve, modify, or reject every mapping proposal.",
            "Mapping Agent",
            "Authorized mapping approval",
        ),
        (
            "Prepare an approved, versioned manifest for the future Migration Agent.",
            ["review-mappings"],
            PlanPhaseStatus.FUTURE,
            ["Execution controls and target adapter are not implemented in this slice."],
            "Confirm execution window, owners, and rollback checkpoint.",
            "Migration Orchestrator",
            "Execution authorization",
        ),
        (
            "Execute the approved manifest through idempotent target-write tools.",
            ["prepare-migration"],
            PlanPhaseStatus.FUTURE,
            ["Target writes are intentionally outside the current slice."],
            "Authorize the future migration run.",
            "Migration Agent",
            "Consequential target-write approval",
        ),
        (
            "Run deterministic reconciliation and resolve material exceptions.",
            ["execute-migration"],
            PlanPhaseStatus.FUTURE,
            ["A model cannot declare reconciliation passed."],
            "Review reconciliation evidence and exception dispositions.",
            "Validation Agent",
            "Validation sign-off",
        ),
        (
            "Apply approved configuration, permissions, and integration decisions.",
            ["validate"],
            PlanPhaseStatus.FUTURE,
            ["Configuration can change accounting behavior and access."],
            "Approve consequential settings and permission mappings.",
            "Configuration Agent",
            "Configuration approval",
        ),
        (
            "Prepare authorized users to complete the defined productive task.",
            ["configure"],
            PlanPhaseStatus.FUTURE,
            ["Training completion alone is not First Productive Use."],
            "Complete role-aware onboarding and the agreed activation task.",
            "Onboarding Agent",
            "Verified First Productive Use observation",
        ),
    ]
    phases = [
        PlanPhase(
            id=phase_id,
            sequence=index,
            name=name,
            objective=spec[0],
            dependencies=spec[1],
            status=spec[2],
            risks=spec[3],
            customer_action=spec[4],
            agent_responsible=spec[5],
            approval_checkpoint=spec[6],
        )
        for index, ((phase_id, name), spec) in enumerate(
            zip(PLAN_PHASES, phase_specs, strict=True), start=1
        )
    ]
    evidence = list(
        dict.fromkeys(
            evidence_id for finding in discovery.findings for evidence_id in finding.evidence
        )
    )
    complexity = "High" if blockers else "Medium" if warnings else "Low"
    return MigrationPlan(
        version=PLAN_POLICY_VERSION,
        status=PlanStatus.READY_FOR_MAPPING,
        phases=phases,
        sequence=[phase.id for phase in phases],
        dependencies={phase.id: phase.dependencies for phase in phases},
        prerequisites=prerequisites,
        blockers=blockers,
        risks=warnings + ["Target execution is not implemented in this slice."],
        checkpoints=[
            phase.approval_checkpoint
            for phase in phases
            if phase.approval_checkpoint is not None
        ],
        approvals_required=[
            "All mapping proposals reviewed by the authenticated workspace owner",
            "Future execution authorization before any target write",
        ],
        customer_actions=list(dict.fromkeys(phase.customer_action for phase in phases)),
        relative_complexity=complexity,
        evidence_references=evidence,
    )


def validate_migration_plan(plan: MigrationPlan) -> list[str]:
    errors: list[str] = []
    ids = [phase.id for phase in plan.phases]
    if ids != plan.sequence:
        errors.append("Plan sequence must match ordered phase IDs.")
    if len(ids) != len(set(ids)):
        errors.append("Plan phase IDs must be unique.")
    seen: set[str] = set()
    for phase in plan.phases:
        unknown = set(phase.dependencies) - set(ids)
        if unknown:
            errors.append(f"{phase.id} has unknown dependencies: {sorted(unknown)}")
        future = set(phase.dependencies) - seen
        if future:
            errors.append(f"{phase.id} depends on a later phase: {sorted(future)}")
        seen.add(phase.id)
    if not plan.evidence_references and (plan.blockers or plan.risks):
        errors.append("Plan risks and blockers require evidence references.")
    return errors
