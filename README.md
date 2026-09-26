# MoveBooks AI

MoveBooks AI is an independent, provider-neutral product concept from **Movers & Ledgers** for understanding, simulating, planning, executing, and validating accounting migrations.

> This repository is synthetic and independent. It does not represent or disclose the architecture, APIs, roadmap, or implementation of Intuit, QuickBooks, or any other accounting provider.

## Product surfaces

- **Product** — governed migration workspaces from discovery to first productive use.
- **Simulator** — high-fidelity exercises using synthetic accounting environments.
- **Play** — a lightweight visual journey through migration concepts.
- **Learn** — contextual education about migration, accounting, readiness, and AI trust.
- **Trust / Agent Operations** — evidence, approvals, audit records, evaluation, and observability.

Public routes are `/`, `/learn`, and `/play`. `/simulator`, `/try-your-data`, `/workspace`, `/approvals`, and `/reports` are protected by an authentication boundary. Development uses a clearly labelled demo session; production intentionally fails closed until a Google-compatible identity verifier is configured.

## Responsibility model

**Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential decisions.**

Financial truth stays outside the language model. Schema checks, counts, referential integrity, balances, reconciliation, checksums, transformation constraints, and approval policies are deterministic gates.

## Quick start

Prerequisites: Node.js 22+, Python 3.11+, and Docker (optional).

```bash
make setup
make dev-api     # http://localhost:8000/docs
make dev-web     # http://localhost:3000
```

Or run everything with `docker compose up --build`. No Google credentials or paid cloud resources are required.

## Verify

```bash
make test
make lint
```

See [architecture](docs/architecture/README.md), [trust model](docs/TRUST.md), [security](docs/security/THREAT_MODEL.md), and [contributing](CONTRIBUTING.md).

## Status

This foundation implements contracts and a thin vertical slice, not provider integrations or autonomous financial writes. All source and target systems are adapters behind provider-neutral interfaces.

