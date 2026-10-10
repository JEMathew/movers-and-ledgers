# PR06 — Contextual Evidence, Help & Recovery

**ACCEPT for review.** Local acceptance passes; mandatory CI still governs any separately authorized merge. No merge or deployment was performed.

Baseline: **9c8e88d4ca01d1873240b3c1d6c19a65d03da518**, fetched main after one GitHub API confirmation that PR34 merged at 2026-10-10T20:55:53Z. Initial working tree clean. Branch: `feature/ux-v2-evidence-recovery`.

## Audit and resulting behavior

| Existing entry point / finding | PR06 result |
| --- | --- |
| PR05 task utilities already expose Help and Evidence with the actual phase/session | Retained. No duplicate task toolbar or workflow redesign. |
| `/trust` public principles and legacy session evidence share a route; evidence displayed long lists and only the latest 30 rows per group | Public Trust remains public. Explicit `view=evidence` and legacy session links remain supported. Four category filters page all supplied redacted records, eight at a time, with actual actor, status, time, tool and audit references in disclosures. |
| Evidence and task actions could be conflated; partial snapshots and unknown provenance/outcomes need explicit labels | Evidence approves nothing. Unknown provenance is unsupplied; missing first-task check outcome is unconfirmed. Counts describe supplied rows, not complete history. Current phase controls the return destination; exact financial checks and invoice consent stay in Verify/Start. |
| Supplementary Help links repeat generic navigation, below task content | One phase-specific disclosure adds a short instruction and canonical Guide, Learn, Evidence & Results and Help links. Existing top-of-task Help remains immediately accessible. |
| Help selected issue could send a configuration/invoice approval back to Prepare; Learn lost original context | Approval issues return to the original phase. Changing the issue keeps a separately labeled original-task return. Allowlisted session/stage context reaches Learn and unsent feedback; same-page navigation refreshes context. |
| Recovery explanation needs to distinguish a failed response from a failed financial write | Optional short disclosure requires authoritative reread before permitted same-intent/checkpoint recovery. Never automatically retries, replaces a migration, creates a posting key or assumes success. |
| Advice explanation crowds the task and may be mistaken for consent | Recommendation, source/fallback, confidence warning, uncertainty and plain next step remain visible. Supplied explanation/alternatives and evidence/context references expand separately. Unavailable advice never renders a recommendation. No automatic request or new agent/model behavior. |

Approved design inputs and PR01–PR05 evidence hashes: [design-inputs.json](design-inputs.json). The original roadmap called this contextual work PR10; the user consolidated original phase PR05–PR09 into actual PR05, making this the authorized PR06. This numbering adjustment adds no scope.

## Acceptance and control evidence

| Criterion | Result |
| --- | --- |
| Financial evidence vs agent advice vs human decisions | Distinct categories/provenance and supplied values. Rejections, actor/time, reference IDs and tools remain accessible. No hidden reasoning, raw financial payload, fictional progress or inferred completion. |
| Pending approvals and reconsideration | Mapping count is supplied/unknown explicitly. Return opens the actual task. Guide reconsideration anchor opens and receives focus; original rejection/history and separate owner decision remain required. No approval defaults or decision handlers changed. |
| Failed/expired/unavailable reads | Tests cover 401, neutral 403/404, 500/network, invalid/unsupported/empty references, same-read refresh, identity/selection changes and stale response discard. No write replay or sample substitution. Browser checked unavailable reference recovery. |
| Contextual navigation | All five phase destinations, Help issues, original task, canonical Guide/Learn/Trust anchors, validated UUID transfer and unsafe-context removal pass tests. Browser exercised Help → focused Learn recovery → original paused Move, Guide reconsideration, public Trust and evidence → original POSTED Start checkpoint. |
| Financial state unchanged by browsing | [Five phase snapshot hashes](workflow-invariants.json) unchanged after help/evidence browsing and one explicit deterministic fallback advisory request. Existing approval, retry, exact-money, checkpoint, identity and owner-isolation regressions pass. Browser performed no financial action. |
| Keyboard and responsive | Category select, Previous/Next, native record/recovery disclosures and contextual links work by keyboard. Page changes focus the heading with a 3px outline. All eight default after-cases have one H1, one primary action fully in viewport and no horizontal overflow at 1440, 768, 390 and 320px. |
| Local checks | Focused **59 tests / 4 files**, full frontend **583 tests / 45 files**, existing financial/authorization/recovery **242 tests**, lint, typecheck, production build, repository Markdown/credential scan and whitespace pass. One inherited Starlette/httpx deprecation warning; no unrelated dependency fix. |

