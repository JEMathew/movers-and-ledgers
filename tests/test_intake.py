import base64
import io
import json
import zipfile
from concurrent.futures import ThreadPoolExecutor
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from movebooks_api.auth import Principal, require_principal
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.intake import MAX_FILE, validate_package
from movebooks_api.intake_api import tickets
from movebooks_api.main import app

AUTH = {"Authorization": "Bearer demo-user"}
client = TestClient(app)


@pytest.fixture(autouse=True)
def clean():
    tickets.clear()
    service.repository.clear()
    yield
    app.dependency_overrides.clear()


def package():
    response = client.get("/v1/intake/template", headers=AUTH)
    assert response.status_code == 200
    with zipfile.ZipFile(io.BytesIO(response.content)) as z:
        return [(n, z.read(n)) for n in z.namelist()]


def change(files, name, value):
    return [(n, value if n == name else data) for n, data in files]


def upload(files):
    return client.post(
        "/v1/intake/validate",
        headers=AUTH,
        json={
            "files": [{"name": n, "content": base64.b64encode(data).decode()} for n, data in files]
        },
    )


def create(files=None):
    report = upload(files or package()).json()
    assert report["status"] == "READY", report
    result = client.post(
        f"/v1/intake/{report['package_id']}/workspace", headers=AUTH, json={"reviewed": True}
    )
    assert result.status_code == 201, result.text
    return report, result.json()


def test_valid_repeatable_package_and_lineage():
    files = package()
    report, source = validate_package(files)
    assert report["status"] == "READY", report
    assert (report, source) == validate_package(files)
    assert source["synthetic"] is False
    assert source["datasets"]["bills"][0]["total"] == "125.00"
    assert source["source_lineage"][0]["row"] == 2
    assert source["source_lineage"][0]["source_hash"]


def test_zip_and_direct_package_equivalence():
    files = package()
    body = client.get("/v1/intake/template", headers=AUTH).content
    assert validate_package([("test.zip", body)]) == validate_package(files)
    assert (
        client.post(
            "/v1/intake/validate", headers={**AUTH, "Content-Type": "application/zip"}, content=body
        ).json()["status"]
        == "READY"
    )


@pytest.mark.parametrize(
    "kind",
    [
        "pdf",
        "unsupported_name",
        "nested_zip",
        "traversal",
        "duplicate_name",
        "binary",
        "utf8",
        "oversize",
        "missing_column",
        "missing_id",
        "duplicate_id",
        "reference",
        "malformed_csv",
        "malformed_json",
        "duplicate_json_key",
        "state_injection",
        "unbalanced",
        "invalid_money",
        "invalid_tax",
        "file_count",
        "bill_reference",
        "product_reference",
        "transaction_reference",
    ],
)
def test_rejects_untrusted_package(kind):
    files = package()
    if kind == "pdf":
        files.append(("invoice.pdf", b"%PDF-1.7"))
    if kind == "unsupported_name":
        files.append(("Customers.csv", b"id,name"))
    if kind == "duplicate_name":
        files.append(files[0])
    if kind in {"nested_zip", "traversal"}:
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as z:
            z.writestr("nested.zip" if kind == "nested_zip" else "../customers.csv", b"x")
        files = [("test.zip", buffer.getvalue())]
    if kind == "binary":
        files = change(files, "customers.csv", b"MZ\x00\x01")
    if kind == "utf8":
        files = change(files, "customers.csv", b"\xff")
    if kind == "oversize":
        files = change(files, "customers.csv", b"x" * (MAX_FILE + 1))
    if kind == "missing_column":
        files = change(files, "customers.csv", b"id\nc1\n")
    if kind == "missing_id":
        files = change(files, "customers.csv", b"id,display_name\n,Name\n")
    if kind == "duplicate_id":
        files = change(files, "customers.csv", b"id,display_name\nc1,A\nc1,B\n")
    if kind == "reference":
        files = change(files, "customers.csv", b"id,display_name\nother,A\n")
    if kind == "malformed_csv":
        files = change(files, "customers.csv", b'id,display_name\nc1,"unterminated')
    if kind == "malformed_json":
        files = change(files, "configuration.json", b'{"company":')
    if kind == "duplicate_json_key":
        files = change(files, "configuration.json", b'{"company":{},"company":{}}')
    if kind == "state_injection":
        config = json.loads(dict(files)["configuration.json"])
        config["workflow_status"] = "APPROVED"
        files = change(files, "configuration.json", json.dumps(config).encode())
    if kind == "invalid_tax":
        config = json.loads(dict(files)["configuration.json"])
        config["taxes"][0]["rate"] = "NaN"
        files = change(files, "configuration.json", json.dumps(config).encode())
    if kind == "unbalanced":
        files = change(
            files,
            "transactions.csv",
            dict(files)["transactions.csv"].replace(b"420.00", b"421.00", 1),
        )
    if kind == "invalid_money":
        files = change(
            files, "invoices.csv", dict(files)["invoices.csv"].replace(b"420.00", b"NaN")
        )
    if kind == "file_count":
        files *= 2
    if kind == "bill_reference":
        files = change(
            files, "bills.csv", dict(files)["bills.csv"].replace(b"vendor-001", b"unknown")
        )
    if kind in {"product_reference", "transaction_reference"}:
        field = "product_id" if kind == "product_reference" else "transaction_id"
        text = dict(files)["invoices.csv"].decode().splitlines()
        files = change(
            files, "invoices.csv", (text[0] + f",{field}\n" + text[1] + ",unknown\n").encode()
        )
    report, source = validate_package(files)
    assert report["status"] == "BLOCKED" and source is None, report


