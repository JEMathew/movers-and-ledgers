"""Focused combined acceptance. No network, credential loading or real ledger."""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
os.chdir(ROOT)
sys.path[:0] = [str(ROOT), str(ROOT / "services/api/src")]
os.environ["MOVEBOOKS_MODEL_PROVIDER_MODE"] = "deterministic-only"
os.environ["MOVEBOOKS_SYNTHETIC_BETA_AUTHORIZED"] = "false"


def deny_network(event, args):
    if event in {"socket.connect", "socket.connect_ex", "socket.getaddrinfo"}:
        raise RuntimeError("Network forbidden in offline integration tests")


sys.addaudithook(deny_network)
import pytest  # noqa: E402

FILES = [
    "test_post_inference_integration", "test_assisted_analysis",
    "test_live_reasoning", "test_independent_review", "test_reasoning_configuration",
    "test_model_controls", "test_gemini_evaluation_guards",
    "test_gemini_exception_matrix", "test_gemini_human_journey",
    "test_agent_quality_judge", "test_offline_agent_eval",
    "test_plan_map_approve", "test_explicit_plan_approval",
    "test_mapping_reconsideration", "test_migration_listing",
    "test_identity_display", "test_discover_assess",
    "test_migrate_resolve", "test_validate_configure", "test_onboard_fpu",
    "test_journey_evidence", "test_gemini_release_commands", "test_beta_v1_integration",
]
raise SystemExit(pytest.main([
    "-q", "-rs", "-p", "no:cacheprovider",
    *(sys.argv[1:] or [f"tests/{name}.py" for name in FILES]),
]))
