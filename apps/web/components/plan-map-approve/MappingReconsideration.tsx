"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/primitives";

import type { MappingHistoryDecision, MappingProposal } from "./types";

export function MappingReconsideration({ mapping, history, submit }: {
  mapping: MappingProposal;
  history: MappingHistoryDecision[];
  submit: (path: string, body: unknown) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const request = useRef<{ key: string; id: string } | undefined>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  const interacted = useRef(false);
  const records = mapping.reconsiderations ?? [];
  const pending = records.find(r => r.state === "REVIEW_REQUIRED");
  const prior = history.filter(d => d.affected_entity === mapping.id).at(-1);
  const lastReviewState = records.at(-1)?.state;
  useEffect(() => { if (interacted.current) heading.current?.focus(); }, [lastReviewState]);
  if (mapping.state !== "REJECTED" && records.length === 0) return null;

  async function perform(path: string, body: unknown) {
    interacted.current = true;
    setBusy(true); setError(undefined);
    try { await submit(path, body); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Review could not be recorded."); }
    finally { setBusy(false); }
  }

  return <section className="mt-5 border-t border-token pt-4" aria-label={`${mapping.source_label} reconsideration`}>
    <h4 ref={heading} tabIndex={-1} className="font-bold">Prior decision history</h4>
    <p className="mt-2 text-sm">A final rejection is retained. Requesting reconsideration does not approve it or allow migration.</p>
    <ul className="mt-2 space-y-2 text-sm">{history.filter(d => d.affected_entity === mapping.id).map(d => <li key={d.id}>
      {d.decision} · {d.selected_value} · {d.actor} · <time>{d.occurred_at}</time> · Decision {d.id}
    </li>)}</ul>
    {mapping.state === "REJECTED" && <p className="mt-2 text-sm">Final rejection: {mapping.decided_by} · {mapping.decided_at}. Reason: {mapping.decision_comment || "No comment supplied"}</p>}
    {records.map(r => <div key={r.id} className="mt-3 rounded-lg bg-[var(--surface-subtle)] p-3 text-sm">
      <p>Original rejection {r.prior_decision_id}: {r.prior_target} · {r.prior_actor} · {r.prior_timestamp}</p>
      <p>Original reason: {r.prior_reason || "No comment supplied"}</p>
      <p>Original evidence: {r.prior_evidence.join(", ")}</p>
      <p>Reconsideration {r.id}: {r.reason}</p>
      <p>New proposed mapping: {mapping.source_label} → {r.proposed_target}</p>
      <p>Requested by {r.requested_by} · {r.requested_at}</p>
      <p>Review state: {r.state}</p>
      {r.reviewed_at && <p>New decision {r.decision_id}: {r.reviewed_by} · {r.reviewed_at}</p>}
    </div>)}
    {pending ? <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="secondary" disabled={busy} onClick={() => perform(`/reconsiderations/${pending.id}/review`, {action: "approve", comment: "Explicit human review of the displayed reconsideration"})}>Approve reconsideration</Button>
      <Button disabled={busy} variant="secondary" onClick={() => perform(`/reconsiderations/${pending.id}/review`, {action: "reject", comment: "Reconsideration rejected after human review"})}>Reject reconsideration</Button>
    </div> : mapping.state === "REJECTED" && <form className="mt-3" onSubmit={event => {
      event.preventDefault();
      if (!prior || !reason.trim() || busy) return;
      const key = `${prior.id}:${reason.trim()}`;
      if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
      void perform("/reconsiderations", { request_id: request.current.id, prior_decision_id: prior.id,
        reason: reason.trim(), proposed_target: mapping.selected_target });
    }}>
      <p className="text-sm">Proposed mapping: {mapping.source_label} → {mapping.selected_target}</p>
      <label className="mt-2 block text-sm">Reason for reconsideration
        <textarea required maxLength={1000} className="field-control mt-2 w-full" value={reason} onChange={event => setReason(event.target.value)} />
      </label>
      <Button variant="secondary" className="mt-2" type="submit" disabled={busy || !reason.trim() || !prior}>Request reconsideration</Button>
    </form>}
    {error && <p className="mt-2" role="alert">{error} No approval is assumed. Refresh after a concurrent change.</p>}
    <p className="mt-2 text-sm text-secondary" role="status">{busy ? "Recording governed review…" : "Only the authenticated workspace owner may request or review. A separate explicit approval is required."}</p>
  </section>;
}
