"use client";
import { WatchGuide } from "@/components/academy/WatchGuide";

import type { ReactNode, RefObject } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/primitives";
import { Select } from "@/components/ui/forms";
import { AiStatusBadge, PlannedExample, StatusChip } from "@/components/v2/primitives";
import { V2_STATUS_LABEL, V2_STATUS_RECOVERY } from "@/components/v2/mapping-status";
import { BulkApproval } from "./BulkApproval";
import { IndependentReview } from "./IndependentReview";
import { AssistedAnalysis } from "./AssistedAnalysis";
import { MappingEvidence } from "./MappingEvidence";
import { MappingReconsideration } from "./MappingReconsideration";
import { areaLabel } from "./PlanSummary";
import { bulkEligible, bulkIneligibility, INELIGIBLE_TEXT, type BulkItem, type BulkOutcome } from "./bulk-approval";
import { chipStatus, GROUP_TITLE, groupMappings, groupOf, matchText, riskText, type MappingGroupId } from "./mapping-groups";
import type { MappingHistoryDecision, MappingProposal } from "./types";

export const mappingReviewed = (mapping: MappingProposal) => ["APPROVED", "MODIFIED"].includes(mapping.state);
/** The state label a mapping shows, in the V2 vocabulary: Needs review, Blocked, Rejected, Low risk, ready, Approved, Changed. */
export function mappingLabel(mapping: MappingProposal) {
  return V2_STATUS_LABEL[chipStatus(mapping)];
}

/** What the person can do next for a mapping that is not settled. Mirrors apply_mapping_decision and
 *  mapping_ready_for_handoff; it changes no rule and enables no action. */
export function mappingRecovery(mapping: MappingProposal): string | undefined {
  if (mapping.state === "BLOCKED") {
    const why = mapping.policy_reasons.length ? ` ${mapping.policy_reasons.join(" ")}` : "";
    return `Blocked: the rules can't accept this record as it stands.${why} It can't be approved or rejected. Save a compatible destination if one is offered, or correct the source record and check readiness again.`;
  }
  if (mapping.state === "REJECTED") {
    return "Rejected: this record stays out of the move, and the plan can't be approved while a mapping is rejected. Request reconsideration to change the decision.";
  }
  return undefined;
}

function ruleCheck(mapping: MappingProposal) {
  switch (mapping.state) {
    case "BLOCKED": return "failed. This mapping can't move as it stands.";
    case "REJECTED": return "you rejected this mapping, so it stays out of the move.";
    case "APPROVED": case "MODIFIED": return "decision recorded.";
    case "AUTO_ACCEPTABLE": return "passed. It still needs your approval.";
    default: return "needs your approval.";
  }
}

const GROUP_NOTE: Partial<Record<MappingGroupId, string>> = {
  needs_review: "Medium and high risk. Each needs your judgement.",
  blocked: `A blocked mapping failed a rule check. ${V2_STATUS_RECOVERY.blocked}`,
  rejected: "A mapping you reject stays out of the move and keeps Move locked until you change it. Ask to reconsider it to change the decision.",
  one_by_one: "Low risk, but each needs its own approval: the rules mark it as sensitive, or it is tax or already changed.",
};

