"""Malformed, hostile or oversized packages are rejected without crashing or changing state."""

import base64
import io
import random
import stat
import zipfile
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from movebooks_api.discover_assess.service import discover_assess_service as service
from movebooks_api.intake import MAX_FILE, NAMES, validate_package
from movebooks_api.intake_api import tickets
from movebooks_api.main import app

AUTH = {"Authorization": "Bearer demo-user"}
client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def clean():
    tickets.clear()
    service.repository.clear()
    yield
    tickets.clear()
    service.repository.clear()


@pytest.fixture(scope="module")
def template():
    content = TestClient(app).get("/v1/intake/template", headers=AUTH).content
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        return {name: archive.read(name) for name in archive.namelist()}


def post(files):
    body = {
        "files": [
            {"name": name, "content": base64.b64encode(data).decode()}
            for name, data in files.items()
        ]
    }
    return client.post("/v1/intake/validate", headers=AUTH, json=body)


def sessions():
    return len(getattr(service.repository, "_sessions", {}) or {})


def zipped(entries, *, compression=zipfile.ZIP_DEFLATED, configure=None):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression) as archive:
        for name, data in entries:
            info = zipfile.ZipInfo(name)
            info.compress_type = compression
            if configure:
                configure(info)
            archive.writestr(info, data)
    return buffer.getvalue()


def rejected_archive(content):
    report, source = validate_package([("package.zip", content)])
    assert source is None and report["status"] == "BLOCKED"
    assert [i["code"] for i in report["issues"]] == ["UNSAFE_ARCHIVE"], report["issues"]


def test_random_bytes_in_every_file_never_crash_the_api(template):
    rng = random.Random(20261004)
    for name in sorted(NAMES):
        for size in (1, 7, 64, 4096):
            tickets.clear()
            response = post({**template, name: rng.randbytes(size)})
            assert response.status_code == 200, (name, size, response.text)
            assert response.json()["status"] == "BLOCKED"


@pytest.mark.parametrize("cut", [1, 10, 37, 100])
def test_truncated_files_never_crash_and_stay_consistent(template, cut):
    # A cut can leave a valid shorter file; what matters is a report, never an exception,
    # and that only an unblocked package yields accepted data.
    for name in sorted(NAMES - {"metadata.json"}):
        report, source = validate_package(list({**template, name: template[name][:cut]}.items()))
        assert report["status"] in {"READY", "NEEDS ATTENTION", "BLOCKED"}, name
        assert (source is None) == (report["status"] == "BLOCKED"), name


def test_zip_slip_and_absolute_paths():
    for name in ("../customers.csv", "/customers.csv", "data/customers.csv", "..\\customers.csv"):
        rejected_archive(zipped([(name, b"id,display_name\n")]))


def test_nested_archive_entry_is_not_unpacked(template):
    inner = zipped([("customers.csv", template["customers.csv"])])
    entries = [(n, d) for n, d in template.items() if n != "customers.csv"]
    report, source = validate_package(
        [("package.zip", zipped([*entries, ("customers.csv", inner)]))]
    )
    assert source is None
    nested = [i for i in report["issues"] if i["file"] == "customers.csv"]
    assert [i["code"] for i in nested] == ["BINARY_CONTENT"]


def test_encrypted_entry():
    # zipfile resets flag bits on write, so mark the entry encrypted in the central directory.
    content = bytearray(zipped([("customers.csv", b"id,display_name\n")]))
    central = content.index(b"PK\x01\x02")
    content[central + 8] |= 0x1
    rejected_archive(bytes(content))


def test_symlink_entry():
    def link(info):
        info.external_attr = (stat.S_IFLNK | 0o777) << 16

    rejected_archive(zipped([("customers.csv", b"/etc/passwd")], configure=link))


def test_unsupported_compression():
    rejected_archive(
        zipped([("customers.csv", b"id,display_name\n")], compression=zipfile.ZIP_BZIP2)
    )


def test_too_many_archive_entries(template):
    entries = [*template.items(), ("metadata.json", b"{}"), ("notes.csv", b"x")]
    rejected_archive(zipped(entries, compression=zipfile.ZIP_STORED))


def test_decompression_bomb_and_expanded_size():
    rejected_archive(zipped([("customers.csv", b"a" * 200_000)]))
    rejected_archive(zipped([("customers.csv", b"a" * (MAX_FILE + 1))], compression=0))


def test_corrupt_archive():
    rejected_archive(b"PK\x03\x04" + b"\x00" * 64)


def test_oversized_request_is_refused_before_parsing():
    response = client.post(
        "/v1/intake/validate",
        headers={**AUTH, "Content-Type": "application/zip"},
        content=b"0" * (3 * 1024 * 1024 + 1),
    )
    assert response.status_code == 413


def test_rejected_package_changes_nothing(template):
    before = sessions()
    response = post({**template, "customers.csv": b"id\r\nc1\r\n"})
    assert response.status_code == 200 and response.json()["status"] == "BLOCKED"
    package = response.json()["package_id"]
    # Nothing accepted is kept: the ticket has no normalized source.
    assert tickets[UUID(package)]["source"] is None
    assert sessions() == before
    # The package cannot become a workspace, and so cannot reach Plan, Map, Migrate or approval.
    workspace = client.post(
        f"/v1/intake/{package}/workspace", headers=AUTH, json={"reviewed": True}
    )
    assert workspace.status_code == 409
    assert sessions() == before
    assert tickets[UUID(package)]["session"] is None


def test_one_bad_file_leaves_the_whole_package_unaccepted(template):
    report, source = validate_package(
        list({**template, "bills.csv": b"id,vendor_id\r\nb1,v1\r\n"}.items())
    )
    assert source is None and report["status"] == "BLOCKED"
    statuses = {f["name"]: f["schema_status"] for f in report["files"]}
    assert statuses["bills.csv"] == "BLOCKED" and statuses["customers.csv"] == "READY"


def test_fixed_package_can_be_retried_after_rejection(template):
    bad = post({**template, "customers.csv": b""})
    assert bad.json()["status"] == "BLOCKED"
    client.post(f"/v1/intake/{bad.json()['package_id']}/discard", headers=AUTH)
    good = post(template)
    assert good.json()["status"] == "READY"
    created = client.post(
        f"/v1/intake/{good.json()['package_id']}/workspace", headers=AUTH, json={"reviewed": True}
    )
    assert created.status_code == 201 and created.json()["workflow_status"] == "ASSESSED"
