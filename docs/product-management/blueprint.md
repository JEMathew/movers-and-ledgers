# Product Management Blueprint

Version 1, 17 October 2026. Owner: product/release integration owner. These are strategy and acceptance contracts for a bounded synthetic Beta. Persona needs and opportunities below are hypotheses derived from the product directive and existing constitutions, not completed research.

## 1 Product Vision

MoveBooks AI, by Movers & Ledgers, helps accountants and businesses move their books with evidence and retain confidence in the first useful task afterward. Tagline: **Move your books. Keep your confidence.** Verified First Productive Use (FPU), rather than a file-transfer counter, defines the intended customer outcome. See the [constitution](../PRODUCT_CONSTITUTION.md).

## 2 Product Strategy

Serve a narrow, reviewable accounting migration before generalizing adapters. Teach through Play, demonstrate through Harbor Light Books, and preview permitted test records through Try Your Data. Reuse one canonical lifecycle and one evidence model. Differentiate through explainable ambiguity, human financial authority, deterministic verification and continuity into an approved synthetic invoice. AI explains uncertain decisions; deterministic code owns financial results.

The competitive wedge is a product hypothesis: integrating learning, migration decisions, reconciliation and productive adoption may remove handover uncertainty that an import-only workflow leaves unresolved. No competitor benchmark or customer preference is asserted. Validate this with accountant task observation before a real-data launch.

## 3 Persona Map

| Persona | Job / evidence need | Authority / boundary |
| --- | --- | --- |
| Accountant / bookkeeper (primary) | Decide mapping treatment, trace exceptions, prove balances | Reviews proposals and consequential choices in owner role today |
| Small-business owner (primary) | Understand readiness and know the new books are usable | Accepts scope and performs first task; delegated roles remain future |
| Finance operator (primary) | Run a safe, recoverable workflow | Operates permitted steps; cannot bypass reconciliation |
| Migration specialist | Diagnose unsupported records and recovery | Future distinct role; current owner-only Beta |
| Financial approver | Check high-impact mapping/configuration | Human approval required; current workspace owner |
| Administrator | Maintain access, policy, operating controls | No model authority over financial state |

## 4 Jobs to Be Done

When my legacy books become difficult to maintain, help me discover what can move and what requires a decision, so I can choose a migration without hiding financial risk. When a clearing account is ambiguous, show evidence and uncertainty so I can approve, reject or change the proposal. After the move, prove the controls passed and let me complete my first agreed task, so I can start working with confidence.

For a new learner: let me explore an office and solve a small evidence puzzle so migration concepts become understandable. For an operator with permitted test exports: show precise validation issues and allow correction before I create a workspace.

## 5 Value Proposition Canvas

| Customer profile hypothesis | Product response | Evidence needed |
| --- | --- | --- |
| Job: decide whether migration is safe | Readiness and versioned plan | Observed accountant comprehension and correct next action |
| Pain: hidden unsupported data | Explicit issues and disposition | Malformed/schema/relationship negative tests and user task |
| Pain: uncertain account treatment | Evidence, Gemini explanation and independent review | Grounding, uncertainty and no-authority tests |
| Gain: verifiable handover | Deterministic reconciliation and FPU receipt | End-to-end controls and approved synthetic invoice |
| Gain: approachable learning | Play office mission with accessible interaction | Keyboard/mobile/reduced-motion acceptance |

## 6 Opportunity Solution Tree

Desired outcome: eligible journeys reach verified FPU. Opportunity hypotheses branch into (a) comprehension: Play and progressive disclosure, (b) readiness: controlled validation and actionable issues, (c) informed decisions: evidence-backed mapping, Gemini and Reviewer, (d) safe execution: approved manifests, checkpoints and bounded recovery, (e) usable result: reconciliation, configuration, onboarding and invoice. Each branch links to [feature contracts](feature-contracts.md). Test comprehension through unprompted next-step identification, decision quality through golden cases, and completion through deterministic journey tests. Do not treat feature use as outcome evidence.

## 7 Customer Journey Map

| Phase | User goal and action | Likely pain hypothesis | Intended outcome |
| --- | --- | --- | --- |
| Entry | Play, Explore Demo or validate test package | Technical intimidation / unclear scope | Understand synthetic boundary and choose next action |
| Understand | Discover records, assess findings | Unsupported data hidden | Explicit inventory and readiness blockers |
| Prepare | Review plan, map account 1200, decide | Uncertain classification and impact | Attributable approved plan and mappings |
| Move | Authorize synthetic execution, resolve failures | Repeated writes or opaque recovery | Checkpoints, idempotency, safe retry/escalation |
| Verify | Inspect reconciliation and configuration | False green status | Deterministic evidence, approved sensitive settings |
| Start | Complete onboarding and approved invoice | Transfer mistaken for adoption | Verified FPU evidence linked to original contract |

The five customer phases map to Discover/Assess; Plan/Map & Approve; Migrate/Resolve; Validate/Configure; Onboard/FPU. [Journey diagram](../architecture-experience/source/customer-journey.mmd).

## 8 Service Blueprint

