# Customer promise to implementation traceability

Baseline source inspected at `8f750d9`. Integration owner must reconcile candidate source/test results and deployment evidence before release. PR links are not invented. `Not evidenced` is an explicit release decision, not an assertion of failure. The press release remains hypothetical even after a bounded synthetic slice passes.

| Customer promise | Persona / JTBD | Requirement / acceptance | Backlog | Code / PR anchor | Automated test anchor | Deployed evidence | User outcome / release decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Learn migration through a playable office | New accountant / understand unfamiliar concepts | Play contract in feature-contracts.md | MB-02 | apps/web/components/public-surfaces/Play.tsx; integration adds mission implementation | Public surface tests plus candidate mission tests | Candidate not evidenced in this baseline | Opening mission completed using supported controls. No delivered-game claim until candidate acceptance. |
| Rehearse the full migration safely | Accountant / understand and control the move | Explore contract | MB-01 | apps/web/components/journey; agents/orchestrator; services/api/src/movebooks_api/discover_assess | tests/test_beta_v1_integration.py; tests/test_journey_evidence.py | Existing public Beta documented in docs/deployment/public-beta.md, candidate acceptance separate | All five phases with no hidden intervention; candidate deployment pending. |
| Validate supported permitted test exports | Finance operator / discover incompatibilities | Intake contract and independent hosted gate | MB-03, MB-10 | apps/web/components/try-your-data; services/api/src/movebooks_api/intake.py and intake_api.py | tests/test_intake_contract.py; test_intake_hardening.py; test_untrusted_upload_content.py | Hosted uploads closed in baseline; candidate browser-local evidence required | Actionable issue correction and honest handoff boundary. Hosted No-Go until all gates. |
| Receive an evidence-backed explanation | Accountant / decide ambiguous account 1200 | Gemini contract | MB-04 | services/api/src/movebooks_api/reasoning.py; agents reasoning providers | tests/test_live_reasoning.py and ReasoningAdvice.test.tsx | Historical dev/test evidence in docs/reviews/live-gemini-adk-2026-09-29-evidence.md; public candidate live mode not evidenced | User understands uncertainty and chooses. Public live activation No-Go until verified controls/permissions. |
| Obtain independent challenge | Accountant / challenge unsupported mapping | Reviewer contract | MB-05 | Candidate: agents/reviewer/agent.py; domain/reasoning/reviewer.py; services/api/src/movebooks_api/reviewer.py; IndependentReview.tsx. Absent at baseline | tests/test_independent_review.py (candidate; execution evidence pending) | Not evidenced | Explicit concerns and next action; do not credit planned implementation as deployed. |
| Verify financial correctness | Approver / prove the move | Financial verification contract | MB-01 | agents/orchestrator/validate_configure.py; deterministic financial tools | tests/test_validate_configure.py; test_validation_failures.py | Public Beta documented, candidate run evidence pending | Mismatch blocks, passing deterministic evidence enables approved configuration. |
| Complete first productive work | Owner / start after handover | FPU contract | MB-01 | agents/orchestrator/onboard_fpu.py; apps/web/components/onboard-fpu | tests/test_onboard_fpu.py; test_onboard_cloud_owner.py | Public Beta documented, candidate receipt/user task evidence pending | Approved synthetic invoice verified once; no real provider outcome claimed. |

## Promise discrepancy register

| Gap | Backlog / decision | Close only with |
| --- | --- | --- |
| Mature future provider-neutral customer migration exceeds synthetic Beta | MB-12 / future only | Supported provider adapters, independent real-data authorization and financial semantics evidence |
| Hosted uploads exceed public activation gates | MB-10 / No-Go hosted activation | All independent controls and security tests plus release authorization |
| Live Gemini and Firestore exceed last-known cloud state | MB-04, MB-11 / activation gated | Effective permission/region, runtime/model_controls.py and tests/test_model_controls.py candidate controls, kill switch and sanitized runtime evidence |
| New Play/Reviewer/intake changes not yet deployed | MB-02, MB-03, MB-05 / candidate pending | Candidate tests and authentic browser/deployment acceptance |
| Mandatory prescribed template/team/public video link unresolved | MB-08, MB-09 / submission not ready | Official template and team input, accepted PDF≤5MB and description≤1024 characters, authorized accessible video URL |

The Product Quality Judge must compare actual product evidence with this register and the PR/FAQ. It must not score hypothetical wording as implemented behavior. Customer outcome measurement remains proposed until instrumented and observed under the metric contract.

## Candidate evidence updates

The integration source now includes the independent Reviewer and `runtime/model_controls.py`. Their presence does not close deployment or live-model evidence. The internal evaluator has 18 contract golden cases in `evals/agent_quality_cases.json`, runner `scripts/agent_quality_judge.py` and a report in `docs/submission/agent-quality-evidence.json`. The reported 100% expected accept/reject detection score uses zero live calls and supplies regression evidence only. It cannot be substituted for user acceptance or model quality. The integration owner confirmed public prototype HTTP 200 and GitHub public visibility on 17 October; the candidate remains undeployed.

