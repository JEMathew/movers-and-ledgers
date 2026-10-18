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
  // The primary action already opens the decision, issue or recovery task, so it is not repeated as a shortcut.
  const primary = memberHomeAction(view).href;
  if (phase === 1 && primary !== `/trust?view=evidence&session=${view.id}`) links.push(["Review decisions", primary]);
  links.push(["Open evidence", `/trust?view=evidence&session=${view.id}`]);
  links.push(["AI activity", `/trust?view=evidence&session=${view.id}#ai-activity`]);
  const complete = view.status === "VERIFIED_FIRST_PRODUCTIVE_USE";
  if (!complete && phase !== null && phase >= 3) links.push(["Financial verification", withSession("/validate-configure", view.id)]);
  if (!complete && phase === 4) links.push(["First-task evidence", withSession("/onboard-fpu", view.id)]);
  return links;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const PAUSED = ["MIGRATION_PAUSED", "RESOLVING", "RETRY_PENDING", "MIGRATION_BLOCKED"];

/** The step inside the current stage, for "Prepare · stage 2 of 5 · map and approve". Display only. */
export function memberHomeStep(view: SessionView): string {
  const s = view.status;
  if (["CREATED", "DISCOVERED"].includes(s)) return "check readiness";
  if (["ASSESSED", "PLANNED"].includes(s)) return "plan";
  if (s === "MAPPING" || (s === "AWAITING_APPROVAL" && view.mappingIssues !== 0)) return "map and approve";
  if (s === "AWAITING_APPROVAL") return "approve the plan";
  if (["APPROVED", "MIGRATION_READY"].includes(s)) return "start the move";
  if (s === "MIGRATING") return "moving records";
  if (PAUSED.includes(s)) return "recover";
  if (["MIGRATION_COMPLETE", "VALIDATING", "VALIDATION_BLOCKED"].includes(s)) return "check the books";
  if (["VALIDATED", "CONFIGURING", "CONFIGURATION_REVIEW_REQUIRED"].includes(s)) return "review settings";
  if (["CONFIGURED", "ONBOARDING", "ONBOARDING_BLOCKED"].includes(s)) return "set up";
  if (s === "VERIFIED_FIRST_PRODUCTIVE_USE") return "verified";
  return "first invoice";
}

/** The Companion guide sentence: what has happened and what is next, from the session evidence only. */
export function memberHomeGuide(view: SessionView): string {
  const s = view.status;
  const ready = view.readinessKnown && !view.readinessIssues;
  if (["CREATED", "DISCOVERED"].includes(s)) return "Your migration has started. Finish the readiness check to see what can move and what needs attention.";
  if (["ASSESSED", "PLANNED", "MAPPING", "AWAITING_APPROVAL"].includes(s) && view.readinessIssues) return `The readiness check found ${plural(view.readinessIssues, "blocker")} in your source books. Planning keeps ${view.readinessIssues === 1 ? "it" : "them"} visible; nothing moves until the source data is fixed.`;
  if (s === "ASSESSED") return ready ? "Your books passed the readiness check. Next, create the plan and review where every record goes." : "The readiness check is recorded. Review it, then create the plan.";
  if (["PLANNED", "MAPPING", "AWAITING_APPROVAL"].includes(s)) {
    if (view.mappingIssues === null) return "The rules have proposed where your records go. The number still waiting isn't in this snapshot, so open Prepare to see each one.";
    if (view.mappingIssues === 0) return "Every mapping is approved or changed. Approve the plan to unlock Move; nothing moves until you start it.";
    return `${ready ? "Your books passed the readiness check and the rules" : "The rules"} have proposed where every record goes. Before anything moves, ${plural(view.mappingIssues, "mapping")} ${view.mappingIssues === 1 ? "needs" : "need"} your decision.`;
  }
  if (["APPROVED", "MIGRATION_READY"].includes(s)) return "Your plan is approved. Records move only when you start the move.";
  if (s === "MIGRATING") return "Records are moving in batches. A problem pauses one batch, not the whole move.";
  if (PAUSED.includes(s)) return "The move paused safely and completed batches are kept. Review the issue and any permitted fix.";
  if (["MIGRATION_COMPLETE", "VALIDATING"].includes(s)) return "Your records have moved. Checks now compare your old and new books to the cent.";
  if (s === "VALIDATION_BLOCKED") return "A check didn't match. Review the difference before the migration goes further.";
  if (["VALIDATED", "CONFIGURING", "CONFIGURATION_REVIEW_REQUIRED"].includes(s)) return "Your books match. Review the settings for your new books.";
  if (["CONFIGURED", "ONBOARDING", "ONBOARDING_BLOCKED"].includes(s)) return "Your settings are done. Finish the essentials so you can start working.";
  if (s === "VERIFIED_FIRST_PRODUCTIVE_USE") return "Your first invoice is posted and verified. This migration is complete.";
  return "Everything is set up. Create and verify your first invoice in the new books.";
}

