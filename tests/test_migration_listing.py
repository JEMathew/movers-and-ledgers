"""Owner-scoped migration listing: isolation, ordering, cursors, bounds, durability."""

import json
import os

import pytest
from fastapi.testclient import TestClient
from movebooks_api.auth import Principal, require_principal
from movebooks_api.discover_assess import listing
from movebooks_api.discover_assess.api import discover_assess_service
from movebooks_api.discover_assess.repository import InMemoryMigrationSessionRepository
from movebooks_api.discover_assess.service import DiscoverAssessService
from movebooks_api.main import app
from movebooks_api.runtime.persistence import SqlSessionRepository, metadata, sessions
from sqlalchemy import create_engine
from sqlalchemy import insert as sql_insert

SAMPLE = "harbor-light-migrate-demo"
A, B = "firebase:account-a", "firebase:account-b"


@pytest.fixture(params=["sqlite", "postgres"])
def sql(request, tmp_path):
    """SQLite always; PostgreSQL too when MOVEBOOKS_TEST_POSTGRES_URL is set."""
    if request.param == "postgres":
        url = os.environ.get("MOVEBOOKS_TEST_POSTGRES_URL")
        if not url:
            pytest.skip("MOVEBOOKS_TEST_POSTGRES_URL not set")
        engine = create_engine(url)
        metadata.drop_all(engine)
    else:
        url = f"sqlite:///{tmp_path / 'm.db'}"
        engine = create_engine(url)
    metadata.create_all(engine)
    yield url, SqlSessionRepository(engine)
    engine.dispose()


@pytest.fixture
def api(monkeypatch, sql):
    _, repo = sql
    monkeypatch.setattr(discover_assess_service, "repository", repo)
    svc = DiscoverAssessService(repo)
    who = {"subject": A}
    app.dependency_overrides[require_principal] = lambda: Principal(who["subject"], "x@example.com")
    client = TestClient(app)
    yield client, svc, who, repo
    app.dependency_overrides.clear()


def as_user(who, subject):
    who["subject"] = subject


def test_requires_identity():
    assert TestClient(app).get("/v1/migration-sessions").status_code == 401


def test_lists_only_own_migrations_newest_first_with_minimal_fields(api):
    client, svc, who, _ = api
    mine = [svc.create_session(A, SAMPLE, f"a{i}") for i in range(3)]
    theirs = svc.create_session(B, SAMPLE, "b0")
    body = client.get("/v1/migration-sessions").json()
    ids = [item["id"] for item in body["items"]]
    assert ids == [str(s.id) for s in reversed(mine)]
    assert str(theirs.id) not in json.dumps(body)
    assert set(body["items"][0]) == {
        "id",
        "company_name",
        "status",
        "workflow_status",
        "created_at",
    }
    assert body["incomplete"] is False and body["skipped"] == 0 and body["next_cursor"] is None
    as_user(who, B)
    assert [i["id"] for i in client.get("/v1/migration-sessions").json()["items"]] == [
        str(theirs.id)
    ]


def test_unauthorized_session_access_unchanged(api):
    client, svc, who, _ = api
    mine = svc.create_session(A, SAMPLE, "a0")
    as_user(who, B)
    assert client.get(f"/v1/migration-sessions/{mine.id}").status_code == 404


def test_pagination_is_stable_and_complete(api):
    client, svc, _, _ = api
    made = {str(svc.create_session(A, SAMPLE, f"a{i}").id) for i in range(5)}
    seen, cursor = [], None
    while True:
        url = "/v1/migration-sessions?limit=2" + (f"&cursor={cursor}" if cursor else "")
        body = client.get(url).json()
        seen += [i["id"] for i in body["items"]]
        cursor = body["next_cursor"]
        if not cursor:
            break
    assert len(seen) == 5 and set(seen) == made and len(set(seen)) == 5


