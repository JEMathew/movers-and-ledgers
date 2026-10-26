> Final owner-directed attribution positioning and minimal keyboard-focus correction: **BRANDING FROZEN**. Current evidence, final source snapshot and container status are in [the final branding/release report](v2-provider-branding-local-review.md). Earlier results below remain historical, not certification of the changed artifact.

# Final UX fixes and controlled release handoff

**Update:** [Both official provider marks and exact copy are now implemented for local review](v2-provider-branding-local-review.md), following the owner’s later authorization. Public-use clearance remains OPEN. This report’s earlier unimplemented-branding statements and seven/nine-file proposal are historical; use the owner-locked matrix and current selection file for current status.

20 October 2026, after 21:50 IST. **Production NO-GO.** The 20:00 IST target has passed. This report supersedes earlier acceptance totals only for the new requirements; prior evidence remains preserved.

## Current scope and acceptance

The [owner-locked scope and acceptance matrix](v2-owner-scope-acceptance.md) is the single authoritative current matrix. This handoff retains supporting implementation, evidence, risk and execution details. Both official provider logos, exact combined copy and approved placement remain mandatory and BLOCKED. The earlier text-only implementation is not an accepted substitute.

## Provider authorization: exact unresolved requirement

The [April 2026 customer guidance](https://services.google.com/fh/files/misc/external_customer_co_branding_eligibility.pdf), pp. 5–10, permits qualifying factual plain-text marketing references. It does not grant the requested logo treatment: p. 8 excludes inline branded assets; p. 10 describes restrictions applicable when logo access is granted. “Built with Google Gemini” can describe qualifying development-tool/model use; live production inference is not its only possible basis. The [general product co-branding guidance](https://partnermarketinghub.withgoogle.com/brands/google/use-cases/product-co-branding/) also distinguishes contextual product icons from logos. The [official Gemini brand resources](https://partnermarketinghub.withgoogle.com/brands/google-gemini/brand-introduction/) redirect to approved-account login.

**Owner action:** obtain Google Cloud Brand/Google brand-team permission covering both exact official assets and this homepage placement, including required clear space, colors/backgrounds and any legal line. Supply authorized original asset files/provenance and the approved treatment. Also supply evidence that this product qualifies for the Gemini wording (documented development use or verified integration); no model calls or Gemini-branch changes are requested. Neither owner aesthetic approval nor the existence of a public logo file alone establishes Google's usage permission. No request was sent to Google on the owner's behalf. Requirement B stays open, not replaced by the existing copy.

## Fresh local evidence

[Evidence gallery](../v2/release/evidence/ux-production-2026-10-20/final-video-fix/gallery.html) compares all four idle screenshots against the prior checkpoint, with playing/paused/completed/restored/error screenshots. [Machine summary](../v2/release/evidence/ux-production-2026-10-20/final-video-fix/summary.json).

Preview: **http://127.0.0.1:3120/**, bound to loopback, running independently of 3119. Build is checkpoint `3e55d8871175ae9dd31e14c14143352da40b0625` plus the four source/test files listed below. It uses the existing browser-local synthetic/demo paths, no live backend or Firebase credentials. Public workspace shell is not authentication evidence.

- 223 tests passed in 13 focused files; zero failed. TypeScript, ESLint, production-mode Next build and `git diff --check` passed.
- Four layouts: 1440×900 / 390×844, Dark/Light. Every idle image is pixel-identical to the prior checkpoint image. Product-logo contrast exceeds 3:1 and header dimensions remain unchanged. Served favicon SVG checked at 16/32/48 px.
- Four-layout media checks: play, native keyboard pause/resume, completion, Replay from zero, explicit Restore, actual blocked-media-request error, retry after removal of fault, Escape and focus return. No overflow/frame-dimension change; one video element; zero unexpected fullscreen/page errors/external browser requests. 16 axe scans, zero violations. This is not full WCAG or assistive-technology acceptance.
- Three additional consecutive full-length, normal-speed natural playbacks completed and restored the photo without seeking, using normal motion preference. Four-layout checks additionally use reduced motion and seek near the end to exercise native ended events.
- 30 fragment cases passed (direct, Guide, Demo; five widths; both themes). All five synthetic demo phases and browser-local template consent/validation/clear passed; no network writes.
- Existing homepage-only attribution boundary remains intact on shared-header routes. That result does **not** pass the new two-logo/exact-copy requirement.
- Production npm audit: zero vulnerabilities. Full audit: five High package findings in one development-tool chain; not waived.
- Browser harness initially needed asynchronous visibility waits and an alert locator scoped away from Next's route announcer. Those preliminary runs stopped; the final complete run passed. They are not reported as product PASS evidence.
- Backend code was not changed; earlier 102 backend contract results are historical supporting evidence, not freshly rerun. Hosted identity, real devices and AT remain untested.

## Source selection and artifact provenance

Current branch `feature/v2-landing-final`; HEAD remains `3e55d8871175ae9dd31e14c14143352da40b0625`. **No staging or commit in this execution.** [Current nine-file review proposal](v2-final-ux-fixes-files.txt):

1. `apps/web/app/v2-landing.css` — bounded accessible error message, no idle design change.
2. `apps/web/components/public-surfaces/HeroVideo.tsx` — single visible media state, automatic completion restoration and retry.
3. `apps/web/components/public-surfaces/HeroVideo.test.tsx` — state/cycle/error regression coverage.
4. `apps/web/test/google-sign-in.test.tsx` — local-flag-absent hosted configuration regression.
5. This handoff.
6. The exact selection file.
7. Compact evidence `final-video-fix/summary.json`.
8. `docs/ux/v2-owner-scope-acceptance.md` — authoritative owner-locked requirement traceability.
9. `docs/ux/v2-final-acceptance.md` — historical-status correction, preserving prior results.

This is the completed video/auth-test scope available for review, **not a claim that the full final requirement inventory is ready**. Official provider assets, attribution implementation and associated tests cannot enter the final checkpoint until gate B is resolved. No partial checkpoint was committed. Reconcile the final inventory once those files exist, then obtain explicit checkpoint approval.

Excluded changes preserved: `.github/workflows/ci.yml`, `.github/workflows/ux2-web-candidate.yml`, `docs/v2/release/smoke-v2.sh`; all 497 previously excluded file hashes still match. Existing evidence and other untracked files remain. No Gemini/backend/CI/configuration/credential files are selected. Photo/video/logo/favicon bytes match HEAD. Local screenshot galleries and machine-specific QA scripts remain evidence, excluded from the proposed checkpoint.

**No new final image exists.** The retained prior image is for unmodified checkpoint `3e55d88` only:

- OCI index: `sha256:023625ae3f514ec1f71ffe7815deab8e4ed078a326ff3d0f32d72f19ea1b75a6`.
- amd64 manifest: `sha256:fbe000b2581180e35e0198d70a9f19cf39d9e6aeec2cb71ed2e8abdbd6a28ac1`.
- 519 SBOM components; Grype 0 Critical/High/Medium against validated same-day cache; latest database lookup was 403. 512 MiB emulated smoke passed; 256 MiB emulation OOM. New native acceptance pending.
- Older `e7f1e28` / `f9c72…` native 256 MiB HTTP PASS remains historical only. Neither prior image's results certify the current uncommitted video change.

After the final checkpoint is explicitly approved and committed: archive exact commit; build web-only image with hosted Firebase public configuration and **without** the local-preview flag; capture source/archive/config/manifest/index digests, SBOM, Grype database age and all severities, production and development audits; run bounded local startup/public-HTTP smoke. Then request a separate immutable-image cloud execution approval. Never use this local-preview build as the production artifact.

## Read-only cloud preflight and rollback

Fresh readback 21:43–21:46 IST: web **100% `movebooks-beta-web-r16e31e9-1041`**, API **100% `movebooks-beta-api-r16e31e9-1041`**. No traffic or configuration changes. All 127 regional operation records inspected across two pages: none pending. Service configuration, IAM, secret references (not secret values), revisions and recent operations retained under `final-video-fix/cloud/`. Three services remain: beta web, beta API, existing `movebooks-v2-preview-web`; existing `cand` / `uxfinal` tags still point to older revisions.

Rollback anchors remain retained:

- Web `sha256:2ef8acd0db5f35a09faf70a9edc7818d3d563251bcbe121c925ccca79ae46d64`.
- API `sha256:27dbe8f17d8fb1e61f1e986cc397bf0a0bb8e37fc60f98b34e4f3176142246f6` — no API deployment in UX release.

API startup probe is `/readyz`, liveness `/healthz`. External `/healthz` 404 is not confirmed as a platform-probe failure; bounded retained logs do not establish a new release-affecting liveness defect. No probe fix made.

No resource collision is visible in current serving/operation evidence. The separate Gemini thread/worktree was not contacted, changed or re-inspected this execution; previous idle/no-cloud-write report is point-in-time evidence, not a future reservation. Recheck resources immediately before any authorized write.

Google provider readback: enabled. Existing Firebase-authorized domains include the known Cloud Run web host, `movebooks-si.web.app`, and historical candidate tags. **`movebooks.ai` is absent and DNS resolution failed from this machine.** Ownership, intended production routing, DNS/TLS/Firebase domain setup require platform-owner verification; this is an additional blocker for the specified hostname, not proof the already-serving Firebase site is down.

## Hosted execution package: prepared boundary, not executable approval

No cloud writes are authorized by this handoff. An exact executable package cannot honestly be finalized while the final source/image and safe authenticated backend/hostname are unresolved. Do not publish the earlier image merely to advance the schedule.

The eventual package must name: final commit + immutable digest; private Artifact Registry path in `asia-southeast1-docker.pkg.dev/movebooks-ai/movebooks-beta/ux-web-preview`; collision-free dedicated service and identity; exact caller IAM/ingress; verified Firebase-authorized hostname; environment names and synthetic-only API/data boundary; HTTP/account acceptance limits; rollback and cleanup commands. Current operator permissions are available, not authorization.

For native HTTP acceptance, retain the prior proposed bounded plan: dedicated IAM-protected service, Gen1/256 MiB/1 CPU/concurrency 8/min 0/max 1, no production API/database/secrets/model connection, at most 2,000 requests/100 MiB, finish by 105 minutes and cleanup by 120 minutes from first write, no automatic memory increase, estimated under $2 rather than hard cap. Re-approve this for the **new** immutable image; the earlier authorization has been consumed and cleanup completed. Such a disconnected service cannot pass hosted authentication/isolation.

For hosted authentication, owner must separately approve an exact hostname, isolated synthetic backend/data boundary and non-destructive A/B denial scope. Current production API attachment is not authorized as a shortcut. Current placeholder/historical `cand` links are not instructions to start testing. Once approved use `/sign-in?next=%2Fworkspace`, `/workspace`, own synthetic deep links, `/settings`; human completes Google account chooser in separate Chrome profiles. Confirm verified identity, return destination, known own migrations, refresh/session continuity, sign-out and recoverable cancellation/error. Perform authorized UI/API foreign-owner denial checks without exporting tokens/records. Record candidate digest, alias, expected/actual result and timestamp only. Accounts A and B remain **UNVERIFIED** for Google audience, distinct ownership and synthetic provenance. [Full existing handoff](v2-release-manual-auth-acceptance.md).

## Consolidated mandatory owner gates

| Gate / owner / remaining effort | Why / end-user safeguard | AI Builder Cup evidence | Intuit Senior Staff PM competency | Exact acceptance needed |
|---|---|---|---|---|
| Provider treatment — owner + Google brand team; turnaround unknown, then ~1–2h focused implementation/validation | Accurate branding without implied endorsement | Verifiable platform/model attribution | Partner governance, evidence-based claims | Written permission for exact official assets/placement plus qualifying Gemini-use evidence; four views and once-only tests pass |
| Captions + complete media alternative — owner/editor/accessibility reviewer; ~1–2h after narration confirmation | Equivalent information for users who cannot hear/see video | Accessible, truthful demo evidence | Inclusive product delivery | Confirm uncertain 12–14s word, full transcript, cue timing and meaningful sounds; review complete equivalent alternative before app publication |
| Privacy/Terms — owner/legal; external ETA unknown | Clear data use, retention, rights and service limits | Responsible data governance | Trust/compliance launch management | Approve operator/audience/jurisdiction, rights contact, retention/deletion/backups, providers/regions, effective dates and publication destinations; no placeholders |
| Real-device/AT — accessibility reviewer; ~1–2h | Keyboard/screen-reader/mobile usability beyond automated checks | Reproducible inclusive experience | Quality strategy and acceptance | Actual mobile Safari/Chrome, zoom/reflow, screen-reader/focus/media checks; captions accepted; zero blocking defects |
| Hosted Google/A-B — owner + QA/platform; ≥65min observed session-refresh window plus ~30–60min checks after safe candidate setup | Account continuity and private workspace isolation | Secure end-to-end demonstration | Tenant-boundary risk ownership | Account eligibility + distinct owner/synthetic provenance confirmed; explicit safe scope; exact revision UI/API denials and session checks pass |
| High development-tool advisory — security owner; ~30–60min review, remediation TBD | Protect build availability/supply chain | Traceable vulnerability disposition | Risk-based release governance | Supported fix or named, bounded, expiring exception for final build inputs. No automatic waiver |
| API approval replay — API/product/security owner; ~30–60min disposition, remediation separate | Reliable approval/audit history | Human-control integrity | Financial workflow and cross-team dependency ownership | Accept/reject proposed P1 audit-integrity risk with named owner or independently tested API fix; web release cannot deploy existing local guard |
| Final artifact/native runtime — Codex after checkpoint + separate cloud approval; ~1–2h assuming no faults | Run the artifact actually reviewed | Immutable source/SBOM/security/runtime proof | Release provenance and operational readiness | Exact committed image, clean runtime scan, owner disposition for dev finding; native bounded acceptance on same digest |
| Production hostname/promotion — platform owner + release owner; unknown until domain plan | Reliable secure URL and sign-in | Reproducible accessible judging URL | Launch coordination, rollback discipline | Verified domain ownership/routing/TLS/authorized-origin plan; explicit config approvals; all prior gates closed; separate production GO |

Risk details: [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) remains High, no patched version listed. Fresh npm reports CVSS 3.1 7.5; GitHub reports CVSS 4.0 8.7 (different scoring versions). Chain: eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces. All are dev-only and absent from the previous runtime SBOM; verify again in the new SBOM. Deeply nested glob patterns can crash build tooling. npm's suggested major downgrade is not a validated remediation. Recommended disposition is a reviewed supported fix; any exception needs a named security owner, trusted-input restriction, expiry and recheck trigger.

API replay remains proposed **P1 audit integrity**, not demonstrated duplicate financial posting: previous offline historical-source characterization recorded identical approvals increasing decision/audit/event counts 1→2, unchanged approved state, zero invoices/journals, and foreign-owner denial. Current local guard makes repeat counts remain 1, but is not deployed by a web-only release. Reused evidence: `final-checkpoint/replay-review.json`; no new API requests or backend edits.

Caption draft and visual alternative remain review-only: [media review](v2-track-a-media-review.md), `final-checkpoint/human-media-review.html`, `captions-review-only.vtt`, `media-alternative-review.txt`. [Legal drafts](v2-release-disclosure-drafts.md) remain unpublished. No approvals fabricated.

## Decision and next boundary

**NO-GO for production and full final checkpoint acceptance.** Video/auth-test changes are locally ready for review. Obtain the official provider permission/assets and qualifying-use evidence first; this preserves mandatory scope instead of committing an incomplete “final” identity. Once implemented and validated, request explicit approval for the reconciled local checkpoint. Only then produce the final image and present the exact cloud package for separate approval.

The earliest release is gated by external brand/legal/accessibility/security and account decisions, not a new cosmetic pass. Allow several engineering hours after those prerequisites, with at least a 65-minute hosted refresh observation. No defensible fixed production ETA is available until owners confirm these inputs. Preview remains running for owner review. No staging, commits, pushes, publication, deployment, Gemini changes or production mutations occurred.