export type StageLine = { name: string; state: "done" | "current" | "blocked" | "locked" | "unknown"; text: string };
/** "How this move is going": one plain line per stage, from the session evidence only. Unknown is said plainly. */
export function memberHomeStageLines(view: SessionView): StageLine[] {
  const phase = memberHomePhase(view);
  const verified = view.status === "VERIFIED_FIRST_PRODUCTIVE_USE";
  const at = (index: number): StageLine["state"] => phase === null ? "unknown" : verified || index < phase ? "done" : index === phase ? "current" : "locked";
  const started = !["CREATED", "DISCOVERED"].includes(view.status);
  const understand: StageLine = !started ? { name: "Understand", state: "current", text: "The readiness check isn't finished yet." }
    : !view.readinessKnown ? { name: "Understand", state: "unknown", text: "Readiness results aren't in this snapshot." }
    : view.readinessIssues ? { name: "Understand", state: "blocked", text: `Readiness check done. ${plural(view.readinessIssues, "blocker")} in the source books must be fixed before anything moves.` }
    : { name: "Understand", state: "done", text: "The rules checked your books for readiness. No blockers found." };
  const prepareState = at(1);
  const prepare: StageLine = { name: "Prepare", state: prepareState, text: prepareState === "locked" ? "Next: the rules propose where every record goes, and you decide each mapping."
    : prepareState === "done" ? "Every mapping approved or changed, and the plan approved."
    : ["CREATED", "DISCOVERED", "ASSESSED"].includes(view.status) ? "Create the plan, then decide where every record goes."
    : view.mappingIssues === null ? "Mappings proposed. How many still need you isn't in this snapshot."
    : view.mappingIssues === 0 ? (view.status === "APPROVED" ? "Plan approved." : "Every mapping is decided. The plan needs your approval.")
    : `${plural(view.mappingIssues, "mapping")} still ${view.mappingIssues === 1 ? "needs" : "need"} your decision.` };
  const moveState = at(2);
  const move: StageLine = { name: "Move", state: moveState === "current" && PAUSED.includes(view.status) ? "blocked" : moveState, text: moveState === "locked" ? "Unlocks when every mapping is approved or changed. Records move in batches; a problem pauses one batch, not the move."
    : moveState === "done" ? "Records moved."
    : PAUSED.includes(view.status) ? `${view.migrationIssues ? `${plural(view.migrationIssues, "issue")} to review.` : "Paused for your review."} Completed batches are kept.`
    : view.status === "MIGRATING" ? "Records are moving in batches." : "Ready when you start the move." };
  const passed = view.checks.filter(check => check.status === "VERIFIED").length;
  const verifyState = at(3);
  const verify: StageLine = { name: "Verify", state: verifyState === "current" && view.verificationIssues ? "blocked" : verifyState, text: verifyState === "locked" ? "Checks compare your old and new books to the cent, then you approve the settings."
    : verifyState === "done" ? "Books checked and settings reviewed."
    : view.verificationIssues ? `${plural(view.verificationIssues, "check")} didn't pass.`
    : view.checks.length ? `${passed} of ${plural(view.checks.length, "recorded check")} passed.` : "Checks run next." };
  const start: StageLine = { name: "Start", state: at(4), text: verified ? "First invoice posted and verified." : at(4) === "current" ? "Finish setup, then create and verify your first invoice." : "Then you create and verify a first invoice." };
  return [understand, prepare, move, verify, start];
}
