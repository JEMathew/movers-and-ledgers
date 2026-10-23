# MoveBooks AI

**Move your books. Keep your confidence.**

Accounting migration should finish with books you can use and results you can explain.
MoveBooks AI helps business owners, accountants and finance operators understand readiness,
review mappings, resolve exceptions and verify a first productive task—with human approval
and deterministic financial checks throughout.

[**Launch MoveBooks AI**](https://movebooks-si.web.app) ·
[**Explore the guided demo**](https://movebooks-si.web.app/simulator) ·
[**Watch Three-Minute Journey · 2:49**](https://movebooks-si.web.app/learn?tab=videos#lesson-09)

[Product Showcase](docs/showcase/README.md) · [Nine-video Academy](docs/video-academy/README.md) ·
[Evidence and capability status](docs/showcase/EVIDENCE.md) · [Developer setup](#developer-setup)

> **Bounded synthetic Beta.** No real customer or production provider data. No live accounting-provider
> migration or production/compliance-readiness claim. The public guided demo needs no sign-in;
> the operational workspace requires Google sign-in. Gemini is a restricted evaluation, not general access.

[![Actual public guided demo showing the Prepare stage and sample mapping evidence](docs/showcase/assets/demo-public-20261024.jpg)](https://movebooks-si.web.app/simulator)

*Genuine public UI capture, 24 October 2026 (IST). This is the read-only guided demo with
sample evidence, not an executed migration. [Screenshots and provenance](docs/showcase/README.md#05-prototype-showcase).*

## Why it exists

A successful import does not answer three practical questions: **Did the right records move?
Do the numbers reconcile? Can the business start working?** Fragmented exports, ambiguous
account mappings and unresolved exceptions make that handover difficult to trust.

MoveBooks connects preparation, migration and onboarding into one governed journey. It makes
uncertainty visible before approval and carries evidence through to **Verified First Productive Use**.
This is a product hypothesis demonstrated with synthetic books; customer time savings and
production adoption outcomes have not been measured.

## Experience the product

1. [Explore Demo](https://movebooks-si.web.app/simulator): a short, read-only tour of Harbor Light Books.
2. [Watch the hosted product walkthrough](https://movebooks-si.web.app/learn?tab=videos#lesson-09):
   the exact Academy title is **Three-Minute Journey**, measured at 169.007 seconds, with English captions.
3. [Open the Guide](https://movebooks-si.web.app/guide) and use the authenticated workspace to rehearse the synthetic journey.

The [Video Academy inventory](docs/video-academy/README.md) includes all nine lessons, direct video
and caption links, and the separate **2:55 final-demo V2** archive. That older film is available
locally but has no verified public hosting URL; it is not the hosted Academy walkthrough above.
The landing page's 25-second **Product Vision** is conceptual media.

## Five stages, one completion contract

| Stage | What the user does | Evidence and safeguard |
| --- | --- | --- |
| **Understand** | Discover the source and assess readiness | Schema, required-field and reference checks expose blockers. |
| **Prepare** | Review the plan and account mappings | Consequential choices require explicit, current human approval. |
| **Move** | Execute approved synthetic batches and resolve exceptions | Checkpoints, bounded retries and idempotency preserve recovery. |
| **Verify** | Reconcile records and review configuration | Exact accounting checks must pass; approval cannot waive a failure. |
| **Start** | Complete onboarding and approve the first synthetic invoice | Deterministic verification establishes First Productive Use. |

The underlying lifecycle remains Discover → Assess → Plan → Map & Approve → Migrate → Resolve
→ Validate → Configure → Onboard → Verified First Productive Use.
[Product constitution](docs/PRODUCT_CONSTITUTION.md) · [FPU contract](docs/architecture/onboard-fpu.md).

## What is verified

**Snapshot: 24 October 2026 (IST).** Public hosting, source publication and test results are separate facts.

| Capability | Supported statement |
| --- | --- |
| Public experience and UX | **A — publicly verified:** current landing, guided demo, Learn and nine-video Academy observed at the canonical URL. This does not certify every authenticated V2 flow. |
| Deterministic migration and FPU | **C — locally verified:** recorded real UI/API journey passes 21 checks, including 17 reconciliation checks and an approved synthetic USD 107.25 invoice. Historical deployed Beta acceptance is separately documented. |
| Gemini Advisor and Reviewer | **B — hosted staging proof reviewed:** a bounded paired run is recorded. Later public activation is recorded and the site displays “Live · limited evaluation”; fresh authenticated public inference remains **E — unverified in this audit**. No inference was invoked. |
| Browser-local file checks | **A — public entry observed; C — implementation evidence:** supported file validation stays in the browser. Hosted customer-file ingestion and real provider writes are not established. |
| Broader connectors and production adoption | **D — planned:** no production customer, live-provider migration or measured business benefit is claimed. |

[Claim-to-evidence matrix, source revisions and limits](docs/showcase/EVIDENCE.md).
GitHub main is not a deployment ledger: the pushed Academy branch and serving experience are
newer than this main-branch baseline; the separate V2 Phase 1 PR remains a draft.

## Agentic AI and human control

**Rules verify. AI predicts. GenAI reasons. Agents orchestrate and act. Humans govern consequential decisions.**
This responsibility model does not claim that every specialist uses a live model or that predictive accuracy is established.

Deterministic stage agents coordinate discovery, assessment, planning, mapping, migration,
resolution, reconciliation, configuration and onboarding. They advance only through allowed
states and approved intents. Financial checks are tools; generated explanations cannot replace them.

| Responsibility | Authority and boundary |
| --- | --- |
| **Advisor** | Explains allowed evidence, uncertainty and possible next steps. Cannot approve, execute a migration, reconcile, retry or post an invoice. |
| **Independent Reviewer** | Uses a separate role, context and output contract to challenge evidence and recommendations. Independence means separate reasoning and validation; later paired implementations may inspect a proposal, so “never sees Advisor output” is not a universal claim. |
| **Evidence retrieval** | Bounded, read-only evidence projections with attributable references. Missing evidence stays unknown; invalid or unavailable model output becomes an explicitly labelled fallback. No general web-retrieval or raw-upload-to-model claim. |
| **Human approver** | Retains authority over consequential mappings, plans, remediations, sensitive settings and the exact first invoice. Advice is not consent. |
| **Deterministic controls** | Enforce owner isolation, current approvals, exact totals, checkpoints, audit history and idempotent posting. A failed check blocks progress. |

[Agent architecture](docs/architecture/beta-v1-agent-architecture.md) ·
[Canonical workflows](docs/architecture/AGENT_WORKFLOWS.md) ·
[AI / Agent Constitution](docs/AI_AGENT_CONSTITUTION.md) · [Trust controls](docs/TRUST.md).

**Cost, isolation and safe failure.** The bounded public-source harness limits each role to two
model calls, disables transport retries and caps output; that historical harness is not a current
public quota promise. Later hosted evaluation adds admission, reservation and kill-switch controls.
No model run or cloud change is required to explore this portfolio. Missing permission, invalid
output or unavailable advice must leave the deterministic workflow authoritative. Rollback is a
separate operator-controlled release action; this documentation does not activate or roll back services.
[Bounded run and limits](docs/reviews/live-gemini-l1-16e31e9.md) ·
[Security threat model](docs/security/THREAT_MODEL.md).

## Architecture and technology

| Layer | Implementation and purpose |
| --- | --- |
| Experience | Next.js, React and TypeScript provide the guided journey and evidence review. |
| API and workflow | Python, FastAPI and typed contracts coordinate deterministic agents and tools. |
| Financial state | PostgreSQL / Cloud SQL stores owner-scoped snapshots; exact arithmetic and synthetic adapters support reconciliation. |
| Identity and hosting | Firebase identity and Hosting front the Google Cloud runtime; a server-side proxy reaches the protected API. |
| Optional reasoning | Google ADK and Gemini on Vertex AI provide bounded advisory reasoning; availability depends on evaluation controls. |
| Quality | pytest, Vitest, offline contracts, PostgreSQL isolation checks and image security gates provide scoped evidence. |

Built on Google Cloud and with Google Gemini; the product remains **independent and provider-neutral**.
Managed Agent Engine, production connectors and broader analytics/retrieval are future directions.
[Runtime design](docs/architecture/google-native-runtime.md) ·
[Solution architecture and technology showcase](docs/showcase/README.md#06-solution-architecture).

## Product Showcase

[Explore all eight artifacts](docs/showcase/README.md): end-to-end process, use cases,
multi-agent swimlane, proposed wireframes, genuine prototype screenshots, solution architecture,
technology stack and future roadmap. Each has a preview, editable source, user benefit and
agentic AI/platform product-management context.

Original 18 October design exports remain dated evidence. Their embedded “live Gemini pending”
labels describe that baseline; the [current status matrix](docs/showcase/EVIDENCE.md) governs later claims.
Conceptual wireframes are explicitly separated from genuine screenshots.

## Video Academy

[![Actual public Video Academy with lesson collections and English-caption labels](docs/showcase/assets/academy-public-20261024.jpg)](https://movebooks-si.web.app/learn?tab=videos)

**Nine published guides, four collections, English captions.** Start with the overview, then use
phase-specific lessons at the point of decision. [Full module inventory and media verification](docs/video-academy/README.md).
Learning leaves migration progress unchanged.

## Evaluation and release evidence

| Evidence | Result and scope |
| --- | --- |
| [Synthetic end-to-end journey](docs/submission/final-experience/evidence/journey-fa13e9e/README.md) | 21/21 local UI/API checks; synthetic invoice USD 100.00 + USD 7.25 tax = USD 107.25; recovery and migration switching included. |
| [Offline Advisor/Reviewer evaluation](docs/submission/final-experience/evidence/agents/offline-agent-eval.json) | 23/23 scripted scenarios; grounding, authority, injection and disagreement boundaries. Zero real-model calls; not a model-quality benchmark. |
| [18 October bounded live run](docs/reviews/live-gemini-l1-16e31e9.md) | Owner-reported 14/14 harness checks for one synthetic case, four calls. Historical evidence, not proof of public activation or statistical accuracy. |
| [V1 final acceptance](docs/reviews/v1-final-acceptance.md) | Historical bounded synthetic acceptance; not a permanent-green status. |
| [24 October public/media verification](docs/video-academy/manifest.json) | Nine accessible videos/caption sets; measured metadata and approved caption hashes; no inference. |

[Submission evidence](docs/submission/README.md) · [Judge FAQ](docs/submission/JUDGE-FAQ.md) ·
[Final submission deck](docs/submission/assets/movebooks-final-deck.pdf) ·
[V1.0 GitHub Release](https://github.com/JEMathew/movers-and-ledgers/releases/tag/v1.0.0) ·
[Evaluation principles](docs/EVALUATION_PRINCIPLES.md) · [Product scorecard](docs/PRODUCT_SCORECARD.md).

The North Star is the percentage of eligible journeys reaching Verified First Productive Use.
[Metrics](docs/METRICS_FRAMEWORK.md) are defined contracts, not measured production results.
[Agentic AI rubric](docs/rubrics/AGENTIC_AI_RUBRIC.md) ·
[Migration rubric](docs/rubrics/MIGRATION_ONBOARDING_RUBRIC.md) · [Release readiness](docs/RELEASE_READINESS.md).

## Limits and future direction

Synthetic data and targets bound the current product. Public model access is restricted and may
be unavailable; this audit did not retest authenticated isolation, execute a new migration or
invoke Gemini. Real provider connectors, hosted ingestion hardening, backup/restore assurance,
production observability, broader model evaluation and customer outcome measurement remain
separate gates. [Proposed roadmap](docs/showcase/README.md#08-future-development-roadmap).

Play's learning experiments, local feedback drafts and historical Product Vision material remain
in the repository. Their existence does not establish that every experience is exposed in the current
navigation. [Surface boundaries](docs/architecture/public-product-surfaces.md).

## Developer setup

Prerequisites: Node.js 22+, Python 3.11+ (the Makefile defaults to `python3.11`); Docker is optional.

```bash
make setup
make dev         # API: http://localhost:8000/docs; web: http://localhost:3000
```

`make dev-api` and `make dev-web` run separately; both must be running. The web stays on port 3000
and the local API permits `localhost:3000` or `127.0.0.1:3000`. Alternatively use
`docker compose up --build`. Default local development is deterministic and needs no Google
credentials or paid cloud resources. Local demo identity is not public-Beta authentication.

```bash
make test
make lint
python3 scripts/repository_checks.py
```

[Contributing](CONTRIBUTING.md) · [Documentation index](docs/README.md) ·
[Deployment history](docs/deployment/public-beta.md) ·
[Release remediation](docs/reviews/demo-loader-release-remediation.md) ·
[Mapping reconsideration](docs/reviews/mapping-reconsideration.md).

### Reference Use & Intellectual Property

**Reference implementation:** This public repository is provided primarily for demonstration, evaluation, learning, and portfolio purposes. MoveBooks AI and Movers & Ledgers remain independent product concepts. Public access to the repository does not by itself grant rights to commercially reproduce, rebrand, resell, or redistribute the product beyond the permissions explicitly provided in the repository license.

MoveBooks AI is an independent product concept developed by **Movers & Ledgers**.

This repository is made publicly available primarily for **demonstration, learning, portfolio, evaluation, and reference purposes**.

The repository may be reviewed to understand the product concepts, architecture, agentic AI patterns, migration workflows, user experience, evaluation approaches, and engineering practices used in MoveBooks AI.

Public availability of this repository should not be interpreted as a waiver of intellectual property rights or as authorization to commercially reproduce, redistribute, rebrand, resell, or create substantially derivative commercial products from MoveBooks AI unless explicitly permitted by the applicable repository license.

Product names, branding, product concepts, proprietary migration intelligence, domain-specific knowledge assets, designs, documentation, datasets, and other intellectual property associated with **Movers & Ledgers** and **MoveBooks AI**remain subject to their respective intellectual property rights.

MoveBooks AI is an independent synthetic product concept and does not represent, reproduce, or claim to describe the internal products, systems, APIs, architectures, roadmaps, or implementation details of Intuit, QuickBooks, or any other accounting software provider.

Where third-party technologies, frameworks, libraries, trademarks, or services are referenced, those remain the property of their respective owners.

For permitted use of the source code, refer to the repository's `LICENSE` file.
