# Review: product governance and scorecard framework

Review date: `2026-09-27`

Branch / baseline: `feature/product-governance-scorecard-v2` / `4fed529`

## Scope

- **In scope:** the governance, measurement, reviewer, feedback/support, migration, AI/agent, UX, and release-readiness documents in PR #2.
- **Out of scope:** Discover → Assess implementation, production instrumentation, feedback/support runtime, reviewer runtime, provider integrations, deployment, and the deferred Next.js/PostCSS and Starlette maintenance items.
- **Change risk / credible blast radius:** documentation and governance only; no application behavior, schema, infrastructure, identity, financial write, or production-data path changes.
- **Customer problem:** teams and review agents need one practical, customer-centered control system for building and assessing a trustworthy migration product.
- **Expected outcome:** consistent decisions tied to verified First Productive Use, deterministic financial correctness, progressive trust, and provider-neutral delivery.
- **Metrics expected to move:** none claimed by this documentation change. The framework defines proposed outcome, health, business, product, model, and operational measures without reporting production results.

## Evidence and reviewers

- **Evidence reviewed:** all PR files; current README and IP notice; design-system review; architecture; trust baseline; security threat model; product routes and surface copy; reviewer prompts; package scripts; repository diff.
- **Reviewer perspectives executed:** Product, Customer Outcome, Migration, Agentic AI, GenAI Quality, FinTech Trust, UX, Architecture, Security, Metrics, Release Readiness, and Demo.
- **Assumptions and evidence gaps:** the repository remains a synthetic public reference implementation. Production metrics, customer research evidence, support operations, reviewer automation, production identity/tenant controls, and a live demo run are not implemented or claimed.

## Initial findings

| ID | Reviewer | Finding | Evidence | Why it matters | Severity | Recommended remediation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GOV-001 | Metrics / Customer Outcome | The North Star combined verified customer success with “minimal assisted intervention.” | Baseline [Product constitution](../PRODUCT_CONSTITUTION.md) and [Metrics framework](../METRICS_FRAMEWORK.md) North Star text. | It could discount successful complex migrations and discourage appropriate human help, conflicting with progressive trust and HITL controls. | P1 | Make verified First Productive Use the outcome; measure assistance separately by level, reason, and cost. | Resolved. |
| GOV-002 | Product / Metrics / FinTech Trust | First Productive Use was conceptually useful but lacked the minimum auditable measurement contract needed for a stable numerator. | Baseline product definition said “agreed, meaningful accounting task”; the metric referred to a future versioned contract without minimum criteria. | Teams could change the task or evidence after the fact, count support-performed tasks, or report completion without deterministic evidence. | P1 | Define actor, environment, pre-agreed task/acceptance criteria, required controls, exception disposition, observation, and evidence. | Resolved. |
| GOV-003 | Release Readiness / Architecture | The release policy required all areas but provided no safe NOT APPLICABLE path, and it did not state whether an accepted P1 could be GREEN. | Baseline [Release readiness](../RELEASE_READINESS.md) decision states and decision record. | Low-risk Beta/docs changes could become needlessly bureaucratic, while different reviewers could issue conflicting decisions for accepted P1 risk. | P1 | Add scope-proportionate evidence, controlled NOT APPLICABLE use, and make accepted P1 explicitly AMBER. | Resolved. |
| GOV-004 | Release Readiness / Architecture | The review template collapsed the 17 mandatory areas into eight grouped rows. | Baseline [review template](TEMPLATE.md) scorecard table versus the 17 areas in release readiness and product scorecard. | A review could silently omit a required area or hide RED/NOT ASSESSED evidence inside a combined row. | P1 | Give every dimension its own status/evidence row and require rationale for NOT APPLICABLE. | Resolved. |
| GOV-005 | Product / UX | Simulator and Try Your Data were grouped as one response, while Try Your Data appeared in the journey but not the product-family definitions. | Baseline product constitution customer-problem table, product family, and canonical journey. | Future UI and messaging could blur synthetic rehearsal with protected customer-data profiling. | P2 | Define Simulator as synthetic rehearsal and Try Your Data as bounded, read-only customer-data preview. | Resolved. |
| GOV-006 | Metrics / Customer Outcome | The metrics “hierarchy” linearly nested customer, product, business, quality, safety, and reliability measures. | Baseline metrics hierarchy. | It obscured the intended separation of value outcomes, leading indicators, and guardrails. | P2 | Replace the chain with parallel customer/business outcomes, product indicators, and guardrail/health branches. | Resolved. |
| GOV-007 | Architecture / Reviewer governance | Reviewer boundaries allowed duplicate UX/accessibility findings, and the rubric omitted the existing Release Readiness role. | [Reviewer rubrics](../reviewers/REVIEW_RUBRICS.md) and [advisory prompts](../../reviewers/README.md). | Duplicate findings inflate severity and unclear ownership makes agent reviews inconsistent. | P2 | Clarify role ownership/consolidation and include the Release Readiness reviewer in the role table. | Resolved. |
| GOV-008 | Security / Feedback Support | Support-case metadata guidance did not explicitly constrain reference authorization or free-text flow into analytics/model/eval systems. | Baseline [Feedback and support principles](../FEEDBACK_SUPPORT_PRINCIPLES.md). | Implementers could treat a case reference as access or propagate sensitive financial text beyond the originating workspace. | P2 | Require opaque workspace-scoped references, independent authorization, untrusted-content handling, and pre-ingestion redaction. | Resolved. |
| GOV-009 | Metrics | The North Star denominator did not require a matured cohort or treatment of journeys still in progress. | Baseline metrics framework counted journeys started in a measurement window. | Recent cohorts could appear artificially unsuccessful, or open journeys could be silently excluded to inflate results. | P2 | Use start-date cohorts with a predefined elapsed observation window and report still-open journeys separately. | Resolved. |
| GOV-010 | Demo | Demo readiness was credible but did not express the requested 5–7 minute evaluation window. | Baseline product scorecard Demo Readiness row. | Teams could optimize for a long scripted tour that does not prove concise product value. | P3 | Add a credible 5–7 minute meaningful-value path without making demo polish a product outcome. | Resolved. |
| GOV-011 | Metrics / Architecture | Event taxonomy, owners, instrumentation, and real baselines do not yet exist. | [Documentation index](../README.md) explicitly says production metrics instrumentation is absent. | Metric contracts cannot become measured release evidence until implementation begins. | P3 | Define owners and privacy-reviewed event contracts with Discover → Assess instrumentation; keep all current targets proposed. | Open; intentionally deferred. |

