"use client";
import { useEffect, useRef, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { authHeaders } from "@/lib/identity";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const capabilities = ["planning", "mapping", "mapping-review", "resolution", "configuration", "onboarding"] as const;
const states = ["RESERVED", "COMPLETED", "FALLBACK", "UNAVAILABLE"] as const;
type Event = { capability: string; state: string; created_at: string; reserved_calls: number; reserved_microusd: number; completed_at: string | null; model_calls: number | null; tool_calls: number | null; input_tokens: number | null; output_tokens: number | null; usage_status: string | null };
type Activity = { status: "DISABLED" | "AVAILABLE" | "UNAVAILABLE"; events: Event[] };
const bounded = (value: unknown, max: number): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max;
const nullableCount = (value: unknown, max: number) => bounded(value, max) ? value : null;
const validTime = (value: unknown): value is string => typeof value === "string" && value.length <= 40 && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
/** Re-project at the UI boundary: never render arbitrary Firestore/backend text. */
function parseActivity(raw: unknown): Activity {
  if (!raw || typeof raw !== "object") throw new Error("unavailable");
  const data = raw as Record<string, unknown>;
  if (!["DISABLED", "AVAILABLE", "UNAVAILABLE"].includes(String(data.status)) || !Array.isArray(data.events) || data.events.length > 20) throw new Error("unavailable");
  const events: Event[] = [];
  for (const rawEvent of data.events) {
    if (!rawEvent || typeof rawEvent !== "object") throw new Error("unavailable");
    const item = rawEvent as Record<string, unknown>;
    if (!capabilities.some(value => value === item.capability) || !states.some(value => value === item.state) || !validTime(item.created_at) || !bounded(item.reserved_calls, 2) || !bounded(item.reserved_microusd, 1_000_000_000_000)) throw new Error("unavailable");
    events.push({ capability: item.capability as string, state: item.state as string, created_at: item.created_at, reserved_calls: item.reserved_calls, reserved_microusd: item.reserved_microusd, completed_at: validTime(item.completed_at) && Date.parse(item.completed_at) >= Date.parse(item.created_at) && item.state !== "RESERVED" ? item.completed_at : null, model_calls: nullableCount(item.model_calls, 2), tool_calls: nullableCount(item.tool_calls, 100), input_tokens: nullableCount(item.input_tokens, 1_000_000), output_tokens: nullableCount(item.output_tokens, 1_000_000), usage_status: ["unknown", "partial", "complete"].some(value => value === item.usage_status) ? item.usage_status as string : null });
  }
  if (data.status !== "AVAILABLE" && events.length) throw new Error("unavailable");
  return { status: data.status as Activity["status"], events };
}
const dollars = (microUsd: number) => (microUsd / 1_000_000).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });
export function OperationalActivity() {
  const heading = useRef<HTMLHeadingElement>(null);
  // Arrive from the "AI activity" shortcut: the panel mounts after evidence loads, so scroll once it exists.
  useEffect(() => { if (window.location.hash === "#ai-activity") { heading.current?.scrollIntoView({ block: "start" }); heading.current?.focus({ preventScroll: true }); } }, []);
  const [result, setResult] = useState<Activity>(), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  async function refresh() {
    setBusy(true); setError(false); setResult(undefined);
    try {
      const response = await fetch(`${API}/v1/operations/activity`, { method: "GET", headers: await authHeaders(), cache: "no-store", credentials: "omit", redirect: "error", signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error("unavailable");
      setResult(parseActivity(await response.json()));
    } catch { setError(true); }
    finally { setBusy(false); }
  }
  return <section id="ai-activity" aria-labelledby="operational-activity-title" className="card p-6">
    <h2 id="operational-activity-title" ref={heading} tabIndex={-1} className="type-section">AI activity</h2>
    <p className="mt-2 text-secondary">Optional model activity records for your account, when tracking is enabled. A record does not establish that live AI assistance is available in this Beta. Separate from the financial audit trail; it does not show whether your books are correct.</p>
    <Button className="mt-4" variant="secondary" disabled={busy} onClick={refresh}>{busy ? "Checking AI activity…" : "Check AI activity"}</Button>
    <div className="mt-4" aria-live="polite" aria-busy={busy}>
      {!result && !busy && !error && <p>Not checked yet. Choose Check AI activity to read your account snapshot.</p>}
      {busy && <p role="status">Checking AI activity. No financial action is taken.</p>}
      {error && <Alert tone="warning" title="AI activity unavailable"><p>We could not read this snapshot. Verify your access or try again. No AI use, approval or financial result is inferred.</p></Alert>}
      {result?.status === "DISABLED" && <Alert tone="info" title="AI activity tracking is off"><p>AI activity tracking is off in this environment. This is not evidence of AI use. Migration records remain independent.</p></Alert>}
      {result?.status === "UNAVAILABLE" && <Alert tone="warning" title="AI activity unavailable"><p>The activity store could not provide a snapshot. No AI use, approval or financial result is inferred.</p></Alert>}
      {result?.status === "AVAILABLE" && <>
        <p className="text-sm text-secondary">Latest 20 records only; not live monitoring. A reservation is not a charge and does not prove the AI ran. Unknown usage is shown as unknown.</p>
        {!result.events.length ? <p className="mt-3">No AI activity recorded for your account in this snapshot. This does not establish that none occurred earlier. Until AI advice is switched on, guidance comes from rules.</p> : <ul className="mt-4 space-y-4">{result.events.map((event, index) => <li key={index} className="rounded-lg border border-token p-4 [overflow-wrap:anywhere]">
          <p className="font-semibold capitalize">{event.capability.replaceAll("-", " ")} · {event.state.toLowerCase()}</p>
          <p className="text-sm">Created: <time dateTime={event.created_at}>{event.created_at}</time></p>
          {event.completed_at && <p className="text-sm">Outcome recorded: <time dateTime={event.completed_at}>{event.completed_at}</time></p>}
          <p className="mt-2 text-sm">Reserved: {event.reserved_calls} model {event.reserved_calls === 1 ? "call" : "calls"}, {dollars(event.reserved_microusd)}. A reservation is not a charge.</p>
          <p className="text-sm">Reported model calls: {event.model_calls ?? "unknown"} · Tool calls: {event.tool_calls ?? "unknown"} · Input tokens: {event.input_tokens ?? "unknown"} · Output tokens: {event.output_tokens ?? "unknown"} · Usage: {event.usage_status ?? "unknown"}</p>
          <p className="mt-2 text-sm text-secondary">{event.state === "RESERVED" ? "Capacity was reserved; execution and outcome are not established." : event.state === "COMPLETED" ? "An advisory outcome was recorded. This is not an accounting approval or financial verification." : event.state === "FALLBACK" ? "Fallback guidance was recorded; this does not establish a successful model response." : "An unavailable outcome was recorded; no successful inference is assumed."}</p>
        </li>)}</ul>}
      </>}
    </div>
  </section>;
}
