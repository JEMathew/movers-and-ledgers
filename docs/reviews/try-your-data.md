# Try Your Data review

Date: 2026-09-27. Branch: `feature/try-your-data`, baseline `8f24ead`.
Scope: local controlled, de-identified test packages into the existing synthetic-target Beta.
Method: builder-run advisory reviewer lenses, adversarial/API/component tests and live browser QA.
Not an independent audit, human merge approval, hosted intake authorization or production certification.

**GREEN for the controlled local public-reference Beta scope only.** Final P0: 0; final P1: 0.
Confidential customer-data handling and public deployment remain prohibited pending the separate
identity/privacy/operations release gates. Human owner decides publication and merge.

References: [architecture](../architecture/try-your-data.md), [integrated lifecycle](../architecture/beta-v1-integration.md),
[release policy](../RELEASE_READINESS.md), [severity](../reviewers/REVIEW_RUBRICS.md),
[threat model](../security/THREAT_MODEL.md).

## Findings, remediation and re-review

| ID | Initial severity / evidence | Why it matters | Remediation and retest |
| --- | --- | --- | --- |
| TYD-01 | P1: downstream service methods loaded only catalog fixtures; uploaded evidence would be unavailable at mapping/execution | Important new path would dead-end or use the wrong source | Session-owned excluded source plus shared `source_for` used across all downstream contexts; full uploaded journey reaches verified synthetic FPU without demo loaders. Resolved. |
| TYD-02 | P1: original eight-batch contract omitted bills | Accepting supported bills then dropping them would be financial data loss | Optional ninth batch, counts/identity/transformation coverage and exact bill-to-A/P reconciliation; original eight-batch fixtures preserved. Bill tamper and replay tests pass. Resolved. |
| TYD-03 | P1: original public Trust fetched complete session payload and generic synthetic-only labels | Uploaded source could reach an unnecessarily broad Trust payload or be mislabeled as fixture data | New server allowlist, explicit source/target distinction, no names/amounts/source IDs/selected values; redaction tests before and after FPU. Resolved. |
| TYD-04 | P1: browser Assessment still advertised upload unavailable, selected an invalid sample for uploaded sessions, and read retry could create a sample | Confuses evidence ownership and can replace an important workspace context | Updated entry and source notice, allowlisted sample selection, retry same session GET; uploaded-session regression test. Resolved. |
| TYD-05 | P2: generic reference-error row index could shift after an earlier malformed row | User might repair the wrong record | Resolve reference issue location through accepted-row lineage, preserving original CSV record ordinal. Resolved. |

Initial actionable findings: P0 0, P1 4, P2 1. All resolved; no accepted/open P0/P1.
No stage-skip, forged approval, model egress, raw Trust financial payload or provider-write path found
in the exercised contracts. Review does not claim exhaustive parser/security validation.

## Evidence and gates

| Gate | Result |
| --- | --- |
| Ruff | PASS |
| Backend | 190 passed, including 33 new intake cases; inherited Starlette test-client deprecation warning |
| Frontend | 67 passed, including six intake cases and uploaded Assessment recovery regression |
| TypeScript / frontend lint | PASS / PASS |
| Production build | PASS; 23 pages, Try Your Data route 5.59 kB before shared JS; no new dependencies |
| Markdown links | PASS; 77 Markdown files checked for repository-relative file targets; not external URLs or all anchors |
| Whitespace | PASS; git diff --check |
| Bounded secret scan | PASS; 288 tracked/new text files up to 600 kB screened for common credential/private-key patterns; not an exhaustive security audit |

New backend coverage: direct valid package; ZIP equivalence; PDF/unknown filename, binary/UTF-8,
malformed CSV/JSON and duplicate JSON keys; missing columns/IDs, duplicate IDs, customer/vendor,
product/transaction references; invalid money/tax/journal; oversized files/counts/body; nested ZIP,
traversal, duplicate ZIP entries and compression ratio; warning/exclusion visibility; replace/retry;
blocked creation; strict review input; owner isolation/auth; ticket expiry/capacity/discard;
repeatability; concurrent/idempotent handoff; early-stage rejection; minimized Trust at assessment
and FPU; full uploaded journey including bills; bill mutation blocks reconciliation; duplicate start
does not replay writes. Existing complete suite exercises controlled failure/recovery, rejection,
checkpoint resume, concurrent-write and lifecycle-event/replay protection.

