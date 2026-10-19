# MoveBooks AI V2 checkpoint readiness and P0 handoff

20 October 2026. Repository: `JEMathew/movers-and-ledgers`. Branch: `feature/v2-landing-final`. Reviewed HEAD: `ab4654671b94f049bcf1a5959627e5d48862b97c`.

**GO for owner checkpoint approval following the authorized video-anchor compatibility fix.** The existing HeroVideo wrapper now restores `product-vision`; Guide, Demo and direct fragment navigation reach it without opening or playing the video. Fresh checks pass at 823 frontend tests. Nothing is staged by this review; the two pre-existing staged deletions remain. Commit, push, PR and deployment remain unauthorized.

The owner has accepted the design as the proposed frozen baseline, subject to final confirmation. This does not authorize live AI, release promotion or a new design. The hero's `approved: false` marker and its test remain unchanged pending that confirmation.

## Approved video anchor fix verification

The owner authorized this narrow repair after the preparation review below. Source changes are limited to `HeroVideo.tsx` (one wrapper ID) and `HeroVideo.test.tsx` (one regression test that renders the real Guide/Demo links and checks their destination contains the existing single play control). The existing `html { scroll-padding-top: 6rem; }` rule clears the sticky header; no CSS, visual, imagery or playback changes were needed.

Fresh results: the new test and 80 relevant tests pass; the full suite passes **823 tests across 64 files**; TypeScript, ESLint and `git diff --check` pass. Twelve browser navigation cases cover Guide/Demo clicks and direct fragment loads in desktop 1440×900 and mobile 390×844, Dark and Light. Desktop video media starts at the header's lower edge; mobile media starts at approximately 96px with the sticky header ending at approximately 83px. The play button is visible, the dialog remains closed and playback stays paused until explicitly requested. Playback, Escape, pause and focus return pass in all four layouts.

The existing nine-case browser harness was also rerun: no axe violations or overflow. Console-source logging identifies **both resource 404s as `/favicon.ico`**. No favicon asset exists at baseline HEAD; this is the already documented pre-existing issue, with no remediation in this fix. [Video anchor evidence](../v2-phase2/evidence/freeze-readiness/video-anchor-fix.json) supersedes the pre-fix anchor failure and unattributed-404 findings below. The existing 822-test verification JSON remains the historical preparation result.

## Preparation review baseline and verification

The pre-review working tree contains 16 modified tracked files, two staged deletions, seven new frontend files including the hero asset, and supporting/unrelated untracked files. All pre-existing tracked and untracked file contents are checked against a SHA-256 manifest before and after this review. The index is compared byte-for-byte. Only this handoff and its compact evidence folder are added by this task.

Exact status and per-file proposed disposition are in [git-status.txt](../v2-phase2/evidence/freeze-readiness/git-status.txt) and [checkpoint-inventory.json](../v2-phase2/evidence/freeze-readiness/checkpoint-inventory.json). No blanket `git add .` is proposed.

| Fresh local check | Result and scope |
|---|---|
| Full frontend suite | 64 files, **822 tests passed**; count unchanged. |
| TypeScript | `tsc --noEmit --incremental false`, exit 0. |
| ESLint | `eslint .`, exit 0. |
| Whitespace | `git diff --check`, exit 0. |
| Existing browser QA | Nine viewport/theme combinations: desktop 1440×900, mobile 390×844, 720×450 CSS viewport approximation of 200% zoom, each Dark/Light/System. Zero reported axe violations or horizontal overflow. This is not an actual browser-zoom or manual screen-reader certification. |
| Additional browser QA | Ten combinations at widths 1440, 390, 720, 1024 and 1180 in Dark/Light. Images load; one visible play control; mobile Appearance choices fit; zero reported axe violations, overflow or page errors. |
| Appearance | First visit Dark; keyboard selection and Escape focus return; Light survives reload; System follows a live OS appearance change. |
| Video | User-initiated playback, native controls, 25.042-second media, Escape closes and pauses, focus returns to play. Checked desktop/mobile in both themes. Captions remain absent. |
| Sticky CTA | Hidden at top, shown after original CTA is occluded, hidden on return; desktop heights 900/720 and mobile. |
| Journey | Sequential frames complete by 3600ms and remain complete at 5000ms; reduced-motion case has zero journey animations. |
| Routes | Explore Demo reaches `/simulator`; Try Your Data redirects to `/sign-in?next=%2Ftry-your-data` with 307 in local demo mode. Product surfaces retain their own palette. The older harness follows redirects when reporting 200, so that alone is not authentication acceptance. |
| Compatibility audit | **FAIL:** Guide and Demo each contain `/#product-vision`; the destination has zero elements with that ID. The hero play control still works. |
| Focused backend contracts | **102 passed**, covering identity display, independent review, explicit plan approval, validation failures and Google-runtime contracts. These use test fixtures/adapters; they are not real Firebase or hosted isolation acceptance. One FastAPI/Starlette test-client deprecation warning. |
| Candidate secret scan | Pattern scan of 36 pre-existing changed/untracked text files found no credential patterns or suspicious credential filenames. The 74 binary files were not text-scanned. This is a scoped scan, not a guarantee that every secret format can be detected. |

