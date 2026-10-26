"""Live HTTP evidence for invoice-approval idempotency.

Runs against a running local API with the synthetic demo identity.
"""

import concurrent.futures
import json
import sys
import urllib.request

API = sys.argv[1]
H = {"Authorization": "Bearer demo-user", "Content-Type": "application/json"}


def call(method, path, body=None, extra=None):
    req = urllib.request.Request(
        API + path,
        method=method,
        headers={**H, **(extra or {})},
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"null")


s, d = call("POST", "/v1/onboarding-demo-sessions", {"scenario": "clean"})
sid = d["session_id"]
root = f"/v1/migration-sessions/{sid}"
_, view = call("GET", root + "/fpu")
for t in view["tasks"]:
    if t.get("approval_required") and t["status"] != "COMPLETED":
        call("POST", f"{root}/onboarding/tasks/{t['id']}/decision", {"action": "approve"})
s_prep, _ = call(
    "POST", root + "/fpu/task", {"customer_id": "customer-001", "product_id": "product-001"}
)


def audit():
    _, t = call("GET", root + "/intake-trust")
    _, v = call("GET", root + "/fpu")
    fpu = v["onboarding"]["fpu"]
    return {
        "fpu_decisions": len(fpu["decisions"]),
        "fpu_audit_records": sum(
            x["stage"] == "first_productive_use" for x in t["human_decisions"]
        ),
        "decision": {k: fpu["decisions"][0][k] for k in ("actor", "at", "action", "evidence_hash")}
        if fpu["decisions"]
        else None,
        "contract_hash": fpu["contract_hash"],
    }


first = call("POST", root + "/fpu/decision", {"action": "approve"})[0]
a1 = audit()
replays = [call("POST", root + "/fpu/decision", {"action": "approve"})[0] for _ in range(3)]
a2 = audit()
with concurrent.futures.ThreadPoolExecutor(4) as pool:
    racing = list(
        pool.map(lambda _: call("POST", root + "/fpu/decision", {"action": "approve"})[0], range(4))
    )
a3 = audit()
changed_note = call(
    "POST", root + "/fpu/decision", {"action": "approve", "comment": "second note"}
)[0]
a4 = audit()
post = call("POST", root + "/fpu/execute", extra={"Idempotency-Key": "live-evidence"})
repost = call("POST", root + "/fpu/execute", extra={"Idempotency-Key": "live-evidence"})
_, final = call("GET", root + "/fpu")
out = {
    "session": sid,
    "prepare": s_prep,
    "first_approval": first,
    "after_first": a1,
    "sequential_replays": replays,
    "after_replays": a2,
    "concurrent_replays": racing,
    "after_concurrent": a3,
    "same_terms_different_note": changed_note,
    "after_note": a4,
    "post": post[0],
    "repost_same_key": repost[0],
    "invoices": len(final["onboarding"]["invoices"]),
    "verified_fpu": final["verified_fpu"],
    "unchanged": a1 == a2 == a3 == a4,
}
print(json.dumps(out, indent=1))
