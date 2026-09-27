"""Small, versioned knowledge lookup for grounded resolution support."""

from dataclasses import dataclass

from agents.contracts import AgentRole
from domain.migration_resolution.models import ExceptionKind


@dataclass(frozen=True)
class ResolutionKnowledge:
    reference: str
    definition: str
    remediation_guardrail: str


_KNOWLEDGE_VERSION = "migration-resolution-knowledge-v1"
_CATALOG = {
    ExceptionKind.DUPLICATE_CUSTOMER: ResolutionKnowledge(
        f"knowledge:{_KNOWLEDGE_VERSION}:duplicate-customer",
        "Two source customer identities may represent one target party.",
        "Compare identity evidence; never merge financial histories without human approval.",
    ),
    ExceptionKind.MISSING_REFERENCE: ResolutionKnowledge(
        f"knowledge:{_KNOWLEDGE_VERSION}:missing-reference",
        "A transaction references an entity absent from the approved execution set.",
        "Repair lineage through an approved mapping; never synthesize an accounting identity.",
    ),
    ExceptionKind.UNSUPPORTED_TAX_CODE: ResolutionKnowledge(
        f"knowledge:{_KNOWLEDGE_VERSION}:unsupported-tax",
        "A source tax treatment has no verified target equivalent.",
        "Require a supported treatment and human approval; do not infer tax classification.",
    ),
    ExceptionKind.INVALID_CONFIGURATION_DEPENDENCY: ResolutionKnowledge(
        f"knowledge:{_KNOWLEDGE_VERSION}:configuration-dependency",
        "A target configuration prerequisite is absent or ordered incorrectly.",
        "Repair the declared dependency without changing approved accounting semantics.",
    ),
    ExceptionKind.TRANSIENT_EXECUTION: ResolutionKnowledge(
        f"knowledge:{_KNOWLEDGE_VERSION}:transient-execution",
        "A temporary execution condition interrupted a deterministic batch.",
        "Retry from the last checkpoint with the identical idempotency key.",
    ),
    ExceptionKind.RETRYABLE_BATCH: ResolutionKnowledge(
        f"knowledge:{_KNOWLEDGE_VERSION}:retryable-batch",
        "A bounded batch failed without invalidating prior checkpoints.",
        "Resume only the failed batch and preserve completed batch checksums.",
    ),
    ExceptionKind.NON_RETRYABLE_BLOCKED: ResolutionKnowledge(
        f"knowledge:{_KNOWLEDGE_VERSION}:non-retryable",
        "Execution cannot continue safely under the current manifest and policy.",
        "Block migration and escalate; never bypass the failure or mark it complete.",
    ),
}


class KnowledgeAgent:
    role = AgentRole.KNOWLEDGE
    source = "versioned-repository"

    def lookup_resolution(self, kind: ExceptionKind) -> ResolutionKnowledge:
        return _CATALOG[kind]
