"""Mapping orchestration across bounded specialists and deterministic controls."""

from typing import Any
from uuid import UUID, uuid5

from agents.contracts import AgentRole
from domain.discovery_assessment.models import (
    ActivityStatus,
    AgentActivity,
    Provenance,
    RiskLevel,
)
from domain.planning_mapping.models import MappingArea, MappingProposal, MappingSpecialistInput
from tools.mapping import (
    detect_duplicate_targets,
    enforce_approval_policy,
    validate_mapping_compatibility,
)

from .provider import DeterministicMappingRecommendationProvider, MappingRecommendationProvider
from .specialists import (
    AccountMappingSpecialist,
    ConfigurationMappingSpecialist,
    EntityMappingSpecialist,
    MappingSpecialist,
    TaxMappingSpecialist,
    records_for_area,
)

_ACTIVITY_NAMESPACE = UUID("bd44b418-84ba-51c1-ab55-13aa773d3357")


class MappingAgent:
    role = AgentRole.MAPPING

    def __init__(self, provider: MappingRecommendationProvider | None = None) -> None:
        self.provider = provider or DeterministicMappingRecommendationProvider()
        self.specialists: list[MappingSpecialist] = [
            AccountMappingSpecialist(self.provider),
            TaxMappingSpecialist(self.provider),
            EntityMappingSpecialist(self.provider),
            ConfigurationMappingSpecialist(self.provider),
        ]

    def run(
        self,
        session_id: UUID,
        fixture: dict[str, Any],
        evidence_references: list[str],
    ) -> tuple[list[MappingProposal], list[AgentActivity]]:
        proposals: list[MappingProposal] = []
        activities: list[AgentActivity] = []
        specialist_by_area = {
            area: specialist for specialist in self.specialists for area in specialist.areas
        }
        for area in MappingArea:
            records = records_for_area(fixture, area)
            specialist = specialist_by_area[area]
            output = specialist.run(
                MappingSpecialistInput(
                    area=area,
                    records=records,
                    evidence_references=evidence_references,
                )
            )
            for record, proposal in zip(records, output.proposals, strict=True):
                errors = validate_mapping_compatibility(proposal, record)
                proposals.append(enforce_approval_policy(proposal, errors))
            activities.append(
                AgentActivity(
                    id=uuid5(_ACTIVITY_NAMESPACE, f"{session_id}:{specialist.name}:{area.value}"),
                    migration_session_id=session_id,
                    agent=specialist.name,
                    action=(
                        f"Proposed {len(output.proposals)} "
                        f"{area.value.replace('_', ' ')} mapping(s)"
                    ),
                    tool=",".join(output.tools_used),
                    status=ActivityStatus.COMPLETED,
                    evidence_references=evidence_references,
                    risk=(
                        RiskLevel.HIGH
                        if area in {MappingArea.CHART_OF_ACCOUNTS, MappingArea.TAX_CONFIGURATION}
                        else RiskLevel.MEDIUM
                    ),
                    provenance=Provenance.DETERMINISTIC,
                    customer_action_required=True,
                    human_approval_required=True,
                )
            )
        duplicate_errors = detect_duplicate_targets(proposals)
        if duplicate_errors:
            proposals = [
                enforce_approval_policy(proposal, duplicate_errors)
                if proposal.area is MappingArea.CHART_OF_ACCOUNTS
                else proposal
                for proposal in proposals
            ]
        activities.append(
            AgentActivity(
                id=uuid5(_ACTIVITY_NAMESPACE, f"{session_id}:mapping-agent"),
                migration_session_id=session_id,
                agent=self.role.value,
                action="Applied deterministic mapping and approval controls",
                tool="mapping_schema,compatibility,evidence,duplicates,approval_policy",
                status=ActivityStatus.COMPLETED,
                evidence_references=evidence_references,
                risk=RiskLevel.HIGH,
                provenance=Provenance.DETERMINISTIC,
                customer_action_required=True,
                human_approval_required=True,
            )
        )
        return proposals, activities
