"use client";

import { useState } from "react";
import type { RefObject } from "react";
import { BadgeCheck, CheckCircle2, CircleAlert, Database, Layers, ListChecks, Play, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { Tile, Tiles } from "@/components/ui/tiles";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Button, Panel } from "@/components/ui/primitives";
import { areaLabel } from "./PlanSummary";
import { mappingReviewed } from "./MappingReview";
import type { MappingProposal, MigrationPlan } from "./types";

export function ApprovalReview({ plan, mappings, canApprove, approved, busy, readConfirmed, assessmentBlocked, fallbackFocusRef, approve }: {
  plan: MigrationPlan;
  mappings: MappingProposal[];
  canApprove: boolean;
  approved: boolean;
  busy: boolean;
  readConfirmed: boolean;
  assessmentBlocked: boolean;
  fallbackFocusRef: RefObject<HTMLElement | null>;
  approve: () => Promise<boolean>;
}) {
  const [confirm, setConfirm] = useState(false);
  const reviewed = mappings.filter(mappingReviewed).length;
  const configs = mappings.filter(mapping => ["tax_configuration", "general_configuration"].includes(mapping.area));
  const unsupported = mappings.filter(mapping => ["general_configuration", "products_services"].includes(mapping.area) && mapping.selected_target !== mapping.recommended_target);
  const blocked = plan.blockers.length > 0 || assessmentBlocked || unsupported.length > 0;
  // Long unbroken names wrap here and in the consent dialog, which inherits from this section.
  return <section className="mt-8 min-w-0 space-y-6 [overflow-wrap:anywhere]" aria-label="Migration plan approval">
    <Panel className="decision-card" data-state={approved ? "approved" : blocked ? "blocked" : "ready"}><h2 className="type-section">Consequence of Approval</h2>
      {approved ? <p className="decision-status" role="status"><CheckCircle2 size={20} aria-hidden="true"/>Plan approved. Starting migration is a separate step.</p> : blocked ? <p className="decision-status" role="status"><CircleAlert size={20} aria-hidden="true"/>Approval unavailable until blockers are resolved.</p> : null}
      <Tiles label="Plan figures">
        <Tile icon={ListChecks} label="Mappings reviewed" value={`${reviewed} of ${mappings.length}`} tone={reviewed === mappings.length ? "success" : "warning"} status={reviewed === mappings.length ? "All reviewed" : `${mappings.length - reviewed} to review`}/>
        <Tile icon={Database} label="Source records" value={plan.summary ? plan.summary.record_count.toLocaleString() : "—"} status={plan.summary ? "In scope" : "Summary unavailable"}/>
        <Tile icon={Layers} label="Batches" value={plan.summary ? plan.summary.batches.length : "—"} status={plan.summary ? "In scope" : "Summary unavailable"}/>
        <Tile icon={blocked ? ShieldAlert : ShieldCheck} label="Hard blockers" value={plan.blockers.length + unsupported.length + (assessmentBlocked ? 1 : 0) || (blocked ? "Yes" : "None")} tone={blocked ? "warning" : "success"} status={blocked ? "Blocked: resolve first" : "Clear"}/>
      </Tiles>
      <ol className="decision-flow" aria-label="Approval process">
        <li data-state={reviewed === mappings.length ? "done" : "current"}><span className="flow-icon" aria-hidden="true"><ListChecks size={18}/></span><strong>Review</strong><span>Scope and mappings</span></li>
        <li data-state={approved ? "done" : reviewed === mappings.length && !blocked ? "current" : "next"}><span className="flow-icon" aria-hidden="true"><UserCheck size={18}/></span><strong>Approve</strong><span>Your recorded consent</span></li>
        <li data-state="next"><span className="flow-icon" aria-hidden="true"><Play size={18}/></span><strong>Start migration</strong><span>A separate step you take</span></li>
        <li data-state="next"><span className="flow-icon" aria-hidden="true"><BadgeCheck size={18}/></span><strong>Reconcile and verify</strong><span>Rules check the result</span></li>
      </ol>
      <p className="mt-3 text-secondary">Approval records your consent to this scope and the reviewed mappings, with your authenticated identity and a server timestamp. It enables the separate Start Migration step for this synthetic target. It does not run migration, apply later setup changes, or declare your books validated.</p>
      {readConfirmed && plan.approval ? <div className="mt-4 break-all text-sm"><p>Approved by {plan.approval.actor}</p><p className="mt-1">Approved at <time>{plan.approval.approved_at}</time></p><p className="mt-1 text-secondary">Decision {plan.approval.decision_id}</p></div> : approved ? <p className="mt-4 text-sm text-secondary">The workflow records an earlier approval. Reviewer details are unavailable for this legacy plan; no new consent is inferred.</p> : <Button className="mt-5" disabled={!canApprove || blocked || busy} onClick={() => setConfirm(true)}>Approve Migration Plan</Button>}
    </Panel>
    <Panel><h2 className="type-section">Review Before Approval</h2><p className="mt-2 text-sm text-secondary">{plan.summary?.company_name ?? "This migration"}</p>
      <div className="review-tables">
        <table className="data-table"><caption>Mappings by area</caption><thead><tr><th scope="col">Area</th><th scope="col" className="num">Mappings</th><th scope="col">Status</th></tr></thead><tbody>{[...new Set(mappings.map(mapping => mapping.area))].map(area => { const all = mappings.filter(mapping => mapping.area === area); const done = all.filter(mappingReviewed).length; return <tr key={area}><th scope="row">{areaLabel(area)}</th><td className="num">{all.length}</td><td><span className="status-text" data-tone={done === all.length ? "success" : "warning"}>{done === all.length ? <CheckCircle2 size={15} aria-hidden="true"/> : <CircleAlert size={15} aria-hidden="true"/>}{done === all.length ? "Reviewed" : `${all.length - done} to review`}</span></td></tr>; })}</tbody></table>
        {plan.summary ? <table className="data-table"><caption>Included objects and batches</caption><thead><tr><th scope="col">Batch</th><th scope="col" className="num">Records</th></tr></thead><tbody>{plan.summary.batches.map(batch => <tr key={batch.dataset}><th scope="row">{batch.label}</th><td className="num">{batch.record_count.toLocaleString()}</td></tr>)}</tbody></table> : <p className="text-sm text-secondary">Object-count summary unavailable for this earlier plan.</p>}
      </div>
    </Panel>
    <Alert tone={blocked ? "warning" : "success"} title={blocked ? "Unresolved blockers · approval unavailable" : "No unresolved hard readiness blockers"}>
      <ul className="mt-2 list-disc space-y-1 pl-5 [overflow-wrap:anywhere]">{plan.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}{unsupported.map(mapping => <li key={mapping.id}>{mapping.source_label}: this synthetic adapter cannot apply the changed destination treatment.</li>)}</ul>
      <p className="mt-2">{blocked ? "Correct the source data before migration. A mapping decision or plan approval cannot waive this gate." : approved ? "Plan approval is recorded. Starting migration remains a separate action." : "Migration remains stopped until you explicitly approve this plan and separately start the migration."}</p>
    </Alert>
    <Panel><h2 className="type-section">Configuration Changes</h2><p className="mt-2 text-sm text-secondary">These are reviewed destination mappings. Settings are checked again after migration; consequential setup changes require their own approval.</p>
      {configs.length ? <ul className="mt-4 space-y-3 text-sm [overflow-wrap:anywhere]">{configs.map(mapping => <li key={mapping.id}><strong>{mapping.source_label} → {mapping.selected_target}</strong>{mapping.source_value != null && <p className="mt-1 text-secondary">Source setting: {mapping.source_value} · {mapping.source_value.replaceAll("_", " ").toLowerCase() === mapping.selected_target.toLowerCase() ? "Value retained" : "Proposed value differs; review this change"}</p>}<p className="mt-1 text-secondary">{mapping.rationale}</p></li>)}</ul> : <p className="mt-4 text-secondary">No configuration mapping proposals in this plan.</p>}
    </Panel>
    <Panel><h2 className="type-section">Validation Expectations</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-secondary">{(plan.summary?.validation_expectations ?? ["Review the deterministic reconciliation report after migration; no validation success is implied by plan approval."]).map(expectation => <li key={expectation}>{expectation}</li>)}</ul>
    </Panel>
    <Dialog open={confirm} onClose={() => { if (!busy) setConfirm(false); }} fallbackFocusRef={fallbackFocusRef} title="Approve This Migration Plan?" description="This is an explicit, auditable decision for the current migration.">
      <div className="dialog-scroll"><p className="text-sm leading-6">You approve {reviewed} reviewed mappings{plan.summary ? ` and ${plan.summary.record_count} source records for ${plan.summary.company_name}` : " and this plan's recorded scope"}. Your authenticated identity and the server timestamp will be retained with the approval.</p>
      <ul className="mt-4 space-y-2">{plan.summary?.batches.map(batch => <li key={batch.dataset}>{batch.label} · {batch.record_count} records</li>)}</ul>
      <h3 className="mt-4 font-semibold">Reviewed Mappings and Settings</h3>
      <ul className="mt-2 space-y-3">{mappings.map(mapping => <li key={mapping.id}><strong>{mapping.source_label} → {mapping.selected_target}</strong><p>{mapping.source_value != null ? `Source setting: ${mapping.source_value}. ` : ""}{mapping.rationale}</p><p>{mapping.risk} risk · {mapping.policy_reasons.join(" · ")}</p></li>)}</ul>
      <h3 className="mt-4 font-semibold">Validation Expectations</h3><ul>{plan.summary?.validation_expectations.map(value => <li key={value}>{value}</li>)}</ul>
      <p className="mt-3 text-sm leading-6">No target writes occur until you separately start migration. Hard blockers cannot be waived by this approval.</p>
      </div>
      <div className="dialog-actions"><Button disabled={!canApprove || blocked || busy} onClick={() => { void approve().then(() => setConfirm(false)); }}>{busy ? "Recording approval…" : "Approve Migration Plan"}</Button><Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Keep Reviewing</Button></div>
    </Dialog>
  </section>;
}
