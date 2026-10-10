# PR03 — Guided Demo review evidence

Baseline: **51e34222a6108c912eaf0f6cbb44d48d088b764b**, latest fetched main including PR02 (#31). Branch: `feature/ux-v2-guided-demo`. Local worktree started clean. This PR contains implementation and locally captured QA, not a deployed release. No merge or deployment performed.

## Result and scope

`/simulator` previously offered a sample introduction followed immediately by a sign-in action. It now offers an introduction, five interactive authored previews, a debrief and restart. Start demo needs no account. Understand → Prepare → Move → Verify → Start explains readiness, compatible mappings/plan consent, checkpoints/bounded recovery, exact financial checks/settings and onboarding/verified first task. Each screen has one primary action, a compact evidence card, one insight and optional controls guidance. Phase buttons, Next, Previous and restart navigate content only. The current heading receives focus after navigation; no animation or autoplay is added.

The final **Try the Guided Migration** action opens the existing `/sign-in?next=%2Fassess%3Fsample%3Dharbor-light-migrate-demo`. The user explicitly starts assessment after authentication. Existing sample links and all three Demo disclosure anchors are retained. Home and Guide wording now describes the implemented read-only Demo. Public/member navigation, Play, conceptual video and all financial workflows remain unchanged.

Implementation files:

- [Route](../../../apps/web/app/simulator/page.tsx), [guided Demo](../../../apps/web/components/public-surfaces/GuidedDemo.tsx), [authored content](../../../apps/web/components/public-surfaces/demo-content.ts).
- [Scoped styles](../../../apps/web/app/globals.css), [Home wording](../../../apps/web/app/page.tsx), [Guide wording](../../../apps/web/components/public-surfaces/Guide.tsx).
- [Tour tests](../../../apps/web/components/public-surfaces/GuidedDemo.test.tsx), [updated public contracts](../../../apps/web/components/public-surfaces/surfaces.test.tsx).

## Public versus authenticated boundaries

| Public guided Demo | Working synthetic Beta |
| --- | --- |
| Authored static examples, including clearly labeled illustrative USD values | Existing server-authoritative migration and accounting evidence |
| Local React memory; remount/reload starts over | Existing owned durable cloud workspace |
| Navigation buttons only; no approvals, posting, migration writes or success event | Verified identity/owner authorization and explicit decisions |
| Does not read or change a selected migration pointer | Existing authorized reads, financial gates and checkpoints |
| Finishing means completing a preview only | Business Ready · Verified requires a verified first synthetic task |

No alternative calculation, repair, consent or progress engine is introduced. Demo values are neither measured migration results nor predictions of Harbor Light execution. The preview grants no workflow permission and transfers no state or consent. The shared site shell retains its existing identity preparation; the tour itself never uses identity or session hooks. No real provider integration or production data readiness is claimed. Synthetic Beta boundaries, provider neutrality and existing IP notices remain intact. The future five-mission pixel game is excluded; current three-decision Play is untouched.

## Acceptance results

**ACCEPT for PR03 review** — required local checks pass. Existing mandatory CI still governs merge eligibility; this is not a release/deployment approval.

| Criterion | Evidence / result |
| --- | --- |
| Explore five phases without sign-in | Browser traversed all five previews and debrief at four widths; unit test makes identity/session-hook use fail |
| Distinguish preview from Beta | Persistent read-only/synthetic label, sample evidence caption, boundary disclosures and explicit sign-in/assessment handoff |
| First interaction without scrolling | Start action bottom: desktop 349px, tablet 331px, mobile 403px, narrow 393px |
| Compact layout / one primary | All **28** intro/phase/debrief cases: no horizontal overflow, one primary, primary fully in viewport; narrow maximum action bottom 563px within 568px |
| No dead ends | Phase chooser, Next, Previous, introduction return, debrief Back/restart, Home/Play/Learn/Help/Trust/video and authenticated handoff verified |
| Keyboard / semantics | Enter starts, advances, returns and opens native disclosure; focus moves to H1; Tab reaches first phase button; 3px focus ring, 44px+ buttons, 16px body; menu Escape returns focus |
| Correct learning/context links | Five Learn links open/focus the correct retained anchors; three legacy Demo anchors and Guide journey resolve |
| No unauthorized financial operations | Isolated full-tour tests observe zero fetch/XHR/storage writes/window event dispatch; no migration/identity/session imports; production sample deep link remains behind existing sign-in gate |
| Existing authenticated controls unchanged | Protected source files/directories compared with baseline in [validation.json](validation.json); complete frontend suite includes existing workflow/auth/checkpoint regressions |
| Regression checks | Focused 51 tests; full **42 files / 504 tests**; lint, typecheck, production build, repository/link and whitespace checks pass |

[Viewport measurements](viewport-metrics.json) and [browser interaction evidence](browser-checks.json) distinguish actual browser observations from source/unit checks. The local production frontend has no Google configuration: final handoff and existing direct sample link reach the existing sign-in gate with the intended sample destination intact. No sign-in, owned workspace visual validation or live migration mutation was performed. API owner verification and post-login navigation remain source/unit verified, not newly validated live.

## Before and after screenshots

Direct browser JPEG captures, no edits or generated imagery. Before: main baseline served locally in development; after: final local production frontend. These are screenshots of the authored public Demo UI, not genuine financial execution results. System dark appearance, requested dimensions. The inherited local `next start` standalone-output advisory was nonblocking; no runtime/configuration changes made.

| Viewport | Before | Introduction | Verify example | Debrief / handoff |
| --- | --- | --- | --- | --- |
| 1440 × 900 | [Before](before-1440.jpg) | [After](after-intro-1440.jpg) | [Verify](after-verify-1440.jpg) | [Debrief](after-debrief-1440.jpg) |
| 768 × 1024 | — | [After](after-intro-768.jpg) | [Verify](after-verify-768.jpg) | [Debrief](after-debrief-768.jpg) |
| 390 × 844 | [Before](before-390.jpg) | [After](after-intro-390.jpg) | [Verify](after-verify-390.jpg) | [Debrief](after-debrief-390.jpg) |
| 320 × 568 | — | [After](after-intro-320.jpg) | [Verify](after-verify-320.jpg) | [Debrief](after-debrief-320.jpg) |

## Risks, deferrals and rollback

- **P0/P1 implementation blockers:** none found in required local validation. Mandatory CI results must be reviewed before any separately authorized merge; failing gates cannot be bypassed.
- **P2:** formal screen-reader, actual 200% zoom and physical-device studies remain unperformed. Semantic markup, keyboard/focus and responsive CSS were checked; screenshots do not substitute for those studies.
- **P2:** “About 2–3 minutes” is an intended reading duration, not a measured participant result. Comprehension/timing study is deferred; no fabricated five-second or completion metrics.
- **P3:** five-mission pixel game and signed-in workspace redesign remain separately scoped future work, not prerequisites for this PR.

Rollback: revert only this presentation/content/test change to restore the prior Demo introduction. No migration records, approvals, checkpoints, financial settings, owner contracts or infrastructure require rollback. Authored content changes should retain explicit synthetic/illustrative labels. No backend, Docker, CI/CD, dependency, IAM, Firebase or Cloud Run changes.

Approved design input hashes: [design-inputs.json](design-inputs.json). Local checks and unchanged contracts: [validation.json](validation.json).
