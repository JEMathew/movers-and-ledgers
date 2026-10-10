import { nextActionFor, withSession, type NextAction } from "./journey";
import { phaseFor, type SessionView } from "../public-surfaces/session";

/** Navigation only. The destination re-reads ownership and all financial gates. */
export function memberHomeAction(view?: SessionView): NextAction {
  if (!view) return { heading: "Start with a synthetic business", detail: "No migration is selected. Open the sample, then explicitly start its readiness assessment.", label: "Start a sample migration", href: "/assess?sample=harbor-light-migrate-demo" };
  const action = nextActionFor(view);
  const at = (route: string) => withSession(route, view.id);
  switch (view.status) {
    case "CREATED": case "DISCOVERED": return { ...action, label: "Finish readiness check" };
    case "PLANNED": case "MAPPING": return action;
    case "ASSESSED": return { ...action, heading: view.readinessIssues ? "Review readiness issues" : "Prepare your migration", label: view.readinessKnown && !view.readinessIssues ? "Prepare migration" : "Review readiness and plan" };
    case "AWAITING_APPROVAL": return { ...action, heading: view.mappingIssues === 0 && !view.readinessIssues ? "Review your migration plan" : action.heading, label: view.mappingIssues === 0 && !view.readinessIssues ? "Review plan" : action.label };
    case "APPROVED": case "MIGRATION_READY": return { heading: "Continue to the approved move", detail: "Plan approval is recorded. Opening Move does not start execution; review current evidence there first.", label: "Continue to Move", href: at("/migrate-resolve") };
    case "MIGRATING": return { ...action, label: "View migration progress" };
    case "MIGRATION_PAUSED": case "RESOLVING": return { heading: "Review the paused migration", detail: "Completed checkpoints are retained. Review the issue and any permitted remedy in Move.", label: "Review recovery", href: at("/migrate-resolve") };
    case "RETRY_PENDING": return { heading: "Continue recovery", detail: "Move checks the recorded remedy and retry eligibility before offering a retry. Completed batches stay intact.", label: "Continue recovery", href: at("/migrate-resolve") };
    case "MIGRATION_BLOCKED": return { heading: "Review the migration issue", detail: "Progress is blocked. Inspect the recorded issue and supported next steps; no retry or repair is assumed.", label: "Review migration issue", href: at("/migrate-resolve") };
    case "MIGRATION_COMPLETE": return { heading: "Verify the migrated books", detail: "Movement is complete. Exact financial checks, settings and onboarding still remain.", label: "Verify migrated books", href: at("/validate-configure") };
    case "VALIDATING": return { heading: "Review verification progress", detail: "Open the recorded checks. Verification has not yet been confirmed.", label: "View verification", href: at("/validate-configure") };
    case "VALIDATION_BLOCKED": return { ...action, heading: "Review the financial difference", label: "Review financial difference" };
    case "VALIDATED": case "CONFIGURING": case "CONFIGURATION_REVIEW_REQUIRED": return { ...action, heading: "Review your settings", label: "Review settings" };
    case "CONFIGURED": case "ONBOARDING": return { ...action, heading: "Finish onboarding", label: "Finish onboarding" };
    case "ONBOARDING_BLOCKED": return { ...action, heading: "Review the missing prerequisite", label: "Review prerequisite" };
    case "READY_FOR_FIRST_PRODUCTIVE_USE": return { ...action, heading: "Prepare your first synthetic task", label: "Prepare first task" };
    case "FIRST_PRODUCTIVE_USE_IN_PROGRESS": return { heading: "Continue your first task", detail: "Start reads the recorded contract and checkpoint. If posting is recorded, continue verification of that task.", label: "Continue first task", href: at("/onboard-fpu") };
    case "FIRST_PRODUCTIVE_USE_BLOCKED": return { ...action, heading: "Review the first-task issue", detail: "Start checks prerequisites, decisions and the recorded checkpoint before offering a permitted next step.", label: "Review first-task issue" };
    case "VERIFIED_FIRST_PRODUCTIVE_USE": return { ...action, label: "Review verified results", href: `/trust?view=evidence&session=${view.id}` };
    default: return { heading: "Read your current task", detail: "This status is unsupported. No progress or replacement is assumed.", label: "Read current task", href: at("/assess") };
  }
}

export function memberHomePhase(view: SessionView) {
  return view.status === "ASSESSED" ? 1 : view.status === "APPROVED" ? 2 : phaseFor(view.status);
}
export function memberHomeLinks(view: SessionView) {
  const phase = memberHomePhase(view);
  const links: [string, string][] = [];
  if (phase === 1 || ["CONFIGURATION_REVIEW_REQUIRED", "ONBOARDING_BLOCKED", "FIRST_PRODUCTIVE_USE_BLOCKED"].includes(view.status)) links.push(["Review decisions", memberHomeAction(view).href]);
  if (view.blockers.length || /BLOCKED|PAUSED|RESOLVING|RETRY_PENDING/.test(view.status)) links.push([phase === 2 ? "Issues & Recovery" : "Review issues", memberHomeAction(view).href]);
  links.push(["Evidence & Results", `/trust?view=evidence&session=${view.id}`]);
  if (phase !== null && phase >= 3) links.push(["Financial verification", withSession("/validate-configure", view.id)]);
  if (phase === 4) links.push(["First-task evidence", withSession("/onboard-fpu", view.id)]);
  return links;
}
