// The operational journey a signed-in customer moves through. The five marketing phases
// (Understand, Prepare, Move, Verify, Start) stay in explanatory content only.
export const journeySteps = [
  { label: "Assess", route: "/assess", summary: "Check whether your books are ready to migrate." },
  { label: "Plan", route: "/plan-map-approve", summary: "Set the scope and order of the move." },
  { label: "Map", route: "/plan-map-approve", summary: "Confirm where each record goes in your new books." },
  { label: "Approve", route: "/plan-map-approve", summary: "Approve the plan. Nothing moves before you do." },
  { label: "Migrate", route: "/migrate-resolve", summary: "Move your records in safe, checkpointed batches." },
  { label: "Resolve", route: "/migrate-resolve", summary: "Review anything the migration paused on." },
  { label: "Validate", route: "/validate-configure", summary: "Confirm every total matches your source books." },
  { label: "Set Up", route: "/validate-configure", summary: "Review the settings for your new books." },
  { label: "First Use", route: "/onboard-fpu", summary: "Complete and verify your first real task." },
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

/** A stage page's own position, never ahead of the migration's authoritative status.
 *  An unrecognised status gives null: no progress is assumed. */
export function stepWithin(status: string, stageStep: number): number | null {
  const step = journeyStepFor(status);
  return step === null ? null : Math.min(step, stageStep);
}

/** How the current step reads when it is not simply in progress. Every step is part of the
 *  current product; a step that has not begun is "Not Started", never a future release. */
export type CurrentStepLabel = "Current" | "Needs Attention" | "Blocked";
export function journeyCurrentLabelFor(status: string): CurrentStepLabel {
  if (["MIGRATION_BLOCKED", "VALIDATION_BLOCKED", "ONBOARDING_BLOCKED", "FIRST_PRODUCTIVE_USE_BLOCKED"].includes(status)) return "Blocked";
  if (["MIGRATION_PAUSED", "RESOLVING", "RETRY_PENDING", "CONFIGURATION_REVIEW_REQUIRED"].includes(status)) return "Needs Attention";
  return "Current";
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
  /** Mappings still awaiting review. Null or absent means unknown, which is never read as zero. */
  mappingIssues?: number | null;
};
/** Pending mapping decisions remain at Map, even though the backend accepts decisions in
 * AWAITING_APPROVAL. Map counts as complete only on authoritative evidence that none are pending.
 * The server status still caps all progress. */
export function journeyCurrentFor(state: JourneyState): number | null {
  const step = journeyStepFor(state.status);
  return state.status === "AWAITING_APPROVAL" && state.mappingIssues !== 0 ? 2 : step;
}
export type NextAction = { heading: string; detail: string; label: string; href: string };

const sampleEntry = "/assess?sample=harbor-light-migrate-demo";

/** The single dominant next action for a journey state. It is a navigation hint; every
 *  destination still enforces ownership, approvals and deterministic checks. */
export function nextActionFor(state?: JourneyState): NextAction {
  if (!state) return { heading: "See If Your Books Are Ready to Migrate", detail: "We'll review your accounting data and identify anything that could block or complicate the migration.", label: "Check If My Books Are Ready to Migrate", href: sampleEntry };
  const at = (route: string) => withSession(route, state.id);
  const { status, readinessIssues: ready, migrationIssues: migrate, verificationIssues: verify } = state;
  switch (status) {
    case "CREATED": case "DISCOVERED":
      return { heading: "Finish Checking If Your Books Are Ready", detail: "Finish the check to see what can move, what needs attention, and what to address before migration.", label: "Check If My Books Are Ready to Migrate", href: at("/assess") };
    case "ASSESSED":
      return ready
        // Readiness blockers are source-data problems this product cannot repair, so the action is a review.
        ? { heading: "Review Readiness Blockers", detail: "Planning keeps each blocker visible beside your plan. Migration stays blocked until the source data is corrected; nothing here can waive a blocker.", label: `Review ${count(ready, "Readiness Issue")}`, href: at("/plan-map-approve") }
        : { heading: "Plan Your Migration", detail: "Your readiness check is complete. Create the plan and review how your records map.", label: "Create My Migration Plan", href: at("/plan-map-approve") };
    case "PLANNED": case "MAPPING":
      return { heading: "Review Your Mappings", detail: "Check where each record goes. Approve, change or reject each recommendation.", label: "Review Mappings", href: at("/plan-map-approve") };
    case "AWAITING_APPROVAL":
      if (state.mappingIssues !== 0) return { heading: "Review Your Mappings", detail: "Review every source-to-destination recommendation before approving the complete plan.", label: state.mappingIssues ? `Review ${count(state.mappingIssues, "Mapping")}` : "Review Mappings", href: at("/plan-map-approve") };
      if (ready) return { heading: "Review Readiness Blockers", detail: "Mapping review cannot waive source-data blockers. Migration remains stopped.", label: `Review ${count(ready, "Readiness Issue")}`, href: at("/plan-map-approve") };
      return { heading: "Approve Your Migration Plan", detail: "Nothing moves until you approve. Review the evidence for each decision.", label: "Approve Migration Plan", href: at("/plan-map-approve") };
    case "APPROVED": case "MIGRATION_READY":
      return { heading: "Start Your Migration", detail: "Your plan is approved. The migration runs in safe, checkpointed batches.", label: "Start Migration", href: at("/migrate-resolve") };
    case "MIGRATING":
      return { heading: "Migration in Progress", detail: "Batches are moving. Follow progress and step in if anything pauses.", label: "Follow Migration Progress", href: at("/migrate-resolve") };
    case "MIGRATION_PAUSED": case "RESOLVING": case "RETRY_PENDING": case "MIGRATION_BLOCKED":
      return { heading: "Review Migration Issues", detail: "The migration paused safely. Completed work is kept. Review each proposed fix before it runs.", label: migrate ? `Review ${count(migrate, "Migration Issue")}` : "Review Migration Issues", href: at("/migrate-resolve") };
    case "MIGRATION_COMPLETE": case "VALIDATING":
      return { heading: "Verify Your Books", detail: "Compare your migrated books with the source. Every total must match.", label: "Verify My Books", href: at("/validate-configure") };
    case "VALIDATION_BLOCKED":
      return { heading: "Review Verification Issues", detail: "A check did not match. Review the difference and any permitted repair, then verify again.", label: verify ? `Review ${count(verify, "Verification Issue")}` : "Verify My Books", href: at("/validate-configure") };
    case "VALIDATED": case "CONFIGURING": case "CONFIGURATION_REVIEW_REQUIRED":
      return { heading: "Complete Your Setup", detail: "Your books match. Review the settings that shape your new environment.", label: "Complete Setup", href: at("/validate-configure") };
    case "CONFIGURED": case "ONBOARDING": case "ONBOARDING_BLOCKED":
      return { heading: "Complete Your Setup", detail: "Finish the essentials so your team can start working.", label: "Complete Setup", href: at("/onboard-fpu") };
    case "READY_FOR_FIRST_PRODUCTIVE_USE": case "FIRST_PRODUCTIVE_USE_IN_PROGRESS": case "FIRST_PRODUCTIVE_USE_BLOCKED":
      return { heading: "Start Your First Task", detail: "Create and verify your first customer invoice in the new environment.", label: "Start My First Task", href: at("/onboard-fpu") };
    case "VERIFIED_FIRST_PRODUCTIVE_USE":
      return { heading: "Business Ready · Verified", detail: "Your first productive task is verified in the synthetic environment.", label: "Review Verified Evidence", href: at("/trust") };
    default:
      return { heading: "See If Your Books Are Ready to Migrate", detail: "This migration's status is not recognised, so no progress is assumed.", label: "Check If My Books Are Ready to Migrate", href: sampleEntry };
  }
}
