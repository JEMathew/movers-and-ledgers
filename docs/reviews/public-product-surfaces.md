# Public product surfaces review

Date: 2026-09-27. Branch: `feature/public-product-surfaces`, baseline `d420c90`.
Method: builder-run Product, Agentic AI, Migration, UX/accessibility, privacy and release lenses;
automated regression gates plus local browser QA. Not an independent audit or human merge approval.

**GREEN for local synthetic public-reference Beta public surfaces.** Not production migration,
public hosting, real customer intake or live support readiness. Final P0: 0; final P1: 0.
No aggregate/vanity rubric score. Core orchestration, financial rules, approval gates and backend
implementation are unchanged. No push, merge or deployment is part of this task.

References: [surface architecture](../architecture/public-product-surfaces.md),
[integrated baseline](beta-v1-integration.md), [release policy](../RELEASE_READINESS.md),
[review severity](../reviewers/REVIEW_RUBRICS.md).

## Delivered scope

Landing: business-first headline, four migration motives, three uncertainty questions, five-phase
journey, trust model, truthful Beta scope and entry links. Product/workspace: real sample entry and
existing-session continuation. Simulator: Harbor Light starts through ordinary Discover/Assess,
not a pre-approved stage demo. Learn: ten contextual modules. Play: bounded three-decision exercise,
with visible unsafe-choice consequences and no workflow writes. Trust: actual read-only activity,
checks, decisions, blockers, tools, timestamps and audit references. Feedback: local structured draft,
validation, explicit safe-context consent and download, not a submitted case. Support: self-service
explanation and original-workflow/Learn/issue-draft links, with no approval or retry powers.

Navigation presents Product, Simulator, Learn, Play, Trust, Feedback and Support. Existing backend
and stage components own the full journey to verified FPU. The only assessment behavior change is
allowlisted sample preselection; ordinary creation remains explicit. No Try Your Data implementation,
new dependencies, Google activation, provider connectors, billing or deployment.

## Findings and re-review

| ID | Severity | Evidence / impact | Remediation / retest |
| --- | --- | --- | --- |
| PS-01 | P1 | Existing middleware discarded the query during sign-in. Simulator's canonical Harbor Light choice would become default Northstar, blocking the advertised complete scenario. | Preserve path + query; allowlist sample preselection without executing. `public-routing.test.ts`, component test, mobile browser Simulator → sign-in → Harbor Light → ordinary assessment. Resolved. |
| PS-02 | P1 | Initial help-aside implementation captured a session on pathname change only. Starting a second assessment on the same path could link to the first session's evidence. | Resolve explicit URL/current pointer at link activation, not mount. `WorkflowHelp.test.tsx` changes URL without remount and asserts the new reference. Resolved. |
| PS-03 | P2 | Native mobile menu remained open across client navigation, obscuring the destination and intercepting entry interactions. Observed in browser. | Close the menu when a link is chosen; component assertion and browser Simulator/Play navigation retest. Resolved. |

Initial actionable findings: P0 0, P1 2, P2 1. Both P1 and the P2 remediated. No unresolved P0/P1.
Examination found no new model authority, financial writes, hidden approval replay, fabricated
completion, uploaded records or automatic feedback transmission. Unknown references fail closed;
failed/expired Trust reads never synthesize a healthy state. Existing IP/reference text and licensing
are preserved; no open-source license was added.

## Automated and browser evidence

| Gate | Final result |
| --- | --- |
| Frontend lint | PASS |
| TypeScript | PASS |
| Frontend suite | 60 passed, including original dialog regressions and 22 new surface/routing/context cases |
| Production build | PASS; 23 pages; no added dependencies. Play route approximately 1.94 kB before shared JS in the initial build. |
| Ruff | PASS, additionally run despite no backend edits |
| Full backend regression suite | 157 passed; inherited Starlette test-client warning only |
| Markdown links | PASS; 75 Markdown files checked for repository-relative file targets. No claim about external availability or all anchors. |
| Whitespace | `git diff --check` PASS |
| Bounded secret scan | PASS; 280 tracked/new text files screened for common credential/private-key patterns (files up to 600 kB; binary excluded). Not an exhaustive security audit. |