[Validation](validation.json), [browser interactions](browser-interactions.json), [viewport measurements](viewport-measurements.json), [changed files](changed-files.txt), [screenshot manifest](screenshots.json).

Commands from `apps/web`: `npm test -- components/public-surfaces/evidence-recovery.test.tsx components/public-surfaces/ReasoningAdvice.test.tsx components/public-surfaces/WorkflowHelp.test.tsx components/public-surfaces/public-content.test.tsx`; `npm test`; `npm run lint`; `npm run typecheck`; `npm run build`. Existing backend test filenames are recorded in validation.json; they were run locally with the existing Python environment. From root: `python scripts/repository_checks.py` and `git diff --check`. No Docker, cloud operation or CI workflow modification.

## Before / after UX evidence

Genuine browser JPEGs, no edits or generated screenshots. Before: exact main baseline served locally. After: local changed frontend with actual disposable synthetic in-memory API in demo identity mode, deterministic-only. These are not live cloud authenticated screenshots. Dimensions and SHA256 recorded in the manifest.

| Screen | Desktop 1440 × 900 | Mobile 390 × 844 |
| --- | --- | --- |
| Evidence | [Before](before-evidence-1440.jpg), [after](after-evidence-1440.jpg) | [Before](before-evidence-390.jpg), [after](after-evidence-390.jpg) |
| Help | [Before](before-help-1440.jpg), [after](after-help-1440.jpg) | [Before](before-help-390.jpg), [after](after-help-390.jpg) |

Additional captures: [evidence tablet](after-evidence-768.jpg), [evidence 320px](after-evidence-320.jpg), [Help tablet](after-help-768.jpg), [Help 320px](after-help-320.jpg), [older actual records](after-older-evidence-1440.jpg), [uncertain-result guidance](after-recovery-guidance-320.jpg), [fallback advisory boundaries](after-advisory-390.jpg), [unavailable evidence](after-unavailable-320.jpg), [unchanged POSTED checkpoint](after-posted-checkpoint-390.jpg).

Default evidence visible main words fall **1,216 → 239**. Desktop document height **16,406 → 2,381px**; mobile **18,927 → 2,553px**. The baseline mobile evidence overflowed to 677px; after width is 390px. Evidence primary action bottom is 405px desktop / 417px mobile. Help grows **140 → 168 words** and approximately 200–280px because it adds contextual guidance and canonical references; its primary action remains at 510px desktop / 561px mobile, including 589px in the 320 × 700 viewport. These are DOM measurements, not participant comprehension or completion metrics. Closed evidence and recovery details remain available rather than being deleted.

## Boundaries, risks and deferrals

No backend, agent architecture, financial workflow, authentication contract, owner authorization, dependency, Docker, CI/CD, infrastructure or cloud change. Existing phase task components, consent, decision endpoints, financial checks and original posting keys are unchanged. No hosted uploads, new agent, Gemini activation, provider connection or game feature. Synthetic Beta, independent/provider-neutral positioning and IP notices remain.

**P0/P1:** no local implementation blocker found. Required CI cannot be bypassed and is separate from this local acceptance recommendation.

**P2:** live cloud signed-in visual review remains deferred under the user's source-verification preference; source/tests cover identity and ownership. Formal screen-reader, physical-device, zoom and participant comprehension studies were not performed. Browser keyboard/semantics/responsiveness do not substitute for those studies.

**P3:** evidence is a supplied snapshot, not a complete-history service. Existing projection excerpt limits and latest-validation-report scope are explicitly disclosed. Historical enum labels remain in actual evidence; financial consent and expanded audit detail can require scrolling. Help is self-service with no staffed response-time promise.

Rollback: revert frontend presentation/content/tests only. Never rewrite decisions, financial evidence or recorded checkpoints. Stop at this one reviewable PR; no automatic merge or deployment.
