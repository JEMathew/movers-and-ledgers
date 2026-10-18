"use client";

import { useId } from "react";
import { FileSearch, LifeBuoy, Sparkles } from "lucide-react";
import { MigrationJourney } from "./MigrationJourney";
import { phases } from "../public-surfaces/content";
import { phaseIndexFor, withSession } from "./journey";
import type { CurrentStepLabel, HeldStep, Processing, UnknownProgress } from "./journey";

/** Display text for each stage state. data-state keeps the stable value used by styles and tests. */
const STATE_TEXT: Record<string, string> = {
  Completed: "Done", Current: "Now", "Not Started": "Not started", "Needs Attention": "Needs attention",
  Blocked: "Blocked", Paused: "Paused", Unconfirmed: "Not confirmed",
};

/** The V2 stage bar for task pages: one five-stage model, projected from the existing operational
 *  status. Presentation only; it never advances the workflow. */
export function PhaseProgress({ current, held, currentLabel = "Current", unknown = "unavailable", processing, session, status }: {
  current: number | null; held?: HeldStep; currentLabel?: CurrentStepLabel; unknown?: UnknownProgress;
  processing?: Processing; session?: string; status?: string;
}) {
  const id = useId();
  const phase = phaseIndexFor(current, status);
  const done = current !== null && current >= 9;
  const working = processing?.step === current ? processing : undefined;
  const items = phases.map((item, index) => {
    const blocked = held?.index === 0 && index === 0 && phase === 1;
    const state = phase === null ? "Unconfirmed" : blocked ? "Blocked" : done ? "Completed" : phase === index ? currentLabel : phase !== null && index < phase ? "Completed" : "Not Started";
    const shown = STATE_TEXT[state] ?? state;
    return <li key={item.name} data-state={state} className={working && phase === index ? "is-processing" : undefined} aria-current={!done && phase === index ? "step" : undefined}>
      {session && phase !== null && index <= phase ? <a href={withSession(item.route, session)}><strong>{item.name}</strong><small>{working && phase === index ? working.action : shown}</small></a> : <span><strong>{item.name}</strong><small>{working && phase === index ? working.action : shown}</small></span>}
    </li>;
  });
  return <section className="member-progress phase-progress" aria-labelledby={`${id}-title`} aria-busy={Boolean(working)}>
    <p id={`${id}-title`}>{phase === null ? unknown === "loading" ? "Checking your progress…" : "Progress unavailable. Nothing is assumed." : done ? "All 5 stages done · ready to use" : `${phases[phase].name}, stage ${phase + 1} of 5${currentLabel === "Current" ? "" : `. ${STATE_TEXT[currentLabel]}`}`}</p>
    <ol aria-label="Five-stage migration journey">{items}</ol>
    {working && <div role="status" aria-live="polite" className="mt-3"><strong>{working.title}</strong><p>{working.detail}</p>{working.stages && <p>{working.stages[working.stage ?? 0]}</p>}</div>}
    {/* The same five stages, broken into the steps the rules record. Secondary detail, closed by default. */}
    <details className="operational-history"><summary>Steps in each stage</summary><MigrationJourney current={current} held={held} currentLabel={currentLabel} unknown={unknown} /></details>
  </section>;
}

export function TaskContext({ phase, session }: { phase: number; session?: string }) {
  const q = session ? encodeURIComponent(session) : "";
  return <nav className="task-context" aria-label="Migration utilities">
    {session && <a href={`/trust?view=evidence&session=${q}`} aria-label="Evidence & results"><FileSearch size={15} aria-hidden="true"/>Evidence</a>}
    {session && <a href={`/trust?view=evidence&session=${q}#ai-activity`} aria-label="AI activity"><Sparkles size={15} aria-hidden="true"/>AI activity</a>}
    <a href={session ? `/support?session=${q}&stage=${phase}` : "/support"} aria-label="Help with this task"><LifeBuoy size={15} aria-hidden="true"/>Help</a>
  </nav>;
}
