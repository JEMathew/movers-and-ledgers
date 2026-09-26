import hashlib
import json
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class AuditEvent(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    actor: str
    action: str
    resource_type: str
    resource_id: str
    outcome: str
    evidence_ids: list[UUID] = Field(default_factory=list)
    details: dict[str, Any] = Field(default_factory=dict)
    previous_hash: str | None = None
    event_hash: str | None = None

    def seal(self, previous_hash: str | None = None) -> "AuditEvent":
        payload = self.model_copy(update={"previous_hash": previous_hash, "event_hash": None})
        canonical = json.dumps(
            payload.model_dump(mode="json"), sort_keys=True, separators=(",", ":")
        )
        digest = hashlib.sha256(canonical.encode()).hexdigest()
        return payload.model_copy(update={"event_hash": digest})