Fresh machine-readable results: [verification.json](../v2-phase2/evidence/freeze-readiness/verification.json), [browser-existing.json](../v2-phase2/evidence/freeze-readiness/browser-existing.json), [browser-extra.json](../v2-phase2/evidence/freeze-readiness/browser-extra.json), [route-audit.json](../v2-phase2/evidence/freeze-readiness/route-audit.json).

The existing browser harness recorded two resource 404 console messages without their URLs. The additional harness recorded no page errors. A favicon 404 is historically documented, but the two fresh messages cannot both be attributed to it from this report alone. Keep this as a diagnostic follow-up, not a clean-console claim.

No production build, hosted smoke, real Google sign-in, cloud configuration inspection, live model inference or production security acceptance was performed. Earlier production/build reports apply to their recorded revisions, not automatically to this uncommitted candidate.

## Proposed checkpoint contents

Proposed eventual subject: `feat(web): checkpoint MoveBooks AI V2 landing and hero refinement`.

The checkpoint contains the complete Claude implementation plus scoped Codex refinements, not only the final photograph. Shared navigation, account presentation and theme changes are intentional, but their authenticated browser behavior remains a separate release gate.

### Source and tests to include

All paths below are relative to the repository root. This is an inventory, not staging authorization.

| Disposition | Files |
|---|---|
| Modified source, 10 | `apps/web/app/layout.tsx`; `apps/web/app/page.tsx`; `apps/web/components/AccountControls.tsx`; `apps/web/components/Footer.tsx`; `apps/web/components/IdentityEntry.tsx`; `apps/web/components/MyMigration.tsx`; `apps/web/components/Nav.tsx`; `apps/web/components/public-surfaces/content.ts`; `apps/web/components/theme/ThemeProvider.tsx`; `apps/web/components/v2/Attribution.tsx` |
| Modified tests, 6 | `apps/web/components/journey/member-home.test.tsx`; `apps/web/components/public-surfaces/surfaces.test.tsx`; `apps/web/components/v2/Attribution.test.tsx`; `apps/web/test/account-shell.test.tsx`; `apps/web/test/legacy-routes.test.tsx`; `apps/web/test/ui-copy.test.tsx` |
| New source and tests, 6 | `apps/web/app/v2-landing.css`; `apps/web/components/public-surfaces/HeroVideo.tsx`; `apps/web/components/public-surfaces/HeroVideo.test.tsx`; `apps/web/components/public-surfaces/LandingJourney.tsx`; `apps/web/components/public-surfaces/landing-motion.test.tsx`; `apps/web/components/theme/AppearanceMenu.tsx` |
| New production asset, 1 | `apps/web/public/media/movebooks-ai-hero-desk-v2.webp` — 1536×1024, 92,548 bytes. No replacement or upscale. |
| Existing staged deletions, 2 | `apps/web/components/public-surfaces/ProductVision.tsx`; `apps/web/components/public-surfaces/ProductVision.test.tsx` |

Deletion review: no surviving component import of `ProductVision` was found; TypeScript and the full test suite pass. HeroVideo tests cover the replacement's playback, duration, media source and asset constraints. The old component provided `id="product-vision"`; the authorized repair restores it on the existing visible hero media container. One new test checks the real Guide/Demo links against the unique destination and its play control. No fragment-triggered dialog or playback was added. The count increases from 822 to 823 solely because of that regression test.

