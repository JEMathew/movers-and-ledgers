"""Exact Decimal reconciliation of immutable source and synthetic target payloads."""

import json
from collections import Counter
from decimal import Decimal, InvalidOperation
from typing import Any

from domain.validation_configuration.models import ValidationCheck, ValidationStatus
from tools.migration import stable_checksum

REQUIRED_ENTITIES = (
    "customers",
    "vendors",
    "accounts",
    "invoices",
    "transactions",
    "products",
    "taxes",
    "configuration",
)


def money(value: Any) -> Decimal:
    if isinstance(value, (bool, float)):
        raise ValueError("Financial amounts require exact decimal strings.")
    try:
        amount = Decimal(str(value))
    except InvalidOperation as error:
        raise ValueError("Invalid financial amount.") from error
    if not amount.is_finite() or abs(amount) > Decimal("1e18"):
        raise ValueError("Financial amount must be finite and within the Beta range.")
    if amount != amount.quantize(Decimal("0.01")):
        raise ValueError("Amounts must have at most two decimal places under policy v1.")
    return amount


def render(value: Any) -> str:
    if isinstance(value, Decimal):
        return f"{value:.2f}"
    if isinstance(value, (dict, list)):
        return json.dumps(value, sort_keys=True, default=str)
    return str(value)


def result(
    key: str,
    label: str,
    source: Any,
    target: Any,
    *,
    errors: list[str] | None = None,
    record_ids: list[str] | None = None,
) -> ValidationCheck:
    passed = source == target and not errors
    difference = (
        render(target - source)
        if isinstance(source, (Decimal, int))
        else ("None" if passed else "Mismatch")
    )
    return ValidationCheck(
        id=key,
        label=label,
        source=render(source),
        target=render(target),
        difference=difference,
        status=ValidationStatus.VERIFIED if passed else ValidationStatus.BLOCKED,
        evidence=[
            f"check:{key}",
            f"source:{stable_checksum(source)}",
            f"target:{stable_checksum(target)}",
            "policy:validation-v1-exact-decimal",
        ],
        record_ids=record_ids or [],
        explanation="Exact match under zero-tolerance policy."
        if passed
        else "; ".join(
            errors or ["Source and target differ; no tolerance or write-off is permitted."]
        ),
        next_action="Continue when all checks verify."
        if passed
        else "Review records with Resolution, approve a supported repair, then revalidate.",
    )


def compare_record_counts(source: dict, target: dict) -> list[ValidationCheck]:
    return [
        result(
            f"count:{entity}",
            entity.title(),
            len(source.get(entity, [])),
            len(target.get(entity, [])),
            errors=[]
            if entity in source and entity in target
            else ["Required dataset is missing."],
        )
        for entity in REQUIRED_ENTITIES
    ]


def validate_entity_completeness(source: dict, target: dict) -> ValidationCheck:
    def identities(data: dict) -> dict:
        return {
            entity: sorted(str(row.get("id", "")) for row in data.get(entity, []))
            for entity in REQUIRED_ENTITIES
        }

    errors = []
    for side, data in (("source", source), ("target", target)):
        for entity, ids in identities(data).items():
            if "" in ids or len(set(ids)) != len(ids):
                errors.append(f"{side} {entity} has missing or duplicate identities.")
    return result(
        "entity-completeness",
        "Entity completeness",
        identities(source),
        identities(target),
        errors=errors,
    )


def validate_referential_integrity(source: dict, target: dict) -> ValidationCheck:
    errors, affected = [], []
    for side, data in (("source", source), ("target", target)):
        customers = {r["id"] for r in data.get("customers", [])}
        accounts = {r["id"] for r in data.get("accounts", [])}
        for invoice in data.get("invoices", []):
            if invoice.get("customer_id") not in customers or (
                invoice.get("receivable_account_id") not in accounts
            ):
                errors.append(f"{side} invoice {invoice['id']} has an unresolved reference.")
                affected.append(invoice["id"])
        for transaction in data.get("transactions", []):
            for entry in transaction.get("entries", []):
                if entry.get("account_id") not in accounts:
                    errors.append(f"{side} transaction {transaction['id']} has an unknown account.")
                    affected.append(transaction["id"])
    return result(
        "references",
        "Referential integrity",
        "All references valid",
        "All references valid" if not errors else "Unresolved references",
        errors=errors,
        record_ids=sorted(set(affected)),
    )


def ledger(data: dict) -> dict[str, Decimal]:
    balances = {r["id"]: money(r["opening_balance"]) for r in data["accounts"]}
    if not balances or not data["transactions"]:
        raise ValueError("Account and transaction evidence is required.")
    for transaction in data["transactions"]:
        if not transaction["entries"]:
            raise ValueError("An empty journal is not reconciliation evidence.")
        debit = credit = Decimal(0)
        for entry in transaction["entries"]:
            d, c = money(entry["debit"]), money(entry["credit"])
            if d < 0 or c < 0 or (d > 0 and c > 0):
                raise ValueError("Invalid debit/credit journal entry.")
            balances[entry["account_id"]] += d - c
            debit += d
            credit += c
        if debit != credit:
            raise ValueError(f"Unbalanced journal: {transaction['id']}.")
    return balances


