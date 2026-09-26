"""Pure, deterministic checks for synthetic accounting discovery data."""

import re
from collections.abc import Iterable
from typing import Any

from domain.discovery_assessment.models import (
    DetectedIssue,
    EvidenceReference,
    FindingCategory,
    ToolObservation,
)


def _evidence_id(dataset: str, tool: str) -> str:
    return f"evidence:{dataset}:{tool}"


def _is_missing(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def _singular(label: str) -> str:
    return label[:-1] if label.endswith("s") else label


def profile_dataset(
    dataset: str, records: list[dict[str, Any]] | None, required_fields: Iterable[str]
) -> ToolObservation:
    required = list(required_fields)
    rows = records or []
    missing = {
        field: sum(1 for row in rows if field not in row or _is_missing(row.get(field)))
        for field in required
    }
    missing = {field: count for field, count in missing.items() if count}
    evidence = EvidenceReference(
        id=_evidence_id(dataset, "profile_dataset"),
        tool="profile_dataset",
        dataset=dataset,
        summary=f"Profiled {len(rows)} synthetic {dataset} record(s).",
        attributes={"record_count": len(rows), "missing_required_values": sum(missing.values())},
    )
    return ToolObservation(
        tool="profile_dataset",
        dataset=dataset,
        passed=records is not None,
        evidence=evidence,
        details={"record_count": len(rows), "missing_values": missing},
    )


def validate_schema(
    dataset: str,
    records: list[dict[str, Any]] | None,
    required_fields: Iterable[str],
    critical_fields: Iterable[str] = (),
) -> ToolObservation:
    required = list(required_fields)
    critical = set(critical_fields)
    issues: list[DetectedIssue] = []
    if records is None:
        issues.append(
            DetectedIssue(
                rule_code="REQUIRED_DATASET_MISSING",
                category=FindingCategory.BLOCKER,
                title=f"{dataset.title()} dataset is missing",
                explanation=(
                    "A required discovery dataset was not supplied to the deterministic checks."
                ),
                affected_record_count=None,
                evidence_summary=f"No {dataset} dataset was present in the source manifest.",
                recommended_action=f"Provide the required {dataset} dataset before planning.",
                customer_action_required=True,
            )
        )
        missing: dict[str, int] = {}
    else:
        missing = {
            field: sum(1 for row in records if field not in row or _is_missing(row.get(field)))
            for field in required
        }
        missing = {field: count for field, count in missing.items() if count}
        for field, count in sorted(missing.items()):
            is_critical = field in critical
            issues.append(
                DetectedIssue(
                    rule_code=(
                        "CRITICAL_REQUIRED_FIELD_MISSING"
                        if is_critical
                        else "REQUIRED_FIELD_MISSING"
                    ),
                    category=(FindingCategory.BLOCKER if is_critical else FindingCategory.WARNING),
                    title=f"{dataset.title()} records are missing {field.replace('_', ' ')}",
                    explanation=(
                        "A financial-critical required value is absent."
                        if is_critical
                        else "A required descriptive value is absent and needs review."
                    ),
                    affected_record_count=count,
                    evidence_summary=f"{count} of {len(records)} record(s) lack {field}.",
                    recommended_action=(
                        f"Complete {field.replace('_', ' ')} for the affected {dataset} "
                        "record(s)."
                    ),
                    customer_action_required=True,
                )
            )
    evidence = EvidenceReference(
        id=_evidence_id(dataset, "validate_schema"),
        tool="validate_schema",
        dataset=dataset,
        summary=(
            f"Validated {len(required)} required field(s); "
            f"{sum(missing.values())} missing value(s)."
            if records is not None
            else "Required dataset is absent."
        ),
        attributes={"required_field_count": len(required), "missing_values": missing},
    )
    return ToolObservation(
        tool="validate_schema",
        dataset=dataset,
        passed=not issues,
        evidence=evidence,
        issues=issues,
        details={"missing_values": missing},
    )


def validate_referential_integrity(
    dataset: str,
    records: list[dict[str, Any]],
    source_field: str,
    target_dataset: str,
    target_records: list[dict[str, Any]],
    target_field: str = "id",
    *,
    critical: bool = True,
) -> ToolObservation:
    target_values = {row.get(target_field) for row in target_records}
    invalid_ids = sorted(
        str(row.get("id", "unknown"))
        for row in records
        if not _is_missing(row.get(source_field)) and row.get(source_field) not in target_values
    )
    issues = []
    if invalid_ids:
        target_label = _singular(target_dataset)
        issues.append(
            DetectedIssue(
                rule_code="CRITICAL_REFERENCE_INVALID" if critical else "REFERENCE_INVALID",
                category=FindingCategory.BLOCKER if critical else FindingCategory.WARNING,
                title=f"{dataset.title()} contain invalid {target_label} references",
                explanation=(
                    f"The {source_field.replace('_', ' ')} must resolve to an existing "
                    f"{target_label} record before migration planning."
                ),
                affected_record_count=len(invalid_ids),
                evidence_summary=(
                    f"Record IDs {', '.join(invalid_ids)} reference missing {target_dataset}."
                ),
                recommended_action=(
                    f"Repair or explicitly disposition the affected {dataset} relationship(s)."
                ),
                customer_action_required=True,
            )
        )
    evidence = EvidenceReference(
        id=_evidence_id(dataset, f"validate_referential_integrity:{source_field}"),
        tool="validate_referential_integrity",
        dataset=dataset,
        summary=(
            f"Checked {len(records)} {dataset} record(s) against {target_dataset}; "
            f"{len(invalid_ids)} invalid reference(s)."
        ),
        attributes={
            "source_field": source_field,
            "target_dataset": target_dataset,
            "invalid_record_ids": invalid_ids,
        },
    )
    return ToolObservation(
        tool="validate_referential_integrity",
        dataset=dataset,
        passed=not invalid_ids,
        evidence=evidence,
        issues=issues,
        details={"invalid_record_ids": invalid_ids},
    )


def _normalized_party_name(value: str) -> str:
    tokens = re.findall(r"[a-z0-9]+", value.casefold())
    legal_suffixes = {
        "company",
        "inc",
        "incorporated",
        "limited",
        "llc",
        "ltd",
        "private",
        "pvt",
    }
    return " ".join(token for token in tokens if token not in legal_suffixes)


def detect_duplicates(
    dataset: str, records: list[dict[str, Any]], name_field: str = "display_name"
) -> ToolObservation:
    grouped: dict[str, list[str]] = {}
    for row in records:
        name = row.get(name_field)
        if not isinstance(name, str) or not name.strip():
            continue
        normalized_name = _normalized_party_name(name)
        if not normalized_name:
            continue
        grouped.setdefault(normalized_name, []).append(str(row.get("id", "unknown")))
    candidates = [ids for _, ids in sorted(grouped.items()) if len(ids) > 1]
    affected_count = sum(len(group) for group in candidates)
    issues = []
    if candidates:
        issues.append(
            DetectedIssue(
                rule_code="DUPLICATE_CANDIDATES",
                category=FindingCategory.WARNING,
                title=f"Potential duplicate {dataset} need review",
                explanation=(
                    "Deterministic name normalization found records with the same canonical name. "
                    "It does not merge or classify them automatically."
                ),
                affected_record_count=affected_count,
                evidence_summary=(
                    f"{len(candidates)} candidate group(s) across record IDs "
                    + "; ".join(", ".join(group) for group in candidates)
                    + "."
                ),
                recommended_action=(
                    "Review the candidate records and decide whether to merge or retain them."
                ),
                customer_action_required=True,
            )
        )
    evidence = EvidenceReference(
        id=_evidence_id(dataset, "detect_duplicates"),
        tool="detect_duplicates",
        dataset=dataset,
        summary=(
            f"Compared {len(records)} {dataset} record(s) using deterministic legal-suffix "
            f"normalization; {len(candidates)} candidate group(s)."
        ),
        attributes={"candidate_groups": candidates, "method": "legal-suffix-normalization-v1"},
    )
    return ToolObservation(
        tool="detect_duplicates",
        dataset=dataset,
        passed=not candidates,
        evidence=evidence,
        issues=issues,
        details={"candidate_groups": candidates, "candidate_record_count": affected_count},
    )


def validate_configuration(
    records: list[dict[str, Any]], supported_values: dict[str, set[str]]
) -> ToolObservation:
    unsupported = [
        {"id": str(row.get("id", "unknown")), "key": str(row.get("key"))}
        for row in records
        if row.get("key") not in supported_values
        or str(row.get("value")) not in supported_values[str(row.get("key"))]
    ]
    issues = []
    if unsupported:
        issues.append(
            DetectedIssue(
                rule_code="UNSUPPORTED_CONFIGURATION",
                category=FindingCategory.WARNING,
                title="Configuration values need target mapping",
                explanation=(
                    "One or more optional source configuration values have no declared target "
                    "representation in the current capability assumptions."
                ),
                affected_record_count=len(unsupported),
                evidence_summary=(
                    "Unsupported configuration record IDs: "
                    + ", ".join(item["id"] for item in unsupported)
                    + "."
                ),
                recommended_action="Choose a supported target value during Map & Approve.",
                customer_action_required=True,
            )
        )
    evidence = EvidenceReference(
        id=_evidence_id("configuration", "validate_configuration"),
        tool="validate_configuration",
        dataset="configuration",
        summary=f"Checked {len(records)} configuration item(s); {len(unsupported)} unsupported.",
        attributes={"unsupported": unsupported},
    )
    return ToolObservation(
        tool="validate_configuration",
        dataset="configuration",
        passed=not unsupported,
        evidence=evidence,
        issues=issues,
        details={"unsupported_items": len(unsupported)},
    )
