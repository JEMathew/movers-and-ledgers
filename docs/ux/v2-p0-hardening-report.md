# MoveBooks AI V2: P0 release hardening report

Date: 20 Oct 2026. Branch `feature/v2-landing-final`, baseline `9ed2273`. All changes are uncommitted.
Nothing was deployed. The following are unchanged: infrastructure, data, IAM, agent permissions, financial rules, `docs/v2/phase1/ai-status-rule.md` and `AI_ASSISTANCE_STATUS`.

**Recommendation: P0 is NO-GO for release.** Workstream A (messaging) is complete and verified, and is ready for owner review. Workstream B (authentication and isolation) passes every local server-side check that could run. However, its browser acceptance is **BLOCKED**: no Firebase-configured test environment and no synthetic accounts were available. The PostgreSQL-backed listing isolation tests could not run either.

## 1. AI capability-to-copy matrix

Evidence for the capability state:
- `services/api/src/movebooks_api/settings.py`: `model_provider_mode` defaults to `deterministic-only`, and `gemini-adk` raises an error in `staging` and `production`.
- `apps/web/components/v2/ai-status.ts`: `AI_ASSISTANCE_STATUS = "planned"`.
- The rule doc states that hosted inference is not active.

| Capability | Class | Copy now says | Where |
|---|---|---|---|
| Public guided demo (synthetic, read-only) | **Available and verified** | "Explore Demo", "No sign-in for the demo", "Synthetic demo data" | Landing hero |
| Rule-based guidance and independent rule check | **Available and verified** locally (target runtime unverified) | "Available here: rule-based guidance…", "Available now: a separate deterministic check…" | `ReasoningAdvice.tsx`, `IndependentReview.tsx` |
| Deterministic financial validation; human approvals | **Available and verified** (local contracts) | "rules check your data, you approve every consequential decision" | Landing strip, Trust, Guide |
| Browser file compatibility check | **Available and verified** (local); hosted upload unavailable | "Files checked in your browser" | Landing hero, Try Your Data |
| Gemini reasoning adapters and model controls | **Implemented but disabled or unverified** (synthetic dev/test only) | "implemented only for configured synthetic dev/test environments… does not make AI assistance available in this Beta" | `Trust.tsx` |
| AI activity records | **Implemented but disabled or unverified** (tracking off unless configured) | "Optional model activity records… A record does not establish that live AI assistance is available in this Beta." | `OperationalActivity.tsx` |
| Gemini Advisor and Reviewer (customer-facing) | **Planned** | Planned badge; "planned and unavailable in this Beta"; disabled Ask buttons; labelled examples | Landing strip, My Migration, Understand, Prepare, Start, Guide, Trust |
| Technology attribution | Approved exception, not a capability claim | "Built on Google Cloud \| Powered by Gemini AI" (unchanged) | Header |

## 2. Messaging changes (verified)

| File | Before | After |
|---|---|---|
| `app/page.tsx` eyebrow | AI-guided accounting migration | **Guided accounting migration** |
| `app/page.tsx` lead | Migrate, validate and get ready to operate — with AI guidance and human control. | **Prepare, move and validate your books with guided workflows, transparent checks and human control.** |
| `app/page.tsx` trust strip | AI can provide recommendations and explanations [Planned]. You review and approve… | **AI recommendations and explanations are planned and unavailable in this Beta** [Planned]. **Today, rules check your data, you approve every consequential decision, and…** |
| `Trust.tsx` AI limitations | AI predicts or explains mappings… Optional configured synthetic dev/test Gemini guidance labels its source and fallback. | **Current Beta guidance comes from deterministic rules. Planned AI guidance may explain…; confidence is never a guarantee or permission. Gemini guidance is implemented only for configured synthetic dev/test environments, labels its source and fallback, and does not make AI assistance available in this Beta.** (Rest unchanged.) |
| `Guide.tsx` limitations | AI advice is advisory; financial checks remain deterministic. | **AI advice is planned and unavailable in this Beta; financial checks use deterministic rules.** |
| `ReasoningAdvice.tsx` | Optional advice about the current proposal… live Gemini requires explicit operator configuration. | **Available here: rule-based guidance about the current proposal. Gemini Advisor assistance is planned and unavailable in this Beta. Guidance cannot approve, retry, post or verify; you approve every consequential change.** Provider metadata display unchanged. |
| `OperationalActivity.tsx` intro | What AI advice was reserved, used or replaced by rules for your account. | **Optional model activity records for your account, when tracking is enabled. A record does not establish that live AI assistance is available in this Beta.** |
| `V2ComponentSheet.tsx` (internal) | Shows the owner-approved line only when AI assistance is verified live. | **Owner-approved technology attribution; it does not indicate that AI assistance is live.** |
| `DesignSystemShowcase.tsx` (internal) | "Agent observation", "Agent recommendations" | **"Rule-based observation (example)"**, **"Planned AI recommendations (example)"** |
| `Feedback.tsx` category | Agent recommendation | **Rule-based recommendation** |