def reconcile_accounts_receivable(source: dict, target: dict) -> ValidationCheck:
    errors = []

    def receivable(data: dict) -> Decimal:
        total = Decimal(0)
        for row in data["invoices"]:
            amount, paid = money(row["total"]), money(row.get("paid", "0.00"))
            if amount < 0 or paid < 0 or paid > amount:
                raise ValueError("Invalid invoice total or payment evidence.")
            total += amount - paid
        balances = ledger(data)
        ids = [r["id"] for r in data["accounts"] if r["account_type"] == "accounts_receivable"]
        if not ids or sum((balances[key] for key in ids), Decimal(0)) != total:
            errors.append("Invoice subledger does not reconcile to A/R control accounts.")
        return total

    return result(
        "ar",
        "A/R — open invoices",
        receivable(source),
        receivable(target),
        errors=errors,
        record_ids=[r["id"] for r in source["invoices"]],
    )


def reconcile_accounts_payable(source: dict, target: dict) -> ValidationCheck:
    def payable(data: dict) -> Decimal:
        balances = ledger(data)
        ids = [r["id"] for r in data["accounts"] if r["account_type"] == "accounts_payable"]
        if not ids:
            raise ValueError("An explicit A/P control account is required, even at zero balance.")
        return -sum((balances[key] for key in ids), Decimal(0))

    return result(
        "ap",
        "A/P — control accounts",
        payable(source),
        payable(target),
        record_ids=[r["id"] for r in source["transactions"]],
    )


def reconcile_trial_balance(source: dict, target: dict) -> ValidationCheck:
    left, right = ledger(source), ledger(target)
    errors = (
        []
        if sum(left.values()) == sum(right.values()) == 0
        else ["Trial balance is not balanced on both sides."]
    )
    return result(
        "trial-balance",
        "Trial balance — per account",
        left,
        right,
        errors=errors,
        record_ids=sorted(set(left) | set(right)),
    )


def validate_opening_balances(source: dict, target: dict) -> ValidationCheck:
    left = {r["id"]: money(r["opening_balance"]) for r in source["accounts"]}
    right = {r["id"]: money(r["opening_balance"]) for r in target["accounts"]}
    errors = (
        []
        if left and sum(left.values()) == sum(right.values()) == 0
        else ["Explicit balanced opening balances are required."]
    )
    return result("opening-balances", "Opening balances", left, right, errors=errors)


def validate_mapping_completeness(session, source: dict) -> ValidationCheck:
    from domain.planning_mapping.models import MappingState

    datasets = {
        "chart_of_accounts": "accounts",
        "customers": "customers",
        "vendors": "vendors",
        "products_services": "products",
        "tax_configuration": "taxes",
        "general_configuration": "configuration",
    }
    expected = Counter((area, r["id"]) for area, entity in datasets.items() for r in source[entity])
    actual = Counter((m.area.value, m.source_id) for m in session.mappings)
    errors = []
    if any(
        m.state not in {MappingState.APPROVED, MappingState.MODIFIED}
        or not m.decided_by
        or not m.evidence
        for m in session.mappings
    ):
        errors.append("Each mapping needs evidence and an attributable approval.")
    current_hash = stable_checksum(
        {
            "version": session.plan.version,
            "mappings": [m.model_dump(mode="json") for m in session.mappings],
        }
    )
    if current_hash != session.execution.manifest_checksum:
        errors.append("The executed manifest differs from the current approved manifest.")
    if session.execution.plan_id != session.plan.id:
        errors.append("The executed plan identity differs from the approved plan.")
    for mapping in session.mappings:
        expected_binding = {
            "mapping_id": str(mapping.id),
            "selected_target": mapping.selected_target,
        }
        if (
            session.execution.mapping_bindings.get(f"{mapping.area.value}:{mapping.source_id}")
            != expected_binding
        ):
            errors.append("Executed mapping bindings differ from approved selections.")
        for row in session.execution.target_state.get(datasets[mapping.area.value], []):
            if (
                row.get("source_id") == mapping.source_id
                and row.get("approved_mapping") != expected_binding
            ):
                errors.append("Target mapping lineage differs from the approved selection.")
    return result(
        "mappings",
        "Mapping completeness",
        sorted(expected.items()),
        sorted(actual.items()),
        errors=errors,
    )


def validate_transformation_integrity(source: dict, envelopes: dict) -> ValidationCheck:
    errors, affected = [], []
    if set(source) != set(REQUIRED_ENTITIES) or set(envelopes) != set(REQUIRED_ENTITIES):
        errors.append("Missing or unsupported dataset in the versioned reconciliation contract.")
    for entity in REQUIRED_ENTITIES:
        expected = {r["id"]: r for r in source.get(entity, [])}
        for row in envelopes.get(entity, []):
            key = row.get("source_id")
            original = expected.get(key)
            if (
                original is None
                or row.get("canonical_entity") != entity
                or row.get("source_checksum") != stable_checksum(original)
                or stable_checksum(row.get("payload")) != stable_checksum(original)
            ):
                errors.append(f"{entity}:{key} does not match its source payload and lineage.")
                affected.append(f"{entity}:{key}")
    return result(
        "transformations",
        "Transformation integrity",
        "Source payloads and lineage",
        "Source payloads and lineage" if not errors else "Altered payload or lineage",
        errors=errors,
        record_ids=affected,
    )


def calculate_validation_status(checks: list[ValidationCheck]) -> ValidationStatus:
    if not checks or any(c.status is ValidationStatus.BLOCKED for c in checks):
        return ValidationStatus.BLOCKED
    if any(c.status is ValidationStatus.WARNING for c in checks):
        return ValidationStatus.WARNING
    return ValidationStatus.VERIFIED


def record_validation_event(report) -> dict[str, str | int]:
    return {
        "report_id": str(report.id),
        "policy": report.policy_version,
        "target_checksum": report.target_checksum,
        "status": report.status.value,
        "blocking_discrepancies": report.blocking_discrepancies,
    }
