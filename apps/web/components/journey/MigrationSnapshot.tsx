import { ClipboardCheck, ListChecks, ShieldCheck, TriangleAlert } from "lucide-react";
import { Tile, Tiles } from "@/components/ui/tiles";
import type { SessionView } from "../public-surfaces/session";

/** Figures come only from the session evidence already read; an absent source renders as "—", never a guess. */
export function MigrationSnapshot({ view }: { view: SessionView }) {
  const passed = view.checks.filter(check => check.status === "VERIFIED").length;
  const issues = view.blockers.length;
  return <Tiles label="Migration snapshot">
    <Tile icon={ListChecks} label="Mappings to review" value={view.mappingIssues ?? "—"} tone={view.mappingIssues === null ? "neutral" : view.mappingIssues ? "warning" : "success"} status={view.mappingIssues === null ? "Not read yet" : view.mappingIssues ? "Needs your review" : "All reviewed"}/>
    <Tile icon={TriangleAlert} label="Open issues" value={view.attentionComplete || issues ? issues : "—"} tone={issues ? "warning" : view.attentionComplete ? "success" : "neutral"} status={issues ? "Needs attention" : view.attentionComplete ? "None open" : "Check the current task"}/>
    <Tile icon={ShieldCheck} label="Checks passed" value={view.checks.length ? `${passed} of ${view.checks.length}` : "—"} tone={!view.checks.length ? "neutral" : passed === view.checks.length ? "success" : "warning"} status={!view.checks.length ? "None recorded yet" : passed === view.checks.length ? "All passed" : "Not all passed"}/>
    <Tile icon={ClipboardCheck} label="Decisions recorded" value={view.decisions.length} tone="neutral" status={view.decisions.length ? "Kept in the audit trail" : "None yet"}/>
  </Tiles>;
}
