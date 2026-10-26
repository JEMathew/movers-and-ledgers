"""Conservative model reservations, independent of financial/session authority.

Firestore is optional and disabled by default. No database or policy is auto-created.
All reservations consume the full allowance even on timeout; there are no unsafe refunds.
"""

import asyncio
import hashlib
import weakref
from datetime import UTC, datetime


class ControlDenied(ValueError):
    pass


def usage_document(snapshot, required_fields):
    """Only a genuinely absent daily counter starts at zero, never a damaged one."""
    data = snapshot.to_dict()
    if snapshot.exists is False and data is None:
        return {}
    if (
        snapshot.exists is not True
        or not isinstance(data, dict)
        or not all(field in data for field in required_fields)
    ):
        raise ControlDenied("model_control_integrity")
    return data


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

            client = firestore.AsyncClient(
                project=settings.google_project, database=settings.firestore_database
            )
        self.client = client

    async def reserve(self, owner, key, capability):
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

        @firestore.async_transactional
        async def commit(transaction):
            policy_snapshot, owner_snapshot, global_snapshot, reservation_snapshot = [
                await ref.get(
                    transaction=transaction,
                    timeout=settings.model_control_timeout_seconds,
                    retry=None,
                )
                for ref in (policy_ref, owner_ref, global_ref, reservation_ref)
            ]
            # Existence is authoritative: an empty/corrupt reservation still consumes
            # its identity. Missing fields must never reset daily usage to zero.
            if reservation_snapshot.exists is True:
                raise ControlDenied("model_reservation_already_exists")
            if (
                reservation_snapshot.exists is not False
                or reservation_snapshot.to_dict() is not None
            ):
                raise ControlDenied("model_control_integrity")
            policy = policy_snapshot.to_dict()
            if not isinstance(policy, dict):
                raise ControlDenied("model_kill_switch")
            owner_usage = usage_document(owner_snapshot, ("reserved_calls",))
            global_usage = usage_document(
                global_snapshot, ("reserved_calls", "reserved_microusd")
            )
            new_owner, new_global = decide(
                policy,
                owner_usage,
                global_usage,
                {},
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
                    "owner_hash": owner_hash,
                    "capability": capability,
                    "reserved_calls": 2,
                    "reserved_microusd": settings.reasoning_reservation_microusd,
                    "state": "RESERVED",
                    "created_at": firestore.SERVER_TIMESTAMP,
                },
            )

        await commit(self.client.transaction(max_attempts=3))

    async def finish(self, owner, key, state, usage):
        """Annotate a reserved operational event; never a financial/audit authority."""
        from google.cloud import firestore

        if state not in {"COMPLETED", "FALLBACK", "UNAVAILABLE"}:
            raise ControlDenied("invalid_operational_outcome")
        owner_hash = hashlib.sha256(owner.encode()).hexdigest()
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        ref = self.client.collection("movebooks_model_controls").document(f"reservation-{key_hash}")
        snapshot = await ref.get(
            timeout=self.settings.model_control_timeout_seconds,
            retry=None,
        )
        observed = snapshot.to_dict() or {}
        if observed.get("owner_hash") != owner_hash:
            raise ControlDenied("operational_event_owner_mismatch")
        if observed.get("state") != "RESERVED":
            return  # Final operational outcomes are immutable on replay.
        version = snapshot.update_time
        if version is None:
            raise ControlDenied("operational_event_version_missing")

        def count(value, maximum):
            return value if type(value) is int and 0 <= value <= maximum else None

        await ref.update(
            {
                "state": state,
                "completed_at": firestore.SERVER_TIMESTAMP,
                "model_calls": count(usage.model_calls, 2),
                "tool_calls": count(usage.tool_calls, 2),
                "input_tokens": count(usage.input_tokens, 1000000),
                "output_tokens": count(usage.output_tokens, 1000000),
                "usage_status": usage.usage_status
                if usage.usage_status in {"unknown", "partial", "complete"}
                else "unknown",
            },
            # A competing completion must not overwrite the winning terminal outcome.
            option=self.client.write_option(last_update_time=version),
            timeout=self.settings.model_control_timeout_seconds,
            retry=None,
        )


# At most two reservation tasks per event loop, including cancelled tasks still
# cleaning up an SDK transaction. A slow rollback cannot create unbounded work.
_control_slots = weakref.WeakKeyDictionary()
_control_clients = weakref.WeakKeyDictionary()


async def configured_controls(settings):
    """One lazily authenticated client per project/loop. ADC never blocks the event loop.

    The initializer stays cached even if a caller times out; another request cannot
    launch duplicate credential discovery. Failed initialization requires restart.
    """
    loop = asyncio.get_running_loop()
    clients = _control_clients.setdefault(loop, {})
    identity = (settings.google_project, settings.firestore_database)
    if identity not in clients:
        clients[identity] = asyncio.create_task(asyncio.to_thread(FirestoreModelControls, settings))
    return await asyncio.shield(clients[identity])


async def close_model_controls():
    """Close reused gRPC channels during application shutdown only."""
    clients = _control_clients.pop(asyncio.get_running_loop(), {})
    for task in clients.values():
        if not task.done() or task.cancelled():
            task.cancel()
            continue
        try:
            adapter = task.result()
            # AsyncClient.close() only closes HTTP in this SDK version. The generated
            # async GAPIC transport exposes the actual gRPC close coroutine.
            api = adapter.client.__dict__.get("_firestore_api_internal")
            if api is not None:
                await api.transport.close()
        except Exception:
            pass  # Shutdown emits no SDK/credential details.


async def reserve_live(settings, owner, key, capability, controls=None):
    if not settings.cloud:
        return
    if (
        settings.identity_mode != "firebase"
        or not owner.startswith("firebase:")
        or not settings.synthetic_beta_authorized
        or settings.model_controls_backend != "firestore"
    ):
        raise ControlDenied("public_model_controls_required")

    async def operation():
        adapter = controls or await configured_controls(settings)
        await adapter.reserve(owner, key, capability)

    await bounded_control(settings, operation)


async def finish_live(settings, owner, key, state, usage):
    """Best-effort visibility after the authoritative session result is committed."""
    if (
        not settings.cloud
        or settings.model_controls_backend != "firestore"
        or not settings.synthetic_beta_authorized
        or not owner.startswith("firebase:")
    ):
        return False

    async def operation():
        adapter = await configured_controls(settings)
        await adapter.finish(owner, key, state, usage)

    try:
        await bounded_control(settings, operation)
        return True
    except ControlDenied:
        return False  # Missing telemetry is never a successful financial/model operation.


async def bounded_control(settings, operation):
    loop = asyncio.get_running_loop()
    slots = _control_slots.setdefault(loop, asyncio.Semaphore(2))
    if slots.locked():
        raise ControlDenied("model_controls_busy")
    await slots.acquire()
    task = None

    def cleanup(finished):
        slots.release()
        if not finished.cancelled():
            finished.exception()  # Consume failures; no provider or RPC text is logged.

    try:
        task = asyncio.create_task(operation())
        task.add_done_callback(cleanup)
        completed, _ = await asyncio.wait({task}, timeout=settings.model_control_timeout_seconds)
        if not completed:
            task.cancel()
            # Do not wait for SDK rollback: capacity remains occupied until cleanup.
            # A late durable reservation is conservatively consumed, never reused.
            raise ControlDenied("model_controls_timeout")
        return task.result()
    except ControlDenied:
        raise
    except asyncio.CancelledError:
        if task is not None:
            task.cancel()
        raise
    except Exception:
        raise ControlDenied("model_controls_unavailable") from None
    finally:
        if task is None:
            slots.release()
