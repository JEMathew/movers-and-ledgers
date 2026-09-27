# MoveBooks AI documentation

Use this index to find the durable decision records without turning the repository README into a handbook.

## Product and experience

- [Product constitution](PRODUCT_CONSTITUTION.md) — mission, users, product family, canonical journey, trust model, boundaries, and positioning.
- [UX principles](UX_PRINCIPLES.md) — shared visual language, comprehension, accessibility, feedback, and motion.
- [Migration principles](MIGRATION_PRINCIPLES.md) — lifecycle invariants, lineage, transformation, validation, recovery, and completion.
- [Feedback and support principles](FEEDBACK_SUPPORT_PRINCIPLES.md) — future collection surfaces and the closed learning loop.

## AI, trust, and evaluation

- [AI and agent constitution](AI_AGENT_CONSTITUTION.md) — responsibility boundaries, evidence, approvals, safe stops, and prohibited actions.
- [Trust and agent operations](TRUST.md) — trace and control baseline.
- [Evaluation principles](EVALUATION_PRINCIPLES.md) — evaluation layers, quality dimensions, and evidence discipline.
- [Security threat model](security/THREAT_MODEL.md) — security and privacy baseline.

## Measurement and release governance

- [Product scorecard](PRODUCT_SCORECARD.md) — balanced dimensions and assessment record.
- [Metrics framework](METRICS_FRAMEWORK.md) — proposed North Star, hierarchy, metric contracts, and guardrails.
- [Release readiness](RELEASE_READINESS.md) — GREEN/AMBER/RED policy across 17 required areas.
- [Reviewer rubrics](reviewers/REVIEW_RUBRICS.md) — reviewer lenses, finding contract, severity, and internal build rubrics.
- [Product Management Rubric](rubrics/PRODUCT_MANAGEMENT_RUBRIC.md) — product intent, outcome, scope, trust, measurement, and coherence criteria.
- [Agentic AI Rubric](rubrics/AGENTIC_AI_RUBRIC.md) — agent boundaries, orchestration, authority, evidence, governance, resilience, and evaluation criteria.
- [Migration & Onboarding Rubric](rubrics/MIGRATION_ONBOARDING_RUBRIC.md) — migration correctness, approval, lineage, recovery, onboarding, and FPU continuity criteria.
- [Review template](reviews/TEMPLATE.md) — reusable consolidated review record.
- [Advisory reviewer prompts](../reviewers/README.md) — lightweight role definitions; no reviewer runtime.

## Engineering references

- [Architecture](architecture/README.md)
- [Discover → Assess architecture](architecture/discover-assess.md)
- [Plan → Map → Approve architecture](architecture/plan-map-approve.md)
- [Design-system review](reviews/design-system-theme.md)
- [Discover → Assess review](reviews/discover-assess.md)
- [Plan → Map → Approve review](reviews/plan-map-approve.md)
- [Contributing](../CONTRIBUTING.md)

## Interpretation notes

- The product constitution is authoritative for the full canonical journey. Shorter stage lists in current UI examples are illustrative subsets, not a conflicting lifecycle.
- The architecture reference now makes the governed transformation stage explicit between the canonical model and target adapter; this clarifies the existing ports-and-adapters decision rather than introducing a new runtime layer.
- The current scaffold has no production metrics instrumentation, support workflow, or reviewer runtime. These documents define governance and future contracts without claiming those capabilities are implemented.
