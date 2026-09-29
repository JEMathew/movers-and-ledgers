# Gemini / ADK advisory activation review

Date: 2026-09-29. Branch: `feature/live-gemini-adk`, based on merged main
`6ddf7db997409721ecbde6185ed851c275aa93dd`. Scope: five optional owner-requested synthetic reasoning
advisors. **Overall AMBER: local implementation gates pass; live activation not verified.**
This record does not inherit live-model evidence from PR #13's deterministic cloud validation.

## Evidence and boundaries

- Backend: **318 passed, 10 skipped**. The skips are the existing real-PostgreSQL tests because no
  test PostgreSQL endpoint was supplied. They are not counted as passes. New focused suite: **28
  passed**, including real ADK orchestration with offline model doubles, bounded tools, endpoint and
  telemetry controls, owner denial, actor rejection, CAS reservation, timeout cancellation, stale
  output suppression, SQLite restart/CAS, and preservation of deterministic FPU with one invoice.
- Frontend: **94 passed**, including five advisory tests for explicit requests, evidence, fallback,
  unavailable/error states and completed-response workspace switching. Existing guide behavior stays
  covered while mode wording is corrected.
- Ruff, frontend lint, TypeScript, production build, Markdown/repository credential-pattern scan and
  whitespace checks passed. The inherited Starlette/httpx test-client deprecation remains a warning.
- Thirteen offline golden contract cases passed across planning sequence/blockers, account/entity/tax
  mapping, uncertainty, duplicate/retry exceptions, accounting/tax/access configuration and grounded/
  unsupported onboarding. They test **host contracts using canned outputs**, not model intelligence.
  Task correctness and semantic grounding are explicitly `not_human_scored`.
- Optional AI environment `pip-audit --skip-editable`: **0 known vulnerabilities** after upgrading
  development tooling pip 24.0 → 26.2.1, pytest 8.4.2 → 9.1.1 and setuptools 79.0.1 → 84.0.0. The initial
  report had 16 matches across these three tooling packages, including duplicate advisory aliases.
  No suppressions were added. Report SHA-256:
  `e3470051c8c0eba36e48776597619749035f0c91d93292dd3f7225ee3e87f796`.
  Installed ADK 1.39.1 / Gen AI SDK 2.25.0. Production npm audit: **0 vulnerabilities**.
- Local production-preview advisory panel inspected in light/dark themes at the available desktop
  viewport. Request without identity fails visibly; no automatic provider request occurred. This is
  not an authenticated live-model browser journey, mobile-device audit or full accessibility audit.
  Named buttons, status/alert semantics, details/evidence disclosure and preserved controls have
  component coverage. Temporary localhost preview was stopped; port 3101 has no listener.
- No new branch remote CI, production image build/Grype scan or deployed optional-ADK image evidence
  exists yet. The existing image gate was not weakened; prior cloud image results do not certify new
  optional AI images. CI now adds a credential-free real-ADK/offline-eval and dependency-audit job.

## Live preflight and exact blocker

User authorized project `movebooks-ai`, region `asia-southeast1`, a **US$1 model-call operating
target**, no Cloud Run or SQL startup. The initial local preflight could not discover ADC or use
browser control. A subsequent read-only preflight on 2026-09-29 at implementation commit `847a5b9`
successfully used authenticated Chrome Cloud Shell and normal Google SDK ADC refresh:

- `adc_valid: true`, project `movebooks-ai`; no credential content printed or extracted.
- Enabled-services query returned no Vertex AI entry. A direct authenticated Service Usage GET
  confirmed HTTP **200**, service `aiplatform.googleapis.com`, state **DISABLED**.
- No service was enabled and no IAM binding was changed. Enabling this API is the next approval
  checkpoint; any required IAM expansion must be separately identified and approved.
- Published Google documentation lists `gemini-2.5-flash` and `asia-southeast1`. This establishes
  documented support, **not** successful access, quota or inference permission in this project.
  Current documented prices and lifecycle notes are recorded in the architecture document.

**Immediate blocker: Vertex AI API disabled; approval to enable it is pending.** Actual Gemini
inference, per-capability live routing, live ADK execution and live failure paths remain unexercised.

**Live agents activated: none. Paid model calls: zero. Model-call spend from this work: US$0.**
No live latency, token usage, quality or cost estimate is fabricated from offline timings. Cloud Run,
SQL, Firebase, IAM, GCS, Secret Manager, production images and the preserved completed FPU workspace
were not changed or started. No approvals repeated and no invoice posted. This is an unchanged-cloud
statement, not a fresh independent shutdown verification. No temporary cloud access was granted.

Next prerequisite: obtain approval to enable only `aiplatform.googleapis.com` in `movebooks-ai`,
then verify least-privilege inference access and actual selected-model availability. Do not paste
tokens or export browser credentials. Run the requested six representative cases across five
capabilities and one bounded failure case only after prerequisites pass. The current harness admits
at most five selected cases per invocation; account for the entire session budget across invocations.
Do not resume cloud runtime validation or start Cloud Run/SQL. No fresh live release-review clearance
is claimed; prior local P0/P1 findings remain scoped to the inspected local implementation.

