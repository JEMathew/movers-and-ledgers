"""TEST IMAGE ONLY: real API/SQL with synthetic identities; never a deployable entrypoint."""

import os
import sys
import time

from fastapi import Header, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url

if os.environ.get("MOVEBOOKS_ENV") != "test" or os.environ.get("K_SERVICE"):
    raise SystemExit("Runtime harness requires isolated local test mode")

try:
    url = make_url(os.environ["MOVEBOOKS_TEST_DATABASE_URL"])
    if url.drivername != "postgresql+pg8000" or not url.host or not url.database:
        raise ValueError("Invalid database URL")
    engine = create_engine(
        url,
        pool_pre_ping=True,
        hide_parameters=True,
        pool_size=3,
        max_overflow=0,
        pool_timeout=2,
        connect_args={"timeout": 3},
    )
except Exception:
    raise SystemExit("Invalid test database configuration (value redacted)") from None

from movebooks_api.auth import Principal, require_principal  # noqa: E402
from movebooks_api.discover_assess.service import discover_assess_service  # noqa: E402
from movebooks_api.main import app  # noqa: E402
from movebooks_api.runtime.persistence import SqlSessionRepository, metadata  # noqa: E402

if "--schema" in sys.argv:
    metadata.create_all(engine)
    engine.dispose()
    raise SystemExit(0)

discover_assess_service.repository = SqlSessionRepository(engine)


def synthetic_owner(authorization: str | None = Header(default=None)):
    identities = {
        "Bearer runtime-owner-a": "runtime-owner-a",
        "Bearer runtime-owner-b": "runtime-owner-b",
    }
    if authorization not in identities:
        raise HTTPException(401, "Synthetic test identity required")
    return Principal(identities[authorization], "")


app.dependency_overrides[require_principal] = synthetic_owner


@app.get("/test/bounded-operation")
def bounded_operation():
    # Test-only marker synchronizes SIGTERM with an active worker, not an arbitrary sleep.
    print("BOUNDED_OPERATION_STARTED", flush=True)
    time.sleep(2)
    return {"completed": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8089")),
        access_log=False,
        timeout_graceful_shutdown=8,
    )
