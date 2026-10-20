# MoveBooks AI V2 — final local acceptance report

**Historical evidence — superseded for current scope and acceptance.** The [owner-locked scope and acceptance matrix](v2-owner-scope-acceptance.md) is authoritative. In particular, BR-06/BR-07 PASS labels below apply only to the earlier text-only requirement and do not satisfy the mandatory Google Cloud/Gemini graphical logos and exact combined attribution. The current requirements are now implemented and locally verified with owner-directed positioning: **BRANDING FROZEN**. Public-use authorization and the other release gates remain open; see the current matrix and [final report](v2-provider-branding-local-review.md). Historical test results and decisions below are preserved unchanged.

## A. Implementation and source identity

Updated preview: **http://127.0.0.1:3118/**. Previous reviewed preview **http://127.0.0.1:3117/** is preserved and still running; it does not include the new error feedback. Both are disconnected local visual builds with explicit `NEXT_PUBLIC_LOCAL_UX_PREVIEW=true`, no Firebase public project/key/auth-domain configuration, no private API origin, no database and no live Gemini calls. Explore Demo uses authored synthetic data; Try Your Data uses browser-local checks. Hosted sign-in is not demonstrated.

Branch `feature/v2-landing-final`; unchanged HEAD `e7f1e288fd7f378045950fc94d5d7c89e298575f`. This build is that exact web source plus the six selected web-file diff, SHA256 **`adeef2d84c2e5baaa1d0087c59c987d926ec501b201854a45d224ec0636ea68f`**. Local Next build ID **`z8GVOKz0YfQnLPLMylsiK`**. Source hashes and environment boundaries: [validation.json](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/validation.json). This is **not a new commit or container digest**. No dependency/package-lock/hero/MP4/provider-copy change.

This turn changed two application files:

- `apps/web/components/public-surfaces/HeroVideo.tsx`: replace silently swallowed playback errors with an announced recovery message, the existing photograph, and focus on Restore photograph. Restore resets; another explicit Play retries the unchanged source. Handle media/source failures and ignore a late rejected promise from an older attempt. Successful idle/play/pause/replay/restore behavior remains unchanged.
- `apps/web/components/public-surfaces/HeroVideo.test.tsx`: two regression cases for rejected playback, visible fallback, clean retry, source failure and stale asynchronous rejection. Existing completion/replay test now exercises successful playback independently of failure.

Documentation changes in this turn: this report, `v2-release-closeout.md`, `v2-release-checkpoint-files.txt`, `v2-release-evidence-index.json`, and the manual accessibility procedure appended to `v2-track-a-media-review.md`. The proposed checkpoint expands from 12 to **13 paths** only to include this compact acceptance report. No automatic staging. Existing uncommitted workflow/smoke changes, `.claude`, backend/Gemini work and raw evidence remain excluded and preserved.

### Branding decision — no identity installed

The existing product asset is `BrandMark` in `Nav.tsx`: a custom inline open-book SVG plus the MoveBooks AI text. The root layout shares it across application surfaces. No separately approved vector master, favicon or app icon was found. Public WebP assets are the approved desk photograph and historical film poster; neither is a product logo master. `docs/assets` product-overview SVG/PNG are conceptual diagrams. The approved screenshot contains an angular book/ledger motif, but a raster reference does not establish a supplied vector master.

[Two options in the actual desktop/mobile Dark/Light header](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/branding-options/gallery.html): **A** formalizes the existing open book with no header change; **B** offers a restrained ledger-book refinement grounded in the same approved motif. B is recommended for owner review because it addresses distinctiveness without changing color, wordmark or layout. Neither is shipped. Both retain the named home link and decorative SVG semantics. A favicon must be derived only after selection and checked at 16/32px. Brand option B is a review-only browser DOM substitution; it is not included in the source patch/build or pixel-parity results.

### Provider wording — compliance is not passed

Google Cloud's [April 2026 customer guidance](https://services.google.com/fh/files/misc/external_customer_co_branding_eligibility.pdf), pp.5–7, permits factual marketing text; lists “Built on Google Cloud”; discourages powered-by wording, including Gemini; and excludes in-product attribution from that marketing permission. Current shared-header copy therefore needs owner review. General [Google guidance](https://about.google/brand-resource-center/guidance/) also prohibits implying endorsement. No provider logo was added or approved; the detailed Gemini partner page requires an approved login.

**Proposed correction, not implemented:** use “Built on Google Cloud” on the public marketing landing page; omit the unverified Gemini-powered assertion. Consider “Built with Google Gemini” only with evidence supporting the actual use and applicable permission. Resolve in-product placement separately before retaining provider attribution in the shared authenticated header. This requires an explicit owner amendment to the existing fixed-copy exception in `docs/v2/phase1/ai-status-rule.md` and its tests. That rule and `AI_ASSISTANCE_STATUS` remain unchanged. Branding approval is never evidence of live inference.

### Video findings and interaction rationale

Idle and the actual native poster use the approved laptop/coffee photograph. The neon illustration is encoded in the original 25.042-second MP4, not a substituted idle hero or injected decorative overlay. The historical neon poster file still exists, but the video element uses the photograph as its poster. At completion the last film frame remains, with Replay and Restore photograph. Replay resets/restarts; Restore pauses/resets/hides playback and returns keyboard focus to Play. Pause/resume preserves progress.

Keep the current controls: native controls during playback plus one Restore action; explicit Replay appears only at completion. Removing Replay now would reduce keyboard discoverability across native implementations; merging two different actions into an ambiguous toggle is not recommended. No new player dependency, menu, modal or automatic fullscreen. Error recovery adds no extra button; Restore then Play is the safe retry path.

## B. Test matrix

Fresh: **213 tests / 13 files PASS**, TypeScript PASS, ESLint PASS, production web build PASS; fresh npm production audit **0 findings**. Thirty fragment cases PASS. Public synthetic demo and browser-local file validation PASS. Nine idle/reflow + four active-player axe scans, plus twelve idle/playing/error state scans: **25 scans, zero violations**. This does not establish full WCAG conformity. Current scopes and limitations are recorded for every requested ID below.

An initial test harness wrongly applied Firebase preview build flags to tests that assume their normal environment (7 failures). It was corrected without changing product behavior; final 213 tests pass. A browser harness initially matched Next's empty route announcer as well as the video alert; the selector was narrowed and all checks completed. Intermediate logs are retained; neither failure was waived.

Evidence names below resolve under [final-acceptance](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/gallery.html), except explicitly named prior evidence or repository documents. [Machine-readable matrix](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/test-matrix.json).

