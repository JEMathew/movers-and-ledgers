"use client";
import { useId, useRef, useState } from "react";
import { Badge, Button, Select } from "@/components/ui";
import type { SessionView, TraceRow } from "./session";

const PAGE_SIZE = 8;
/** Only pages records already supplied by the authorized, redacted snapshot. */
export function EvidenceRecords({ view }: { view: SessionView }) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [filter, setFilter] = useState("decisions");
  const [page, setPage] = useState(0);
  const groups: { id: string; title: string; rows: TraceRow[]; note: string }[] = [
    { id: "decisions", title: "Human approvals and decisions", rows: view.decisions, note: "Recorded decisions only. A past approval does not approve a later task or erase a rejection." },
    { id: "checks", title: "Deterministic checks", rows: view.checks, note: "Rule results from the supplied validation report and first task. Exact financial terms stay in Verify and Start." },
    { id: "activity", title: "Agent activity and tools", rows: view.activity, note: "Actions and recommendations carry their recorded provenance. Agent advice is not financial verification or consent." },
    { id: "events", title: "Lifecycle audit", rows: view.events, note: "Recorded workflow events. A lifecycle event alone is not proof of financial correctness." },
  ];
  const selected = groups.find(group => group.id === filter)!;
  const pages = Math.max(1, Math.ceil(selected.rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  // API order is retained; newest supplied records are shown first, not sorted by invented times.
  const records = [...selected.rows].reverse().slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  function changePage(next: number) { setPage(next); heading.current?.focus(); }
  return <section className="evidence-records" aria-labelledby={`${id}-heading`}>
    <div className="max-w-2xl"><Select label="Evidence category" value={filter} onChange={event => { setFilter(event.target.value); setPage(0); }}>{groups.map(group => <option key={group.id} value={group.id}>{group.title} ({group.rows.length} supplied)</option>)}</Select></div>
    <h2 id={`${id}-heading`} ref={heading} tabIndex={-1} className="type-section mt-4">{selected.title}</h2>
    <p className="mt-2 text-secondary">{selected.note}</p>
    <p className="mt-2 text-sm" role="status">{records.length ? `Showing ${current * PAGE_SIZE + 1}–${current * PAGE_SIZE + records.length} of ${selected.rows.length} supplied records · page ${current + 1} of ${pages}.` : "No records supplied for this category. Absence is not a passed check or an approval."}</p>
    <ol className="mt-3 space-y-3">{records.map((row, index) => <li key={`${filter}:${current}:${row.id}:${index}`}>
      <details className="public-disclosure evidence-record">
        <summary><Badge>{row.kind}</Badge><strong className="block mt-2">{row.title || "Untitled recorded event"}</strong><span className="block mt-1 text-sm">{row.status || "Status not supplied"} · {row.actor || "Actor not supplied"}</span></summary>
        <div className="public-detail">
          <p>{row.time ? <time dateTime={row.time}>{row.time}</time> : "Time not supplied"}</p>
          {row.tool && <p>Tool: {row.tool}</p>}
          <p>Audit: {row.id || "Not recorded"}</p>
          {row.evidence.length ? <ul className="space-y-1">{row.evidence.map((ref, i) => <li key={i}>{ref}</li>)}</ul> : <p>No additional evidence references supplied.</p>}
        </div>
      </details>
    </li>)}</ol>
    <div className="mt-4 flex flex-wrap gap-3"><Button variant="secondary" disabled={current === 0} onClick={() => changePage(current - 1)}>Previous records</Button><Button variant="secondary" disabled={current + 1 >= pages} onClick={() => changePage(current + 1)}>Next records</Button></div>
    <details className="public-disclosure mt-4"><summary>Snapshot and reference limits</summary><div className="public-detail"><p>All {groups.reduce((total, group) => total + group.rows.length, 0)} projected records supplied by this read are accessible by category and page. This is not a complete-history claim or live monitoring. A newer read can change counts.</p><p>Only the latest supplied validation report is projected. References are excerpts: up to 12 per record and 160 characters per reference; labels are capped at 400 characters. No raw financial records, private reasoning or prompts appear here. Inspect exact checks and consent in the original task.</p></div></details>
  </section>;
}
