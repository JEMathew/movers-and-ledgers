"""Versioned execution and resolution policies for the synthetic Beta target."""

from domain.migration_resolution.models import ExceptionKind

MIGRATION_POLICY_VERSION = "migration-policy-v1"
RESOLUTION_POLICY_VERSION = "resolution-policy-v1"
DEFAULT_RETRY_LIMIT = 2

BATCH_ORDER = (
    "accounts",
    "customers",
    "vendors",
    "products",
    "taxes",
    "configuration",
    "invoices",
    "transactions",
)

FAILURE_POLICIES: dict[ExceptionKind, dict[str, object]] = {
    ExceptionKind.DUPLICATE_CUSTOMER: {
        "retryable": True,
        "risk": "MEDIUM",
        "human_approval_required": True,
        "action": "record_duplicate_disposition_and_retry",
        "specialist": "duplicate_resolution_specialist",
    },
    ExceptionKind.MISSING_REFERENCE: {
        "retryable": True,
        "risk": "HIGH",
        "human_approval_required": True,
        "action": "repair_reference_mapping",
        "specialist": "referential_integrity_specialist",
    },
    ExceptionKind.UNSUPPORTED_TAX_CODE: {
        "retryable": True,
        "risk": "HIGH",
        "human_approval_required": True,
        "action": "select_supported_tax_treatment",
        "specialist": "tax_configuration_resolution_specialist",
    },
    ExceptionKind.INVALID_CONFIGURATION_DEPENDENCY: {
        "retryable": True,
        "risk": "HIGH",
        "human_approval_required": True,
        "action": "repair_configuration_dependency",
        "specialist": "tax_configuration_resolution_specialist",
    },
    ExceptionKind.TRANSIENT_EXECUTION: {
        "retryable": True,
        "risk": "LOW",
        "human_approval_required": False,
        "action": "retry_with_same_idempotency_key",
        "specialist": "retry_recovery_specialist",
    },
    ExceptionKind.RETRYABLE_BATCH: {
        "retryable": True,
        "risk": "MEDIUM",
        "human_approval_required": False,
        "action": "resume_from_checkpoint",
        "specialist": "retry_recovery_specialist",
    },
    ExceptionKind.NON_RETRYABLE_BLOCKED: {
        "retryable": False,
        "risk": "HIGH",
        "human_approval_required": True,
        "action": "escalate_blocked_migration",
        "specialist": "migration_recovery_coordinator",
    },
}
