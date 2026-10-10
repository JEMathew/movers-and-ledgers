"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui";
import { Surface } from "./Surface";
import { phases } from "./content";
import { contextQuery, safeContext, type SafeContext } from "./context";
const help = [
  { name: "Readiness or mapping blocker", phase: 1, topic: "mappings", why: "A missing fact, incompatible mapping or unresolved finding prevents a safe move.", action: "Review the finding and its evidence in Understand or Prepare. Rejection is a valid decision; it does not authorize migration." },
  { name: "Approval required", phase: 1, topic: "approvals", why: "A decision affects accounting meaning, access or a consequential action.", action: "Read impact and evidence in the current workflow, then approve or reject there. Support cannot approve on your behalf." },
  { name: "Migration paused", phase: 2, topic: "recovery", why: "A batch failed or needs a governed remedy. Earlier completed checkpoints are preserved.", action: "Review the proposal in Move. Use Retry failed batch only if the workflow enables it after the required decision. Do not restart completed work." },
  { name: "Validation mismatch", phase: 3, topic: "reconciliation", why: "A rule found a difference between source evidence and the executed target.", action: "Inspect the failed check in Verify. Review a permitted repair and rerun validation. An approval cannot waive a financial mismatch." },
  { name: "Onboarding prerequisite", phase: 4, topic: "business-ready", why: "Required setup, access or onboarding decisions are incomplete or blocked.", action: "Open Start, review the prerequisite and record the required decision. The productive task stays unavailable until the checks pass." },
  { name: "First synthetic task failed", phase: 4, topic: "business-ready", why: "The agreed task has not reached verified completion. Posting alone is insufficient.", action: "Read the task failure in Start. Review permitted remediation and resume only through its controls; an existing posting checkpoint must not be replayed." },
];
export function Support() {
  const [context, setContext] = useState<SafeContext>({});
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (!query.has("session")) query.set("session", sessionStorage.getItem("movebooks-migration-session") ?? "");
    const c = safeContext(query);
    setContext(c);
    if (c.stage === "2") setSelected(2);
    if (c.stage === "3") setSelected(3);
    if (c.stage === "4") setSelected(c.failed_action === "first_productive_use" ? 5 : 4);
  }, []);
  const item = help[selected];
  const issuePhase = selected === 0 && (context.stage === "0" || context.failed_action === "discovery") ? 0 : item.phase;
  const route = context.session ? `${phases[issuePhase].route}?session=${context.session}` : `/learn#${item.topic}`;
  const origin = context.session && context.stage !== undefined ? `${phases[Number(context.stage)].route}?session=${context.session}` : undefined;
  return <Surface compact eyebrow="Help" title="Find a safe next step." intro="Choose one issue for self-service guidance; no support ticket is submitted here.">
    <div className="max-w-2xl"><Select label="What do you need help with?" value={selected} onChange={e => setSelected(Number(e.target.value))}>{help.map((h, i) => <option key={h.name} value={i}>{h.name}</option>)}</Select><Link className="button mt-4" href={route}>{context.session ? `Open ${phases[issuePhase].name} for this issue` : "Read related concept"}</Link></div>
    <section className="max-w-3xl"><h2 className="type-section">{item.name}</h2><p className="mt-3 leading-7">{item.action}</p></section>
    <p className="text-secondary">Help cannot approve, retry or clear a blocker. The original task verifies access and permitted actions. An unavailable reference does not create a replacement migration.</p>
    <details className="public-disclosure"><summary>Why this can happen</summary><div className="public-detail"><p>{item.why}</p>{context.session && <p className="break-words">Reference: {context.session}. Context only, not proof of ownership or current state.</p>}</div></details>
    <div className="flex flex-wrap gap-3">{origin ? <Link className="public-text-link" href={origin}>Return to original task</Link> : <Link className="public-text-link" href="/guide#start-here">Getting Started Guide</Link>}{context.session && <Link className="public-text-link" href={`/learn#${item.topic}`}>Learn about this step</Link>}<Link className="public-text-link" href={`/feedback?kind=issue&${contextQuery(context)}`}>Prepare unsent issue draft</Link></div>
    <p className="text-secondary">Self-service only; no staffed support team or response-time commitment.</p>
  </Surface>;
}
