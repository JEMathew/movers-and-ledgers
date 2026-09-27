"""Bounded resolution specialists selected by explicit exception policy."""

from dataclasses import dataclass

from domain.migration_resolution.models import MigrationFailure
from domain.migration_resolution.policy import FAILURE_POLICIES


@dataclass(frozen=True)
class SpecialistResult:
    specialist: str
    action: str
    rationale: str
    confidence: float
    allowed_tools: tuple[str, ...]
    escalation_rule: str


class ResolutionSpecialist:
    name = "resolution_specialist"
    allowed_tools = ("versioned_resolution_policy_lookup",)

    def propose(self, failure: MigrationFailure) -> SpecialistResult:
        policy = FAILURE_POLICIES[failure.kind]
        if str(policy["specialist"]) != self.name:
            raise ValueError(f"{self.name} cannot resolve {failure.kind.value}.")
        return SpecialistResult(
            specialist=self.name,
            action=str(policy["action"]),
            rationale=(
                f"Apply the versioned {failure.kind.value} policy to the declared synthetic "
                "exception, preserve lineage, then retry the same batch from its checkpoint."
            ),
            confidence=0.96,
            allowed_tools=self.allowed_tools,
            escalation_rule=(
                "Escalate if evidence changes, retry limit is reached, or policy cannot apply."
            ),
        )


class DuplicateResolutionSpecialist(ResolutionSpecialist):
    name = "duplicate_resolution_specialist"
    allowed_tools = ("versioned_resolution_policy_lookup", "duplicate_evidence_comparison")


class ReferentialIntegritySpecialist(ResolutionSpecialist):
    name = "referential_integrity_specialist"
    allowed_tools = ("versioned_resolution_policy_lookup", "reference_lineage_lookup")


class TaxConfigurationResolutionSpecialist(ResolutionSpecialist):
    name = "tax_configuration_resolution_specialist"
    allowed_tools = ("versioned_resolution_policy_lookup", "supported_configuration_lookup")


class RetryRecoverySpecialist(ResolutionSpecialist):
    name = "retry_recovery_specialist"
    allowed_tools = ("versioned_resolution_policy_lookup", "checkpoint_lookup")


class MigrationRecoveryCoordinator(ResolutionSpecialist):
    name = "migration_recovery_coordinator"
    allowed_tools = ("versioned_resolution_policy_lookup", "governed_escalation")


SPECIALISTS = {
    specialist.name: specialist()
    for specialist in (
        DuplicateResolutionSpecialist,
        ReferentialIntegritySpecialist,
        TaxConfigurationResolutionSpecialist,
        RetryRecoverySpecialist,
        MigrationRecoveryCoordinator,
    )
}