| ID | Test | Result | Evidence / scope | Defect / limitation |
|---|---|---|---|---|
| BR-01 | Product logo on desktop | **BLOCKED** | branding-options/gallery.html; qa/qa-report.json: current mark renders without overflow in both themes. | Owner selection pending; no approved standalone logo master. Review-only alternatives are not shipped. |
| BR-02 | Product logo on mobile | **BLOCKED** | branding-options/gallery.html; qa/qa-report.json: current mark renders without overflow in both themes. | Owner selection pending; no approved standalone logo master. Review-only alternatives are not shipped. |
| BR-03 | Dark theme branding | **BLOCKED** | branding-options/gallery.html; qa/qa-report.json: current mark renders without overflow in both themes. | Owner selection pending; no approved standalone logo master. Review-only alternatives are not shipped. |
| BR-04 | Light theme branding | **BLOCKED** | branding-options/gallery.html; qa/qa-report.json: current mark renders without overflow in both themes. | Owner selection pending; no approved standalone logo master. Review-only alternatives are not shipped. |
| BR-05 | Browser favicon | **BLOCKED** | app/layout.tsx + public asset inventory: no product favicon. | Minor branding completeness; needs approved product icon. |
| BR-06 | Provider attribution | **FAIL** | Google Cloud April 2026 guidance pp.5–7; components/v2/Attribution.tsx and its passing existing-copy regression. | Major release messaging/compliance concern: powered-by wording and shared in-product placement not supported by reviewed guidance. One plain-text line, but copy compliance not passed. |
| BR-07 | Provider-logo compliance | **PASS** | Attribution.test.tsx; header screenshots: no Google/Gemini logo. | Provider-logo permission remains pending; none introduced. |
| BR-08 | Header responsiveness | **PASS** | qa/qa-report.json: nine layouts; anchor-check.json: widths 320–1440. | None observed within stated scope |
| HR-01 | Idle hero render | **PASS** | browser.json: four idle baseline comparisons, zero changed channels; screenshots; owner final acceptance still pending. | None observed within stated scope |
| HR-02 | Hero desktop crop | **PASS** | browser.json: four idle baseline comparisons, zero changed channels; screenshots; owner final acceptance still pending. | None observed within stated scope |
| HR-03 | Hero mobile crop | **PASS** | browser.json: four idle baseline comparisons, zero changed channels; screenshots; owner final acceptance still pending. | None observed within stated scope |
| HR-04 | Primary CTA | **PASS** | public-flows.json: all five demo stages; synthetic browser-template consent/validate/clear; no external requests or writes. | None observed within stated scope |
| HR-05 | Secondary CTA | **PASS** | public-flows.json: all five demo stages; synthetic browser-template consent/validate/clear; no external requests or writes. | None observed within stated scope |
| HR-06 | Video placement | **PASS** | browser.json: fixed media-frame dimensions before/after; qa/qa-report.json; position.json activation delta 0. | None observed within stated scope |
| VD-01 | Play video | **PASS** | browser.json: four theme/device cases; natural 25.042s completion, pause/resume, replay, restore; position.json. | None observed within stated scope |
| VD-02 | Video modal behavior | **PASS** | browser.json: four theme/device cases; natural 25.042s completion, pause/resume, replay, restore; position.json. | None observed within stated scope |
| VD-03 | Pause | **PASS** | browser.json: four theme/device cases; natural 25.042s completion, pause/resume, replay, restore; position.json. | None observed within stated scope |
| VD-04 | Resume | **PASS** | browser.json: four theme/device cases; natural 25.042s completion, pause/resume, replay, restore; position.json. | None observed within stated scope |
| VD-05 | Replay | **PASS** | browser.json: four theme/device cases; natural 25.042s completion, pause/resume, replay, restore; position.json. | None observed within stated scope |
| VD-06 | Restore photograph | **PASS** | browser.json: four theme/device cases; natural 25.042s completion, pause/resume, replay, restore; position.json. | None observed within stated scope |
| VD-07 | End-of-video | **PASS** | browser.json: four theme/device cases; natural 25.042s completion, pause/resume, replay, restore; position.json. | None observed within stated scope |
| VD-08 | Playback error | **PASS** | browser.json: local MP4 HTTP 503 → photograph + alert → focused Restore → retry succeeds; HeroVideo.test.tsx rejection/stale-attempt tests. | Previously missing feedback: Major recovery gap fixed locally; no release claim until final artifact checks. |
| VD-09 | Mobile Safari | **NOT RUN** | Chromium desktop + mobile touch emulation passed; no real iOS Safari/Android Chrome session available. | Real-device policy/control acceptance open; emulation is not device proof. |
| VD-10 | Mobile Chrome | **NOT RUN** | Chromium desktop + mobile touch emulation passed; no real iOS Safari/Android Chrome session available. | Real-device policy/control acceptance open; emulation is not device proof. |
| VD-11 | Keyboard activation | **PASS** | browser.json, qa/qa-report.json: Enter/Space, native pause/resume and visible controls, Escape/Restore focus; prior acceleration/media-controls.json for seek/sound/fullscreen API. | Scope: Chromium. Native controls differ by browser; screen-reader/device checks remain open. |
| VD-12 | Keyboard focus | **PASS** | browser.json, qa/qa-report.json: Enter/Space, native pause/resume and visible controls, Escape/Restore focus; prior acceleration/media-controls.json for seek/sound/fullscreen API. | Scope: Chromium. Native controls differ by browser; screen-reader/device checks remain open. |
| VD-13 | Native media controls | **PASS** | browser.json, qa/qa-report.json: Enter/Space, native pause/resume and visible controls, Escape/Restore focus; prior acceleration/media-controls.json for seek/sound/fullscreen API. | Scope: Chromium. Native controls differ by browser; screen-reader/device checks remain open. |
| VD-14 | Captions toggle | **BLOCKED** | v2-track-a-media-review.md; no served track. | Captions are intentionally unpublished until human review. |
| VD-15 | Captions unavailable | **PASS** | browser.json/qa/qa-report.json: honest captions-pending notice; no track; reduced-motion phase animations=0; no autoplay. | None observed within stated scope |
| VD-16 | Reduced motion | **PASS** | browser.json/qa/qa-report.json: honest captions-pending notice; no track; reduced-motion phase animations=0; no autoplay. | None observed within stated scope |
| VD-17 | Repeated playback | **PASS** | browser.json: three additional play/restore cycles per layout; exactly one video; no page errors. | Bounded symptom check only; not a long-duration heap/leak certification. |
| AU-01 | Local Sign-In | **PASS** | qa/qa-report.json localIdentity; google-sign-in.test.tsx; IdentityProvider.tsx explicit flag; validation.json clean build configuration. | Local preview only; no Firebase config, popup or external requests. Does not certify hosted auth. |
| AU-02 | Local Firebase safety | **PASS** | qa/qa-report.json localIdentity; google-sign-in.test.tsx; IdentityProvider.tsx explicit flag; validation.json clean build configuration. | Local preview only; no Firebase config, popup or external requests. Does not certify hosted auth. |
| AU-03 | Explore Demo without login | **PASS** | public-flows.json; authored synthetic fixtures only. | None observed within stated scope |
| AU-04 | Try Your Data | **PASS** | public-flows.json; authored synthetic fixtures only. | None observed within stated scope |
| AU-05 | Hosted login | **BLOCKED** | v2-release-manual-auth-acceptance.md: A/B UNVERIFIED; no exact authenticated host approved. | Needs verified eligibility/owners/synthetic provenance, authorized candidate and human sign-in. No foreign-owner production probes. |
| AU-06 | Session refresh | **BLOCKED** | v2-release-manual-auth-acceptance.md: A/B UNVERIFIED; no exact authenticated host approved. | Needs verified eligibility/owners/synthetic provenance, authorized candidate and human sign-in. No foreign-owner production probes. |
| AU-07 | Account A/B isolation | **BLOCKED** | v2-release-manual-auth-acceptance.md: A/B UNVERIFIED; no exact authenticated host approved. | Needs verified eligibility/owners/synthetic provenance, authorized candidate and human sign-in. No foreign-owner production probes. |
| NV-01 | Five migration phases | **PASS** | public-flows.json; qa/qa-report.json journey; landing-motion.test.tsx. | None observed within stated scope |
| NV-02 | Anchor navigation | **PASS** | anchor-check.json: 30/30 direct/Guide/Demo cases at 320/390/720/1023/1440 in Dark/Light. | None observed within stated scope |
| NV-03 | Mobile fragment clearance | **PASS** | anchor-check.json: 30/30 direct/Guide/Demo cases at 320/390/720/1023/1440 in Dark/Light. | None observed within stated scope |
| NV-04 | Dark/Light/System toggle | **PASS** | qa/qa-report.json appearance: selection, persistence, System follows emulated OS, Escape focus. | None observed within stated scope |
| NV-05 | Three Questions | **PASS** | qa/qa-report.json links/layout/axe; screenshots; public-content.test.tsx. | None observed within stated scope |
| NV-06 | Trust & Security | **PASS** | qa/qa-report.json links/layout/axe; screenshots; public-content.test.tsx. | None observed within stated scope |
| NV-07 | Mobile header | **PASS** | qa/qa-report.json links/layout/axe; screenshots; public-content.test.tsx. | None observed within stated scope |
| NV-08 | Browser back/forward | **PASS** | navigation.json: landing → demo → back → forward. | Public navigation only; authenticated history clearing remains blocked. |
| AC-01 | Automated axe checks | **PASS** | browser.json: 12 state/theme axe scans; qa/qa-report.json: nine idle/reflow and four player scans; zero violations. | Automated scoped result; no full WCAG certification. |
| AC-02 | Contrast | **PASS** | Same 25 axe scans including applicable automated text contrast. | Not exhaustive manual contrast verification of every native control or encoded video frame. |
| AC-03 | Keyboard-only navigation | **BLOCKED** | Chromium keyboard controls/menu/appearance/restore passed; manual procedure in media-review handoff. | Complete keyboard + screen-reader + real-device acceptance remains pending. |
| AC-04 | Screen-reader labels | **PASS** | HeroVideo tests + browser/qa focus and axe; named Play/video/Restore and role=alert. | Meaningful DOM names/focus verified; actual assistive-technology speech not tested. |
| AC-05 | Focus visibility | **PASS** | HeroVideo tests + browser/qa focus and axe; named Play/video/Restore and role=alert. | Meaningful DOM names/focus verified; actual assistive-technology speech not tested. |
| AC-06 | Mobile zoom | **NOT RUN** | qa/qa-report.json: 720×450 CSS viewport reflow equivalent passed; 390 mobile layout passed. | Physical mobile pinch/text zoom not executed; do not equate reflow emulation with device acceptance. |
| AC-07 | Caption accuracy | **BLOCKED** | v2-track-a-media-review.md: full proposed transcript, uncertain word, cue intervals, visual supplement, approval record. | Major accessibility blocker: wording/timing/sounds/equivalent alternative unapproved; no publication. |
| AC-08 | Media alternative | **BLOCKED** | v2-track-a-media-review.md: full proposed transcript, uncertain word, cue intervals, visual supplement, approval record. | Major accessibility blocker: wording/timing/sounds/equivalent alternative unapproved; no publication. |
| AC-09 | Layout stability | **PASS** | browser.json frame heights fixed in four cases; position.json activation scroll delta zero; idle/restored pixel equality. | Bounded interaction result, not a production field CLS measurement. |
| SC-01 | Production dependency audit | **PASS** | npm-audit-production.json: fresh production audit zero; security.json unchanged lock. | Production npm graph only; does not replace final-image scan. |
| SC-02 | Development advisory | **BLOCKED** | Existing acceleration/npm-audit-all.json: five propagated High entries; official GHSA rechecked 20 Oct. | High braces advisory remains open. No patched version listed; no owner exception. |
| SC-03 | Secret exposure | **PASS** | security.json: 50 emitted browser-JS/patch files checked, zero high-confidence token/key patterns; clean environment allowlist. | Bounded pattern scan, not exhaustive secret detection; no credentials collected/logged. |
| SC-04 | Source separation | **PASS** | selected-source.patch, validation.json six web source hashes, scope verification. | No Gemini/backend/CI selected; no independent-thread interaction. |
| SC-05 | New image SBOM | **BLOCKED** | validation.json exact base + uncommitted patch + local Next build; no new container. | Final commit authorization, exact-image build/SBOM/scan/startup and applicable native acceptance still required. Old image PASS does not certify this artifact. |
| SC-06 | Container vulnerability scan | **BLOCKED** | validation.json exact base + uncommitted patch + local Next build; no new container. | Final commit authorization, exact-image build/SBOM/scan/startup and applicable native acceptance still required. Old image PASS does not certify this artifact. |
| SC-07 | Image provenance | **BLOCKED** | validation.json exact base + uncommitted patch + local Next build; no new container. | Final commit authorization, exact-image build/SBOM/scan/startup and applicable native acceptance still required. Old image PASS does not certify this artifact. |
| SC-08 | Rollback readiness | **BLOCKED** | Retained stage2 cleanup/production verification and release-closeout rollback plan. | Rollback baseline preserved; live serving digest/traffic/configuration must be rechecked immediately before separately authorized promotion. No fresh cloud call. |

