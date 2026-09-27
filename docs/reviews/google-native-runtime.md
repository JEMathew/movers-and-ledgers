# Google-native runtime foundation review

Date: 2026-09-27. Branch `feature/google-native-runtime`, baseline `e811e96`.
Method: author-run builder/reviewer lenses, executable offline adversarial/integration tests and
local browser checks. Not independent human approval, security certification or managed-cloud validation.

**AMBER: implemented runtime foundations with Docker/PostgreSQL execution gates pending.**
No unresolved P0/P1 implementation finding in the exercised synthetic/offline scope. This is **not**
production readiness, customer-data readiness or permission to deploy. No deployment, live Gemini,
managed ADK, real provider connection or branch publication was performed.

References: [architecture](../architecture/google-native-runtime.md), [operator handoff](../deployment/google-cloud.md),
[release readiness](../RELEASE_READINESS.md), [severity framework](../reviewers/REVIEW_RUBRICS.md).
Public-reference/IP notices and repository licensing position remain unchanged.

## Findings and remediation

Initial review: P0 0; P1 4; P2 1. All four P1 and the actionable P2 below resolved. Follow-up risk
inventory is separate; pending execution evidence is never counted as a passed gate.

| ID | Severity | Finding / impact | Remediation / evidence |
| --- | --- | --- | --- |
| GR-01 | P1 | Demo-only auth and browser hard-coded demo headers would not provide an owner boundary for cloud workspaces; omitted cloud config could expose shared demo identity. | Firebase verified-token port with revocation, namespaced UID, cloud config/K_SERVICE/emulator rejection, production demo denial, shared browser token adapter and HTTPS requirement; identity/owner/actor tests. |
| GR-02 | P1 | Memory snapshots cannot survive instances/restarts; ordinary API serialization excludes owner, risking lost authorization on naive persistence; overwrite writes could lose approvals. | Explicit versioned private-owner codec, insert-only creation, owner+digest CAS, immutable identity, integrity check, no memory fallback; 14 golden journeys with new DB engine each read and two-connection CAS race. |
| GR-03 | P1 | Reusing local intake state in cloud would imply unconsented retention and unsafe process-local tickets; raw adapter exception/access logs could disclose request content. | Cloud intake rejected before parse, durable uploaded sessions rejected, scoped consent-based artifact seam, bucket privacy/preconditions, allowlist JSON logging and generic SDK outage responses; raw-marker and negative tests. |
| GR-04 | P1 | API image omitted tools/fixtures; shell did not exec server; synchronous SQL calls in async handlers would block unrelated requests/health. | Complete image context, exec/SIGTERM drain, body bounds/deadline, health/readiness, sync route worker-pool execution. Existing 240-test backend suite passes; actual Docker build remains a separate unmet release gate. |
| GR-05 | P2 | Keyboard focus left sign-in button when temporarily disabled; unavailable identity had no deliberate focus destination. | Focus visible role=alert on error; browser DOM verifies active alert and solid focus outline; component regression added. |

Security review covers auth bypass, owner/cross-workspace reads and decisions, private object scope,
IAM least privilege, secrets, forged lifecycle events, replay, duplicate execution, persisted races,
unconsented upload persistence, logging leakage and insecure defaults. No financial truth/model
authority changed. Dependency scan still reports inherited Next.js/PostCSS findings; no new Firebase
advisory appeared in the observed npm audit. This is not an exhaustive vulnerability-clear claim.

## Validation evidence

| Gate | Observed result |
| --- | --- |
| Ruff | PASS |
| Complete backend suite | 240 passed; inherited Starlette test-client deprecation warning |
| Runtime-focused suites | 50 passed, including 14 integrated golden cases against durable SQLite |
| Frontend suite | 76 passed, including unavailable-identity focus regression |
| TypeScript / frontend lint / production build | PASS / PASS / PASS; 24 pages generated |
| Python wheel packaging | PASS; isolated wheel build, no cloud credentials |
| Relative Markdown targets / bounded secret patterns / whitespace | PASS; 80 Markdown files, 307 text files scanned; git diff --check passes |
| Docker API/web build and smoke | NOT RUN: Docker CLI/daemon unavailable locally; CI job added |
| PostgreSQL-specific execution | NOT RUN locally; PostgreSQL 17 CI service/job added |
| Real Firebase, Cloud SQL, GCS, Secret Manager/IAM | NOT RUN; SDK interfaces/offline doubles only; no credentials/resources used |

