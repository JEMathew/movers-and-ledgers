import { ClipboardCheck, ListChecks, ShieldCheck, TriangleAlert } from "lucide-react";
import { Tile, Tiles } from "@/components/ui/tiles";
import type { SessionView } from "../public-surfaces/session";

/** Figures come only from the session evidence already read; an absent source renders as "—", never a guess. */
export function MigrationSnapshot({ view }: { view: SessionView }) {
  const passed = view.checks.filter(check => check.status === "VERIFIED").length;
  const issues = view.blockers.length;
  const mappings = view.mappingIssues !== null;
  const hasChecks = view.checks.length > 0;
  const issuesKnown = view.attentionComplete || issues > 0;
  // Only tiles with recorded evidence are shown. An empty strip would be noise, so fewer than two means none.
  const tiles = [
    mappings && <Tile key="m" icon={ListChecks} label="Mappings to review" value={view.mappingIssues} tone={view.mappingIssues ? "warning" : "success"} status={view.mappingIssues ? "Needs your review" : "All reviewed"}/>,
    issuesKnown && <Tile key="i" icon={TriangleAlert} label="Open issues" value={issues} tone={issues ? "warning" : "success"} status={issues ? "Needs attention" : "None open"}/>,
    hasChecks && <Tile key="c" icon={ShieldCheck} label="Checks passed" value={`${passed} of ${view.checks.length}`} tone={passed === view.checks.length ? "success" : "warning"} status={passed === view.checks.length ? "All passed" : "Not all passed"}/>,
    view.decisions.length > 0 && <Tile key="d" icon={ClipboardCheck} label="Decisions recorded" value={view.decisions.length} status="Kept in the audit trail"/>,
  ].filter(Boolean);
  if (tiles.length < 2) return null;
  return <Tiles label="Migration snapshot">{tiles}</Tiles>;
}
