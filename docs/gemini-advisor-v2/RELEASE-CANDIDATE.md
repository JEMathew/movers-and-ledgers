# Track B release candidate — October 20, 2026

**Local deterministic evaluation: GO. Combined integration: WAITING FOR TRACK A ACCEPTANCE. Hosted deployment and live activation: NO-GO.**

This execution closes a verified model-control integrity defect, builds and scans its API candidate, verifies current cloud metadata without writes, and supplies a tested command generator plus a concrete gated hosted runbook. No new inference or countTokens call, real-ledger operation, Track A edit, push, merge, publication, deployment or financial action occurred. The original judge package is unchanged; no duplicate judge bundle was created.

## Source and completed implementation

Branch `feature/gemini-advisor-v2`; starting HEAD `6c769c2b9be2409a63ddc747a6bb507852a39065`. **Runtime candidate `9ce33e52ff99f8d666062e916bdc595e759d87b0`**, commit `fix(gemini): reject damaged persistent model reservations`. The final receipt binds the later documentation/tooling HEAD and exact changed files; no newer implementation was reset.

The Firestore adapter formerly converted both absent and empty documents to `{}`. An existing empty reservation could appear unused, and an existing counter missing required fields could start at zero. The fix checks authoritative snapshot existence, rejects every existing reservation regardless of contents, and rejects inconsistent or incomplete counter documents **before every write**. Truly absent daily counters still start normally. No counter migration, policy write, new database, scope change or financial authority was added. A deliberate administrative deletion remains outside this integrity guarantee; workload access and operational retention still matter.

| Capability | Current completion and user-visible behavior |
| --- | --- |
| Explicit Advisor/Reviewer interaction | Existing synthetic clearing-account selection, opt-in invocation, separate evidence-linked outputs, uncertainty and appropriate escalation |
| Role independence | Fresh sessions and independent source projection; Reviewer assesses the untrusted recommendation; same-model error correlation remains unknown |
| Identity/workspace/mapping isolation | Existing authenticated owner boundary, strict requests, CAS, stale-response discard, retry identity and sign-out cleanup preserved |
| Human decisions | Separate approve/reject; deterministic gates, replay rejection and audit; analysis never applies a target or executes migration |
| Five-phase guidance | Existing Discover/Assess → Prepare → Move → Configure → First Product Use synthetic workflow, deterministic validation, recovery/configuration/onboarding guidance |
| Offline Judge | Stable malformed-response handling and known contract checks; deterministic, not an additional agent or financial-accuracy judge |
| Failure behavior | Timeouts, malformed/empty evidence, unavailable provider and disabled mode retain safe fallback; no fabricated successful Gemini result |
| Operational controls | Corrupt persisted model documents now fail closed; current cloud model flags are off; token/cost completeness and hosted acceptance remain separate gates |
| Source evidence workflow | Proposal only. Lifecycle clarified to allow additional requests to reopen SATISFIED → OPEN while unresolved/current/pre-execution. No persistence or button implemented |

**Before → after for an accountant:** the five-phase demonstration and human decisions are unchanged. The operational change prevents damaged model-control storage from silently authorizing another attempt or resetting usage. A control failure produces safe fallback rather than bypassing the allowance. Missing source-purpose evidence remains visible; nothing claims that an evidence request was sent.

Preview remains `http://localhost:3321/workspace`, deterministic demo identity/synthetic data only. Its existing browser evidence applies to unchanged UI. It is not a hosted or refreshed combined-UX acceptance claim.

## Targeted acceptance and financial-quality metrics

- **82 focused backend tests passed**, including **13 new** persistent-document corruption cases, configuration, assisted analysis and independent human-decision safeguards. Socket connection/DNS denied. One existing Starlette/httpx deprecation warning retained.
- **21 release-command tests passed**: rejected incomplete approval, wrong project/region, mutable images, malformed/injected source/tag/rollback fields and non-object manifests; generated candidates remain no-traffic and inference-disabled.
- Affected Ruff and whitespace checks passed. Frontend/TypeScript/ESLint and the unrelated backend suites were not repeated: no frontend or API-schema changes. Prior 129 frontend results remain dated applicable evidence.
- Fresh API image smoke passed with networking disabled, UID 65532, read-only root, capabilities dropped, validated SDKs, unchanged API contracts, synthetic HTTP fallback, zero model calls and the patched-module source hash.
- Actual pending release manifest exits **2**, emits no command output, and names its blocking gates. The command generator itself never executes gcloud or reads credentials.

