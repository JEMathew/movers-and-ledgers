import { phases } from "../public-surfaces/content";
import type { SessionView } from "../public-surfaces/session";
import { memberHomePhase, memberHomeStep } from "./member-home";
import { withSession } from "./journey";

/** Display text for each stage state; data-state keeps the stable value styles and tests use. */
const SHOWN: Record<string, string> = { Completed: "Done", Current: "Now", Blocked: "Blocked", Pending: "Locked", "Earlier phase": "Not confirmed" };

function Tick() {
  return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
}

/** The five-stage bar for My migration. Presentation of the session status only; it never advances anything. */
export function MemberProgress({ view }: { view?: SessionView }) {
  const current = view ? memberHomePhase(view) : null;
  const verified = view?.status === "VERIFIED_FIRST_PRODUCTIVE_USE";
  const blocked = view && /BLOCKED/.test(view.status);
  const step = view ? memberHomeStep(view) : "";
  const items = phases.map((phase, index) => {
    const held = Boolean(view?.readinessIssues && index === 0 && current === 1);
    const state = held ? "Blocked" : verified ? "Completed" : current === index ? blocked ? "Blocked" : "Current" : current !== null && index < current ? view?.readinessKnown ? "Completed" : "Earlier phase" : "Pending";
    const accessible = Boolean(view && current !== null && index <= current);
    const detail = state === "Current" ? `Now: ${step}` : SHOWN[state];
    const body = <><span className="mm-stage-bar" aria-hidden="true" /><span className="mm-stage-name">{state === "Completed" ? <Tick /> : null}{phase.name}</span><small className="mm-stage-detail">{detail}</small></>;
    return <li key={phase.name} aria-current={!verified && index === current ? "step" : undefined} data-state={state}>
      {accessible ? <a href={withSession(phase.route, view?.id)}>{body}</a> : <span>{body}</span>}
    </li>;
  });
  return <section id="progress" className="mm-progress" aria-labelledby="progress-title">
    <h2 id="progress-title" className="mm-sr">Migration progress</h2>
    <ol aria-label="Five-stage migration journey" className="mm-stages">{items}</ol>
    <p className="mm-stages-compact" aria-hidden="true"><strong>{verified ? "All 5 stages done" : current !== null ? `${phases[current].name} · stage ${current + 1} of 5${blocked ? " · blocked" : ""}` : "No progress assumed"}</strong></p>
  </section>;
}