Component tests cover required CTAs, public navigation, synthetic disclosures, canonical Simulator
selection without any request, read-only Product continuation, Learn anchors, all Play decisions,
Trust provenance categories and private-field exclusion, 401/404/500/malformed reference handling,
feedback length/consent/context/download behavior, contextual Support, analytics authority, mobile
menu closing, production demo-auth rejection and same-path session-context freshness.

The unchanged integrated backend suite exercises the full Harbor Light journey, controlled failure,
approval/rejection, checkpoint retry, exact reconciliation, configuration, onboarding, verified FPU,
replay, concurrency, no-stage-bypass and forged-event protection. This slice does not repeat a complete
manual browser journey to FPU; it reuses that tested platform and verifies the new entry boundary live.

Live browser QA in local development:

- Landing inspected at 1365×900 dark and 390×844 light; clear CTA hierarchy, no horizontal document overflow.
- Mobile navigation opens by keyboard and closes on selection after PS-03 remediation.
- Simulator passes Harbor Light through demo sign-in, creates ordinary session
  `cac6e06e-1a67-4f0e-b60a-785dbd0c4751`, reaches ASSESSED, and performs no mapping/approval/target write.
- Trust shows that session's actual assessment action/tool evidence and stage, with no mobile overflow.
- Trust → Support → Feedback retains the same session; Feedback shows optional context but excludes it
  from the prepared draft until opted in. Empty submission gives an accessible error; valid draft is
  labelled NOT_SUBMITTED and moves focus to its heading. No draft was submitted to an external service.
- Play completed by keyboard after an unsafe choice showed its consequence; focus moves to each step;
  completion explicitly disclaims migration success. No workspace request or state change.
- Learn's financial-truth disclosure opens with Enter and has a visible solid focus outline.
- Product continuation returns to the same assessed session; desktop/mobile layouts inspected.
- Light/dark toggle and dark persistence after refresh verified. Reduced-motion stylesheet regression
  passes; no new animated sequence was introduced. No claim of live OS reduced-motion testing,
  assistive-technology user research, or broad device certification.

Local servers and temporary browser tab are stopped after verification. Synthetic identifiers above
are ephemeral test references, not durable hosted records.

## Canonical criterion-level review

Scores use the existing 0–4 scales. A 3 is repository evidence for this scope, not independent production
validation. Existing baseline controls are supported by the rerun integrated tests, not reimplemented.
Severity describes remaining gaps. A dash means no new gap in this bounded change; follow-ups remain
explicit. All 23 criteria are considered individually.

### Product Management

Source: [Product Management Rubric](../rubrics/PRODUCT_MANAGEMENT_RUBRIC.md).

| Criterion | Score | Evidence | Gap | Why it matters to MoveBooks AI | Why it matters to user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Problem significance and target user | 3 | Business-first questions, scale/access/connect/visibility; owner/finance journey | No representative research | Avoids generic AI theatre | Explains why migration is useful and hard | P2 | Product owner: representative comprehension study before customer claims. |
| Canonical journey and outcome alignment | 3 | Five phases include Start/FPU; ordinary Harbor entry; 157 backend tests | One synthetic scenario | One coherent platform | No skipped prerequisites | P3 | Expand scenario coverage through existing platform. |
| Scope, non-goals, and beta boundary | 3 | Scope on every surface; production auth test; no live intake | External deployment not assessed | Prevents unsupported promises | No confusion with live provider migration | P2 | Security owner: separate hosting/identity review. |
| User value and actionability | 3 | Contextual help, short Learn, visible Play consequences; browser QA | No usability cohort | Converts uncertainty into safe actions | Clear next step without bypass | P2 | UX owner: test with representative finance operators. |
| Progressive trust and decision ownership | 3 | Public pages read/link only; inherited approval tests pass | Demo identity only | Keeps authority bounded | Choices remain under human control | P2 | Production identity and delegated roles in later phase. |
| Metrics and evidence discipline | 2 | Ten typed future contracts; no fabricated rates or emissions | No instrumentation/baselines | Separates engagement from FPU | No success claims from clicks | P3 | Product/metrics owner: consent, cohorts and telemetry before measurement. |
| Product coherence, business fit, and truthful demo | 3 | Shared primitives, one workflow, no new dependency; bounded Play | No adoption/economics evidence | Avoids a second product engine | Consistent, credible experience | P3 | Product owner: evaluate value and operating burden. |

