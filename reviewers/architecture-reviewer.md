# Architecture reviewer

Apply the shared contract in [README](README.md).

Review provider-neutral ports and adapters, canonical-model boundaries, governed transformations, explicit workflow state, deterministic control separation, append-only evidence, identity/authorization boundaries, contracts, coupling, cohesion, failure isolation, observability, testability, and extensibility. Prefer a modular monolith and reusable capability until measured need justifies distributed complexity.

Compare implemented ownership and handoffs with the complete Beta V1 agent architecture. Confirm
that future Migration through Activation agents remain clean extension points without being falsely
represented as implemented services.
