from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


def owner_decision_role(subject: str) -> str:
    """Label a server-verified owner; callers must still enforce workspace ownership."""
    return "WORKSPACE_OWNER" if subject.startswith("firebase:") else "DEMO_WORKSPACE_OWNER"


class DecisionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal["approve", "modify", "reject"]
    selection: str | None = Field(default=None, max_length=80)
    comment: str = Field(default="", max_length=1000)


class Decision(BaseModel):
    actor: str
    role: str = "DEMO_WORKSPACE_OWNER"
    at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    action: Literal["approve", "modify", "reject"]
    selection: str
    evidence_hash: str
    comment: str = ""


class OnboardingTask(BaseModel):
    id: str
    label: str
    status: Literal["COMPLETED", "REVIEW_REQUIRED", "BLOCKED"]
    explanation: str
    next_action: str
    evidence: list[str]
    approval_required: bool = False
    choices: list[str] = Field(default_factory=list)
    decision: Decision | None = None


class InvoiceInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    customer_id: str = Field(min_length=1, max_length=100)
    product_id: str = Field(min_length=1, max_length=100)
    quantity: int = Field(default=1, ge=1, le=1000, strict=True)
    unit_price: str = Field(default="100.00", min_length=1, max_length=20)


class FpuCheck(BaseModel):
    id: str
    passed: bool
    explanation: str
    evidence: list[str]


class FpuTask(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    version: str = "fpu-invoice-v1"
    inputs: InvoiceInput
    contract: dict
    contract_hash: str
    status: str = "AWAITING_APPROVAL"
    decisions: list[Decision] = Field(default_factory=list)
    idempotency_key: str | None = None
    attempts: int = 0
    retry_limit: int = 3
    checkpoint: Literal["DRAFT", "POSTED", "VERIFIED"] = "DRAFT"
    invoice: dict | None = None
    journal: dict | None = None
    checks: list[FpuCheck] = Field(default_factory=list)
    posted_by: str | None = None
    posted_at: datetime | None = None
    verified_at: datetime | None = None
    evidence_hash: str | None = None


class OnboardingState(BaseModel):
    version: str = "onboarding-v1"
    configuration_id: UUID
    context_hash: str
    tasks: list[OnboardingTask] = Field(default_factory=list)
    decisions: dict[str, list[Decision]] = Field(default_factory=dict)
    fpu: FpuTask | None = None
    fpu_history: list[FpuTask] = Field(default_factory=list)
    # Operational records are separate from the immutable migration snapshot.
    invoices: dict[str, dict] = Field(default_factory=dict)
    journals: dict[str, dict] = Field(default_factory=dict)
    faults: list[str] = Field(default_factory=list)
    fault_history: list[dict] = Field(default_factory=list)
    completed_task_ids: list[str] = Field(default_factory=list)
