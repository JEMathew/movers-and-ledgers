# Onboard → Verified First Productive Use review

## Scope, authority, and conclusion

Assessment date: 2026-09-27. Branch `feature/onboard-fpu`, baseline `d0795f0`.
Revision: the implementation, tests and documentation committed together with this record (use
`git log -1 -- docs/reviews/onboard-fpu.md` to resolve the exact reviewed commit).
Scope: synthetic public-reference Beta, Onboard → one verified customer invoice; no provider,
deployment, live model, or production-readiness claim. [Architecture](../architecture/onboard-fpu.md).

This is a **builder-run evidence review using the canonical reviewer lenses**, not independent
human approval, a deployed reviewer-agent runtime, a security certification or representative user
research. Findings below were implemented and regression-checked by the builder. The human owner
retains publication, PR, independent review and merge decisions; nothing is automatically merged.

**GREEN for the synthetic public-reference Beta slice.** Final P0: 0; final P1: 0.
The minimum synthetic Beta V1.0 canonical journey now reaches verified First Productive Use, not
just migration completion. Broader production readiness is not GREEN and is not asserted.

## Evidence inventory

- State/authority: `agents/orchestrator/onboard_fpu.py`, existing configured-evidence verification,
  owner-scoped API context and repository compare-and-swap.
- Financial tools: `tools/onboarding/checks.py`, `tools/activation/invoice.py`.
- Contracts/routes: `domain/onboarding_fpu/models.py`,
  `services/api/src/movebooks_api/discover_assess/onboard_fpu.py`.
- Agent/routing boundaries: `agents/onboarding`, `agents/activation`, `agents/model_policy.py`.
- UX: `apps/web/components/onboard-fpu`, Configure continuation link, shared dialog/status/motion.
- Executable regressions: `tests/test_onboard_fpu.py`, `tests/test_onboard_fpu_adk.py`,
  `apps/web/components/onboard-fpu/OnboardFpuExperience.test.tsx`.
- Canonical reviewer wiring remains Product → Product Management Rubric, Agentic AI → Agentic AI
  Rubric, Migration → Migration & Onboarding Rubric in [reviewer prompts](../../reviewers/README.md).

## Findings and remediation

Initial implementation review identified P0: 0, P1: 1, P2: 1, P3: 2. These are actual development
findings, not inherited historical counts or a claim of independent external review.

| ID | Severity | Finding / evidence / consequence | Remediation and verification |
| --- | --- | --- | --- |
| FPU-01 | P1 | Success reader recomputed financial checks but initially did not require the persisted verification hash and completion event. Missing or altered audit evidence could still present success. This weakens the verified productive-action contract even when totals match. | Require recomputed hash equality, verified status/time, matching verification and completion events; require owner role and matching posting-event actor. Tampered hash, completion event, role, invoice, journal, approval, mapping and configuration regressions all block. Closed by code and regression evidence; independent approval pending. |
| FPU-02 | P2 | Direct verification before onboarding could dereference an absent state; generic safe-stop replaced detailed failed checks. Users could get an unhelpful server error or lose precise diagnostics. | Guard missing task and return 409; preserve individual verification checks alongside safe-stop. API premature-verify regression passes. Closed. |
| FPU-03 | P3 | Pending checklist approvals initially appeared as a failed checklist; return-to-pending transition used a blocked event. This confused pending decisions with genuine prerequisites. | Pending summary uses REVIEW_REQUIRED, blocked requires an actual failed prerequisite/rejection, transition event reflects the state. Live scenario now remains ONBOARDING until decisions complete. Closed. |
| FPU-04 | P3 | Completed setup still invited preparation after verified FPU. | Final-state next action now points to posted evidence. Live verified result and frontend success rendering checked. Closed. |

The explicit synthetic invoice-operator grant and separate tax-liability account are preventative
design controls, not invented prior defects. Existing FINANCE_REVIEWER is not write authority;
tax is never silently routed to sales or A/P. Migration snapshots remain immutable.

### Remaining follow-ups

