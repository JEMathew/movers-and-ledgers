# Discover → Assess architecture

## Purpose and boundary

Discover → Assess is the first working MoveBooks AI vertical slice. It profiles a versioned
synthetic company, produces deterministic findings, and applies an explainable readiness policy.
It performs no source mutation, mapping decision, target write, or provider integration. Its
evidence feeds the separately bounded [Plan → Map → Approve](plan-map-approve.md) phase.

```text
Protected /assess experience
        │ demo identity
        ▼
Versioned FastAPI routes
        │ owner-scoped session
        ▼
Discovery Agent ──► deterministic discovery tools ──► evidence + findings
        │
        ▼
Assessment Agent ──► discover-assess-readiness-v1 ──► readiness + next actions
        │
        └──► customer-safe activity records + lightweight product events
```

The agents orchestrate tools and package results. They do not manipulate accounting records or use
model-generated facts. The complete flow works without Gemini or other model credentials, and raw
rows are not written to agent activity or product events.

## Contracts and persistence

The domain models in `domain/discovery_assessment` define profiles, findings, evidence, readiness,
activity, events, and sessions. The persistence port is `MigrationSessionRepository`; the current
adapter is process-local, owner-scoped, and intentionally ephemeral. A durable database adapter can
replace it without changing the domain or HTTP contracts.

All feature routes require the existing identity dependency:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/v1/sample-companies` | List safe synthetic fixtures. |
| POST | `/v1/migration-sessions` | Create an owner-scoped session. |
| GET | `/v1/migration-sessions/{id}` | Retrieve the owner-scoped session. |
| POST / GET | `/v1/migration-sessions/{id}/discovery` | Run or retrieve discovery. |
| GET | `/v1/migration-sessions/{id}/findings` | Retrieve structured findings. |
| POST / GET | `/v1/migration-sessions/{id}/assessment` | Run or retrieve readiness. |
| GET | `/v1/migration-sessions/{id}/activity` | Retrieve customer-safe agent activity. |
| POST | `/v1/migration-sessions/{id}/events` | Record a declared product event. |

## Deterministic policy

`discover-assess-readiness-v1` applies three outcomes:

- `BLOCKED` when any required dataset, critical field, or critical relationship fails.
- `NEEDS ATTENTION` when warnings exist without a blocker, including duplicate candidates,
  non-critical required-field gaps, or unsupported optional configuration.
- `READY` when no blocker or warning exists.

No numeric readiness score is presented because this phase has no defensible weighting model. The
status is a transparent policy result, not AI confidence.

## Synthetic fixture and evaluation

`synthetic-data/sample-company.json` contains Northstar Supplies. It includes clean datasets plus
duplicate customer candidates, a vendor field gap, an invalid invoice relationship, and unsupported
inventory configuration. `evals/discover_assess_cases.json` defines six golden cases covering clean,
warning, blocker, and repeated-input behavior.

## Product events

The feature defines only contracts for `assessment_started`, `discovery_started`,
`discovery_completed`, `finding_generated`, `assessment_completed`, `assessment_blocked`, and
`continue_to_plan_selected`. Events are held with the ephemeral session; there is no production
analytics pipeline and no measured-outcome claim.

## Known production gaps

- Durable persistence, retention policy, and cross-process concurrency controls.
- Production identity verification and authorization policy beyond the existing demo seam.
- Idempotency keys, job execution, retries, timeouts, and operational telemetry.
- Provider adapters, private uploads, target capabilities, and target writes.
- Production analytics instrumentation and accountable metric ownership.
