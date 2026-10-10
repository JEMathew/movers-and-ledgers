"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Checkbox, Select } from "@/components/ui";
import { Surface } from "./Surface";
import { safeContext, type SafeContext } from "./context";
const categories = ["Product experience", "Bug or blocker", "Knowledge / explanation", "Agent recommendation", "Accessibility", "Security / privacy"];
export function Feedback() {
  const [kind, setKind] = useState("Share Feedback");
  const [category, setCategory] = useState(categories[0]);
  const [message, setMessage] = useState("");
  const [context, setContext] = useState<SafeContext>({});
  const [include, setInclude] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const result = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setContext(safeContext(query));
    if (query.get("kind") === "issue") setKind("Report Issue");
  }, []);
  function prepare(event: React.FormEvent) {
    event.preventDefault(); setDraft("");
    if (message.trim().length < 10 || message.length > 1500) { setError("Describe the issue or suggestion in 10–1500 characters."); return; }
    if (!confirmed) { setError("Confirm that your draft contains no secrets, personal or financial data."); return; }
    setError("");
    setDraft(JSON.stringify({ version: "feedback-draft-v1", kind, category, message: message.trim(), ...(include ? { context } : {}), prepared_at: new Date().toISOString(), delivery: "NOT_SUBMITTED" }, null, 2));
    requestAnimationFrame(() => result.current?.focus());
  }
  return <Surface compact eyebrow="Feedback" title="Prepare unsent feedback." intro="Review and download a local draft; nothing is submitted or stored on a server.">
    <form onSubmit={prepare} className="max-w-2xl space-y-4" noValidate>
    <p id="feedback-privacy">Exclude credentials, personal details, financial data and business records. No attachments or automatic data collection.</p>
    <div className="field-label"><label htmlFor="feedback-message">What should we understand?</label><textarea id="feedback-message" className="field-control min-h-28" maxLength={1500} value={message} onChange={e => { setMessage(e.target.value); setDraft(""); setConfirmed(false); }} aria-describedby="feedback-help feedback-privacy" aria-invalid={Boolean(error)}/><p id="feedback-help" className="field-hint">10–1500 characters. Describe behavior, not business records.</p></div>
    <details className="public-disclosure"><summary>Feedback type and category</summary><div className="public-detail grid gap-4 sm:grid-cols-2">
      <Select label="Feedback type" value={kind} onChange={e => { setKind(e.target.value); setDraft(""); }}>{["Share Feedback", "Report Issue", "Suggest Improvement"].map(value => <option key={value}>{value}</option>)}</Select>
      <Select label="Category" value={category} onChange={e => { setCategory(e.target.value); setDraft(""); }}>{categories.map(value => <option key={value}>{value}</option>)}</Select>
    </div></details>
    {Object.keys(context).length > 0 && <details className="public-disclosure"><summary>{include ? "Context included in draft" : "Optional context preview"}</summary><div className="public-detail"><dl className="mt-3 space-y-2 break-words text-sm">{Object.entries(context).map(([key, value]) => <div key={key}><dt className="font-semibold">{key.replaceAll("_", " ")}</dt><dd>{String(value)}</dd></div>)}</dl><div className="mt-4"><Checkbox checked={include} onChange={e => { setInclude(e.target.checked); setDraft(""); }} label="Include only this context in my draft" description="References do not grant access. Unknown URL fields and raw payloads are discarded."/></div></div></details>}
    <Checkbox checked={confirmed} onChange={e => { setConfirmed(e.target.checked); setDraft(""); }} label="I checked that this draft contains no sensitive data"/>
    {error && <p role="alert" className="field-error-text">{error}</p>}<div className="flex flex-wrap gap-3"><Button type="submit" variant={draft ? "secondary" : "primary"}>Prepare feedback draft</Button><Button variant="ghost" onClick={() => { setMessage(""); setDraft(""); setConfirmed(false); setInclude(false); setError(""); }}>Clear draft</Button></div>
    </form>{draft && <section className="panel p-6"><h2 ref={result} tabIndex={-1} className="type-section">Draft ready — not submitted</h2><p className="mt-3 text-secondary">Only the fields below will be in your download. Review before sharing through an agreed channel; no delivery or triage has occurred.</p><pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-[var(--surface-subtle)] p-4 text-xs">{draft}</pre><a className="button mt-5" download="movebooks-feedback-draft.json" href={`data:application/json;charset=utf-8,${encodeURIComponent(draft)}`}>Download reviewed draft</a></section>}<p className="text-secondary">Need a safe next step? <a className="public-text-link" href="/support">Open Help</a>. There is no staffed inbox or response-time commitment.</p><details className="public-disclosure"><summary>Future feedback handling</summary><div className="public-detail"><p>Planned: feedback → triage → product, bug, knowledge or agent evaluation → fix → regression/evaluation → release. Managed intake and response are not implemented.</p></div></details></Surface>;
}