These are non-blocking **only for this isolated synthetic reference**. They must not be interpreted
as accepted production risk. Proposed accountable roles are listed; the repository owner assigns
named implementers before expanding exposure.

| ID | Severity | Gap and evidence | Owner / next action / release condition |
| --- | --- | --- | --- |
| NEXT-01 | P2 | Process-local session/ledger/audit and local demo identity; no durable tenant runtime. | Architecture + Security/Operations; transactional durable ledger, distributed keys, immutable audit, authenticated user roles, retention and crash recovery before any real data/provider access. |
| NEXT-02 | P2 | Inherited Next.js/PostCSS dependency advisory recorded in prior slice review; this branch does not alter dependencies. | Engineering/Security; separate compatibility-tested upgrade and fresh advisory assessment before hosting. No fix or current exploitability claim made here. |
| NEXT-03 | P2 | One USD service-invoice fixture and browser checks are not representative accounting, customer, or assistive-technology validation. | Product + Finance controls + Accessibility; broaden tax/currency/provider/customer cases and run screen-reader/representative task sessions before broader Beta claims. |
| NEXT-04 | P3 | Ten metric contracts exist, but no production collection, baselines or named owners. | Product Analytics; taxonomy, eligibility, privacy, named ownership and data-quality implementation before measurement-driven claims. |
| NEXT-05 | P3 | Checklist/action copy is verbose; evidence is JSON/details and activity has no filtering; no support UI/backend. | UX + Support; test simplified labels, artifact presentation and sanitized support intake. Current workaround is task/evidence references and synthetic reproduction. |
| NEXT-06 | P3 | ADK factories are contract-tested with doubles; Gemini/runtime integrations and broader retrieval are not live. | Agent platform; optional real-SDK integration, callbacks, persistence and evals before any live-runtime claim. Deterministic path stays primary. |
| NEXT-07 | P3 | Existing Starlette test-client deprecation warning. | Engineering; dedicated dependency/test-client upgrade. Current tests pass with warning. |

Remaining: **P2: 3; P3: 4**. No P0/P1 is accepted or deferred.

## Canonical criterion-level rubric review

All 23 criteria are evaluated individually; **no aggregate score**. Scale and required criterion
definitions remain in [Product Management](../rubrics/PRODUCT_MANAGEMENT_RUBRIC.md),
[Agentic AI](../rubrics/AGENTIC_AI_RUBRIC.md), and
[Migration & Onboarding](../rubrics/MIGRATION_ONBOARDING_RUBRIC.md). A 3 is repository-evidenced
for the declared scope, not representative production validation. Gap severity refers to remaining
work under the synthetic boundary; widening the boundary changes the release decision.

### Product Management — Product Reviewer lens

| Criterion | Score 0–4 | Evidence | Gap | Why MoveBooks AI | Why end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Problem significance and target user | 3 | Configured business owner prepares a migrated-customer invoice; executable productive outcome | No representative customer research | Links migration to operational value | Can use the books, not just inspect a transfer | P2 | NEXT-03 task interviews and representative cases |
| Canonical journey and outcome alignment | 3 | CONFIGURED gate; all ten tasks; invoice verification and Configure link | Real-adapter downstream outcome not validated | Preserves complete journey | Earlier completion cannot masquerade as productive use | P2 | NEXT-01/03 real-adapter handoff tests |
| Scope, non-goals, and beta boundary | 3 | UI replay disclosure, architecture limits, no live calls | No independent misuse validation | Avoids unsupported product promises | Knows transaction is synthetic | P3 | Human review before public release |
| User value and actionability | 3 | Task reason/evidence/next action; live failure/remediation/retry and final artifact | Dense checklist and evidence panels | Converts findings into governed progress | Understands what remains and what happened | P3 | NEXT-05 simplify using usability evidence |
| Progressive trust and decision ownership | 3 | Five setup choices plus invoice approval; revision/rejection/owner regressions | Real delegated permission model absent | Prevents silent financial authority | Controls tax, role and transaction decisions | P2 | NEXT-01 production identity and roles |
| Metrics and evidence discipline | 2 | Ten complete future definitions, windows/denominators/privacy; North Star unchanged | Instrumentation and baselines absent | Avoids vanity-success claims | Assistance is not treated as failure | P3 | NEXT-04 collect governed evidence |
| Product coherence, business fit, and truthful demo | 3 | Reused design system/state/fixture, no model cost, explicit prior-stage replay | Business value not externally validated | Coherent independent provider-neutral product | Consistent UI with honest capability limits | P2 | NEXT-03 representative evaluation |