def test_warning_not_silent_discard_and_replace_retry():
    files = package()
    files = change(
        files,
        "customers.csv",
        b"id,display_name,secret_note\ncustomer-001,Cedar,private-value\ncustomer-002,Maple,private-value\n",
    )
    report, source = validate_package(files)
    assert report["status"] == "NEEDS ATTENTION"
    assert "secret_note" in report["files"][0]["ignored_fields"]
    assert "private-value" not in json.dumps(report)
    assert "secret_note" not in source["datasets"]["customers"][0]
    blocked = upload(change(files, "customers.csv", b"invalid")).json()
    assert (
        client.post(
            f"/v1/intake/{blocked['package_id']}/workspace", headers=AUTH, json={"reviewed": True}
        ).status_code
        == 409
    )
    assert upload(package()).json()["status"] == "READY"


def test_handoff_replay_concurrency_auth_and_no_stage_bypass():
    report, created = create()
    path = f"/v1/intake/{report['package_id']}/workspace"
    with ThreadPoolExecutor(max_workers=2) as pool:
        replies = list(
            pool.map(lambda _: client.post(path, headers=AUTH, json={"reviewed": True}), range(2))
        )
    assert all(r.json()["session_id"] == created["session_id"] for r in replies)
    root = f"/v1/migration-sessions/{created['session_id']}"
    state = client.get(root, headers=AUTH).json()
    assert state["workflow_status"] == "ASSESSED" and state["source_kind"] == "user_upload"
    assert state["discovery"]["synthetic"] is False
    assert "uploaded_source" not in state
    assert not state["mappings"] and state["execution"] is None
    for suffix in (
        "/migration/start",
        "/validation",
        "/configuration",
        "/onboarding",
        "/fpu/verify",
    ):
        assert (
            client.post(root + suffix, headers={**AUTH, "Idempotency-Key": "early"}).status_code
            == 409
        )
    assert (
        client.post(path, headers=AUTH, json={"reviewed": True, "state": "APPROVED"}).status_code
        == 400
    )
    assert client.post(path, headers=AUTH, json={"reviewed": 1}).status_code == 400
    assert client.post(path, json={"reviewed": True}).status_code == 401
    app.dependency_overrides[require_principal] = lambda: Principal("other", "other@example.test")
    assert client.post(path, json={"reviewed": True}).status_code == 404
    assert client.get(root + "/intake-trust").status_code == 404


def test_safe_trust_and_capacity_and_expiry():
    _, created = create()
    root = f"/v1/migration-sessions/{created['session_id']}"
    response = client.get(root + "/intake-trust", headers=AUTH)
    assert response.status_code == 200
    for private in (
        "Cedar School",
        "Harbor Light Books",
        "420.00",
        "125.00",
        "uploaded_source",
        "entries",
        "customer-001",
    ):
        assert private not in response.text
    assert "Package received" in response.text and "assessment_agent" in response.text
    key = next(iter(tickets))
    tickets[key]["expires"] = 0
    assert (
        client.post(
            f"/v1/intake/{key}/workspace", headers=AUTH, json={"reviewed": True}
        ).status_code
        == 404
    )
    for _ in range(8):
        assert upload(package()).status_code == 200
    assert upload(package()).status_code == 429


