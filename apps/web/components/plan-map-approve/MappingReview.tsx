"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { Select } from "@/components/ui/forms";
import { MappingReconsideration } from "./MappingReconsideration";
import { areaLabel } from "./PlanSummary";
import type { MappingHistoryDecision, MappingProposal } from "./types";

export const mappingReviewed = (mapping: MappingProposal) => ["APPROVED", "MODIFIED"].includes(mapping.state);
export function mappingLabel(mapping: MappingProposal, planApproved: boolean) {
  if (mapping.state === "MODIFIED") return "Changed";
  if (mapping.state === "APPROVED") return planApproved ? "Approved" : "Reviewed";
  if (["BLOCKED", "REJECTED", "REVIEW_REQUIRED"].includes(mapping.state)) return "Needs attention";
  return "Suggested";
}

export function MappingReview({ mappings, history, editable, busy, planApproved, decide, reconsider, onReviewPlan, handoff }: {
  mappings: MappingProposal[];
  history: MappingHistoryDecision[];
  editable: boolean;
  busy: boolean;
  planApproved: boolean;
  decide: (mapping: MappingProposal, action: "approve" | "reject" | "modify", target?: string) => Promise<void>;
  reconsider: (mapping: MappingProposal, path: string, body: unknown) => Promise<void>;
  onReviewPlan: () => void;
  handoff?: ReactNode;
}) {
  const [reviewing, setReviewing] = useState<string>();
  const [targets, setTargets] = useState<Record<string, string>>({});
  const cards = useRef(new Map<string, HTMLElement>());
  const pending = mappings.filter(mapping => !mappingReviewed(mapping));
  const reviewNext = () => {
    const next = pending.find(mapping => !["BLOCKED", "REJECTED"].includes(mapping.state)) ?? pending[0];
    if (!next) return;
    setReviewing(next.id);
    cards.current.get(next.id)?.focus();
    cards.current.get(next.id)?.scrollIntoView?.({ block: "start" });
  };
  const areas = [...new Set(mappings.map(mapping => mapping.area))];
  const datasetByArea: Record<string, string> = { chart_of_accounts: "accounts", customers: "customers", vendors: "vendors", products_services: "products", tax_configuration: "taxes", general_configuration: "configuration" };
  return <section className="mt-8" aria-labelledby="mapping-heading">
    <div className="panel flex flex-wrap items-center justify-between gap-5 p-6">
      <div><h2 id="mapping-heading" className="type-section">Review Your Mappings</h2><p className="mt-2 text-secondary">{mappings.length - pending.length} of {mappings.length} reviewed. Confirming a mapping does not approve the migration plan.</p></div>
      {handoff ?? (pending.length ? <Button disabled={!editable || busy} onClick={reviewNext}>Review {pending.length} {pending.length === 1 ? "Mapping" : "Mappings"}</Button> : <Button disabled={busy || !mappings.length} onClick={onReviewPlan}>Review Migration Plan</Button>)}
    </div>
    {areas.map(area => <section key={area} className="mt-8" aria-label={areaLabel(area)}>
      <h3 className="type-card">{areaLabel(area)}</h3>
      <div className="mt-4 grid gap-4">
        {mappings.filter(mapping => mapping.area === area).map(mapping => {
          const terminal = ["APPROVED", "MODIFIED", "REJECTED"].includes(mapping.state);
          const identityOnly = ["general_configuration", "products_services"].includes(mapping.area);
          // Only destinations the server's compatibility rules accept; never a target a save would refuse.
          // A blocked mapping can only be cleared by saving a destination, so a compatible current one stays listed.
          const blocked = mapping.state === "BLOCKED";
          const destinations = (mapping.supported_targets ?? []).filter(target => (blocked || target !== mapping.selected_target) && (!identityOnly || target === mapping.recommended_target));
          const canDecide = editable && !busy && !terminal;
          const open = reviewing === mapping.id;
          const relevant = mapping.evidence.filter(evidence => evidence.startsWith("mapping-rule:") || evidence.includes(`:${datasetByArea[mapping.area]}:`));
          const shownEvidence = relevant.length ? relevant : mapping.evidence;
          const context = mapping.evidence.filter(evidence => !shownEvidence.includes(evidence));
          return <Card key={mapping.id} className={`min-w-0 [overflow-wrap:anywhere] ${open ? "border-[var(--primary)]" : ""}`} tabIndex={-1} aria-label={`${mapping.source_label} mapping`}>
            <div ref={node => { if (node) cards.current.set(mapping.id, node); else cards.current.delete(mapping.id); }} tabIndex={-1} className="mapping-review-row grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              {/* Valid source names and targets can be long and unbroken; no column may outgrow the card. */}
              <div className="min-w-0"><p className="type-meta">Source</p><h4 className="mt-1 font-bold">{mapping.source_label}</h4><p className="mt-1 text-xs text-secondary">{mapping.source_id}</p>{mapping.source_value != null && <p className="mt-2 text-sm">Source setting: {mapping.source_value}</p>}</div>
              <div className="min-w-0"><p className="type-meta">Proposed destination</p><p className="mt-1 font-bold">{mapping.selected_target}</p>{mapping.state === "MODIFIED" && <p className="mt-1 text-xs text-secondary">Originally suggested: {mapping.recommended_target}</p>}</div>
              <div className="min-w-0"><Badge>{mappingLabel(mapping, planApproved)}</Badge></div>
            </div>
            <p className="mt-4 text-sm leading-6 text-secondary">{mapping.rationale}</p>
            {mapping.risk !== "LOW" && <p className="mt-2 text-sm font-semibold">{mapping.risk === "HIGH" ? "High" : "Medium"} risk · {Math.round(mapping.confidence * 100)}% recommendation confidence. Confidence cannot clear a policy blocker.</p>}
            <details open={open} className="mt-4 rounded-lg bg-[var(--surface-subtle)] p-4 text-sm"><summary className="cursor-pointer font-semibold">Evidence and Policy · {shownEvidence.length} direct {shownEvidence.length === 1 ? "reference" : "references"}</summary><ul className="mt-2 space-y-1 text-secondary">{shownEvidence.map(evidence => <li key={evidence}>{evidence}</li>)}{mapping.policy_reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>{context.length > 0 && <details className="mt-3"><summary className="cursor-pointer font-semibold">Additional Planning Context · {context.length} references</summary><ul className="mt-2 space-y-1 text-secondary">{context.map(evidence => <li key={evidence}>{evidence}</li>)}</ul></details>}</details>
            {mapping.decided_at && <p className="mt-3 break-all text-xs text-secondary">Decision by {mapping.decided_by} · <time>{mapping.decided_at}</time></p>}
            {editable && !terminal && <div className="mt-4">
              <Button className="h-auto max-w-full text-left" variant="secondary" size="small" aria-expanded={open} onClick={() => setReviewing(open ? undefined : mapping.id)}>Review {mapping.source_label}</Button>
              {open && <div className="mt-4 border-t border-token pt-4">
                {destinations.length > 0 ? <Select label={`Change destination for ${mapping.source_label}`} value={targets[mapping.id] ?? ""} onChange={event => setTargets(current => ({ ...current, [mapping.id]: event.target.value }))} disabled={!canDecide}>
                  <option value="">Choose a supported destination</option>
                  {destinations.map(target => <option key={target} value={target}>{target === mapping.selected_target ? `${target} (keep current)` : target}</option>)}
                </Select> : <p className="text-sm text-secondary">{blocked ? "No compatible destination is available. This mapping stays blocked until the source data is corrected; it cannot be confirmed or rejected here." : "No other supported destination. Confirm this mapping, or reject it to keep it out of the plan."}</p>}
                {identityOnly && <p className="mt-2 text-sm text-secondary">This synthetic adapter retains the source product or configuration treatment. Conversions and changed treatments are unavailable.</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={!canDecide || mapping.state === "BLOCKED"} onClick={() => void decide(mapping, "approve")}>Confirm Mapping</Button>
                  {destinations.length > 0 && <Button variant="secondary" disabled={!canDecide || !targets[mapping.id] || !destinations.includes(targets[mapping.id])} onClick={() => void decide(mapping, "modify", targets[mapping.id])}>Save Changed Mapping</Button>}
                  {!blocked && <Button variant="ghost" disabled={!canDecide} onClick={() => void decide(mapping, "reject")}>Reject Mapping</Button>}
                </div>
                {blocked && destinations.length > 0 && <p className="mt-3 text-sm text-secondary">This recommendation is blocked. Save a compatible destination to clear it; a blocked mapping cannot be confirmed or rejected as it stands.</p>}
              </div>}
            </div>}
            {editable && <MappingReconsideration mapping={mapping} history={history} submit={(path, body) => reconsider(mapping, path, body)} />}
          </Card>;
        })}
      </div>
    </section>)}
    {!mappings.length && <p className="mt-6 text-secondary">No mappings have been prepared. Return to your plan to prepare them; no review is assumed.</p>}
  </section>;
}