def test_ties_on_created_at_break_by_id_without_loss():
    same = "2026-10-18T00:00:00+00:00"
    ids = [f"00000000-0000-4000-8000-00000000000{n}" for n in range(1, 6)]
    items = [listing.MigrationSummary(i, "Co", "CREATED", "CREATED", same) for i in ids]
    seen, after = [], None
    while True:
        page = listing.build_page(
            A, items, after=after, limit=2, incomplete=False, reason=None, scanned=5, skipped=0
        )
        seen += [i.id for i in page.items]
        if not page.next_cursor:
            break
        after = listing.decode_cursor(A, page.next_cursor)
    assert seen == sorted(ids, reverse=True)


def test_cursor_from_another_account_or_garbage_is_rejected(api):
    client, svc, who, _ = api
    for i in range(3):
        svc.create_session(A, SAMPLE, f"a{i}")
    cursor = client.get("/v1/migration-sessions?limit=1").json()["next_cursor"]
    assert cursor
    as_user(who, B)
    assert client.get(f"/v1/migration-sessions?cursor={cursor}").status_code == 400
    as_user(who, A)
    assert client.get("/v1/migration-sessions?cursor=not-a-cursor").status_code == 400
    assert client.get(f"/v1/migration-sessions?cursor={cursor}").status_code == 200


@pytest.mark.parametrize("limit", [0, 51, -1])
def test_limit_is_bounded(api, limit):
    assert api[0].get(f"/v1/migration-sessions?limit={limit}").status_code == 422


def test_corrupt_and_foreign_rows_are_skipped_without_leaking(api):
    client, svc, _, repo = api
    good = svc.create_session(A, SAMPLE, "a0")
    with repo.engine.begin() as c:
        c.execute(
            sql_insert(sessions).values(
                id="00000000-0000-4000-8000-0000000000aa",
                owner=A,
                digest="x",
                snapshot="{not json SECRET",
            )
        )
        # A row whose snapshot claims another owner must never be shown to this account.
        c.execute(
            sql_insert(sessions).values(
                id="00000000-0000-4000-8000-0000000000bb",
                owner=A,
                digest="x",
                snapshot=json.dumps(
                    {
                        "schema": 1,
                        "owner": B,
                        "session": {"id": "00000000-0000-4000-8000-0000000000bb"},
                    }
                ),
            )
        )
    response = client.get("/v1/migration-sessions")
    body = response.json()
    assert [i["id"] for i in body["items"]] == [str(good.id)]
    assert body["skipped"] == 2 and "SECRET" not in response.text


def test_scan_limit_is_reported_never_silent(api, monkeypatch):
    client, svc, _, _ = api
    for i in range(4):
        svc.create_session(A, SAMPLE, f"a{i}")
    monkeypatch.setattr(listing, "MAX_SORT_ROWS", 0)  # force the bounded-scan fallback
    monkeypatch.setattr(listing, "MAX_SCAN_ROWS", 3)
    body = client.get("/v1/migration-sessions").json()
    assert body["incomplete"] is True and body["reason"] == "scan_limit" and len(body["items"]) == 3


def test_byte_limit_is_reported_never_silent(api, monkeypatch):
    client, svc, _, _ = api
    for i in range(3):
        svc.create_session(A, SAMPLE, f"a{i}")
    monkeypatch.setattr(listing, "MAX_DECODED_BYTES", 1)
    body = client.get("/v1/migration-sessions").json()
    assert body["incomplete"] is True and body["reason"] == "byte_limit"


def test_persisted_sessions_survive_restart_and_stay_isolated(sql):
    url, repo = sql
    svc = DiscoverAssessService(repo)
    mine = svc.create_session(A, SAMPLE, "a0")
    svc.create_session(B, SAMPLE, "b0")
    repo.engine.dispose()
    reopened = SqlSessionRepository(create_engine(url))
    page = reopened.list_for_owner(A)
    assert [i.id for i in page.items] == [str(mine.id)]
    assert reopened.get(mine.id, B) is None


