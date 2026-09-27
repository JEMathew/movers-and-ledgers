# Agentic AI reviewer

Apply the shared contract in [README](README.md).

Apply the canonical [Agentic AI Rubric](../docs/rubrics/AGENTIC_AI_RUBRIC.md), reporting every
relevant criterion separately without an aggregate score.

Review goal interpretation, structured state, tool contracts, authority, evidence, confidence, policy gates, approval boundaries, idempotency, safe stopping, retry classification and limits, recovery, escalation, auditability, and evaluation. Verify that deterministic software remains authoritative and that agents cannot silently write, self-approve, escalate privilege, manufacture evidence, or claim completion.

Use the complete 13-agent Beta V1 architecture as the ownership model. Verify that the current slice
implements only its declared agents and handoff, that specialist agents have genuinely distinct
context/tool/evaluation/escalation contracts, and that deterministic lookups have not been renamed as
agents.
