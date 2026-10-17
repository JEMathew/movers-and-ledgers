"""Owner-scoped operational reservation snapshots; never financial audit authority.

No writes, provisioning or policy changes. The reused optional Firestore client is created
only behind existing cloud/synthetic-control gates. SDK and ADC failures are sanitized.
"""

import asyncio
import hashlib
import weakref
from contextlib import aclosing
from datetime import UTC, datetime

from domain.reasoning.models import Capability
from movebooks_api.runtime.model_controls import configured_controls

STATES = frozenset({"RESERVED", "COMPLETED", "FALLBACK", "UNAVAILABLE"})
CAPABILITIES = frozenset(str(value) for value in Capability)
MAX_EVENTS = 20
MAX_BUDGET_MICROUSD = 1_000_000_000_000
_read_slots = weakref.WeakKeyDictionary()


def project_event(value, owner_hash):
    """Independent owner check and strict scalar allowlist, even after a filtered query."""
    if not isinstance(value, dict) or value.get("owner_hash") != owner_hash:
        return None
    capability, state, created = (
        value.get("capability"),
        value.get("state"),
        value.get("created_at"),
    )
    if (
        not isinstance(capability, str)
        or capability not in CAPABILITIES
        or not isinstance(state, str)
        or state not in STATES
        or not isinstance(created, datetime)
        or created.tzinfo is None
        or created.utcoffset() is None
    ):
        return None
    calls, budget = value.get("reserved_calls"), value.get("reserved_microusd")
    if (
        type(calls) is not int
        or not 0 <= calls <= 2
        or type(budget) is not int
        or not 0 <= budget <= MAX_BUDGET_MICROUSD
    ):
        return None
    def bounded_count(key, maximum):
        number = value.get(key)
        return number if type(number) is int and 0 <= number <= maximum else None

    completed = value.get("completed_at")
    completed_at = None
    if (
        state != "RESERVED"
        and isinstance(completed, datetime)
        and completed.tzinfo is not None
        and completed.utcoffset() is not None
        and completed >= created
    ):
        completed_at = completed.astimezone(UTC).isoformat()
    usage_status = value.get("usage_status")
    if not isinstance(usage_status, str) or usage_status not in {"unknown", "partial", "complete"}:
        usage_status = None
    return {
        "capability": capability,
        "state": state,
        "created_at": created.astimezone(UTC).isoformat(),
        "reserved_calls": calls,
        "reserved_microusd": budget,
        "completed_at": completed_at,
        "model_calls": bounded_count("model_calls", 2),
        "tool_calls": bounded_count("tool_calls", 100),
        "input_tokens": bounded_count("input_tokens", 1_000_000),
        "output_tokens": bounded_count("output_tokens", 1_000_000),
        "usage_status": usage_status,
    }


async def read_activity(settings, owner, controls=None):
    """A two-second total ADC/read deadline; disabled means no datastore interaction.

    In-flight cancelled SDK cleanup keeps its slot until actually complete. Repeated reads
    cannot create unbounded work or duplicate cached ADC initialization.
    """
    disabled = {"status": "DISABLED", "events": []}
    unavailable = {"status": "UNAVAILABLE", "events": []}
    if (
        not settings.cloud
        or settings.model_controls_backend != "firestore"
        or settings.identity_mode != "firebase"
        or not settings.synthetic_beta_authorized
    ):
        return disabled
    if not isinstance(owner, str) or not owner.startswith("firebase:") or len(owner) <= 9:
        return unavailable
    loop = asyncio.get_running_loop()
    slots = _read_slots.setdefault(loop, asyncio.Semaphore(2))
    if slots.locked():
        return unavailable
    await slots.acquire()
    task = None

    def cleanup(finished):
        slots.release()
        if not finished.cancelled():
            finished.exception()

    try:
        deadline = min(2.0, settings.model_control_timeout_seconds)

        async def read():
            from google.cloud.firestore_v1.base_query import FieldFilter

            adapter = controls or await configured_controls(settings)
            owner_hash = hashlib.sha256(owner.encode()).hexdigest()
            query = (
                adapter.client.collection("movebooks_model_controls")
                .where(filter=FieldFilter("owner_hash", "==", owner_hash))
                .order_by("created_at", direction="DESCENDING")
                .limit(MAX_EVENTS)
            )
            events = []
            count = 0
            async with aclosing(query.stream(timeout=deadline, retry=None)) as stream:
                async for snapshot in stream:
                    count += 1
                    event = project_event(snapshot.to_dict(), owner_hash)
                    if event is not None:
                        events.append(event)
                    if count >= MAX_EVENTS:
                        break
            return {"status": "AVAILABLE", "events": events}

        task = asyncio.create_task(read())
        task.add_done_callback(cleanup)
        completed, _ = await asyncio.wait({task}, timeout=deadline)
        if not completed:
            task.cancel()
            return unavailable
        return task.result()
    except asyncio.CancelledError:
        if task is not None:
            task.cancel()
        raise
    except Exception:
        return unavailable  # No SDK, credential, owner or request text reaches callers.
    finally:
        if task is None:
            slots.release()
