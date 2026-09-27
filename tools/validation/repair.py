"""Bounded, approval-gated synthetic repair; never a provider write or balance write-off."""

from copy import deepcopy

from domain.migration_resolution.models import ResolutionProposal, ResolutionState
from tools.migration import stable_checksum


def propose_validation_restoration(failure):
    return ResolutionProposal(
        failure_id=failure.id,
        version="validation-repair-v1",
        specialist="deterministic_reconciliation_tool",
        action="restore_approved_source_payload",
        rationale=(
            "Restore this synthetic target record from its checksum-bound approved source. "
            "Retain the previous payload in audit evidence, then run validation again."
        ),
        evidence=[*failure.evidence, "policy:validation-repair-v1"],
        confidence=1.0,
        risk="HIGH",
        reversible=True,
        deterministic_fix_available=True,
        human_approval_required=True,
        escalation_rule="Stop if source, target, or approval evidence changes.",
        allowed_tools=["restore_approved_source_payload"],
        state=ResolutionState.AWAITING_APPROVAL,
    )


def restore_approved_source_payload(row, source, binding, proposal):
    if (
        proposal.state is not ResolutionState.APPROVED
        or not proposal.decided_by
        or stable_checksum(row) != binding.before_checksum
        or stable_checksum(source) != binding.source_checksum
    ):
        raise ValueError("Attributable approval and unchanged evidence are required.")
    binding.before_payload = deepcopy(row["payload"])
    row["payload"] = deepcopy(source)
    row["source_checksum"] = binding.source_checksum
    row["canonical_entity"] = binding.entity
