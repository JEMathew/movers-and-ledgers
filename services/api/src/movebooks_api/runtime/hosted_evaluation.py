"""One non-renewable hosted authorization. No provisioning, seeding or ledger resets.

The operator must create the approved document exactly once, after hosted preflight.
This adapter only reads/updates it transactionally; an absent document denies calls.
The older Cloud Shell evaluation ledger is never referenced or accessed.
"""

import hashlib
import os
import re
from copy import deepcopy
from uuid import uuid4

from agents.reasoning.transport import CountedTransport

from .model_controls import ControlDenied, bounded_control, configured_controls

AUTHORIZATION_ID = "overnight-20261021-a005750a-74b2-4ff4-a205-d5d4ba0bfb2d"
CALL_LIMIT = 4
MAX_PLANNED_MICROUSD = 200_000
# Standard global text pricing, including reasoning, provided that the operator
# verifies maxOutputTokens bounds ALL billable output. Otherwise admission fails.
CALL_MICROUSD = 20_120  # 50,000*$0.30/M + 2,048*$2.50/M; no discounts assumed.


def digest(value):
    return hashlib.sha256(str(value).encode()).hexdigest()


def verify(document, policy, scope, revision):
    if policy.get("enabled") is not True or policy.get("synthetic_beta_authorized") is not True:
        raise ControlDenied("model_kill_switch")
    if not isinstance(document, dict) or (
        document.get("authorization_id") != AUTHORIZATION_ID
        or document.get("scope") != scope
        or document.get("revision") != revision
        or not revision
        or document.get("max_calls") != CALL_LIMIT
        or document.get("max_microusd") != MAX_PLANNED_MICROUSD
        or document.get("call_microusd") != CALL_MICROUSD
        or document.get("model") != "gemini-3.5-flash-lite"
        or document.get("location") != "global"
        or document.get("thinking") != "LOW"
        or document.get("state") not in {"APPROVED", "CLAIMED"}
    ):
        raise ControlDenied("hosted_authorization_unverified")
    for field in (
        "approved_synthetic_identity",
        "synthetic_workspace_verified",
        "private_acceptance_passed",
        "count_tokens_free_verified",
        "all_output_bounded_verified",
        "price_verified",
        "native_control_verification_passed",
    ):
        if document.get(field) is not True:
            raise ControlDenied("hosted_preflight_incomplete")
    if not re.fullmatch(r"[0-9a-f]{64}", document.get("preflight_evidence_sha256", "")):
        raise ControlDenied("hosted_preflight_evidence_missing")
    for key, limit in (("calls", CALL_LIMIT), ("reserved_microusd", MAX_PLANNED_MICROUSD)):
        if type(document.get(key)) is not int or not 0 <= document[key] <= limit:
            raise ControlDenied("hosted_counter_corrupt")
    roles = document.get("role_calls")
    if (
        not isinstance(roles, dict)
        or set(roles) != {"advisor", "reviewer"}
        or any(type(v) is not int or not 0 <= v <= 2 for v in roles.values())
        or sum(roles.values()) != document["calls"]
    ):
        raise ControlDenied("hosted_counter_corrupt")
    if document["reserved_microusd"] != document["calls"] * CALL_MICROUSD:
        raise ControlDenied("hosted_counter_corrupt")
    if type(document.get("in_flight")) is not bool:
        raise ControlDenied("hosted_counter_corrupt")