## Review findings and remediation

Reviewers are advisory. Independent read-only passes covered Security / FinTech Trust / Architecture
and Product / Agentic AI / GenAI Quality / Metrics / Release Readiness. The builder implemented fixes
and consolidates the decision here. No reviewer merged or changed production resources.

Initial P0: **0**. Initial P1: **0**. Final unresolved P0: **0**, P1: **0** for the **inspected local
synthetic no-write scope only**. Missing live evidence still prevents an overall GREEN declaration.

| Finding | Severity | Evidence and why it matters | Remediation / re-review |
| --- | --- | --- | --- |
| Ambient SDK endpoint override | P2 | ADC requests could select an unexpected destination despite an explicit project | Pin regional endpoint, reject ambient overrides; offline client regression; Security closed |
| SDK raw-content telemetry | P2 | Default SDK debug/tracing can disclose prompts despite safe application logs | Disable SDK content capture and debug payload logging; capture-predicate/log-canary tests; Security closed |
| Interrupted usage represented as zero | P2 | Unknown billable consumption could appear free | Nullable actual usage plus two reserved calls; Security closed |
| Prompt version/cache provenance divergence | P3 | Future prompt changes could reuse/mislabel old advice | One version constant in both cache comparisons and records; Security closed |
| False financial/approval prose with valid references | P2 | A cited draft-plan answer could falsely claim reconciled balances, verified FPU and permission to post | Exact adversarial repro now rejected; authority literals, no write tools, inspectable evidence and unverified-prose UI retained. General semantic quality remains open below |
| Cross-workspace displayed advice | P2 | Same-route navigation could show another workspace's completed explanation | Reactive query-key remount plus regression; Product closed |
| Unconditional no-live public wording | P2 | Trust/Guide contradicted opt-in mode | Both surfaces now distinguish deterministic default, optional synthetic advice and managed ADK disabled; tests updated |
| Reference check hardcoded as passed | P2 | Failed/unavailable provider results falsely appeared grounded | Null when no accepted provider response; semantic quality remains separately unscored; Product closed |

## Criterion-level review (no aggregate score)

Use the normative criterion definitions, “what good looks like,” product/user importance and 0–4
scales in the [Product rubric](../rubrics/PRODUCT_MANAGEMENT_RUBRIC.md) and
[Agentic AI rubric](../rubrics/AGENTIC_AI_RUBRIC.md). Scores below summarize only available evidence.
They are not an average, activation permission or production-readiness score.

| Product criterion | 0–4 | Evidence | Remaining gap / severity / remediation |
| --- | --- | --- | --- |
| Problem significance and target user | 2 | Five bounded migration-decision explanation objectives | P3: plausible need, no representative comprehension study; Product owner validates benefit |
| Canonical journey and outcome alignment | 3 | Existing stages/prerequisites preserved; no advice consumers in control decisions | P3: downstream decision-quality contribution unmeasured; measure separately from FPU |
| Scope, non-goals and beta boundary | 3 | Synthetic/upload exclusion, production guard, corrected mode wording | P2: live scope evidence absent; release owner retains AMBER |
| User value and actionability | 3 | Inspectable facts, uncertainty, explicit human next step, workspace reset tests | P3: representative usability study, including mobile/assistive technology, remains |
| Progressive trust and decision ownership | 3 | Owner-requested advice, strict authority, no approval tools, preserved approvals | P2: live narrative quality; evaluate claims before activation recommendation |
| Metrics and evidence discipline | 3 | Architecture defines denominator, owner, exclusions, unknown usage/cost and unscored semantics | P3: no baselines/outcome instrumentation; collect without claiming customer success |
| Product coherence, business fit and truthful demo | 2 | Shared workflow help; deterministic default; no new journey | P2: no live benefit/cost demonstration; bounded smoke and human review |

| Agentic AI criterion | 0–4 | Evidence | Remaining gap / severity / remediation |
| --- | --- | --- | --- |
| Agent necessity and ownership | 2 | Five objectives, one shared runner, existing orchestrator remains owner | P3: reasoning advantage over fallback not demonstrated; evaluate by capability |
| Orchestration and workflow state | 3 | Prerequisites, immutable business state, stale-output suppression and CAS tests | P2: new record not exercised in live runtime; keep scope local |
| Tool authority and least privilege | 3 | Only bounded evidence read, no peer transfers/write tools; forbidden-tool test | P2: live orchestration unverified; bounded smoke, no additional tools |
| Evidence, provenance, confidence and explanations | 3 | Actor/time/model/version/hash, cited fact snapshots and explicit uncalibrated confidence | P2: semantic grounding/calibration absent; claim-level human assessment |
| Human governance and escalation | 3 | Low-confidence/blocker escalation; actor spoof rejected; no self-approval | P3: measure escalation precision/recall on live representative cases |
| Failure handling, idempotency and safe stopping | 3 | Reservation/CAS, duplicate reuse, timeout, tool-limit, SQLite restart tests | P2: interrupted reservation recovery needs operator policy before broader use |
| Security, privacy and auditability | 3 | Owner isolation, synthetic projection, endpoint pin, minimized logs; Security re-review clean | P2: optional-image/live operational gate not exercised |
| Evaluation, fallback and runtime portability | 3 | 13 executable contract cases, provider port, real offline ADK, visible safe fallback | P2: contract tests are not live quality; run approved smoke and semantic evaluation |

