from agents.model_policy import route_for
from tools.activation.invoice import invoice_contract, verification_checks


class FirstProductiveUseAgent:
    name = "first_productive_use_activation_agent"
    route = route_for("productive_use_verification")
    allowed_tools = (
        "invoice_contract",
        "create_synthetic_invoice",
        "validate_invoice_posting",
        "verify_accounting_impact",
        "calculate_fpu_status",
        "record_fpu_event",
    )

    def propose(self, session, inputs):
        return invoice_contract(session, inputs)

    def verify(self, session):
        return verification_checks(session)