### Initial severity summary

- P0: 0
- P1: 4
- P2: 5
- P3: 2

## Remediation and re-review

- Reframed the North Star around verified customer outcome and moved assistance to segmented health/business measures.
- Made First Productive Use auditable without turning a successful data transfer or support-operated task into completion.
- Made release evidence proportional to credible blast radius; unknowns remain NOT ASSESSED, and accepted P1 risk remains AMBER.
- Expanded the reusable review template to all 17 scorecard dimensions.
- Differentiated Learn, Play, Simulator, Try Your Data, Product, and Trust / Agent Operations responsibilities.
- Separated customer and business outcomes from product indicators and quality/safety/operational guardrails.
- Added cohort maturity and open-journey reporting to prevent a biased North Star denominator.
- Clarified reviewer ownership and strengthened support-data isolation/redaction guidance.
- Added the 5–7 minute demo lens while retaining customer value and cross-metric guardrails as authoritative.

Re-review found no unresolved P0 or P1 issue. The changes remain documentation-only and do not weaken deterministic controls, human governance, provider neutrality, design-system conventions, Beta boundaries, or public-reference/IP positioning.

## Required question assessment

1. **North Star:** suitable after remediation; verified First Productive Use is the customer outcome, while assistance is a segment/health measure.
2. **Customer versus business outcome:** separated in the scorecard and metrics branches; neither substitutes for the other.
3. **Agent vanity metrics:** autonomy, acceptance, tool success, and similar metrics are explicitly diagnostic and require outcome/safety guardrails.
4. **First Productive Use:** sufficiently defined for governance through a versioned, pre-agreed, observed, evidence-linked contract; implementation still needs event schemas.
5. **Feedback/support learning:** integrated through triage, classification, fix, regression/eval case, release, and resolution.
6. **Safety and trust:** first-class in the constitutions, scorecard, release areas, severity rules, and guardrails.
7. **Deterministic controls:** authoritative for financial correctness, reconciliation, approval enforcement, and completion.
8. **Reviewer redundancy:** specialist overlap is useful, and the rubric now assigns ownership and consolidation rules to prevent duplicate findings.
9. **Beta release weight:** proportionate after remediation; all areas are considered, but unaffected areas can be NOT APPLICABLE with evidence.
10. **Delivery speed:** the framework should not slow low-risk work when scoped correctly; full-depth evidence remains mandatory for consequential boundaries.
11. **Internal ideation lenses:** supported as internal quality lenses without public hackathon/competition positioning.
12. **Experience boundaries:** Learn teaches, Play introduces visually, Simulator rehearses with synthetic data, Try Your Data performs a protected read-only preview, Product executes the governed journey, and Trust / Agent Operations supplies controls and evidence.
13. **Google technologies:** Google SSO compatibility, ADK, Gemini, and GCP remain optional implementation/deployment boundaries, not product requirements or paid-resource assumptions.
14. **Sensitive support data:** automatic raw financial-data attachment is prohibited; references are workspace-scoped and free text/attachments are redacted before secondary systems.
15. **Public reference/IP:** the README notice, independent synthetic positioning, and existing repository license remain authoritative and unchanged.

