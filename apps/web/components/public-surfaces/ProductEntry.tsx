"use client";
import Link from "next/link";
import { Alert, Button } from "@/components/ui";
import { Surface } from "./Surface";
import { phases } from "./content";
import { useSessionView, type SessionView } from "./session";
import { nextActionFor, projectJourney } from "@/components/journey/journey";
import { StageBar, v2Stages, WorkflowSummary } from "@/components/v2";

/** The linked migration's real stage and next step, read from the API; nothing here advances it. */
function ResumeCard({ view }: { view: SessionView }) {
  const projection = projectJourney({ status: view.status, mappingIssues: view.mappingIssues, readinessIssues: view.readinessIssues });
  const stages = v2Stages(projection.current, view.status);
  const next = nextActionFor(view);
  const stage = phases[view.phase];
  const complete = view.status === "VERIFIED_FIRST_PRODUCTIVE_USE";
  return <section className="grid gap-4" aria-label="Linked migration">
    <h2 className="type-section">Current stage: {complete ? "all five done" : stage.name}</h2>
    {stages && <StageBar stages={stages} />}
    <WorkflowSummary label="Linked migration summary"
      next={{ title: next.heading, detail: next.detail, action: <Link className="button" href={`${stage.route}?session=${view.id}`}>Continue my migration</Link> }}
      done={complete ? ["All five stages done"] : view.phase > 0 ? [`Stages done: ${phases.slice(0, view.phase).map(item => item.name).join(", ")}`] : []}
      outstanding={view.blockers.slice(0, 3).map(label => ({ label }))}
      evidence={{ href: `/trust?view=evidence&session=${view.id}`, label: "View evidence" }} />
    <p className="break-words text-sm text-muted">Reference: {view.id}</p>
  </section>;
}

// The overview has one owner: Home. Explicit legacy references retain their validated
// compatibility read until PR04's workspace error handling supports retirement.
export function ProductEntry() {
  const { view, loading, error, refresh } = useSessionView();
  return <Surface compact eyebrow="Migration link" title="Resume your migration." intro="Read the linked synthetic migration before returning to its current stage.">
    {loading ? <p role="status">Reading your migration…</p> : error ? <Alert tone="warning" title="Migration unavailable"><p>{error}</p><p>No replacement migration was created. Check your reference and access.</p></Alert> : view ? <ResumeCard view={view} /> : <Alert tone="warning" title="Migration reference unavailable"><p>No replacement migration was created. Open a valid owned migration link.</p></Alert>}
    <Button variant={view ? "secondary" : "primary"} onClick={refresh} disabled={loading}>Refresh migration</Button>
    <Link className="public-text-link" href="/">Product overview</Link>
  </Surface>;
}
