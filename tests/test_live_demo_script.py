"""The Advisor + Reviewer demonstration is offline by default and refuses unconfirmed live runs."""

import asyncio
import subprocess
import sys
from pathlib import Path

from movebooks_api.settings import Settings

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import live_advisor_reviewer_demo as demo  # noqa: E402


def test_offline_run_calls_no_model_and_keeps_authority_boundaries():
    result = asyncio.run(
        demo.run(Settings(_env_file=None, model_provider_mode="fallback"), live=False)
    )
    assert result["mode"].startswith("offline-fallback")
    for role in ("advisor", "reviewer"):
        assert result[role]["used_fallback"] is True
        assert result[role]["usage"]["model_calls"] == 0
    assert result["advisor"]["output"]["human_approval_required"] is True
    assert result["advisor"]["output"]["financial_authority"] is False
    assert result["reviewer"]["output"]["outcome"] == "CHALLENGED"
    assert result["reviewer"]["independent_evidence"].endswith("was not supplied")
    assert result["deterministic_baseline"]["state"] == "REVIEW_REQUIRED"


def test_live_is_refused_without_explicit_confirmation_and_pins():
    script = Path(demo.__file__)
    for args in (["--live"], ["--live", "--confirm-usd1-synthetic-test"]):
        done = subprocess.run([sys.executable, str(script), *args], capture_output=True, text=True)
        assert done.returncode == 2 and "Live requires explicit confirmation" in done.stderr