### Documentation and evidence to include

- This handoff and `docs/v2-phase2/evidence/freeze-readiness/`: compact verification JSON, two browser reports, route audit, exact status and explicit inventory.
- `docs/v2-phase2/evidence/codex-hero-refinement/`: `comparison.html`, `acceptance.json`, `hero-generation-prompt.txt`, `approved-reference.png`, all eight before and eight after screenshots used by the comparison, the two JSON reports linked by that viewer, and `harness/codex-checks.cjs`.
- `docs/v2-phase2/evidence/landing-final/harness/qa.mjs` and `shots.mjs`, required to reproduce the original checks and comparison captures.

The older acceptance record and comparison remain historical evidence, not fresh test results or final owner approval. The new verification record is authoritative for this checkpoint review. The saved prompt contains a historical absolute path to the generated PNG; the deployable WebP is included and does not depend on that local path.

### Exclude while preserving locally

- `.claude/launch.json`: machine-local preview configuration.
- `docs/play/v1.1-design-change.md`: unrelated work.
- `docs/v2-phase2/VISUAL-REFINEMENT-BRIEF.md`: superseded design brief.
- `docs/ux/v2-landing-codex-handoff.md` and `v2-landing-progress.md`: historical, stale 821-test/poster/theme descriptions. This handoff consolidates the reproducible current inventory. In particular, their suggestion to update the AI rule to allow current hero copy must not guide P0 implementation.
- Earlier `landing-final/before`, `after`, and `qa` artifacts; intermediate Codex QA PNGs. Keep locally; they are unnecessary duplicates for this checkpoint's comparison and JSON evidence.
- Temporary browser profiles/screenshots/logs, dependencies, build output, local env/configuration, caches, credentials and any unrelated file absent from the explicit include list. No existing file is deleted to implement these exclusions.

### Reproduction notes

Run the existing frontend commands from `apps/web`. Run the five backend test files from the repository root using the existing Python environment. Fresh commands and execution scope are recorded in `verification.json`.

Browser scripts use `playwright-core@1.56.1`, `@axe-core/playwright@4.11.0` and Chrome for Testing. Their historical executable paths are machine-specific; on another machine, set the executable path in a temporary runner copy. Do not commit a browser installation or a local QA dependency tree. `qa.mjs` and `shots.mjs` need their imports resolvable next to the temporary runner; `codex-checks.cjs` accepts the QA dependency directory as argument 1 and output directory as argument 2. Use an output directory outside the source tree to avoid overwriting accepted evidence. No package download or dependency change was needed for this review.

## P0 workstream 1 capability accurate messaging

Classification is evidence-scoped: **1 = available and locally verified**, **2 = implemented but disabled or not verified for the target environment**, **3 = planned as a customer-facing capability**. A capability may have a category 2 adapter while its public product remains category 3. No row establishes current deployed configuration; the existing release record says hosted inference is not active and no current runtime proof was obtained.

