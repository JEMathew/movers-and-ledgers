# Product Management Rubric

## Purpose

The Product Reviewer uses this canonical rubric to assess whether a change solves a meaningful
customer problem, fits the MoveBooks AI journey, remains truthful about scope, and advances verified
customer value without replacing it with activity or vanity metrics.

Every criterion must be reported with: **Criterion**, **What good looks like**, **Why it matters to
MoveBooks AI**, **Why it matters to the end user**, **Failure mode if missing**, **Evidence / metric**,
and a **0–4 scoring scale**. Scores are criterion-level evidence summaries, not an overall score.

## Criteria

| Criterion | What good looks like | Why it matters to MoveBooks AI | Why it matters to the end user | Failure mode if missing | Evidence / metric | 0–4 scoring scale |
| --- | --- | --- | --- | --- | --- | --- |
| Problem significance and target user | Names the user, consequential job, current pain, decision, and bounded outcome. | Keeps investment focused on difficult migration work rather than generic AI theatre. | The product addresses a real migration decision instead of adding workflow burden. | A polished feature solves an unvalidated or low-value problem. | Research evidence; problem statement; affected journey; support themes; task success. | **0:** absent; **1:** generic claim; **2:** plausible but weakly evidenced; **3:** clear and repository-evidenced; **4:** clear, evidenced, and validated with representative users/outcomes. |
| Canonical journey and outcome alignment | Advances a declared stage toward verified First Productive Use without skipping gates or claiming later outcomes. | Preserves one coherent product rather than disconnected demos. | Users understand progress and do not mistake preparation for completion. | Local activity is optimized while migration completion or FPU becomes less likely. | Journey state; transition tests; completion contract; downstream handoff evidence. | **0:** conflicts with journey; **1:** ambiguous stage; **2:** partial fit; **3:** coherent stage/handoff; **4:** coherent and validated downstream contribution. |
| Scope, non-goals, and beta boundary | In-scope behavior, non-goals, synthetic/production boundary, and credible blast radius are explicit. | Prevents accidental product and operational commitments. | Users are not misled about provider support, writes, readiness, or production safety. | Demo behavior is interpreted as a production capability or financial guarantee. | Architecture boundary; release notes; UI copy; out-of-scope list; no-write checks. | **0:** misleading; **1:** material ambiguity; **2:** boundary exists but leaks; **3:** explicit and consistently enforced; **4:** enforced and externally validated under misuse scenarios. |
| User value and actionability | Explains what happened, why it matters, user responsibility, risk, and next action at the right moment. | Converts analysis into governed progress through the migration. | Users can confidently make or defer a consequential decision. | Evidence is technically present but users cannot act on it. | Usability evidence; decision completion; error recovery; comprehension; abandonment. | **0:** unusable; **1:** major ambiguity; **2:** actionable with friction; **3:** clear and tested in-product; **4:** validated improvement in representative task outcomes. |
| Progressive trust and decision ownership | Automation expands only with evidence, reversibility, and explicit human ownership of consequential decisions. | Trust is a core differentiator for financial migration. | Users retain control over accounting treatment and can inspect evidence before acting. | The system silently progresses, self-approves, or makes unexplained financial choices. | Approval coverage; override/rejection paths; evidence access; audit attribution; safe stops. | **0:** uncontrolled; **1:** cosmetic approval; **2:** partial control; **3:** enforced, attributable controls; **4:** controls validated under adversarial and recovery scenarios. |
| Metrics and evidence discipline | Defines expected outcome and guardrail metrics with valid denominators and never invents results. | Prevents product activity, model quality, or autonomy from masquerading as customer success. | Customer outcomes and harms remain visible rather than hidden by engagement metrics. | Teams optimize acceptance or automation while correctness, burden, or FPU worsens. | Metric contracts; event taxonomy; owners; baselines; segments; data-quality controls. | **0:** fabricated/misleading; **1:** vanity-only; **2:** event intent without complete contracts; **3:** complete contracts and instrumentation; **4:** decision-quality evidence from governed production measurement. |
| Product coherence, business fit, and truthful demo | Fits the product family, offers credible differentiation, controls cost/complexity, and demonstrates value without hidden intervention. | Sustains an independent, provider-neutral product rather than a one-off feature. | Users receive a consistent experience and accurate representation of capability. | Duplication, unjustified complexity, or demo-only shortcuts undermine trust and maintainability. | Product-family consistency; architecture reuse; dependency/cost impact; demo runbook; rollback. | **0:** contradictory or deceptive; **1:** fragmented; **2:** plausible but costly/unclear; **3:** coherent and credibly demonstrated; **4:** coherent with validated strategic/customer value. |

## Interpretation

- Score only the declared scope and record evidence gaps separately.
- A `4` requires stronger evidence than implementation intent or author review alone.
- Never average criteria into a vanity score. Report each score with its evidence, gap, severity, and
  remediation.
- Use P0–P3 from [Reviewer Rubrics](../reviewers/REVIEW_RUBRICS.md); a low score and severity are
  related but not interchangeable.
