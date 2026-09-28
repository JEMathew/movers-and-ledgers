from copy import deepcopy
from decimal import Decimal

from domain.onboarding_fpu.models import OnboardingTask, owner_decision_role
from tools.migration import stable_checksum
from tools.validation.checks import ledger, validate_opening_balances

TASKS = {
    "opening_balances": ("Confirm opening balances", ["CONFIRM_AS_VALIDATED", "REQUEST_REVIEW"]),
    "role_access": (
        "Approve synthetic invoice access",
        ["SYNTHETIC_INVOICE_OPERATOR", "READ_ONLY"],
    ),
    "invoice_preferences": ("Confirm invoice preferences", ["USE_CONFIGURED", "REQUEST_REVIEW"]),
    "tax_readiness": (
        "Confirm tax and liability control",
        ["CONFIRM_SYNTHETIC_TAX_CONTROL", "REQUEST_REVIEW"],
    ),
    "customer_vendor": ("Customer and vendor usability", []),
    "product_service": ("Product and service usability", []),
    "bank_setup": ("Choose synthetic bank setup", ["OFFLINE_DEMO", "SANDBOX_READ_ONLY"]),
    "first_report": ("First financial report readiness", []),
    "first_reconciliation": ("First reconciliation readiness", []),
    "checklist": ("Onboarding checklist completion", []),
}


def context_hash(session):
    return stable_checksum(
        {
            "configuration": session.configuration.model_dump(mode="json"),
            "report": session.validation_reports[-1].model_dump(mode="json"),
            "target": session.execution.target_state,
        }
    )


def operating_context(session):
    """Faults are explicit synthetic adapter conditions, never edits to migrated evidence."""
    data = {
        key: [deepcopy(row["payload"]) for row in rows]
        for key, rows in session.execution.target_state.items()
    }
    settings = dict(session.configuration.target_settings)
    faults = session.onboarding.faults if session.onboarding else []
    if "missing_customer" in faults:
        data["customers"] = []
    if "missing_product" in faults:
        data["products"] = []
    if "invalid_tax" in faults:
        settings["tax_setup"] = "UNSUPPORTED"
    if "invalid_mapping" in faults:
        data["accounts"] = [r for r in data["accounts"] if r.get("account_type") != "income"]
    if "missing_role" in faults:
        settings["user_roles"] = "READ_ONLY"
    if "incomplete_configuration" in faults:
        settings.pop("payment_terms", None)
    return data, settings


def verify_opening_balance_readiness(data):
    try:
        return validate_opening_balances(data, data).status == "VERIFIED"
    except (ValueError, KeyError, TypeError):
        return False


def verify_role_access(settings):
    # Existing configured role is not itself write authority. A separate owner-confirmed
    # SYNTHETIC_INVOICE_OPERATOR scope is required by the checklist before any posting.
    return settings.get("user_roles") == "FINANCE_REVIEWER"


def verify_invoice_readiness(data, settings):
    types = {r.get("account_type") for r in data.get("accounts", [])}
    return (
        settings.get("invoice_preferences") in {"HL-", "INV-"}
        and settings.get("payment_terms") in {"NET_15", "NET_30", "DUE_ON_RECEIPT"}
        and {"income", "accounts_receivable"} <= types
    )


def tax_rate(data, settings):
    code = settings.get("tax_setup")
    matches = [r for r in data["taxes"] if r.get("code") == code]
    if code == "NONE" and not data["taxes"]:
        return Decimal(0)
    if len(matches) != 1 or isinstance(matches[0].get("rate"), (bool, float)):
        raise ValueError("A unique configured synthetic tax rate is required.")
    rate = Decimal(str(matches[0]["rate"]))
    if not rate.is_finite() or not Decimal(0) <= rate <= Decimal(1):
        raise ValueError("Unsupported synthetic tax rate.")
    return rate


def verify_tax_readiness(data, settings):
    try:
        tax_rate(data, settings)
        return True
    except (ValueError, KeyError, ArithmeticError):
        return False


def verify_customer_usability(data):
    return any(
        r.get("id") and r.get("display_name") and r.get("active", True)
        for r in data.get("customers", [])
    ) and all(r.get("id") and r.get("display_name") for r in data.get("vendors", []))


def verify_product_usability(data):
    return any(
        r.get("id") and r.get("name") and r.get("active", True) and r.get("item_type") == "service"
        for r in data.get("products", [])
    )


def verify_onboarding_prerequisites(session):
    data, settings = operating_context(session)
    try:
        report_ok = sum(ledger(data).values()) == 0
    except (ValueError, KeyError, TypeError):
        report_ok = False
    checks = {
        "opening_balances": verify_opening_balance_readiness(data),
        "role_access": verify_role_access(settings),
        "invoice_preferences": verify_invoice_readiness(data, settings),
        "tax_readiness": verify_tax_readiness(data, settings),
        "customer_vendor": verify_customer_usability(data),
        "product_service": verify_product_usability(data),
        "bank_setup": settings.get("integrations") in {"DISABLED", "SANDBOX_READ_ONLY"},
        "first_report": report_ok,
        "first_reconciliation": report_ok and verify_opening_balance_readiness(data),
    }
    evidence_hash = context_hash(session)
    tasks = []
    for key, (label, choices) in TASKS.items():
        if key == "checklist":
            ok = all(t.status == "COMPLETED" for t in tasks)
        else:
            ok = checks[key]
        history = session.onboarding.decisions.get(key, [])
        decision = history[-1] if history else None
        approved = bool(
            decision
            and decision.actor == session.owner_subject
            and decision.role == owner_decision_role(session.owner_subject)
            and decision.evidence_hash == evidence_hash
            and decision.action in {"approve", "modify"}
            and decision.selection in choices
            and decision.selection not in {"REQUEST_REVIEW", "READ_ONLY"}
        )
        rejected = bool(decision and decision.action == "reject")
        status = (
            "BLOCKED"
            if (not ok and key != "checklist") or rejected
            else "REVIEW_REQUIRED"
            if not ok
            else ("REVIEW_REQUIRED" if choices and not approved else "COMPLETED")
        )
        details = {
            "opening_balances": (
                "Confirm the validated, balanced opening ledger; this does not edit balances."
            ),
            "role_access": (
                "Explicitly grant this owner synthetic-only invoice posting. "
                "No provider access or administrator role is granted."
            ),
            "invoice_preferences": (
                f"Use prefix {settings.get('invoice_preferences')} "
                f"and terms {settings.get('payment_terms')}."
            ),
            "tax_readiness": (
                f"Confirm {settings.get('tax_setup')} and a separate synthetic tax-payable "
                "control account; not a tax-advice claim."
            ),
            "bank_setup": (
                "Choose offline demo or read-only synthetic setup. "
                "No bank login, network connection, or real credentials."
            ),
        }
        tasks.append(
            OnboardingTask(
                id=key,
                label=label,
                status=status,
                approval_required=bool(choices),
                choices=choices,
                decision=decision,
                explanation=details.get(
                    key, f"Deterministic {label.lower()} check against migrated records."
                ),
                next_action="Complete"
                if status == "COMPLETED"
                else (
                    "Review evidence and confirm or modify the choice."
                    if ok and not rejected
                    else "Correct the prerequisite or revise rejection; no bypass is available."
                ),
                evidence=[
                    f"context:{evidence_hash}",
                    f"configuration:{session.configuration.id}",
                    f"check:{key}:{'pass' if ok else 'fail'}",
                    "policy:onboarding-v1",
                ],
            )
        )
    return tasks


def record_onboarding_event(task):
    return {"task_id": task.id, "status": task.status, "policy": "onboarding-v1"}
