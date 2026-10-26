# MoveBooks AI V2: P0 messaging checkpoint and authentication handoff

Date: 20 Oct 2026. Branch `feature/v2-landing-final`, baseline `9ed2273`. Nothing is staged or committed.
Workstream A (messaging) is approved for checkpoint preparation. **Overall P0 release readiness remains NO-GO.**
This document supersedes §3, §4 and §7 of [`v2-p0-hardening-report.md`](v2-p0-hardening-report.md) where they differ (see §6).

## 1. Approved P0 messaging change inventory

All 13 files are in scope: AI-capability copy, internal example labels, the attribution standardization, and their guard tests. There are no functional, layout, theme, hero, CTA or animation changes. `ai-status-rule.md` and `AI_ASSISTANCE_STATUS = "planned"` are untouched.

| File | Change | Scope |
|---|---|---|
| `apps/web/app/page.tsx` | Eyebrow "Guided accounting migration"; lead "Prepare, move and validate your books with guided workflows, transparent checks and human control."; trust strip "AI recommendations and explanations are planned and unavailable in this Beta [Planned]. Today, rules check your data, you approve…" | Landing copy |
| `components/public-surfaces/Trust.tsx` | AI limitations opening: rules today; AI planned; Gemini only in synthetic dev/test | Trust copy |
| `components/public-surfaces/Guide.tsx` | "AI advice is planned and unavailable in this Beta; financial checks use deterministic rules." | Guide copy |
| `components/public-surfaces/ReasoningAdvice.tsx` | "Available here: rule-based guidance… Gemini Advisor assistance is planned and unavailable…" | Signed-in copy |
| `components/public-surfaces/OperationalActivity.tsx` | Intro: records don't establish live AI | Signed-in copy |
| `components/public-surfaces/Feedback.tsx` | Category "Rule-based recommendation" | Copy |
| `components/v2/V2ComponentSheet.tsx` | Attribution note no longer says "verified live" | Internal example |
| `components/DesignSystemShowcase.tsx` | "Rule-based observation (example)", "Planned AI recommendations (example)" | Internal example |
| `components/v2/Attribution.tsx` | **Exact rule line "Built on Google Cloud and powered by Gemini AI"**; same `<p class="v2-attribution site-attribution">` under the brand; unused logo slots removed (the rule allows no logos) | Attribution |
| `app/v2-landing.css` | Removed 3 rules for the deleted separator and logo spans; placement styles unchanged | Attribution |
| `components/v2/ai-copy.test.ts` | Guard: 19 surfaces, expanded forbidden phrases, sentence-level qualification, Planned constant and badges, attribution as the only Gemini exception | Test |
| `components/v2/Attribution.test.tsx` | Asserts the exact rule line, with no logo, link or endorsement | Test |
| `components/public-surfaces/surfaces.test.tsx` | Pins the landing wording, no AI claim in the hero, the trust-strip wording and the attribution text | Test |

## 2. Focused validation (fresh, after the attribution change)

| Check | Result |
|---|---|
| Affected tests (`components/v2`, `components/public-surfaces`, account shell, UI copy, legacy routes, member home) | 18 files, 289 passed |
| Full frontend `npx vitest run` | **64 files, 858 passed.** Baseline 823 + 36 guard cases − 1 logo-slot test removed with the logo slots. Nothing skipped. |
| `tsc --noEmit` / ESLint / `git diff --check` | Clean / clean / clean |
| Forbidden live-AI scan of `app`, `components`, `lib` source | None found ("AI-guided", "with AI guidance", "AI can provide", "AI predicts", "AI advice is advisory", "Agent recommendation", "verified live") |
| Browser, attribution placement | Same position under the brand; one line at 1440 and 390 in Dark and Light (`evidence/p0-hardening/attribution/`) |
| Earlier P0 browser QA (copy only; unaffected by the attribution text) | axe 0 violations × 9 width/theme cases; no horizontal scroll (`evidence/p0-hardening/qa/`) |

## 3. Proposed checkpoint commit contents

Proposed subject: `fix(web): capability-accurate AI messaging and approved attribution line (P0)`

Include:
- The 13 source and test files in §1.
- `docs/ux/v2-p0-hardening-report.md` and this file.
- `docs/v2-phase2/evidence/p0-hardening/` (`screens/` 4.5 MB, `qa/` 1.7 MB, `attribution/` 4.5 MB; about 11 MB of PNG plus `qa-report.json`).