## C. Visual acceptance

[Comparison gallery](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/gallery.html) contains the four idle references/current views, four playing states, completed/restored states in both layouts/themes, and four new error states. Desktop viewport 1440×900; mobile 390×844 with touch emulation. Full-page captures. New header options are explicitly separate mockups.

| Difference | Classification | Evidence / decision |
|---|---|---|
| Four idle states versus retained validated acceleration reference | **None** | Zero changed pixel channels in every case; this reference was itself compared with the retained gate-closure baseline. Original owner screenshot remains a design reference, not an asserted pixel match. |
| Idle versus restored, four themes/layouts | **None** | Zero pixel differences after focus and scroll settle. |
| Playing/completed neon frames versus photograph | **Intentional** | Original unchanged film; earlier owner-approved inline behavior. No pixel-identity claim for video frames. |
| Error photograph/message/Restore focus | **Intentional** | Minimal recovery implementation authorized by this request; local HTTP 503 failure and subsequent recovery tested. |
| Logo B | **Proposed, not an implementation difference** | Owner approval required; actual application still uses current mark A. |
| Provider wording | **Major release decision, not a new visual regression** | Reviewed customer guidance conflicts with current wording/shared placement; approval required before correction. |

No Critical/Major **visual regression** observed in the tested application states. No horizontal overflow across tested layouts, no media-frame height change, and activation scroll delta is zero after keyboard focus reaches Play. Mobile first focuses the below-fold Play control normally; that navigation scroll is not a player-induced jump. Real-device rendering and assistive-technology acceptance remain outstanding. Final owner visual approval has not been invented.

