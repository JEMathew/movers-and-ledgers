"""Metadata registry for the agent team. Implementations are added incrementally."""

from agents.contracts import AgentRole, LifecycleStage

AGENT_RESPONSIBILITIES = {
    AgentRole.ORCHESTRATOR: "Select the next permitted action and preserve workflow state.",
    AgentRole.DISCOVERY: "Inventory source data and produce evidence-backed profiles.",
    AgentRole.ASSESSMENT: "Assess readiness, compatibility, risk, and gaps.",
    AgentRole.PLANNING: "Build a sequenced, reversible migration plan.",
    AgentRole.MAPPING: "Recommend semantic mappings for human approval.",
    AgentRole.MIGRATION: "Invoke deterministic transformation and load tools.",
    AgentRole.RESOLUTION: "Triage exceptions and propose remediations.",
    AgentRole.VALIDATION: "Request and explain deterministic validation results.",
    AgentRole.CONFIGURATION: "Propose target configuration under policy controls.",
    AgentRole.ONBOARDING: "Guide users to first productive use.",
}

STAGE_OWNER = {
    LifecycleStage.DISCOVER: AgentRole.DISCOVERY,
    LifecycleStage.ASSESS: AgentRole.ASSESSMENT,
    LifecycleStage.PLAN: AgentRole.PLANNING,
    LifecycleStage.MAP_APPROVE: AgentRole.MAPPING,
    LifecycleStage.MIGRATE: AgentRole.MIGRATION,
    LifecycleStage.RESOLVE: AgentRole.RESOLUTION,
    LifecycleStage.VALIDATE: AgentRole.VALIDATION,
    LifecycleStage.CONFIGURE: AgentRole.CONFIGURATION,
    LifecycleStage.ONBOARD: AgentRole.ONBOARDING,
}

