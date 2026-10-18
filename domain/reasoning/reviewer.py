"""Independent mapping challenge contract; no accounting authority."""

from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from pydantic import Field

from .models import EvidenceFact, StrictModel

REVIEW_VERSION = "mapping-challenge-v1"


class ReviewFinding(StrictModel):
    outcome: Literal["CHALLENGED", "EVIDENCE_INCOMPLETE", "NO_CONTRADICTION_FOUND", "ESCALATE"]
    summary: str = Field(min_length=1, max_length=800)
    evidence_references: list[str] = Field(min_length=1, max_length=12)
    concerns: list[str] = Field(min_length=1, max_length=6)
    uncertainty: list[str] = Field(min_length=1, max_length=6)
    suggested_next_action: Literal[
        "INSPECT_SOURCE_PURPOSE", "REQUEST_MORE_EVIDENCE", "HUMAN_REVIEW"
    ]
    human_approval_required: Literal[True] = True
    financial_authority: Literal[False] = False


class ReviewRecord(StrictModel):
    request_id: UUID
    mapping_id: UUID
    context_hash: str
    requested_by: str
    requested_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None
    version: str = REVIEW_VERSION
    state: Literal["PENDING", "COMPLETED", "FALLBACK", "UNAVAILABLE"] = "PENDING"
    provider: str
    model: str | None = None
    finding: ReviewFinding | None = None
    evidence: list[EvidenceFact] = Field(default_factory=list)
    model_calls: int | None = None
    tool_calls: int | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    usage_status: Literal["unknown", "partial", "complete"] = "unknown"
    validation_issues: list[dict[str, str]] = Field(default_factory=list)
    response_shape: dict[str, str] = Field(default_factory=dict)
    failure_category: str | None = None
