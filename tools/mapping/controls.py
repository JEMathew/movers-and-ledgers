"""Authoritative, versioned controls for mapping proposals and decisions."""

from datetime import UTC, datetime
from typing import Any

from domain.planning_mapping.models import (
    MappingArea,
    MappingDecision,
    MappingProposal,
    MappingRisk,
    MappingState,
)
from domain.planning_mapping.policy import (
    ALLOWED_ACCOUNT_TARGETS,
    AUTO_ACCEPT_CONFIDENCE,
    CANONICAL_ENTITY_TARGETS,
    MAPPING_POLICY_VERSION,
    SENSITIVE_MAPPING_AREAS,
    SUPPORTED_CONFIGURATION_TARGETS,
    TARGET_REQUIRED_FIELDS,
)


class MappingPolicyError(ValueError):
    pass


def lookup_mapping_rule(
    area: MappingArea, record: dict[str, Any]
) -> dict[str, Any]:
    """Return a deterministic fallback recommendation from versioned repository knowledge."""
    source_label = str(
        record.get("name")
        or record.get("display_name")
        or record.get("key")
        or record.get("code")
        or record.get("id")
        or "Unnamed source"
    )
    if area is MappingArea.CHART_OF_ACCOUNTS:
        account_type = str(record.get("account_type", ""))
        options = ALLOWED_ACCOUNT_TARGETS.get(account_type, ())
        ambiguous = "clearing" in source_label.casefold() or not options
        return {
            "target": options[0] if options else "Unmapped account",
            "confidence": 0.76 if ambiguous else 0.96,
            "risk": MappingRisk.MEDIUM if ambiguous else MappingRisk.LOW,
            "alternatives": list(options[1:]),
            "rationale": (
                "The source account name is semantically ambiguous; an authorized reviewer must "
                "confirm its accounting treatment."
                if ambiguous
                else "The source account type matches a versioned canonical target account class."
            ),
        }
    if area in {MappingArea.CUSTOMERS, MappingArea.VENDORS}:
        target = "Customer" if area is MappingArea.CUSTOMERS else "Vendor"
        return {
            "target": target,
            "confidence": 0.98,
            "risk": MappingRisk.LOW,
            "alternatives": [],
            "rationale": "The source party shape maps directly to the canonical party role.",
        }
    if area is MappingArea.PRODUCTS_SERVICES:
        item_type = str(record.get("item_type", "service")).replace("_", " ").title()
        return {
            "target": item_type,
            "confidence": 0.94,
            "risk": MappingRisk.LOW,
            "alternatives": ["Service", "Non-Inventory Product"],
            "rationale": (
                "The declared source item type maps to the canonical product/service class."
            ),
        }
    if area is MappingArea.TAX_CONFIGURATION:
        jurisdiction = str(record.get("jurisdiction", "Unspecified jurisdiction"))
        return {
            "target": f"{jurisdiction} sales tax",
            "confidence": 0.88,
            "risk": MappingRisk.HIGH,
            "alternatives": ["Manual tax specialist review"],
            "rationale": (
                "Tax treatment is jurisdiction-sensitive and always requires human approval."
            ),
        }
    key = str(record.get("key", ""))
    value = str(record.get("value", ""))
    options = SUPPORTED_CONFIGURATION_TARGETS.get(key, ())
    normalized = value.replace("_", " ").title()
    exact = next((option for option in options if option.casefold() == normalized.casefold()), None)
    return {
        "target": exact or (options[-1] if options else "Unsupported target configuration"),
        "confidence": 0.97 if exact else 0.72,
        "risk": MappingRisk.LOW if exact else MappingRisk.MEDIUM,
        "alternatives": list(options),
        "rationale": (
            "The source configuration has a declared target equivalent."
            if exact
            else (
                "The source value has no exact declared equivalent; review a supported alternative."
            )
        ),
    }


