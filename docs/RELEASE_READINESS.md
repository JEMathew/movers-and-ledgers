# Release readiness

Release readiness is an evidence-backed decision, not an average score. Use the review template and product scorecard to record the assessment.

## Decision states

- **GREEN** — required evidence is current; no P0 or unresolved P1 finding remains; material P2 risks have owners and acceptable mitigations.
- **AMBER** — no P0 exists, but evidence is incomplete or an explicitly accepted risk requires time-bound mitigation and named ownership. AMBER is not implied approval to release.
- **RED** — a P0 exists, an unresolved P1 is not formally accepted, a required control is absent or failing, or evidence shows unacceptable customer or operational risk.

P0 blocks GREEN. An unresolved P1 normally blocks GREEN and may be accepted only by the accountable decision owner with written rationale, bounded exposure, compensating controls, expiry/review date, and rollback plan. Legal, regulatory, security, privacy, or financial-correctness requirements cannot be waived by a product reviewer alone.

## Required assessment areas

| # | Area | GREEN evidence asks |
| --- | --- | --- |
| 1 | User | Can intended users complete and understand critical tasks without material error? |
| 2 | Customer outcome | Is the expected movement toward First Productive Use defined and evidenced? |
| 3 | Business | Are value, operating burden, and cost implications understood without invented claims? |
| 4 | Product | Is scope coherent, adopted in the intended journey, and free of misleading partial completion? |
| 5 | Migration correctness | Do deterministic controls, reconciliation, lineage, exception handling, and recovery pass? |
| 6 | Agent behavior | Are tool choice, authority, stopping, retry, escalation, and audit behavior evaluated? |
| 7 | GenAI quality | Are groundedness, recommendation quality, uncertainty, and unsupported claims evaluated? |
| 8 | Deterministic quality | Are rules consistent, repeatable, versioned, and tested for false pass/block? |
| 9 | Safety / trust | Are consequential actions governed, explained, and protected from policy or approval bypass? |
| 10 | Security / privacy | Are identity, authorization, isolation, secrets, data handling, retention, and abuse cases reviewed? |
| 11 | UX / accessibility | Do keyboard, focus, semantics, contrast, motion, responsive, and error states pass? |
| 12 | Reliability | Are failure modes, latency, retries, idempotency, recovery, and observability acceptable? |
| 13 | Engineering quality | Do lint, typecheck, tests, build, dependency review, maintainability, and rollback pass? |
| 14 | Platform architecture | Are boundaries, reuse, adapter isolation, coupling, and complexity appropriate? |
| 15 | Evaluation | Are representative golden, model, agent, deterministic, end-to-end, and human evaluations adequate? |
| 16 | Feedback / support readiness | Can users report problems and can operators triage without unsafe data collection? |
| 17 | Demo readiness | Is the story credible, stable, valuable, and free of hidden manual workarounds? |

## Decision record

Record release identifier and scope, code/config/data versions, assessment date, evidence links, status for all 17 areas, open findings by severity, accepted risks, owners, rollback/recovery plan, monitoring and support plan, approvers, and final GREEN/AMBER/RED decision. Missing assessment areas are **NOT ASSESSED**, not GREEN.