Frontend tests cover accessible input, no automatic upload, privacy confirmation, explicit review,
same-session handoff, heading focus, blocked creation, replace/revalidate resets approval, local size
limits, error announcements, expired API state, ten contracts and uploaded source/retry truthfulness.
The historical “uploads unavailable” assertion was intentionally replaced with controlled-intake
routing: this branch implements that capability; governed dialog tests were not weakened.

Live browser evidence (local loopback only):

- Selected generated synthetic ZIP through the native file chooser; privacy checkbox and Validate
  operated by keyboard. READY showed all eight file counts, and workspace creation stayed disabled
  until explicit review. Headings received focus after both operations.
- Created session `a1a4113b-d448-42b4-8465-a2a29f9559c8`, entered ordinary Discover/Assess and inspected
  same-session payload-free Trust with user-provided source / synthetic-target label. No demo replay.
- Unsupported test file produced BLOCKED, visible issue alerts and disabled creation; focus landed
  on review. Removal clears the report. Replacement/retry is additionally exercised in API/component tests.
- 390×844 light and 1365×900 dark inspected; no horizontal document overflow. Native schema disclosure
  opens with Enter, retains keyboard focus and has a solid visible outline. Status uses words and icons.
- Reduced-motion stylesheet regression passes; no new animations. No live OS preference change,
  screen-reader user study or broad-device certification claimed. No full manual browser run to FPU
  in this slice; the uploaded end-to-end API test explicitly exercises every required human decision.

Preview/API stopped and temporary browser tab closed after QA. Session above is ephemeral evidence,
not a hosted customer record. No raw financial payload appeared in the observed server access logs.

## Criterion-level rubric assessment

All 23 criteria use canonical 0–4 scales; no aggregate score. Three means repository evidence for
the stated local scope, not production validation. Remaining severity refers to owned follow-ups.

### Product Management

Source: [Product Management Rubric](../rubrics/PRODUCT_MANAGEMENT_RUBRIC.md).

| Criterion | Score | Evidence | Gap | Why MoveBooks AI | Why end user | Severity / remediation |
| --- | --- | --- | --- | --- | --- | --- |
| Problem significance and target user | 3 | Owner profiles a bounded export before any target action | No representative finance-user study | Makes business-specific uncertainty actionable | Sees whether the actual package is usable | P2: Product/UX research before customer claims. |
| Canonical journey and outcome alignment | 3 | Shared source/session/agents; uploaded API journey to FPU | One rich golden package | Prevents disconnected upload demo | Same evidence and decisions throughout | P2: Migration owner expands representative packages. |
| Scope, non-goals, and beta boundary | 3 | Local/de-identified notice, existing production auth rejection, synthetic target | No hosted privacy/security certification | Prevents unsupported commitments | Does not confuse test intake with secure production service | P2: Security launch gates before external exposure. |
| User value and actionability | 3 | File inventory, issue location/why/action, remove/retry, browser evidence | Some schema errors are broad; manual export preparation | Moves blocked users toward evidence | Clear stop and repair route | P3: UX field-specific remediation and template guidance. |
| Progressive trust and decision ownership | 3 | Privacy confirmation, hashed package review, unchanged downstream approvals | Shared demo identity only | No parser or agent approval authority | User owns exclusions and consequential changes | P2: Production roles/privacy before customer use. |
| Metrics and evidence discipline | 2 | Ten source/trigger/owner/denominator contracts, no emissions | No instrumentation/window/baseline | Avoids measuring upload as FPU | No invented success rate | P3: Metrics owner defines consent/cohorts before activation. |
| Product coherence, business fit, and truthful demo | 3 | Existing routes/primitives; no new dependencies or paid services | Adoption and support burden unmeasured | Reusable intake adapter, not second engine | Predictable governed experience | P3: Product evaluates preparation burden/cost. |

### Agentic AI

Source: [Agentic AI Rubric](../rubrics/AGENTIC_AI_RUBRIC.md).

