from agents.knowledge import KnowledgeAgent
from agents.model_policy import route_for
from tools.onboarding.checks import verify_onboarding_prerequisites


class OnboardingAgent:
    name = "onboarding_agent"
    route = route_for("onboarding_guidance")
    active_provider = "deterministic-fallback"
    allowed_tools = ("verify_onboarding_prerequisites", "record_onboarding_event")

    def run(self, session):
        tasks = verify_onboarding_prerequisites(session)
        for task in tasks:
            task.evidence.append(KnowledgeAgent().lookup_activation(task.id))
        return tasks
