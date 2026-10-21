"""Accepted, nonrenewing judge campaign. Disabled by default; never seeds cloud state.

Separate from the single-use hosted validation grant and historical ledger. All
admission counters and concurrency slots share one Firestore transaction. Missing
acceptance/eligibility/native evidence fails closed. No SDK generation retries.
"""

import os
import re
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from agents.reasoning.transport import CountedTransport

from .hosted_evaluation import digest
from .model_controls import ControlDenied, bounded_control, configured_controls

CAMPAIGN_ID = "judge-mvp-20261021-v1"
APPROVAL_SHA = "8290099eb7ca67e0a48acf2e77b40f68165488cdf088ce219d1021f9ac95eb47"
FIXTURE_SHA = "8e1690fa10cc1bc13624fd1b18fbfacd3f862c1fa4c21377797ffe8872e4e57e"
PAIR_MICROUSD = 80_480
LIMITS = {
    "budget_microusd": 5_000_000,
    "owner_daily": 5,
    "workspace_daily": 10,
    "concurrent_pairs": 2,
    "pair_attempts": 4,
    "role_attempts": 2,
    "pair_microusd": PAIR_MICROUSD,
}
PROOFS = (
    "private_acceptance_passed",
    "count_tokens_free_verified",
    "all_output_bounded_verified",
    "price_verified",
    "native_control_verification_passed",
    "compatible_rollback_verified",
    "live_disclosures_accepted",
)


def sha(value):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value) is not None


def fail(condition, reason):
    if not condition:
        raise ControlDenied(reason)


def campaign_check(campaign, revision, now, *, admit):
    fail(isinstance(campaign, dict), "judge_campaign_missing")
    fail(
        campaign.get("campaign_id") == CAMPAIGN_ID
        and campaign.get("owner_acceptance_sha256") == APPROVAL_SHA
        and campaign.get("state") == "APPROVED"
        and campaign.get("revision") == revision
        and bool(revision)
        and campaign.get("model") == "gemini-3.5-flash-lite"
        and campaign.get("location") == "global"
        and campaign.get("thinking") == "LOW"
        and campaign.get("max_input_tokens") == 50_000
        and campaign.get("max_output_tokens") == 2048
        and all(type(campaign.get(k)) is int and campaign[k] == v for k, v in LIMITS.items())
        and all(campaign.get(k) is True for k in PROOFS)
        and sha(campaign.get("preflight_evidence_sha256")),
        "judge_campaign_unverified",
    )
    start, end = campaign.get("start_utc"), campaign.get("end_utc")
    fail(
        all(isinstance(t, datetime) and t.utcoffset() == timedelta(0) for t in (start, end, now)),
        "judge_window_invalid",
    )
    fail(end - start == timedelta(days=7), "judge_window_invalid")
    if admit:
        fail(start <= now < end, "judge_window_closed")
    count, cost, slots = (
        campaign.get("analyses"),
        campaign.get("reserved_microusd"),
        campaign.get("active_claims"),
    )
    fail(
        type(count) is int
        and 0 <= count <= 62
        and type(cost) is int
        and cost == count * PAIR_MICROUSD
        and isinstance(slots, list)
        and len(slots) <= min(2, count)
        and all(sha(s) for s in slots)
        and len(set(slots)) == len(slots),
        "judge_campaign_corrupt",
    )


def admission_check(policy, eligibility, scope):
    fail(
        isinstance(policy, dict)
        and policy.get("enabled") is True
        and policy.get("synthetic_beta_authorized") is True,
        "model_kill_switch",
    )
    fail(
        isinstance(eligibility, dict)
        and eligibility.get("active") is True
        and eligibility.get("approved_synthetic_identity") is True
        and eligibility.get("synthetic_workspace_verified") is True
        and eligibility.get("campaign_id") == CAMPAIGN_ID
        and eligibility.get("owner_hash") == scope["owner_hash"]
        and eligibility.get("workspace_hash") == scope["workspace_hash"]
        and eligibility.get("fixture_sha256") == FIXTURE_SHA
        and sha(eligibility.get("provenance_sha256")),
        "judge_identity_provenance_unverified",
    )


