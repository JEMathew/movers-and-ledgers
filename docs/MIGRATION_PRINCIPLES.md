# Migration principles

Migration is not a file copy. It is a controlled change to financial data, configuration, integrations, access, operating practice, and customer readiness.

## Architecture and lineage

```text
Source → source adapter → canonical model → governed transformation
→ target adapter → target
```

Adapters contain provider-specific behavior at system boundaries. The canonical model and transformation policies remain provider-neutral. Every output must retain lineage to its source, transformation version, evidence, approvals, execution attempt, and validation result.

## Invariants

- Validate scope, schema, identity, access, and data quality before migration.
- Validate counts, referential integrity, accounting invariants, balances, and checksums after migration.
- Reconciliation is deterministic and repeatable; a model cannot declare it passed.
- Unsupported data or configuration must never silently disappear. Inventory it, explain impact, assign disposition, and require approval when consequential.
- Transformations are versioned, testable, explainable, attributable, and auditable.
- Failures preserve known-good state and enough evidence for recovery.
- Retries are controlled, bounded, classified, and idempotent for writes.
- Configuration, integrations, permissions, onboarding, and First Productive Use are part of migration—not postscript work.

## Scope by concern

| Concern | Required treatment |
| --- | --- |
| Data | Inventory entities, volumes, date ranges, quality, dependencies, attachments, and unsupported fields. Preserve source identifiers and lineage. |
| Configuration | Map chart structure, fiscal settings, currencies, numbering, workflows, and feature differences explicitly. |
| Integrations | Discover dependencies; never assume portability. Reconnect deliberately with least privilege and visible verification. |
| Users and permissions | Translate roles conservatively, prevent privilege expansion, and require authorized review of ambiguous mappings. |
| Accounting rules | Represent transformations as deterministic, versioned rules with tests and approval where treatment changes. |
| Historical transactions | Define the history boundary, opening-balance strategy, corrections, attachments, and audit requirements before execution. |
| Tax | Treat jurisdiction, rates, codes, filing state, and historical treatment as high-consequence; require specialist review where needed. |
| Validation | Run preflight and post-write controls; publish evidence, variances, exclusions, and accountable sign-off. |
| Exception management | Classify, prioritize, assign, explain, and track every unresolved item to resolution or explicit acceptance. |
| Rollback and recovery | Define reversible units, checkpoints, restore or compensation steps, ownership, and re-validation before writes. |

## Completion

A migration completes only when required data and configuration are verified, integrations and access are intentionally established, exceptions are resolved or formally accepted, users can operate the target, and the agreed First Productive Use is observed and recorded.