## Scorecard assessment of this governance change

These statuses assess the governance framework in PR #2, not production readiness of the unimplemented migration service.

| Dimension | Status | Evidence | Owner / action |
| --- | --- | --- | --- |
| User | GREEN | Mission, users, comprehension, and control principles are explicit. | Product owner maintains. |
| Customer outcome | GREEN | Verified First Productive Use anchors the framework. | Product/metrics owners maintain contract. |
| Business | GREEN | Sustainable value is separate from customer success; no invented results. | Business owner defines future targets. |
| Product | GREEN | Family, canonical journey, Beta boundaries, and non-goals are coherent. | Product owner. |
| Migration quality | GREEN | Lineage, transformation, validation, reconciliation, exceptions, recovery, configuration, and onboarding are covered. | Migration owner. |
| Agent quality | GREEN | Tool, state, authority, stopping, retry, escalation, and audit contracts are bounded. | Agent owner. |
| GenAI quality | GREEN | Grounding, structured records, uncertainty, explanation, and eval expectations are explicit. | AI/evaluation owners. |
| Deterministic quality | GREEN | Financial truth and completion gates remain outside model authority. | Domain engineering owner. |
| Safety / trust | GREEN | Consequential decisions require evidence and governed approval. | Trust owner. |
| Security / privacy | GREEN | Threat model plus support boundaries cover isolation, data minimization, redaction, secrets, and launch gates. | Security/privacy owners. |
| Reliability / operations | GREEN | Retry, idempotency, safe stop, recovery, and operational evidence requirements are defined. | Operations owner. |
| Engineering quality | GREEN | Lint, typecheck, tests, build, Ruff, Markdown links, whitespace, and secret scan pass. | Change author. |
| Evaluation maturity | GREEN | Layered deterministic, model, agent, E2E, and human evaluation expectations are defined. | Evaluation owner. |
| UX / accessibility | GREEN | Shared theme, semantic status, keyboard, focus, responsive, and reduced-motion requirements are preserved. | UX owner. |
| Platform scalability | GREEN | Provider-neutral canonical model and adapter boundaries remain authoritative. | Architecture owner. |
| Feedback / support | GREEN | Privacy-conscious closed loop and regression/eval conversion are explicit. | Product/support owners. |
| Demo readiness | GREEN | Credible 5–7 minute value path is required without overriding product outcomes. | Demo owner. |

## Quality gates

| Gate | Result |
| --- | --- |
| Frontend lint | PASS |
| TypeScript / typecheck | PASS |
| Frontend tests | PASS — 9 tests |
| Production frontend build | PASS — Next.js 15.5.26, static generation completed (14/14) |
| Ruff | PASS |
| Backend tests | PASS — 10 tests; one known Starlette test-client deprecation warning |
| Markdown local links | PASS — 53 Markdown files checked |
| Whitespace / `git diff --check` | PASS |
| Secret scan of remediation files | PASS — no matches |

Only Markdown governance/reviewer files changed during remediation. Application behavior and design-system source are unchanged; the frontend tests and production build provide regression evidence for the existing design-system behavior. The README reference-use and IP sections remain present, `LICENSE` is unchanged, no new license was added, and no measured production result or unlabelled numeric product target was introduced.

## Unresolved follow-ups

- Implement production metrics/event instrumentation and assign data owners when the relevant product slice is built.
- Implement feedback/support UI and backend only with the documented authorization, redaction, retention, and incident boundaries.
- Build no reviewer runtime until demonstrated need; the current prompts remain advisory.
- Handle the Next.js/PostCSS upgrade separately because the automated path is breaking.
- Address the existing Starlette test-client deprecation warning during dependency maintenance.

## Readiness

- **Final P0:** 0
- **Final P1:** 0
- **Release readiness:** **GREEN** for the governance/documentation change
- **Demo readiness:** GREEN for the governance framework; no claim about a live production demo.
- **Accepted risks:** none.
- **Rollback / recovery:** revert the documentation remediation commit; no runtime or data migration is involved.
- **Merge recommendation:** PR #2 is ready for a human owner to merge. Do not merge automatically.