## Integration checkpoint — 17 October 2026

Implementation reference: `fffd14c` on `delivery/submission-integration` (local, unpublished).
The [acceptance report](../submission/acceptance-report.md) and machine-readable
[evidence manifest](../submission/evidence-manifest.json) supersede the baseline's unknown local
implementation cells; deployed evidence remains separate. This is a tested candidate, not an
approved or deployed release.

| Promise / backlog | Concrete implementation and test execution | Current customer outcome / release decision |
| --- | --- | --- |
| Play / MB-02 | `components/play/OfficeMission.tsx`, `engine.ts`; gameplay/state tests; [14 browser checks](../submission/browser-play/browser-evidence.json) | Opening mission, failure/correction and demo unlock locally verified; no financial session changes. Candidate deployment pending. |
| Explore / MB-01 | `GuidedDemo.tsx` now has a prominent real-journey link; core lifecycle and checksum-pinned v2/v3 fixtures; golden/compatibility tests passed | Preview completion is never migration completion. Executing the separate linked synthetic workspace is required; [complete real-UI dry-run evidence](../submission/browser-journey/dryrun/browser-evidence.json) passed 17/17 combined checks. |
| Try Your Data / MB-03, MB-10 | `BrowserLocalValidation.tsx`, `browser-parser.ts`, `browser-archive.ts`, `browser-validation.ts`; [actual local review and negative tests](../security/try-data-delivery.md) | Template→select→validate→repair/revalidate→review works locally. Hosted workspace creation remains explicitly unavailable; full local server journey retained. |
| Gemini / MB-04 | `reasoning.py`, `agents/reasoning`, async `runtime/model_controls.py`; synthetic/owner/forgery/stale/timeout/cost/kill-switch tests passed | User receives a visibly labeled deterministic fallback by default. No live-model or cloud-control delivery credit without authorized current evidence. |
| Reviewer / MB-05 | `agents/reviewer/agent.py`, `reviewer.py`, `IndependentReview.tsx`; separate contract, read-only challenge, offline ADK, stale/owner/authority/replay tests passed | Account 1200 locally produces a meaningful missing-purpose challenge; no correct classification or approval is inferred. Live Reviewer gated. |
| Financial verification | `tools/validation/checks.py`, `validate_configure.py`; exact counts/relationships/balances/checksums, repair and revalidation tests passed | Failed checks remain blocking. No real provider or production-customer correctness claim. Exact checks passed in the complete UI dry run; deployment remains pending. |
| Verified first use | `onboard_fpu.py`, `tools/activation/invoice.py`; owner/approval/idempotency/invoice/receipt tests passed | Only an approved synthetic invoice plus deterministic verification can establish the outcome. The complete UI dry run passed through an approved USD 107.25 invoice and deterministic receipt; current deployed evidence remains pending. |

All 559 backend and 658 frontend tests passed in the combined local run; 58 backend checks were
skipped and are **not** passed gates. The Agent Judge's 18/18 result measures expected contract
accept/reject detection with zero live model calls. See its report for the separate evaluation
contract. Each remaining promise gap retains its original backlog ID; none is silently removed.

Additional source checkpoint `1a24a2c` completes gated advisory operational activity readback: owner
filter plus per-record owner validation, controlled event projection, explicit refresh, client-write
denial sources and bounded outage handling. Full combined local regression is 584 backend passed /
58 skipped and 674 frontend passed / 51 files; source rules/indexes remain unprovisioned, and live
cloud validation is not credited. Recorded full financial UI evidence retains its exact runtime
commit in the footage manifest rather than being relabeled as an unperformed cloud operation.

Final local video acceptance: [231.88-second authentic captioned footage](../submission/assets/working-product-demo.webm) meets the 3–4 minute duration requirement. Its [manifest](../submission/browser-journey/recording/video-manifest.json) identifies API `fffd14c`; the separate latest-source `1a24a2c` browser run passed 17/17 checks. A public video URL remains release-gated. The final regression totals above supersede the earlier 559/658 checkpoint.

Control-only source `0c189f2`:594backend passed/58skipped; explicit named-database selection/cache separation and terminal-write preconditions now tested. [Firestore proposal](../security/firestore-provisioning-proposal.md) records retained API drift and dormant setup pending approval. General migration-phase Firestore event replication remains a required gap under MB-11; current Firestore source covers advisory reservation/outcome activity, and SQL retains authoritative workflow activity.

Current follow-up `6575004`: [Dormant Phase A closed](../submission/firestore-phase-a-evidence.md); [local Phase B](../submission/firestore-phase-b-local.md) passes13real SDK/emulator cases,8client-denial checks and34offline phase-outbox cases. Full backend628passed/71skipped, with13emulator skips passed separately and58original optional gates still unverified. The phase mirror is a default-disabled local SQLite/emulator slice only; cloud/PostgreSQL/schema/new-index/API/UI/worker delivery and cloud IAM remain separate gaps. Earlier checkpoints above are historical, not current provisioning status.
