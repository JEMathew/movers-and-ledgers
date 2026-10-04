"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Select } from "@/components/ui";
import { Surface } from "./Surface";
import { phases } from "./content";
import { contextQuery, safeContext, type SafeContext } from "./context";
const help = [
  { name: "Readiness or mapping blocker", phase: 1, topic: "mappings", why: "A missing fact, incompatible mapping or unresolved finding prevents a safe move.", action: "Review the finding and its evidence in Understand or Prepare. Rejection is a valid decision; it does not authorize migration." },
  { name: "Approval required", phase: 1, topic: "approvals", why: "A decision affects accounting meaning, access or a consequential action.", action: "Read impact and evidence in the current workflow, then approve or reject there. Support cannot approve on your behalf." },
  { name: "Migration paused", phase: 2, topic: "recovery", why: "A batch failed or needs a governed remedy. Earlier completed checkpoints are preserved.", action: "Review the proposal in Move. Use Retry failed batch only if the workflow enables it after the required decision. Do not restart completed work." },
  { name: "Validation mismatch", phase: 3, topic: "reconciliation", why: "A rule found a difference between source evidence and the executed target.", action: "Inspect the failed check in Verify. Review a permitted repair and rerun validation. An approval cannot waive a financial mismatch." },
  { name: "Onboarding prerequisite", phase: 4, topic: "business-ready", why: "Required setup, access or onboarding decisions are incomplete or blocked.", action: "Open Start, review the prerequisite and record the required decision. The productive task stays unavailable until the checks pass." },
  { name: "First real task failed", phase: 4, topic: "business-ready", why: "The agreed task has not reached verified completion. Posting alone is insufficient.", action: "Read the task failure in Start. Review permitted remediation and resume only through its controls; an existing posting checkpoint must not be replayed." },
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
  const stage = context.stage === undefined ? item.phase : Number(context.stage);
  const route = context.session ? `${phases[stage].route}?session=${context.session}` : "/product";
  return <Surface eyebrow="Support" title="Understand the blocker. Find the safe next step." intro="Contextual self-service help for the synthetic Beta. There is no live support team, automated repair service or production incident response behind this page."><div className="max-w-2xl"><Select label="What do you need help with?" value={selected} onChange={e => setSelected(Number(e.target.value))}>{help.map((h, i) => <option key={h.name} value={i}>{h.name}</option>)}</Select></div><section className="panel p-6"><h2 className="type-section">{item.name}</h2><p className="mt-4 leading-7 text-secondary">{item.why}</p><h3 className="mt-6 font-bold">What you can do next</h3><p className="mt-3 leading-7">{item.action}</p>{context.session && <p className="mt-4 break-words text-sm text-muted">Session reference: {context.session}. This link is context, not authorization or a current-state claim.</p>}<div className="mt-6 flex flex-wrap gap-3"><Link className="button" href={route}>{context.session ? "Return to migration" : "Review migration options"}</Link><Link className="button secondary" href={`/learn#${item.topic}`}>Learn about this step</Link><Link className="button secondary" href={`/feedback?kind=issue&${contextQuery(context)}`}>Prepare issue draft</Link></div></section><Alert tone="warning" title="No bypasses from Support"><p>We never retry, approve, clear a blocker or declare success here. The original workflow checks whether an action is permitted. If a session expired, return to Product to explicitly start a new synthetic exercise.</p></Alert></Surface>;
}
