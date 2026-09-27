# Validate → Configure review

## Decision and scope

- Branch: `feature/validate-configure`; baseline `fc5f0ed` (merged Migrate → Resolve).
- Review date: 2026-09-27. Code, policy, fixture, test, and documentation changes are co-versioned in
  this branch's implementation commit; no external production state changed.
- Method: builder-run formal review using the existing reviewer prompts and canonical rubrics.
  These are recorded review lenses, **not independent human sign-offs or a deployed reviewer runtime**.
- Initial P0: 0. P1 issues identified during implementation/review: 6. All six remediated below.
- Final P0: 0. Final P1: 0. Remaining P2: 3. Remaining P3: 4.
- **GREEN for the synthetic public-reference Beta slice; this is not a production migration readiness claim.**
- No Onboarding, verified First Productive Use, live provider writes, live Gemini calls, cloud
  deployment, branch publication, or automatic merge is included. Human owner decides release/merge.

The [architecture](../architecture/validate-configure.md) defines exact accounting constraints,
configuration limitations, source/target evidence, events, metrics, recovery, and ADK status.
Existing [IP/reference positioning](../../README.md#reference-use--intellectual-property) and licensing
position remain unchanged. No open-source license was added.

## Evidence index and quality gates

| Gate | Result / evidence |
| --- | --- |
| Ruff | `ruff check .`: pass |
| Backend | `pytest -q`: 102 passed; inherited Starlette warning remains |
| Golden evaluations | 14 executable parametrized scenarios in `tests/test_validate_configure.py::test_golden`: pass |
| Frontend lint / TypeScript | `npm run lint`, `npm run typecheck`: pass |
| Frontend tests | `npm test`: 24 passed, including six new workflow/accessibility cases |
| Production build | `npm run build`: pass; `/validate-configure` generated |
| Markdown links | Relative file targets checked across 69 repository Markdown files: pass; external URLs and fragment anchors not crawled |
| Whitespace | `git diff --check` plus new-file scan: pass |
| Secrets | 233 repository files scanned for common credential/private-key patterns; no findings; heuristic, not a proof of absence |
| Live workflow | Discrepancy → record approval → revalidation → configuration → modify/reject/revise/approve → application verified against local API |
| Theme / viewport | Light and dark browser checks; desktop 1280px and mobile 390px, no horizontal overflow in inspected states |
| Keyboard / dialog | Labeled controls, initial focus, forward/reverse focus wrap, Escape, trigger/fallback restoration; browser plus regression test |
| Errors / semantic status | Expired-session recovery, blocked handoff, signed target-minus-source difference, textual/icon statuses; API conflict retry covered in frontend tests |
| Reduced motion | Shared `motion-enter` and CSS reduced-motion override verified by stylesheet regression test; OS preference was not changed for this review |
| ADK | Offline SDK-double contract test only; optional SDK absent, no real runner or model evaluation claimed |

Backend evidence: [golden/adversarial tests](../../tests/test_validate_configure.py),
[ADK contract test](../../tests/test_validate_configure_adk.py),
[validation tools](../../tools/validation/checks.py),
[configuration controls](../../tools/configuration/controls.py),
[state owner](../../agents/orchestrator/validate_configure.py),
[owner-scoped API](../../services/api/src/movebooks_api/discover_assess/validate_configure.py).
Frontend evidence: [experience](../../apps/web/components/validate-configure/ValidateConfigureExperience.tsx),
[workflow tests](../../apps/web/components/validate-configure/ValidateConfigureExperience.test.tsx),
[dialog](../../apps/web/components/ui/dialog.tsx), [motion test](../../apps/web/test/motion.test.ts).

## P0/P1 remediation

| ID | Severity / finding and consequence | Remediation | Verification |
| --- | --- | --- | --- |
| VC-01 | P1: new A/P fixture account lacked a canonical mapping target; earlier migration tests failed before validation could run | Add explicit Accounts Payable compatibility rule, keep human account approval | All 67 inherited backend tests plus golden A/P case pass |
| VC-02 | P1: legacy migration resolution decision path could accept a validation-bound proposal, bypassing its required revalidation path | Reject validation repair IDs in the legacy orchestrator; only bound restoration route can apply | Repair golden case asserts legacy rejection, successful authorized repair, and still-blocked configure before revalidation |
| VC-03 | P1: independent get/put calls could lose simultaneous configuration decisions | Atomic compare-and-swap in ephemeral repository, return 409 on stale write | Concurrent stale-copy regression; existing API flow passes |
| VC-04 | P1: native browser focus could leave the dialog or return to body after an asynchronous trigger replacement | Explicit Tab/Shift+Tab wrapping and opener/status fallback focus | Browser keyboard walkthrough and six frontend workflow tests |
| VC-05 | P1: equal invoice totals alone could falsely verify an inconsistent A/R subledger | Tie each side's open invoices to explicit A/R control balances; validate amount/payment evidence | Golden A/R discrepancy and exact financial comparison tests; no tolerance or plug |
| VC-06 | P1: a syntactically supported profile could contradict company currency, fiscal metadata, or source tax evidence | Cross-check authoritative source evidence and omit approval evidence for inconsistent preferences | Three inconsistent-profile tests block approval |

Additional negative controls verified: modified target/source/mappings invalidate handoff; missing
evidence/area/approval and downgraded sensitivity cannot pass; invalid decimal values block;
preflight is atomic; forged browser events and extra decision fields are rejected; another owner
cannot read reports. No P0 was observed in the declared synthetic scope.

## Canonical rubric wiring and scoring

Product Reviewer → [Product Management](../rubrics/PRODUCT_MANAGEMENT_RUBRIC.md).
Agentic AI Reviewer → [Agentic AI](../rubrics/AGENTIC_AI_RUBRIC.md).
Migration Reviewer → [Migration & Onboarding](../rubrics/MIGRATION_ONBOARDING_RUBRIC.md).
All three canonical tables retain Criterion, What good looks like, Why it matters to MoveBooks AI,
Why it matters to the end user, Failure mode if missing, Evidence / metric, and criterion-specific
0–4 scales. No duplicate rubric or aggregate score was created.

Scores below apply to this bounded implementation, not production maturity. No score of 4 is claimed
without representative independent/user evidence. Severity describes the remaining gap, not the
numeric score. “Maintain” indicates no unresolved defect in that criterion's synthetic control.

### Product Management — 7 criteria

| Criterion | 0–4 | Evidence | Gap / severity | Why MoveBooks AI | Why end user | Remediation |
| --- | --- | --- | --- | --- | --- | --- |
| Problem significance and target user | 3 | Validation UX targets a migration owner checking books before configuration | Representative customer research absent; P2 VC-P2-02 | Focuses on consequential financial migration work | Avoids configuring untrusted books | Validate comprehension and value with representative owners |
| Canonical journey and outcome alignment | 3 | Explicit states, readiness guard, no Onboarding action | Downstream outcome not yet implemented; P3 phase boundary | Keeps one coherent journey toward FPU | Preparation cannot masquerade as completion | Implement Onboard → verified FPU in its separate reviewed phase |
| Scope, non-goals, and beta boundary | 3 | UI/demo replay disclosure, architecture, no provider calls | Production not supported; P2 VC-P2-01 | Prevents accidental operational commitments | Avoids mistaking a demo for certification | Keep synthetic boundary until production controls are independently reviewed |
| User value and actionability | 3 | Difference/evidence/next-action cards, repair, modify/reject/retry tests | Representative usability validation absent; P2 VC-P2-02 | Converts checks to governed progress | Explains what matched, what failed, and how to proceed | Usability sessions with account owners and assistive technology |
| Progressive trust and decision ownership | 3 | Five sensitive areas require attributable approval; stale evidence blocks | Production delegation/identity absent; P2 VC-P2-01 | Protects trust in financial choices | Retains meaningful user control | Add production authorization before any real use; maintain current tests |
| Metrics and evidence discipline | 2 | Nine future metric contracts with denominators and guardrails; no measured claims | Instrumentation and baselines absent; P3 VC-P3-01 | Avoids optimizing activity as success | Makes assistance and errors visible | Instrument, assign owners, validate denominators before publishing outcomes |
| Product coherence, business fit, and truthful demo | 3 | Shared design system, canonical workflow, explicit replay, deterministic fallback | Business value not empirically measured; P2 VC-P2-02 | Reuses platform without unnecessary agents or model costs | Consistent experience and honest limits | Validate value and support burden; retain truthful demo |

### Agentic AI — 8 criteria

| Criterion | 0–4 | Evidence | Gap / severity | Why MoveBooks AI | Why end user | Remediation |
| --- | --- | --- | --- | --- | --- | --- |
| Agent necessity and ownership | 3 | Validation/Configuration orchestration; arithmetic/setters remain tools; Knowledge reused | No unresolved scope defect; P3 maintain | Prevents agent-count complexity without value | Predictable bounded behavior | Introduce specialists only when independent reasoning is justified |
| Orchestration and workflow state | 3 | Transition evidence, checksummed verification, configuration history, CAS tests | Cross-worker persistence absent; P2 VC-P2-01 | Preserves auditable handoffs | Stops premature or stale completion | Durable transactional state before production |
| Tool authority and least privilege | 3 | One bound repair tool, allowlisted settings, no provider writes/model tools | Production service credentials not implemented; P2 VC-P2-01 | Contains the blast radius | No unreviewed accounting changes | Keep production disabled until least-privilege boundaries exist |
| Evidence, provenance, confidence, and explanations | 3 | Policy/source/report refs, exact comparisons, deterministic grounded explanations | Live model calibration not applicable to active path; P3 VC-P3-02 | Claims remain traceable rather than speculative | Users can inspect grounds for decisions | Evaluate explanations/calibration before enabling model route |
| Human governance and escalation | 3 | Approval/modify/reject, evidence requirements, role/currency/tax constraints, no flag downgrade | Real delegated approval absent; P2 VC-P2-01 | Enforces constitutional responsibility | User stays in control of consequential settings | Production owner/role enforcement; maintain adversarial tests |
| Failure handling, idempotency, and safe stopping | 3 | Revalidation gate, idempotent final apply, CAS conflict, retained before-payload | Stale pending repair needs investigation/restart; P2 VC-P2-01 | Avoids contradictory operations | Does not replay completed batches or silently waive differences | Durable repair lifecycle/rebase and recovery before real records |
| Security, privacy, and auditability | 3 | Owner API tests, strict input, internal-event rejection, local secret scan | Shared demo identity and ephemeral audit; P2 VC-P2-01 | Makes public-reference boundary enforceable | Real tenant protection is not falsely claimed | Production identity, retention and audit integrity before real use |
| Evaluation, fallback, and runtime portability | 3 | 14 executable golden cases, deterministic repeatability, offline ADK contract test | SDK/model runtime not installed/evaluated; P3 VC-P3-02 | Keeps correctness independent of AI availability | Model outage cannot block deterministic work | Validate pinned SDK and models in an isolated future integration |

### Migration & Onboarding — 8 criteria

| Criterion | 0–4 | Evidence | Gap / severity | Why MoveBooks AI | Why end user | Remediation |
| --- | --- | --- | --- | --- | --- | --- |
| Source, target, and canonical boundaries | 3 | Source hashes, canonical envelopes, bounded copy, no provider-specific writes | One synthetic company/target; P2 VC-P2-02 | Preserves extensibility | Accounting meaning is not silently provider-dependent | Evaluate representative adapters and larger datasets |
| Readiness, planning, and dependencies | 3 | Completed batches required; verified report gates configuration; eight-area dependency checks | Production lifecycle not supported; P2 VC-P2-01 | Prevents out-of-order work | Makes blockers explicit | Durable workflow plus production permission checks |
| Mapping and accounting compatibility | 3 | Executed-manifest hash, complete attributable mappings, explicit AP compatibility | Limited synthetic account/tax/currency coverage; P2 VC-P2-02 | Protects financial classification | Avoids unsupported account or tax treatment | Expand fixture coverage before broader provider claims |
| Human approval and migration handoff | 3 | Required decisions, modified/rejected paths, approval-bypass and tamper tests | Real delegated identity absent; P2 VC-P2-01 | Separates recommendation from authority | Makes exactly what was approved inspectable | Production authorization and consent model |
| Blockers, unsupported items, and exception ownership | 3 | Missing evidence/source inconsistencies block; supported repairs require approval | Unsupported repairs require investigation; P2 VC-P2-01 | Prevents disappearing exceptions | No hidden write-offs or fabricated records | Durable support escalation/cancel/rebase workflow |
| Lineage, evidence, and audit integrity | 3 | Per-record source hashes, report/manifest binding, before-payload retention, state events | Process-local audit not tamper-proof; P2 VC-P2-01 | Allows review of causal evidence | Makes repair accountable | Durable append-only evidence and retention controls |
| Execution, validation, and recovery boundary | 3 | Exact Decimal, A/R ledger tie, A/P control accounts, per-account trial/opening checks, revalidation | No bills subledger, FX, broad production reconciliation; P2 VC-P2-02 | Prevents false readiness from matching totals alone | Protects users from unsupported accounting claims | Add representative subledgers/currency contracts in future scoped work |
| Onboarding and verified First Productive Use continuity | 3 | Computed future handoff, explicit unimplemented next phase, no false FPU event | Onboard/FPU intentionally future; P3 phase boundary | Preserves the North Star outcome | Configured books are not falsely called productive use | Next separate phase: Onboard → Verified First Productive Use |

## Reviewer lens results

| Reviewer | Assessment / findings |
| --- | --- |
| Product | All 7 criteria above; no unresolved P0/P1. Synthetic scope and canonical journey preserved |
| Customer Outcome | Repair/configuration tasks demonstrable; no measured FPU or customer uplift claimed; VC-P2-02 |
| Migration | All 8 criteria above; VC-01, VC-02, VC-05 resolved; limited accounting coverage explicitly bounded |
| Agentic AI | All 8 criteria above; parent owns state, deterministic tools own truth; VC-03 resolved |
| GenAI Quality | Active output is grounded deterministic fallback. No live model evaluation claimed; VC-P3-02 |
| FinTech Trust | Exact-decimal, manifest/source/target evidence, human consequential approvals; VC-05/06 resolved |
| UX | Discrepancies first, matching details collapsible, eight settings, visible next actions, retry/rejection recovery; VC-P2-02 |
| Accessibility | Shared semantic tokens, text/icon states, labeled native controls, mobile layout; VC-04 resolved; broader assistive-tech validation in VC-P2-02 |
| Architecture | Provider-neutral domain/tools/agents/API split, optional runtime seam, no arithmetic agents; VC-P2-01 |
| Security | Owner isolation, no new egress or secrets, production demo-token rejection, internal-event allowlist; no new P0/P1 for synthetic scope |
| Reliability / Operations | Atomic new decisions, safe stale-state failure, session-expiry recovery; durability explicitly deferred in VC-P2-01 |
| Metrics | Contracts and deduplication/denominator intent documented, no fabricated measurements; VC-P3-01 |
| Release Readiness | All 17 areas considered below; no unresolved P0/P1 for bounded local reference slice |
| Demo | Live discrepancy and configuration loop works without credentials; earlier approval replay disclosed, FPU not claimed |

## All 17 release areas

These are scope-proportionate assessments, not scores or production certifications.

| Area | Synthetic-scope assessment / evidence |
| --- | --- |
| User | Task actions and recovery verified locally; representative-user study remains VC-P2-02 |
| Customer outcome | Verified intermediate handoff, no FPU claim or measured improvement |
| Business | No new model/cloud cost; value hypothesis explicit, commercial validation deferred |
| Product | Locked full journey retained; only Validate → Configure added |
| Migration correctness | 14 golden cases plus adversarial checks; narrow accounting contract disclosed |
| Agent behavior | Tools, ownership, stops, approval, and handoffs tested |
| GenAI quality | Deterministic active path; live model quality not applicable to shipped behavior |
| Deterministic quality | Versioned exact checks, reproducible results, fail-closed evidence |
| Safety / trust | Consequential gates and before/after audit; stale state cannot silently pass |
| Security / privacy | Synthetic data only; authorization/forgery tests and secret scan; no real-tenant claim |
| UX / accessibility | Workflow tests and local light/dark/mobile/keyboard inspection; reduced-motion CSS test |
| Reliability | Single-process safety/recovery sufficient for demo, not durable operations |
| Engineering quality | Ruff, tests, lint, types, build, links, whitespace; inherited advisory kept separate |
| Platform architecture | Domain/tool/adaptor separation, versioned events, unchanged provider boundary |
| Evaluation | Executable required cases and extra negative tests; limited representativeness explicit |
| Feedback / support | Clear error and blocked-repair guidance; no production support UI/backend implied |
| Demo readiness | Controlled discrepancy, remediation, revalidation, choices, and honest final boundary verified |

## Remaining findings and follow-up ownership

The repository maintainer owns tracking and the human release decision. Proposed specialist owners
below are roles, not claims that an external team accepted work. All follow-ups must be revisited
before the indicated expansion; none is a license to use synthetic controls on real financial data.

| ID | Severity | Finding / consequence | Owner and remediation / trigger |
| --- | --- | --- | --- |
| VC-P2-01 | P2 | Ephemeral single-process sessions, shared demo identity, non-durable audit/support and stale-repair investigation limit operations | Maintainer / platform-security: durable transactional storage, production identity, retention, repair recovery, support and load tests **before real data, multi-worker use, or deployment**. Keep current synthetic/no-egress boundary |
| VC-P2-02 | P2 | Narrow accounting fixture and author-run UX evaluation do not establish representative financial/user correctness | Maintainer / migration-product: bills subledger, richer journals/FX contracts, larger fixtures, customer and assistive-tech validation **before broader correctness or provider claims** |
| VC-P2-03 | P2 | Inherited Next.js/PostCSS advisory remains outside this feature's dependency scope | Maintainer / dependency owner: separately triage/upgrade and regress before public deployment. No dependency versions changed here; no claim of a new clean audit |
| VC-P3-01 | P3 | Production event delivery, metric baselines/owners and instrumentation absent | Maintainer / analytics: instrument nine contracts, validate deduplication/denominators, establish owners and baselines before measured outcome reporting |
| VC-P3-02 | P3 | Optional ADK/Gemini runtime and semantic explanation quality unevaluated | Maintainer / AI platform: verify pinned SDK, authorized context loader, callbacks and model evals before enabling optional provider |
| VC-P3-03 | P3 | Activity shows recent items without dedicated filtering/export UI | Maintainer / UX: add usable filtering/export when larger synthetic workflows make inspection burdensome; existing full API remains available |
| VC-P3-04 | P3 | Inherited Starlette test-client deprecation warning | Maintainer / test infrastructure: update supported client dependency in a separate compatibility change before removal deadline |

## Recommendation and recovery

Recommend branch publication and a normal pull request only after the owner requests it. Do not
merge automatically. The next implementation phase is **Onboard → Verified First Productive Use**,
with a versioned productive-use contract; it is not part of this commit.

Local demo recovery: reload the session; if the API restarted, start a clearly labeled new synthetic
scenario. Code rollback is a normal revert of the implementation commit. No deployment, database
migration, external provider state, or cloud resource needs reversal. Production monitoring and
support remain explicit follow-ups, not fabricated operational readiness.
