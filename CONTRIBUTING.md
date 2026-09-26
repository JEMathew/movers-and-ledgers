# Contributing

Use small changes with tests. New provider behavior belongs in an adapter, not the canonical domain. New agent tools require an input/output schema, explicit authority level, timeout/retry behavior, idempotency strategy, audit fields, and deterministic tests. Never add real customer data, credentials, generated secrets, or claims about a provider's internal systems.

Pull requests should explain the customer value, trust impact, failure modes, observability, and rollback path.

Material product and platform changes must follow the [product constitution](docs/PRODUCT_CONSTITUTION.md), [AI and agent constitution](docs/AI_AGENT_CONSTITUTION.md), and applicable principles in the [documentation index](docs/README.md). Use the [review template](docs/reviews/TEMPLATE.md) and [reviewer rubrics](docs/reviewers/REVIEW_RUBRICS.md) for formal review; reviewer roles are advisory and do not modify production code.
