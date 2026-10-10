# PR04 — Signed-in migration home and state-aware navigation

Implemented from the five approved local IA/UX v2.0 artifacts, identified in [design-inputs.json](design-inputs.json), and the PR04 implementation prompt. Previous evidence: [PR01](../pr01/README.md), [PR02](../pr02/README.md), [PR03](../pr03/README.md).

Baseline: `472045680081c29668f0286bbbb5bf48b8a08da7`, latest main at task start. GitHub API confirmed PR #32 merged. Branch: `feature/ux-v2-member-home`. Initial worktree was clean.

## Result

The current task and its single primary navigation action now appear before attention, five-phase progress and contextual details. The original nine operational steps remain available in a closed disclosure, with unchanged cross-page projection. No migration action runs from the home.

- Failed reads offer same-reference refresh; 401 offers sign-in to the safe intended destination. 403/404 share neutral unavailable wording. Invalid/unsupported/foreign/non-synthetic evidence cannot replace a selected migration or claim progress.
- Verified identity/reference changes remount the workspace consumer. Old responses cannot repopulate the home or adopt a different selected pointer. Existing identity-provider, token-verifier, owner-authorization and confirmed sign-out contracts are unchanged.
- The validated selected reference remains in every task/evidence/help link. An explicit UUID reference form and a copyable owned link support return visits without inventing a workspace collection API.
- Compact Understand → Prepare → Move → Verify → Start uses authoritative status and supplied evidence. Missing readiness details do not infer completion; missing mapping counts do not infer approval eligibility. No percentages appear. Pending phases have no forward navigation link.
- Mapping decisions, recovery/issues, financial verification and results use the original governed routes. First-task continuation does not guess an invoice/posting checkpoint absent from the redacted snapshot. Verified results explicitly open Trust evidence mode.
- The PR01 verified member shell remains My Migration/Play plus Help/Account, with Demo/Learn/Trust in Account. Current progress and contextual Help are workspace utilities, not added top-level stage menus. Noncompact Google entry is the page primary action; the header remains a utility.
- One synthetic-Beta notice, readable 16px home content, 44px controls, capped attention previews, native disclosures and visible focus reduce density. Expanded operational history wraps in the page flow without a horizontal scroll container.

## Verification boundary

**Browser verified:** local Next frontend, local demo entry cookie and read-only synthetic redacted intake-trust fixtures. Before images use an isolated archive of the exact baseline; after images use this implementation. These are genuine browser captures, not mockups or the deployed public Beta. The header visible in captures is the local demo/public shell, not the Firebase verified member header.

**Source/tests verified:** verified member navigation, Google entry/redirect/sign-out, unverified identity gate, immediate private-view removal, account/reference changes and late responses, all 26 existing workflow enums, missing/failed/unknown projections, same-reference refresh, migration-link copy/fallback, no home mutation, and unchanged operational journey parity across all stage pages.

**Not exercised:** live Google authentication, actual live owner workspaces, cloud API, financial writes, full golden-engine execution, deployment or Docker. Browser clicks confirm destinations and reference continuity; detailed stage contracts are covered by existing frontend fixtures/tests rather than the redacted home fixture API.

## Acceptance

| Journey | Evidence / result |
| --- | --- |
| A. First entry → sign in → start | Entry/Google tests; empty local home offers explicit sample entry with no session request or created progress. |
| B. Return → resume | Explicit reference form browser verified; successful deep-link adoption/remount tests; selection never adopts a failed read. |
| C. Pending decision | Browser pending-mapping fixture; all approval/mapping count tests; review navigation does not give consent. |
| D. Blocked/recovery | Browser recovery, validation-blocked and unavailable fixtures; all four blocked statuses, paused/retry states tested; no restart/retry inferred. |
| E. Configuration/onboarding | Browser CONFIGURED home and route handoff; VALIDATED/CONFIGURING/review-required/onboarding/prerequisite enums tested. |
| F. Completion | Browser server-status fixture and explicit evidence route; verified FPU enum tested; synthetic result only. |
| G. Play/Learn/Help | Browser Play/help context; verified member shell and Account exploration tests; unchanged links checked. |
| H. Sign-out/public | Existing identity/account-shell regressions plus immediate home consumer teardown tests. No live sign-out claim. |

Full frontend: **539 tests / 43 files passed**. Focused home, continuity, identity, account-shell and cross-page tests: **195 tests / 7 files passed**. Lint, TypeScript and production build passed. Repository Markdown/credential-pattern and whitespace checks are recorded in [validation.json](validation.json).

| Viewport | Recovery CTA bottom | Page overflow |
| --- | ---: | --- |
| 1440 × 900 | 287px | None |
| 768 × 1024 | 273px | None |
| 390 × 844 | 289px | None |
| 320 × 700 | 346px | None |

At 390px the baseline CTA bottom was 884px, below the first viewport; the after CTA bottom is 289px. Document height changed from 1449px to 1205px, including the unchanged footer. Measurements: [baseline](baseline-measurements.json), [after](viewport-measurements.json), [state cases](state-measurements.json), [route handoffs](browser-handoffs.json). One H1 and one primary home action; no progress on empty/error. Browser keyboard Tab verified a visible 3px focus outline; Enter toggled both native disclosures. Expanded 320px operational history had no horizontal overflow or inner horizontal scroll container.

## Screenshots

| Screen | Before | After |
| --- | --- | --- |
| Recovery desktop | [1440](before-recovery-1440.jpg) | [1440](after-recovery-1440.jpg) |
| Recovery mobile | [390](before-recovery-390.jpg) | [390](after-recovery-390.jpg) |
| Responsive recovery | — | [768](after-recovery-768.jpg), [320](after-recovery-320.jpg) |
| Approval / Move complete | — | [Approval](after-approval-1440.jpg), [Verify](after-verify-1440.jpg) |
| Setup / FPU | — | [Onboarding](after-onboarding-1440.jpg), [In-progress task](after-first-task-1440.jpg), [Verified](after-verified-1440.jpg) |
| Blocked / empty / unavailable | — | [Blocked](after-blocked-1440.jpg), [Empty](after-empty-390.jpg), [Unavailable](after-unavailable-390.jpg) |
| Mobile phase history | — | [320 expanded](after-progress-expanded-320.jpg) |

## Scope, limitations and deferred backlog

**P0/P1:** none demonstrated in local PR04 validation. Required CI remains authoritative for merge eligibility; never bypass a failing security gate.

**P2:** live authenticated visual validation remains unperformed, as requested. The redacted read has no business name or FPU checkpoint; the home displays a reference and routes to the existing detailed task. A richer workspace listing or resume contract requires separately approved backend work.

**P3:** existing task-page density, help origin-return refinements and evidence paging remain in their approved later PRs. Keep older nine-step operational terminology inside its compatibility disclosure until those task pages are redesigned.

No deviations from the PR04 boundaries. No application engine, backend, auth verifier/provider configuration, infrastructure, Docker, CI, runtime dependencies, cloud resources or deployment changed. PR05 was not started. Rollback restores frontend presentation while preserving ownership checks, selected-reference validation and late-read isolation.

Recommendation: **ACCEPT for PR04 review**, subject to normal required CI and human review. No automatic merge or deployment.
