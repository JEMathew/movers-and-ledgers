"""Read-only authenticated operational telemetry, independent of migration evidence."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, ConfigDict, Field

from domain.reasoning.models import Capability
from movebooks_api.auth import Principal, require_principal
from movebooks_api.runtime.operational_activity import read_activity
from movebooks_api.settings import get_settings

router = APIRouter(prefix="/v1/operations", tags=["operational-activity"])


class OperationalEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    capability: Capability
    state: Literal["RESERVED", "COMPLETED", "FALLBACK", "UNAVAILABLE"]
    created_at: str = Field(max_length=40)
    reserved_calls: int = Field(ge=0, le=2)
    reserved_microusd: int = Field(ge=0, le=1_000_000_000_000)
    completed_at: str | None = Field(default=None, max_length=40)
    model_calls: int | None = Field(default=None, ge=0, le=2)
    tool_calls: int | None = Field(default=None, ge=0, le=100)
    input_tokens: int | None = Field(default=None, ge=0, le=1_000_000)
    output_tokens: int | None = Field(default=None, ge=0, le=1_000_000)
    usage_status: Literal["unknown", "partial", "complete"] | None = None


class OperationalActivity(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["DISABLED", "AVAILABLE", "UNAVAILABLE"]
    events: list[OperationalEvent] = Field(max_length=20)


@router.get("/activity", response_model=OperationalActivity)
async def activity(response: Response, principal: Annotated[Principal, Depends(require_principal)]):
    response.headers["Cache-Control"] = "private, no-store"
    # Owner always comes from the verified bearer token, never a request parameter.
    return await read_activity(get_settings(), principal.subject)
