"use client";

import { useId } from "react";
import { MigrationJourney } from "./MigrationJourney";
import { phases } from "../public-surfaces/content";
import { withSession } from "./journey";
import type { CurrentStepLabel, HeldStep, Processing, UnknownProgress } from "./journey";

/** Presentation of the existing operational projection; never advances the workflow. */
export function PhaseProgress({ current, held, currentLabel = "Current", unknown = "unavailable", processing, session, status }: {
  current: number | null; held?: HeldStep; currentLabel?: CurrentStepLabel; unknown?: UnknownProgress;
  processing?: Processing; session?: string; status?: string;
}) {
  const id = useId();
  const phase = current === null ? null : current >= 8 || ["CONFIGURED", "ONBOARDING", "ONBOARDING_BLOCKED"].includes(status ?? "") ? 4 : current >= 6 ? 3 : current >= 4 ? 2 : current >= 1 ? 1 : 0;
  const done = current !== null && current >= 9;
  const working = processing?.step === current ? processing : undefined;
  const items = phases.map((item, index) => {
    const blocked = held?.index === 0 && index === 0 && phase === 1;
    const state = phase === null ? "Unconfirmed" : blocked ? "Blocked" : done ? "Completed" : phase === index ? currentLabel : phase !== null && index < phase ? "Completed" : "Not Started";
    return <li key={item.name} data-state={state} className={working && phase === index ? "is-processing" : undefined} aria-current={!done && phase === index ? "step" : undefined}>
      {session && phase !== null && index <= phase ? <a href={withSession(item.route, session)}><strong>{item.name}</strong><small>{working && phase === index ? working.action : state}</small></a> : <span><strong>{item.name}</strong><small>{working && phase === index ? working.action : state}</small></span>}
    </li>;
  });
  return <section className="member-progress phase-progress" aria-labelledby={`${id}-title`} aria-busy={Boolean(working)}>
    <p id={`${id}-title`}>{phase === null ? unknown === "loading" ? "Checking your progress…" : "Progress unavailable · nothing is assumed" : done ? "Five phases complete · verified synthetic result" : `${phase + 1} of 5 · ${phases[phase].name} · ${currentLabel}`}</p>
    <ol aria-label="Five-phase migration journey">{items}</ol>
    {working && <div role="status" aria-live="polite" className="mt-3"><strong>{working.title}</strong><p>{working.detail}</p>{working.stages && <p>{working.stages[working.stage ?? 0]}</p>}</div>}
    <details className="operational-history"><summary>Five phases and operational steps</summary><ol className="phase-mobile-history" aria-label="Five-phase migration journey">{items}</ol><MigrationJourney current={current} held={held} currentLabel={currentLabel} unknown={unknown} /></details>
  </section>;
}

export function TaskContext({ phase, session }: { phase: number; session?: string }) {
  return <nav className="task-context" aria-label="Migration utilities">
    <a href={withSession("/workspace", session)}>My Migration</a>
    <a href={session ? `/support?session=${encodeURIComponent(session)}&stage=${phase}` : "/support"} aria-label="Help with this task">Help</a>
    {session && <a href={`/trust?view=evidence&session=${encodeURIComponent(session)}`} aria-label="Evidence & results">Evidence</a>}
  </nav>;
}
