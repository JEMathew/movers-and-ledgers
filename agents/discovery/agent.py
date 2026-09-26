"""Discovery orchestration over deterministic, side-effect-free tools."""

from collections.abc import Iterable
from typing import Any
from uuid import UUID, uuid5

from agents.contracts import AgentRole
from domain.discovery_assessment.models import (
    ActivityStatus,
    AgentActivity,
    DatasetProfile,
    DatasetStatus,
    DiscoveryResult,
    Finding,
    FindingCategory,
    Provenance,
    RiskLevel,
    ToolObservation,
)
from domain.discovery_assessment.policy import (
    FINANCIAL_CRITICAL_FIELDS,
    RELATIONSHIP_RULES,
    REQUIRED_DATASETS,
    REQUIRED_FIELDS,
    SUPPORTED_CONFIGURATION,
)
from tools.discovery.checks import (
    detect_duplicates,
    profile_dataset,
    validate_configuration,
    validate_referential_integrity,
    validate_schema,
)

_ACTIVITY_NAMESPACE = UUID("53dd4d86-2395-5ce6-8138-1c8b2f4f7d70")


def _records_for(fixture: dict[str, Any], dataset: str) -> list[dict[str, Any]] | None:
    if dataset == "company":
        company = fixture.get("company")
        return [company] if isinstance(company, dict) else None
    datasets = fixture.get("datasets", {})
    records = datasets.get(dataset) if isinstance(datasets, dict) else None
    return records if isinstance(records, list) else None


def _status_for(observations: Iterable[ToolObservation]) -> DatasetStatus:
    categories = {
        issue.category for observation in observations for issue in observation.issues
    }
    if FindingCategory.BLOCKER in categories:
        return DatasetStatus.BLOCKED
    if FindingCategory.WARNING in categories:
        return DatasetStatus.NEEDS_ATTENTION
    return DatasetStatus.READY


def _risk_for(observation: ToolObservation) -> RiskLevel:
    categories = {issue.category for issue in observation.issues}
    if FindingCategory.BLOCKER in categories:
        return RiskLevel.HIGH
    if FindingCategory.WARNING in categories:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


class DiscoveryAgent:
    """Runs declared deterministic tools and packages their evidence for review."""

    role = AgentRole.DISCOVERY

    def run(
        self, session_id: UUID, fixture: dict[str, Any]
    ) -> tuple[DiscoveryResult, list[AgentActivity]]:
        observations: list[ToolObservation] = []

        for dataset in REQUIRED_DATASETS:
            records = _records_for(fixture, dataset)
            observations.append(profile_dataset(dataset, records, REQUIRED_FIELDS[dataset]))
            observations.append(
                validate_schema(
                    dataset,
                    records,
                    REQUIRED_FIELDS[dataset],
                    FINANCIAL_CRITICAL_FIELDS.get(dataset, ()),
                )
            )

        customers = _records_for(fixture, "customers") or []
        observations.append(detect_duplicates("customers", customers))

        for rule in RELATIONSHIP_RULES:
            observations.append(
                validate_referential_integrity(
                    rule.dataset,
                    _records_for(fixture, rule.dataset) or [],
                    rule.source_field,
                    rule.target_dataset,
                    _records_for(fixture, rule.target_dataset) or [],
                    rule.target_field,
                    critical=rule.critical,
                )
            )

        observations.append(
            validate_configuration(
                _records_for(fixture, "configuration") or [], SUPPORTED_CONFIGURATION
            )
        )

        findings = self._findings(observations)
        profiles = self._profiles(observations)
        evidence = [observation.evidence for observation in observations]
        tools_called = list(dict.fromkeys(observation.tool for observation in observations))
        result = DiscoveryResult(
            fixture_version=str(fixture["fixture_version"]),
            sample_company_id=str(fixture["sample_company_id"]),
            company_name=str(fixture["company"]["display_name"]),
            synthetic=bool(fixture.get("synthetic", True)),
            profiles=profiles,
            findings=findings,
            evidence=evidence,
            tools_called=tools_called,
        )
        activity = [
            self._activity(session_id, index, item)
            for index, item in enumerate(observations)
        ]
        return result, activity

    @staticmethod
    def _findings(observations: list[ToolObservation]) -> list[Finding]:
        findings: list[Finding] = []
        counter = 0
        for observation in observations:
            for issue in observation.issues:
                counter += 1
                findings.append(
                    Finding(
                        id=f"finding:{counter:03d}:{issue.rule_code.casefold()}",
                        rule_code=issue.rule_code,
                        category=issue.category,
                        title=issue.title,
                        explanation=issue.explanation,
                        affected_entity=observation.dataset,
                        affected_record_count=issue.affected_record_count,
                        evidence=[observation.evidence.id, issue.evidence_summary],
                        recommended_action=issue.recommended_action,
                        tool=observation.tool,
                        customer_action_required=issue.customer_action_required,
                    )
                )

        for dataset in REQUIRED_DATASETS:
            relevant = [item for item in observations if item.dataset == dataset]
            if relevant and not any(item.issues for item in relevant):
                counter += 1
                evidence_ids = [item.evidence.id for item in relevant]
                findings.append(
                    Finding(
                        id=f"finding:{counter:03d}:{dataset}:ready",
                        rule_code="DATASET_CHECKS_PASSED",
                        category=FindingCategory.INFO,
                        title=f"{dataset.title()} checks passed",
                        explanation=(
                            "The declared deterministic discovery checks found no blocking or "
                            "warning conditions for this dataset."
                        ),
                        affected_entity=dataset,
                        affected_record_count=0,
                        evidence=evidence_ids,
                        recommended_action="No corrective action is required before planning.",
                        tool="discovery_agent",
                        customer_action_required=False,
                    )
                )
        return findings

    @staticmethod
    def _profiles(observations: list[ToolObservation]) -> list[DatasetProfile]:
        profiles: list[DatasetProfile] = []
        for dataset in REQUIRED_DATASETS:
            relevant = [item for item in observations if item.dataset == dataset]
            profile = next(item for item in relevant if item.tool == "profile_dataset")
            profiles.append(
                DatasetProfile(
                    dataset=dataset,
                    label=(
                        "Chart of Accounts"
                        if dataset == "accounts"
                        else dataset.replace("_", " ").title()
                    ),
                    record_count=int(profile.details.get("record_count", 0)),
                    required_fields=list(REQUIRED_FIELDS[dataset]),
                    missing_values=dict(profile.details.get("missing_values", {})),
                    duplicate_candidates=sum(
                        int(item.details.get("candidate_record_count", 0)) for item in relevant
                    ),
                    referential_integrity_issues=sum(
                        len(item.details.get("invalid_record_ids", [])) for item in relevant
                    ),
                    unsupported_items=sum(
                        int(item.details.get("unsupported_items", 0)) for item in relevant
                    ),
                    status=_status_for(relevant),
                    evidence_ids=[item.evidence.id for item in relevant],
                )
            )
        return profiles

    @staticmethod
    def _activity(
        session_id: UUID, index: int, observation: ToolObservation
    ) -> AgentActivity:
        return AgentActivity(
            id=uuid5(_ACTIVITY_NAMESPACE, f"{session_id}:{index}:{observation.evidence.id}"),
            migration_session_id=session_id,
            agent=AgentRole.DISCOVERY.value,
            action=observation.evidence.summary,
            tool=observation.tool,
            status=ActivityStatus.COMPLETED,
            evidence_references=[observation.evidence.id],
            risk=_risk_for(observation),
            provenance=Provenance.DETERMINISTIC,
            customer_action_required=bool(observation.issues),
            human_approval_required=False,
        )
