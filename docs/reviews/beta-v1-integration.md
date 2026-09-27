# Integrated Beta V1.0 hardening review

Date: 2026-09-27. Branch: `feature/beta-v1-integration`, based on merged `85d4756`.
Review target: this hardening commit and its complete synthetic public-reference journey.
Method: builder-run formal reviewer lenses, executable adversarial tests and live browser review;
not an independent human approval, external audit or production certification.

**GREEN for synthetic public-reference Beta V1.0.** Initial P0: 0; initial P1: 4;
all four P1 findings remediated; final P0: 0; final P1: 0. Remaining P2/P3 below are non-blocking
only for this bounded local synthetic scope. Nothing is pushed, merged or deployed by this review.

References: [architecture](../architecture/beta-v1-integration.md),
[release policy](../RELEASE_READINESS.md), [rubric framework](../reviewers/REVIEW_RUBRICS.md),
[prior Onboard/FPU review](onboard-fpu.md). Canonical rubric/reviewer wiring is unchanged:
Product Reviewer → Product Management; Agentic AI Reviewer → Agentic AI; Migration Reviewer →
Migration & Onboarding. Each rubric retains all seven required criterion fields and its 0–4 scale.

## Canonical browser evidence

Harbor Light Books was created through ordinary Discover/Assess, not a demo loader. Every mapping,
resolution, consequential configuration, onboarding and invoice decision was exercised through UI
controls. The same session reached `VERIFIED_FIRST_PRODUCTIVE_USE` and survived browser refresh.

| Artifact | Observed evidence |
| --- | --- |
| Session | `c59db8d1-03b1-4450-85f8-6fbce3e6a035` |
| Plan | `7b32e5b3-49ad-4eaf-badf-0aeedb07a44e`, `migration-plan-v1` |
| Approved manifest | `4d4c89f87c528b55b5d9435e7bf5a5a9d46132a2682201e0852ff3d6a59a496e` |
| Migration | 11 approved mappings; 8 batches; 8 checkpoints; duplicate-customer pause, explicit approval and resume; prior account batch not replayed |
| Validation/configuration | 17 matched checks; 0 unresolved differences; 8 configured areas; configuration `5db2c1d5-d673-4428-a0fc-f8a37e4a23e9` |
| Human audit | 23 normalized decisions; 137 ordered product events at final snapshot |
| FPU | Task `01bd5ccb-93c8-4436-a1dc-91d38e0a90c7`; 10/10 prerequisites; USD 100.00 + 7.25 tax = 107.25; one posting attempt; one invoice/journal |
| Verification | Six deterministic FPU checks; hash `fd27a3539603a101d331291a5770fb0b45ac9c2fa8e37829c2cfe8e02300fba7`; terminal success events |

These are synthetic local run identifiers, not durable hosted records. Automated tests repeat the
journey from fresh ordinary sessions and assert upstream discovery/assessment/plan/mappings remain
identical downstream. The observed outcome is not a claim that real customers reached FPU.

## Findings and remediation