| Capability and classification | Persona and problem | Available functionality and customer value | Acceptance criteria and required evidence |
|---|---|---|---|
| Public guided demo — 1 | Prospective bookkeeper evaluating the flow without an account | Authored read-only synthetic preview; explains the journey without creating approvals or proving migration results | Keep synthetic/read-only boundary. Demo navigation and existing tests pass; do not label preview completion as financial verification. Fresh browser route and frontend tests support availability. |
| Rule-based recommendations and independent rule check — 1 locally; target runtime unverified | Accountant assessing a proposed mapping | Versioned policies propose mappings; independent deterministic review challenges source evidence without approving or changing a mapping | Provider/source must be visible; evidence references and stale-context handling retained. Rule-check API/test evidence, fallback result and no financial state change. Fresh independent-review tests pass. |
| Gemini reasoning adapters and model controls — 2 | Synthetic dev/test evaluator assessing experimental advice | Bounded five-capability adapter and review path, configuration guards, budgets and deterministic fallback exist | No public live inference claim. Source tests are insufficient for activation. Require the unchanged rule's pinned model/mode, enabled controls, service grant, kill-switch drill, named-account canary and authenticated hosted call. Staging/production live mode is explicitly rejected by current settings. Activation is outside this workstream. |
| Customer Gemini Advisor and Reviewer — 3 | Bookkeeper wanting a second opinion | Planned badges, disabled Ask controls and labelled examples; available rule check remains distinct | All relevant surfaces retain Planned and the human-approval boundary; no completed AI interaction is fabricated. Evidence: rendered public/member copy inventory, badge tests and owner review. |
| Automated migration and recovery — 1 for bounded synthetic workflow; real-provider migration — 3/unavailable | Migration operator moving sample books safely | Governed discovery, batches, recovery and stage transitions in a synthetic target; not autonomous permission | Explicit mappings/plan/remedy decisions remain required. No AI self-approval, provider integration or production-readiness promise. Evidence: prior local journey record plus fresh plan-approval tests; later hosted synthetic journey required. No new financial execution during this review. |
| Financial validation — 1 for local deterministic contracts; hosted journey unverified | Accountant establishing whether records reconcile | Rules compare supported source/target counts, balances and relationships; failed checks block progress | Same inputs/rules produce the same result; approval cannot waive failure. Business-ready status requires the governed verified synthetic first task. Evidence: fresh validation-failure tests and later complete target-environment evidence. Never equate browser file compatibility with reconciliation. |
| Human approvals and identity attribution — 1 in local contracts; Firebase deployment — 2 until accepted | Account owner controlling consequential actions | Explicit decisions and owner-scoped attribution, separate from recommendations | Preserve actor/time/evidence, denial and replay guards; test real identity/isolation in workstream 2. Fresh explicit-plan, identity and runtime tests; hosted evidence remains required. |
| Browser file compatibility — 1 locally; hosted upload/workspace creation — unavailable | Evaluator checking a permitted synthetic export | Browser-only compatibility checks; no Gemini transfer, public upload or financial approval | No network upload, no production data, no financial-success claim. Existing browser-validation/frontend tests; separately verify configured-host behavior. |
| Technology attribution and activity records — attribution is an approved exception; operational backend — 2 | Visitor or account owner understanding provenance | Quiet Google Cloud/Gemini attribution; optional owner-scoped activity snapshot with disabled/unavailable states | Attribution is not evidence that a model ran. Reservation/fallback/completion records must not imply financial approval or live product activation. Confirm source labels, empty/disabled states and target configuration before broader claims. |

Implementation evidence: `apps/web/components/v2/ai-status.ts`, `public-surfaces/ReasoningAdvice.tsx`, `plan-map-approve/IndependentReview.tsx`, `plan-map-approve/MappingReview.tsx`, `public-surfaces/Trust.tsx`, `public-surfaces/Guide.tsx`, `public-surfaces/GuidedDemo.tsx`, `public-surfaces/OperationalActivity.tsx`, `try-your-data/BrowserLocalValidation.tsx`, `MyMigration.tsx`, `onboard-fpu/VerifiedStart.tsx`; `services/api/src/movebooks_api/settings.py`, `reviewer.py`, `agents/model_policy.py`; and `docs/v2/release/RELEASE-READINESS.md`. The first component path starts under `apps/web/components`; the remaining abbreviated component paths share that root.

### Precise proposed copy changes after checkpoint approval

These are proposals only. Keep geometry, headline, CTAs, photo, animations and control behavior frozen. Review wrapping in the existing four screenshot sizes after any copy change.

