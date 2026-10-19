"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/primitives";
import { MappingEvidence } from "./MappingEvidence";
import { areaLabel } from "./PlanSummary";
import { bulkEligible, bulkItem, type BulkItem, type BulkOutcome } from "./bulk-approval";
import { matchText, riskText } from "./mapping-groups";
import type { MappingProposal } from "./types";

/**
 * Consent is possible only when the person ticked the box and the visible list, the checkbox sentence and
 * the button all name the same, non-zero count of rendered items.
 */
export function consentReady({ consent, listed, inSentence, inButton }: { consent: boolean; listed: number; inSentence: number; inButton: number }) {
  return consent && listed > 0 && listed === inSentence && listed === inButton;
}

const plural = (n: number) => `${n} ${n === 1 ? "mapping" : "mappings"}`;

/** Inspection and consent for approving low-risk mappings together, one recorded approval per item. */
export function BulkApproval({ mappings, editable, busy, run, onClose, outcome: shownOutcome, onOutcome }: {
  mappings: MappingProposal[];
  editable: boolean;
  busy: boolean;
  run: (set: BulkItem[]) => Promise<BulkOutcome>;
  onClose: () => void;
  /** Optional: the parent keeps the last result so it survives a remount. */
  outcome?: BulkOutcome;
  onOutcome?: (outcome: BulkOutcome | undefined) => void;
}) {
  const titleId = useId();
  const checkId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const [removed, setRemoved] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [listed, setListed] = useState(0);
  const [running, setRunning] = useState(false);
  const [ownOutcome, setOwnOutcome] = useState<BulkOutcome>();
  const outcome = onOutcome ? shownOutcome : ownOutcome;
  const setOutcome = (value: BulkOutcome | undefined) => { setOwnOutcome(value); onOutcome?.(value); };
  // Eligibility is read from the latest API response on every render, never from a stored list.
  const eligible = mappings.filter(bulkEligible);
  const set = eligible.filter(mapping => !removed.includes(mapping.id));
  const out = eligible.filter(mapping => removed.includes(mapping.id));
  const signature = useMemo(() => set.map(mapping => `${mapping.id}:${mapping.version}:${mapping.state}:${mapping.selected_target}`).join("|"), [set]);
  const n = set.length;

  useEffect(() => { heading.current?.focus(); }, []);
  // A different set needs fresh consent: nothing carries over between sets.
  useEffect(() => { setConsent(false); }, [signature]);
  // The approve control stays disabled until every item is rendered, not merely fetched.
  useEffect(() => { setListed(list.current?.querySelectorAll(":scope > li").length ?? 0); }, [signature]);

  const sentence = `I have reviewed these ${plural(n)} and approve each one as shown.`;
  const label = `Approve ${n} low-risk ${n === 1 ? "mapping" : "mappings"}`;
  const ready = editable && !busy && !running && consentReady({ consent, listed, inSentence: n, inButton: n });

  async function submit() {
    if (!ready) return;
    setRunning(true); setOutcome(undefined);
    try { setOutcome(await run(set.map(bulkItem))); }
    finally { setRunning(false); setConsent(false); }
  }

  return <section className="pm-bulk" aria-labelledby={titleId}>
    <div className="pm-bulk-head">
      <h3 id={titleId} ref={heading} tabIndex={-1}>Approve low-risk mappings together</h3>
      <Button variant="ghost" size="small" onClick={onClose} disabled={running}>Close</Button>
    </div>
    <p className="pm-bulk-intro">Each approval is recorded separately, with your name, through the same check as a single approval. High and medium risk, tax and sensitive mappings are never included. Remove anything you want to decide on its own.</p>
    {outcome && <BulkResult outcome={outcome} />}
    {n > 0 ? <>
      <ol ref={list} className="pm-bulk-list" aria-label={`Mappings in this set: ${n}`}>
        {set.map(mapping => <li key={mapping.id}>
          <div className="pm-bulk-row">
            <div className="min-w-0"><p className="pm-bulk-source">{mapping.source_label}</p>{mapping.source_value != null && <p className="pm-meta">Source value: {mapping.source_value}</p>}</div>
            <div className="min-w-0"><p className="pm-meta">Proposed</p><p className="pm-bulk-target">{mapping.selected_target}</p></div>
            <p className="pm-meta">{riskText(mapping.risk)} · {matchText(mapping.confidence)} · {areaLabel(mapping.area)}</p>
            <Button variant="secondary" size="small" aria-label={`Remove ${mapping.source_label} from this set`} disabled={running} onClick={() => setRemoved(current => [...current, mapping.id])}>Remove</Button>
          </div>
          <MappingEvidence mapping={mapping} label={`Evidence for ${mapping.source_label}`} />
        </li>)}
      </ol>
      <label className="pm-consent" htmlFor={checkId}>
        <input id={checkId} type="checkbox" checked={consent} disabled={running || !editable} onChange={event => setConsent(event.target.checked)} />
        <span>{sentence}</span>
      </label>
      <div className="pm-bulk-actions">
        <Button disabled={!ready} onClick={() => void submit()}>{running ? `Approving ${plural(n)} one at a time…` : label}</Button>
        <p className="pm-meta">Approvals are sent one at a time, in this order. If one is refused, the rest are not sent and nothing already approved is undone.</p>
      </div>
    </> : <p className="pm-bulk-empty" role="status">{eligible.length ? "Every low-risk mapping is removed from this set. Decide them one by one, or put them back." : outcome ? "No other mapping qualifies for approval together. Decide the rest one by one." : "No mapping qualifies for approval together right now. Decide each one on its own."}</p>}
    {out.length > 0 && <div className="pm-bulk-removed">
      <h4>Removed from this set · {out.length}</h4>
      <p className="pm-meta">These need an individual decision.</p>
      <ul>{out.map(mapping => <li key={mapping.id}><span>{mapping.source_label} → {mapping.selected_target}</span><Button variant="ghost" size="small" aria-label={`Put ${mapping.source_label} back in this set`} disabled={running} onClick={() => setRemoved(current => current.filter(id => id !== mapping.id))}>Put back</Button></li>)}</ul>
    </div>}
  </section>;
}