## D. Release readiness, risk and approval boundary

Local preparation is reviewable; the **final release checkpoint is not ready for final release acceptance**. The current 13-path selection is a proposal only. Do not stage or commit until the owner chooses branding/provider direction and explicitly authorizes the resulting inventory. Assets, workflow tooling, backend changes and binary evidence are not added to the selection.

The earlier image `sha256:f9c72c0bbc66497920357f7a37ab79c4ad25c3c421bf063a9d03706cf80e2e63` remains a historical PASS only for source `e7f1e28`: zero Critical/High/Medium, 519-component SBOM, bounded native 256 MiB/1 CPU/concurrency 8, 90/90 HTTP checks, p95 465 ms, sampled peak 140.74 MiB and cleanup evidence preserved. It does **not** contain current inline/error/preview changes. No new image was built, published or scanned this turn.

The High development finding remains [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), upstream CVSS 8.7, braces ≤3.0.3; no patched version listed at this review. Nested patterns can terminate a tooling Node process. The unchanged dev-only chain produced five propagated High audit entries in the retained full audit; production npm audit is freshly clean. Earlier runtime SBOM absence does not certify a future image. Security owner must approve a supported fix or an artifact/build-scoped trusted-input exception with owner, expiry and remediation trigger. No waiver is granted.

API approval replay remains proposed **P1 correctness/audit-integrity** pending backend owner triage: prior source assessment identified duplicate decision/audit records on repeated identical approval. No evidence here establishes duplicate financial posting or cross-account access. Existing backend guard is not deployed by a web-only release. Owner must separately approve remedy and synthetic idempotency tests, or a bounded justified exception. No backend inspection mutation or new live repro occurred in this turn.

Production/rollback: no cloud operations this turn. Retained last verification was 100% `r16e31e9-1041` with preview cleanup completed. Preserve that rollback target and its prior configuration/digest record; recheck live service/traffic/IAM/digest/collision immediately before any separately approved write. Do not label that old observation a fresh production check.

After content/brand decisions: run impacted source tests, TypeScript/ESLint and build, repeat affected four-state screenshot/axe/fragment checks. After separate commit approval, bind the source SHA and **hosted** build variables (omit local-preview flag) to a new web-only image; generate its immutable digest/SBOM, scan with a current database, audit production and build graphs, verify startup and applicable native memory. Any hosted/native deployment requires a new explicit approval and isolated bounded plan. Then run human Google sign-in and independently authorized synthetic A/B acceptance; only afterward request promotion with verified rollback.

**Smallest next approval:** select product-logo A or B and approve the provider-copy/placement correction scope (including amendment of the existing fixed-copy exception). This authorizes neither commit nor deployment. Human caption/legal/device/account/risk approvals remain separate.

**ETA:** local checks and proposal are complete. The 20:00 IST target has passed with production NO-GO. Allow roughly 30–60 minutes for a selected logo/provider implementation and focused revalidation after explicit decisions; caption implementation/verification roughly 45–90 minutes after verified text/timing; device/accessibility review roughly 30–60 minutes. Final build/security work and hosted acceptance add roughly 2–4 engineering hours, including at least 65 minutes to observe normal token refresh, only after prerequisites and authorization. Legal, security-owner decisions and unresolved defects have no defensible completion ETA. These are planning estimates, not release promises.

## E. Outstanding actions and review relevance

“AI Builder Cup relevance” describes evidence value, not a verified scoring guarantee. The PM column is a proposed review lens, not Intuit's official hiring rubric.

| Action / why required | Owner, effort, acceptance | End-user benefit / safeguard | AI Builder Cup evidence relevance | Intuit Senior Staff PM migration/onboarding competency |
|---|---|---|---|---|
| Select canonical product logo and favicon; current identity lacks an accepted master | Product owner selects A/B; frontend ~30–60 min with provider work. Approved asset, legible Dark/Light desktop/mobile and 16/32px icon, no geometry regression | Recognizable trusted product and browser-tab identity | UX consistency and polished demonstration; no invented identity approval | Coherent product systems, brand judgment, scoped execution |
| Resolve provider copy and shared placement; reviewed guidance conflicts with current exception | Product/brand owner, Google contact if needed; review duration unknown. Explicit copy/placement decision plus factual basis, no unsupported provider logos | Avoids endorsement and live-AI misinterpretation | Credible technical attribution and honest capability boundaries | Trust, ecosystem governance, evidence-based positioning |
| Retain tested error recovery; final source must include it | Codex preparation complete; owner reviews state. Exact final build repeats failure/recovery/focus check | A failed media request never strands the visitor with a blank/broken region | Observable failure handling and UX quality | Resilience, graceful recovery, acceptance-driven delivery |
| Review narration, synchronized cues, sounds and equivalent alternative | Owner + accessibility reviewer; listening ~15–30 min, timing/AT ~30–60 min, uncertain-word resolution unknown. Approve MP4 hash, exact full text, cue intervals/sounds and alternative; then authorize publication | Deaf/hard-of-hearing and nonvisual access to equivalent information | Inclusive UX evidence rather than an axe-only compliance claim | Accessibility ownership, precise launch criteria |
| Complete real-device Safari/Chrome, keyboard/AT and zoom acceptance | QA/accessibility owner, ~30–60 min after content; actual device/browser records and readable/operable controls | Predictable onboarding across input modes and mobile policies | Reproducible cross-device demonstration quality | Platform risk management, inclusive onboarding |
| Approve Privacy/Terms facts and publication | Legal/product owner; duration unknown. Complete operator/contact/retention/data-flow facts and approve real linked policies | Informed data use and understandable Beta boundaries | Responsible data handling and trustworthy demo scope | Financial-data stewardship, compliance partnership |
| Verify Accounts A/B and authorize exact hosted acceptance | Owner supplies non-sensitive eligibility/ownership/synthetic provenance results; QA ≥65 min refresh plus checks after approved deployment. Login/logout/reload/refresh and authorized isolation denial pass | Prevents customer-data exposure and stale/cross-account access | Genuine authenticated workflow evidence, not operator-IAM or mock proof | Tenant integrity, onboarding reliability, accountable security gates |
| Dispose of High dev advisory | Security owner ~30–60 min assessment; remediation unknown. Supported fix or named/expiring artifact-specific risk exception | Protects delivery availability and supply chain | Honest distinction between build and runtime exposure | Risk prioritization and explicit accountable exceptions |
| Dispose of API approval replay | Backend/product risk owner ~60–120 min synthetic triage, separate release unknown. Idempotency/audit tests or narrowly approved exception | Prevents misleading repeat-approval history; no duplicate-posting claim | Trustworthy human-control/audit evidence | Financial workflow correctness and cross-team ownership |
| Commit/build/scan/hosted/native acceptance and promotion gates | Release owner authorizes each boundary; ~2–4 h after prerequisites. Exact commit/image/env/SBOM/scan, required native/hosted acceptance and rollback verified | Ships the tested artifact with a recoverable rollout | Traceable reproducible release evidence | Release governance, operational readiness, risk-managed delivery |

