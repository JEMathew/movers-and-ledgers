from domain.discovery_assessment.models import FindingCategory
from tools.discovery.checks import (
    detect_duplicates,
    profile_dataset,
    validate_configuration,
    validate_referential_integrity,
    validate_schema,
)


def test_profile_dataset_counts_records_and_missing_values() -> None:
    result = profile_dataset(
        "vendors",
        [{"id": "v-1", "display_name": "Paper Co"}, {"id": "v-2", "display_name": ""}],
        ("id", "display_name"),
    )
    assert result.details == {"record_count": 2, "missing_values": {"display_name": 1}}
    assert result.evidence.attributes["missing_required_values"] == 1


def test_schema_marks_missing_critical_fields_as_blockers() -> None:
    result = validate_schema(
        "invoices",
        [{"id": "invoice-1", "customer_id": ""}],
        ("id", "customer_id"),
        ("id", "customer_id"),
    )
    assert result.issues[0].category is FindingCategory.BLOCKER
    assert result.issues[0].rule_code == "CRITICAL_REQUIRED_FIELD_MISSING"


def test_referential_integrity_reports_only_unresolved_relationships() -> None:
    result = validate_referential_integrity(
        "invoices",
        [{"id": "invoice-1", "customer_id": "missing"}],
        "customer_id",
        "customers",
        [{"id": "customer-1"}],
    )
    assert result.details["invalid_record_ids"] == ["invoice-1"]
    assert result.issues[0].category is FindingCategory.BLOCKER


def test_duplicate_detection_normalizes_legal_suffixes_without_merging() -> None:
    result = detect_duplicates(
        "customers",
        [
            {"id": "c-1", "display_name": "Northstar Retail Pvt Ltd"},
            {"id": "c-2", "display_name": "Northstar Retail Private Limited"},
        ],
    )
    assert result.details["candidate_groups"] == [["c-1", "c-2"]]
    assert result.issues[0].category is FindingCategory.WARNING


def test_configuration_validation_uses_declared_capabilities() -> None:
    result = validate_configuration(
        [{"id": "config-1", "key": "inventory", "value": "custom"}],
        {"inventory": {"fifo"}},
    )
    assert result.details["unsupported_items"] == 1
    assert result.issues[0].rule_code == "UNSUPPORTED_CONFIGURATION"


def test_configuration_validation_flags_unknown_keys() -> None:
    result = validate_configuration(
        [{"id": "config-1", "key": "custom_inventory_mode", "value": "bespoke"}],
        {"inventory": {"fifo"}},
    )
    assert not result.passed
    assert result.details["unsupported_items"] == 1
