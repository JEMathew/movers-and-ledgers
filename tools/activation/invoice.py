from decimal import ROUND_HALF_UP, Decimal

from domain.onboarding_fpu.models import FpuCheck, owner_decision_role
from tools.migration import stable_checksum
from tools.onboarding.checks import (
    operating_context,
    tax_rate,
    verify_invoice_readiness,
    verify_onboarding_prerequisites,
)
from tools.validation.checks import ledger, money


def calculate_invoice_totals(quantity, unit_price, rate):
    price = money(unit_price)
    if isinstance(quantity, bool) or not isinstance(quantity, int) or not 1 <= quantity <= 1000:
        raise ValueError("Quantity must be an integer from 1 to 1000.")
    if not Decimal(0) < price <= Decimal("100000"):
        raise ValueError("Price must be positive and at most 100000 for this Beta task.")
    rate = Decimal(str(rate))
    if not rate.is_finite() or not Decimal(0) <= rate <= Decimal(1):
        raise ValueError("Tax rate is outside the supported synthetic range.")
    subtotal = price * quantity
    tax = (subtotal * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return {"subtotal": f"{subtotal:.2f}", "tax": f"{tax:.2f}", "total": f"{subtotal + tax:.2f}"}


def verify_first_productive_use_prerequisites(session, inputs):
    data, settings = operating_context(session)
    failures = [t.id for t in verify_onboarding_prerequisites(session) if t.status != "COMPLETED"]
    if not any(
        r.get("id") == inputs.customer_id and r.get("active", True) for r in data["customers"]
    ):
        failures.append("selected_customer_missing_or_inactive")
    if not any(
        r.get("id") == inputs.product_id
        and r.get("active", True)
        and r.get("item_type") == "service"
        for r in data["products"]
    ):
        failures.append("selected_product_missing_or_unusable")
    if not verify_invoice_readiness(data, settings):
        failures.append("account_mapping_or_invoice_configuration")
    return failures


def invoice_contract(session, inputs):
    failures = verify_first_productive_use_prerequisites(session, inputs)
    if failures:
        raise ValueError("FPU prerequisites: " + ", ".join(failures))
    data, settings = operating_context(session)
    ar = [r["id"] for r in data["accounts"] if r["account_type"] == "accounts_receivable"]
    income = [r["id"] for r in data["accounts"] if r["account_type"] == "income"]
    if len(ar) != 1 or len(income) != 1:
        raise ValueError("This Beta contract requires unique approved A/R and income accounts.")
    rate = tax_rate(data, settings)
    return {
        "version": "fpu-invoice-v1",
        "task": "create_and_post_customer_invoice",
        "inputs": inputs.model_dump(),
        "currency": settings["base_currency"],
        "tax_code": settings["tax_setup"],
        "tax_rate": str(rate),
        "payment_terms": settings["payment_terms"],
        "prefix": settings["invoice_preferences"],
        "receivable_account": ar[0],
        "income_account": income[0],
        "tax_account": "fpu-tax-payable",
        "rounding": "line-tax-half-up-2dp-v1",
        "totals": calculate_invoice_totals(inputs.quantity, inputs.unit_price, rate),
        "migration_target_checksum": session.validation_reports[-1].target_checksum,
        "configuration_id": str(session.configuration.id),
        "acceptance": [
            "customer",
            "product",
            "mapping",
            "tax",
            "totals",
            "posting",
            "accounting_impact",
            "audit",
        ],
    }


def create_synthetic_invoice(task):
    c = task.contract
    invoice = {
        "id": str(task.id),
        "number": f"{c['prefix']}FPU-{task.id}",
        "customer_id": task.inputs.customer_id,
        "product_id": task.inputs.product_id,
        "quantity": task.inputs.quantity,
        "unit_price": task.inputs.unit_price,
        "currency": c["currency"],
        "tax_code": c["tax_code"],
        "payment_terms": c["payment_terms"],
        **c["totals"],
        "status": "POSTED",
        "contract_hash": task.contract_hash,
    }
    entries = [
        {"account_id": c["receivable_account"], "debit": invoice["total"], "credit": "0.00"},
        {"account_id": c["income_account"], "debit": "0.00", "credit": invoice["subtotal"]},
        {"account_id": c["tax_account"], "debit": "0.00", "credit": invoice["tax"]},
    ]
    return invoice, {"id": str(task.id), "invoice_id": str(task.id), "entries": entries}


def validate_invoice_posting(task, invoice, journal):
    expected_invoice, expected_journal = create_synthetic_invoice(task)
    return invoice == expected_invoice and journal == expected_journal


def verify_accounting_impact(session, task, journal):
    baseline = {
        key: [row["payload"] for row in rows]
        for key, rows in session.execution.target_state.items()
    }
    before = ledger(baseline)
    if "fpu-tax-payable" in before:
        return False, {}
    before["fpu-tax-payable"] = Decimal(0)
    after = dict(before)
    for entry in journal["entries"]:
        if entry["account_id"] not in after:
            return False, {}
        debit, credit = money(entry["debit"]), money(entry["credit"])
        if debit < 0 or credit < 0 or (debit and credit):
            return False, {}
        after[entry["account_id"]] += debit - credit
    c = task.contract
    valid = (
        sum(after.values()) == sum(before.values()) == 0
        and after[c["receivable_account"]] - before[c["receivable_account"]]
        == money(c["totals"]["total"])
        and after[c["income_account"]] - before[c["income_account"]]
        == -money(c["totals"]["subtotal"])
        and after[c["tax_account"]] == -money(c["totals"]["tax"])
    )
    return valid, {
        "before": {k: f"{v:.2f}" for k, v in before.items()},
        "after": {k: f"{v:.2f}" for k, v in after.items()},
    }


def verification_checks(session):
    task = session.onboarding.fpu
    if not task or not task.invoice or not task.journal:
        return [
            FpuCheck(
                id="posting",
                passed=False,
                explanation="No posted invoice and journal.",
                evidence=[],
            )
        ]
    evidence = [
        f"contract:{task.contract_hash}",
        f"invoice:{stable_checksum(task.invoice)}",
        f"journal:{stable_checksum(task.journal)}",
        "policy:fpu-invoice-v1",
    ]
    try:
        live_contract = invoice_contract(session, task.inputs)
        contract_ok = (
            live_contract == task.contract and stable_checksum(task.contract) == task.contract_hash
        )
        totals = calculate_invoice_totals(
            task.inputs.quantity, task.inputs.unit_price, task.contract["tax_rate"]
        )
        impact, balances = verify_accounting_impact(session, task, task.journal)
        store_ok = session.onboarding.invoices == {
            str(task.id): task.invoice
        } and session.onboarding.journals == {str(task.id): task.journal}
        audit_ok = bool(
            task.posted_by == session.owner_subject
            and task.posted_at
            and any(
                e.name == "fpu_posted"
                and e.attributes.get("contract_hash") == task.contract_hash
                and e.attributes.get("invoice_id") == str(task.id)
                and e.attributes.get("actor") == session.owner_subject
                for e in session.events
            )
        )
        approval = task.decisions[-1] if task.decisions else None
        checks = {
            "customer_product_mapping_tax": contract_ok,
            "totals": all(task.invoice.get(k) == v for k, v in totals.items()),
            "posting": store_ok and validate_invoice_posting(task, task.invoice, task.journal),
            "accounting_impact": impact,
            "audit": audit_ok,
            "approval": bool(
                approval
                and approval.actor == session.owner_subject
                and approval.role == owner_decision_role(session.owner_subject)
                and approval.action == "approve"
                and approval.evidence_hash == task.contract_hash
            ),
        }
        return [
            FpuCheck(
                id=key,
                passed=passed,
                explanation="Verified against the agreed contract."
                if passed
                else "Failed; stop and investigate before retry.",
                evidence=[*evidence, f"balances:{stable_checksum(balances)}"],
            )
            for key, passed in checks.items()
        ]
    except (ValueError, KeyError, TypeError, ArithmeticError) as error:
        return [
            FpuCheck(id="prerequisites", passed=False, explanation=str(error), evidence=evidence)
        ]


def calculate_fpu_status(checks):
    required = {
        "customer_product_mapping_tax",
        "totals",
        "posting",
        "accounting_impact",
        "audit",
        "approval",
    }
    return (
        "VERIFIED"
        if {c.id for c in checks} == required and all(c.passed for c in checks)
        else "BLOCKED"
    )


def record_fpu_event(task):
    return {
        "task_id": str(task.id),
        "contract_hash": task.contract_hash,
        "checkpoint": task.checkpoint,
        "attempt": task.attempts,
        "policy": task.version,
    }