| Criterion | Score | Evidence | Gap | Why MoveBooks AI | Why end user | Severity / remediation |
| --- | --- | --- | --- | --- | --- | --- |
| Agent necessity and ownership | 3 | No new named agents; existing Discovery/Assessment reuse | Managed runtime future | Avoids agent-count theatre | Clear responsibility | P3: Evaluate Google runtime separately. |
| Orchestration and workflow state | 3 | Server-created CREATED session, ordinary discovery/assessment, early-call tests | Process-local state | One lifecycle authority | Cannot skip approvals by uploading state fields | P2: Platform durable transactional lifecycle. |
| Tool authority and least privilege | 3 | Strict envelope/config, no LLM/filepath execution, read-only Trust | No production workload IAM | Data cannot become instructions | Upload cannot authorize target writes | P2: Security IAM and parser sandbox before hosting. |
| Evidence, provenance, confidence, and explanations | 3 | Source/file/row hashes and explicit exclusions; no invented confidence | Simplified safe Trust summaries | Traceable normalization | Knows data origin and next action | P3: Improve bounded explanations without raw payloads. |
| Human governance and escalation | 3 | Attributable package review, blocker stop, existing manifest/decision tests | No staffed support or delegated roles | Preserves consequential boundaries | Controls what proceeds | P2: Real roles and escalation before real operations. |
| Failure handling, idempotency, and safe stopping | 3 | Same-ticket lock, repository CAS, replay, expiry/429 and replacement tests | No durable ticket/restart recovery | Prevents duplicate local handoff | Retry does not auto-create approvals | P2: Durable service recovery and idempotency. |
| Security, privacy, and auditability | 3 | Bounded parsing, owner checks, excluded source, server Trust allowlist | No isolated parser, malware scan, real tenants or secure retention | Makes Beta boundary defensible | Does not promise safe confidential intake | P2: Security/privacy full launch assessment. |
| Evaluation, fallback, and runtime portability | 3 | Adversarial cases, deterministic repeatability, full regression | No broad fuzz corpus or live-model evidence | Provider-independent safety | No model dependency or egress | P2: Independent parser fuzzing before exposure; AI runtime later. |

### Migration & Onboarding

Source: [Migration & Onboarding Rubric](../rubrics/MIGRATION_ONBOARDING_RUBRIC.md).

| Criterion | Score | Evidence | Gap | Why MoveBooks AI | Why end user | Severity / remediation |
| --- | --- | --- | --- | --- | --- | --- |
| Source, target, and canonical boundaries | 3 | Exact v1 package to existing Beta envelope; source provenance separate | Not arbitrary/provider exports or all rich domain types | Extensible adapter boundary | No misleading provider compatibility | P2: Migration representative adapter conformance. |
| Readiness, planning, and dependencies | 3 | Blocked tickets cannot create; real assessment then plan | Limited schema/source range | Intake does not declare migration readiness | Knows validation is only the first gate | P2: Broader readiness corpus. |
| Mapping and accounting compatibility | 3 | Types/references/control accounts and existing mapping gates | Unsupported treatments may stop later | Keeps financial meaning governed | No silent reclassification or FX | P2: Expand transformation contracts separately. |
| Human approval and migration handoff | 3 | Package consent distinct from manifest approvals; no-stage-bypass tests | Demo owner only | No implicit financial authority | Upload does not authorize migration | P2: Scoped production authorization. |
| Blockers, unsupported items, and exception ownership | 3 | Explicit files/rows/issues/excluded fields; remove/replace/retry | Generic schema summaries in some cases | No silent unsupported-field loss | User can repair outside the tool | P3: More granular field-level help, not silent repair. |
| Lineage, evidence, and audit integrity | 3 | File/row hashes, source checksum, review binding, envelope checks | No immutable/durable raw archive | Reconstructable local transformation | Can locate original record and exclusions | P2: Reviewed storage/retention/audit design. |
| Execution, validation, and recovery boundary | 3 | Bills preserved; exact A/P match, bill tamper blocks; inherited retry suite | Synthetic target only | No false successful bill migration | Financial mismatches cannot be approved away | P2: Real adapter and production recovery validation. |
| Onboarding and verified First Productive Use continuity | 3 | Uploaded golden reaches same approved invoice/FPU | Not representative customer outcome evidence | Intake connects to business use | Transfer is not presented as completion | P2: Validate representative productive tasks before claims. |

## Required reviewer lenses