Unchanged on purpose: the headline, CTAs, layout, hero photo, animation, attribution and every verified functional claim. Copy already accurate (My Migration, Understand, Prepare second-opinion examples, Verified Start, Learn) was left alone.

Regression guard, `components/v2/ai-copy.test.ts` (7 → 43 tests):
- It now covers 19 public and signed-in files (was 5).
- An expanded forbidden list catches all 8 previous wordings (checked by running each old phrase against it).
- A sentence-level rule: any sentence offering AI or Gemini help must be qualified (planned, unavailable, dev/test, future tense, a limit, or the Planned badge).
- It asserts `AI_ASSISTANCE_STATUS === "planned"`, the Planned badge on the landing, ReasoningAdvice and IndependentReview, and that the attribution is the only Gemini wording exception.

`surfaces.test.tsx` now pins the approved landing wording and checks that the hero has no "AI" claim.

## 3. Authenticated browser acceptance

| # | Requirement | Result | Evidence |
|---|---|---|---|
| B1 | Google sign-in and sign-out | **BLOCKED** (browser); PASS (unit) | No Firebase test config (`NEXT_PUBLIC_IDENTITY_MODE`, Firebase keys unset) and no synthetic accounts. Claude may not sign into Google accounts. Unit: `account-shell`, `google-sign-in`, `google-identity-runtime`, `runtime-identity` pass. |
| B2 | Account shows the correct name and email | **BLOCKED** (browser); PASS (unit, email) | The API identity has no display-name field (`VerifiedIdentity = {subject, email}`); email is the correct fallback. Unit tests check that only the API-verified email shows and the subject never appears. |
| B3 | Member Home and My Migration routing | PASS (unit); **BLOCKED** (browser) | Logo → `/workspace` after sign-in; nav order asserted. `member-home-continuity`, `MyMigration`, `WorkspaceEntry.listing` pass. |
| B4 | Protected deep links and session refresh | PASS (local redirect); **BLOCKED** (Firebase refresh) | Local: `/workspace?session=…` → 307 `/sign-in?next=%2Fworkspace%3Fsession%3D…`; `/try-your-data` → 307 with `next`. Stage pages serve a page shell (200) and read data only through the authorized API. Backend `test_identity_display` rejects missing, invalid and demo tokens. Token refresh on hosted Firebase is not tested. |
| B5 | Dark, Light and System | PASS (signed out, browser); PASS (signed in, unit) | Browser: Dark on first visit, choice remembered after reload, System follows the OS live, keyboard Escape returns focus. Settings radios are tested in `account-shell`. |
| B6 | Switching accounts | PASS (unit); **BLOCKED** (browser) | `account-shell`: identity is removed when the session clears; the account menu is keyed to the verified email. A real A→B switch in one tab is not tested. |
| B7 | Cross-account reads and writes denied server-side | PASS (local backend, in-memory); **NOT VERIFIED** (PostgreSQL listing, hosted) | See §4 |
| B8 | Financial approval authorization boundaries | PASS (local backend) | `test_onboard_cloud_owner` (other owner cannot approve or prepare; wrong role cannot post or verify; approval needs current evidence and consent), `test_explicit_plan_approval`, `test_onboard_fpu` (owner boundary, forged events, replay) |

