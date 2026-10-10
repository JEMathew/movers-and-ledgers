import { phases } from "../public-surfaces/content";
import type { SessionView } from "../public-surfaces/session";
import { memberHomePhase } from "./member-home";
import { withSession } from "./journey";

export function MemberProgress({ view }: { view?: SessionView }) {
  const current = view ? memberHomePhase(view) : null;
  const verified = view?.status === "VERIFIED_FIRST_PRODUCTIVE_USE";
  const blocked = view && /BLOCKED/.test(view.status);
  const items = phases.map((phase, index) => {
      const held = Boolean(view?.readinessIssues && index === 0 && current === 1);
      const state = held ? "Blocked" : verified ? "Completed" : current === index ? blocked ? "Blocked" : "Current" : current !== null && index < current ? view?.readinessKnown ? "Completed" : "Earlier phase" : "Pending";
      const accessible = Boolean(view && current !== null && index <= current);
      return <li key={phase.name} aria-current={!verified && index === current ? "step" : undefined} data-state={state}>
        {accessible ? <a href={withSession(phase.route, view?.id)}><span>{index + 1}. {phase.name}</span><small>{state}</small></a> : <span><span>{index + 1}. {phase.name}</span><small>{state}</small></span>}
      </li>;
    });
  return <section id="progress" className="member-progress" aria-labelledby="progress-title">
    <h2 id="progress-title">Migration progress</h2>
    <p>{verified ? "Five phases complete · verified synthetic result" : current !== null ? `${current + 1} of 5 · ${phases[current].name}${blocked ? " · Blocked" : ""}` : "No progress assumed"}</p>
    <ol aria-label="Five-phase migration journey">{items}</ol>
    <details className="member-progress-mobile"><summary>Five phases and history</summary><ol aria-label="Five-phase migration journey">{items}</ol></details>
  </section>;
}