Test-area coverage: local/test config; complete/missing/unsafe cloud config; emulator/default denial;
identity/revocation contract; public vs protected endpoints; verified actor/role; owner isolation;
memory/durable repository ports; reload/resume/idempotency; independent-connection race;
private-owner serialization; raw upload rejection; artifact naming/consent/owner/deletion;
public bucket rejection; GCS generation preconditions; unavailable/rotation-friendly secret access;
log allowlist/no raw intake/token/query/SDK messages; health/readiness/outage; chunked body limit;
deterministic fallback and complete lifecycle continuity. Docker build coverage is a CI definition,
not a locally passed test. PostgreSQL service wiring is not equivalent to a completed PostgreSQL run.

Fourteen persisted journeys cover: full verified FPU, blocked readiness, mapping rejection, migration
failure/retry, validation mismatch repair, high-risk configuration, onboarding prerequisite, FPU failure,
model unavailable, checkpoint resume, duplicate execution, approval attribution, deterministic
repeatability and unsafe stage bypass. Golden assertions preserve upstream artifacts, loaded keys,
checkpoints, decision actor/role/stage/evidence/time/entity, events, one invoice/journal and exact 107.25
synthetic invoice total. Repository reload is actual disk-backed SQLite, not a dictionary or SDK mock.

Browser: cloud-mode local preview with no Firebase configuration. Keyboard activation yields an
explicit unavailable/no-demo-fallback alert, focused with a solid outline. Desktop and 390×844 mobile
inspected; mobile document width equals viewport width. Light/dark states inspected. Native button,
alert and labelled runtime aside retained. No live sign-in occurred. Existing governed dialogs and
reduced-motion behavior are regression-tested, not re-certified with assistive-technology users.
Temporary preview/tab closed after testing; no user browser tabs changed.

## Criterion-level rubric review

All canonical criteria retain their seven fields/0–4 scales; wiring remains Product Reviewer → Product
Management, Agentic AI Reviewer → Agentic AI, Migration Reviewer → Migration & Onboarding. Below scores
use those scales, link their definitions and state both product/end-user impact. No aggregate score.
A 3 means bounded repository evidence, not independent production validation. Severity describes the
remaining gap, not the score. Platform/security/product/AI/UX below are accountable roles, not claimed
external approvals.

### Product Management

[Canonical rubric](../rubrics/PRODUCT_MANAGEMENT_RUBRIC.md).

| Criterion | Score | Evidence | Gap | Why MoveBooks AI | Why end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Problem significance and target user | 3 | Restart-safe owner journey toward verified FPU | No representative cloud user study | Investment addresses reliable migration, not cloud branding | Work can be recovered without recreating approvals | P2 | Product: representative evaluation before customer claims. |
| Canonical journey and outcome alignment | 3 | Fourteen durable golden journeys; unchanged stages | Real provider workload absent | One product/lifecycle | Completion still requires verified productive work | P2 | Migration: expand representative adapters later. |
| Scope, non-goals, and beta boundary | 3 | Cloud banner, config guards, local-only intake, no live model | Cloud SDKs not live-validated | Avoids accidental production promise | Distinguishes synthetic persistence from safe customer ingestion | P2 | Platform: complete controlled cloud verification gates. |
| User value and actionability | 3 | Explicit sign-in unavailable alert, focus recovery, preserved dialogs | No representative usability research | Errors remain actionable | No hidden demo fallback or lost keyboard position | P3 | UX: broader devices/assistive technology study. |
| Progressive trust and decision ownership | 3 | Verified owner namespacing, attributed decisions, cross-owner denial | No delegated/organization roles | Preserves consequential human authority | Another account cannot approve a workspace | P2 | Security: scoped role model before multi-party use. |
| Metrics and evidence discipline | 2 | Typed analytics schema, real request logs, monitoring contracts | No collectors/cohorts/thresholds/baselines | No fabricated operational claims | Clicks/autonomy do not become FPU success | P3 | Metrics: reviewed taxonomy and measured baseline before activation. |
| Product coherence, business fit, and truthful demo | 3 | One primary DB; existing UI/journey; explicit local parity | Cloud cost and load unmeasured | Limits infrastructure sprawl | Same controls locally and through runtime seam | P2 | Platform: cost/abuse/load gates before hosting. |