def test_uploaded_full_governed_journey_including_bills():
    _, created = create()
    root = f"/v1/migration-sessions/{created['session_id']}"

    def post(path, data=None, expected=200):
        response = client.post(
            root + path, json=data, headers={**AUTH, "Idempotency-Key": "uploaded-journey"}
        )
        assert response.status_code == expected, response.text
        return response.json()

    post("/plan")
    mappings = post("/mappings")
    for mapping in mappings:
        post(f"/mappings/{mapping['id']}/approve", {})
    execution = post("/migration/start")
    assert execution["status"] == "MIGRATION_COMPLETE"
    assert len(execution["batches"]) == 9
    assert execution["target_state"]["bills"][0]["payload"]["total"] == "125.00"
    assert post("/validation")["report"]["status"] == "VERIFIED"
    config = post("/configuration")["configuration"]
    for proposal in config["proposals"]:
        if proposal["state"] != "APPLIED":
            post(f"/configuration/{proposal['id']}/decision", {"action": "approve"})
    post("/configuration/apply")
    onboard = post("/onboarding")
    for task in onboard["tasks"]:
        if task["approval_required"]:
            post(f"/onboarding/tasks/{task['id']}/decision", {"action": "approve"})
    post("/fpu/task", {"customer_id": "customer-001", "product_id": "product-001"})
    post("/fpu/decision", {"action": "approve"})
    assert post("/fpu/execute")["verified_fpu"]
    safe = client.get(root + "/intake-trust", headers=AUTH)
    assert safe.status_code == 200
    assert safe.json()["onboarding"]["fpu"]["checks"]
    assert "107.25" not in safe.text and "Cedar School" not in safe.text
    session = service.get_session("demo-user", UUID(created["session_id"]))
    assert session.uploaded_source["datasets"]["bills"][0]["total"] == "125.00"


def test_compression_bomb_and_duplicate_archive_entries():
    for kind in ("ratio", "duplicate"):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            if kind == "ratio":
                archive.writestr("customers.csv", b"a" * 200_000)
            else:
                for name, data in package():
                    archive.writestr(name, data)
                with pytest.warns(UserWarning):
                    archive.writestr("customers.csv", b"id,display_name\nx,A")
        report, source = validate_package([("package.zip", buffer.getvalue())])
        assert report["status"] == "BLOCKED" and source is None


def test_request_limits_invalid_envelopes_and_discard():
    for payload in (
        {"files": [], "workflow_status": "APPROVED"},
        {"files": [{"name": "x.csv", "content": "not-base64!"}]},
    ):
        assert client.post("/v1/intake/validate", headers=AUTH, json=payload).status_code == 400
    assert (
        client.post(
            "/v1/intake/validate", headers=AUTH, content=b"x" * (3 * 1024 * 1024 + 1)
        ).status_code
        == 413
    )
    report = upload(package()).json()
    assert (
        client.post(f"/v1/intake/{report['package_id']}/discard", headers=AUTH).status_code == 200
    )
    assert (
        client.post(
            f"/v1/intake/{report['package_id']}/workspace", headers=AUTH, json={"reviewed": True}
        ).status_code
        == 404
    )


def test_reference_issue_keeps_original_row_after_malformed_record():
    files = change(
        package(),
        "bills.csv",
        (
            b"id,vendor_id,payable_account_id,document_number,total\n"
            b"malformed-row\n"
            b"bill-1,missing-vendor,account-ap,B-1,125.00\n"
        ),
    )
    report, _ = validate_package(files)
    reference = next(i for i in report["issues"] if i["code"] == "BROKEN_REFERENCE")
    assert reference["row"] == 3


def test_bill_tampering_blocks_validation_and_duplicate_retry_preserves_target():
    _, created = create()
    root = f"/v1/migration-sessions/{created['session_id']}"

    def post(path, body=None):
        return client.post(root + path, headers={**AUTH, "Idempotency-Key": "bills"}, json=body)

    post("/plan")
    for mapping in post("/mappings").json():
        post(f"/mappings/{mapping['id']}/approve", {})
    first = post("/migration/start").json()
    assert post("/migration/start").json() == first
    session = service.get_session("demo-user", UUID(created["session_id"]))
    session.execution.target_state["bills"][0]["payload"]["total"] = "1.00"
    service.repository.put(session)
    assert post("/validation").json()["report"]["status"] == "BLOCKED"
    assert post("/configuration").status_code == 409
