// The operational journey a signed-in customer moves through. The five marketing phases
// (Understand, Prepare, Move, Verify, Start) stay in explanatory content only.
export const journeySteps = [
  { label: "Assess", route: "/assess" },
  { label: "Plan", route: "/plan-map-approve" },
  { label: "Map", route: "/plan-map-approve" },
  { label: "Approve", route: "/plan-map-approve" },
  { label: "Migrate", route: "/migrate-resolve" },
  { label: "Resolve", route: "/migrate-resolve" },
  { label: "Validate", route: "/validate-configure" },
  { label: "Set up", route: "/validate-configure" },
  { label: "First use", route: "/onboard-fpu" },
] as const;
/** Index meaning every step is complete. */
export const JOURNEY_COMPLETE = journeySteps.length;

const stepByStatus: Record<string, number> = {
  CREATED: 0, DISCOVERED: 0,
  ASSESSED: 1, PLANNED: 2, MAPPING: 2, AWAITING_APPROVAL: 3,
  APPROVED: 4, MIGRATION_READY: 4, MIGRATING: 4,
  MIGRATION_PAUSED: 5, RESOLVING: 5, RETRY_PENDING: 5, MIGRATION_BLOCKED: 5,
  MIGRATION_COMPLETE: 6, VALIDATING: 6, VALIDATION_BLOCKED: 6,
  VALIDATED: 7, CONFIGURING: 7, CONFIGURATION_REVIEW_REQUIRED: 7, CONFIGURED: 7, ONBOARDING: 7, ONBOARDING_BLOCKED: 7,
  READY_FOR_FIRST_PRODUCTIVE_USE: 8, FIRST_PRODUCTIVE_USE_IN_PROGRESS: 8, FIRST_PRODUCTIVE_USE_BLOCKED: 8,
  VERIFIED_FIRST_PRODUCTIVE_USE: JOURNEY_COMPLETE,
};

/** Current step for an authoritative workflow status, or null when the status is unknown. */
export function journeyStepFor(status: string): number | null {
  return Object.prototype.hasOwnProperty.call(stepByStatus, status) ? stepByStatus[status] : null;
}

export type HeldStep = { index: number; label: string };
/** A step behind the current one that is not finished: a paused migration is never shown as completed. */
export function journeyHeldFor(status: string): HeldStep | undefined {
  return ["MIGRATION_PAUSED", "RESOLVING", "RETRY_PENDING", "MIGRATION_BLOCKED"].includes(status) ? { index: 4, label: "Paused" } : undefined;
}

const SESSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isSessionReference = (value: unknown): value is string => typeof value === "string" && SESSION.test(value);
export function withSession(route: string, session?: string) {
  return session ? `${route}?session=${encodeURIComponent(session)}` : route;
}
const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export type JourneyState = {
  id: string; status: string;
  readinessIssues: number; migrationIssues: number; verificationIssues: number;
};
export type NextAction = { heading: string; detail: string; label: string; href: string };

const sampleEntry = "/assess?sample=harbor-light-migrate-demo";

/** The single dominant next action for a journey state. It is a navigation hint; every
 *  destination still enforces ownership, approvals and deterministic checks. */
export function nextActionFor(state?: JourneyState): NextAction {
  if (!state) return { heading: "Start with a readiness check", detail: "Check a sample business before anything moves. You approve every consequential step.", label: "Check my readiness", href: sampleEntry };
  const at = (route: string) => withSession(route, state.id);
  const { status, readinessIssues: ready, migrationIssues: migrate, verificationIssues: verify } = state;
  switch (status) {
    case "CREATED": case "DISCOVERED":
      return { heading: "Check your readiness", detail: "Finish the readiness check to see what can move and what needs attention.", label: "Check my readiness", href: at("/assess") };
    case "ASSESSED":
      return ready
        // Readiness blockers are source-data problems this product cannot repair, so the action is a review.
        ? { heading: "Review readiness blockers", detail: "Planning keeps each blocker visible beside your plan. Migration stays blocked until the source data is corrected; nothing here can waive a blocker.", label: `Review ${count(ready, "readiness issue")}`, href: at("/plan-map-approve") }
        : { heading: "Plan your migration", detail: "Your readiness check is complete. Create the plan and review how your records map.", label: "Create my migration plan", href: at("/plan-map-approve") };
    case "PLANNED": case "MAPPING":
      return { heading: "Review your mappings", detail: "Check where each record goes. Approve, change or reject each recommendation.", label: "Review mappings", href: at("/plan-map-approve") };
    case "AWAITING_APPROVAL":
      return { heading: "Approve your migration plan", detail: "Nothing moves until you approve. Review the evidence for each decision.", label: "Approve migration plan", href: at("/plan-map-approve") };
    case "APPROVED": case "MIGRATION_READY":
      return { heading: "Start your migration", detail: "Your plan is approved. The migration runs in safe, checkpointed batches.", label: "Start migration", href: at("/migrate-resolve") };
    case "MIGRATING":
      return { heading: "Migration in progress", detail: "Batches are moving. Follow progress and step in if anything pauses.", label: "Follow migration progress", href: at("/migrate-resolve") };
    case "MIGRATION_PAUSED": case "RESOLVING": case "RETRY_PENDING": case "MIGRATION_BLOCKED":
      return { heading: "Resolve migration issues", detail: "The migration paused safely. Completed work is kept. Review each proposed fix before it runs.", label: migrate ? `Resolve ${count(migrate, "issue")}` : "Resolve migration issues", href: at("/migrate-resolve") };
    case "MIGRATION_COMPLETE": case "VALIDATING":
      return { heading: "Verify your books", detail: "Compare your migrated books with the source. Every total must match.", label: "Verify my books", href: at("/validate-configure") };
    case "VALIDATION_BLOCKED":
      return { heading: "Resolve verification issues", detail: "A check did not match. Review the difference and the permitted repair, then verify again.", label: verify ? `Resolve ${count(verify, "verification issue")}` : "Verify my books", href: at("/validate-configure") };
    case "VALIDATED": case "CONFIGURING": case "CONFIGURATION_REVIEW_REQUIRED":
      return { heading: "Complete your setup", detail: "Your books match. Review the settings that shape your new environment.", label: "Complete setup", href: at("/validate-configure") };
    case "CONFIGURED": case "ONBOARDING": case "ONBOARDING_BLOCKED":
      return { heading: "Complete your setup", detail: "Finish the essentials so your team can start working.", label: "Complete setup", href: at("/onboard-fpu") };
    case "READY_FOR_FIRST_PRODUCTIVE_USE": case "FIRST_PRODUCTIVE_USE_IN_PROGRESS": case "FIRST_PRODUCTIVE_USE_BLOCKED":
      return { heading: "Start your first task", detail: "Create and verify your first customer invoice in the new environment.", label: "Start my first task", href: at("/onboard-fpu") };
    case "VERIFIED_FIRST_PRODUCTIVE_USE":
      return { heading: "Business Ready · Verified", detail: "Your first productive task is verified in the synthetic environment.", label: "Review verified evidence", href: at("/trust") };
    default:
      return { heading: "Start with a readiness check", detail: "This migration's status is not recognised, so no progress is assumed.", label: "Check my readiness", href: sampleEntry };
  }
}
