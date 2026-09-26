# Assessment agent

The Assessment Agent applies `discover-assess-readiness-v1` to the Discovery Agent's structured
findings. Any deterministic blocker produces `BLOCKED`; warnings without blockers produce
`NEEDS ATTENTION`; an issue-free result produces `READY`.

The result includes counts, ready and unresolved areas, target assumptions, decision basis, and
recommended next actions. It intentionally omits a synthetic numeric confidence score: readiness is
a policy decision over evidence, not an AI prediction. Consequential migration changes remain future
human-governed work.
