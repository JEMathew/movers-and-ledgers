# Accountant acceptance plan — BROWSER, NOT EXECUTED (results table to be filled with real evidence)

Candidate: web candidate (tagged URL) → candidate API. Account A = owner; account B = second Google account. Synthetic data only. Record evidence as screenshots/screen recording; never capture tokens.

## Journey as implemented (source-traced at `aacd3a5`)
| Stage | Route | Real vs simulated |
|---|---|---|
| Landing | `/` | static |
| Sign-in | `/sign-in` (Google popup, Firebase) | real auth; API verifies ID token with revocation check |
| Start | `/workspace` empty state → `/assess?sample=harbor-light-migrate-demo` → explicit start | `POST /v1/migration-sessions` with `Idempotency-Key`; session stored in Cloud SQL, id kept in URL `?session=` and `sessionStorage["movebooks-migration-session"]`; owner = Firebase subject |
| Understand | `/assess` | deterministic discovery/readiness on a synthetic company |
| Prepare + Approve | `/plan-map-approve` (Plan Summary · Mappings · Approval Review) | deterministic plan/mappings; human approves; optional bounded advisor (currently fallback) |
| Move + Resolve | `/migrate-resolve` | governed synthetic batches into a synthetic target; controlled failure and bounded recovery; **no live provider** |
| Verify + Configure | `/validate-configure` | deterministic reconciliation; human approves settings |
| Start + First Productive Use | `/onboard-fpu` | role checklist; synthetic invoice approved and posted; deterministic verification |
| Evidence + AI activity | `/trust?view=evidence&session=<id>` (also from My Migration "Evidence & Results") | evidence = session snapshot; AI activity = Firestore readback via `GET /v1/operations/activity` (explicit Refresh) |
Not traced in this pass: `/approvals`, `/reports`, `/feedback`, `/try-your-data` (local-only evaluation), `/play`.
Can the current candidate run the flow unchanged? Per source: yes. **Unproven until executed.**

## Steps (A = pass/fail with evidence)
| ID | Action | Expected | Result |
|---|---|---|---|
| A1 | Open candidate `/`, click Try the Beta, sign in as A | lands on My Migration "Start with a synthetic business" | |
| A2 | Start sample → Assess | session created, URL gains `?session=`, readiness result shows | |
| A3 | Prepare: create plan, review mappings incl. `1200 · Misc Clearing` (REVIEW_REQUIRED) | decision required, nothing auto-approved | |
| A4 | Approve plan (explicit confirm) | status APPROVED | |
| A5 | Move: load manifest, start migration, hit controlled failure, recover duplicate | paused→resolved with approval; completed batches kept | |
| A6 | Verify: validation checks | all checks pass; mismatch would block | |
| A7 | Configure: apply reviewed settings | applied | |
| A8 | Onboard + first task: approve invoice | **Verified First Productive Use**, synthetic invoice (local run: USD 107.25) | |
| A9 | My Migration → Evidence & Results | evidence loads for the same session | |
| A10 | Scroll to "Advisory Operations" → Refresh | see interpretation below | |
| A11 | Reload page / new tab with same `?session=` | state persists (Cloud SQL) | |
| A12 | Account B opens `/workspace?session=<A id>` and `/trust?view=evidence&session=<A id>` | "Migration unavailable"/"Evidence unavailable"; no A data; B AI activity shows only B (empty) | |
Also: signed-out call to `/api/v1/operations/activity` returns 401; direct client write to Firestore denied (rules).

## Activity interpretation
| UI result | Meaning | Action |
|---|---|---|
| AVAILABLE, no events | read path works end to end (proxy→API→Firestore, IAM, index); Gemini unused as expected | **PASS** |
| AVAILABLE with event | a reservation exists; it proves a reservation, not a model call | inspect state: COMPLETED/FALLBACK/UNAVAILABLE |
| DISABLED (info alert) | `MOVEBOOKS_SYNTHETIC_BETA_AUTHORIZED` or Firestore backend setting missing in the API revision | BLOCKED: fix env, no code change |
| API `UNAVAILABLE` (warning alert) | API reached but Firestore read failed/timed out (IAM, index, cold start >2 s) | retry once; then BLOCKED, check logs |
| "Operational Activity Unavailable" with no API status | HTTP error: 401 token, 403/401 audience mismatch, 404 route, 5xx | BLOCKED: identity/audience/route issue |
No panel visible → you are not on the evidence view with a loaded session (see handoff).

## Tenant isolation checks
Owner is taken from the verified Firebase token only; query parameters are not accepted by the activity route; events are filtered by `owner_hash` and re-checked. Verify A12 plus: B cannot list/open A's session by guessing ids (UUID required).