function BulkResult({ outcome }: { outcome: BulkOutcome }) {
  if (outcome.kind === "unread") return <div className="pm-bulk-result" data-tone="blocked" role="alert"><p><strong>Nothing was approved.</strong> The mappings could not be read again before sending: {outcome.message}</p><p>Read the migration again, then review the set.</p></div>;
  if (outcome.kind === "aborted") return <div className="pm-bulk-result" data-tone="blocked" role="alert">
    <p><strong>Nothing was approved.</strong> {outcome.stale.length === 1 ? "One mapping" : `${outcome.stale.length} mappings`} changed after you reviewed the set:</p>
    <ul>{outcome.stale.map(({ item, reason }) => <li key={item.id}>{item.label}: {reason}.</li>)}</ul>
    <p>Review the updated set before approving.</p>
  </div>;
  const { approved, failed, notAttempted } = outcome;
  const notApproved = failed ? [failed.item, ...notAttempted] : notAttempted;
  return <div className="pm-bulk-result" data-tone={failed ? "blocked" : "done"} role={failed ? "alert" : "status"}>
    {failed
      ? <p><strong>Stopped at {failed.item.label}.</strong> {approved.length} approved, each recorded separately. {failed.refused ? `${notApproved.length} not approved. ${failed.message}` : `${failed.item.label} was not confirmed: the connection failed, so it may or may not be recorded. The list below shows its current state after a fresh read.`} Nothing was retried or undone; decide the rest one by one.</p>
      : <p><strong>{approved.length} approved, each recorded separately.</strong></p>}
    {approved.length > 0 && <><p className="pm-meta">Approved</p><ul>{approved.map(item => <li key={item.id}>{item.label} → {item.target}: approved and recorded</li>)}</ul></>}
    {notApproved.length > 0 && <><p className="pm-meta">Not approved</p><ul>{notApproved.map(item => <li key={item.id}>{item.label} → {item.target}: {failed && item.id === failed.item.id ? failed.refused ? "refused" : "not confirmed, check its state in the list" : "not sent"}</li>)}</ul></>}
  </div>;
}