### Agentic AI

[Canonical rubric](../rubrics/AGENTIC_AI_RUBRIC.md).

| Criterion | Score | Evidence | Gap | Why MoveBooks AI | Why end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agent necessity and ownership | 3 | Registry/parent ownership unchanged; no infrastructure agent | Managed session bridge not implemented | Avoids duplicated policy owners | Predictable decision ownership | P3 | AI: explicit authorized session bridge during activation. |
| Orchestration and workflow state | 3 | SQL CAS/reload, no-stage-bypass/replay golden tests | PostgreSQL/multi-instance gate pending | State remains authoritative | Restart cannot silently rewind approvals | P2 | Platform: run PostgreSQL CI and cloud restart/race checks. |
| Tool authority and least privilege | 3 | Deterministic tools, no model write grants, scoped IAM plan | IAM not provisioned/tested | Finance rules stay outside models | Persuasive text cannot authorize writes | P2 | Security: real workload least-privilege denial tests. |
| Evidence, provenance, confidence, and explanations | 3 | Full snapshot preserves checksums/versioned evidence, minimized Trust | No live model calibration | Inspectable recommendations | Can distinguish evidence from prose | P3 | AI: groundedness/calibration evals in next slice. |
| Human governance and escalation | 3 | Server-derived actor/role and preserved approval/rejection tests | Delegation/staffed escalation absent | Accountable consequence ownership | No agent self-approval | P2 | Product/security: delegated roles and operator process before customer use. |
| Failure handling, idempotency, and safe stopping | 3 | Durable retry/checkpoint/duplicate cases; no outage memory fallback | Production crash/provider uncertainty untested | Avoids duplicate/conflicting actions | Resume preserves completed batches and invoice keys | P2 | Platform: PostgreSQL and real cloud failure injection. |
| Security, privacy, and auditability | 3 | Owner predicates, upload rejection, safe logs, secret and private-object tests | Immutable audit/retention/abuse controls and inherited advisory | Defensible bounded cloud foundation | No accidental raw retention/model/log egress | P2 | Security: production data/hosting review before exposure. |
| Evaluation, fallback, and runtime portability | 3 | 14 extra durable golden runs, ADK SDK-double contracts, deterministic fallback | No live Gemini/managed ADK proof | Provider outage does not remove product controls | Safe operation without a model | P3 | AI: next-slice live activation and measured evals. |

### Migration & Onboarding

[Canonical rubric](../rubrics/MIGRATION_ONBOARDING_RUBRIC.md).