From preserved reports, not new inference: **18/18 expected contract decisions (100%)**, including **15/15 expected rejections**; **23/23 scripted scenarios (100%)**. Eight explicitly enumerated unsupported/forged evidence, authority and completion fixtures are rejected **8/8**. Three scripted cases record ESCALATED outcomes. These are denominators in a fixed synthetic corpus, not financial accuracy or a live unsupported-answer rate. The retained semantic counterexample still accepts an unsupported payroll-liability narrative accompanied by a valid citation; schema/reference validation is not semantic truth checking. Broader accountant-adjudicated quality remains OPEN.

Coverage includes ambiguous purpose, unsupported target classes, conflicting classification, missing business purpose, Reviewer REJECT/challenge, independent human authority, owner denial and no business-state changes. Evidence: `evidence/release-candidate/financial-quality-metrics.json`, the unchanged exception-matrix tests and prior reports.

## Candidate artifact and security

Only the changed API image was rebuilt. It inherits the verified prior runtime layers and replaces one reviewed module; **no dependency installation or version change**. Layer-prefix and patched-file SHA verification passed. The unchanged web image and judge archive were not rebuilt or duplicated.

| Artifact | Identity / result |
| --- | --- |
| API local tag | `movebooks-trackb-api:9ce33e5-local` |
| Image/index identity | `sha256:f64165fe6f106eeb01b303eaf7c767b7fbfe362d64ed75f2e57ca67e3e662a1d` |
| Scan-bound configuration digest | `sha256:b3d8d4a745e0472acadcb52ff416877812165aedcbaa36bbe0f91dd56e47f307` |
| Archive SHA-256 | `107ebcd03409f2cbe44fcd4ebd24586de8ada8b73ce13045b76a013323de0c44` |
| Archive size | 203,977,728 bytes; new archive justified by changed-runtime release gate |
| Fresh CycloneDX / scan | 2,258 components; zero Critical/High, 14 Medium, 3 Low, 14 Unknown rows; **REVIEW REQUIRED** |
| Preserved artifact directory | `/Users/jincenmathew/Downloads/Intuit/movebooks-track-b-release/9ce33e5-20261020` |
| Artifact manifest SHA-256 | `fef242644780a0ed2d5386cfe8c322df2ddbf4556ee3d27d861b886538fb5c48` |

Scanners ran pinned and network-disabled against a valid cached database about 11.46 hours old. Thirty-one rows remain seven CVE families; no severity downgrade or suppression. Prior runtime applicability analysis remains valid because dependencies and all other filesystem layers are unchanged. Resolver configuration and transitive library exposure still require disposition; absence of nscd/privileged binaries narrows particular attack paths, not every vulnerability.

The frontend High `braces` development-chain advisory still has no listed patched version. It is absent from the runtime SBOM but matters to untrusted build inputs. No risk acceptance has been granted. Security/release owners must approve supported remediation or a bounded documented disposition; current images are not production-certified.

## Current cloud state and operational limits

Fresh read-only evidence at approximately **23:23–23:25 IST October 20** confirms both services still serve `r16e31e9-1041` at 100%, with generations 48/60, unchanged identities, traffic and IAM etags. API is IAM-restricted to the web service account; web is public. API configuration is `deterministic-only`. Cloud SQL `movebooks-beta-pg` is RUNNABLE; Firestore `movebooks-operations` exists with deletion protection. Its operational policy explicitly has **`enabled=false` and `synthetic_beta_authorized=false`**. No secret values were retained.

Direct workload role bindings were read, not changed; they do not prove every conditional/effective Vertex or database permission. No customer workspace/database content, production API request or model endpoint was accessed. CLI identity is not asserted as independent ADC identity proof. The current local image is **not serving production**.

Existing bounds are two generation turns/tool reads per role, SDK retries disabled, provider timeout, request/context dedupe and session CAS; at most ten advice records and three review records per workspace; optional owner/global daily Firestore call/cost reservations; policy kill switch and two in-process reservation tasks. The process semaphore is not a distributed rate limiter, and there is no automatic distributed error-rate circuit breaker.

The application's 65,536-byte assembled-request cap is **not** the harness's 50,000 counted-token guard. Operator monetary reservations are not verified per-request worst-case billing. Thinking usage may be missing. Counted-input admission, pricing/reservation policy, deployed concurrency/restart/cost telemetry and any additional burst/circuit-breaker policy remain live gates. Their exact implementation/verification sequence is in the runbook; no database or IAM provisioning is silently required or performed.

## Genuine inference, judging and interview relevance

