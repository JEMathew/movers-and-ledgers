"""Future async/analytics ports. No queue, BigQuery client or live model is activated."""

from datetime import datetime
from typing import Literal, Protocol
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AnalyticsEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: Literal[1] = 1
    event_id: UUID
    session_id: UUID
    occurred_at: datetime
    kind: Literal["lifecycle", "evaluation", "operations"]
    stage: Literal[
        "discover",
        "assess",
        "plan",
        "map",
        "migrate",
        "resolve",
        "validate",
        "configure",
        "onboard",
        "fpu",
    ]
    outcome: Literal["pending", "blocked", "failed", "verified"]
    # No freeform attributes, financial records, identity/email, prompt or reasoning.


class AnalyticsSink(Protocol):
    def emit(self, event: AnalyticsEvent) -> None: ...


class DisabledAnalytics:
    def emit(self, event: AnalyticsEvent) -> None:
        pass


class WorkCommand(BaseModel):
    model_config = ConfigDict(extra="forbid")
    session_id: UUID
    expected_snapshot_hash: str
    idempotency_key: UUID
    operation: Literal["migration", "validation", "fpu-verification"]
    # A future consumer MUST load owner/evidence, authorize and recheck CAS; this is
    # not an authorization ticket. No background task starts in this implementation.


class WorkDispatcher(Protocol):
    def submit(self, command: WorkCommand) -> UUID: ...