def validate_mapping_schema(proposal: MappingProposal) -> list[str]:
    errors: list[str] = []
    if not proposal.source_id.strip():
        errors.append("Source ID is required.")
    if not proposal.source_label.strip():
        errors.append("Source label is required.")
    if not proposal.selected_target.strip():
        errors.append("Selected target is required.")
    if proposal.version != MAPPING_POLICY_VERSION:
        errors.append(f"Mapping version must be {MAPPING_POLICY_VERSION}.")
    return errors


def validate_canonical_mapping(proposal: MappingProposal) -> list[str]:
    return [] if proposal.area in MappingArea else ["Unknown canonical mapping area."]


def validate_account_type(
    proposal: MappingProposal, source_record: dict[str, Any]
) -> list[str]:
    if proposal.area is not MappingArea.CHART_OF_ACCOUNTS:
        return []
    source_type = str(source_record.get("account_type", ""))
    allowed = ALLOWED_ACCOUNT_TARGETS.get(source_type, ())
    if proposal.selected_target not in allowed:
        return [
            f"Target '{proposal.selected_target}' is not allowed for source account type "
            f"'{source_type}'."
        ]
    return []


def validate_required_target_fields(
    proposal: MappingProposal, source_record: dict[str, Any]
) -> list[str]:
    required = TARGET_REQUIRED_FIELDS[proposal.area]
    missing = [field for field in required if source_record.get(field) in (None, "")]
    return (
        [f"Required target evidence is missing for fields: {', '.join(missing)}."]
        if missing
        else []
    )


def validate_evidence_completeness(proposal: MappingProposal) -> list[str]:
    if not proposal.evidence or any(not item.strip() for item in proposal.evidence):
        return ["At least one attributable evidence reference is required."]
    return []


def validate_mapping_compatibility(
    proposal: MappingProposal, source_record: dict[str, Any]
) -> list[str]:
    errors = validate_mapping_schema(proposal)
    errors.extend(validate_canonical_mapping(proposal))
    errors.extend(validate_account_type(proposal, source_record))
    errors.extend(validate_required_target_fields(proposal, source_record))
    if proposal.area in CANONICAL_ENTITY_TARGETS:
        allowed = CANONICAL_ENTITY_TARGETS[proposal.area]
        if proposal.selected_target not in allowed:
            errors.append(
                f"Target '{proposal.selected_target}' is not a canonical "
                f"{proposal.area.value.replace('_', ' ')} target."
            )
    if proposal.area is MappingArea.TAX_CONFIGURATION:
        expected = f"{source_record.get('jurisdiction', 'Unspecified jurisdiction')} sales tax"
        if proposal.selected_target != expected:
            errors.append(
                f"Target '{proposal.selected_target}' does not match the declared tax jurisdiction."
            )
    if proposal.area is MappingArea.GENERAL_CONFIGURATION:
        key = str(source_record.get("key", ""))
        allowed = SUPPORTED_CONFIGURATION_TARGETS.get(key, ())
        if proposal.selected_target not in allowed:
            errors.append(
                f"Target '{proposal.selected_target}' is unsupported for configuration '{key}'."
            )
    errors.extend(validate_evidence_completeness(proposal))
    return list(dict.fromkeys(errors))


def detect_duplicate_targets(proposals: list[MappingProposal]) -> list[str]:
    seen: dict[tuple[MappingArea, str], str] = {}
    duplicates: list[str] = []
    for proposal in proposals:
        if proposal.area is not MappingArea.CHART_OF_ACCOUNTS:
            continue
        key = (proposal.area, proposal.selected_target.casefold())
        prior = seen.get(key)
        if prior and prior != proposal.source_id:
            duplicates.append(
                f"{prior} and {proposal.source_id} select duplicate target "
                f"'{proposal.selected_target}'."
            )
        seen[key] = proposal.source_id
    return duplicates


