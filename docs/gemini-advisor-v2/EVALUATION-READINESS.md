# Track B — final evaluation readiness, October 20, 2026

**GO for the existing local deterministic demonstration and recorded-inference evidence review. NO-GO for combined integration under the current UX acceptance condition, and NO-GO for live activation.** No additional model calls, real-ledger operations, cloud writes or Track A changes occurred. No new product defect was established that warrants changing the validated runtime in this scoped review.

Branch: `feature/gemini-advisor-v2`. Starting documentation HEAD: `c5cdaeff2f379289d12a613d12e5696624173ce8`; runtime candidate remains `ae8535acc71e78752b508ef57e597d9baaf426a7`. This update changes evidence documentation only. The final receipt records its commit and exact paths. All newer commits are preserved.

## What works, and what the evidence establishes

| Capability | Actual state | Boundary |
| --- | --- | --- |
| Discover/Assess and Prepare | Synthetic source discovery, readiness, mapping proposals and explicit analysis | Readiness and mapping scores are deterministic; paired analysis is limited to the supported clearing-account case |
| Advisor | Evidence-linked observation, inference, recommendation, rationale and uncertainty | One genuine recorded Gemini case; current preview uses labeled deterministic fallback |
| Reviewer | Separate provider/session and independently projected source facts; Advisor claim treated as untrusted | Same model family; procedural independence does not establish statistically independent errors |
| Move, Configure and First Product Use | Existing deterministic orchestration, recovery, validation, configuration and onboarding guidance | Five-phase HTTP scenarios pass; no external accounting integration or newly demonstrated live reasoning in each phase |
| Human decision/audit | Explicit approve/reject, owner attribution, deterministic gates and replay protection | Analysis itself changes neither mappings nor financial state; browser demonstration rejected the ambiguous mapping |
| Failure, identity and isolation | Invalid/empty evidence, disabled mode, timeout, stale account/workspace/mapping results and negative authorization tests | Local/mock evidence; hosted A/B identities and durable deployment acceptance remain open |
| Offline Judge | 18 expected contract decisions; 23 scripted service scenarios | Deterministic validation, not another model or an accounting-accuracy benchmark |
| Request Source Evidence | Reviewed proposal available; persistence workflow not implemented | OPEN pending permissions, durability, retention and stale-request decisions; no functional action exposed |

Existing local preview: **http://localhost:3321/workspace**. Select the Harbor Light sample, assess readiness, open Prepare and select Misc Clearing, explicitly run analysis, inspect separate role results and missing purpose, then make a separate human decision. The existing demo state already includes a recorded rejection. No result is presented as newly generated Gemini output. The end-to-end five-phase synthetic scenario is test evidence; the browser exception journey intentionally stops before financial execution.

The paired API contract remains `POST /v1/migration-sessions/{session_id}/analysis/mapping/{mapping_id}` with `{request_id: UUID, confirmed: true}` and verified server-side identity. Preserve separate Advisor/Reviewer records, mapping and source references, uncertainty, `human_approval_required: true`, `financial_authority: false`, and independent approve/reject routes. Consume the generated schemas and existing frontend parser; no schema changes are needed. Preserve the shared advisory request hook and paired panel identity protections. [Exact handoff](HANDOFF.md); [unimplemented evidence-request proposal](REQUEST-SOURCE-EVIDENCE-PROPOSAL.md).

## Evidence verification and tests

Fresh checksum verification passed for all **375 runtime source files**, the **63 original artifacts**, the **38 preserved image-package files**, and the source hashes associated with the last validation. The adapter, roles, guards and recorded fixture are unchanged. Previously passed results therefore remain applicable: **161 unique backend, 129 frontend, 18/18 offline contract and 23/23 scripted cases**, plus TypeScript, affected ESLint/Ruff and exact-image smoke checks. These suites were **not rerun or relabeled as fresh runs**.

New read-only checks: source/artifact integrity, dependency runtime presence, advisory alias reconciliation, exact-image process controls and exported filesystem metadata. Runtime UID 65532, `NoNewPrivs=1`, zero effective capabilities and protected hardlinks were observed with networking disabled. An unprivileged filesystem traversal encountered one permission error and **failed its completeness assertion**; its output and stderr are retained. A separate complete 14-layer archive metadata inspection found no setuid/setgid regular files and no `nscd`-named paths among 24,738 final paths. This supplements the failed traversal; it does not turn that attempt into PASS. No exploit payload, generation path or cloud authentication was exercised.

Receipts: `evidence/evaluation-readiness/`. Original tests, browser evidence and immutable source hashes remain under `evidence/track-b/`. Existing local image archives/SBOMs/scans remain at `/Users/jincenmathew/Downloads/Intuit/movebooks-track-b-release/ae8535a-20261020`; no rebuild was necessary.

