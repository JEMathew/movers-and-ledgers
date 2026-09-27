from datetime import UTC, datetime

from domain.validation_configuration.models import ConfigurationState

POLICY_VERSION = "configuration-v1"
AREAS = {
    "fiscal_year": ("Fiscal year", [str(i) for i in range(1, 13)]),
    "base_currency": ("Base currency", ["USD", "INR", "GBP", "EUR"]),
    "tax_setup": ("Tax setup", ["CA-SALES", "NONE"]),
    "payment_terms": ("Payment terms", ["NET_15", "NET_30", "DUE_ON_RECEIPT"]),
    "inventory": ("Inventory valuation", ["WEIGHTED_AVERAGE", "FIFO"]),
    "invoice_preferences": ("Invoice preferences", ["HL-", "INV-"]),
    "user_roles": ("User roles / access", ["FINANCE_REVIEWER", "READ_ONLY"]),
    "integrations": ("Integrations / preferences", ["DISABLED", "SANDBOX_READ_ONLY"]),
}
SENSITIVE = {"base_currency", "tax_setup", "inventory", "user_roles", "integrations"}


def validate_fiscal_year(value: str) -> bool:
    return value in AREAS["fiscal_year"][1]


def validate_currency(value: str, source_currency: str) -> bool:
    return value in AREAS["base_currency"][1] and value == source_currency


def validate_tax_configuration(value: str, source_tax: str) -> bool:
    return value in AREAS["tax_setup"][1] and value == source_tax


def validate_inventory_configuration(value: str) -> bool:
    return value in AREAS["inventory"][1]


def validate_payment_terms(value: str) -> bool:
    return value in AREAS["payment_terms"][1]


def validate_role_policy(value: str) -> bool:
    return value in AREAS["user_roles"][1]  # Neither role can administer or write accounting data.


def validate_configuration_dependency(settings: dict[str, str]) -> list[str]:
    errors = []
    if set(settings) != set(AREAS):
        errors.append("All eight configuration areas are required.")
    if settings.get("integrations") == "SANDBOX_READ_ONLY" and settings.get("user_roles") not in {
        "READ_ONLY",
        "FINANCE_REVIEWER",
    }:
        errors.append("Sandbox integration requires an explicitly reviewed read-only role.")
    return errors


def validate_value(area: str, value: str, source_value: str) -> bool:
    if area not in AREAS or value not in AREAS[area][1]:
        return False
    validators = {
        "fiscal_year": lambda: validate_fiscal_year(value),
        "base_currency": lambda: validate_currency(value, source_value),
        "tax_setup": lambda: validate_tax_configuration(value, source_value),
        "inventory": lambda: validate_inventory_configuration(value),
        "payment_terms": lambda: validate_payment_terms(value),
        "user_roles": lambda: validate_role_policy(value),
    }
    return validators.get(area, lambda: True)()


def apply_safe_configuration(plan) -> None:
    """Preflight the entire plan before applying any settings; repeated calls are idempotent."""
    if len(plan.proposals) != len(AREAS) or {p.area for p in plan.proposals} != set(AREAS):
        raise ValueError("The configuration plan must contain exactly one of each required area.")
    selected = {p.area: p.selected_value for p in plan.proposals}
    errors = validate_configuration_dependency(selected)
    for proposal in plan.proposals:
        if not proposal.evidence or not validate_value(
            proposal.area, proposal.selected_value, proposal.source_value
        ):
            errors.append(f"{proposal.label}: evidence or deterministic constraints failed.")
        if proposal.state not in {
            ConfigurationState.AUTO_APPLICABLE,
            ConfigurationState.APPROVED,
            ConfigurationState.MODIFIED,
            ConfigurationState.APPLIED,
        }:
            errors.append(f"{proposal.label}: a required decision is incomplete.")
        sensitive = proposal.area in SENSITIVE or proposal.selected_value != proposal.source_value
        if (sensitive or proposal.risk == "HIGH" or proposal.approval_required) and (
            not proposal.decided_by
            or not proposal.decided_at
            or proposal.decision not in {"approve", "modify"}
        ):
            errors.append(f"{proposal.label}: attributable human approval is required.")
    if errors:
        raise ValueError(" ".join(errors))
    plan.target_settings = selected
    for proposal in plan.proposals:
        proposal.state = ConfigurationState.APPLIED


def decide_configuration(proposal, decision, actor: str) -> None:
    if proposal.state is ConfigurationState.APPLIED:
        raise ValueError("Applied settings cannot be changed without a new reviewed plan.")
    if decision.action == "modify":
        if decision.value is None or not validate_value(
            proposal.area, decision.value, proposal.source_value
        ):
            raise ValueError("Unsupported configuration value or accounting treatment.")
        proposal.selected_value = decision.value
    elif decision.value is not None:
        raise ValueError("Only a modify action may supply a value.")
    if decision.action != "reject" and (
        not proposal.evidence
        or not validate_value(proposal.area, proposal.selected_value, proposal.source_value)
    ):
        raise ValueError("Missing evidence or unsupported configuration cannot be approved.")
    proposal.state = {
        "approve": ConfigurationState.APPROVED,
        "modify": ConfigurationState.MODIFIED,
        "reject": ConfigurationState.REJECTED,
    }[decision.action]
    proposal.decision = decision.action
    proposal.decided_by = actor
    proposal.decided_at = datetime.now(UTC)
    proposal.comment = decision.comment


def record_configuration_event(proposal) -> dict[str, str | bool]:
    return {
        "proposal_id": str(proposal.id),
        "area": proposal.area,
        "state": proposal.state.value,
        "policy": POLICY_VERSION,
        "human_approval_required": proposal.approval_required,
    }