Customer actions appear in the UI; authenticated API checks ownership and valid state; deterministic specialists propose and validate; scoped source and target adapters enforce boundaries; authoritative session/audit records retain decisions and evidence. User-triggered advisory calls use a synthetic allowlisted projection and return to the accountant. Existing audit data is separate from future Firestore activity. Recovery reloads authoritative state and respects idempotency before retry. [Editable service blueprint](../architecture-experience/source/service-blueprint.mmd).

## 9 Product Capability Map

Learn/Play: conceptual learning and isolated game progress. Intake: package validation, provenance, review and canonical handoff. Journey: discovery, readiness, planning, mapping, approvals, migration, resolution, validation, configuration, onboarding and FPU. Advisory: shared bounded Gemini in five contexts; independent mapping review. Internal evaluation: Agent Quality Judge and Product Quality Judge, outside financial execution. Platform: identity, owner access, persistence, audit, operational budgets, kill switch and safe fallback. Source code proves implementation only; deployment evidence is separate.

## 10 Now/Next/Later Roadmap

**Now:** one genuine Play mission, browser-local intake fallback, complete synthetic demo, independent mapping Reviewer, offline evaluator, accurate docs/diagrams/deck/video, negative control tests and release evidence. **Next, gated:** activate approved Gemini and operational Firestore controls only after identity, durable quotas, budget, region/permissions and sanitized evidence pass; activate hosted uploads only after all independent upload gates. **Later:** supported provider pairs, reviewed real-data operating model, delegated roles, retention/deletion, measured user outcomes and adapter-specific FPU contracts. No deadline grants an exception to security or financial controls.

## 11 Prioritized Product Backlog

| ID | Priority | Deliverable / completion condition |
| --- | --- | --- |
| MB-01 | P0 | Explore complete synthetic journey without hidden intervention and with reconciliation/FPU evidence |
| MB-02 | P0 | Play opening mission with movement, interactions, puzzle, feedback and accessible controls |
| MB-03 | P0 | Try Your Data browser-local fallback, negative validation, honest handoff limits |
| MB-04 | P0 | Gemini synthetic authorization, quotas, durable global budgets, kill switch, safe fallback; live gate separate |
| MB-05 | P0 | Independent Reviewer mapping slice with evidence contract and no mutation |
| MB-06 | P0 | Internal Agent Quality Judge golden cases and reproducible report |
| MB-07 | P0 | Product Quality Judge assesses actual functionality against promises and records weighted evidence |
| MB-08 | P0 | PM/PRFAQ, editable diagrams, reviewable deck/PDF and authentic 3–4 minute video |
| MB-09 | P0 release gate | Official template, portal constraints, public URLs and deployment acceptance |
| MB-10 | P0 release gate | Hosted-upload isolation, malware protection, retention/deletion, abuse/concurrency and negative tests |
| MB-11 | P1 | Dormant setup accepted; local controls/outbox emulator tests pass. Cloud phase adapter/schema/index/API/UI/worker and separately approved IAM/activation remain required |
| MB-12 | Later | Provider adapters and real-data operating/legal/security approval |

## 12 Feature PRDs and Acceptance Criteria

See the [feature contracts](feature-contracts.md) for customer promise, boundary, acceptance and evidence for all seven required major capabilities. Changes must pass the same financial and security gates as code.

## 13 Requirements Traceability Matrix

The [promise traceability matrix](promise-traceability.md) joins promise, persona/JTBD, requirement, acceptance, backlog, implementation/test evidence, deployed evidence and customer outcome. Unknown deployed evidence is a release blocker, never a delivered claim.

## 14 North Star/KPI Tree

Proposed North Star: eligible migration journeys reaching verified FPU / eligible cohort journeys whose observation window elapsed. Open journeys remain visible. Leading indicators: readiness comprehension, issue correction, informed mapping decisions and onboarding completion. Guardrails: reconciliation correctness, approval integrity, unsafe output prevented, leakage, recovery correctness, model cost and time to useful result. Segment assisted/self-service journeys, complexity and source/target adapters. No measured adoption, accuracy, time-saving or impact metric is claimed. Full denominator/window/privacy contracts live in [METRICS_FRAMEWORK.md](../METRICS_FRAMEWORK.md).

## 15 Product Decision Register

| Decision | Commitment / trade-off | Risk and evidence trigger |
| --- | --- | --- |
| PD-01 | Keep bounded synthetic Beta | Limits immediate applicability; real-data launch requires independent gate |
| PD-02 | Deterministic workflows, bounded advisory model | Less autonomy; prevents model financial authority |
| PD-03 | Separate Reviewer, Agent Judge and Product Judge | Additional evaluation work; no extra runtime agents without customer value |
| PD-04 | Cloud SQL is financial/transactional authority | Firestore controls/activity remain separate; no dual financial store |
| PD-05 | Keep Try Your Data with browser-local fallback | Browser-local preview cannot silently claim hosted handoff |
| PD-06 | One Play opening mission | Learner task acceptance precedes future missions |
| PD-07 | Hypothetical PR/FAQ guides acceptance | Never overrides current security or deployment truth |
| PD-08 | Official-template compliance remains open until source received | Draft deck/PDF is reviewable, not claimed prescribed submission |

Unresolved assumptions: accountants value an integrated handover; learners transfer Play learning into real decisions; independent review improves decisions; supported adapters can preserve semantics; costs permit sustainable operation. Research and measured product evidence must challenge these assumptions before production expansion.
