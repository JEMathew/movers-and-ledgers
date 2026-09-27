# Migration agent

Invokes allowlisted transformation and load tools using approved manifests and idempotency keys.

The Beta implementation writes only to an inspectable synthetic target. Financial execution,
validation, idempotency, progress, and checkpoint decisions are deterministic. An optional ADK
definition is provided for bounded explanation only and does not receive write authority.
