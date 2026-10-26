"""Isolated synthetic preview; no credentials, network clients or model provider."""
import sys
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path[:0] = [str(ROOT), str(ROOT / "services/api/src")]
from movebooks_api import settings  # noqa: E402

config = settings.Settings(
    _env_file=None, env="local", persistence_backend="memory",
    storage_backend="memory", identity_mode="demo", demo_identity_enabled=True,
    model_provider_mode="deterministic-only", synthetic_analysis_enabled=True,
    synthetic_beta_authorized=False, model_controls_backend="disabled",
    cors_origins=["http://127.0.0.1:3331", "http://localhost:3331"],
    logging_mode="off",
)
settings.get_settings = lru_cache(lambda: config)


def deny_network(event, args):
    if event in {"socket.connect", "socket.connect_ex", "socket.getaddrinfo"}:
        raise RuntimeError("Offline preview forbids outgoing network")


sys.addaudithook(deny_network)
import uvicorn  # noqa: E402
from movebooks_api.main import app  # noqa: E402

uvicorn.run(app, host="127.0.0.1", port=8331, access_log=False)