### Agentic AI

Source: [Agentic AI Rubric](../rubrics/AGENTIC_AI_RUBRIC.md).

| Criterion | Score | Evidence | Gap | Why it matters to MoveBooks AI | Why it matters to user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agent necessity and ownership | 3 | No new agents; Trust projects existing agent/tool records | Managed runtime still future | Avoids agent-count theatre | Clear action ownership | P3 | AI owner: evaluate runtime separately. |
| Orchestration and workflow state | 3 | Read-only projection; unknown state rejected; PS-02 test; integrated regressions | Local process only | One lifecycle authority | Help cannot rewind or complete work | P2 | Durable transactional runtime before production. |
| Tool authority and least privilege | 3 | New surfaces make GET only; Play/Feedback/Support no fetch | Production IAM not added | Protects deterministic controls | A lesson or support link cannot write records | P2 | Security/platform owner: production IAM gate. |
| Evidence, provenance, confidence, and explanations | 3 | Rule-backed/AI/human distinction; actual refs; private-field exclusion test | Bounded 30-row sections; no live model calibration | Makes explanations inspectable | Evidence differs from recommendation | P3 | Trust/AI owner: filtered trace API, calibrated model evals later. |
| Human governance and escalation | 3 | Decisions/attention/escalations projected; original workflow actions only | No live human support escalation | Preserves accountable decisions | No false responder or self-approval | P3 | Operations owner: staffed escalation before real customers. |
| Failure handling, idempotency, and safe stopping | 3 | Read errors/expired state honest; no automatic demo fallback; retry regressions | No durable sessions | No accidental new journey | Failure does not look like success | P2 | Platform owner: durable storage/recovery before deployment. |
| Security, privacy, and auditability | 3 | UUID validation, explicit projection, opt-in draft, unknown fields removed | Full existing session response in authorized browser; local draft text not automatically redacted | Minimizes unintended disclosure | User sees exactly what they choose to save | P2 | Dedicated minimized endpoint and secure intake before customer data. |
| Evaluation, fallback, and runtime portability | 3 | Surface adversarial tests + existing 157 backend tests; no model dependency | No live Gemini/ADK evaluation | Works without a provider runtime | Predictable demonstration | P3 | Separate Google-native evaluation gate. |

### Migration & Onboarding

Source: [Migration & Onboarding Rubric](../rubrics/MIGRATION_ONBOARDING_RUBRIC.md).

| Criterion | Score | Evidence | Gap | Why it matters to MoveBooks AI | Why it matters to user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source, target, and canonical boundaries | 3 | Existing source/adapters untouched; canonical scenario selected by ID | Synthetic adapters only | Provider-neutral reuse | No real books silently connected | P2 | Migration owner: adapter conformance before provider support. |
| Readiness, planning, and dependencies | 3 | Ordinary discovery; no demo loader; state-driven continuation | No complex real-data claim | Preserves prerequisite chain | No pre-approved shortcut | P3 | Expand representative fixtures later. |
| Mapping and accounting compatibility | 3 | Existing tests preserved; Play teaches meaning vs names | Play is illustrative, not a validator | Controls remain server-owned | Education cannot authorize a mapping | — | Preserve server tests when adding scenarios. |
| Human approval and migration handoff | 3 | No new decision endpoints; simulated entry performs no approvals | Demo user only | Separates entry from authorization | Decisions remain explicit | P2 | Production role model before real writes. |
| Blockers, unsupported items, and exception ownership | 3 | Support explains safe action; Trust displays recorded unresolved failures | No staffed case ownership | No false repair promises | Clear stop and return route | P3 | Managed support intake before customer use. |
| Lineage, evidence, and audit integrity | 3 | Decision IDs/time/evidence, checks, event refs; hidden attributes excluded | Not durable immutable audit | Inspectable reasons | Can see who did what and why | P2 | Durable minimized audit API before production. |
| Execution, validation, and recovery boundary | 3 | No new financial operations; existing full regression suite passes | No production recovery proof | Avoids destabilizing working Beta | Retry and checks remain guarded | P2 | Production recovery assessment separately. |
| Onboarding and verified First Productive Use continuity | 3 | Start/FPU explicit in every journey summary; verified outcome definition | No representative customer outcomes | Completion means productive use | File transfer is not presented as business readiness | P2 | Representative task/outcome validation later. |

