"""Versioned deterministic Plan → Map & Approve policy."""

from domain.planning_mapping.models import MappingArea

PLAN_POLICY_VERSION = "migration-plan-v1"
MAPPING_POLICY_VERSION = "mapping-policy-v1"
AUTO_ACCEPT_CONFIDENCE = 0.90

SENSITIVE_MAPPING_AREAS = {
    MappingArea.CHART_OF_ACCOUNTS,
    MappingArea.TAX_CONFIGURATION,
}

PLAN_PHASES = (
    ("resolve-prerequisites", "Phase 1 — Resolve prerequisites"),
    ("review-mappings", "Phase 2 — Review mappings"),
    ("prepare-migration", "Phase 3 — Prepare migration"),
    ("execute-migration", "Phase 4 — Execute migration"),
    ("validate", "Phase 5 — Validate"),
    ("configure", "Phase 6 — Configure"),
    ("onboard", "Phase 7 — Onboard"),
)

ALLOWED_ACCOUNT_TARGETS: dict[str, tuple[str, ...]] = {
    "accounts_payable": ("Accounts Payable",),
    "accounts_receivable": ("Accounts Receivable",),
    "income": ("Sales Income", "Other Income"),
    "bank": ("Bank Account",),
    "expense": ("Operating Expense", "Cost of Goods Sold"),
    "asset": ("Other Current Asset", "Fixed Asset"),
    "liability": ("Other Current Liability", "Long Term Liability"),
    "equity": ("Owner Equity", "Retained Earnings"),
}

SUPPORTED_CONFIGURATION_TARGETS: dict[str, tuple[str, ...]] = {
    "base_currency": ("USD", "INR", "GBP", "EUR"),
    "fiscal_calendar": ("Calendar Year", "Custom Fiscal Year"),
    "inventory_valuation_method": ("FIFO", "Weighted Average"),
}

CANONICAL_ENTITY_TARGETS: dict[MappingArea, tuple[str, ...]] = {
    MappingArea.CUSTOMERS: ("Customer",),
    MappingArea.VENDORS: ("Vendor",),
    MappingArea.PRODUCTS_SERVICES: ("Service", "Non-Inventory Product"),
}

TARGET_REQUIRED_FIELDS: dict[MappingArea, tuple[str, ...]] = {
    MappingArea.CHART_OF_ACCOUNTS: ("code", "name", "account_type"),
    MappingArea.CUSTOMERS: ("display_name",),
    MappingArea.VENDORS: ("display_name",),
    MappingArea.PRODUCTS_SERVICES: ("name", "item_type"),
    MappingArea.TAX_CONFIGURATION: ("code", "rate", "jurisdiction"),
    MappingArea.GENERAL_CONFIGURATION: ("key", "value"),
}