def daily_count(value, maximum):
    # Only absent snapshots are converted to None by the adapter.
    if value is None:
        return 0
    fail(
        isinstance(value, dict)
        and set(value) == {"analyses"}
        and type(value["analyses"]) is int
        and 0 <= value["analyses"] <= maximum,
        "judge_daily_corrupt",
    )
    return value["analyses"]


def decide(
    campaign,
    policy,
    eligibility,
    record,
    owner_day,
    workspace_day,
    *,
    scope,
    revision,
    key,
    nonce,
    basis,
    now,
    event,
    details=None,
):
    """Pure decision; used only inside the adapter's serializable transaction."""
    fail(sha(key) and sha(nonce) and sha(basis), "judge_request_invalid")
    admit = event in {"claim", "reserve", "advisor_complete"}
    campaign_check(campaign, revision, now, admit=admit)
    if admit:
        admission_check(policy, eligibility, scope)
    c = deepcopy(campaign)
    if event == "claim":
        fail(record is None, "judge_request_already_claimed")
        owners = daily_count(owner_day, 5)
        workspaces = daily_count(workspace_day, 10)
        fail(owners < 5, "judge_owner_daily_limit")
        fail(workspaces < 10, "judge_workspace_daily_limit")
        fail(len(c["active_claims"]) < 2, "judge_concurrency_limit")
        fail(c["reserved_microusd"] + PAIR_MICROUSD <= 5_000_000, "judge_campaign_budget")
        c["analyses"] += 1
        c["reserved_microusd"] += PAIR_MICROUSD
        c["active_claims"].append(key)
        r = {
            "state": "CLAIMED",
            "scope": scope,
            "revision": revision,
            "nonce": nonce,
            "basis": basis,
            "calls": 0,
            "role_calls": {"advisor": 0, "reviewer": 0},
            "in_flight": False,
            "advisor_complete": False,
        }
        return c, r, {"analyses": owners + 1}, {"analyses": workspaces + 1}
    fail(
        isinstance(record, dict)
        and record.get("scope") == scope
        and record.get("revision") == revision
        and record.get("nonce") == nonce
        and record.get("basis") == basis,
        "judge_claim_mismatch",
    )
    r = deepcopy(record)
    roles = r.get("role_calls")
    fail(
        type(r.get("calls")) is int
        and isinstance(roles, dict)
        and set(roles) == {"advisor", "reviewer"}
        and all(type(n) is int and 0 <= n <= 2 for n in roles.values())
        and sum(roles.values()) == r["calls"]
        and type(r.get("in_flight")) is bool
        and type(r.get("advisor_complete")) is bool,
        "judge_claim_corrupt",
    )
    if event == "halt" and r.get("state") == "HALTED":
        return c, r, owner_day, workspace_day  # Idempotent cleanup; never refund a slot.
    fail(r.get("state") == "CLAIMED" and key in c["active_claims"], "judge_claim_mismatch")
    if event == "reserve":
        role, tokens, fingerprint = details
        fail(
            role in roles and type(tokens) is int and 0 < tokens <= 50000 and sha(fingerprint),
            "judge_attempt_invalid",
        )
        fail(not r["in_flight"] and r["calls"] < 4 and roles[role] < 2, "judge_attempt_limit")
        fail((role == "reviewer") == r["advisor_complete"], "judge_role_order")
        r["calls"] += 1
        r["role_calls"][role] += 1
        r["in_flight"] = True
        r["last_attempt"] = {
            "number": r["calls"],
            "role": role,
            "counted_input_tokens": tokens,
            "request_sha256": fingerprint,
            "state": "RESERVED",
        }
    elif event == "response":
        number, trace = details
        fail(r["in_flight"] and number == r["calls"], "judge_response_mismatch")
        r["in_flight"] = False
        r["last_attempt"].update(trace)
        r["last_attempt"]["state"] = "RESPONSE_RECEIVED"
    elif event == "advisor_complete":
        fail(not r["in_flight"] and roles["advisor"] > 0, "judge_advisor_incomplete")
        r["advisor_complete"] = True
    elif event in {"complete", "halt"}:
        if event == "complete":
            fail(not r["in_flight"] and all(roles.values()), "judge_pair_incomplete")
        r["state"] = "COMPLETED" if event == "complete" else "HALTED"
        # A received response is terminal, even if validation failed. An ambiguous
        # dispatch stays charged AND holds capacity. Never expire/refund its slot.
        if not r["in_flight"]:
            c["active_claims"].remove(key)
    else:
        raise ControlDenied("judge_event_invalid")
    return c, r, owner_day, workspace_day


