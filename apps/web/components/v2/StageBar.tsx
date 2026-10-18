import type { V2Stage } from "./stages";

function Tick() {
  return <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="var(--v2-accent)" strokeWidth="2" /></svg>;
}

/** One five-stage progress model. On phones the names collapse into a single "Prepare · stage 2 of 5" line. */
export function StageBar({ stages }: { stages: V2Stage[] }) {
  const currentIndex = stages.findIndex((stage) => stage.status === "current");
  const allDone = stages.every((stage) => stage.status === "done");
  const compact = allDone
    ? "All 5 stages done"
    : currentIndex >= 0 ? `${stages[currentIndex].name} · stage ${currentIndex + 1} of ${stages.length}` : "";
  return (
    <nav aria-label="Migration stages">
      <ol className="v2-stages">
        {stages.map((stage) => (
          <li key={stage.name} className="v2-stage" data-status={stage.status} aria-current={stage.status === "current" ? "step" : undefined}>
            <span className="v2-stage-bar" aria-hidden="true" />
            <span className="v2-stage-name">{stage.status === "done" ? <Tick /> : null}{stage.name}</span>
            <span className="v2-stage-detail">{stage.detail}</span>
          </li>
        ))}
      </ol>
      {compact ? <p className="v2-stages-compact" aria-hidden="true"><strong>{compact}</strong></p> : null}
    </nav>
  );
}