| ID | Initial severity / finding | Impact and remediation | Retest |
| --- | --- | --- | --- |
| INT-01 | P1: disconnected UI handoffs and demo-only migration entry | A user could not demonstrate one coherent business journey. Added Harbor at Discover, explicit session-bearing links, read-only resume, shared navigation pointer, and no silent new-business fallback in Plan. Demo replay remains visibly separate. | Canonical browser run; 14 integrated scenarios; UI handoff/resume tests. Resolved. |
| INT-02 | P1: discovery/assessment replay rewinds lifecycle; early writes bypass CAS | Upstream calls could leave contradictory downstream state or overwrite newer evidence. Existing discovery/assessment now replay unchanged; all normal early mutations use CAS with 409 conflicts. Added distinct CREATED state. | Full journey repeated early calls unchanged; concurrent assessment/event conflict retains newer event; existing concurrency tests. Resolved. |
| INT-03 | P1: mapping/plan evidence not fully enforced at migration boundary | State flags alone were insufficient before writes; selected targets lacked executed lineage. Start/resume now recheck current manifest, owner/time, deterministic compatibility, source and plan identity; envelopes retain approved mapping bindings and validation checks them. Unsupported changed product/configuration treatment fails closed (including currency conversion). | Stale start/resume and unsupported currency tests; mapping lineage assertions; all financial regressions. Resolved. |
| INT-04 | P1: inconsistent cross-stage consequential-decision audit fields | A reviewer could not consistently reconstruct role, stage, affected entity and evidence. Added server-authored normalized records across mapping, resolution/repair, configuration, onboarding and FPU; retained original artifacts. | Approval-attribution integrated case and final 23-decision trace. Resolved. |
| INT-05 | P2: inconsistent optional ADK adapter contracts | Migration/resolution definitions now use capability routes, typed outputs, output state keys and callback seams; parent retains writes/handoffs. | Offline SDK-double contract test; existing Validate/FPU adapter regressions. Resolved for interface scope only. |
| INT-06 | P2: stale product summaries and misleading progress | Updated current architecture indexes and plan language; paused migration no longer appears completed; Verify/Start navigation added. | Source review, UI regression and browser inspection. Resolved. |
| INT-07 | P3: migration auto-dialog opener disappears | Added stable heading fallback; closing the dialog does not lose focus to body. | Frontend focus-return assertion; live onboarding dialog focus wrap/Escape/return also verified. Resolved. |

Financial review found no model-derived truth path. Exact reconciliation and invoice/accounting
checks remain authoritative; owner approval never turns a failed check into success. No protected
lifecycle event is accepted from the browser. Unsupported real uploads/provider writes remain absent.

## Integrated evaluations and regression gates

`tests/test_beta_v1_integration.py` contains **14 integrated golden cases plus 6 supporting checks**.
Each golden begins at ordinary session creation; none calls a slice/demo loader.

| Golden case | Result / evidence |
| --- | --- |
| Full happy path to verified FPU | PASS; one session, explicit decisions, target/check/report/config/FPU chain. |
| Blocked discovery/readiness | PASS; Northstar blocker retained in plan; no execution. |
| Mapping rejection | PASS; remaining approvals do not override rejected mapping; no writes. |
| Migration failure/retry | PASS; controlled duplicate stops; resolution approval required; retry completes. |
| Validation mismatch/remediation | PASS; injected invoice mismatch blocks; approved bound restoration + revalidation required. |
| High-risk configuration approval | PASS; apply/onboarding blocked until all required configuration decisions. |
| Onboarding prerequisite failure | PASS; synthetic missing-role condition blocks invoice preparation until approved repair. |
| FPU failure/retry | PASS; posting fault has no receipt; approved remediation reuses task/key and verifies. |
| Model unavailable fallback | PASS; full journey runs with deterministic fallback and no model credentials/calls. |
| Checkpoint resume | PASS; POSTED invoice resumes verification without second posting; migration checkpoint also retained. |
| Duplicate execution protection | PASS; same migration key replays same result, changed key conflicts; repeated FPU execution adds no writes/events. |
| Approval attribution | PASS; actor/role/time/decision/evidence/stage/entity present across all consequential stages. |
| Deterministic repeatability | PASS; exact verification checks repeat unchanged for identical evidence. |
| No unsafe stage bypass | PASS; early planning/migration/validation/configuration/onboarding/FPU requests rejected; forged success events rejected. |

Supporting checks: cross-owner access/forged actor, early concurrent write, stale manifest before
start, stale manifest before resume, unsupported currency conversion, and advisory ADK contracts.
All previous slice evaluations are included in the complete regression suite.

| Gate | Result |
| --- | --- |
| Ruff | PASS |
| Complete backend suite | 157 passed; one inherited Starlette test-client deprecation warning |
| Frontend lint / TypeScript | PASS / PASS |
| Complete frontend suite | 34 passed |
| Production frontend build | PASS, 19 pages generated |
| Markdown links | PASS; 73 Markdown files checked for repository-relative file targets; external availability/anchors not asserted |
| Whitespace | PASS, `git diff --check` |
| Bounded secret scan | PASS; 259 tracked/new text files screened for private-key and common credential patterns; not an exhaustive security audit |