## Security applicability — no suppression or risk acceptance

The API scanner still reports **14 Medium, 3 Low, 14 Unknown matches**. Reconciling authoritative advisory identifiers shows **31 package/advisory rows across seven distinct CVE families**. The 14 Unknown rows are GHSA aliases of already-listed CVEs, not additional independent vulnerabilities. Original severity and findings are retained.

| Finding family | Observed exposure / applicability | Disposition |
| --- | --- | --- |
| CVE-2026-87910 / GHSA-rj44-3777-mh5x: tar extraction filter | No `tarfile` import in packaged first-party Python source; no archive-extraction feature in the reviewed API | No demonstrated application path; dependency/transitive paths are not exhaustively proven absent. Base remediation remains open |
| CVE-2025-15367: POP command injection | No first-party `poplib` import or mail-client feature | No demonstrated application path; retain CPE match pending vendor/security disposition |
| CVE-2026-12345: temporary-directory cleanup race | No first-party `tempfile` import in packaged application; unprivileged process, no customer-controlled filesystem tree in synthetic scenario | Local attacker/write-access prerequisites not demonstrated; SDK/transitive use and future uploads are not certified safe |
| CVE-2026-8674 / GHSA-qghr-qhfc-4hxp: resolver search-list assertion | Resolver is relevant to outbound HTTPS. Local image probe had no long search domain or LOCALDOMAIN override | Configuration-dependent runtime exposure remains OPEN; local Docker resolver is not evidence of deployed DNS safety |
| CVE-2026-89092 / GHSA-gwqp-9qgw-c5pv: nscd response handling | No nscd-named path in final image; application starts Python/Uvicorn, not a caching daemon | Attack prerequisite absent in this artifact; no host-wide conclusion |
| CVE-2026-86805 / GHSA-fmf4-pr35-46c2 and CVE-2026-95818 / GHSA-h8x4-734c-9753: loader privileged execution | No setuid/setgid regular binaries in final image; local probe unprivileged, capabilities dropped, no-new-privileges, hardlink protection | Privileged-execution prerequisite absent for this image/probe configuration; deployment controls still need verification |
| GHSA-vfj7-8cjw-p6xm / CVE-2026-93687: braces | Five affected lockfile nodes, all `dev: true`; none found in the exact web runtime SBOM. ESLint glob configuration is checked-in, not supplied by an accounting API request | **High build-tool finding remains OPEN.** Untrusted build/PR glob input can matter; no runtime remote exploit path established. No patched version listed; no forced Next downgrade or waiver |