### Agentic AI — Agentic AI Reviewer lens

| Criterion | Score 0–4 | Evidence | Gap | Why MoveBooks AI | Why end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agent necessity and ownership | 3 | Onboarding checklist and Activation contract boundaries; specialists remain deterministic responsibilities | No independently validated live reasoning | Avoids agent-count theatre | Predictable responsibility and safe tools | P3 | NEXT-06 add reasoning only with evidence of need |
| Orchestration and workflow state | 3 | Single parent guards states; stale context, approval and CAS tests | Process-local recovery only | Maintains inspectable lifecycle | Cannot skip prerequisite decisions | P2 | NEXT-01 durable orchestration |
| Tool authority and least privilege | 3 | Extra request fields forbidden; actor from auth; no live egress; bounded contract | No operational production monitoring | Keeps financial rules authoritative | No model can waive posting controls | P2 | NEXT-01 production least-privilege enforcement |
| Evidence, provenance, confidence, and explanations | 3 | Policy/context/contract/check hashes, grounded task explanations, receipt attribution | No representative explanation calibration | Reviewable evidence instead of confidence | Can inspect reasons before acting | P3 | NEXT-06 explanation usefulness evaluations |
| Human governance and escalation | 3 | Attributable approve/modify/reject, separate invoice scope, terminal safe stop | Escalation is local owner investigation | Enforces consequential-action ownership | No hidden self-approval or privilege grant | P2 | NEXT-01 delegated approval and support ownership |
| Failure handling, idempotency, and safe stopping | 3 | Three-attempt cap, same-key retry, POSTED resume, concurrent CAS, one receipt | No durable distributed fault recovery | Prevents duplicate/contradictory writes | Retry does not replay completed work | P2 | NEXT-01 transactional checkpoint storage |
| Security, privacy, and auditability | 3 | 401/404 isolation, forged events rejected, audit-drift regressions and secret scan | Demo auth and memory audit not production-ready | Protects boundary and evidence credibility | Decisions cannot be browser-forged or cross-owned | P2 | NEXT-01 immutable production audit and auth |
| Evaluation, fallback, and runtime portability | 3 | 14 executable golden cases, ADK contract tests, deterministic fallback | No live SDK/model evals or drift measurement | Value remains independent of provider uptime | Model absence cannot fabricate or prevent verification | P3 | NEXT-06 optional-runtime integration suite |

### Migration & Onboarding — Migration Reviewer lens

| Criterion | Score 0–4 | Evidence | Gap | Why MoveBooks AI | Why end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source, target, and canonical boundaries | 3 | Immutable migrated snapshot; separate ops invoices/journals; provider-neutral models | Single synthetic active-by-default schema | Preserves lineage and adapter extensibility | Productive writes do not invalidate migration proof | P2 | NEXT-03 explicit provider eligibility contracts |
| Readiness, planning, and dependencies | 3 | Validated/configured guard and ten tasks; six missing-prerequisite golden cases | Complex business setup not covered | Prevents skipped readiness requirements | Knows why work is blocked | P2 | NEXT-03 more complex golden journeys |
| Mapping and accounting compatibility | 3 | Unique approved A/R/income, tax code/rate, exact totals, separate liability, invalid-mapping test | Broader accounting semantics absent | Protects financial meaning | Avoids incorrect accounts/tax/amounts | P2 | NEXT-03 multiple taxes/currencies/items |
| Human approval and migration handoff | 3 | Prior approval integrity reused; configuration hash; human decisions before FPU | Production delegation absent | Separates setup from permission to post | Knows precisely what was authorized | P2 | NEXT-01 real permission/delegation tests |
| Blockers, unsupported items, and exception ownership | 3 | Faults remain visible; no write before repair; retry budget and owner escalation | Support workflow not implemented | Prevents silent missing-data success | Receives a safe next action or explicit stop | P3 | NEXT-05 support workflow, no bypass |
| Lineage, evidence, and audit integrity | 3 | Contract/checksum, actor/role/time, before/after balances, verification/completion hash checks | No durable immutable storage | Reconstructs productive outcome | Can see who changed what and why | P2 | NEXT-01 immutable event storage |
| Execution, validation, and recovery boundary | 3 | Approved manifest/config gate, exact invoice/journal, balanced impact, failure and resume tests | Not production-tested end-to-end | Rejects false completion | Only a correct posted action counts | P2 | NEXT-01/03 durable representative end-to-end tests |
| Onboarding and verified First Productive Use continuity | 3 | Configure continuation → checklist → approved invoice → six checks → verified final UI | Representative customer outcome unvalidated | Closes minimum synthetic Beta journey | Demonstrates actual productive use in target | P2 | NEXT-03 customer/task validation, additional tasks later |