class JudgeAuthority:
    def __init__(
        self, settings, owner, session_id, mapping_id, request_id, *, adapter=None, clock=None
    ):
        fail(
            settings.cloud
            and settings.identity_mode == "firebase"
            and owner.startswith("firebase:")
            and settings.synthetic_beta_authorized
            and settings.model_controls_backend == "firestore"
            and settings.google_project == settings.reasoning_project == "movebooks-ai"
            and settings.reasoning_location == "global"
            and settings.judge_campaign_enabled,
            "judge_configuration_unverified",
        )
        self.settings, self.adapter = settings, adapter
        self.scope = {
            "owner_hash": digest(owner),
            "workspace_hash": digest(session_id),
            "mapping_hash": digest(mapping_id),
        }
        self.key = digest(f"{owner}:{session_id}:{request_id}")
        self.nonce = digest(uuid4())
        self.basis = None
        self.revision = os.environ.get("K_REVISION", "")
        self.clock = clock or (lambda: datetime.now(UTC))

    def bind_context(self, basis):
        fail(sha(basis) and self.basis in (None, basis), "judge_source_changed")
        self.basis = basis

    async def change(self, event, details=None):
        from google.cloud import firestore

        async def operation():
            adapter = self.adapter or await configured_controls(self.settings)
            col = adapter.client.collection("movebooks_model_controls")
            prefix = "judge-" + CAMPAIGN_ID
            eligibility = digest(self.scope["owner_hash"] + ":" + self.scope["workspace_hash"])
            now = self.clock()
            day = now.strftime("%Y-%m-%d")
            refs = [
                col.document(prefix),
                col.document("policy"),
                col.document(prefix + "-eligible-" + eligibility),
                col.document(prefix + "-claim-" + self.key),
            ]
            if event == "claim":
                refs += [
                    col.document(prefix + "-owner-" + day + "-" + self.scope["owner_hash"]),
                    col.document(prefix + "-workspace-" + day + "-" + self.scope["workspace_hash"]),
                ]

            @firestore.async_transactional
            async def update(transaction):
                snapshots = [
                    await ref.get(
                        transaction=transaction,
                        retry=None,
                        timeout=self.settings.model_control_timeout_seconds,
                    )
                    for ref in refs
                ]
                values = []
                for snapshot in snapshots:
                    value = snapshot.to_dict()
                    fail(type(snapshot.exists) is bool, "judge_snapshot_corrupt")
                    if snapshot.exists:
                        fail(isinstance(value, dict), "judge_snapshot_corrupt")
                    else:
                        fail(value is None, "judge_snapshot_corrupt")
                    values.append(value)
                if event != "claim":
                    values += [None, None]
                changed, record, owner_day, workspace_day = decide(
                    *values,
                    scope=self.scope,
                    revision=self.revision,
                    key=self.key,
                    nonce=self.nonce,
                    basis=self.basis,
                    now=self.clock(),
                    event=event,
                    details=details,
                )
                # If a retry crossed midnight, do not charge yesterday's documents.
                if event == "claim":
                    fail(self.clock().strftime("%Y-%m-%d") == day, "judge_day_changed")
                transaction.update(refs[0], changed)
                if event == "claim":
                    transaction.create(refs[3], record)
                    transaction.set(refs[4], owner_day)
                    transaction.set(refs[5], workspace_day)
                else:
                    transaction.update(refs[3], record)
                if event == "response":
                    transaction.create(
                        col.document(prefix + "-attempt-" + self.key + "-" + str(details[0])),
                        record["last_attempt"],
                    )
                return record

            return await update(adapter.client.transaction(max_attempts=3))

        return await bounded_control(self.settings, operation)

    async def claim(self):
        await self.change("claim")

    async def reserve(self, role, tokens, fingerprint):
        return (await self.change("reserve", (role, tokens, fingerprint)))["calls"]

    async def finish(self, number, trace):
        await self.change("response", (number, trace))

    async def halt(self):
        await self.change("halt")


def new_judge_guard(settings, owner, session_id, mapping_id, request_id):
    return CountedTransport(JudgeAuthority(settings, owner, session_id, mapping_id, request_id))
