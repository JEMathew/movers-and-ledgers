# Product constitution

This document is the durable product decision framework for MoveBooks AI. When a proposal conflicts with it, the proposal must be changed or the constitution must be amended through explicit review.

## Mission and users

MoveBooks AI helps businesses understand, prepare for, execute, and adopt an accounting migration with evidence, deterministic financial controls, and accountable human decisions.

Primary users are business owners and finance operators responsible for a migration. Accountants, bookkeepers, advisors, migration specialists, administrators, approvers, and support teams are supporting users with distinct permissions and evidence needs.

## Customer problems and value proposition

| Customer problem | User statement | Product response |
| --- | --- | --- |
| Conceptual uncertainty | “I do not understand migration.” | **Learn** explains the domain; **Play** makes the lifecycle tangible. |
| Personal uncertainty | “I do not know what migration will look like for my business.” | **Simulator** rehearses the journey with synthetic businesses; **Try Your Data** privately profiles a bounded customer export without target writes. |
| Execution burden | “I do not want to manually manage a complex migration.” | **MoveBooks AI Product** combines deterministic tools, bounded agents, approvals, validation, configuration, and onboarding in one governed workflow. |

The value proposition is a provider-neutral path from uncertainty to First Productive Use: users can see what will happen, understand why, control consequential decisions, and verify the accounting outcome.

## Product family

- **MoveBooks AI Product** — the governed migration workspace from discovery through First Productive Use.
- **MoveBooks AI Simulator** — high-fidelity practice with synthetic accounting environments and controlled failure cases.
- **Try Your Data** — a protected, read-only preview that profiles a bounded customer export before a migration workspace is started.
- **MoveBooks AI Play** — an approachable visual introduction to migration concepts and trade-offs.
- **MoveBooks AI Learn** — contextual education about migration, accounting, readiness, and AI trust.
- **Trust / Agent Operations** — evidence, approvals, auditability, evaluation, policy enforcement, and operational visibility.

## Canonical journey

All product surfaces should use this lifecycle as their full reference model. A screen may show a clearly labelled subset, but must not imply that a shortened sequence is the complete migration.

```text
Learn → Play → Simulate → Try Your Data → Discover → Assess → Plan
→ Map & Approve → Migrate → Resolve → Validate → Configure
→ Onboard → First Productive Use
```

**First Productive Use** means an authorized customer user completes an agreed, meaningful accounting task in the intended target environment after required data, configuration, access, integrations, and onboarding controls pass. The versioned journey contract must identify the task and acceptance criteria before execution, record the observation and time, link the deterministic completion evidence, and show that blocking exceptions are resolved or formally accepted. A successful transfer, a support operator performing the task for the customer, or an unverified self-report alone is not completion.

## North-star outcome

**Percentage of eligible migration journeys reaching verified First Productive Use.**

This is a proposed product definition, not a claim about measured production performance. The measurement contract is defined in [Metrics framework](METRICS_FRAMEWORK.md).

## Progressive trust model

Trust is earned in reversible increments:

1. **Understand** — teach concepts, responsibilities, limitations, and risk.
2. **Practice** — let users explore safely with synthetic data.
3. **Preview** — profile bounded customer data without performing target writes.
4. **Explain** — attach evidence, confidence, alternatives, and consequences to recommendations.
5. **Approve** — require an authorized human or deterministic policy for consequential decisions.
6. **Execute** — use scoped, idempotent tools with explicit state transitions and safe stops.
7. **Verify** — reconcile deterministically, expose exceptions, and preserve lineage.
8. **Adopt** — validate configuration, integrations, permissions, onboarding, and First Productive Use.

Later stages must not weaken controls established earlier.

## Platform principles

1. Migration must reduce risk, not merely move data.
2. Financial correctness must be deterministic.
3. AI may reason but must not silently override accounting controls.
4. Consequential decisions require evidence, explanation, and appropriate human control.
5. Users must understand what happened, why, and what happens next.
6. Source and target extensibility is mandatory.
7. Simulation and Play must educate without trivializing financial migration.
8. Migration is not complete until First Productive Use.
9. Complexity must be justified by customer value.
10. Reusable platform capability should be preferred without premature overengineering.

## Beta boundaries

- The repository is a provider-neutral, synthetic reference implementation, not a production migration service.
- Public learning surfaces and protected product concepts may be demonstrated; production identity, tenant isolation, privacy, legal, incident-response, data-residency, and provider reviews remain launch gates.
- Local demo authentication must fail closed in production.
- No provider connector, autonomous financial write, or production performance claim is implied by the current scaffold.
- Recommendations do not constitute accounting, tax, or legal advice.
- Any beta target must be explicitly labelled **Beta target** and backed by a measurement definition; no target is a measured result.

## Non-goals

- Reproducing or claiming knowledge of any accounting provider’s internal systems, APIs, architecture, or roadmap.
- Treating an LLM response as financial truth, reconciliation evidence, or authorization.
- Hiding unsupported data, configuration, permissions, integrations, or exceptions.
- Optimizing agent autonomy at the expense of customer outcome, safety, trust, or control.
- Building a universal workflow engine or reviewer runtime before demonstrated product need.
- Positioning MoveBooks AI publicly as a hackathon or competition project.

## Public positioning

MoveBooks AI is an independent product concept developed by **Movers & Ledgers**. Public materials must preserve the README reference-use notice, the Reference Use & Intellectual Property section, the applicable license, and the independent synthetic-product statement. Public availability is not evidence of provider affiliation and does not expand rights beyond the repository license.