export function MappingReview({ mappings, history, editable, busy, planApproved, decide, reconsider, runBulk, onReviewPlan, handoff, readinessBlocked = false }: {
  /** Open readiness findings (for example possible duplicate customers) are not linked to mappings,
   *  so approving together is switched off until the source data is corrected. Fails closed. */
  readinessBlocked?: boolean;
  mappings: MappingProposal[];
  history: MappingHistoryDecision[];
  editable: boolean;
  busy: boolean;
  planApproved: boolean;
  decide: (mapping: MappingProposal, action: "approve" | "reject" | "modify", target?: string) => Promise<void>;
  reconsider: (mapping: MappingProposal, path: string, body: unknown) => Promise<void>;
  runBulk: (set: BulkItem[]) => Promise<BulkOutcome>;
  onReviewPlan: () => void;
  handoff?: ReactNode;
}) {
  const [selectedId, setSelectedId] = useState<string>();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkOutcome, setBulkOutcome] = useState<BulkOutcome>();
  const [focusDetail, setFocusDetail] = useState(0);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const groups = groupMappings(mappings);
  const ordered = groups.flatMap(group => group.items);
  const pending = ordered.filter(mapping => !mappingReviewed(mapping));
  const decidedCount = mappings.length - pending.length;
  const ready = mappings.filter(bulkEligible);
  const firstOpen = pending.find(mapping => !["BLOCKED", "REJECTED"].includes(mapping.state)) ?? pending[0];
  const selected = mappings.find(mapping => mapping.id === selectedId) ?? firstOpen ?? ordered[0];
  useEffect(() => { if (focusDetail) detailHeading.current?.focus(); }, [focusDetail]);

  // While a request runs (including a batch), the queue cannot switch panes, so a batch result is never hidden.
  function select(id: string) { if (busy) return; setBulkOpen(false); setSelectedId(id); setFocusDetail(n => n + 1); }
  function reviewNext() {
    const rest = pending.filter(mapping => mapping.id !== selected?.id);
    const next = rest.find(mapping => !["BLOCKED", "REJECTED"].includes(mapping.state)) ?? rest[0];
    if (next) select(next.id);
  }

  return <section className="pm-map" aria-labelledby="mapping-heading">
    <div className="pm-map-head">
      <div className="min-w-0">
        <h2 id="mapping-heading">Review your mappings</h2>
        <p className="pm-map-count"><strong>{decidedCount} of {mappings.length} decided.</strong> Approving a mapping does not approve the migration plan.</p>
      </div>
      {handoff ?? (!pending.length && mappings.length > 0 ? <Button disabled={busy} onClick={onReviewPlan}>Review migration plan</Button> : null)}
    </div>
    {mappings.length > 0 ? <div className="pm-map-grid">
      <nav className="pm-queue" aria-label="Mapping queue">
        {groups.map(group => <QueueGroup key={group.id} id={group.id} items={group.items} selectedId={bulkOpen ? undefined : selected?.id} onSelect={select} disabled={busy}
          action={group.id === "ready" && editable ? <div className="pm-queue-bulk">
            <Button variant="secondary" disabled={busy || !ready.length || readinessBlocked} aria-expanded={bulkOpen} onClick={() => setBulkOpen(true)}>Approve {ready.length} low-risk {ready.length === 1 ? "mapping" : "mappings"}</Button>
            <p className="pm-meta">{readinessBlocked ? "Approving together is off while readiness findings are open. Decide each mapping on its own." : "Each approval is recorded separately. High and medium risk are never included."}</p>
          </div> : undefined} />)}
      </nav>
      <div className="pm-detail-pane">
        {/* Stays mounted while the post-approval read runs (editable is briefly false), so the result stays visible. */}
        {bulkOpen ? <BulkApproval mappings={mappings} editable={editable} busy={busy} run={runBulk} outcome={bulkOutcome} onOutcome={setBulkOutcome} onClose={() => { setBulkOpen(false); setFocusDetail(n => n + 1); }} />
          : selected ? <MappingDetail key={selected.id} mapping={selected} history={history} editable={editable} busy={busy} decide={decide} reconsider={reconsider} headingRef={detailHeading}
            next={mappingReviewed(selected) && pending.length > 0 ? <Button disabled={busy} onClick={reviewNext}>Review next mapping</Button> : undefined} /> : null}
      </div>
    </div> : <p className="pm-empty">No mappings have been prepared. Return to your plan to prepare them; no review is assumed.</p>}
    {planApproved && <p className="pm-meta">The plan is approved. These decisions are kept with it.</p>}
  </section>;
}

function QueueGroup({ id, items, selectedId, onSelect, action, disabled = false }: { id: MappingGroupId; items: MappingProposal[]; selectedId?: string; onSelect: (id: string) => void; action?: ReactNode; disabled?: boolean }) {
  const titleId = useId();
  return <section className="pm-group" data-group={id} aria-labelledby={titleId}>
    <h3 id={titleId} className="pm-group-title">{GROUP_TITLE[id]} <span className="pm-count">({items.length})</span></h3>
    {GROUP_NOTE[id] && <p className="pm-group-note">{GROUP_NOTE[id]}</p>}
    <ul className="pm-queue-list">{items.map(mapping => <li key={mapping.id}>
      <button type="button" className="pm-queue-item" disabled={disabled} aria-current={selectedId === mapping.id ? "true" : undefined} onClick={() => onSelect(mapping.id)}>
        <span className="pm-queue-name">{mapping.source_label}</span>
        <span className="pm-queue-meta"><StatusChip status={chipStatus(mapping)} />{mapping.risk !== "LOW" && <span>{riskText(mapping.risk)}</span>}<span>{matchText(mapping.confidence)}</span></span>
      </button>
    </li>)}</ul>
    {action}
  </section>;
}