## All 17 release-readiness areas

Each GREEN below is bounded to these local synthetic surfaces; no area is silently counted as production-ready.

| Area | Assessment and limitation |
| --- | --- |
| User | GREEN: entry/help/learning exercised; representative research remains follow-up. |
| Customer outcome | GREEN: routes toward verified FPU, never equates Play or transfer with completion. |
| Business | GREEN: no paid resources/dependencies or unmeasured adoption claims. |
| Product | GREEN: eight surfaces, coherent five-phase navigation and real Beta reuse. |
| Migration correctness | GREEN: backend unchanged, complete regression suite rerun. |
| Agent behavior | GREEN: new surfaces cannot invoke agent tools or assume orchestration authority. |
| GenAI quality | GREEN for truthful fallback disclosure; no new generated content/runtime claim. |
| Deterministic quality | GREEN: existing checks remain authoritative and tests pass. |
| Safety/trust | GREEN: no approval/retry bypass, private reasoning fields excluded, truthful unavailable states. |
| Security/privacy | GREEN for local synthetic scope: reference validation and opt-in draft; production controls deferred. |
| UX/accessibility | GREEN for exercised themes, viewports, keyboard, focus, native disclosures and semantic status. |
| Reliability | GREEN for bounded read-error handling; no durability or always-on service claim. |
| Engineering quality | GREEN: lint/typecheck/tests/build/link/whitespace/bounded scan gates. |
| Platform architecture | GREEN: shared components and real workflows; no parallel migration engine. |
| Evaluation | GREEN: required surface cases plus inherited integration regressions; author review limitations declared. |
| Feedback/support | GREEN for explicit local-draft and self-help scope; no false submission, support queue or SLA. |
| Demo readiness | GREEN: public entry demonstrably reaches real Harbor discovery, with no hidden prior approvals. |

## Remaining owned follow-ups

| ID | Severity | Owner / gap / mitigation and trigger |
| --- | --- | --- |
| R-01 | P2 | Engineering/security: inherited local identity, ephemeral state, full session response and non-durable audit. Synthetic local use only; minimized trace API, identity, retention and durable operations required before customer exposure. |
| R-02 | P2 | Engineering: inherited Next.js/PostCSS advisory. No deployment; separate dependency/security review before hosting. No vulnerability-clear claim. |
| R-03 | P2 | Product/UX: representative user research, screen-reader users and broader devices not tested. Current browser/component evidence is bounded; study before broader usability/completion claims. |
| R-04 | P3 | Product/operations: managed feedback intake, automatic redaction, triage, analytics instrumentation and baselines are unimplemented. Drafts and contracts are explicitly labelled; activate only after privacy/operating review. |
| R-05 | P3 | Trust/UX: latest-30 trace presentation and topic-density refinements. Counts disclose limits; use existing authorized session API for full local trace; add filtering/pagination and clearer text before production. |
| R-06 | P3 | Engineering/AI: inherited Starlette warning and live Gemini/managed ADK integration remain separate maintenance/runtime work; no live runtime is advertised. |

Rollback: normal reviewed revert, never reset public history. Human decides publication and merge.
Recommended next feature phase: Try Your Data with explicit bounded ingestion/privacy controls,
then Google-native runtime integration, live Gemini/ADK evaluation, and final product polish/demo
packaging. None is silently activated by this branch.
