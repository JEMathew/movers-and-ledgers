"""Two-account isolation check for a hosted MoveBooks preview (Google sign-in).

Run by a person with the two existing test Google accounts. The script never sees, types or stores a
password or token: each account signs in by hand in its own browser window, and the script only
reads
what the pages show and the HTTP status codes of the page's own API requests.

    pip install playwright && python -m playwright install chromium
    python isolation_check.py https://<preview-host> [--out results.json]

Steps (the script pauses and tells you what to do):
  1. Window A: sign in with test account A, start or open a sample migration until its URL has
     ?session=...
  2. Window B: sign in with test account B.
  The script then, as B: opens A's migration on every stage route, the evidence page and the resume
  link, and records what B sees and every API status for A's reference. It also checks sign-out,
  same-tab refresh and that A's migration still loads for A.
Pass means: B never sees A's company, figures or decisions; every API read of A's reference by B is
401, 403 or 404; A still reads its migration; sign-out returns to a signed-out state.
"""

import json
import re
import sys

from playwright.sync_api import sync_playwright

if len(sys.argv) < 2:
    sys.exit(__doc__)
BASE = sys.argv[1].rstrip("/")
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "isolation-results.json"
# --dry-run-local: exercise this script against a local demo build. A uses the local demo sign-in
# and B stays
# signed out (one demo identity exists locally). It proves the harness, not cross-account isolation.
DRY = "--dry-run-local" in sys.argv
ask = (lambda prompt: None) if DRY else input
ROUTES = [
    "/workspace?session={s}",
    "/assess?session={s}",
    "/plan-map-approve?session={s}",
    "/migrate-resolve?session={s}",
    "/validate-configure?session={s}",
    "/onboard-fpu?session={s}",
    "/trust?view=evidence&session={s}",
    "/product?session={s}",
]
SESSION = re.compile(r"[?&]session=([0-9a-f-]{36})")
result = {"base": BASE, "checks": [], "pass": False}


def check(name, ok, detail=""):
    result["checks"].append({"check": name, "pass": bool(ok), "detail": detail})
    print(("PASS " if ok else "FAIL ") + name, detail)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=DRY)
    a_ctx, b_ctx = browser.new_context(), browser.new_context()  # separate cookies and storage
    a, b = a_ctx.new_page(), b_ctx.new_page()
    a.goto(f"{BASE}/workspace")
    b.goto(f"{BASE}/sign-in")
    if DRY:
        a.goto(f"{BASE}/api/auth/demo?next=/workspace", wait_until="networkidle")
        a.goto(f"{BASE}/workspace?pick=1", wait_until="networkidle")
        a.wait_for_timeout(1500)
        a.locator('main a[href*="/workspace?session="]').first.click()
        a.wait_for_load_state("networkidle")
        a.wait_for_timeout(1500)
    ask(
        "\n[A] In the first window, sign in with test account A and open a migration until the "
        "address shows ?session=... Press Enter here when done. "
    )
    m = SESSION.search(a.url)
    if not m:
        sys.exit("No ?session= in window A. Open the migration from My migration and run again.")
    sid = m.group(1)
    a_text = a.locator("main").inner_text()
    company = next(
        (name for name in ["Harbor Light Books", "Northstar Supplies"] if name in a_text), None
    )
    ask(
        "[B] In the second window, sign in with test account B (a different Google account). "
        "Press Enter when done. "
    )
    statuses = []
    b.on(
        "response",
        lambda r: statuses.append((r.url, r.status)) if sid in r.url and "/v1/" in r.url else None,
    )
    for route in ROUTES:
        url = BASE + route.format(s=sid)
        b.goto(url, wait_until="networkidle")
        b.wait_for_timeout(2500)
        text = b.locator("main").inner_text()
        leaked = [
            w for w in [company, "USD 107.25", "Approved by", "decided by"] if w and w in text
        ]
        check(f"B cannot read A on {route.split('?')[0]}", not leaked, f"leaked={leaked}")
    bad = [(u.split("/v1/")[-1][:80], s) for u, s in statuses if s not in (401, 403, 404)]
    check(
        "every API read of A by B is refused",
        statuses and not bad,
        f"{len(statuses)} requests; unexpected={bad}",
    )
    # A still owns and reads its migration; same-tab refresh keeps the session
    # (browserSessionPersistence)
    a.reload(wait_until="networkidle")
    a.wait_for_timeout(2500)
    check(
        "A still reads its migration after refresh",
        company is None or company in a.locator("main").inner_text(),
    )
    # Sign-out in B
    ask(
        "[B] Open the Account menu in the second window and choose Sign out. "
        "Press Enter when done. "
    )
    b.goto(f"{BASE}/workspace", wait_until="networkidle")
    b.wait_for_timeout(2500)
    check("B is signed out", "Sign in" in b.locator("body").inner_text() or "/sign-in" in b.url)
    result["session_reference"] = sid[:8] + "…"
    result["pass"] = all(c["pass"] for c in result["checks"])
    browser.close()
json.dump(result, open(OUT, "w"), indent=1)
print("\nOVERALL", "PASS" if result["pass"] else "FAIL", "->", OUT)