def enforce_approval_policy(
    proposal: MappingProposal, control_errors: list[str]
) -> MappingProposal:
    reasons: list[str] = []
    if control_errors:
        return proposal.model_copy(
            update={
                "state": MappingState.BLOCKED,
                "approval_required": True,
                "policy_reasons": control_errors,
                "deterministic_checks": ["FAILED"],
            }
        )
    if proposal.risk is MappingRisk.HIGH:
        reasons.append("High-risk mappings require human approval.")
    if proposal.area in SENSITIVE_MAPPING_AREAS:
        reasons.append("Sensitive accounting or tax mappings require human approval.")
    if proposal.confidence < AUTO_ACCEPT_CONFIDENCE:
        reasons.append(
            f"Confidence is below the {AUTO_ACCEPT_CONFIDENCE:.0%} auto-acceptable threshold."
        )
    state = MappingState.REVIEW_REQUIRED if reasons else MappingState.AUTO_ACCEPTABLE
    return proposal.model_copy(
        update={
            "state": state,
            "approval_required": True,
            "policy_reasons": reasons or ["Eligible for streamlined human approval."],
            "deterministic_checks": ["PASSED"],
        }
    )


def supported_targets(proposal: MappingProposal, source_record: dict[str, Any]) -> list[str]:
    """Recommended and alternative destinations that a changed decision would accept.

    Uses validate_mapping_compatibility, the same rules apply_mapping_decision enforces, so
    no listed destination can be refused by policy (for example a tax target that does not
    match the declared jurisdiction).
    """
    candidates = dict.fromkeys([proposal.recommended_target, *proposal.alternatives])
    return [
        target
        for target in candidates
        if not validate_mapping_compatibility(
            proposal.model_copy(update={"selected_target": target}), source_record
        )
    ]


def apply_mapping_decision(
    proposal: MappingProposal,
    decision: MappingDecision,
    actor: str,
    source_record: dict[str, Any],
) -> MappingProposal:
    if proposal.state in {MappingState.APPROVED, MappingState.MODIFIED, MappingState.REJECTED}:
        raise MappingPolicyError("Mapping proposal already has a final decision.")
    if proposal.state is MappingState.BLOCKED and decision.decision is not MappingState.MODIFIED:
        raise MappingPolicyError("Blocked mappings must be modified to a compatible target.")
    if decision.decision is MappingState.APPROVED:
        candidate = proposal.model_copy(update={"state": MappingState.APPROVED})
    elif decision.decision is MappingState.REJECTED:
        candidate = proposal.model_copy(update={"state": MappingState.REJECTED})
    elif decision.decision is MappingState.MODIFIED:
        if not decision.selected_target or not decision.selected_target.strip():
            raise MappingPolicyError("A modified mapping requires a selected target.")
        candidate = proposal.model_copy(
            update={
                "selected_target": decision.selected_target.strip(),
                "state": MappingState.MODIFIED,
            }
        )
    else:
        raise MappingPolicyError("Decision must be APPROVED, MODIFIED, or REJECTED.")
    if candidate.state is not MappingState.REJECTED:
        errors = validate_mapping_compatibility(candidate, source_record)
        if errors:
            raise MappingPolicyError(" ".join(errors))
    return candidate.model_copy(
        update={
            "decided_by": actor,
            "decided_at": datetime.now(UTC),
            "decision_comment": decision.comment,
        }
    )


def mapping_ready_for_handoff(proposals: list[MappingProposal]) -> bool:
    return bool(proposals) and all(
        proposal.state in {MappingState.APPROVED, MappingState.MODIFIED}
        for proposal in proposals
    )


def record_audit_event(
    action: str, actor: str, proposal: MappingProposal | None = None
) -> dict[str, str | bool]:
    return {
        "action": action,
        "actor": actor,
        "mapping_id": str(proposal.id) if proposal else "",
        "mapping_area": proposal.area.value if proposal else "",
        "state": proposal.state.value if proposal else "",
        "approval_required": proposal.approval_required if proposal else False,
        "policy_version": MAPPING_POLICY_VERSION,
    }
