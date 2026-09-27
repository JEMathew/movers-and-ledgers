from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from agents.contracts import WorkflowState
from agents.registry import AGENT_RESPONSIBILITIES

from .auth import Principal, require_principal
from .discover_assess import router as discover_assess_router
from .discover_assess.onboard_fpu import router as onboard_fpu_router
from .discover_assess.service import discover_assess_service
from .discover_assess.validate_configure import router as validate_configure_router
from .intake_api import router as intake_router
from .runtime.observability import SafeRequestMiddleware, emit
from .settings import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app):
    yield
    repository = discover_assess_service.repository
    if hasattr(repository, "engine"):
        repository.engine.dispose()
        if hasattr(repository, "connector"):
            repository.connector.close()


app = FastAPI(
    title="MoveBooks AI API",
    version="0.1.0",
    description="Independent, provider-neutral accounting migration contracts.",
    lifespan=lifespan,
)
app.add_middleware(SafeRequestMiddleware, enabled=settings.logging_mode == "structured")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)
app.include_router(discover_assess_router)
app.include_router(validate_configure_router)
app.include_router(onboard_fpu_router)
app.include_router(intake_router)


@app.exception_handler(Exception)
async def runtime_failure(request, error):
    emit(action="request", error_code="UNAVAILABLE", status=503)
    return JSONResponse(
        status_code=503, content={"detail": "Runtime unavailable; retry safely after recovery."}
    )


@app.get("/readyz", tags=["operations"])
def ready():
    try:
        repository = discover_assess_service.repository
        if hasattr(repository, "ready"):
            repository.ready()
        if settings.cloud:
            from .runtime.storage import GoogleArtifacts

            GoogleArtifacts(settings.google_project, settings.storage_bucket).ready()
        return {"status": "ready", "mode": settings.env}
    except Exception:
        emit(action="persistence", error_code="UNAVAILABLE", status=503)
        return JSONResponse(status_code=503, content={"status": "unavailable"})


@app.get("/v1/runtime", tags=["public"])
def runtime():
    return {
        "mode": settings.env,
        "identity": settings.identity_mode,
        "persistence": settings.persistence_backend,
        "uploads": "local-only",
        "model": "deterministic-fallback",
        "model_mode": settings.model_provider_mode,
        "production_ready": False,
    }


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
    if settings.cloud:
        raise HTTPException(410, "Create a persisted workspace through /v1/migration-sessions.")
    return WorkflowState(context={"created_by": principal.subject, "storage": "ephemeral-demo"})