Browser QA: canonical workflow on desktop; light/dark inspected; mobile at 390×844 and desktop at
1365×900 had no document horizontal overflow; mobile navigation includes Verify/Start; theme
selection survives refresh. Dialog focus wraps in both directions, has a visible solid outline,
Escape closes, and focus returns to the opener. Plan, completed migration and verified FPU survive
refresh without demo recreation. Semantic blocked/approval/verified states are visible. Error recovery
is covered by controlled migration pause/resume in-browser and API/component negative cases.
Reduced motion is verified by the stylesheet regression (animation/transition overrides), not a live
OS preference change. Screen-reader user research and broad device testing remain unperformed.

During QA, simultaneous Next dev/build use briefly invalidated the shared `.next` cache. Preview was
stopped/restarted; browser state recovered and the final build was run without the preview process.
No implementation defect or user data loss was inferred from that local tool conflict.

## Criterion-level rubric assessment

Scores use the linked canonical 0–4 scales: 3 means repository-evidenced behavior for this scope,
not production validation; 4 is not claimed from author review. Impact columns state why each
criterion matters to the product and end user. Severity reflects the remaining gap, not the numeric
score. No aggregate score is calculated.

### Product Management Rubric

Source: [canonical criteria](../rubrics/PRODUCT_MANAGEMENT_RUBRIC.md).

| Criterion | Score | Evidence | Remaining gap | Product impact | End-user impact | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Problem significance and target user | 3 | Owner-guided migration to usable invoice, canonical browser trace | No representative user research | Keeps work focused on usable books | Tests meaningful work, not data movement alone | P2 | Product owner: validate with representative migration users before customer release. |
| Canonical journey and outcome alignment | 3 | One-session HTTP/browser journey and immutable upstream assertions | Only synthetic USD scenario | Removes disconnected demos | Progress corresponds to the same business | P2 | Expand representative source/target fixtures. |
| Scope, non-goals, and beta boundary | 3 | UI disclosure, no providers, architecture, production demo-auth rejection | No external misuse study | Prevents unsupported commitments | Avoids mistaking Beta success for financial certification | P3 | Reassess boundaries before hosting/customer use. |
| User value and actionability | 3 | Next-action links, evidence, blockers, dialogs, mobile run | Long evidence-heavy screens | Makes governed progression understandable | Clear next action; detail remains demanding | P3 | Usability study and progressive disclosure. |
| Progressive trust and decision ownership | 3 | Mapping/config/onboarding/FPU gates; 23 attributed decisions | Demo role only | Keeps consequential authority human-owned | No hidden acceptance of financial changes | P2 | Real identity/delegation before production. |
| Metrics and evidence discipline | 2 | FPU verified event/contract; North Star unchanged | No production denominators, instrumentation, owners/baselines | Avoids fabricated success metrics | Outcome not conflated with autonomy/assistance | P3 | Define operational taxonomy and measured cohorts before metric claims. |
| Product coherence, business fit, and truthful demo | 3 | Reused session, shared controls/nav, no paid services or hidden loaders | No adoption/cost evidence | Credible independent demonstration | Same workflow and business throughout | P3 | Evaluate customer value and operating cost in next phase. |

### Agentic AI Rubric

Source: [canonical criteria](../rubrics/AGENTIC_AI_RUBRIC.md).