| Criterion | Score | Evidence | Gap | Why MoveBooks AI | Why end user | Severity | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source, target, and canonical boundaries | 3 | Provider-neutral fixtures, original source checksums, cloud upload denial | No live accounting adapters | Runtime does not leak vendor policy into core | No real books silently connected | P2 | Migration: adapter conformance before provider integration. |
| Readiness, planning, and dependencies | 3 | Persisted blocker/plan/mapping chain, no-bypass cases | Complex real workloads untested | Executable governed handoff survives reload | Blockers cannot vanish on restart | P2 | Migration: representative larger fixtures and dependency tests. |
| Mapping and accounting compatibility | 3 | Existing manifests/compatibility and exact checks retained | No new transformation capability | Prevents infrastructure work changing financial truth | Approved meanings remain bound to execution | P3 | Preserve regressions when later adding transformations. |
| Human approval and migration handoff | 3 | Verified actor/role, persisted approvals, owner-scoped CAS | No delegated production authorization | Separates proposal, consent and execution | Knows which owner approved which manifest | P2 | Security: real identity multi-party policy later. |
| Blockers, unsupported items, and exception ownership | 3 | Controlled failure and governed repair; cloud unavailable not auto-fallback | Staffed support unimplemented | No silent repair/data loss | Can stop and inspect evidence | P3 | Operations: owned escalation process before customers. |
| Lineage, evidence, and audit integrity | 3 | Complete snapshot/digest, all normalized decisions survive reload | Not immutable production archive | Reconstructable decisions/outcomes | Trace survives process replacement | P2 | Platform: backup/restore, retention and append-only audit design. |
| Execution, validation, and recovery boundary | 3 | Full persisted journey, exact reconciliation, retries, no duplicate invoice | PostgreSQL/live cloud/provider operations unverified | No false production recovery claim | Failed checks never become success due to retry | P2 | Platform: pass pending gates and production recovery review. |
| Onboarding and verified First Productive Use continuity | 3 | Configuration, owner decisions, FPU checkpoints and verification persist | No representative customer outcome data | Completion remains productive use | Data transfer is not labelled business readiness | P2 | Product: representative task/outcome validation. |

## Reviewer lenses

| Lens | Outcome |
| --- | --- |
| Product | Same canonical journey; cloud storage does not expand upload maturity; GR-01/03 resolved. |
| Customer Outcome | Exact verified FPU survives durable reload; no customer-success measurement claimed. |
| Agentic AI | Parent/tool authority and capability routing preserved; no live runtime activation. |
| FinTech Trust | Exact financial checks/HITL remain authoritative; identity attribution improved; no immutable-audit claim. |
| Architecture | One cloud DB, optional SDK imports, no distributed services added; GR-02/04 resolved in code. |
| Security | Boundaries tested offline; IAM/live token/storage tests and inherited advisory remain hosting gates. |
| Accessibility | GR-05 fixed; native controls, focused error and responsive/light/dark checks; broad AT testing deferred. |
| Metrics | Allowlisted actual logs plus explicit unimplemented collectors; no rates/baselines fabricated. |
| Release Readiness | AMBER: Docker/PostgreSQL execution unavailable locally; no automatic publication/deployment. |
| Demo | Local workflow remains credential-free; cloud demo-auth cannot silently activate; unavailable sign-in truthful. |

## Remaining P2/P3 and next gates

| ID | Severity | Owner / remaining work |
| --- | --- | --- |
| R-01 | P2 release gate | Platform: execute Docker builds/smokes and PostgreSQL CI. Cannot certify container/SQL dialect readiness without them. |
| R-02 | P2 cloud gate | Security/platform: live Firebase revocation, Cloud SQL connector/IAM, GCS policies, Secret Manager permissions/rotation, multi-instance crash/recovery and load/abuse/cost validation. |
| R-03 | P2 hosting gate | Engineering/security: inherited Next.js/PostCSS advisory; npm audit reports moderate Next and high transitive PostCSS. Separate reviewed remediation before public hosting. |
| R-04 | P2 future customer-data gate | Platform/privacy: cloud intake consent, durable ticket/metadata design, raw retention/deletion, append-only audit, backup/restore and organization/delegated roles. Uploads remain explicitly local-only. |
| R-05 | P3 | Metrics/operations: dashboards, thresholds, instrumentation, BigQuery collectors/cohorts and actual baselines. |
| R-06 | P3 | AI: live Gemini/managed ADK session bridge, callback telemetry and representative quality/groundedness evals. |
| R-07 | P3 | UX/engineering: broader assistive-technology/user study, existing trace filtering and Starlette deprecation maintenance. |

Human next step: review/publish this branch and run the pending container/PostgreSQL jobs; close runtime
gates before LIVE GEMINI / ADK ACTIVATION → live-model evaluation → final UX/demo/release polish.
Do not deploy based on this review. Rollback is a normal reviewed revert; no data/history reset.
