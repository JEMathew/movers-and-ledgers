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
| Mandatory deck template/video/portal limits unresolved | MB-08, MB-09 / submission not ready | Official template, verified portal constraints and authentic 3–4 minute final video |

The Product Quality Judge must compare actual product evidence with this register and the PR/FAQ. It must not score hypothetical wording as implemented behavior. Customer outcome measurement remains proposed until instrumented and observed under the metric contract.