Exclude, keeping locally:
- `.claude/` (local preview config).
- `docs/play/v1.1-design-change.md` and `docs/v2-phase2/VISUAL-REFINEMENT-BRIEF.md` (unrelated drafts).
- `docs/ux/v2-landing-codex-handoff.md` and `v2-landing-progress.md` (stale, per the freeze handoff).
- `docs/v2-phase2/evidence/landing-final/` and the untracked `codex-hero-refinement/qa/` images (pre-checkpoint evidence).

Confirm the evidence decision; if you prefer a lighter commit, drop the `attribution/` full-page PNGs.

## 4. Firebase authenticated acceptance runbook

### What the environment requires (from source; no secret values read)

- **Web build:** `NEXT_PUBLIC_IDENTITY_MODE=firebase`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_API_BASE_URL=/api`. The server proxy also needs `MOVEBOOKS_PRIVATE_API_ORIGIN`, `MOVEBOOKS_PUBLIC_WEB_ORIGIN` and, for a tunnel, `MOVEBOOKS_ADDITIONAL_WEB_ORIGINS`.
- **API:** Firebase identity is accepted **only in cloud mode** (`env` = `cloud-dev`, `staging` or `production`). That mode requires Cloud SQL, GCS, `identity_mode=firebase`, `demo_identity_enabled=false`, HTTPS CORS origins, and no emulators (`settings.py`). Local and test modes are forced to remain credential-free demo identity. **No purely local Firebase acceptance is possible.**
- **The only documented Firebase environment** is project `movebooks-ai`: the private preview `movebooks-v2-preview-web` (`docs/v2/release/PREVIEW-PLAN.md`). It reuses the **production API and database** through IAM; synthetic migrations created there belong to the test accounts. No separate staging or cloud-dev API is documented.
- **This machine:** `gcloud` is installed, but **0 active credentials**; the Firebase CLI is absent. Nothing in the cloud was or can be touched from this session.

**Owner decision required before any run.** Either:
- (a) approve the private preview deployment and synthetic-account writes into the production database (what PREVIEW-PLAN prescribes); or
- (b) provide or approve an isolated `cloud-dev` environment (infrastructure change).

Both are outside this task's authority.

### Operator steps (human only; Claude does not sign in)

Prerequisites: an approved environment from the decision above, reachable at `https://localhost:8443` through `gcloud run services proxy` and `local-ssl-proxy` (PREVIEW-PLAN steps 5–5a). You also need two owner-authorized synthetic Google accounts, A and B, and two separate fresh browser profiles. Never paste passwords or tokens into notes, terminals or chat.

1. **Gate:** `curl -sk -o /dev/null -w '%{http_code}\n' https://localhost:8443/api/v1/identity` must print `401` (app layer reached, signed out). On 401 *after* a successful Google sign-in, switch to `cloud-run-proxy` (PREVIEW-PLAN 5a). Do not make the service public.
2. **Account A, sign in:** profile A → `/sign-in` → Sign In → Google popup → account A. Expect one popup, a return to the requested page, and the Account menu showing **A's email** (there is no display name; email is the correct fallback).
3. **Member Home and My Migration:** the logo goes to `/workspace`; My Migration resumes, lists or shows the empty state; start a sample migration if empty. Note the `?session=` reference (record only its first 8 characters).
4. **Session refresh:** reload the tab → still A, same migration. Wait more than 60 minutes (or until the token refreshes) and reload → still A; no demo fallback.
5. **Protected deep links:** in a signed-out window, open `/workspace?session=<A ref>` → redirect to `/sign-in?next=…`; after A signs in → returns to that migration.
6. **Appearance:** switch Dark → Light → System in the header and in Account → Settings; reload; the choice persists for A.
7. **Sign-out:** Account → Sign Out. The account menu disappears; `/workspace` redirects to sign-in; Back shows no A data.
8. **Account B, isolation run:** `python docs/v2/release/auth-isolation/isolation_check.py https://localhost:8443 --out docs/v2-phase2/evidence/p0-auth/isolation-results.json`. Follow its prompts (A in window A, B in window B). Pass: B never sees A's company, figures or decisions; every B read of A's reference returns 401, 403 or 404; A still reads its migration.
9. **Same-tab switch (I5):** in profile A, sign out A, sign in B. B's My Migration never opens A's last migration; old A links show nothing of A.
10. **Cross-account write denial:** the harness covers reads. For writes, as B, try one foreign-owner action on A's migration (for example opening A's `/plan-map-approve?session=<A ref>` and pressing approve, if shown). Expect a refusal (401, 403 or 404, or an error state) and no change for A. Do **not** attempt invoice posting or any financial execution.
11. **Evidence:** save the harness JSON and screenshots with emails masked (`a***@…`) and session IDs truncated. Never save HAR files, storage state, cookies or `Authorization` headers.

