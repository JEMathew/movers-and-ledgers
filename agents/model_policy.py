"""Capability-level model routing with deterministic and optional GenAI paths."""

from dataclasses import dataclass


@dataclass(frozen=True)
class CapabilityRoute:
    capability: str
    provider: str
    model: str | None
    rationale: str


CAPABILITY_ROUTES = {
    "onboarding_guidance": CapabilityRoute(
        "onboarding_guidance",
        "google-adk-compatible",
        "gemini-2.5-flash",
        "Optional grounded guidance only; deterministic fallback remains available.",
    ),
    "productive_use_verification": CapabilityRoute(
        "productive_use_verification",
        "deterministic",
        None,
        "Financial execution and verification cannot be delegated to model judgment.",
    ),
    "financial_reconciliation": CapabilityRoute(
        "financial_reconciliation",
        "deterministic",
        None,
        "Only exact versioned checks may assert financial verification.",
    ),
    "configuration_recommendation": CapabilityRoute(
        "configuration_recommendation",
        "google-adk-compatible",
        "gemini-2.5-flash",
        "Advisory explanations; rules and human approval remain authoritative.",
    ),
    "migration_execution": CapabilityRoute(
        "migration_execution",
        "deterministic",
        None,
        "Financial writes, validation, idempotency, and checkpoints remain deterministic.",
    ),
    "resolution_reasoning": CapabilityRoute(
        "resolution_reasoning",
        "google-adk-compatible",
        "gemini-2.5-pro",
        "Complex exception reasoning may use a high-capability model when explicitly configured.",
    ),
    "customer_explanation": CapabilityRoute(
        "customer_explanation",
        "google-adk-compatible",
        "gemini-2.5-flash",
        "Bounded explanation can use a faster model without granting tool or workflow authority.",
    ),
    "governance_decision": CapabilityRoute(
        "governance_decision",
        "deterministic",
        None,
        "Policy gates and consequential decisions are deterministic or human-governed.",
    ),
    "knowledge_retrieval": CapabilityRoute(
        "knowledge_retrieval",
        "versioned-repository",
        None,
        "Resolution evidence comes from versioned, inspectable repository knowledge.",
    ),
}


def route_for(capability: str) -> CapabilityRoute:
    try:
        return CAPABILITY_ROUTES[capability]
    except KeyError as error:
        message = f"No governed model route exists for capability '{capability}'."
        raise ValueError(message) from error


def live_route(capability, settings) -> CapabilityRoute:
    """Explicit capability allowlist; never routes arithmetic or control capabilities."""
    from domain.reasoning.models import Capability

    capability = Capability(capability)
    live = settings.model_provider_mode == "gemini-adk"
    return CapabilityRoute(
        capability.value,
        "gemini-adk" if live else "deterministic-fallback",
        settings.reasoning_models[capability] if live else None,
        "Advisory reasoning only; existing deterministic services retain all authority.",
    )
