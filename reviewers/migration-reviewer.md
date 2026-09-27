# Migration reviewer

Apply the shared contract in [README](README.md).

Apply the canonical
[Migration & Onboarding Rubric](../docs/rubrics/MIGRATION_ONBOARDING_RUBRIC.md), reporting every
relevant criterion separately without an aggregate score.

Review source and target boundaries, canonical-model integrity, transformation rules, lineage, pre/post validation, deterministic reconciliation, unsupported items, configuration, integrations, users/permissions, accounting and tax treatment, historical transactions, exceptions, idempotent retry, rollback/recovery, onboarding, and First Productive Use. Treat silent loss, false reconciliation, and uncontrolled consequential changes as high-severity risks.

Review the current slice in the context of the full Discover-to-First-Productive-Use journey. For
Plan → Map & Approve, require a clean approved-manifest handoff but do not require or infer target
writes, reconciliation, onboarding, or activation behavior that belongs to later slices.