| Criterion | Score | Evidence | Remaining gap | Product impact | End-user impact | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agent necessity and ownership | 3 | Existing bounded agents/specialists; parent-owned stage transitions | Logical agents, no managed runtime proof | Limits competing authority | Predictable ownership | P3 | Validate runtime delegation without moving policy into models. |
| Orchestration and workflow state | 3 | Guard/CAS/replay tests, explicit CREATED and terminal evidence | Process-local only | Reproducible progression | Cannot skip prerequisites through UI/API | P2 | Durable transactional state and crash testing. |
| Tool authority and least privilege | 3 | Deterministic write/check tools; no ADK advisory write tools | No deployed service IAM | Protects accounting rules | Model prose cannot authorize a write | P2 | Reviewed workload IAM/allowlists before live integration. |
| Evidence, provenance, confidence, and explanations | 3 | Manifest bindings, source hashes, typed explanations, policy confidence | No live-model calibration set | Makes recommendations reviewable | Distinguishes explanation from proof | P3 | Representative groundedness/calibration evals. |
| Human governance and escalation | 3 | Uniform decision audit, owner scoping, rejects and retry limits | No delegated production roles | Preserves responsibility model | Consequential decisions remain attributable | P2 | Production role/approval policy and escalation operations. |
| Failure handling, idempotency, and safe stopping | 3 | Migration and POSTED checkpoints, duplicate keys, CAS conflict tests | No durable/distributed guarantees | Prevents duplicate local receipts | Safe retry without replaying completed work | P2 | Crash/restart/multi-worker recovery evidence. |
| Security, privacy, and auditability | 3 | Auth tests, event allowlist, actor rejection, bounded scan | Ephemeral mutable server memory; inherited dependency advisory | Defensible synthetic boundary | No real customer data involved | P2 | Harden identity/storage/dependencies before external exposure. |
| Evaluation, fallback, and runtime portability | 3 | 14 integrated cases, prior regressions, offline ADK schemas/hooks | No live Gemini/managed ADK test | Product does not require model availability | Model outage cannot redefine financial truth | P3 | Separate Google-native runtime evaluation phase. |

### Migration & Onboarding Rubric

Source: [canonical criteria](../rubrics/MIGRATION_ONBOARDING_RUBRIC.md).

| Criterion | Score | Evidence | Remaining gap | Product impact | End-user impact | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source, target, and canonical boundaries | 3 | Source hash, immutable payload, approved target metadata, no vendor calls | Single synthetic identity adapter | Provider-neutral expansion seam | No silent source alteration | P2 | Representative adapter conformance before live support. |
| Readiness, planning, and dependencies | 3 | Findings/plan retained; blocker/no-bypass tests | Complex real migrations untested | Consistent executable handoff | Blockers do not disappear between screens | P2 | Broaden dependency and unsupported-item scenarios. |
| Mapping and accounting compatibility | 3 | Compatibility rerun before load; binding verification; currency conversion blocked | No general transform engine | Prevents unimplemented treatment being accepted as execution | Approved target has explicit lineage or safe stop | P2 | Separate reviewed transformation contracts. |
| Human approval and migration handoff | 3 | Plan ID/hash + owner/time/evidence; explicit start; rejection gate | Demo-only authority | Separates proposal, approval, execution | Knows which manifest will run | P2 | Real scoped delegated authorization. |
| Blockers, unsupported items, and exception ownership | 3 | Controlled duplicate, mismatch, prerequisite and posting repairs | Human operational escalation not built | No hidden loss or false readiness | Recover or stop with explanation | P3 | Support/triage workflow before real customers. |
| Lineage, evidence, and audit integrity | 3 | Full session trace, normalized decisions, before/after repairs | Not durable immutable production audit | Reconstructs why results changed | Can inspect what was approved and executed | P2 | Durable append-only storage and recovery audit. |
| Execution, validation, and recovery boundary | 3 | Exact reconciliation, 8 checkpoints, 6 FPU checks, replay tests | No production rollback or provider writes | Protects financial truth | Failed checks cannot be overridden | P2 | Production transaction and recovery contract before deployment. |
| Onboarding and verified First Productive Use continuity | 3 | Config/context binding, 10 prerequisites, approved invoice verified | No representative customer outcome data | Completion means usable business action | Invoice works with checked migrated evidence | P2 | Validate representative productive tasks with users. |

## Formal reviewer lenses

Applied existing prompts as an author-run advisory review, not independent reviewer agents:

| Lens | Outcome and evidence |
| --- | --- |
| Product | INT-01/06 resolved; canonical FPU scope and product/IP positioning preserved. |
| Agentic AI | INT-02/04/05 resolved; deterministic truth, bounded tools, fallback, parent-owned state. |
| Migration | INT-03 resolved; bindings, deterministic verification, scoped repairs, checkpoint recovery. |
| UX/accessibility | Session-bearing handoffs, truthful paused progress, responsive nav, native dialog focus, shared semantics; density remains P3. |
| Architecture | Same modular monolith/session repository; no parallel workflow store; no major new feature. |
| Security/privacy | Owner/actor/event boundaries tested; synthetic-only local scope; no new dependency/license/secret or provider path. |
| Metrics | No invented outcome/autonomy rates; instrumentation remains P3. |
| Release readiness | Gates pass; no unresolved P0/P1; GREEN only for the stated Beta. Human owns publication/merge/deployment. |

