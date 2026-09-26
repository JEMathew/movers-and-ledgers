# Contributing

Use small changes with tests. New provider behavior belongs in an adapter, not the canonical domain. New agent tools require an input/output schema, explicit authority level, timeout/retry behavior, idempotency strategy, audit fields, and deterministic tests. Never add real customer data, credentials, generated secrets, or claims about a provider's internal systems.

Pull requests should explain the customer value, trust impact, failure modes, observability, and rollback path.

