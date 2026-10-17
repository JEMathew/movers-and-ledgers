"""Fail-closed cloud reservations; no Firestore infrastructure access in this suite."""

from concurrent.futures import ThreadPoolExecutor
from threading import Lock

import pytest
from movebooks_api.runtime.model_controls import ControlDenied, decide, reserve_live
from movebooks_api.settings import Settings
from test_google_runtime import CLOUD
from test_live_reasoning import GoodProvider, configured, prepared, run

from domain.reasoning.models import Capability

POLICY = {"enabled": True, "synthetic_beta_authorized": True}


def decision(policy=POLICY, owner=None, usage=None, reservation=None, **kwargs):
    return decide(
        policy,
        owner or {},
        usage or {},
        reservation or {},
        calls=2,
        cost=100,
        owner_limit=4,
        global_limit=6,
        budget_limit=300,
        **kwargs,
    )


def test_reservation_consumes_owner_global_and_cost_allowance_before_call():
    owner, usage = decision()
    assert owner == {"reserved_calls": 2}
    assert usage == {"reserved_calls": 2, "reserved_microusd": 100}
    owner, usage = decision(owner=owner, usage=usage)
    assert owner["reserved_calls"] == 4 and usage["reserved_microusd"] == 200
    with pytest.raises(ControlDenied, match="owner_model_quota"):
        decision(owner=owner, usage=usage)


@pytest.mark.parametrize(
    "policy",
    [
        {},
        {"enabled": True},
        {"enabled": "true", "synthetic_beta_authorized": True},
        {"enabled": False, "synthetic_beta_authorized": True},
    ],
)
def test_missing_or_disabled_policy_stops_all_calls(policy):
    with pytest.raises(ControlDenied, match="model_kill_switch"):
        decision(policy)


@pytest.mark.parametrize(
    "usage,category",
    [
        ({"reserved_calls": 6}, "global_model_quota"),
        ({"reserved_microusd": 300}, "global_model_budget"),
        ({"reserved_calls": -1}, "model_control_integrity"),
        ({"reserved_calls": True}, "model_control_integrity"),
        ({"reserved_microusd": "100"}, "model_control_integrity"),
    ],
)
def test_global_limits_and_corrupt_counters_fail_closed(usage, category):
    with pytest.raises(ControlDenied, match=category):
        decision(usage=usage)


def test_existing_reservation_never_reauthorizes_a_billable_replay():
    with pytest.raises(ControlDenied, match="already_exists"):
        decision(reservation={"state": "RESERVED"})


class TransactionDouble:
    """Serialized port double, not evidence of live Firestore behavior."""

    def __init__(self):
        self.lock = Lock()
        self.owner, self.usage, self.keys = {}, {}, set()

    def reserve(self, owner, key, capability):
        with self.lock:
            self.owner, self.usage = decision(
                owner=self.owner,
                usage=self.usage,
                reservation={"exists": True} if key in self.keys else {},
            )
            self.keys.add(key)


def cloud_settings(**changes):
    return Settings(
        **{
            **CLOUD,
            "synthetic_beta_authorized": True,
            "model_controls_backend": "firestore",
            **changes,
        },
        _env_file=None,
    )


def test_concurrent_port_reservations_cannot_exceed_quota():
    controls = TransactionDouble()

    def call(index):
        try:
            reserve_live(cloud_settings(), "firebase:owner", str(index), "mapping", controls)
            return True
        except ControlDenied:
            return False

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(call, range(20)))
    assert sum(results) == 2 and controls.usage["reserved_calls"] == 4


@pytest.mark.parametrize(
    "changes,owner",
    [
        ({"synthetic_beta_authorized": False}, "firebase:owner"),
        ({"model_controls_backend": "disabled"}, "firebase:owner"),
        ({}, "spoofed-owner"),
    ],
)
def test_public_activation_needs_explicit_synthetic_policy_and_verified_owner(changes, owner):
    controls = TransactionDouble()
    with pytest.raises(ControlDenied, match="public_model_controls_required"):
        reserve_live(cloud_settings(**changes), owner, "key", "mapping", controls)
    assert not controls.keys


def test_control_outage_is_sanitized_and_no_refund_is_issued():
    class Unavailable:
        def reserve(self, *args):
            raise RuntimeError("secret-token-canary")

    with pytest.raises(ControlDenied, match="^model_controls_unavailable$"):
        reserve_live(cloud_settings(), "firebase:owner", "key", "mapping", Unavailable())


def test_advisor_cloud_policy_denies_before_provider_and_returns_explicit_fallback():
    repo, session = prepared()
    original = repo.get(session.id, "owner")
    # Verified owner is required even when session ownership itself is valid.
    settings = configured(**CLOUD)
    provider = GoodProvider()
    result = run(repo, session, provider, settings=settings, cap=Capability.MAPPING)
    assert provider.calls == 0 and result.state == "FALLBACK"
    assert result.failure_category == "public_model_controls_required"
    assert original.mappings == repo.get(session.id, "owner").mappings