def transition(document, policy, scope, revision, claim, event, details=None):
    """Pure decision used inside a real Firestore transaction; no unsafe refund."""
    verify(document, policy, scope, revision)
    next_doc = deepcopy(document)
    if event == "claim":
        if (
            document["state"] != "APPROVED"
            or document["calls"] != 0
            or document.get("claim")
            or document["in_flight"]
        ):
            raise ControlDenied("hosted_authorization_already_claimed")
        next_doc.update(state="CLAIMED", claim=claim)
        return next_doc
    if document["state"] != "CLAIMED" or document.get("claim") != claim:
        raise ControlDenied("hosted_authorization_claim_mismatch")
    if event == "reserve":
        role, tokens, request_hash = details
        if (
            role not in {"advisor", "reviewer"}
            or type(tokens) is not int
            or not 0 < tokens <= 50_000
        ):
            raise ControlDenied("invalid_attempt")
        if (
            document["in_flight"]
            or document["calls"] >= CALL_LIMIT
            or document["role_calls"][role] >= 2
            or document["reserved_microusd"] + CALL_MICROUSD > MAX_PLANNED_MICROUSD
            or not re.fullmatch(r"[0-9a-f]{64}", request_hash)
        ):
            raise ControlDenied("hosted_attempt_budget")
        if role == "reviewer" and not document.get("advisor_complete"):
            raise ControlDenied("advisor_not_complete")
        if role == "advisor" and document.get("advisor_complete"):
            raise ControlDenied("advisor_already_complete")
        next_doc["calls"] += 1
        next_doc["role_calls"][role] += 1
        next_doc["reserved_microusd"] += CALL_MICROUSD
        next_doc.update(
            in_flight=True,
            last_attempt={
                "number": next_doc["calls"],
                "role": role,
                "counted_input_tokens": tokens,
                "request_sha256": request_hash,
                "state": "RESERVED",
            },
        )
    elif event == "response":
        number, trace = details
        if not document["in_flight"] or number != document["calls"]:
            raise ControlDenied("attempt_completion_mismatch")
        next_doc["in_flight"] = False
        next_doc["last_attempt"].update(state="RESPONSE_RECEIVED", **trace)
    elif event == "advisor_complete":
        if document["in_flight"] or not document["role_calls"]["advisor"]:
            raise ControlDenied("advisor_completion_mismatch")
        next_doc["advisor_complete"] = True
    elif event == "complete":
        if document["in_flight"] or not all(document["role_calls"].values()):
            raise ControlDenied("pair_completion_mismatch")
        next_doc["state"] = "COMPLETED"
    else:
        raise ControlDenied("invalid_hosted_transition")
    return next_doc


class HostedAuthority:
    def __init__(self, settings, owner, session_id, mapping_id, request_id, *, adapter=None):
        if not owner.startswith("firebase:"):
            raise ControlDenied("verified_identity_required")
        if (
            settings.google_project != "movebooks-ai"
            or settings.reasoning_project != "movebooks-ai"
            or settings.reasoning_location != "global"
            or settings.model_controls_backend != "firestore"
            or not settings.synthetic_beta_authorized
        ):
            raise ControlDenied("hosted_configuration_unverified")
        self.settings = settings
        self.scope = {
            "owner_hash": digest(owner),
            "workspace_hash": digest(session_id),
            "mapping_hash": digest(mapping_id),
        }
        self.claim_id = digest(f"{request_id}:{uuid4()}")
        self.revision = os.environ.get("K_REVISION", "")
        self.adapter = adapter

    async def change(self, event, details=None):
        from google.cloud import firestore

        async def operation():
            adapter = self.adapter or await configured_controls(self.settings)
            client = adapter.client
            collection = client.collection("movebooks_model_controls")
            ledger = collection.document("authorization-" + AUTHORIZATION_ID)
            policy = collection.document("policy")

            @firestore.async_transactional
            async def update(transaction):
                snapshots = [
                    await r.get(
                        transaction=transaction,
                        timeout=self.settings.model_control_timeout_seconds,
                        retry=None,
                    )
                    for r in (ledger, policy)
                ]
                document, current_policy = (s.to_dict() for s in snapshots)
                if snapshots[0].exists is not True or not isinstance(current_policy, dict):
                    raise ControlDenied("hosted_authorization_missing")
                if event == "halt":
                    if not isinstance(document, dict) or document.get("claim") != self.claim_id:
                        raise ControlDenied("hosted_authorization_claim_mismatch")
                    changed = {**document, "state": "HALTED"}
                else:
                    changed = transition(
                        document,
                        current_policy,
                        self.scope,
                        self.revision,
                        self.claim_id,
                        event,
                        details,
                    )
                transaction.update(ledger, changed)
                if event == "response":
                    # Immutable per-attempt sanitized evidence, written with terminal state.
                    transaction.create(
                        collection.document(f"attempt-{AUTHORIZATION_ID}-{details[0]}"),
                        changed["last_attempt"],
                    )
                return changed

            return await update(client.transaction(max_attempts=3))

        return await bounded_control(self.settings, operation)

    async def claim(self):
        await self.change("claim")

    async def reserve(self, role, tokens, request_hash):
        result = await self.change("reserve", (role, tokens, request_hash))
        return result["calls"]

    async def finish(self, number, trace):
        await self.change("response", (number, trace))

    async def halt(self):
        await self.change("halt")


def new_pair_guard(settings, owner, session_id, mapping_id, request_id):
    return CountedTransport(HostedAuthority(settings, owner, session_id, mapping_id, request_id))
