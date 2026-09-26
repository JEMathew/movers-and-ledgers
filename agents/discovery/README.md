# Discovery agent

The Discovery Agent inventories the selected synthetic source by orchestrating only declared,
deterministic tools. It profiles datasets, validates required structures and critical references,
detects duplicate candidates, and checks source configuration against explicit target assumptions.

It returns structured profiles, findings, evidence references, and an audit-safe activity log. It
does not modify source data, infer unsupported facts, send raw records to a model, or make migration
decisions.
