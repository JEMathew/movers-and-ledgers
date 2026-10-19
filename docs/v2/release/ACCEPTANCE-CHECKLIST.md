# V2 hosted acceptance checklist (Google sign-in, two test accounts)

Run on the private preview (`PREVIEW-PLAN.md`) by a person with the two existing test Google accounts. Nobody shares
a password or token. Record each row as Pass, Fail or Not run, with a screenshot where noted. Locally verified
equivalents are listed so you can see what the hosted run adds.

## Authentication

| # | Check | Expected | Local evidence (19 Oct, demo identity) |
|---|---|---|---|
| A1 | Sign in with Google (account A) from `/sign-in` | One popup; returns to the requested page; Account menu shows A's verified email | Not testable locally (Firebase) |
| A2 | Refresh the same tab | Still signed in (browser-session persistence) | n/a |
| A3 | Open a new tab | Signed out (session persistence is per tab by design) | n/a |
| A4 | Sign out from the Account menu | Signed-out header; protected pages ask to sign in; no stale email | n/a |
| A5 | Unauthenticated API (`/api/v1/identity`, `/api/v1/migration-sessions`) | 401 | Proxy: 401 on a Firebase-mode build; API: 401 without or with a bad token |

## Ownership and isolation

Run `python docs/v2/release/auth-isolation/isolation_check.py https://localhost:8443`, which automates I2–I4. It
proved its own checks in a local dry run, and correctly flagged that the local demo identity is shared, which is
expected because the demo token is refused in production.

| # | Check | Expected |
|---|---|---|
| I1 | A starts a sample migration; B opens My migration | B's picker lists none of A's migrations |
| I2 | B opens A's `?session=` on every stage route, the evidence page and the resume link | No A company, figure or decision shown; "unavailable" recovery copy |
| I3 | Every API read of A's reference by B | 401, 403 or 404, never 200 |
| I4 | A refreshes | A still reads its migration |
| I5 | A signs out, B signs in **in the same tab** | B never sees A's last migration (the stored reference is re-read and refused) |
| I6 | Saved migration persists | A signs in next day, My migration resumes A's migration |

Backend evidence already run:
- 25 named owner-isolation tests passed, with 8 skipped for the Firestore emulator and Postgres.
- The 4 Postgres-only listing and isolation tests were then run against a throwaway local PostgreSQL 16 server: `tests/test_migration_listing.py` 33/33 passed.
- The Firestore emulator tests remain not run; they need the emulator runner.

## Journey on the hosted preview (desktop and phone)

1. Landing → Start a sample migration → sign in → My migration (empty) → Understand.
2. Prepare: reject `1200 Misc Clearing` → recovery copy → request and approve reconsideration.
3. Approve the 6 low-risk mappings together (unticked consent, full list) → decide the rest one by one → approve the plan.
4. Move: start → one paused batch → approve the fix → retry → complete.
5. Verify: 17/17 → approve 5 settings → apply.
6. Start: essentials → prepare invoice → approve once. "Invoice terms approved by …" replaces the approve control.
7. Post and verify: USD 107.25 and "Trial balance difference: No difference".
8. Evidence: exactly one "First invoice approved" row; mapping decisions show the actor.
9. Northstar: a blocked `vendor-002` shows no approve control, and batch approval is off.

Local evidence for every step: `REPORT.md` (journey 49/49 at 1440 and 390, recovery and consent checks).