Evidence inventory: [validation](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/validation.json), [213 tests](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/focused-tests.log), [TypeScript](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/typescript.log), [ESLint](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/eslint.log), [build](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/production-build.log), [browser states](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/browser.json), [QA](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/qa/qa-report.json), [fragments](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/anchor-check.json), [public flows](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/public-flows.json), [navigation](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/navigation.json), [position](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/position.json), [security](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/security.json), [full matrix](../v2/release/evidence/ux-production-2026-10-20/final-acceptance/test-matrix.json). Historical runtime/security/cleanup evidence remains indexed separately. No full UX suite or old image scan was rerun.

## Owner brand decision and checkpoint proposal — 20 October 2026

**Option B is preferred, not yet finally approved/installed. Production NO-GO.** This update makes no application changes and does not change any of the 63 acceptance statuses. The existing 13-path working-tree proposal remains intact; the 21-path final inventory below is conditional on the owner's next approval. No staging, commit, cloud call, image publication or Gemini-thread action.

### Product recommendation and measured mockups

[Actual header mockups: A fallback, B + proposed landing text, B without persistent attribution](../v2/release/evidence/ux-production-2026-10-20/brand-decision/approval-gallery.html). B's angular ledger silhouette and paired entries give it clearer product character than A while retaining the established book identity. This is a visual comparison, not a claim of trademark exclusivity. Retain A in the existing baseline and review evidence as fallback; no second logo system is proposed.

Fresh browser-only measurements: B keeps **44×44 CSS px desktop / 32×32 mobile**; logo, header, hero and CTA rectangles remain unchanged in all four landing views. Mark/background contrast is **6.14:1 Dark / 5.16:1 Light**. The symbol remains decorative (`aria-hidden=true`); the home link retains its MoveBooks AI accessible name and no extra focus stop. No clipping/overflow or material regression observed. The nonmarketing proposal reserves existing brand-block height rather than collapsing navigation. Favicon at 16/32px is not yet accepted. These measurements substantiate the mockups, not an installed identity or full accessibility certification. [Measurement record](../v2/release/evidence/ux-production-2026-10-20/brand-decision/brand-review.json).

### Exact provider copy and placement for approval

| Surface | Before (currently served) | Proposed after (not implemented) | Placement / boundary |
|---|---|---|---|
| Public marketing homepage `/` | Built on Google Cloud and powered by Gemini AI | **Built on Google Cloud** | One quiet plain-text line beneath the MoveBooks AI wordmark, outside its home-link/logo asset. Retain current type/color/spacing and header dimensions. This describes the hosted product's evidenced infrastructure, not the local browser's runtime host. |
| Every other shared-header route, including `/sign-in`, `/simulator`, `/try-your-data`, `/learn`, `/trust`, `/workspace`, settings and migration screens | Same persistent attribution | **No provider-attribution line** | Keep product logo/wordmark and header footprint; no empty spoken placeholder. Do not infer that signed-in workspace rendering was tested from the local sign-in mockup. |
| Gemini attribution, all current routes | powered by Gemini AI as part of the fixed line | **Omit** | Do not substitute “Built with Google Gemini” on this candidate: verified permitted implementation/marketing basis is not established in Track A. No live Gemini capability claim or provider logo. |