## Reviewer lens findings

All roles below were applied as builder-run lenses with file/test/browser evidence, not separate
agents. The canonical advisory no-edit/no-merge restrictions remain; this builder implemented fixes
outside the reviewer role. Independent human re-review is still recommended.

| Reviewer | Finding / evidence / disposition |
| --- | --- |
| Product | No P0/P1 scope or completion misclaim after invoice-backed final state; NEXT-03/05 evidence and UX gaps remain. |
| Customer Outcome | Browser reached posted invoice and signed account deltas; no measured customer improvement claimed. Representative outcomes NEXT-03. |
| Migration | Original target unchanged through posting; missing entities/config/mapping block; tax control explicit. No unresolved P0/P1. |
| Agentic AI | FPU-01 audit binding corrected; deterministic specialists, one state owner, bounded retries and no self-approval. NEXT-06 runtime gap. |
| GenAI Quality | No live generation; grounded deterministic explanations checked. No hallucination-rate claim. Live-model assessment deferred with NEXT-06. |
| FinTech Trust | Exact decimal totals, liability separation, role grant and contract approval checked; FPU-01 corrected. No production tax/accounting claim. |
| UX | FPU-02/03/04 closed; live failure/recovery and JSON evidence visible. NEXT-05 density and filtering remain. |
| Accessibility | Live keyboard focus trap in both directions, Escape restoration, labeled controls and semantic states; light/dark/mobile inspections; shared reduced-motion CSS/test checked. Broader AT research NEXT-03. |
| Architecture | Separate operational ledger preserves validation baseline; versioned owner-scoped APIs and CAS; NEXT-01 durability remains. |
| Security | Missing-auth, cross-owner, forbidden actor fields, lifecycle forgery and mutated approval checks pass. No new secrets or external calls. NEXT-01/02 apply before hosting. |
| Metrics | Ten future definitions with cohort, privacy and denominator rules; no observed values or autonomy-based success. NEXT-04. |
| Release Readiness | All 17 areas below assessed; no open P0/P1, scoped P2 mitigation is synthetic-only isolation. Human release decision pending. |
| Demo | Prior-stage replay openly disclosed; current setup/transaction approvals interactive; posting failure and checkpoint resumption reach verified outcome. No hidden data edits. |
| Reliability / Operations (additional canonical lens) | Concurrent commit rejects stale receipt; replay idempotent, attempts bounded. Process restart intentionally loses sessions; NEXT-01. |

## Validation and browser record

Local gates on this revision:

- Ruff: pass.
- Backend: **137 tests passed**, including **14/14 onboarding/FPU golden cases**.
- Frontend lint: pass.
- TypeScript: pass.
- Frontend: **30 tests passed** across seven files.
- Production frontend build: pass; `/onboard-fpu` included among 19 generated pages.
- Markdown links: pass, **71 files** checked for local file targets (external URLs/anchors not validated).
- Whitespace: pass, `git diff --check` plus tracked/untracked text scan.
- Secret scan: pass, common credential/private-key patterns across **255** tracked and nonignored
  untracked files. This is a bounded pattern scan, not a full security certification or history scan.

