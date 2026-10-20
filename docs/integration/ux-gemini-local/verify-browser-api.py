"""Read-only verification of the two local, synthetic browser acceptance sessions."""
import json
import urllib.error
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent
SESSIONS = [
    "ebf1aef7-9e0d-52e0-acc3-b67780325cc4",
    "33ce3bd1-165c-503a-8349-bb4ccea26dc7",
]
rows = []
for index, session in enumerate(SESSIONS):
    url = f"http://127.0.0.1:8331/v1/migration-sessions/{session}"
    request = urllib.request.Request(url, headers={"Authorization": "Bearer demo-user"})
    with urllib.request.urlopen(request, timeout=10) as response:
        data = json.load(response)
    assert data["execution"] is None
    assert len(data["human_decisions"]) == (1 if index == 0 else 0)
    assert len(data["reasoning_records"]) == len(data["review_records"]) == 1
    assert all(
        record["model_calls"] == 0 and record["state"] == "FALLBACK"
        for record in data["reasoning_records"] + data["review_records"]
    )
    if index == 0:
        assert data["human_decisions"][0]["actor"] == "demo-user"
        mapping = next(m for m in data["mappings"] if m["source_id"] == "account-clearing")
        assert mapping["state"] == "REJECTED"
        (OUT / "after-human-rejection.json").write_text(json.dumps(data, indent=2) + "\n")
    rows.append({
        "session_id": session, "human_decisions": len(data["human_decisions"]),
        "advisor_records": 1, "reviewer_records": 1, "model_calls": 0,
        "execution": None, "workflow_status": data["workflow_status"],
    })
for headers in [{}, {"Authorization": "Bearer invalid-synthetic-identity"}]:
    try:
        urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=10)
    except urllib.error.HTTPError as error:
        assert error.code == 401
    else:
        raise AssertionError("Unauthorized read succeeded")
before = json.loads((OUT / "before-analysis.json").read_text())
after = json.loads((OUT / "after-analysis.json").read_text())
excluded = {"reasoning_records", "review_records"}
assert {k: v for k, v in before.items() if k not in excluded} == {
    k: v for k, v in after.items() if k not in excluded
}
(OUT / "browser-api-verification.json").write_text(json.dumps({
    "workspaces": rows, "missing_identity": 401, "invalid_identity": 401,
    "analysis_business_state_unchanged": True,
    "scope": "Local in-memory demo only; real Firebase A/B remains unverified",
}, indent=2) + "\n")
print("PASS: isolated workspaces, explicit rejection, zero execution/model calls, auth denial")