function MappingDetail({ mapping, history, editable, busy, decide, reconsider, headingRef, next }: {
  mapping: MappingProposal; history: MappingHistoryDecision[]; editable: boolean; busy: boolean;
  decide: (mapping: MappingProposal, action: "approve" | "reject" | "modify", target?: string) => Promise<void>;
  reconsider: (mapping: MappingProposal, path: string, body: unknown) => Promise<void>;
  headingRef: RefObject<HTMLHeadingElement | null>; next?: ReactNode;
}) {
  const [target, setTarget] = useState("");
  const blocked = mapping.state === "BLOCKED";
  const [changing, setChanging] = useState(blocked);
  const terminal = ["APPROVED", "MODIFIED", "REJECTED"].includes(mapping.state);
  const identityOnly = ["general_configuration", "products_services"].includes(mapping.area);
  // Only destinations the server's compatibility rules accept; never a target a save would refuse.
  // A blocked mapping can only be cleared by saving a destination, so a compatible current one stays listed.
  const destinations = (mapping.supported_targets ?? []).filter(option => (blocked || option !== mapping.selected_target) && (!identityOnly || option === mapping.recommended_target));
  const alternatives = destinations.filter(option => option !== mapping.selected_target);
  const canDecide = editable && !busy && !terminal;
  const recovery = mappingRecovery(mapping);
  const why = groupOf(mapping) === "one_by_one" ? bulkIneligibility(mapping).filter(reason => reason !== "risk") : [];
  return <article className="pm-detail min-w-0 [overflow-wrap:anywhere]" aria-label={`${mapping.source_label} mapping`}>
    <div className="pm-detail-top"><StatusChip status={chipStatus(mapping)} /><span>{riskText(mapping.risk)} · {matchText(mapping.confidence)}</span><span>{areaLabel(mapping.area)}</span></div>
    <div className="mapping-review-row pm-compare">
      {/* Valid source names and targets can be long and unbroken; no column may outgrow the card. */}
      <div className="min-w-0 pm-side"><p className="pm-meta">In your old books</p><h3 ref={headingRef} tabIndex={-1} className="pm-side-name">{mapping.source_label}</h3>{mapping.source_id !== mapping.source_label && <p className="pm-meta">{mapping.source_id}</p>}{mapping.source_value != null && <p className="pm-side-value">Source setting: {mapping.source_value}</p>}</div>
      <span className="min-w-0 pm-arrow" aria-hidden="true">→</span>
      <div className="min-w-0 pm-side pm-side-new"><p className="pm-meta">Proposed in your new books</p><p className="pm-side-name">{mapping.selected_target}</p>
        {mapping.state === "MODIFIED" && <p className="pm-meta">Originally suggested: {mapping.recommended_target}</p>}
        {!terminal && alternatives.length > 0 && <p className="pm-meta">Other compatible {alternatives.length === 1 ? "target" : "targets"}: {alternatives.join(", ")}</p>}
      </div>
    </div>
    {recovery && <p className="mapping-recovery pm-recovery" data-state={mapping.state}>{recovery}</p>}
    <div className="pm-rule"><p><strong>Rule check:</strong> {ruleCheck(mapping)}</p><p className="pm-rationale">{mapping.rationale}</p>
      {mapping.risk !== "LOW" && <p className="pm-meta">Confidence is not a guarantee and cannot clear a policy blocker.</p>}
      {why.length > 0 && <p className="pm-meta">Why this needs its own approval: {why.map(reason => INELIGIBLE_TEXT[reason]).join(" ")}</p>}
    </div>
    <MappingEvidence mapping={mapping} open={!terminal} />
    {editable && !terminal && <div className="pm-decide">
      {destinations.length === 0 && <p className="pm-meta">{blocked ? "No compatible destination is available. This mapping stays blocked until the source data is corrected; it cannot be approved or rejected here." : "No other supported destination. Approve this mapping, or reject it; a rejected mapping keeps the plan from being approved until it is reconsidered."}</p>}
      {identityOnly && <p className="pm-meta">This synthetic adapter retains the source product or configuration treatment. Conversions and changed treatments are unavailable.</p>}
      {changing && destinations.length > 0 && <div className="pm-change">
        <Select label={`Change destination for ${mapping.source_label}`} value={target} onChange={event => setTarget(event.target.value)} disabled={!canDecide}>
          <option value="">Choose a supported destination</option>
          {destinations.map(option => <option key={option} value={option}>{option === mapping.selected_target ? `${option} (keep current)` : option}</option>)}
        </Select>
        {blocked && <p className="pm-meta">This recommendation is blocked. Save a compatible destination to clear it; a blocked mapping cannot be approved or rejected as it stands.</p>}
      </div>}
      <div className="pm-decide-actions">
        {/* A blocked mapping can only be changed to a compatible target (apply_mapping_decision), so no approve control is shown. */}
        {!blocked && <Button variant={target ? "secondary" : "primary"} disabled={!canDecide} onClick={() => void decide(mapping, "approve")}>Approve as {mapping.selected_target}</Button>}
        {destinations.length > 0 && (changing
          ? <Button variant={target ? "primary" : "secondary"} disabled={!canDecide || !target || !destinations.includes(target)} onClick={() => void decide(mapping, "modify", target)}>Save changed mapping</Button>
          : <Button variant="secondary" disabled={!canDecide} onClick={() => setChanging(true)}>Change mapping</Button>)}
        {!blocked && <Button variant="ghost" className="pm-quiet" disabled={!canDecide} onClick={() => void decide(mapping, "reject")}>Reject</Button>}
      </div>
    </div>}
    {mapping.decided_at && <p className="pm-meta pm-decided">Decision by {mapping.decided_by} · <time>{mapping.decided_at}</time></p>}
    {next && <div className="pm-next">{next}</div>}
    {editable && <MappingReconsideration mapping={mapping} history={history} submit={(path, body) => reconsider(mapping, path, body)} />}
    <p className="pm-footnote">You approve every change. Advice never changes your books. Your decision is recorded with your name.</p>
    <div className="pm-second-actions"><WatchGuide lesson="04" label="Watch Advisor guide"/><WatchGuide lesson="05" label="Watch Reviewer guide"/></div>
    <SecondOpinion mapping={mapping} />
  </article>;
}