def test_in_memory_repository_matches_contract():
    repo = InMemoryMigrationSessionRepository()
    svc = DiscoverAssessService(repo)
    mine = svc.create_session(A, SAMPLE, "a0")
    svc.create_session(B, SAMPLE, "b0")
    page = repo.list_for_owner(A)
    assert [i.id for i in page.items] == [str(mine.id)] and not page.incomplete


def _clone_rows(repo, template_id, owner, count, start=0):
    """Add `count` sessions for `owner` by cloning one real snapshot (rising created_at)."""
    with repo.engine.connect() as c:
        raw = c.execute(sessions.select().where(sessions.c.id == str(template_id))).one()
    base = json.loads(raw.snapshot)
    ids = []
    with repo.engine.begin() as c:
        for n in range(start, start + count):
            doc = json.loads(json.dumps(base))
            sid = f"{n:08x}-0000-4000-8000-000000000000"
            doc["owner"] = owner
            doc["session"]["id"] = sid
            doc["session"]["created_at"] = f"2026-10-01T00:{n // 60:02d}:{n % 60:02d}+00:00"
            c.execute(
                sql_insert(sessions).values(
                    id=sid,
                    owner=owner,
                    digest="x",
                    snapshot=json.dumps(doc, sort_keys=True, separators=(",", ":")),
                )
            )
            ids.append(sid)
    return ids


def _drain(client, limit=50):
    seen, cursor, pages = [], None, 0
    while True:
        qs = f"?limit={limit}" + (f"&cursor={cursor}" if cursor else "")
        body = client.get("/v1/migration-sessions" + qs).json()
        seen += [i["id"] for i in body["items"]]
        pages += 1
        assert body["incomplete"] is False
        cursor = body["next_cursor"]
        if not cursor:
            return seen, pages


def test_recent_sessions_not_omitted_beyond_scan_limit(api):
    client, svc, who, repo = api
    template = svc.create_session(A, SAMPLE, "t")
    ids = _clone_rows(repo, template.id, A, listing.MAX_SCAN_ROWS + 60)
    newest = svc.create_session(A, SAMPLE, "newest")  # random id; newest created_at
    other = svc.create_session(B, SAMPLE, "b0")
    first = client.get("/v1/migration-sessions?limit=5").json()
    assert first["items"][0]["id"] == str(newest.id)
    assert first["incomplete"] is False
    seen, pages = _drain(client, 50)
    # clones are dated 2026-10-01; the real sessions are newer, template older than "newest"
    expected = [str(newest.id), str(template.id), *reversed(ids)]
    assert seen == expected
    assert len(seen) == len(set(seen))
    assert str(other.id) not in seen and pages > 1


def test_sql_ordering_cursor_remains_owner_bound(api):
    client, svc, who, repo = api
    template = svc.create_session(A, SAMPLE, "t")
    _clone_rows(repo, template.id, A, 30)
    cursor = client.get("/v1/migration-sessions?limit=10").json()["next_cursor"]
    assert cursor
    as_user(who, B)
    assert client.get(f"/v1/migration-sessions?cursor={cursor}").status_code == 400


def test_unreadable_snapshot_falls_back_and_is_counted(api):
    client, svc, who, repo = api
    good = svc.create_session(A, SAMPLE, "a0")
    with repo.engine.begin() as c:
        c.execute(
            sql_insert(sessions).values(id="zzzz-bad", owner=A, digest="x", snapshot="{not json")
        )
    body = client.get("/v1/migration-sessions").json()
    assert [i["id"] for i in body["items"]] == [str(good.id)]
    assert body["skipped"] == 1 and body["incomplete"] is False


def test_over_sort_limit_uses_bounded_scan_and_flags_incomplete(api, monkeypatch):
    client, svc, who, repo = api
    template = svc.create_session(A, SAMPLE, "t")
    _clone_rows(repo, template.id, A, 12)
    monkeypatch.setattr(listing, "MAX_SORT_ROWS", 5)
    monkeypatch.setattr(listing, "MAX_SCAN_ROWS", 8)
    body = client.get("/v1/migration-sessions").json()
    assert body["incomplete"] is True and body["reason"] == "scan_limit"
