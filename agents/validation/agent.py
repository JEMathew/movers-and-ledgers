"""Validation orchestration; every result is derived from deterministic tools."""

from agents.model_policy import route_for
from domain.validation_configuration.models import ValidationReport, ValidationStatus
from tools.migration import stable_checksum
from tools.validation import checks as rules


class ValidationAgent:
    name = "validation_agent"
    route = route_for("financial_reconciliation")
    allowed_tools = (
        "compare_record_counts",
        "validate_entity_completeness",
        "validate_referential_integrity",
        "reconcile_accounts_receivable",
        "reconcile_accounts_payable",
        "reconcile_trial_balance",
        "validate_opening_balances",
        "validate_mapping_completeness",
        "validate_transformation_integrity",
        "calculate_validation_status",
    )

    def run(self, session, fixture: dict) -> ValidationReport:
        execution = session.execution
        source = fixture["datasets"]
        checks = []
        try:
            target = {
                entity: [r["payload"] for r in rows]
                for entity, rows in execution.target_state.items()
            }
            checks.extend(rules.compare_record_counts(source, target))
            tools = [
                ("entities", rules.validate_entity_completeness, (source, target)),
                ("references", rules.validate_referential_integrity, (source, target)),
                ("ar", rules.reconcile_accounts_receivable, (source, target)),
                ("ap", rules.reconcile_accounts_payable, (source, target)),
                ("trial-balance", rules.reconcile_trial_balance, (source, target)),
                ("opening-balances", rules.validate_opening_balances, (source, target)),
                ("mappings", rules.validate_mapping_completeness, (session, source)),
                (
                    "transformations",
                    rules.validate_transformation_integrity,
                    (source, execution.target_state),
                ),
            ]
            for key, tool, args in tools:
                try:
                    checks.append(tool(*args))
                except (ValueError, KeyError, TypeError, ArithmeticError) as error:
                    checks.append(
                        rules.result(
                            key,
                            key.replace("-", " ").title(),
                            "Complete valid evidence",
                            "Invalid or missing",
                            errors=[f"Cannot verify: {error}"],
                        )
                    )
        except (KeyError, TypeError) as error:
            checks.append(
                rules.result(
                    "target-schema",
                    "Target schema",
                    "Canonical payloads",
                    "Malformed",
                    errors=[f"Cannot inspect target: {error}"],
                )
            )
        # Bind verification to immutable extraction snapshots, not just matching two altered sides.
        changed = [
            b.id
            for b in execution.batches
            if stable_checksum(source.get(b.entity)) != b.source_checksum
        ]
        checks.append(rules.result("source-snapshot", "Source snapshot", [], changed))
        return ValidationReport(
            source_checksum=stable_checksum(fixture),
            target_checksum=stable_checksum(execution.target_state),
            manifest_checksum=execution.manifest_checksum,
            currency=fixture["company"]["base_currency"],
            checks=checks,
            status=rules.calculate_validation_status(checks),
            blocking_discrepancies=sum(c.status is ValidationStatus.BLOCKED for c in checks),
        )