function SecondOpinion({ mapping }: { mapping: MappingProposal }) {
  const titleId = useId();
  const analysisPreview = process.env.NEXT_PUBLIC_SYNTHETIC_ANALYSIS_ENABLED === "true" && mapping.source_id === "account-clearing";
  return <section className="pm-second" aria-labelledby={titleId}>
    <div className="pm-second-head"><h4 id={titleId}>Want a second opinion?</h4>{analysisPreview ? <span className="pm-meta">Synthetic preview · explicit invocation</span> : <AiStatusBadge withDetail />}</div>
    {analysisPreview ? <AssistedAnalysis key={`analysis:${mapping.id}:${mapping.state}:${mapping.selected_target}`} mappingId={mapping.id} /> : <>
    <p className="pm-meta">The Advisor will explain a mapping and the Reviewer will challenge it. Neither decides: you approve every change, and advice never changes your books.</p>
    <div className="pm-second-actions"><button type="button" className="button secondary small" disabled>Ask the Advisor</button><button type="button" className="button secondary small" disabled>Ask the Reviewer</button></div>
    <PlannedExample><p>Advisor: “Here is why the rules suggest this target, and what to check in your old books before you approve it.”</p><p>Reviewer: “Here is what could be wrong with this mapping, and the evidence that would settle it.”</p></PlannedExample>
    </>}
    {mapping.area === "chart_of_accounts" && <IndependentReview key={`${mapping.id}:${mapping.state}:${mapping.selected_target}`} mappingId={mapping.id} />}
  </section>;
}