| Lens | Finding / outcome |
| --- | --- |
| Product | TYD-04 resolved; no production promise. Research/preparation burden follow-up. |
| Customer Outcome | Full uploaded API journey supports continuity, not measured customer success. Representative study pending. |
| Migration | TYD-01/02 resolved; no source substitution, lost bills or implicit approvals in tests. |
| Agentic AI | Existing agents/tools reused; no model egress or data-driven authority. No new blocking finding. |
| FinTech Trust | TYD-02/03 resolved; exact bills reconciliation, explicit review and truthful provenance. |
| UX | Repair and next-action loop works; generic schema detail remains P3. |
| Accessibility | Native input, headings, alerts, focus, themes and viewports checked; assistive-user breadth remains P2. |
| Architecture | Shared session and source adapter; no parallel migration engine; local locks not distributed guarantees. |
| Security | Bounded untrusted parser and minimized Trust verified; public/confidential intake remains a separate blocked launch scope. |
| Release Readiness | Required gates and all areas below considered; no open P0/P1 in local test-export scope. |
| Demo | Real uploaded package enters ordinary assessment, and API journey reaches FPU without demo-loader approvals. |

## All 17 readiness areas

GREEN below is bounded to local de-identified test-export evaluation, not production hosting.

| Area | Decision / evidence and limitation |
| --- | --- |
| User | GREEN: selectable template, errors, review and repair; representative research pending. |
| Customer outcome | GREEN: existing journey continuity to verified synthetic FPU; no real outcome claim. |
| Business | GREEN: no paid resources/dependencies; operating economics unmeasured. |
| Product | GREEN: controlled intake fits Product, Assessment and Trust with explicit scope. |
| Migration correctness | GREEN: source preservation, references, exact money/bills and full journey regression. |
| Agent behavior | GREEN: existing bounded agents, no new approval/write authority. |
| GenAI quality | GREEN for no-LLM deterministic fallback only; live quality is unassessed and out of scope. |
| Deterministic quality | GREEN: repeatable reports and adversarial false-pass tests. |
| Safety/trust | GREEN: explicit review, blocked creation, synthetic target and payload-free Trust. |
| Security/privacy | GREEN for local de-identified testing only; not adequate for confidential data or hosting. |
| UX/accessibility | GREEN for exercised browser/component paths; no broad accessibility certification. |
| Reliability | GREEN for bounded memory/tickets and local replay/CAS; restart expires state. |
| Engineering quality | GREEN: recorded gates above pass; inherited advisory remains separately owned. |
| Platform architecture | GREEN: shared lifecycle/source seam, conditional bills batch, no new runtime. |
| Evaluation | GREEN: intake abuse cases and uploaded FPU plus inherited full suite; independent fuzzing pending. |
| Feedback/support | GREEN for existing self-help and safe local issue drafts only; no staffed service. |
| Demo readiness | GREEN: genuine uploaded synthetic template, review, same-session assessment/Trust; no hidden approvals. |

## Remaining owned follow-ups

| ID | Severity | Gap / owner / mitigation / trigger |
| --- | --- | --- |
| R-01 | P2 | Security/platform: real identity/tenant controls, isolated parsing/malware scanning, retention/deletion, durable transactions and immutable audit. Restrict to local de-identified testing; mandatory gates before real customers or hosting. |
| R-02 | P2 | Migration/security: larger representative packages, independent fuzzing, adversarial concurrency and provider/financial compatibility. Versioned controlled schema and safe stops until separately validated. |
| R-03 | P2 | Engineering: inherited Next.js/PostCSS advisory. No deployment; separate dependency/security remediation before hosting. No vulnerability-clear claim. |
| R-04 | P2 | UX/product: screen-reader users, broader devices and representative export-preparation/comprehension research. Current browser/component evidence is bounded. |
| R-05 | P3 | UX: more granular per-field schema messages and long inventory pagination. Current file/row + template/replacement workaround; refine before larger packages. |
| R-06 | P3 | Product/operations: telemetry/cohorts and managed feedback intake unimplemented; contracts only, no fabricated results. |
| R-07 | P3 | Engineering/AI: inherited Starlette warning, live Gemini and managed ADK remain separate maintenance/runtime work. Deterministic fallback only. |

No licensing/IP changes. Rollback: normal reviewed revert, never rewrite public history.
Next phase: Google-native runtime integration **with** identity, privacy, storage and operational
gates; then live Gemini/ADK activation/evaluation, then final UX/demo polish. Human review first.