| Additional reviewer criterion | 0–4 | Evidence | Gap / severity / remediation |
| --- | --- | --- | --- |
| GenAI: task correctness and grounded claims | 2 | Ref validation, known unsafe-claim regressions; unverified UI | P2: valid refs do not prove claims; human score live answers |
| GenAI: uncertainty and unsupported requests | 3 | Forced escalation, confidence warning, unsupported/injection contract cases | P3: conservative keyword filter can reject safe negations; refine only against adversarial corpus |
| FinTech Trust: deterministic truth / HITL / audit | 3 | Full financial workflow regressions and one-invoice preservation; advice has no writes | P2: live advisor influence not tested; no broader trust claim |
| Architecture: isolation and provider portability | 3 | Additive port, lazy optional adapter, no business-service refactor, legacy codec compatibility | P2: ADK dependencies absent from default image; dedicated image gate before deployment |
| Security: identity / egress / payload minimization | 3 | Security reviewer closure plus endpoint/content-capture tests | P2: ADC/API/IAM availability and production retention not assessed |
| Metrics: honest denominators and unknowns | 3 | Reservations distinct from terminal events; null usage/currency; separate semantic score | P3: no operational aggregation/price baseline yet |
| Release Readiness: evidence and rollback | 2 | Local gates, default-off mode, no cloud changes, review record | P2: live activation proof and branch CI/image evidence absent; AMBER |

## Remaining owned gaps

- **P2, release owner:** Cloud Shell ADC now works, but Vertex AI API is confirmed disabled. Obtain
  approval for API enablement, verify inference permissions/model access, then run bounded live
  invocation/orchestration/structured-output and failure-path checks. This is the immediate blocker.
- **P2, GenAI/Product owners:** representative semantic correctness, grounding, usefulness and live
  tool/escalation quality; no quality score exists yet. An offline canned result is not a substitute.
- **P2, engineering/release:** optional ADK image compatibility/security and durable live runtime
  evidence before cloud activation; branch remote CI not run. Production image policy stays intact.
- **P2, operations:** permanent PENDING reservations have no reset/recovery workflow. Safe fallback
  lets the deterministic journey continue; design an audited operator recovery before broader use.
- **P3, GenAI:** conservative narrative false positives and uncalibrated confidence; refine with a
  representative adversarial corpus without weakening deterministic authority.
- **P3, Product/UX/Metrics:** comprehension benefit, assistive/mobile assessment, latency/cost baselines
  and outcome guardrail measurement. No customer value or automation-rate improvement is claimed.
- **P3, engineering:** inherited Starlette test-client deprecation; track separately from this scope.

## Seventeen-area release coverage

| Area | Assessment for this change |
| --- | --- |
| User | Clear optional owner guidance; representative benefit unvalidated |
| Customer outcome | No FPU change; live contribution unmeasured |
| Business | No commercial or production claim; cost target unspent |
| Product | Existing journey, Guide/Learn separation and Beta limits preserved |
| Migration | Execution, reconciliation, retry and lifecycle services unchanged; regression suite passes |
| Agent | Read-only bounded ADK orchestration tested offline |
| GenAI | Strict schema/safety cases pass; live quality NOT ASSESSED |
| Deterministic quality | Existing tools remain authoritative; one-invoice/FPU preservation test |
| Safety/trust | Explicit human governance and no-write/no-self-approval boundary |
| Security/privacy | Owner checks, pinned egress, no uploads, safe SDK/app telemetry; audit clear locally |
| Reliability/operations | Bounded deadlines/calls, reservation/CAS and SQLite restart; live gap |
| Engineering quality | Lint, types, build and backend/frontend gates pass; remote CI pending |
| Evaluation maturity | Contract catalog and real offline runner; no live semantic/calibration evidence |
| UX/accessibility | Named controls/status/errors/evidence tested; bounded desktop light/dark visual check |
| Platform scalability | No production load/global billing-cap proof; default off and workspace limits |
| Feedback/support | Existing surfaces unchanged; pending operations need future support policy |
| Demo readiness | Local advisory/fallback demonstrable; **not ready to claim live Gemini activation** |

Final: **AMBER for the requested live activation objective; no P0/P1 found in the inspected local
synthetic slice.** Nothing merged, deployed or pushed by this slice. See the
[architecture and bounded runbook](../architecture/live-gemini-adk.md).
