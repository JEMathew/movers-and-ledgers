from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.contracts import WorkflowState
from agents.registry import AGENT_RESPONSIBILITIES

from .auth import Principal, require_principal
from .discover_assess import router as discover_assess_router
from .discover_assess.validate_configure import router as validate_configure_router
from .settings import get_settings

settings = get_settings()
app = FastAPI(
    title="MoveBooks AI API",
    version="0.1.0",
    description="Independent, provider-neutral accounting migration contracts.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)
app.include_router(discover_assess_router)
app.include_router(validate_configure_router)


@app.get("/healthz", tags=["operations"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "movebooks-api"}


@app.get("/v1/product", tags=["public"])
async def product() -> dict[str, object]:
    return {
        "name": "MoveBooks AI",
        "company": "Movers & Ledgers",
        "independent": True,
        "disclaimer": "Synthetic concept; not an accounting provider implementation.",
    }


@app.get("/v1/agents", tags=["trust"])
async def agents() -> dict[str, str]:
    return {role.value: purpose for role, purpose in AGENT_RESPONSIBILITIES.items()}


@app.post("/v1/workspaces", tags=["migration"], response_model=WorkflowState)
async def create_workspace(
    principal: Annotated[Principal, Depends(require_principal)],
) -> WorkflowState:
    return WorkflowState(context={"created_by": principal.subject, "storage": "ephemeral-demo"})