Original October 20 evaluation: four attempts consumed, zero remain; real global Vertex `gemini-3.5-flash-lite`, LOW. Advisor escalated the missing clearing-account purpose; Reviewer accepted investigation while challenging mapping sufficiency. Reported **5,207 input / 557 candidate-output tokens**, **$0.0029546** component estimate. Thinking usage missing, countTokens differed by 825; complete billable cost UNVERIFIED. Transport latency sum 4,580 ms; Advisor application latency 6,303 ms; no retained Reviewer application latency. No metric is invented or extrapolated.

Keep four boundaries explicit: October 18 submission materials; October 20 real inference; current deterministic demonstration; unimplemented future evidence workflow. Original judge package `/Users/jincenmathew/Downloads/Intuit/movebooks-track-b-evaluation/20261020-final.zip` retains SHA-256 `c5084a523810c1d0098be317e6923ca9859bff704949701fe5d893cfab8fe335`. This report is a small later addendum, not a rewritten submission or changed archive.

| Rubric | Defensible contribution / interview decision |
| --- | --- |
| Technical / GenAI 40% | Real tool-grounded Gemini, independent role/context boundaries, fail-closed operational controls and reproducible negative tests; distinguish implementation from actual deployment |
| Problem / impact 25% | Accountants need business purpose, not just compatible types; escalate rather than manufacture certainty. No invented savings or general accuracy |
| Innovation 25% | Reviewer can accept investigation while rejecting mapping sufficiency; model agreement never becomes financial authorization |
| UX / solution design 10% | Explicit five-phase guidance, uncertainty and separate human decisions; refreshed combined and hosted acceptance remain open |

Judge narrative: deterministic rules establish allowed classes and workflow gates; Gemini adds a natural-language account of missing business purpose, hypotheses/alternatives and a qualified next action grounded in selected facts. In the recorded case it explains why a mechanically compatible mapping is still unresolved. One case does not prove it outperforms rules. For Intuit migration/onboarding leadership, demonstrate the separation of migration success, explanation quality, tenant trust, activation prerequisites and bounded operational cost—not agent count or unsupported ROI.

## Remaining gates, owners and shortest safe path

| Gate | Owner / consequence | Next measurable acceptance |
| --- | --- | --- |
| Track A acceptance | Track A/release; stable experience for accountants, source-bound demo for judges, accountable cross-team launch | `4178e9784cef827af9d87021401971c109b72f86` exists; final acceptance still blocked. Obtain explicit accepted immutable integration baseline/source-artifact receipt. No branch combination now |
| Security disposition | Security/release, P1 release gate; availability and supply-chain trust | Resolve/disposition development High and API families on exact accepted artifacts; no waiver inferred |
| Hosted data/auth/native runtime | Data, identity, release owners, P1 live gate; tenant confidentiality and reliable onboarding | Approve synthetic A/B scope, isolated data resources, hosted account/negative checks and memory/runtime acceptance |
| Model cost/usage controls | Track B/operator, P1 live gate; predictable spend and credible model accounting | Approve policy; implement/count/test before every turn, validate durable reservations and kill switch; fresh inference authorization separate |
| Evidence workflow | Product/accounting/security; durable handling of unanswered source-purpose questions | Review compact defaults after combined validation; then implement and test OPEN → SUBMITTED → SATISFIED/reopen. Does not block the existing local demonstration |
| Financial quality/accessibility | Accounting/accessibility/release; correct and usable outcomes, honest judging claims | Broader independently labeled cases and combined device/keyboard/identity acceptance |

No independently actionable confirmed Track B P0 remains from this scoped pass. The discovered persisted-control bypass is fixed locally but not deployed; release gates above remain open. Prior deployed approval-replay risk likewise requires exact deployed-source disposition; local replay tests do not silently remediate a serving API.

Shortest safe path: accepted UX checkpoint → isolated deterministic integration and focused acceptance (**4–8 hours**) → approved security/data/native candidate gate → command generation and separately authorized publication/deployment. A complete retained-scope restricted beta remains approximately **6–10 engineering days after required owner decisions/access**, including evidence workflow, cost controls and quality work; no guaranteed calendar date.

The [hosted runbook](HOSTED-RC-RUNBOOK.md), [pending manifest](release-manifest.pending.json) and tested `scripts/gemini_release_commands.py` provide concrete preflight, no-traffic candidate and rollback commands for a later approved manifest. The current package correctly refuses to emit deployment commands because accepted combined source, registry digests, safe data boundary and approval are missing. It must not be described as deployment-ready.