## 4. Two-account isolation

| Check | Result | Evidence |
|---|---|---|
| Other owner cannot approve, prepare, post or verify | PASS | `test_cloud_other_owner_cannot_approve_or_prepare`, `test_cloud_invoice_wrong_role_cannot_post_or_verify` |
| Owner spoofing in requests is rejected | PASS | `test_http_owner_isolation_spoof_rejection_and_visible_fallback` |
| Mapping evidence is owner-scoped | PASS | `test_mapping_evidence_is_owner_scoped_through_session_access` |
| Owner and identity are immutable under compare-and-swap; artifacts are owner-scoped | PASS | `test_owner_cas_and_identity_immutable`, `test_artifact_owner_scope_and_consent` |
| API auth, ownership and forged events | PASS | `test_versioned_api_auth_ownership_forged_events_and_end_to_end` |
| Owner-scoped listing; foreign or garbage cursor rejected; foreign rows skipped; isolation after restart | **NOT VERIFIED** (15 skipped) | `test_migration_listing.py` needs `MOVEBOOKS_TEST_POSTGRES_URL`; no local PostgreSQL or Docker |
| Two real synthetic Google accounts, hosted | **BLOCKED** | Needs an owner-run session with `docs/v2/release/auth-isolation/isolation_check.py` (A and B sign in by hand; the script never handles credentials) |

No tokens, credentials or personal data appear in this report or the evidence.

## 5. Changed files (P0 only)

`apps/web/app/page.tsx`, `components/public-surfaces/{Trust,Guide,ReasoningAdvice,OperationalActivity,Feedback}.tsx`, `components/v2/V2ComponentSheet.tsx`, `components/DesignSystemShowcase.tsx`; tests `components/v2/ai-copy.test.ts` and `components/public-surfaces/surfaces.test.tsx`. In total 10 files, +63/−19.
Evidence: `docs/v2-phase2/evidence/p0-hardening/` (`screens/` desktop and mobile × Dark and Light; `qa/qa-report.json` and images).

## 6. Test results

| Suite | Result |
|---|---|
| Frontend `npx vitest run` | **64 files, 859 passed.** Baseline 823, plus 36 new AI-copy guard cases; none removed or skipped. |
| Frontend auth, routing and identity subset | 8 files, 144 passed |
| TypeScript `tsc --noEmit` | Clean |
| ESLint | Clean |
| `git diff --check` | Clean |
| Backend (identity, runtime, listing, onboarding owner, plan approval, FPU, independent review, discover, plan-map, migrate-resolve, validate-configure) | **258 passed, 15 skipped** (all skips: PostgreSQL listing) |
| Browser (headless Chromium, `next dev`, local demo identity) | axe WCAG 2.2 AA **0 violations** at 1440×900, 390×844 and 200% zoom × Dark, Light and System; no horizontal scroll; sticky CTA, appearance and links pass; new copy wraps without layout change |

## 7. Remaining blockers

1. **Authenticated browser acceptance** (B1–B4, B6): needs an authorized Firebase-configured test environment and two owner-run synthetic Google accounts.
2. **PostgreSQL listing isolation:** run `test_migration_listing.py` with `MOVEBOOKS_TEST_POSTGRES_URL` set to a disposable local or test database.
3. **Hosted two-account isolation run:** `isolation_check.py` against the test host, ideally extended to A↔B both ways and to writes.
4. **Attribution wording:** the rule's exact line is "Built on Google Cloud and powered by Gemini AI"; the header shows "Built on Google Cloud | Powered by Gemini AI". The owner should confirm this is formatting-only, or restore the exact line.
5. Carried over: Privacy and Terms documents, video captions, Contact channel decision, final hero `approved` sign-off.

## 8. GO / NO-GO

| Scope | Decision |
|---|---|
| Workstream A, capability-accurate messaging | **GO** for owner review. Claims match the deployed capability state and are guarded by tests. |
| Workstream B, auth and isolation (local contracts) | **GO.** All runnable server-side and unit checks pass. |
| P0 release gate overall | **NO-GO** until blockers 1–3 pass in an authorized environment |
