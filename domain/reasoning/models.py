from datetime import UTC, datetime
from enum import StrEnum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

PROMPT_VERSION = "bounded-reasoning-v4"


class Capability(StrEnum):
    PLANNING = "planning"
    MAPPING = "mapping"
    RESOLUTION = "resolution"
    CONFIGURATION = "configuration"
    ONBOARDING = "onboarding"


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, allow_inf_nan=False)


class ReasoningRequest(StrictModel):
    request_id: UUID


class EvidenceFact(StrictModel):
    reference: str = Field(min_length=1, max_length=120)
    observation: str = Field(min_length=1, max_length=800)


class ReasoningInput(StrictModel):
    capability: Capability
    workflow_state: str
    facts: list[EvidenceFact] = Field(min_length=1, max_length=40)
    deterministic_results: list[str] = Field(max_length=40)
    requires_escalation: bool


class Advice(StrictModel):
    observation: str = Field(min_length=1, max_length=800)
    inference: str = Field(min_length=1, max_length=800)
    recommendation: str = Field(min_length=1, max_length=800)
    rationale: str = Field(min_length=1, max_length=800)
    evidence_references: list[str] = Field(min_length=1, max_length=40)
    confidence: float = Field(ge=0, le=1)
    uncertainty: list[str] = Field(min_length=1, max_length=6)
    alternatives: list[str] = Field(min_length=1, max_length=6)
    next_action: Literal["REVIEW_EXISTING_PROPOSAL", "REQUEST_MORE_EVIDENCE", "ESCALATE"]
    human_approval_required: Literal[True]
    financial_authority: Literal[False]


class ReasoningRecord(StrictModel):
    request_id: UUID
    capability: Capability
    context_hash: str
    requested_by: str
    requested_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None
    state: Literal["PENDING", "COMPLETED", "FALLBACK", "ESCALATED", "UNAVAILABLE"] = "PENDING"
    provider: str
    model: str | None = None
    prompt_version: str = PROMPT_VERSION
    advice: Advice | None = None
    evidence: list[EvidenceFact] = Field(default_factory=list)
    deterministic_results: list[str] = Field(default_factory=list)
    failure_category: str | None = None
    validation_issues: list[dict[str, str]] = Field(default_factory=list)
    response_shape: dict[str, str] = Field(default_factory=dict)
    usage_status: Literal["unknown", "partial", "complete"] = "unknown"
    finish_reason: str | None = None
    reserved_model_calls: int = 0
    model_calls: int | None = None
    tool_calls: int | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    latency_ms: int = 0
    estimated_cost_usd: float | None = None
    confidence_note: str = "Self-reported, uncalibrated; not permission or financial verification."
