"""Owner-scoped migration listing with explicit bounds.

No ``updated_at`` exists in the persisted schema, so none is reported. Ordering is by
``created_at`` then ``id`` (newest first). Bounds are enforced by the repository; when one
is reached the page is marked ``incomplete`` so the caller can never mistake it for the
full history.
"""

import base64
import hashlib
import json
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

DEFAULT_LIMIT = 20
MAX_LIMIT = 50
MAX_SCAN_ROWS = 200
# Rows the database may order by creation time (it parses each owner snapshot server-side).
# Above this, or when any row is unreadable, listing falls back to the bounded scan below.
MAX_SORT_ROWS = 1000
MAX_DECODED_BYTES = 32 * 1024 * 1024
CURSOR_VERSION = 1


class InvalidCursor(ValueError):
    """The cursor is malformed, from another account, or from another listing version."""


@dataclass(frozen=True)
class MigrationSummary:
    id: str
    company_name: str
    status: str
    workflow_status: str
    created_at: str


@dataclass(frozen=True)
class MigrationPage:
    items: list[MigrationSummary]
    next_cursor: str | None
    incomplete: bool
    reason: str | None  # "scan_limit" | "byte_limit" | None
    scanned: int
    skipped: int  # rows that could not be read; never described further


def owner_tag(owner: str) -> str:
    # Binds a cursor to one account. It is not a secret: the owner filter is applied in the
    # database query on every request, so a forged position can never reveal another account.
    return hashlib.sha256(f"movebooks-list-v{CURSOR_VERSION}:{owner}".encode()).hexdigest()[:16]


def sort_key(item: MigrationSummary) -> tuple[str, str]:
    return (item.created_at, item.id)


def encode_cursor_at(owner: str, created_at: str, session_id: str) -> str:
    raw = json.dumps([CURSOR_VERSION, owner_tag(owner), created_at, session_id])
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def encode_cursor(owner: str, last: MigrationSummary) -> str:
    return encode_cursor_at(owner, last.created_at, last.id)


def decode_cursor(owner: str, cursor: str) -> tuple[str, str]:
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        version, tag, created_at, session_id = json.loads(base64.urlsafe_b64decode(padded))
        datetime.fromisoformat(created_at)
        UUID(session_id)
    except Exception:
        raise InvalidCursor("Invalid cursor") from None
    if version != CURSOR_VERSION or tag != owner_tag(owner):
        raise InvalidCursor("Invalid cursor")
    return created_at, session_id


def summarize_snapshot(snapshot: str, row_id: str, owner: str) -> MigrationSummary:
    """Minimum selection fields from a stored row. Raises ValueError for any unreadable row."""
    data = json.loads(snapshot)
    session = data["session"]
    if data["schema"] != 1 or data["owner"] != owner or str(UUID(session["id"])) != row_id:
        raise ValueError("unreadable")
    datetime.fromisoformat(session["created_at"])
    return MigrationSummary(
        id=row_id,
        company_name=str(session["company_name"])[:120],
        status=str(session["status"]),
        workflow_status=str(session["workflow_status"]),
        created_at=session["created_at"],
    )


def build_page(
    owner: str,
    summaries: list[MigrationSummary],
    *,
    after: tuple[str, str] | None,
    limit: int,
    incomplete: bool,
    reason: str | None,
    scanned: int,
    skipped: int,
) -> MigrationPage:
    ordered = sorted(summaries, key=sort_key, reverse=True)
    if after is not None:
        ordered = [item for item in ordered if sort_key(item) < after]
    window = ordered[:limit]
    more = len(ordered) > limit
    return MigrationPage(
        items=window,
        next_cursor=encode_cursor(owner, window[-1]) if more and window else None,
        incomplete=incomplete,
        reason=reason,
        scanned=scanned,
        skipped=skipped,
    )