The [April 2026 customer guidance](https://services.google.com/fh/files/misc/external_customer_co_branding_eligibility.pdf), pp.5–7, supports factual marketing “Built on Google Cloud” and does not extend that permission to in-product attribution. The proposed route restriction avoids persistent product co-branding. No endorsement, sponsorship or partnership wording is introduced. This is a guidance-aligned proposal based on recorded Cloud Run usage, not legal approval or proof of live Gemini.

Implementation requires a narrow amendment to the earlier owner-approved attribution exception, its exact-copy tests and shared-header rendering. Preserve `AI_ASSISTANCE_STATUS=planned`, all execution/authorization boundaries, and all other AI wording rules. Owner approval is required **before** editing public-facing copy, as requested in Decision 2.

### Sole failure: BR-06

- **Requirement:** provider attribution must be accurate and appear once, with appropriate branding usage.
- **Actual:** the shared header shows the old powered-by wording on landing and application routes. The once-only/plain-text behavior passes. Existing unit tests pass because they enforce that historical fixed-copy decision.
- **Expected:** factual permitted marketing copy, no unsupported Gemini-powered statement, and no persistent in-product attribution without an acceptable basis.
- **Severity/impact:** **Major release messaging/compliance concern**, not a crashing UI or security exploit. Visitors could infer active AI or a provider relationship beyond verified capability; persistent placement compounds the impression.
- **Root cause:** earlier owner-approved copy was encoded as an exact string and unconditional shared-header line. The acceptance review introduced current published provider guidance, which the old tests did not evaluate. This is **one manual acceptance FAIL**, not a failure among the 213 passing automated tests.
- **Resolution:** approve the exact table above; update only attribution exception/copy/route conditions/tests; verify landing once-only, absence elsewhere, no logos/forbidden wording, preserved header geometry, unchanged Planned status. BR-06 remains FAIL until implemented and verified.
- **Checkpoint consequence:** it prevents calling the checkpoint the final compliant UX candidate. It does **not** technically prevent a separately authorized recoverable WIP local commit that explicitly records the issue. Recommend fixing it and obtaining visual acceptance before requesting the one final UX checkpoint commit. Other release gates may remain honestly open in that local checkpoint; a commit is not production authorization.

### Every BLOCKED / NOT RUN case — unchanged status

| ID | Status | Prerequisite / acceptance needed | Responsible owner | Release impact |
|---|---|---|---|---|
| BR-01 — Product logo on desktop | **BLOCKED** | Approve shown B and render it in the final shared desktop header. | Product owner / frontend | Final branding acceptance; does not block an explicitly approved WIP checkpoint. |
| BR-02 — Product logo on mobile | **BLOCKED** | Approve B and verify installed 32px mobile mark, wordmark and menu clearance. | Product owner / frontend | Final mobile branding acceptance. |
| BR-03 — Dark theme branding | **BLOCKED** | Owner approves actual installed Dark treatment; preserve accessible named home link. | Product owner / frontend | Final Dark appearance acceptance; mockup contrast already measured. |
| BR-04 — Light theme branding | **BLOCKED** | Owner approves actual installed Light treatment without layout changes. | Product owner / frontend | Final Light appearance acceptance; mockup contrast already measured. |
| BR-05 — Browser favicon | **BLOCKED** | Approve a B-derived favicon, check 16/32px and actual browser metadata response. | Product owner / frontend | Minor branding completeness gate; no security impact; owner can scope separately. |
| VD-09 — Mobile Safari | **NOT RUN** | Actual iOS Safari device/session and final candidate; check inline policy, controls and recovery. | Device QA / owner | Mobile acceptance gate; Chromium touch emulation is not Safari proof. |
| VD-10 — Mobile Chrome | **NOT RUN** | Actual Android Chrome device/session and final candidate; check native controls, framing and recovery. | Device QA / owner | Mobile acceptance gate; desktop Chromium emulation is supporting evidence only. |
| VD-14 — Captions toggle | **BLOCKED** | Human-approved VTT, then actual native captions toggle and loading/synchronization checks. | Content owner / accessibility QA | Accessibility release gate; no track is published. |
| AU-05 — Hosted login | **BLOCKED** | Verified Google eligibility and synthetic owned accounts; exact hosted revision and sign-in scope approved. | Account owner / release operator / QA | Mandatory hosted-auth release gate; human performs Google interaction. |
| AU-06 — Session refresh | **BLOCKED** | AU-05 prerequisites plus observed normal token refresh and successful own-account read; allow ≥65 min. | Account owner / auth QA | Session-continuity release gate; elapsed time alone is insufficient. |
| AU-07 — Account A/B isolation | **BLOCKED** | Verified distinct owners and synthetic-only provenance, separately approved safe isolation scope/environment. | Account owner / security QA | Mandatory tenant-security release gate; no foreign-owner production-data probes. |
| AC-03 — Keyboard-only navigation | **BLOCKED** | Real keyboard-only and assistive-technology walkthrough on the final build; existing Chromium checks retained. | Accessibility QA | Manual accessibility gate; no blanket keyboard/AT acceptance inferred from axe. |
| AC-06 — Mobile zoom | **NOT RUN** | Actual mobile pinch/text zoom, including accessible actions and no clipped essential content. | Accessibility/device QA | Device accessibility gate; existing 200%-equivalent reflow checks do not replace it. |
| AC-07 — Caption accuracy | **BLOCKED** | Resolve exact 12–14s narration; approve full transcript, cue timing, pacing and meaningful sounds. | Owner / accessibility reviewer | Major accessibility gate; no unverified captions. |
| AC-08 — Media alternative | **BLOCKED** | Approve complete equivalent narration/visual alternative; assess audio-description requirements. | Owner / accessibility reviewer | Major accessibility gate; existing visual-only description is incomplete. |
| SC-02 — Development advisory | **BLOCKED** | Security owner approves supported fix or named, expiring exception tied to final build/source/artifact and trusted inputs. | Security owner | High build-tool advisory disposition gate; clean runtime scan is not a waiver. |
| SC-05 — New image SBOM | **BLOCKED** | Separate commit authorization, exact final image build and matching SBOM. | Release engineer / owner | Final artifact gate; old 519-component SBOM applies only to old image. |
| SC-06 — Container vulnerability scan | **BLOCKED** | Scan that exact image with current database; zero unresolved Critical/High, review Medium. | Release engineer / security owner | Final security gate; old clean scan cannot be inherited. |
| SC-07 — Image provenance | **BLOCKED** | Record final commit/tree, build inputs and environment, immutable image digest and evidence chain. | Release engineer | Provenance gate; current base+patch local build is accurately recorded but not final image. |
| SC-08 — Rollback readiness | **BLOCKED** | Immediately before authorized promotion, read-only recheck serving revisions, traffic, immutable rollback digest/config and collision scope. | Release operator | Pre-promotion gate, not a local commit prerequisite; old r16e31e9-1041 observation is preserved. |

Privacy/Terms approval, API approval-replay disposition, exact hosted/native acceptance and production-promotion authorization are additional release gates outside those 20 case IDs. They remain OPEN. Accounts A/B remain UNVERIFIED. No draft captions or disclosures are published. The High build-tool advisory remains High; API replay remains proposed P1 audit-integrity/correctness pending its owner's disposition.

### Exact source inventory and single-commit proposal

**Existing 13 paths — already prepared, not staged:**

- `apps/web/app/v2-landing.css`
- `docs/ux/v2-release-closeout.md`
- `docs/ux/v2-release-checkpoint-files.txt`
- `docs/ux/v2-release-evidence-index.json`
- `docs/ux/v2-track-a-media-review.md`
- `docs/ux/v2-release-disclosure-drafts.md`
- `docs/ux/v2-release-manual-auth-acceptance.md`
- `apps/web/components/public-surfaces/HeroVideo.tsx`
- `apps/web/components/public-surfaces/HeroVideo.test.tsx`
- `apps/web/components/IdentityProvider.tsx`
- `apps/web/components/IdentityEntry.tsx`
- `apps/web/test/google-sign-in.test.tsx`
- `docs/ux/v2-final-acceptance.md`

**Eight additional paths — proposed only after approval:**

| Path | Necessary change |
|---|---|
| `apps/web/components/Nav.tsx` | Install approved B path geometry in existing shared BrandMark; render attribution only on pathname /. Preserve named home link and navigation. |
| `apps/web/app/icon.svg` | New favicon derived from selected B; actual 16/32px and metadata checks required. No app icon family or new palette. |
| `apps/web/components/v2/Attribution.tsx` | Exact marketing text becomes Built on Google Cloud; no provider logos or Gemini claim. |
| `apps/web/components/v2/Attribution.test.tsx` | Exact text, plain text/no logos and unchanged Planned status contract. |
| `apps/web/components/v2/ai-copy.test.ts` | Replace only obsolete attribution exception assertion; preserve all capability prohibitions and Planned status tests. |
| `apps/web/components/public-surfaces/surfaces.test.tsx` | Update landing once-only expected text; preserve section/CTA/Trust assertions. |
| `apps/web/test/account-shell.test.tsx` | Route-scoped attribution and shared product-mark accessibility; no persistent provider line in nonmarketing shell. |
| `docs/v2/phase1/ai-status-rule.md` | Amend only owner attribution exception/placement; no change to AI_ASSISTANCE_STATUS or live-inference gate. |

[Exact prospective 21-path manifest](../v2/release/evidence/ux-production-2026-10-20/brand-decision/proposed-checkpoint-files.txt). Do not execute it as a staging command. The current repository checkpoint manifest stays at 13 until the conditional implementation is approved and completed. Existing selected CSS may receive only a narrowly necessary header-height reservation after browser verification; hero/CTA/video styling stays frozen. No package/dependency or additional asset family is proposed.

After the branding/copy implementation and focused review, propose **one local commit**: `feat(web): finalize MoveBooks AI V2 UX and branding`. Parent remains `e7f1e288fd7f378045950fc94d5d7c89e298575f`. Reverify the final allowlist/diff and obtain separate commit authorization before explicit path staging. Preserve excluded `.github` workflow changes, `docs/v2/release/smoke-v2.sh`, unrelated tests/Claude configuration, all Gemini/backend work and raw evidence. No amend, push or publish.

Focused validation after approval: attribution/AI-copy/public-surface/account-shell tests plus existing HeroVideo regression, TypeScript/ESLint, one local production build, four theme/device header/idle views and axe checks, route-only attribution, favicon response, fragment clearance and video recovery smoke. Reuse the 213-test/30-fragment/25-axe evidence as historical support, not as proof of changed branding. Rebuild/scan a final image only after its source/build inputs are finalized and appropriately authorized; the old f9c72c0 image cannot certify it.

### Change value and next authorization

| Necessary action | End-user benefit | AI Builder Cup evidence impact | Intuit Senior Staff PM competency |
|---|---|---|---|
| Approve/install B in existing shared header, derive one favicon, retain A fallback | Recognizable product and browser-tab identity without disrupting familiar migration flow | Consistent, legible product UX with measured geometry/contrast; no new AI capability claim | Design-system stewardship, constraint management and incremental delivery |
| Restrict truthful Google Cloud marketing text to `/`; omit unsupported Gemini attribution | Clear separation of product identity, infrastructure and actual AI availability | Honest technology attribution; evidence credibility over implied capability | Trust/compliance partnership, evidence-based positioning and accountable scope |
| Update narrowly scoped copy/route/brand regressions and record exact source | Prevents provider-copy recurrence and catches navigation/layout regressions | Reproducible before/after evidence and traceable implementation | Acceptance criteria, quality strategy and release discipline |
| Keep human media/legal/device/auth/security gates open and bind later image to final source | Protects accessible onboarding, consent, tenant boundaries and financial audit trust | Distinguishes demonstrated UX from unverified hosted/inference claims | Risk prioritization, cross-functional ownership and controlled launch |

These are evidence/PM review lenses, not promised competition scores or official hiring criteria. Per-gate owner efforts and broader risk rationale remain in Section E above.

**Smallest next approval:** approve **Option B as shown**, one B-derived favicon subject to 16/32px verification, the exact homepage-only “Built on Google Cloud” line, no provider line on other routes, and the associated attribution-exception/test amendment. Approval permits scoped local implementation/revalidation only; **not a commit**. The owner explicitly required final mockup/copy review first, so no product code is changed in this turn.

**Readiness/ETA:** proposal ready; final visual/checkpoint acceptance pending implementation and owner review. Approximately **30–60 minutes after the above approval** for local changes and focused checks, assuming no regression. A separately authorized local checkpoint can follow review even while disclosure/auth/security gates remain recorded OPEN. Production stays **NO-GO**; the October 20 20:00 IST target has passed. No credible production ETA until human legal/media/security/account decisions and authorized hosted/final-image checks are complete. Both local previews are preserved; port 3118 remains the latest tested error-recovery source, port 3117 the preceding source.

## Implemented branding acceptance — 20 October 2026

**Local checkpoint READY for separate authorization. Production NO-GO.** This section supersedes the older conditional branding proposal and its 42 PASS / 1 FAIL / 17 BLOCKED / 3 NOT RUN count. The user approved B and exact marketing copy; implementation is complete. Current 63-case matrix: **48 PASS, 0 FAIL, 12 BLOCKED, 3 NOT RUN**. No unresolved acceptance case was waived. [Current matrix](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/test-matrix.json), [comparison gallery](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/gallery.html).

### Exact candidate and preview

Open **http://127.0.0.1:3119/**. This is the latest running, isolated production-mode Next build. Ports 3117/3118 remain older sources; they were not interrupted. HEAD remains `e7f1e288fd7f378045950fc94d5d7c89e298575f` on `feature/v2-landing-final`. Source is base plus 13 selected web-file changes, patch SHA256 `bbefc321d95cfcc159a7d27b6df4d26e360f70dbcfd420575cd6a47dc593bd58`, build ID `e_XSGu_TXXIfsebJPisvN`. [Build/source hashes](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/validation.json), [scope preservation](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/scope.json). No new Git commit, container image, SBOM or image scan is claimed.

The explicit local-preview flag is enabled, with no Firebase key/project/auth-domain, private API origin, database or Gemini connection. Demo is authored synthetic data; Try Your Data performs browser-local checks. Google sign-in is honestly unavailable. Real hosted account settings/session/isolation cannot be demonstrated here. `/settings` in the route probe is a shared-shell 404, not functional Settings acceptance; member header tests use a mock identity.

### Brand acceptance matrix

| Case | Result | Actual evidence |
|---|---|---|
| BR-01 desktop logo | PASS | Exact approved B ledger paths/stroke; 44px in Dark/Light. |
| BR-02 mobile logo | PASS | Same approved paths; 32px in Dark/Light; wordmark unobscured. |
| BR-03 Dark branding | PASS | Measured logo/background contrast 6.14:1; alignment preserved. |
| BR-04 Light branding | PASS | Measured logo/background contrast 5.16:1; alignment preserved. |
| BR-05 favicon | PASS | Next metadata serves SVG HTTP200; same approved geometry; native 16/32/48px boards inspected in both themes. Book recognizable at 16px, internal detail finer; 32/48px clear. |
| BR-06 provider attribution | **PASS — prior failure resolved** | `/` has “Built on Google Cloud” exactly once below wordmark; all other probed shared headers omit it. Verified-member unit test also omits it. No powered-by/endorsement text. |
| BR-07 provider logos | PASS | No Cloud/Gemini logos introduced; product identity remains separate plain-text infrastructure attribution. |
| BR-08 responsive header | PASS | Twelve before/after cases at widths 320/390/700/720/1023/1440, homepage/sign-in: every height delta 0; no overflow. |

[Brand measurements](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/brand-qa.json). All four actual header captures are pixel-identical to their approved B/copy mockups. All pixels below the header match the preceding accepted idle captures at fixed reduced motion; image comparison starts at pixel row 78 desktop, 134 mobile DPR2. Idle and restored states are pixel-identical. [Pixel results](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/visual-comparison.json). All four fresh full-page images were visually inspected; no Critical/Major visual regression observed. This establishes the requested scoped fidelity, not full browser/device certification.

Option A remains recoverable from the unchanged parent commit and `final-acceptance/branding-options/a-existing.svg`; no third identity or new logo system. Header geometry is reserved with an empty CSS pseudo-element on nonmarketing routes and the prior two-line footprint at <=368px. These changes avoid shifting the page when old provider copy disappears. Hero image, encoded video and existing inline/recovery source are unchanged this turn.

### Fresh validation

| Check | Result / scope |
|---|---|
| Focused frontend tests | **221 PASS in 13 files**, including eight added account-shell route/member regressions. Full suite not rerun; earlier full-suite totals remain historical. React emitted non-failing script-tag warnings in the shell/motion test harness; browser checks logged no page errors. |
| TypeScript / ESLint / production build | PASS, each exit 0; isolated selected-source build, existing dependencies reused, lock unchanged. |
| Attribution/AI-copy rules | Exact-string and placement regressions pass. Only the owner-approved historical exception changed; Planned/live-activation safety rules unchanged. |
| Video | Four layouts: inline start, natural 25.042s completion, pause/resume, Replay, Restore, three additional cycles, single player; synthetic media HTTP503 recovery/retry; no page errors. |
| CTA flows | Explore Demo completes five synthetic phases; local template consent/validate/clear passes; no external requests or network writes. |
| Fragment navigation | **30/30 PASS**, direct/Guide/Demo at five widths in both themes; tested mobile CSS clearance retained. |
| Accessibility/responsiveness | **25 scoped axe scans, zero violations**; keyboard Enter/Space/Escape/focus restoration, appearance persistence/System, sticky CTA, 720px reflow and reduced-motion animation suppression pass. Manual screen reader/physical device/captions remain open. |
| Security | Fresh production npm audit **0**. Full audit **5 High** propagated dev findings; unresolved, not a waiver. Bounded emitted-JS/patch credential-pattern scan clean; no lock change. No final-image claim. |
| Diff/scope | `git diff --check` PASS; empty index; exact selected source hashes match built source; excluded workflow/smoke work preserved. |

Evidence: [browser/video](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/browser.json), [QA report](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/qa/qa-report.json), [fragment](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/anchor-check.json), [CTA](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/public-flows.json), [security](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/security.json). Build/test/lint logs and local scripts are retained in the same evidence directory. Reproduction scripts contain local paths; evidence is not automatically published.

### Exact local checkpoint inventory

The [21-path manifest](v2-release-checkpoint-files.txt) now represents the implemented selection, replacing the old 13-path/conditional-eight proposal:

- `apps/web/app/v2-landing.css`
- `docs/ux/v2-release-closeout.md`
- `docs/ux/v2-release-checkpoint-files.txt`
- `docs/ux/v2-release-evidence-index.json`
- `docs/ux/v2-track-a-media-review.md`
- `docs/ux/v2-release-disclosure-drafts.md`
- `docs/ux/v2-release-manual-auth-acceptance.md`
- `apps/web/components/public-surfaces/HeroVideo.tsx`
- `apps/web/components/public-surfaces/HeroVideo.test.tsx`
- `apps/web/components/IdentityProvider.tsx`
- `apps/web/components/IdentityEntry.tsx`
- `apps/web/test/google-sign-in.test.tsx`
- `docs/ux/v2-final-acceptance.md`
- `apps/web/components/Nav.tsx`
- `apps/web/app/icon.svg`
- `apps/web/components/v2/Attribution.tsx`
- `apps/web/components/v2/Attribution.test.tsx`
- `apps/web/components/v2/ai-copy.test.ts`
- `apps/web/components/public-surfaces/surfaces.test.tsx`
- `apps/web/test/account-shell.test.tsx`
- `docs/v2/phase1/ai-status-rule.md`

This turn changes eight web paths: CSS, Nav, new icon.svg, Attribution and its test, ai-copy test, surfaces test and account-shell test. Documentation changes: this report, closeout, 21-path manifest, evidence index, narrow ai-status attribution exception, and one stale attribution description in the **unpublished** disclosure draft. Earlier selected HeroVideo/recovery and local identity changes, media-review and auth handoff remain preserved. [Per-turn changed list](../v2/release/evidence/ux-production-2026-10-20/branding-implementation/inventory.json) distinguishes these from the full checkpoint.

Excluded: PostgreSQL/general CI, UX workflow/smoke tooling, backend, Gemini, credentials, local config, unrelated docs/tests and all bulk/raw evidence. No package or lock changes. Eight docs in the manifest preserve compact traceability/drafts; local screenshots, scripts and scan payloads stay available through the index, outside the commit. A future external evidence transfer would need an authorized sanitized bundle. No stage, commit, push, PR, image publication or cloud operation occurred.

### Remaining gates, owner actions and value

Effort below is hands-on work after inputs/approval, not a promised calendar completion. AI Builder relevance describes credible evidence, not guaranteed judging points; PM relevance is a review lens, not an official Intuit hiring rubric.

| Gate / cases | Required action, owner, effort and acceptance | End-user safeguard | AI Builder evidence / Intuit Senior Staff PM relevance |
|---|---|---|---|
| Captions / alternative: VD-14, AC-07/08 | Owner + accessibility reviewer: approve exact narration/timing/sounds and equivalent visual information (30–60 min review, then scoped implementation/tests). No uncertain narration publication. | Equivalent access to onboarding guidance. | Honest accessible demo evidence / inclusive launch ownership. |
| Complete keyboard/AT: AC-03 | Accessibility reviewer: manual keyboard and screen-reader walkthrough, including native media controls (30–60 min), record all critical tasks usable. | Prevents keyboard/assistive-tech exclusion. | Distinguishes automated checks from real accessibility / measurable quality strategy. |
| Real device: VD-09/10, AC-06 NOT RUN | Device tester + owner: iOS Safari, Android Chrome, pinch/text zoom on actual devices (30–45 min), no inaccessible controls or lost content. | Reliable mobile onboarding/playback. | Physical-device proof / customer-context testing. |
| Hosted login/session/isolation: AU-05/06/07 | Account/data owner verifies A/B Google eligibility, distinct owners and synthetic provenance; release owner separately authorizes exact hosted candidate; human signs in (60–90 min after prerequisites). Sessions and foreign-owner denial must be recorded. | Protects tenant data and continuity. | Real acceptance vs mocked identity / migration trust and boundary management. |
| Privacy / Terms (outside 63 cases) | Owner supplies missing operational facts; legal approves exact unpublished versions and publication (calendar ETA owner-dependent; 30–60 min engineering after approved text). | Clear data handling and informed consent. | Reviewable disclosures / cross-functional governance. |
| High dev advisory: SC-02 | Security owner approves supported remediation or named bounded expiring exception tied to final build/inputs (30–60 min triage; fix effort unknown). Five propagated findings remain unresolved. | Protects build availability/supply chain. | Honest runtime/build distinction / accountable risk disposition. |
| API replay (outside 63 cases) | Backend/product owner triages proposed P1 audit-integrity risk and approves separately scoped fix or justified bounded exception (30–60 min triage; remediation unknown). No Track A backend modification. | Avoids duplicate approval/audit history. | Integrity of human-control evidence / financial-workflow idempotency. |
| Final image: SC-05/06/07 | After separate checkpoint approval, release engineer builds exact final source, records digest/SBOM, scans and applies necessary startup/native acceptance (45–90 min local; hosted work separately authorized). Old f9c72c0 PASS cannot certify this change. | Ships the source actually tested. | Reproducible artifact provenance / evidence-driven release discipline. |
| Rollback: SC-08 | Release operator: fresh read-only traffic/revision/digest/config/collision check immediately before separately approved promotion (10–20 min); retain verified rollback target. | Controlled recovery without customer disruption. | Auditable rollout / operational accountability. |

Accounts A/B remain UNVERIFIED. No caption/legal text was published, no advisory/API exception accepted, no final container produced. Production remains at its last recorded unchanged baseline; no live-cloud recheck was made during local branding work.

**Smallest next authorization:** approve explicit staging of these **21 paths** and **one local checkpoint commit**, proposed message `feat(web): finalize MoveBooks AI V2 UX and branding`. This does not authorize release, push or cloud work. Recheck HEAD/index/allowlist immediately before that authorized commit. Local implementation/validation is complete; allow about **5–10 minutes after approval** for checkpoint verification and commit. The 20:00 IST target has passed. Production is **NO-GO**, with no credible release ETA until owner decisions, final artifact and hosted/device acceptance close.