## All 17 release-readiness areas

Each is assessed for the synthetic local scope, not silently marked N/A or production-ready.

| Area | Assessment / limitation |
| --- | --- |
| User | GREEN: critical flow and approvals work; representative research remains follow-up. |
| Customer outcome | GREEN: verified synthetic invoice; no claim of real customer value measurement. |
| Business | GREEN: no paid deployment/model calls; adoption, economics and costs not measured. |
| Product | GREEN: same-session canonical journey; truthful non-production scope. |
| Migration correctness | GREEN: manifest/source/target checks, exact money, safe recovery. |
| Agent behavior | GREEN: guarded tools, deterministic fallback, human consequential decisions. |
| GenAI quality | GREEN for fallback/no live GenAI dependency only; live quality unverified. |
| Deterministic quality | GREEN: exact repeatability and false-success regression cases. |
| Safety / trust | GREEN: no approval or lifecycle-event bypass in tested contracts. |
| Security / privacy | GREEN for local synthetic use; production controls and dependency hardening pending. |
| UX / accessibility | GREEN for exercised keyboard/theme/viewport paths; reduced-motion CSS regression, not broad accessibility certification. |
| Reliability | GREEN for process-local CAS/idempotency/retry; durability explicitly absent. |
| Engineering quality | GREEN: lint/typecheck/test/build/links/whitespace/scan pass. |
| Platform architecture | GREEN: existing boundaries reused; live adapters/runtime out of scope. |
| Evaluation | GREEN: integrated cases and previous regressions pass; representative data still limited. |
| Feedback / support readiness | GREEN for local author-run demo triage through trace/test/review; customer support product not implemented. |
| Demo readiness | GREEN: no hidden demo loader/manual approval seeding in canonical browser/API runs. |

## Remaining non-blocking gaps and ownership

Owners below are accountable project roles, not claims that external people approved these risks.
Review before branch publication and again before any exposure beyond local synthetic evaluation.

| ID | Severity | Gap | Owner / mitigation / trigger |
| --- | --- | --- | --- |
| R-01 | P2 | Production identity, durable transactions/checkpoints, immutable audit, retention and recovery operations | Engineering/security owner; local synthetic use only; must resolve before customer deployment. |
| R-02 | P2 | Representative users/data/providers and unsupported transformations | Product/migration owner; bounded fixtures and explicit safe stops; expand before broader correctness claims. |
| R-03 | P2 | Inherited Next.js/PostCSS advisory | Engineering owner; no public deployment in this task; separate dependency upgrade/security review before hosting. No fresh vulnerability-clear claim. |
| R-04 | P3 | Production metrics taxonomy/instrumentation/baselines, feedback/support UI and reviewer runtime | Product/operations owner; use local events/tests/review for current evaluation; define before production measurement. |
| R-05 | P3 | Live Gemini/managed ADK runtime, callbacks and telemetry not verified | AI/platform owner; deterministic fallback is active; separate runtime phase and release assessment. |
| R-06 | P3 | Dense technical evidence and bounded per-screen activity lists | UX owner; complete owner-scoped session trace remains inspectable; progressive disclosure/export usability follow-up. |
| R-07 | P3 | Starlette test-client deprecation warning | Engineering owner; existing suite passes; address with separately tested dependency maintenance. |

Rollback: normal reviewed revert of this hardening commit; no public history rewrite. Local session
restart discards demo state and is not a durable rollback promise. Support loop for this scope:
record failing session/scenario → triage rubric severity → fix → regression/eval → reviewed release.

## Completion and next step

Integrated synthetic Beta V1.0 is complete for this tested contract: verified FPU through governed
transitions, integrated/regression gates pass, P0=0, P1=0. This is not production migration readiness,
live provider integration, live Gemini/managed ADK verification or customer deployment readiness.
Human review/publication decision comes next. Recommended subsequent phase: public product surfaces
+ Try Your Data + Google-native runtime integration, with separate privacy, security, dependency and
runtime gates. None of those capabilities was implemented or deployed in this hardening pass.
