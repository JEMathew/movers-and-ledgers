# MoveBooks AI — final UX release closeout proposal

**Latest:** owner-approved Option B and homepage-only “Built on Google Cloud” are implemented and freshly validated. **BR-01–08 PASS; current 63-case matrix: 48 PASS / 0 FAIL / 12 BLOCKED / 3 NOT RUN.** The implemented checkpoint is the [21-path manifest](v2-release-checkpoint-files.txt); earlier seven/thirteen-file and conditional proposals below are historical. [Final implementation, evidence, risks and next approval](v2-final-acceptance.md#implemented-branding-acceptance--20-october-2026). Preview http://127.0.0.1:3119/ remains running. Local checkpoint READY for separate authorization; production NO-GO. No staging, commit or cloud action.

20 October 2026, approximately 18:30 IST. **Local checkpoint proposal READY FOR REVIEW. Production NO-GO.** No staging, commit, push, PR, deployment or publication is authorized by this closeout. The 20:00 IST production target is not a credible commitment while the gates below remain open.

## Historical seven-file checkpoint selection (superseded below)

Base: `e7f1e288fd7f378045950fc94d5d7c89e298575f`, branch `feature/v2-landing-final`. The [seven-path allowlist](v2-release-checkpoint-files.txt) is the complete proposed incremental selection:

| Selected file | Purpose |
|---|---|
| `apps/web/app/v2-landing.css` | Only product delta: existing tested `scroll-margin-top: 1rem` below 1024px, preventing sticky-header overlap at the video fragment. |
| `docs/ux/v2-release-closeout.md` | Final gates, risks, actions and validation scope. |
| `docs/ux/v2-release-checkpoint-files.txt` | Exact reviewable selection; not an automatic staging script. |
| `docs/ux/v2-release-evidence-index.json` | Compact hashes/locations for retained original evidence, artifact identities and current CSS patch. |
| `docs/ux/v2-track-a-media-review.md` | Unpublished full narration review table, explicit uncertain word, alternative structure and acceptance form. |
| `docs/ux/v2-release-disclosure-drafts.md` | Unapproved Privacy/Terms drafts, missing facts and legal/publication approval form. |
| `docs/ux/v2-release-manual-auth-acceptance.md` | A/B verification and separately authorized hosted-acceptance procedure. |

This is a **recoverable preparation checkpoint**, not a release-ready image. The frozen landing implementation, original hero/video and anchor regression are already in the base and require no duplicate file selection. The six selected documentation files do not serve captions or policies. Approval to commit these seven paths would not approve their drafts for publication.

Exclude and preserve `.github/workflows/ci.yml` (unrelated), `.github/workflows/ux2-web-candidate.yml`, `tests/test_web_release_scan_gate.py` and `docs/v2/release/smoke-v2.sh` (separate tooling proposal), Gemini/backend files, `.claude`, other handoffs, repeated screenshots, temporary scripts/cache/model files, container/source archives, raw logs and bulk SBOM/scan outputs. No deletions are proposed; the existing index is empty. Preserve evidence locally through the index rather than adding redundant binary/raw data to this checkpoint. A later external review would need separately approved sanitized evidence sharing; the index alone is not the full evidence payload.

The tooling workflow still pins exact `e7f1e28`, so it **must not be used to claim a CSS/caption/policy candidate was built**. Keep the tooling proposal out of this checkpoint; retarget source/tree/digests in a separately approved tooling change only if that workflow is chosen for the final build. Local exact-source build preparation can avoid GitHub dispatch entirely.

After human content approval, the minimal prospective additional product files are `apps/web/components/public-surfaces/HeroVideo.tsx`, its existing `HeroVideo.test.tsx`, one new `apps/web/public/media/movebooks-ai-product-vision.en.vtt`, new `apps/web/app/privacy/page.tsx` and `apps/web/app/terms/page.tsx`, and `apps/web/components/public-surfaces/content.ts` for real footer links. These are **not selected or implemented now**. Approved content and needed route/link regression coverage must be reviewed in a revised explicit inventory before the final release checkpoint. Do not generate another hero or alter encoded video, AI rules, authentication or financial execution.

## Completed engineering versus acceptance

| Gate | Evidence / verdict | Scope limit |
|---|---|---|
| Baseline source and runtime image | Exact `e7f1e28`; index `sha256:f9c72c0bbc66497920357f7a37ab79c4ad25c3c421bf063a9d03706cf80e2e63`; amd64 config `sha256:772717195e16bb816d7eec534e2a032d6c3854e9561dc629ceb5c307a19aa997`. | Does not contain uncommitted CSS or future media/legal additions. |
| Runtime security / SBOM | Prior Grype: 0 Critical/High/Medium; 519-component image SBOM. Preserved, not rerun. | Development advisory remains separate; future changed image needs a new scan. |
| Native acceptance | PASS, Gen1/256 MiB/1 CPU/concurrency 8; 90 expected HTTP results; p95 465 ms; sampled peak 140.74 MiB; no observed OOM/unexpected 5xx. | Bounded disconnected HTTP only; no browser/auth/refresh/long-term capacity proof. |
| Cleanup / production | Preview service, active identity and image package removed at 17:53 IST; production unchanged at 100% `r16e31e9-1041` at that verification. | Closeout makes no new cloud call; rollout/rollback are not executed or authorized. |
| Mobile fragment / frozen visuals | Earlier patched-build 30/30 fragment cases; four full-page comparisons unchanged. Prior 858 frontend tests, TypeScript, ESLint, 24 smoke and nine axe/layout cases passed. | Local base-plus-CSS artifact, not exact container. No full WCAG claim. |
| Caption and media alternative | BLOCKED: drafts prepared, uncertain narration and timing/sounds unresolved. | Human listening and accessibility review required. |
| Privacy / Terms | BLOCKED: unpublished incomplete drafts. | Legal identity/contact/retention/data-flow facts and text approval missing. |
| Accounts A/B / hosted isolation | UNVERIFIED / NOT RUN. | Operator Cloud Run IAM and public HTML are not Google-user acceptance. |
| Advisory / API replay | OPEN, release-blocking disposition. | No waiver and no backend remedy from a UX image. |
| Final candidate and release authorization | NOT READY / NOT AUTHORIZED. | A changed product candidate requires new provenance and targeted validation. |

## Minimum actions, owners and review value

“AI Builder evidence” here means credibility and traceability of the builder/demo record, not a verified scoring rubric or proof that Gemini is live. The Intuit column is an explicitly proposed Senior Staff PM review lens, not a statement about Intuit's hiring criteria. All implementation/checklist substeps below belong to the corresponding action and inherit its benefit/evidence rationale.

| Action and required owner | End-user benefit | AI Builder evidence impact | Intuit migration/onboarding Senior Staff PM relevance |
|---|---|---|---|
| **A1 — Release owner reviews the seven-file checkpoint; select final approved content before authorizing any commit.** Engineering preserves the one-line mobile fix. | Video links land below the sticky header without redesign or regression. | Distinguishes frozen baseline, tested patch and eventual shipped source. | Scope control, mobile onboarding friction and measurable acceptance criteria. |
| **A2 — Owner + accessibility reviewer verify full narration, 12–14s word, cue timing/sounds and complete alternative; then authorize minimal implementation and validation.** | People using captions or alternative formats can understand the same migration guidance. | Converts an inaccessible/unverified concept demo into reviewed evidence without fabricated wording or stronger AI claims. | Inclusive onboarding, equivalent information and human approval of consequential product communication. |
| **A3 — Owner supplies missing facts; legal reviewer approves exact Privacy/Terms version and privacy-request process; authorize genuine routes/links and publication separately.** | Users understand who handles account/workspace data and how to request help or exercise applicable rights. | Replaces absent/placeholder disclosures with factual, reviewable operating boundaries. | Customer trust, data stewardship and cross-functional launch accountability. |
| **A4 — Account/data owner verifies A/B eligibility, distinct ownership and synthetic provenance; release owner approves final host/backend and safe acceptance scope; human signs in.** | Confirms session continuity and access to the correct user's workspace; avoids customer-data exposure. | Separates real hosted identity/isolation evidence from synthetic HTTP success. | Tenant boundaries, migration continuity, recovery and measurable activation readiness. |
| **A5 — Security owner disposes of the High build-tool advisory for the final candidate/build inputs.** | Reduces risk of interrupted or unreliable software delivery. | Documents runtime-versus-build exposure instead of laundering a clean image scan into a blanket security claim. | Risk prioritization, accountable exceptions and supply-chain release discipline. |
| **A6 — Backend/product risk owner triages approval replay; authorize separate API remediation and verification, or an explicit bounded exception if justified.** | Prevents duplicate approval/audit records from confusing what was authorized and when. | Protects integrity of human-control evidence; does not claim duplicate financial posting or a fix from this UX release. | Financial-workflow idempotency, trustworthy audit history and ownership across service boundaries. |
| **A7 — Engineering validates the final selected artifact using the change-triggered checks below, after content/risk decisions.** | Ensures accessible content and the tested mobile fix are actually present and working in the released build. | Links results to an exact new SHA/image/SBOM instead of relabelling baseline evidence. | Evidence-driven readiness, dependency management and minimizing unnecessary validation cost. |
| **A8 — Release owner authorizes exact final publication/preview and, only after gates pass, production promotion with rollback operator and triggers.** | Limits rollout disruption and provides recovery if sign-in or core navigation regresses. | Produces an auditable release decision and honest GO/NO-GO. | Controlled rollout, operational accountability and protecting existing customers. |

A4 owner preflight can happen independently now, using trusted existing records without opening unknown data. Hosted sign-in, cross-account probes and any deployment remain separately gated. A2/A3 review work can proceed in parallel with A5/A6 owner decisions. No Gemini/live-model work is a prerequisite being assigned to Track A.

## Risk disposition records

**A5: development-tool advisory — High, CVSS 8.7 (upstream).** `braces` 3.0.3 is affected by CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm; deeply nested patterns can exhaust the Node stack. The official advisory still lists no patched version at this closeout check. The committed lockfile marks braces, micromatch, fast-glob, @next/eslint-plugin-next and eslint-config-next as dev-only; none is inventoried as a runtime package in the retained image SBOM. Full audit has five propagated High entries, not five independent root flaws. Supply-chain/build availability exposure remains; no credential theft or runtime exploit is demonstrated. [Official advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

Recommended disposition: security owner selects a supported scoped remediation when available, or explicitly accepts a restricted trusted-input build risk for the **final** source/image and build process. No forced major downgrade or audit suppression. An exception, if chosen, must name reviewer, advisory, exact artifacts, trusted-input restriction, owner, expiry and remediation trigger; proposed expiry is the next rebuild or seven days, whichever comes first. Since the selected product fix creates a new image, an exception tied only to `f9c72c0` would not cover that rebuild. No exception is currently granted. See A5 for user/evidence/PM value.

**A6: approval replay — proposed P1 correctness/audit-integrity priority, pending backend-owner triage; no CVSS assigned.** The serving API's source can append a duplicate decision/audit record for an identical repeated invoice approval. The `e7f1e28` backend source has a 17-line guard against the repeated decision, but a web-only image does not deploy it. A network retry or repeated action can therefore make decision history misleading. This is not evidence of duplicate invoice posting, an ownership bypass or a financial authorization exploit.

Recommended disposition: backend owner validates reproduction using an approved synthetic fixture, then releases the idempotency guard through a separately authorized API change with exact-repeat, changed-comment, changed-contract, actor/role, rejection/reconsideration and audit/event-count regression coverage. Production data and live financial actions remain excluded. Until then require named owner approval for any narrowly justified synthetic/read-only release exception; do not quietly accept the defect because the API is unchanged. This UX checkpoint neither edits nor merges backend code. See A6 for user/evidence/PM value.

## A7 — exact validation triggers, not reruns today

| Change | Minimum required verification |
|---|---|
| Review documents/allowlist/evidence index only | Check selected paths, link/manifest integrity, uncertain-content labels and `git diff --check`. No image rebuild, frontend-suite rerun, native deployment or scan. |
| Include the unchanged tested CSS patch in a new source checkpoint | Confirm patch hash and base; replay the existing 30 direct/Guide/Demo fragment cases at 320/390/720/1023/1440 in Dark/Light on the final build. Compare four 1440×900 / 390×844 full-page captures. Reuse earlier results only as supporting evidence. |
| Add approved caption track / alternative | Extend existing HeroVideo tests for the reviewed track/description and single play control; verify served VTT MIME/cues manually against all 25 seconds, mobile controls, keyboard, Escape/focus return and no autoplay. Accessibility reviewer accepts narration/timing/sounds/essential visuals; axe is supplementary. |
| Add approved legal pages/footer links | Verify actual content/version, `/privacy` and `/terms` 200 without sign-in, minimal footer links, keyboard readability and truthful Help. Add focused route/footer assertions; do not mutate OAuth configuration as an implicit step. |
| Any final product change | Run focused commands below, TypeScript, ESLint, production Next build, local smoke and targeted browser checks. Build one web-only linux/amd64 image from an archive of the newly approved exact SHA, retaining source/tree, build-input hashes, build args (no secrets), image/config digest and archive hash. |
| New image or dependency/Dockerfile change | Generate runtime SBOM and scan that exact image with pinned scanner and verified current DB; zero Critical/High, explicitly review Medium/ignored findings; production and full npm audits distinguish build/runtime exposure. Reassess new findings rather than carrying forward a clean old scan. For dependency/runtime changes broaden impacted tests and native workload acceptance; if broad dependency effects remain uncertain run the full frontend suite once. |
| Final hosted candidate, separately authorized | Verify immutable registry/runtime identity, private/public access as approved, final route/media behavior and bounded native checks tied to the new image. Complete A4 own-account/refresh and separately approved isolation evidence. Old 90-request PASS cannot be relabelled for a new digest. |

From `apps/web`, focused baseline commands for the prospective product changes are:

```sh
npm test -- components/public-surfaces/HeroVideo.test.tsx components/public-surfaces/Guide.test.tsx components/public-surfaces/GuidedDemo.test.tsx components/public-surfaces/surfaces.test.tsx components/public-surfaces/public-content.test.tsx components/public-surfaces/landing-motion.test.tsx components/v2/ai-copy.test.ts test/public-routing.test.ts test/account-shell.test.tsx
npm run typecheck
npm run lint
npm run build
```

Add any newly introduced route tests to that exact focused invocation. Use the existing anchor harness logic, but supply the final local build URL and a fresh evidence output path: the historical script contains a machine-local output path and should not be blindly replayed. Similarly, the historical build script pins `e7f1e28`; parameterize/review a final-SHA local invocation rather than running it against mixed working-tree files. Run the preserved updated smoke script against the approved local URL. If the separate tooling proposal changes, validate its shell/YAML and run `.venv/bin/python -m pytest -q tests/test_web_release_scan_gate.py`; those nine synthetic checks do not substitute for a real image scan.

No full backend suite or Gemini evaluation is required for a web-only source change. API remediation has its own authorized contract/idempotency verification under A6. No cloud/native or GitHub check above is permission to execute it now.

## Evidence inventory, timing and final authorization

[v2-release-evidence-index.json](v2-release-evidence-index.json) identifies retained build/security/SBOM/native/cleanup/visual/anchor evidence by exact path, size and hash. Original evidence remains untouched. It distinguishes (1) exact `e7f1e28` image, (2) the previously tested base-plus-mobile-CSS local build, and (3) incomplete human-review materials. No new release image/SHA exists.

Approximately 90 minutes remain at 18:30 IST. Caption/legal/security/backend-owner decisions have unknown turnaround; A/B provenance is still unverified. Even with immediate approvals, allow roughly **45–90 minutes** for minimal content implementation and targeted local checks, **20–45 minutes** for final exact-image build/SBOM/scan (can overlap some local checks), and **75–105 minutes** for separately approved hosted setup and manual acceptance including the existing ≥65-minute observed refresh requirement. Safe isolation-environment work, dependency remediation or failures add time. These are planning estimates, not promised execution times. With immediate prerequisites, a clean path is roughly **2–4 hours**, making approximately 20:30–22:30 IST a best-case planning window, not a production commitment. Without reviewed content/provenance there is no dependable ETA.

**20:00 status: production NO-GO; review-ready engineering closeout is achievable and prepared.** Preserve existing production and rollback. Next authorization should name the final file inventory and permitted local implementation/checkpoint actions; later approvals must separately name the exact image, deployment/data scope, acceptance scope, production traffic operation and rollback owner. No deadline waiver, legal approval, security exception or hosted-isolation pass is inferred.

Fresh closeout validation at **18:30:49 IST**: 91 existing evidence checksum entries matched (39 container, 26 native-preview, 26 local UX); 330 source/workflow/test files unchanged; seven-path selection and local document links valid; index empty; HEAD unchanged; `git diff --check` passed. No application test suite, image build/scan or cloud operation was repeated. The machine-readable result is in the evidence index.

## Authorized local checkpoint validation — 20 October 2026

**Checkpoint preparation: PASS / READY for a separately authorized local commit. Production: NO-GO.** The seven-path selection remains unchanged. Each path was reviewed: one product stylesheet and six UX review/provenance documents. No Gemini/backend/PostgreSQL CI code, dependency changes, credentials or machine configuration are selected. Documentation references to those risks and local evidence locations are context, not changes to those systems. The secret-pattern review found no private keys, Google API-key literals, GitHub tokens or Google access-token literals in the seven files; this bounded check is not a universal secret-detection guarantee.

A fresh isolated local build used archived `e7f1e28` web source plus the exact selected CSS patch, SHA256 `793caf4e33e33d45215eec53a6cbd83443f45a49764d5d45a094478a8acdc971`. No repository source was edited. Installed dependencies were copied locally with the unchanged lockfile; no package installation occurred. Production Firebase **public build configuration** was reused in memory from the retained local build and omitted from logs. Browser non-loopback requests were blocked; no Google sign-in, API customer/workspace access, Gemini call or cloud operation occurred.

| Fresh validation | Result |
|---|---|
| Focused source tests | **162 passed / 9 files** |
| TypeScript / ESLint / Next production build | **PASS**, 25 routes |
| Responsive fragment navigation | **30/30 PASS** at 320/390/720/1023/1440, Dark/Light, direct/Guide/Demo |
| Accessibility/layout | **9 cases**, zero axe violations, no horizontal overflow; does not close captions or establish full WCAG compliance |
| Playback/keyboard/appearance/motion | 25.042s video plays on request; Escape pauses and restores focus; stored/live System theme and sticky CTA pass; zero reduced-motion animations |
| Four full-page comparisons | **Zero changed pixel channels** versus retained desktop/mobile Dark/Light evidence; desktop viewport 1440×900, mobile 390×844 at DPR 2 |
| Local GET-only smoke | **24 passed / 0 failed** |
| Browser errors | None recorded in this run |
| Production lockfile audit | **0 vulnerabilities**, fresh npm audit |
| Full lockfile audit | **5 High entries**, same development-tool advisory chain; gate remains OPEN, not a security PASS |

Execution corrections are retained in evidence: the first unit-test attempt incorrectly inherited Firebase build variables and failed seven tests; normal unit-test environment passed all 162 without source changes. The first standalone packaging attempt failed because an external dependency symlink escaped the temporary directory during tracing; a local copy of the same dependencies resolved packaging. A loopback socket required sandbox escalation. These were validation-harness issues, not silently suppressed application failures.

**No container was produced.** There is no new source commit or image digest because commits remain unauthorized. The validated artifact is explicitly a local base-plus-patch Next build. The prior 519-component runtime SBOM, clean Grype scan and native-memory PASS continue to describe only the prior immutable image. After the approved local checkpoint exists, a new exact-commit image/SBOM/scan can be prepared under the applicable authorization; new native/hosted acceptance would require separate deployment approval. No image PASS was transferred to the patch.

Fresh evidence is retained under `docs/v2/release/evidence/ux-production-2026-10-20/checkpoint-validation/`; the compact selected evidence index points to it. Raw screenshots/logs remain outside the seven-file selection.

### Outstanding-gate ownership, effort and acceptance

The Cup mapping below uses the repository's **internal** [Product Quality Judge rubric](../submission/product-quality-judge.md): Technical Merit & GenAI Implementation, Problem Alignment & Impact, and UX & Solution Design. It predicts no competition score and earns no live-GenAI or customer-impact credit. Intuit competencies are review lenses, not an official hiring rubric. Effort estimates exclude reviewer availability, infrastructure provisioning and remediation discoveries.

| Gate / why required | End-user benefit or safeguard | AI Builder Cup judging/evidence relevance | Intuit Senior Staff PM competency | Owner / remaining effort | Acceptance criteria |
|---|---|---|---|---|---|
| Captions + equivalent alternative: narration/essential visuals are not yet equally accessible | Equivalent understandable migration guidance | UX & Solution Design; accurate, reviewable demo presentation | Inclusive onboarding, quality bar, customer empathy | Owner + accessibility reviewer; roughly 30–60 min review and 30–60 min implementation/verification after wording is settled | Full approved transcript, uncertain word resolved, synchronized cues/sounds, reviewed essential visuals/alternative, keyboard/mobile acceptance; no blanket WCAG claim |
| Privacy/Terms: incomplete facts and no reviewed policies | Clear data boundaries, accountable request channel | Trustworthy Problem Alignment and UX; demonstrable operating limits | Data stewardship, legal partnership, launch accountability | Owner + legal reviewer; roughly 1–2h to assemble facts; legal turnaround unknown | Exact text/version approved, real operator/contact/retention/processors/rights facts, functioning genuine pages and links under separate publication authorization |
| Hosted authentication/isolation: A/B identities and synthetic workspaces unverified | Correct account/workspace, continuity and prevention of data leakage | Technical Merit evidence of actual identity boundaries; onboarding UX | Multi-tenant trust, activation, recovery and test design | Account/data owner + human signer + release engineer; 20–40 min preflight if records exist, then 75–105 min approved hosted session; safe-isolation setup unknown | Verified eligibility/distinct owners/synthetic provenance; exact host/image; sign-in, own reads, refresh and sign-out pass; separately scoped safe isolation evidence. Two successful own reads are insufficient |
| High build-tool advisory: build availability exposure remains despite runtime package absence | Reliable, controlled delivery | Technical Merit: transparent supply-chain limitations | Risk prioritization and accountable exception management | Security owner; 30–60 min disposition review; remediation time unknown | Supported remediation with affected checks, or signed final-artifact/build-scope exception with owner, restrictions and expiry; no automatic audit waiver |
| API replay: repeat approval can duplicate audit decisions | Trustworthy human approval history; no confusing repeat authorization | Technical Merit/control evidence; no claim of duplicate posting | Financial idempotency, audit integrity, cross-team ownership | Backend/product risk owner; 60–120 min triage/synthetic verification estimate, separate API release effort unknown | Owner-confirmed severity and scoped remedy/regression evidence, or explicit narrowly justified exception; UX checkpoint does not deploy the existing backend guard |
| Final committed image: local patched build has no immutable release identity | Shipped behavior matches what was tested | Reproducible artifact, matching SBOM/scan/native evidence | Release engineering, traceability and dependency management | Release owner + engineer; approval/local commit first, then roughly 20–45 min image build/scan, plus authorized hosted checks | Approved exact source SHA, new image/config digests, SBOM and successful fresh security gate; changed-image native/hosted evidence, not relabelled prior PASS |
| Production promotion and rollback authorization: release gates still open | Limits disruption and preserves recovery | Honest readiness decision; no unearned live-operation claim | Operational accountability and controlled rollout | Release owner/operator; 15–30 min preflight after all gates close, rollout window separately agreed | Recheck serving revisions/traffic and rollback image; approve exact final digest/revision, operations, monitoring/stop triggers and rollback operator before any write |

Rollback readiness is **recorded, not freshly re-executed**: last cloud verification at 17:53 IST preserved both services at 100% `r16e31e9-1041`; the recorded web rollback digest is `sha256:2ef8acd0db5f35a09faf70a9edc7818d3d563251bcbe121c925ccca79ae46d64`. Existing rollback runbooks and evidence remain intact. Neither this local run nor a checkpoint commit authorizes traffic restoration, cache operations or API release. Recheck live state immediately before any future approved cloud write.

**Smallest next approval:** authorize explicit staging of only the seven reviewed paths and **one local preparation checkpoint commit**, with no push, image publication, CI, deployment or promotion. This preserves the tested mobile fix and review packets without claiming those packets are approved product content. All seven outstanding gates above remain open as applicable. The 20:00 IST production deadline remains NO-GO; review/acceptance prerequisites still prevent a dependable release ETA.

## Final UX acceleration — current proposal, 20 October 2026

This section supersedes the historical seven-file selection above. The owner authorized local changes for inline video and local sign-in clarity, plus branding investigation. **No staging, commit, push, image publication, cloud write or production promotion occurred.** The current [explicit allowlist](v2-release-checkpoint-files.txt) contains **12 paths**: the original seven plus five source/test paths below. Evidence remains outside this proposed checkpoint except for the compact index.

| Current application selection | Change |
|---|---|
| `apps/web/app/v2-landing.css` | Preserve tested mobile fragment clearance; replace modal-only styles with an inline player confined to the existing media frame. Reserve the hidden play control's mobile space so playback does not collapse the frame. |
| `apps/web/components/public-surfaces/HeroVideo.tsx` | Explicit inline native playback, original photograph as poster, unchanged MP4, native sound/progress/fullscreen controls, Replay after completion, Restore photograph and Escape. Focus moves to the video after activation and back to the re-enabled play control after restoration. No new player dependency. |
| `apps/web/components/public-surfaces/HeroVideo.test.tsx` | Fragment/single-control regressions plus inline behavior, no autoplay, poster/source preservation, replay, rejected-play fallback, Escape/restore focus and no unapproved caption track. |
| `apps/web/components/IdentityProvider.tsx` | Explicit `NEXT_PUBLIC_LOCAL_UX_PREVIEW=true` build flag prevents Firebase provider initialization and popup invocation. Default/false retains the existing verified hosted identity flow. |
| `apps/web/components/IdentityEntry.tsx` | Local header Sign In link opens the local explanation; the page explains disabled Google sign-in and the synthetic/browser-local alternatives. |
| `apps/web/test/google-sign-in.test.tsx` | Existing hosted flow tests run with preview flag false; new regression proves no SDK preparation, popup or identity verification in preview mode. |

The six document paths remain `v2-release-closeout.md`, `v2-release-checkpoint-files.txt`, `v2-release-evidence-index.json`, `v2-track-a-media-review.md`, `v2-release-disclosure-drafts.md` and `v2-release-manual-auth-acceptance.md`, all under `docs/ux/`. Disclosure drafts remain unapproved and unserved. No branding asset, media byte, dependency/lockfile, AI-status rule, Gemini integration, backend, PostgreSQL workflow or machine configuration change is selected. Existing unrelated changes are preserved.

### Branding disposition

The exact owner-requested line already appears once beneath the brand: “Built on Google Cloud and powered by Gemini AI”. No approved local logo files were found. Google's [April 2026 customer co-branding guidance](https://services.google.com/fh/files/misc/external_customer_co_branding_eligibility.pdf), reviewed on 20 October, discourages inline branded assets and “powered by Gemini” attribution; it gives “Built with Google Gemini” as model attribution and distinguishes marketing from in-product use. General [product guidance](https://about.google/brand-resource-center/products-and-services/) does not establish approval for this requested lockup.

**Logos are deferred**, not invented or extracted from a screenshot. Owner-requested text and the AI-wording rule remain unchanged. Owner/brand reviewer must resolve the newly discovered guidance conflict before publication: obtain applicable permission or authorize compliant, capability-accurate attribution for the specific placement. A possible wording for review is “Built on Google Cloud · Built with Google Gemini”, only if the factual integration and placement support it. This is a proposal, not an approved string or claim that Track A makes live model calls. Logo omission alone is not a technical release blocker; unresolved wording/placement acceptance remains a publication decision.

### Source and artifact boundaries

The running review build is base `e7f1e288fd7f378045950fc94d5d7c89e298575f` plus the six selected web files, with an explicit local-preview flag and **no Firebase project/key/auth-domain values**. It uses the existing dependency installation and unchanged lockfile. The evidence index records the exact patch hash, file hashes and Next build ID. It is a local production-mode build, **not** a new immutable release commit or Linux container. The local flag must be omitted/false for a future hosted acceptance build, with only separately approved Firebase and same-origin API configuration.

The former `f9c72c0` image/SBOM/Grype/native-memory results remain intact and apply only to that older image. They do not certify inline video, local-preview changes or the resulting future hosted image. No new container was produced: final source/content/branding review and checkpoint approval remain prerequisites to freezing the release artifact. Once authorized source is fixed, produce a new exact-commit image, SBOM and scan; verify runtime composition and native/hosted behavior under separate deployment authorization. Do not relabel the old native PASS.

### Action-ready gates and ownership

The Cup relevance below uses the repository's internal judging rubric, not a prediction of official judging results. The PM column describes transferable competencies, not an official Intuit interview rubric. No live-GenAI credit or production/customer-impact evidence is inferred.

| Remaining step / owner / effort | Acceptance criterion and why required | End-user benefit or safeguard | AI Builder Cup evidence impact | Intuit Senior Staff PM competency |
|---|---|---|---|---|
| **Review inline video and local notice; approve 12-file local checkpoint** — owner; 10–20 min review | Personally accept four idle layouts plus inline playback and local sign-in behavior; explicitly authorize exact paths and one local commit. No push/deploy implied. | Predictable playback and clear local limitations without design drift | UX & Solution Design; reviewable working demonstration | Scope discipline, acceptance criteria, launch accountability |
| **Branding wording/placement review** — owner/brand reviewer; 15–30 min internal review, permission turnaround unknown | Resolve current official-guidance conflict; obtain applicable permission or approve compliant factual wording. Logos stay omitted until approved assets/usage exist. | Avoid misleading endorsement or live-capability signals | Honest product positioning and credible demo attribution | Partner governance, product truth and brand judgment |
| **Captions and equivalent media alternative** — owner + accessibility reviewer; 30–60 min review, 30–60 min implementation/checks afterward | Resolve uncertain narration around 12–14s; approve all speech, cue timing, meaningful sounds and essential visual information. Implement and manually accept reviewed track/alternative. Current player has no caption track. | Equal access to narration and migration concepts | UX/accessibility evidence; no unsupported WCAG claim | Inclusive onboarding and measurable quality standards |
| **Privacy and Terms** — owner + legal reviewer; 1–2h fact gathering, legal turnaround unknown | Approve exact text/version, operator/contact, processors, retention/deletion and real data handling; separately authorize genuine routes/links/publication. Existing drafts are not policies. | Informed consent and accountable data expectations | Trustworthy boundaries and Problem Alignment | Privacy stewardship, legal partnership and operating readiness |
| **Accounts A/B and hosted isolation** — account/data owner + human signer + engineer; 20–40 min provenance preflight, then 75–105 min authorized acceptance, environment setup extra | Confirm Google eligibility, distinct workspace ownership and synthetic-only provenance first; then exact-image own reads, continuity/refresh, safe logout and expressly approved cross-account denial. Both accounts remain UNVERIFIED. | Correct identity, continuity and tenant data protection | Technical Merit from actual boundary evidence, not mocked tests | Multi-tenant trust, financial onboarding and adversarial acceptance design |
| **High development-tool advisory** — security owner; 30–60 min disposition, remediation unknown | Supported fix or signed final-source/build-input exception with trusted-input restriction, reviewer, expiry and trigger. Current fresh audit: 5 propagated High entries from one root advisory; no exception accepted. | Reliable delivery without hiding build-time exposure | Transparent supply-chain evidence | Risk prioritization and accountable exceptions |
| **API approval replay** — backend/product risk owner; 60–120 min bounded synthetic triage, separate release unknown | Confirm proposed P1 correctness/audit-integrity severity and mitigation, release guard separately with idempotency regressions or explicitly accept a narrowly scoped exception. UX image cannot deploy the backend guard. | Prevent confusing duplicate approval/audit history; no claim of duplicate financial posting | Trustworthy human-control evidence | Financial integrity, auditability and cross-service ownership |
| **Final image, native/hosted acceptance, release/rollback** — release owner + engineer; 20–45 min build/scan plus authorized hosted window and 15–30 min preflight | Approved exact source SHA; flag-free hosted image; matching digest/SBOM/security evidence; freshly checked service ownership/collisions; accepted security/accessibility/auth gates; explicit traffic approval with rollback owner. | Ship the tested behavior and recover safely | Reproducible evidence and honest readiness | Release engineering, staged rollout and operational accountability |

The High advisory remains [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), upstream CVSS 8.7. The official advisory reviewed today still lists no patched version for braces ≤3.0.3. It can terminate a tooling Node process through deeply nested patterns. The unchanged dev-only chain is absent from the retained baseline runtime SBOM; the final new image must independently establish runtime composition. No automatic downgrade, audit suppression or waiver is proposed. The existing replay risk disposition above is unchanged; no backend/Gemini modifications were made.

### Minimum safe hosted/release procedure — not executed

1. Freeze reviewed source/content; obtain checkpoint approval, then build and scan that exact commit. Omit the local-preview flag. Owner approves the exact immutable image, safe API/data environment, deployment identity, ingress, service/tag name, spend/request limits and cleanup window. Do not assume the previous memory-preview authorization covers authentication or a new image.
2. Immediately before any separately approved cloud write, read serving revisions/traffic, service ownership/configuration, recent operations and target availability; refresh the Gemini collision assessment from available evidence. Production was last verified at 100% `r16e31e9-1041` at 17:53 IST; this local session did not reverify cloud state. An unknown owner or collision stops the operation.
3. Do not attach an isolated preview to production API/database data. A/B account/provenance verification precedes human sign-in. If a safe authorized backend is unavailable, hosted acceptance remains BLOCKED. Use the manual handoff for identity, own-data reads, observed token refresh, logout and separately scoped synthetic denial probes. No real financial actions.
4. After all mandatory gates pass, issue the exact production approval request naming the immutable digest, accepted revision, config diff, traffic operation, monitoring/stop criteria and rollback operator. The existing runbooks remain the source for service-specific deployment details. Templates below are **not executable authorization**; populate only after verifying the preceding conditions.

```sh
# Read-only preflight; no commands in this block were executed by this local task.
gcloud run services describe movebooks-beta-web --project=movebooks-ai --region=asia-southeast1 --format=json
gcloud run services describe movebooks-beta-api --project=movebooks-ai --region=asia-southeast1 --format=json

# Separately approved release preparation only: creates a revision on the existing web service.
# Retain reviewed runtime/service configuration; reject any unexpected configuration drift.
gcloud run deploy movebooks-beta-web --project=movebooks-ai --region=asia-southeast1 \
  --image="${FINAL_IMAGE:?approved immutable registry digest required}" \
  --no-traffic --tag="${APPROVED_TAG:?approved nonconflicting tag required}"

# Separate promotion approval only, after accepted revision and all mandatory gates.
gcloud run services update-traffic movebooks-beta-web --project=movebooks-ai --region=asia-southeast1 \
  --to-revisions="${ACCEPTED_REVISION:?accepted exact revision required}=100"

# Separately approved rollback operation, only after verifying this exact revision still exists.
gcloud run services update-traffic movebooks-beta-web --project=movebooks-ai --region=asia-southeast1 \
  --to-revisions=movebooks-beta-web-r16e31e9-1041=100
```

The recorded web rollback digest is `sha256:2ef8acd0db5f35a09faf70a9edc7818d3d563251bcbe121c925ccca79ae46d64`. Preserve that artifact/revision and production API traffic. Stop or roll back under approved authority for unexpected authentication failures, cross-account exposure, OOM/5xx regression, broken core navigation or financial integrity issues; do not automatically raise memory or change APIs. No concrete hosted candidate URL/revision can be promised before its environment and deployment are authorized.

**20:00 IST production status: NO-GO.** Local review is ready subject to the final validation record below. Human/legal/brand/security turnarounds are unknown. After all decisions and environment prerequisites, allow approximately 2–4 hours for minimal content implementation, exact-image checks and the required hosted refresh/acceptance window; discoveries add time. This is not a release commitment. The smallest next action is owner review of the running preview, followed by explicit permission for the exact 12-file local preparation checkpoint. That commit would preserve review packets, not publish or approve them.


### Final acceleration validation — fresh results

**211 tests passed across 13 focused files; TypeScript, ESLint and the production-mode local build passed.** Final build ID: `NJIXhwzHriW2tFDEvlulT`; exact six-file source patch SHA256: `646214eb13a7d31b9139fe19090b75d1ed4dd3b1069440bb51621f56cf9127dd`. Base commit remains `e7f1e288fd7f378045950fc94d5d7c89e298575f`; no new source commit or image exists.

- **30/30** direct/Guide/Demo fragment cases passed across 320/390/720/1023/1440 widths and Dark/Light.
- **Nine idle accessibility/layout cases and four active-player cases:** zero axe violations or page overflow. Captions are absent; this is not full WCAG acceptance.
- Four inline player cases passed explicit keyboard start, pause/resume, actual ended state, replay, photograph restoration, Escape and focus restoration. Mobile playback retains its original media-frame height and the restore button fits inside the frame. Additional desktop and emulated-touch checks passed native media seeking, mute/volume and explicitly requested fullscreen API entry/exit. Real-device Safari/assistive-technology media acceptance remains pending.
- **24/24** GET-only smoke checks passed. Explore Demo completed all five phases; Try Your Data validated the repository's synthetic template and cleared it without external or write requests. Local sign-in showed the explicit disabled-preview notice without Firebase initialization or popup. No browser errors were recorded.
- All four 1440×900 / 390×844 idle captures are **pixel-identical** to the retained latest candidate. The inline playing state and local sign-in notice are intentional changes. Hero, MP4 and original poster bytes match prior hashes; no dependency/lockfile or attribution text changed.
- Fresh production dependency audit: **0** vulnerabilities. Full audit: **5 propagated High entries**, same one-root development advisory, explicitly OPEN. No new image scan or native-memory PASS is claimed.
- Twelve-path scope reviewed, pre-existing unrelated changes preserved, Git index empty, HEAD unchanged and `git diff --check` passed. No cloud operation occurred.

During validation the initial mobile player frame collapsed when the original play control was removed from layout; preserving that control's space fixed it. A subsequent reduced-motion keyboard sequence exposed delayed visibility restoration: the global 0.01ms transition duration applied to visibility, so focus could run while the re-enabled button was still hidden. A temporary browser diagnostic proved that disabling transitions on `.lp-play` resolves this; the source correction was then rebuilt and the entire focused browser sequence passed without injected styles. Post-commit focus handling and replay focus are also covered. Failed intermediate checks were not counted as passes; initial artifacts and execution notes are retained.

Final evidence, scripts, screenshots and the side-by-side gallery are under `docs/v2/release/evidence/ux-production-2026-10-20/acceleration/`, indexed with hashes. The preview remains running at **http://127.0.0.1:3117/** for owner review. **Local preparation READY for owner review; production NO-GO.**

## Final branding and functional acceptance update — 20 October, after 20:00 IST

The [final acceptance report](v2-final-acceptance.md) supersedes the earlier 12-file checkpoint summary: **13 proposed paths**, with one new compact report. Only HeroVideo and its regression test changed in application source this turn (recoverable playback failures). Current build is `e7f1e28` + patch `adeef2d84c2e5baaa1d0087c59c987d926ec501b201854a45d224ec0636ea68f`, build `z8GVOKz0YfQnLPLMylsiK`, local preview **http://127.0.0.1:3118/**. Port 3117 remains the preserved previous build. No new commit/image, staging or cloud operation.

Fresh: 213 focused tests, TypeScript, ESLint, production build, zero production npm audit findings; 30 fragments; four idle/restored pixel comparisons; 25 axe scans with zero violations; synthetic public flows and video failure recovery. All requested test IDs and limitations are in the report. Two logo options are browser-only mockups pending owner selection. Current Google customer guidance raises a new explicit provider-wording/in-product placement gate; the fixed-copy rule was not changed. Captions, legal, hosted A/B, advisory/replay dispositions, real-device/AT acceptance and final-image evidence remain open. The 20:00 target was not a production release. Production **NO-GO**.