Primary references: [CPython tar filter issue](https://github.com/python/cpython/issues/157265), [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [loader race alias](https://github.com/advisories/GHSA-fmf4-pr35-46c2), [nscd alias](https://github.com/advisories/GHSA-gwqp-9qgw-c5pv), [loader overflow alias](https://github.com/advisories/GHSA-h8x4-734c-9753), [resolver alias](https://github.com/advisories/GHSA-qghr-qhfc-4hxp), [tar alias](https://github.com/advisories/GHSA-rj44-3777-mh5x). The retained Grype payload contains vendor versions, match rules and descriptions. Some direct vendor pages were unavailable; no missing advisory data is treated as a negative finding.

These are bounded applicability conclusions, not a penetration test or security waiver. No confirmed new Track B P0/P1 application exploit was established. Several base fixes are reported as available; release engineering/security must select supported patched digests, rebuild, validate and disposition remaining findings before release. The current web image has no reported matches, which does not waive the development-chain High.

## Inference governance and genuine evidence

October 18 submission materials are historical. The real evaluation occurred **October 20, 17:18:40–17:18:49 IST** (11:48:40–11:48:49 UTC), after that submission. Local deterministic demonstrations and this review are separately dated addenda, not evidence that every capability was live in the submission.

The original bundle SHA-256 remains `b87d0537e5b74203236b66b63379f263a062d4f756cc2b5b5679f69363f313f7`. Vertex project `movebooks-ai`, model/returned version `gemini-3.5-flash-lite`, global endpoint, LOW thinking. Four attempts consumed; **zero remain**. The real authorization ledger was not opened.

Advisor escalated absent business purpose. Reviewer independently accepted investigation while challenging the mapping. Agreement on escalation is not approval of the target account. Raw self-reported confidence remains in immutable outputs as uncalibrated model content; it is not an accuracy statistic or financial authority.

Reported input **5,207**, candidate output **557**, known-component estimate **$0.0029546**. Thinking tokens are missing; countTokens was 825 lower than reported input; complete billable cost remains UNVERIFIED. Transport latency sum **4,580 ms** and Advisor application latency **6,303 ms** are separate measurements; Reviewer application latency was not retained. No new score, ROI, financial-accuracy claim or performance improvement is asserted.

Application controls already include explicit live authorization, owner/global call reservations, bounded provider behavior and safe fallback. Settings reject live reasoning and synthetic analysis in staging/production; default mode is deterministic. The application's monetary reservation is operator-configured and does **not** prove counted-input spend coverage. The 50,000-token/four-call/$0.20 evaluation guard is harness-only and consumed, not a UI budget. Application counted-input/cost acceptance, durable deployed control checks and complete usage telemetry remain live-activation blockers. They are not bypassed by this report.

## Judge-ready review route

| Criterion | Evidence to show | Honest limitation |
| --- | --- | --- |
| Technical merit / GenAI — 40% | Real Vertex tool loop, separate source-grounded roles, validated contracts, guard provenance and negative tests | One real case; incomplete cost/latency coverage and no live application activation |
| Problem alignment / impact — 25% | Accountant resolving ambiguous legacy clearing account; refusing to confuse type compatibility with business purpose | No measured customer savings or accountant-labeled broad accuracy |
| Innovation / creativity — 25% | Reviewer agrees with escalation yet challenges mapping; deterministic rules retain financial authority | No comparative novelty benchmark; evidence-request persistence remains open |
| UX / solution design — 10% | Explicit five-phase flow, separate results, missing evidence, safe fallback and audited human decision | Standalone deterministic browser evidence; refreshed combined/mobile/hosted acceptance pending |

The local judge package includes original real outputs and their source bundle, deterministic reports, concise test provenance, actual screenshot and checksums. It contains no generation runner, credentials or executable authorization. No official or newly estimated judging score is provided.

## Cross-track gate, blockers and effort

Track A is now committed at **`4178e9784cef827af9d87021401971c109b72f86`**, branch `feature/v2-landing-final`: the exact 19-file local checkpoint exists. This supersedes the earlier “branding uncommitted” status. Three unrelated tracked workflow/smoke modifications remain. Its authoritative owner-scope matrix still marks final acceptance BLOCKED; post-commit exact-artifact reconciliation was not available at this readback. A committed local checkpoint is not inferred to be an explicitly accepted combined-integration baseline. Under the user's acceptance precondition, no integration worktree or branch combination occurred.

| Gate / owner / priority | Why it matters: accountant → judge → Intuit product leadership | Effort after prerequisites |
| --- | --- | --- |
| Accepted immutable UX handoff / Track A + release owner / integration gate | Stable experience → source-bound demo → cross-team release accountability | External decision/readiness; then 4–8 engineering hours for combined validation |
| High build-tool disposition and base findings / security + release engineering / P1 security gate, not proven runtime P1 exploit | Service availability → defensible security evidence → supply-chain risk ownership | 0.5–1 engineering day for supported remediation/revalidation; no patch ETA promised for braces |
| Hosted identity, workspace isolation and durable controls / identity/data + backend/release owners / P1 live gate | No tenant leakage → real auth evidence → trust and operational containment | 1–2 days with approved synthetic accounts/environment; no cloud work currently authorized |
| Application input/cost policy and usage completeness / Track B + operator / P1 live gate | Predictable operation → honest inference accounting → bounded unit economics | 1–2 days plus separately authorized validation; never reuse consumed ledger |
| Durable evidence workflow / product, accounting, security, Track B / retained functional gate | Resolve missing purpose → complete journey → durable exception ownership | Contract review after combined validation, then 2–4 days implementation/tests |
| Broader financial-quality and full accessibility acceptance / accounting + accessibility + release owners / beta gate | Correct, usable decisions → measured quality rather than one-case extrapolation → accountable migration success | 1–2 days test setup plus reviewer time and fresh inference authorization where needed |

The existing local mapping-decision guard rejects repeated final decisions; unchanged tests verify one audit entry and HTTP 409 on replay. This is local source evidence, not proof that an older deployed API contains the guard. The separately reported deployed replay risk still requires backend/release-owner disposition at the exact deployment gate.

**Restricted beta retaining all approved scope: approximately 6–10 engineering days after an accepted UX handoff and prompt contract/security/account decisions**, with independent work overlapping. No reliable calendar date exists while those external decisions lack dates. This is not permission to omit the evidence workflow, activate inference or deploy. The smallest next cross-track action is explicit acceptance of the immutable UX baseline and its source/artifact receipt; then combined deterministic validation proceeds before the evidence-request contract review, as the owner selected.
