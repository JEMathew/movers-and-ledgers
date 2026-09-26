"""Versioned, deterministic readiness policy for Discover → Assess."""

from dataclasses import dataclass

READINESS_POLICY_VERSION = "discover-assess-readiness-v1"

REQUIRED_DATASETS = (
    "company",
    "customers",
    "vendors",
    "accounts",
    "invoices",
    "transactions",
    "configuration",
)

REQUIRED_FIELDS: dict[str, tuple[str, ...]] = {
    "company": ("id", "legal_name", "display_name", "base_currency"),
    "customers": ("id", "display_name"),
    "vendors": ("id", "display_name"),
    "accounts": ("id", "code", "name", "account_type"),
    "invoices": ("id", "customer_id", "document_number", "total"),
    "transactions": ("id", "transaction_date", "entries"),
    "configuration": ("key", "value"),
}

FINANCIAL_CRITICAL_FIELDS: dict[str, tuple[str, ...]] = {
    "company": ("id", "base_currency"),
    "accounts": ("id", "code", "account_type"),
    "invoices": ("id", "customer_id", "document_number", "total"),
    "transactions": ("id", "transaction_date", "entries"),
}

SUPPORTED_CONFIGURATION: dict[str, set[str]] = {
    "inventory_valuation_method": {"fifo", "weighted_average"},
    "fiscal_calendar": {"calendar_year", "custom_year"},
    "base_currency": {"USD", "INR", "GBP", "EUR"},
}


@dataclass(frozen=True)
class RelationshipRule:
    dataset: str
    source_field: str
    target_dataset: str
    target_field: str = "id"
    critical: bool = True


RELATIONSHIP_RULES = (
    RelationshipRule("invoices", "customer_id", "customers"),
    RelationshipRule("invoices", "receivable_account_id", "accounts"),
)

TARGET_CAPABILITY_ASSUMPTIONS = (
    "Target accepts the canonical customer, vendor, account, invoice, and transaction shapes.",
    "Target supports USD and the documented configuration values only.",
    "No target writes occur during Discover → Assess.",
)