Report each step as PASS or FAIL with the evidence path. Any step not run is NOT VERIFIED.

## 5. PostgreSQL isolation test plan

**What the 15 skips are.** `tests/test_migration_listing.py` runs every SQL-backed test twice: SQLite and PostgreSQL. The SQLite copies ran today: **18 passed**, including owner-only listing, foreign or garbage cursor rejection, foreign rows skipped without leaking, owner-bound SQL ordering, and isolation after restart. The 15 skips are the PostgreSQL copies only. They gate dialect behaviour (ordering, cursors, JSON and bytes limits) on the real database engine.

**Existing evidence.** `docs/v2/release/ACCEPTANCE-CHECKLIST.md` records a run against a throwaway local PostgreSQL 16 server: 33/33 passed. **No backend file has changed since** (`git log ab46546..HEAD -- services tests domain agents` is empty). That result therefore applies to identical code, but it is historical, not a fresh run.

**Safety constraint.** The fixture calls `metadata.drop_all(engine)` before each test, so it drops all MoveBooks tables at the URL given. Use **only** a throwaway database; never Cloud SQL, never a shared database.

**Can existing infrastructure do it?**
- Locally: **no.** There is no PostgreSQL server or Docker here, though the driver (`pg8000` 1.31.5) and SQLAlchemy are installed.
- In CI: **almost.** `.github/workflows/ci.yml` already has an ephemeral `postgres:17-alpine` service in the `postgres-contract` job. It runs only `test_google_runtime.py` and `test_postgres_runtime.py`, with `MOVEBOOKS_TEST_DATABASE_URL`; the listing tests read `MOVEBOOKS_TEST_POSTGRES_URL` and are not invoked, so they skip in CI too.

**Minimum options (choose one; each needs your approval):**

| Option | Steps | Needs |
|---|---|---|
| **A, recommended:** reuse the CI service | Add one step to `postgres-contract`: `pytest tests/test_migration_listing.py -q` with `MOVEBOOKS_TEST_POSTGRES_URL: postgresql+pg8000://contract:ephemeral-ci-only@localhost:5432/contract`. Run it as a separate step after the existing one. Expect `33 passed`. | A workflow edit (no cloud resources, credentials or authorization changes), plus a commit and push or PR to run it |
| B: local throwaway server | `brew install postgresql@17`, then `initdb` a temporary directory, `pg_ctl start` on `127.0.0.1:55432`, `createdb movebooks_listing_test`, then `MOVEBOOKS_TEST_POSTGRES_URL=postgresql+pg8000://$USER@127.0.0.1:55432/movebooks_listing_test .venv/bin/pytest tests/test_migration_listing.py -q`. Afterwards `pg_ctl stop` and delete the directory. | A package installation on this Mac (not allowed without approval) |
| C: accept the historical PG16 evidence | Record that backend code is unchanged since the 33/33 run | An owner risk acceptance; weakest option |

## 6. Corrections to the earlier P0 report

- **Attribution:** now the rule's exact line (the earlier report kept the pipe variant).
- **Listing isolation:** the earlier report said "NOT VERIFIED (15 skipped)". More precisely, owner-scoped listing isolation **passes on SQLite (18 tests)**; only the PostgreSQL dialect run is not fresh. Historical PG16 evidence exists for identical code.
- **Test count:** 858 (was 859); the logo-slot test was removed together with the logo slots.

## 7. Remaining P0 blockers

1. **Firebase authenticated browser acceptance** (runbook §4, steps 1–11). Blocked on the environment decision (preview against the production API and database, or a new cloud-dev) and the owner running the two synthetic accounts.
2. **Hosted two-account isolation**, reads and writes (steps 8–10). Same dependency.
3. **Fresh PostgreSQL listing run** (§5, option A or B). Blocked on approval of a workflow edit and push, or a local install.
4. Carried over, outside P0 scope: Privacy and Terms, captions, Contact channel, final hero `approved` sign-off.

## 8. Exact next action and approvals required

1. **Approve the checkpoint commit** in §3, including the evidence decision. Then I stage exactly those paths and commit locally. No push.
2. **Choose the PostgreSQL route:** A (workflow step; requires a push or PR to run), B (local install) or C (risk acceptance).
3. **Decide the Firebase environment** (§4) and schedule the operator run. Results come back as redacted evidence for me to assess. I will not sign in or mark any step passed without that evidence.
