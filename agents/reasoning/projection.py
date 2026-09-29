"""Allowlisted synthetic context. No raw records, comments, actors, amounts or credentials."""

import hashlib
import json

from domain.reasoning.models import Capability, EvidenceFact, ReasoningInput


def project(session, capability: Capability) -> ReasoningInput:
    if not session.synthetic or session.source_kind != "synthetic_sample":
        raise ValueError("Reasoning accepts repository synthetic samples only; uploads excluded.")
    if session.uploaded_source is not None:
        raise ValueError("Uploaded context cannot enter a model.")
    facts: list[EvidenceFact] = []
    controls: list[str] = []
    blocked = False

    def fact(reference, observation):
        facts.append(EvidenceFact(reference=reference, observation=observation))

    if capability == Capability.PLANNING:
        if not session.plan:
            raise ValueError("Generate the deterministic plan first.")
        for p in session.plan.phases:
            fact(
                f"phase:{p.id}",
                json.dumps(
                    {
                        "sequence": p.sequence,
                        "dependencies": p.dependencies,
                        "status": p.status,
                        "stage": p.id,
                    }
                ),
            )
        blocked = bool(session.plan.blockers)
        controls = [
            f"plan_blockers:{len(session.plan.blockers)}",
            "Plan ordering and dependencies are owned by deterministic tools.",
        ]
    elif capability == Capability.MAPPING:
        if not session.mappings or session.execution:
            raise ValueError("Mapping advice is limited to existing pre-execution proposals.")
        for m in session.mappings[:40]:
            fact(
                f"mapping:{m.id}",
                json.dumps(
                    {
                        "area": m.area,
                        "state": m.state,
                        "candidate": m.selected_target[:120],
                        "source_concept": m.source_label[:120],
                        "risk": m.risk,
                        "approval_required": m.approval_required,
                    }
                ),
            )
        blocked = any(
            m.state in {"BLOCKED", "REJECTED"} or m.confidence < 0.8 for m in session.mappings
        )
        controls = [
            "Existing compatibility, duplicate and approval policies remain authoritative.",
            f"mapping_count:{len(session.mappings)}",
        ]
    elif capability == Capability.RESOLUTION:
        if not session.execution or not session.execution.failures:
            raise ValueError("A recorded migration failure is required.")
        for f in session.execution.failures[-20:]:
            fact(f"failure:{f.id}", f"Classified failure kind: {f.kind}.")
        blocked = True
        controls = [
            "Only existing policy-approved remedies can be applied by deterministic tools.",
            "Do not retry until the current failure policy and required approvals allow it.",
        ]
    elif capability == Capability.CONFIGURATION:
        if not session.configuration:
            raise ValueError("Generate deterministic configuration proposals first.")
        for p in session.configuration.proposals:
            fact(
                f"configuration:{p.id}",
                json.dumps(
                    {
                        "area": p.area,
                        "state": p.state,
                        "approval_required": p.approval_required,
                        "risk": p.risk,
                    }
                ),
            )
        blocked = any(p.state == "BLOCKED" for p in session.configuration.proposals)
        controls = [
            "Source compatibility and configuration dependency checks remain authoritative."
        ]
    else:
        if not session.onboarding:
            raise ValueError("Generate the governed onboarding checklist first.")
        for t in session.onboarding.tasks:
            fact(
                f"onboarding:{t.id}",
                json.dumps(
                    {"task": t.id, "status": t.status, "approval_required": t.approval_required}
                ),
            )
        blocked = any(t.status == "BLOCKED" for t in session.onboarding.tasks)
        controls = [
            "FPU completion and financial checks belong exclusively to deterministic tools."
        ]
    return ReasoningInput(
        capability=capability,
        workflow_state=session.workflow_status,
        facts=facts,
        deterministic_results=controls,
        requires_escalation=blocked,
    )


def context_hash(context: ReasoningInput) -> str:
    return hashlib.sha256(context.model_dump_json().encode()).hexdigest()