| Location | Proposed change |
|---|---|
| `apps/web/app/page.tsx:22` | Replace “AI-guided accounting migration” with **“Guided accounting migration”**. |
| `apps/web/app/page.tsx:24` | Replace the lead with **“Migrate, validate and get ready to operate — with rule-based guidance and human control.”** |
| `apps/web/app/page.tsx:62` | Replace the first trust sentence with **“AI recommendations and explanations are planned and unavailable in this Beta.”** Retain the Planned badge and existing consequential-approval, evidence and synthetic-data sentences. |
| `public-surfaces/Trust.tsx:24` | Replace “AI predicts or explains…” opening with **“Current Beta guidance comes from deterministic rules. Planned AI guidance may explain mappings and remedies with uncertainty; confidence is never a guarantee or permission.”** Describe experimental adapters as implemented dev/test code that does not establish live Beta availability. Retain bounded-input exclusions and forbidden actions. |
| `public-surfaces/Guide.tsx:45` | Replace “AI advice is advisory; financial checks remain deterministic.” with **“AI advice is planned and unavailable in this Beta; financial checks use deterministic rules.”** |
| `public-surfaces/ReasoningAdvice.tsx:63` | **“Available here: rule-based guidance about the current proposal. Gemini Advisor assistance is planned and unavailable in this Beta. You approve every consequential change; guidance never changes your books.”** Keep result provider metadata truthful; an unexpected live-model response while Planned is an acceptance failure to investigate, not a reason to conceal provenance or flip the status. |
| `plan-map-approve/IndependentReview.tsx:45` | Keep “Available now” explicitly scoped to the rule check. Use **“A separate deterministic check challenges this candidate from source evidence. You approve every consequential change; this check never changes your books.”** Keep Gemini Reviewer Planned and real result provenance. |
| `public-surfaces/OperationalActivity.tsx:46` | **“Optional model activity records for your account, when tracking is enabled. A record does not establish that live AI assistance is available in this Beta. These records are separate from financial verification and approvals.”** Retain the existing precise reservation, unknown-usage and fallback statements. |
| `v2/V2ComponentSheet.tsx:71` | Replace the incorrect “only when AI assistance is verified live” note with **“Owner-approved technology attribution; it does not indicate that AI assistance is live.”** |
| `DesignSystemShowcase.tsx:43,47` | Label the sample observation **“Rule-based observation (example)”** and toggle **“Planned AI recommendations (example)”**. Add the required **“Example of planned behaviour. Not live model output.”** and human-approval boundary to any AI example. These are internal examples, not active capabilities. |
| `public-surfaces/Feedback.tsx:6` | Use **“Rule-based recommendation”** for current recommendation feedback; preserve the explicit unsent-draft behavior. Do not imply staffed delivery. |

Retain already accurate Planned language in My Migration, Understand, mapping second-opinion examples and Verified Start. Preserve Learn's deterministic financial explanation, human approvals, synthetic limitations and the real video duration. Audit the conceptual video transcript alongside captions; its “verified” outcome must stay explicitly synthetic/conceptual, not a measured result of viewing the video.

Attribution reconciliation is an owner decision: the unchanged rule specifies “Built on Google Cloud and powered by Gemini AI”; the later approved visual uses “Built on Google Cloud | Powered by Gemini AI”. The difference in separator/case does not establish live capabilities. Preserve current approved presentation during this task. Record an explicit formatting-only owner clarification, or restore the rule's exact wording after approval; never broaden its exception to hero or feature claims. Do not edit `docs/v2/phase1/ai-status-rule.md` or `AI_ASSISTANCE_STATUS` in this workstream.

The current `ai-copy.test.ts` checks a short forbidden-phrase list and does not catch “AI-guided” or “with AI guidance”. Expand semantic copy coverage to the actual public and authenticated surfaces, and render Planned/disabled/example states. Tests must reject unqualified present-tense AI promises while allowing the explicitly approved attribution. Explain every added test; the 822 baseline is a floor, not a cap. Do not make broad regex replacements that damage truthful provider evidence.

## P0 workstream 2 authentication and isolation

Persona: an authorized synthetic-account owner who must see only their own identity, migrations and decisions. Success requires both a usable sign-in journey and server-enforced denial; hidden UI alone is insufficient.

### Environment boundary

