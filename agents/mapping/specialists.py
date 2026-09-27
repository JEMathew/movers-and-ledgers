"""Bounded mapping specialists with explicit inputs, tools, outputs, and escalation."""

from typing import Any

from domain.planning_mapping.models import (
    MappingArea,
    MappingProposal,
    MappingSpecialistInput,
    MappingSpecialistOutput,
)
from domain.planning_mapping.policy import MAPPING_POLICY_VERSION, TARGET_REQUIRED_FIELDS

from .provider import MappingRecommendationProvider


class MappingSpecialist:
    name = "mapping_specialist"
    areas: set[MappingArea] = set()
    allowed_tools = ("versioned_mapping_rule_lookup",)

    def __init__(self, provider: MappingRecommendationProvider) -> None:
        self.provider = provider

    def run(self, specialist_input: MappingSpecialistInput) -> MappingSpecialistOutput:
        if specialist_input.area not in self.areas:
            raise ValueError(f"{self.name} cannot process {specialist_input.area.value}")
        proposals: list[MappingProposal] = []
        escalations: list[str] = []
        for record in specialist_input.records:
            recommendation = self.provider.recommend(specialist_input.area, record)
            source_id = str(record.get("id") or record.get("key") or "unknown")
            source_label = str(
                record.get("name")
                or record.get("display_name")
                or record.get("key")
                or record.get("code")
                or source_id
            )
            evidence = list(
                dict.fromkeys(
                    [
                        *specialist_input.evidence_references,
                        f"mapping-rule:{MAPPING_POLICY_VERSION}:{specialist_input.area.value}:{source_id}",
                    ]
                )
            )
            proposal = MappingProposal(
                version=MAPPING_POLICY_VERSION,
                area=specialist_input.area,
                source_id=source_id,
                source_label=source_label,
                recommended_target=str(recommendation["target"]),
                selected_target=str(recommendation["target"]),
                confidence=float(recommendation["confidence"]),
                risk=recommendation["risk"],
                evidence=evidence,
                rationale=str(recommendation["rationale"]),
                alternatives=[str(value) for value in recommendation.get("alternatives", [])],
                required_target_fields=list(TARGET_REQUIRED_FIELDS[specialist_input.area]),
                specialist=self.name,
            )
            proposals.append(proposal)
            if proposal.confidence < 0.90:
                escalations.append(
                    f"{source_id} needs human review because confidence is below 90%."
                )
        return MappingSpecialistOutput(
            specialist=self.name,
            proposals=proposals,
            escalations=escalations,
            tools_used=[*self.allowed_tools, self.provider.name],
        )


class AccountMappingSpecialist(MappingSpecialist):
    name = "account_mapping_specialist"
    areas = {MappingArea.CHART_OF_ACCOUNTS}
    allowed_tools = ("versioned_mapping_rule_lookup", "allowed_account_type_validation")


class TaxMappingSpecialist(MappingSpecialist):
    name = "tax_mapping_specialist"
    areas = {MappingArea.TAX_CONFIGURATION}
    allowed_tools = ("versioned_mapping_rule_lookup", "tax_approval_policy")


class EntityMappingSpecialist(MappingSpecialist):
    name = "entity_mapping_specialist"
    areas = {
        MappingArea.CUSTOMERS,
        MappingArea.VENDORS,
        MappingArea.PRODUCTS_SERVICES,
    }
    allowed_tools = ("versioned_mapping_rule_lookup", "required_target_field_validation")


class ConfigurationMappingSpecialist(MappingSpecialist):
    name = "configuration_mapping_specialist"
    areas = {MappingArea.GENERAL_CONFIGURATION}
    allowed_tools = ("versioned_mapping_rule_lookup", "mapping_compatibility_validation")


def records_for_area(fixture: dict[str, Any], area: MappingArea) -> list[dict[str, Any]]:
    datasets = fixture.get("datasets", {})
    dataset_key = {
        MappingArea.CHART_OF_ACCOUNTS: "accounts",
        MappingArea.CUSTOMERS: "customers",
        MappingArea.VENDORS: "vendors",
        MappingArea.PRODUCTS_SERVICES: "products",
        MappingArea.TAX_CONFIGURATION: "taxes",
        MappingArea.GENERAL_CONFIGURATION: "configuration",
    }[area]
    records = datasets.get(dataset_key, []) if isinstance(datasets, dict) else []
    return records if isinstance(records, list) else []
