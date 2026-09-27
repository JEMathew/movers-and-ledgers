from agents.knowledge.agent import KnowledgeAgent
from agents.model_policy import route_for
from domain.validation_configuration.models import (
    ConfigurationPlan,
    ConfigurationProposal,
    ConfigurationState,
)
from tools.configuration.controls import AREAS, SENSITIVE, validate_value


class ConfigurationAgent:
    name = "configuration_agent"
    route = route_for("configuration_recommendation")
    active_provider = "deterministic-fallback"
    allowed_tools = (
        "validate_value",
        "validate_configuration_dependency",
        "apply_safe_configuration",
        "record_configuration_event",
    )

    def propose(self, report, fixture: dict) -> ConfigurationPlan:
        preferences = fixture.get("configuration_profile", {})
        proposals = []
        for area, (label, options) in AREAS.items():
            knowledge = KnowledgeAgent().lookup_configuration(area)
            value = str(preferences.get(area, ""))
            valid = bool(value) and validate_value(area, value, value)
            if area == "base_currency":
                valid = valid and value == fixture["company"].get("base_currency")
                valid = valid and any(
                    r.get("key") == "base_currency" and r.get("value") == value
                    for r in fixture["datasets"]["configuration"]
                )
            elif area == "fiscal_year":
                valid = valid and value == str(fixture["company"].get("fiscal_year_start_month"))
            elif area == "tax_setup":
                codes = {r.get("code") for r in fixture["datasets"]["taxes"]}
                valid = valid and (value in codes or (value == "NONE" and not codes))
            sensitive = area in SENSITIVE
            reason = (
                "Consequential accounting, tax, access, or integration setting requires approval."
                if sensitive
                else "Unchanged, reversible source preference may auto-apply."
            )
            proposals.append(
                ConfigurationProposal(
                    area=area,
                    label=label,
                    source_value=value,
                    selected_value=value,
                    alternatives=[v for v in options if validate_value(area, v, value)],
                    risk="HIGH" if sensitive else "LOW",
                    approval_required=sensitive,
                    state=ConfigurationState.BLOCKED
                    if not valid
                    else (
                        ConfigurationState.REVIEW_REQUIRED
                        if sensitive
                        else ConfigurationState.AUTO_APPLICABLE
                    ),
                    evidence=[
                        f"source:{report.source_checksum}:configuration_profile.{area}",
                        f"validation:{report.id}",
                        "policy:configuration-v1",
                        knowledge.reference,
                    ]
                    if valid
                    else [],
                    policy_reason=reason if valid else "Missing or unsupported source setting.",
                    explanation=f"{knowledge.definition} {knowledge.remediation_guardrail}",
                )
            )
        return ConfigurationPlan(
            validation_id=report.id,
            target_checksum=report.target_checksum,
            source_checksum=report.source_checksum,
            proposals=proposals,
        )
