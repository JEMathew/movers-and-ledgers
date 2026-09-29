/** Explicit browser API surface. New backend routes are not exposed automatically. */
const id = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const session = `migration-sessions/${id}`;
const routes = {
  GET: [
    "sample-companies", "intake/template", session,
    `${session}/(discovery|findings|assessment|activity|plan|plan/status|mappings|intake-trust)`,
    `${session}/mappings/${id}/evidence`,
    `${session}/migration(/(progress|batches|failures|resolutions|target))?`,
    `${session}/(validation-configuration|validation|validation/checks|validation/discrepancies|configuration)`,
    `${session}/configuration/${id}/explanation`,
    `${session}/(onboarding|onboarding/blockers|fpu|fpu/readiness|fpu/verification)`,
    `${session}/reasoning/(planning|mapping|resolution|configuration|onboarding)`,
  ],
  POST: [
    "(migration-sessions|migration-demo-sessions|validation-demo-sessions|onboarding-demo-sessions)",
    `${session}/(discovery|assessment|plan|mappings|events)`,
    `${session}/mappings/${id}/(approve|reject|modify|reconsiderations)`,
    `${session}/mappings/${id}/reconsiderations/${id}/review`,
    `${session}/migration/(start|retry|resume)`,
    `${session}/migration/resolutions/${id}/decision`,
    `${session}/(validation|revalidation|validation/resolutions|configuration|configuration/apply)`,
    `${session}/validation/resolutions/${id}/approve`,
    `${session}/configuration/${id}/decision`,
    `${session}/(onboarding|onboarding/remediation|fpu/task|fpu/decision|fpu/execute|fpu/verify)`,
    `${session}/onboarding/tasks/[a-z][a-z0-9_-]{0,63}/decision`,
    `${session}/reasoning/(planning|mapping|resolution|configuration|onboarding)`,
  ],
};

export function allowedRoute(method: string, path: string) {
  const patterns = routes[method as keyof typeof routes];
  return patterns?.some(pattern => new RegExp(`^/v1/${pattern}$`).test(path)) ?? false;
}

export function cloudIntake(path: string) {
  return path !== "/v1/intake/template" && /^\/v1\/intake(?:\/|$)/.test(path);
}
