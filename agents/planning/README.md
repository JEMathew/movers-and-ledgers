# Planning agent

Consumes the readiness assessment and produces a versioned, structured plan with phases,
dependencies, prerequisites, blockers, risks, checkpoints, customer actions, approval gates,
relative complexity, and evidence references. It cannot execute a migration or silently clear an
assessment finding.

Dependency checks, sequence validation, and phase completeness are deterministic capabilities rather
than separate agents. The agent contract is structured for a later Google ADK adapter without making
model availability a prerequisite for planning.
