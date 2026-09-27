"""Capability-level model routing with deterministic and optional GenAI paths."""

from dataclasses import dataclass


@dataclass(frozen=True)
class CapabilityRoute:
    capability: str
    provider: str
    model: str | None
    rationale: str


CAPABILITY_ROUTES = {
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
