"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Select } from "@/components/ui";
import { Surface } from "./Surface";
import { phases } from "./content";
import { contextQuery, safeContext, type SafeContext } from "./context";
import { helpIssues as help, phaseHelp } from "./help-content";
export function Support() {
  return <Suspense fallback={<Surface compact eyebrow="Help" title="Find a safe next step." intro="Choose one issue for self-service guidance; no support ticket is submitted here."><p role="status">Reading help context…</p></Surface>}><SupportContent/></Suspense>;
}
function SupportContent() {
  const search = useSearchParams().toString();
  const [context, setContext] = useState<SafeContext>({});
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const query = new URLSearchParams(search);
    if (!query.has("session")) query.set("session", sessionStorage.getItem("movebooks-migration-session") ?? "");
    const c = safeContext(query);
    setContext(c);
    setSelected(0);
    if (c.stage === "2") setSelected(2);
    if (c.stage === "3") setSelected(3);
    if (c.stage === "4") setSelected(c.failed_action === "first_productive_use" ? 5 : 4);
  }, [search]);
  const item = help[selected];
  const issuePhase = selected === 1 && context.stage !== undefined ? Number(context.stage) : selected === 0 && (context.stage === "0" || context.failed_action === "discovery") ? 0 : item.phase;
  const topic = issuePhase === 0 && selected === 0 ? "evidence" : item.topic;
  const route = context.session ? `${phases[issuePhase].route}?session=${context.session}` : `/learn#${topic}`;
  const origin = context.session && context.stage !== undefined ? `${phases[Number(context.stage)].route}?session=${context.session}` : undefined;
  const related = contextQuery({ session: context.session, stage: context.stage ?? String(issuePhase) });
  return <Surface compact eyebrow="Help" title="Find a safe next step." intro="Choose one issue for self-service guidance; no support ticket is submitted here.">
    {context.stage !== undefined && <p className="text-secondary"><strong>{phases[Number(context.stage)].name} help:</strong> {phaseHelp[Number(context.stage)].text}</p>}
    <div className="max-w-2xl"><Select label="What do you need help with?" value={selected} onChange={e => setSelected(Number(e.target.value))}>{help.map((h, i) => <option key={h.name} value={i}>{h.name}</option>)}</Select><Link className="button mt-4" href={route}>{context.session ? `Open ${phases[issuePhase].name} for this issue` : "Read related concept"}</Link></div>
    <section className="max-w-3xl"><h2 className="type-section">{item.name}</h2><p className="mt-3 leading-7">{item.action}</p></section>
    <p className="text-secondary">Help cannot approve, retry or clear a blocker. The original task verifies access and permitted actions. An unavailable reference does not create a replacement migration.</p>
    <details className="public-disclosure"><summary>Why this can happen</summary><div className="public-detail"><p>{item.why}</p>{context.session && <p className="break-words">Reference: {context.session}. Context only, not proof of ownership or current state.</p>}</div></details>
    <div className="flex flex-wrap gap-3">{origin ? <Link className="public-text-link" href={origin}>Return to original task</Link> : <Link className="public-text-link" href="/guide#start-here">Getting Started Guide</Link>}{context.session && <Link className="public-text-link" href={`/learn?${related}#${topic}`}>Learn about this step</Link>}<Link className="public-text-link" href={`/feedback?kind=issue&${contextQuery(context)}`}>Prepare unsent issue draft</Link></div>
    <nav className="flex flex-wrap gap-3" aria-label="Related help references"><Link className="public-text-link" href={`/guide#${item.guide}`}>Task instructions</Link><Link className="public-text-link" href="/trust#financial-controls">Controls and human approvals</Link>{selected === 1 && <Link className="public-text-link" href="/guide#reconsideration">Reconsider a rejected mapping</Link>}</nav>
    <details className="public-disclosure"><summary>Interrupted, blocked or uncertain result?</summary><div className="public-detail"><p>If a response is missing, return to the original task and read its current state first. A failed response is not proof that a decision or financial write failed. Never create a fresh posting key or repeat consent to resolve uncertainty.</p><p>Use only the task’s permitted recovery: an existing same-intent request or a recorded checkpoint. Rejected, unsupported and exhausted recovery stays blocked. Help cannot clear it, and no action runs automatically.</p><p>If access expired, sign in again for the same destination. If the migration is unavailable, check your owned reference; do not replace it with a sample.</p></div></details>
    <p className="text-secondary">Self-service only; no staffed support team or response-time commitment.</p>
  </Surface>;
}
