# Security and privacy baseline

Protected routes require a verified identity; production must reject the local demo mechanism. Authorization is workspace-scoped and defaults to deny. Provider tokens and encryption keys live in Secret Manager, never application tables or logs.

Primary threats include malicious uploads, formula/CSV injection, prompt injection inside accounting text, tenant crossover, over-privileged connectors, replayed writes, poisoned mappings, sensitive-data leakage to prompts/logs, and false claims of reconciliation.

Controls include file type/size limits, malware scanning, isolated parsing, content treated as untrusted data, tool allowlists, least-privilege OAuth scopes, tenant predicates, idempotency keys, immutable manifests, approval separation, redaction, retention/deletion policy, egress controls, and deterministic reconciliation. Production launch requires privacy, security, legal, incident-response, backup/restore, and data-residency review.


## Controlled test exports in the current Beta

Uploaded test exports are untrusted data, enforced in code rather than by convention:

- **Intake** (`services/api/src/movebooks_api/intake.py`) accepts only the documented file names, sniffs renamed binaries (Excel, PDF, Office, programs, archives, images), rejects invalid UTF-8, hidden control and text-direction characters, unsafe ZIPs and anything over the published limits, and validates schema, types, identifiers, references and balance deterministically. A package with any blocker keeps no accepted data and cannot become a workspace.
- **Findings** name only schema columns, schema keys and identifiers that passed the ID pattern; free-text values (`UNTRUSTED_TEXT`) are never echoed.
- **Models**: the only model path refuses uploaded sessions (`agents/reasoning/projection.py`), so uploaded text never enters a prompt. Discovery, assessment and mapping are deterministic.
- **Authority**: uploaded text cannot approve, call tools, fetch URLs or change workflow state. "Approved by CFO" in a file is a name.

Tests: `tests/test_intake_errors.py`, `tests/test_intake_hardening.py`, `tests/test_untrusted_upload_content.py`.

Not yet implemented: malware scanning, and neutralising spreadsheet formula prefixes (`=`, `+`, `-`, `@`). Values are never exported to a spreadsheet today, so formula injection has no sink yet.
