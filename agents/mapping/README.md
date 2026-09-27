# Mapping agent

Coordinates bounded Account, Tax, Entity, and Configuration specialists. Each specialist receives a
narrow input, uses declared versioned knowledge, and returns structured recommendations containing
confidence, uncertainty, risk, evidence, alternatives, and escalation state. The parent agent submits
all proposals to deterministic compatibility, evidence, target-field, account-type, and approval
policy tools.

The current implementation uses a deterministic recommendation provider and works without Gemini.
`MappingRecommendationProvider` is the future GenAI seam. No specialist can approve its own proposal,
override a failed control, mutate source data, or write to a target.