- Local checks need the existing Node/Python toolchains and credential-free fixtures. Current local settings require memory persistence/storage and demo identity. Real Firebase is not a local-mode toggle under the current settings contract.
- Configured acceptance needs an existing authorized test environment, Firebase Google provider and approved domain, matching web/API project, HTTPS web/proxy endpoint, API verification and existing durable storage. Public client configuration is not a substitute for API authority.
- The frontend requires `NEXT_PUBLIC_IDENTITY_MODE=firebase`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` and an HTTPS-compatible `NEXT_PUBLIC_API_BASE_URL` (normally `/api`). Inspect only approved non-secret configuration when access is later provided. Do not obtain credentials or provision/change infrastructure.
- Two owner-authorized synthetic Google accounts sign in manually in separate fresh browser contexts. Never capture passwords, bearer tokens or unredacted storage states in reports. No live customer data.
- Cloud middleware intentionally serves a page shell; a 200 HTML response is not a data leak or successful authorization by itself. Data/API responses and content determine acceptance. A demo cookie/token must never grant cloud authority.
- Keep workload IAM authorization separate from the end-user Firebase token. Check this at the approved hosted boundary; do not change IAM or proxy infrastructure in this workstream.

### Acceptance cases

| ID and scope | Procedure and pass criteria | Required evidence |
|---|---|---|
| AUTH01 local contracts and configured browser | Ready Google click opens one popup; cancel/block/error remains recoverable; no demo fallback. API verifies subject/email before account UI and navigation become authenticated. | Unit tests plus configured browser recording and redacted identity response. |
| AUTH02 configured browser | Show only API-verified email. Current API has no display-name field, so email fallback is correct. Do not use profile name, workspace actor or request-body owner as authority. | A and B identity captures, subject/email match, unavailable-verification state. |
| AUTH03 configured browser | Brand opens Member Home; My Migration opens the correct owned selection; empty/unavailable state does not fabricate or replace a workspace. Reload retains the proper owner. | Screens and redacted list/session reads for both accounts. |
| AUTH04 local routing and configured browser | Open all protected deep links signed out, then sign in to the safe intended destination. Include `/workspace`, `/try-your-data`, `/assess`, `/plan-map-approve`, `/migrate-resolve`, `/validate-configure`, `/onboard-fpu`, evidence `/trust?view=evidence&session=…`, legacy `/product`, `/approvals`, `/reports`. A cloud shell may render but must expose no protected data. Reject external/unsafe `next`. | Destination matrix, denial responses, no private content flash. |
| AUTH05 local contracts and configured browser | Same-tab reload and token refresh preserve verified identity. Expired, revoked, malformed and wrong-project tokens fail closed. Refresh failure must not display an old verified account or become demo access. | Mock verifier tests plus later approved expiry/revocation fixtures or operator-prepared tokens; no revocation/config changes performed without separate authorization. |
| AUTH06 configured browser | Account menu and Settings work on desktop/mobile with keyboard and Escape. Appearance persists across reload and System follows OS. Theme is browser preference, not evidence of account ownership or cross-device sync. | Four theme/viewport recordings, focus checks and no overflow. |
| AUTH07 configured browser | Sign out A, confirm unavailable protected reads, sign in B in the same tab; delayed A requests, browser Back and old migration links never reveal A content. A retained last-reference key may exist but must not authorize/read it under B. Sign-out failure states are honest. | Slow-response/account-switch recording and redacted network trace. |
| ISO01 local fixtures and two configured accounts | A owns fixture A and B owns fixture B. Verify both legitimate reads first. Swap IDs bidirectionally in session, stage snapshots, mapping evidence, activity, validation, configuration, onboarding, FPU, reasoning/review and evidence routes. | A→B and B→A matrix; valid own access plus cross-owner 403/404, no protected fields. Missing/invalid identity must get 401. 401 for a supposedly valid B session requires investigation, not an isolation pass. |
| ISO02 local fixtures and two configured accounts | Owner-scoped migration lists and cursor pagination omit the other account. Replay another owner's cursor; inject foreign session/mapping IDs into path/query/body, including resource IDs mixed from two sessions. | Redacted responses; IDs/counts associated only with the authenticated owner. |
| ISO03 local fixtures first, then explicitly authorized synthetic writes | Submit valid-shaped foreign-owner operations: mapping approve/reject/modify/reconsider; plan consent; migration start/retry/resolution; validation/remediation; configuration; onboarding; FPU decision/execute; reasoning/reviewer requests. Exercise method/path allowlists and forged actor/email/role fields. | Expected 403/404 or explicit spoof rejection before any mutation; compare A's versions, decisions, receipts, audit counts and model reservations before/after. A malformed request's 400/422 alone does not prove authorization. No repeated financial execution or live model activation. |
| ISO04 configured browser/server | Test raw approved API/proxy requests, not just UI. Confirm demo credentials cannot cross the cloud boundary and no cross-owner operation writes artifacts or reserves model budget. Confirm A still works after denials. | Redacted status/body summaries and test-environment state diff. No secrets in HARs/logs. |

Reuse `docs/v2/release/auth-isolation/isolation_check.py` as a starting point after approval. It currently checks mostly B→A reads, refresh and sign-out; `--dry-run-local` explicitly proves only harness mechanics with one demo identity. Extend coverage bidirectionally with verified A/B positive controls, valid-shaped write denials and before/after state checks. Its conditional known-company string checks are insufficient for arbitrary data; require owned fixture identifiers and explicit absence of protected fields. Do not describe its existing dry run as two-account acceptance.

Existing local test entry points: `apps/web/test/account-shell.test.tsx`, identity/provider tests, `apps/web/lib/server/proxy-auth.test.ts`, proxy policy and middleware tests; backend `test_identity_display.py`, `test_google_runtime.py`, `test_migration_listing.py`, `test_discover_assess.py`, `test_plan_map_approve.py`, `test_mapping_reconsideration.py`, `test_migrate_resolve.py`, `test_validate_configure.py`, `test_onboard_fpu.py`, `test_onboard_cloud_owner.py`, `test_live_reasoning.py`, `test_independent_review.py`, `test_operational_activity.py`. Run only credential-free selected tests locally; emulator/PostgreSQL/hosted tests need their explicitly prepared environments.

## Remaining release gates outside the P0 implementation

1. Reviewed captions and transcript: audit actual audio and essential visual information, provide synchronized captions where required, and manually verify native controls and equivalent access. Automated axe results do not close this gate.
2. Owner-reviewed Privacy Policy reflecting actual data handling, retention and synthetic Beta boundaries; working public route.
3. Owner-reviewed Terms of Use; working public route. No generated placeholder legal text.
4. Contact decision: current `/support` is self-service and does not submit anything. Either approve an accurately labelled Help link or provide a real channel and authorized delivery test.
5. Production image/build provenance: final owner photo/crop approval, asset SHA-256, source/build identity, eventual image digest and scan. Generated image and marketing illustration are not operational screenshots or capability evidence.
6. Hosted acceptance and release smoke: explicitly authorized environment only, four layouts, auth/isolation, route/static-asset/cache behavior, approved copy, playback/captions and baseline regression tests. No deployment authorization is implied by checkpoint approval.
7. Compatibility and diagnostics are resolved for checkpoint purposes: the video anchor is restored and verified, and both resource-404 messages identify the pre-existing missing favicon. The console is not claimed to be error-free.

## Recommended Claude Code handoff and execution order

Use Claude Code in this existing local repository for the subsequent scoped implementation. No new thread, message or delegation is authorized or performed by this handoff. Use the owner's configured model; no model switch is required for this preparation.

1. The approved video-anchor repair is complete with one regression test and 823 passing frontend tests. Review its evidence, the updated exact checkpoint inventory and final visual confirmation before commit approval.
2. Only after explicit commit approval, stage the allowlisted implementation and necessary documentation/evidence; inspect the staged diff, retain both intended deletions and exclude every unrelated/local artifact. Create the approved local checkpoint only. Do not push, create a PR or deploy.
3. After checkpoint approval and authorization to start P0 work, implement the messaging proposals as copy/status clarity changes. Leave the AI rule, status constant, execution rules, authorization and financial controls unchanged. Stop on evidence that contradicts the declared capability state.
4. Extend local authentication/isolation coverage and prepare the two-account runner. Run the configured browser cases only after the owner supplies an authorized test environment and signs in with synthetic accounts. Report unavailable environments as blocked, not passed.
5. Rerun the frontend baseline plus new tests, TypeScript, ESLint, targeted backend tests and the existing browser matrix. Every new test must protect a specific acceptance criterion. Compare against frozen screenshots for unintended layout changes.
6. Return source diff, exact copy changes, test counts, redacted isolation evidence and remaining gates for owner review. Captions/legal/contact/provenance remain separate workstreams. No infrastructure, database, model activation, financial-control or production changes are permitted.

Checkpoint readiness and release readiness are separate decisions. The authorized compatibility repair and inventory are prepared; this task stops before staging, commit or P0 implementation.
