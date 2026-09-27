# MoveBooks AI

MoveBooks AI is an independent, provider-neutral product concept from **Movers & Ledgers** for understanding, simulating, planning, executing, and validating accounting migrations.

> This repository is synthetic and independent. It does not represent or disclose the architecture, APIs, roadmap, or implementation of Intuit, QuickBooks, or any other accounting provider.

**Reference implementation:** This public repository is provided primarily for demonstration, evaluation, learning, and portfolio purposes. MoveBooks AI and Movers & Ledgers remain independent product concepts. Public access to the repository does not by itself grant rights to commercially reproduce, rebrand, resell, or redistribute the product beyond the permissions explicitly provided in the repository license.

## Product surfaces

- **Product** — governed migration workspaces from discovery to first productive use.
- **Simulator** — high-fidelity exercises using synthetic accounting environments.
- **Play** — a lightweight visual journey through migration concepts.
- **Learn** — contextual education about migration, accounting, readiness, and AI trust.
- **Trust / Agent Operations** — evidence, approvals, audit records, evaluation, and observability.

Public introductions and help are `/`, `/product`, `/simulator`, `/learn`, `/play`, `/trust`, `/feedback`, and `/support`. Simulator enters protected `/assess` without approval replay. `/try-your-data` now validates controlled CSV/JSON or flat ZIP packages and hands explicitly reviewed data to the same Discovery/Assessment agents. It is for **local, de-identified test exports only**, not confidential customer data or secure hosted intake; all target operations remain synthetic. Workspace/stage routes retain authentication; demo identity fails closed in production. Trust uses a server-side payload-free projection. Feedback remains a local draft, not a submitted ticket. See [public product surfaces](docs/architecture/public-product-surfaces.md) and [Try Your Data](docs/architecture/try-your-data.md).

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

### Google-native runtime foundations

See the [runtime architecture](docs/architecture/google-native-runtime.md),
[Google Cloud operator handoff](docs/deployment/google-cloud.md) and
[review record](docs/reviews/google-native-runtime.md). Cloud SQL, Firebase identity and private
artifact adapters are prepared without deployment or live Gemini/managed ADK activation.
Readiness is **AMBER pending container/PostgreSQL execution gates**, not production readiness.
Local development remains credential-free; controlled Try Your Data exports remain local-only.

## Verify

```bash
make test
make lint
```

See the [documentation index](docs/README.md) for product governance, architecture, trust, evaluation, metrics, release readiness, reviewer guidance, and contributing references.

## Reference Use & Intellectual Property

MoveBooks AI is an independent product concept developed by **Movers & Ledgers**.

This repository is made publicly available primarily for **demonstration, learning, portfolio, evaluation, and reference purposes**.

The repository may be reviewed to understand the product concepts, architecture, agentic AI patterns, migration workflows, user experience, evaluation approaches, and engineering practices used in MoveBooks AI.

Public availability of this repository should not be interpreted as a waiver of intellectual property rights or as authorization to commercially reproduce, redistribute, rebrand, resell, or create substantially derivative commercial products from MoveBooks AI unless explicitly permitted by the applicable repository license.

Product names, branding, product concepts, proprietary migration intelligence, domain-specific knowledge assets, designs, documentation, datasets, and other intellectual property associated with **Movers & Ledgers** and **MoveBooks AI**remain subject to their respective intellectual property rights.

MoveBooks AI is an independent synthetic product concept and does not represent, reproduce, or claim to describe the internal products, systems, APIs, architectures, roadmaps, or implementation details of Intuit, QuickBooks, or any other accounting software provider.

Where third-party technologies, frameworks, libraries, trademarks, or services are referenced, those remain the property of their respective owners.

For permitted use of the source code, refer to the repository's `LICENSE` file.

## Status

This foundation implements the synthetic Discover → Assess → Plan → Map & Approve → Migrate →
Resolve → Validate → Configure → Onboard → Verified First Productive Use path, including exact
synthetic reconciliation, governed setup, and one approved customer invoice with deterministic
posting and accounting verification. It does not implement live provider integrations, durable
production operations, production reconciliation, or autonomous financial writes. All source and
target systems remain behind provider-neutral interfaces. See the
[Onboard → FPU architecture](docs/architecture/onboard-fpu.md) and
[review record](docs/reviews/onboard-fpu.md). The `/onboard-fpu` demo explicitly replays earlier
synthetic stages; new onboarding and invoice approvals remain interactive.
