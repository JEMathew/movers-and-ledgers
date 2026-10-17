"""Conservative model reservations, independent of financial/session authority.

Firestore is optional and disabled by default. No database or policy is auto-created.
All reservations consume the full allowance even on timeout; there are no unsafe refunds.
"""

import hashlib
from datetime import UTC, datetime


class ControlDenied(ValueError):
    pass


def decide(
    policy,
    owner,
    global_usage,
    reservation,
    *,
    calls,
    cost,
    owner_limit,
    global_limit,
    budget_limit,
):
    """Pure transaction decision. Existing reservations never authorize a second call."""
    if policy.get("enabled") is not True or policy.get("synthetic_beta_authorized") is not True:
        raise ControlDenied("model_kill_switch")
    if reservation:
        raise ControlDenied("model_reservation_already_exists")
    if any(
        type(value) is not int or value < 0
        for value in (
            owner.get("reserved_calls", 0),
            global_usage.get("reserved_calls", 0),
            global_usage.get("reserved_microusd", 0),
        )
    ):
        raise ControlDenied("model_control_integrity")
    if owner.get("reserved_calls", 0) + calls > owner_limit:
        raise ControlDenied("owner_model_quota")
    if global_usage.get("reserved_calls", 0) + calls > global_limit:
        raise ControlDenied("global_model_quota")
    if global_usage.get("reserved_microusd", 0) + cost > budget_limit:
        raise ControlDenied("global_model_budget")
    return (
        {"reserved_calls": owner.get("reserved_calls", 0) + calls},
        {
            "reserved_calls": global_usage.get("reserved_calls", 0) + calls,
            "reserved_microusd": global_usage.get("reserved_microusd", 0) + cost,
        },
    )


class FirestoreModelControls:
    """One serializable transaction for kill switch, owner/global usage and reservation."""

    def __init__(self, settings, client=None):
        self.settings = settings
        if client is None:
            from google.cloud import firestore

            client = firestore.Client(project=settings.google_project)
        self.client = client

    def reserve(self, owner, key, capability):
        from google.cloud import firestore

        settings = self.settings
        day = datetime.now(UTC).strftime("%Y-%m-%d")
        owner_hash = hashlib.sha256(owner.encode()).hexdigest()
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        collection = self.client.collection("movebooks_model_controls")
        policy_ref = collection.document("policy")
        owner_ref = collection.document(f"owner-{day}-{owner_hash}")
        global_ref = collection.document(f"global-{day}")
        reservation_ref = collection.document(f"reservation-{key_hash}")

        @firestore.transactional
        def commit(transaction):
            policy, owner_usage, global_usage, reservation = [
                ref.get(transaction=transaction).to_dict() or {}
                for ref in (policy_ref, owner_ref, global_ref, reservation_ref)
            ]
            new_owner, new_global = decide(
                policy,
                owner_usage,
                global_usage,
                reservation,
                calls=2,
                cost=settings.reasoning_reservation_microusd,
                owner_limit=settings.reasoning_owner_daily_calls,
                global_limit=settings.reasoning_global_daily_calls,
                budget_limit=settings.reasoning_global_daily_microusd,
            )
            transaction.set(owner_ref, new_owner)
            transaction.set(global_ref, new_global)
            # Only a pseudonymous key and enum/scalar execution allowance; no prompt,
            # financial payload, actor ID, model text or credentials.
            transaction.set(
                reservation_ref,
                {
                    "day": day,
                    "capability": capability,
                    "reserved_calls": 2,
                    "reserved_microusd": settings.reasoning_reservation_microusd,
                    "state": "RESERVED",
                    "created_at": firestore.SERVER_TIMESTAMP,
                },
            )

        commit(self.client.transaction(max_attempts=3))


def reserve_live(settings, owner, key, capability, controls=None):
    if not settings.cloud:
        # Local test invocations keep the existing durable-per-session cap. There
        # is no public activation or Firestore integration implied here.
        return
    if (
        settings.identity_mode != "firebase"
        or not owner.startswith("firebase:")
        or not settings.synthetic_beta_authorized
        or settings.model_controls_backend != "firestore"
    ):
        raise ControlDenied("public_model_controls_required")
    try:
        (controls or FirestoreModelControls(settings)).reserve(owner, key, capability)
    except ControlDenied:
        raise
    except Exception:
        raise ControlDenied("model_controls_unavailable") from None
