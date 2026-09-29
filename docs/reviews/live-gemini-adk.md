# Gemini / ADK advisory activation review

Date: 2026-09-29. Branch: `feature/live-gemini-adk`, based on merged main
`6ddf7db997409721ecbde6185ed851c275aa93dd`. Scope: five optional owner-requested synthetic reasoning
advisors. **Overall AMBER: authenticated live generation works, but two capabilities fail structured
output and accepted answers have semantic gaps.** See the complete
[2026-09-29 live attempt ledger](live-gemini-adk-2026-09-29-evidence.md).
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

## Historical preflight and current live outcome

User authorized project `movebooks-ai`, region `asia-southeast1`, a **US$1 model-call operating
target**, no Cloud Run or SQL startup. The initial local preflight could not discover ADC or use
browser control. A subsequent read-only preflight on 2026-09-29 at implementation commit `847a5b9`
successfully used authenticated Chrome Cloud Shell and normal Google SDK ADC refresh:

- `adc_valid: true`, project `movebooks-ai`; no credential content printed or extracted.
- Enabled-services query returned no Vertex AI entry. A direct authenticated Service Usage GET
  confirmed HTTP **200**, service `aiplatform.googleapis.com`, state **DISABLED**.
- After explicit user approval, `gcloud services enable aiplatform.googleapis.com` succeeded
  (exit 0); enabled-services read-back includes that API. Project IAM bindings compared equal before
  and after enablement. No IAM-change command was issued; further IAM changes still require approval.
- Published Google documentation lists `gemini-2.5-flash` and `asia-southeast1`. This establishes
  documented support, **not** successful access, quota or inference permission in this project.
  Current documented prices and lifecycle notes are recorded in the architecture document.

An authenticated regional `gemini-2.5-flash:countTokens` request with a seven-token synthetic planning
sentence returned **HTTP 200 / totalTokens 7**. This verifies authenticated token-count endpoint
access, not generation permission, ADK execution or model response quality. No generation call had
run at that preflight checkpoint.

The initial upload was blocked by browser file access. The user subsequently enabled upload access
and uploaded the reviewed archive; its hash was verified in Cloud Shell. The archive contains tracked
advisory source, settings and synthetic cases from `937a278`, not credentials or workspace data:
SHA-256 `c1df71aadee2accbe99a99b711dd28fff0de6a7cd283b34f75b564915849df1c`.

Actual bounded live execution used normal ADC and explicit `gemini-2.5-flash` routes for all five
capabilities. Six cases plus one diagnostic retry yielded **four accepted outputs / seven requests**:
planning, both mapping cases and configuration passed host schema/reference gates; resolution twice
and onboarding fell back. Diagnostic resolution and onboarding raised `ValidationError` after
generation. Exact rejected fields remain unknown. No schema/authority constraints were weakened.
These real failures exercised fallback; no extra invalid-model call was needed. All calls stopped.

Known usage including partial diagnostic counts: **3,727 input / 1,864 output tokens**;
**US$0.0057781 estimated known cost**, plus unknown first-resolution consumption. Latency across
all requests: **1.545–5.110 seconds**. This is not billed spend or a production baseline. Fourteen
reserved calls are a maximum exposure, not measured consumption. The ledger preserves every attempt.

Accepted configuration prose confused advisor limitations with product functionality; mapping
low-confidence prose asserted an unsupported automated-processing policy. Both are **P2** semantic
gaps despite safe host authority flags. Self-reported 0.9 confidence is not calibrated quality.
No business repository/API was invoked; synthetic input equality is not a cloud FPU persistence test.
Cloud Run, SQL, Firebase, IAM, GCS, Secret Manager, production images and the preserved workspace
were not changed or started by the live evaluation. No approvals repeated or invoice posted.

Next: diagnose structured-output errors with sanitized metadata/offline regressions, correct the two
semantic gaps, then run only a separately bounded targeted follow-up. No deployment/merge or complete
five-capability GREEN is justified. Remote CI and optional ADK image gates remain separate gaps.

## Review findings and remediation

Reviewers are advisory. Independent read-only passes covered Security / FinTech Trust / Architecture
and Product / Agentic AI / GenAI Quality / Metrics / Release Readiness. The builder implemented fixes
and consolidates the decision here. No reviewer merged or changed production resources.

Initial P0: **0**. Initial P1: **0**. Final unresolved P0: **0**, P1: **0** for the **inspected local
and bounded live synthetic no-write scope only**. The live P2 failures prevent an overall GREEN
declaration. Independent reviewers inspected source and supplied live summaries, not independently
replayed cloud calls. Their final findings and qualifications are in the live ledger.

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

The tables below preserve the initial local-only review baseline. Current live evidence supersedes
their former “no live evidence” gaps as specified in the ledger, not by treating accepted schema as
quality. Final Agentic AI evidence/provenance and evaluation criteria are **2/4**, tool authority and
human governance **3/4**; GenAI quality **2/4**, Release Readiness **2/4 / AMBER**. No aggregate score.

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

- **P2, engineering/release:** authenticated generation works, but resolution/onboarding failed
  structured output. Diagnose safe schema metadata and preserve partial usage/failure categories;
  first-resolution usage remains unknown. Full capability acceptance stays blocked.
- **P2, GenAI/Product owners:** representative semantic correctness, grounding, usefulness and live
  tool/escalation quality; live mapping-policy and configuration-scope defects require correction.
  No representative human quality study exists. Canned results or valid refs are not substitutes.
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

Current status below combines the original local gates with this bounded live experiment.

| Area | Assessment for this change |
| --- | --- |
| User | Clear optional owner guidance; representative benefit unvalidated |
| Customer outcome | No FPU change; live contribution unmeasured |
| Business | No commercial or production claim; known estimate US$0.0057781 plus unknown failed-call usage |
| Product | Existing journey, Guide/Learn separation and Beta limits preserved |
| Migration | Execution, reconciliation, retry and lifecycle services unchanged; regression suite passes |
| Agent | Read-only ADK exercised live; two capabilities failed structured output |
| GenAI | Four accepted outputs, semantic defects found; no representative human quality study |
| Deterministic quality | Existing tools remain authoritative; one-invoice/FPU preservation test |
| Safety/trust | Explicit human governance and no-write/no-self-approval boundary |
| Security/privacy | Owner checks, pinned egress, no uploads, safe SDK/app telemetry; audit clear locally |
| Reliability/operations | Bounded deadlines/calls, reservation/CAS and SQLite restart; live gap |
| Engineering quality | Lint, types, build and backend/frontend gates pass; remote CI pending |
| Evaluation maturity | Offline contracts plus seven live attempts; semantic gaps documented, calibration unproven |
| UX/accessibility | Named controls/status/errors/evidence tested; bounded desktop light/dark visual check |
| Platform scalability | No production load/global billing-cap proof; default off and workspace limits |
| Feedback/support | Existing surfaces unchanged; pending operations need future support policy |
| Demo readiness | Live generation/fallback demonstrable; **not ready to claim complete five-capability readiness** |

Final: **AMBER for the requested live activation objective; no P0/P1 found in the inspected local
and bounded live synthetic slice.** Nothing merged, deployed or pushed by this slice. See the
[architecture and bounded runbook](../architecture/live-gemini-adk.md).
