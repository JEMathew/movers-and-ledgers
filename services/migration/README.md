# Migration service

Future background execution boundary for the now-implemented in-process Migrate → Resolve contract.
The Beta consumes approved synthetic manifests, executes resumable deterministic batches, records
checkpoints and evidence, and never decides whether reconciliation or a migration is financially
correct. Durable workers, transactions, compensation, and production provider adapters remain
future operational hardening.