Live browser checks on localhost (temporary servers stopped after verification):

- Light desktop 1280px and dark mobile 390×844: no document overflow, text/status/actions visible.
- Keyboard: modal starts at close control; Shift+Tab wraps to last action; Tab wraps to first;
  Escape closes and restores opener focus. Shared fallback supports disappearing/disabled opener.
- Semantic text labels for approval, blocked, ready and verified; disabled preparation until setup.
- Posting-failure scenario: explicit approvals → prewrite block → governed repair → retry → verified,
  two posting attempts and one posted invoice/journal.
- Missing-customer scenario: customer usability BLOCKED and preparation disabled → approved adapter
  remediation → customer usability COMPLETED; no hidden migration/configuration edits.
- Latest audit-hardened checkpoint scenario: POSTED, one attempt, not verified → Resume verification →
  VERIFIED with one attempt; reload retains the same verified session evidence.
- Default invoice 100.00 + 7.25 = 107.25; A/R 420.00 → 527.25; sales -1420.00 → -1520.00;
  tax liability 0.00 → -7.25. Six checks, actor and verification timestamp visible.
- Reduced motion: existing automated stylesheet contract passes and loaded page contains the media
  rule reducing animation/transition to 0.01ms and disabling smooth scrolling. Host OS preference was
  not changed; live OS-toggle testing and screen-reader certification are not claimed.

## Seventeen-area readiness assessment

GREEN below is limited to this local synthetic reference. No area is silently NOT ASSESSED.

| Area | Status | Evidence / boundary |
| --- | --- | --- |
| User | GREEN | Owner can complete approvals and invoice; browser/interaction tests; representative research NEXT-03. |
| Customer outcome | GREEN | Productive invoice, journal and balance deltas verified, not clicks. No measured customer uplift. |
| Business | GREEN | No model/cloud/provider cost introduced; no revenue/adoption claims. |
| Product | GREEN | Canonical journey preserved and reaches synthetic FPU; scoped disclosure throughout. |
| Migration correctness | GREEN | Existing migration validation unchanged; operations separate; 137 backend regressions. |
| Agent behavior | GREEN | Typed outputs, controlled tools, single parent, approval and retry tests. |
| GenAI quality | GREEN | Active deterministic explanations; live model quality not applicable to no-live-call scope. |
| Deterministic quality | GREEN | Decimal rules, invalid money, totals, exact store/journal, hash and replay tests. |
| Safety / trust | GREEN | Human decisions, no self-approval, role scope, no bypass/false-success evidence. |
| Security / privacy | GREEN | Synthetic-only owner scoping and forbidden events/fields; real auth/retention requires NEXT-01. |
| UX / accessibility | GREEN | Live responsive/light/dark/focus/failure evidence plus shared reduced-motion tests; NEXT-03/05. |
| Reliability | GREEN | One process CAS and checkpoint retry verified; no durable recovery claim. |
| Engineering quality | GREEN | Local gates recorded below; dependency follow-up NEXT-02, rollback is normal revert. |
| Platform architecture | GREEN | Additive typed resources and adapters; minimal safe earlier-stage handoff changes. |
| Evaluation | GREEN | 14 executable scenarios plus adversarial tests and live flow; no representative/live-model claim. |
| Feedback / support readiness | GREEN | Sanitized scenario/task/evidence reporting and canonical triage loop; production service not claimed. |
| Demo readiness | GREEN | Transparent synthetic replay, governed productive action, controlled recovery and evidence view. |

## Release control

Public reference/IP notices and license position remain unchanged. No new open-source license,
provider write, deployment, remote publication or merge. If a P0/P1 appears, stop publication and
rerun the affected rubric/gates after remediation. Human owner should review this commit, publish
the branch and create a PR only when satisfied; CI and an independent review remain subsequent gates.

Final gates above passed. Temporary preview processes were stopped and browser viewport overrides
reset after testing. No generated build/cache artifacts are included in the commit.
