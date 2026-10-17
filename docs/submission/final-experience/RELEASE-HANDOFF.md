# RELEASE HANDOFF — final experience and release (PREPARED, NOTHING EXECUTED)

Baseline: branch `delivery/submission-integration`, release-prep commit `aacd3a5` on app baseline `01d105c` (confirmed from git log, 17 Oct 22:20 IST). Re-read HEAD before working.
Status given by owner (not re-verified here): API + web images built, Grype-gated, published; SQL backup OK; Firestore conditional IAM set; API and web candidates healthy at 0%; Firebase authorized domain added; candidate sign-in and first migration page work; Gemini deterministic-only; custom audience configured on API.
**Do not repeat** infrastructure audits, image builds already done, or full test suites. Never assume cloud access or approval; every ★ needs fresh explicit approval.

## Deadline clock (IST)
Now Sat 17 Oct ~22:20 · UX freeze Sun 12:00 · final candidate verified Sun 15:00 · video recorded Sun 19:00 · **submit by Sun 21:00** (hard 23:59). If UX work is not merged and verified by Sun 12:00, **ship the existing candidate unchanged** and treat UX as P2.

## Sequence, dependencies, stop conditions
| # | Step | Needs | Stop if |
|---|---|---|---|
| R1 | Browser accountant acceptance on web candidate (`ACCOUNTANT-ACCEPTANCE.md` A1–A12) | signed-in Google account A, candidate web URL | any stage cannot complete, or any 5xx/401 loop |
| R2 | Firestore activity read: `/trust?view=evidence&session=<A-session>` → bottom "Advisory Operations" → Refresh | R1 created a session | UI shows warning "Operational Activity Unavailable" (see interpretation table) |
| R3 | Two-account isolation (account B) | second Google account | B can read any A data |
| R4 ★ | Decide UX scope (`UX-IMPLEMENTATION-PLAN.md`) — approve P0 set or skip | R1–R3 results | — |
| R5 | Implement in separate worktree/branch `ux/final-experience` from `aacd3a5`; 1 commit per UX item; run **only** the focused vitest files listed in the plan | R4 approval | any focused test fails → fix or drop item; never widen scope |
| R6 ★ | New Stage A/B: archive new commit, **edit constants** (`COMMIT`, `TREE`, tar name) in `release-prep/build-and-scan.sh` (hardcoded to 01d105c / `6c5b3872…`), build+scan web (and API unchanged → reuse digest) | R5 | any High/Critical, ignored finding, stale DB |
| R7 ★ | Push scanned web image, deploy new no-traffic web revision (suffix = new short sha), same env as current candidate | R6 PASS | revision not Ready |
| R8 | Repeat R1–R3 quickly on the new web candidate | R7 | regression |
| R9 ★ | Promote: API tag→100% first; then set web candidate `MOVEBOOKS_PRIVATE_API_ORIGIN` back to the main API URL (not the tag), re-test sign-in + activity, then web tag→100%; remove temp Firebase domain and custom audience afterwards | R8 | any error after API promotion → rollback API first |
| R10 ★ | Live Gemini gate (`RELEASE-GATES.md` G11): policy flags + bounded one Advisor + one Reviewer call, separate approval, go/no-go Sun 10:00 | R9 or earlier on candidate | non-fallback result not proven → submit "validated in development" wording |
| R11 | Narrated video (3–4 min) on the public URL; deck PDF; description ≤1,024 chars; public repo push ★; logged-out link check | R9 (R10 optional) | any link not public |

Rollback: record current serving revisions first (`gcloud run services describe … --format='value(status.latestReadyRevisionName,status.traffic)'`); `update-traffic --to-revisions <rev>=100`. API rollback is the first action. Data rollback only via the Cloud SQL backup taken pre-deployment (id given by owner: 1792248161480).

## Hard rules for the next session
- UX changes are **frontend-only copy/layout**; no new features, agents, integrations, animation.
- Any frontend change forces rebuild + scan + redeploy (R6–R8). Bundle all P0 into one rebuild.
- Do not promote a web revision whose `MOVEBOOKS_PRIVATE_API_ORIGIN` is the API tag URL.
- Never display or store tokens; never claim live Gemini without a captured non-FALLBACK record.

## First action next session
Run R1 in a signed-in browser on the web candidate (owner-driven, or Claude in Chrome if enabled) and record outcome in `ACCOUNTANT-ACCEPTANCE.md`. Ask for R4 approval only after R1–R3 results exist.
