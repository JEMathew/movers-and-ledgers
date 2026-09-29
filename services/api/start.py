"""Shell-free container entrypoint, preserving the platform PORT and shutdown contract."""

import os

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "movebooks_api.main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8080")),
        access_log=False,
        timeout_graceful_shutdown=8,
        timeout_keep_alive=5,
    )
