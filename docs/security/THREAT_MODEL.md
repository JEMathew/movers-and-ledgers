# Security and privacy baseline

Protected routes require a verified identity; production must reject the local demo mechanism. Authorization is workspace-scoped and defaults to deny. Provider tokens and encryption keys live in Secret Manager, never application tables or logs.

Primary threats include malicious uploads, formula/CSV injection, prompt injection inside accounting text, tenant crossover, over-privileged connectors, replayed writes, poisoned mappings, sensitive-data leakage to prompts/logs, and false claims of reconciliation.

Controls include file type/size limits, malware scanning, isolated parsing, content treated as untrusted data, tool allowlists, least-privilege OAuth scopes, tenant predicates, idempotency keys, immutable manifests, approval separation, redaction, retention/deletion policy, egress controls, and deterministic reconciliation. Production launch requires privacy, security, legal, incident-response, backup/restore, and data-residency review.

