"use client";

import { useState } from "react";
import type { RefObject } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/primitives";
import { RecoveryNotice } from "@/components/v2/Workflow";
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
  const hardBlockers = plan.blockers.length + unsupported.length + (assessmentBlocked ? 1 : 0);
  // Long unbroken names wrap here and in the consent dialog, which inherits from this section.
  return <section className="pm-approval min-w-0 [overflow-wrap:anywhere]" aria-label="Migration plan approval">
    <div className="pm-card pm-decision" data-state={approved ? "approved" : blocked ? "blocked" : "ready"}>
      <p className="pm-eyebrow">{approved ? "Recorded" : "Your next step"}</p>
      <h2>Consequence of approval</h2>
      {approved ? <p className="pm-decision-status" role="status"><CheckCircle2 size={20} aria-hidden="true"/>Plan approved. Starting migration is a separate step.</p> : blocked ? <p className="pm-decision-status" role="status"><CircleAlert size={20} aria-hidden="true"/>Approval unavailable until blockers are resolved.</p> : null}
      <dl className="pm-figures" aria-label="Plan figures">
        <div><dt>Mappings decided</dt><dd>{reviewed} of {mappings.length}</dd><dd className="pm-meta">{reviewed === mappings.length ? "All decided" : `${mappings.length - reviewed} to decide`}</dd></div>
        <div><dt>Source records</dt><dd>{plan.summary ? plan.summary.record_count.toLocaleString() : "Not available"}</dd><dd className="pm-meta">{plan.summary ? "In scope" : "Summary unavailable"}</dd></div>
        <div><dt>Batches</dt><dd>{plan.summary ? plan.summary.batches.length : "Not available"}</dd><dd className="pm-meta">{plan.summary ? "In scope" : "Summary unavailable"}</dd></div>
        <div><dt>Hard blockers</dt><dd>{hardBlockers || (blocked ? "Yes" : "None")}</dd><dd className="pm-meta">{blocked ? "Blocked: resolve first" : "Clear"}</dd></div>
      </dl>
      <ol className="pm-flow" aria-label="Approval process">
        <li data-state={reviewed === mappings.length ? "done" : "current"}><strong>Review</strong><span>Scope and mappings</span></li>
        <li data-state={approved ? "done" : reviewed === mappings.length && !blocked ? "current" : "next"}><strong>Approve</strong><span>Your recorded consent</span></li>
        <li data-state="next"><strong>Start migration</strong><span>A separate step you take</span></li>
        <li data-state="next"><strong>Reconcile and verify</strong><span>Rules check the result</span></li>
      </ol>
      <p className="pm-meta">Approval records your consent to this scope and the reviewed mappings, with your authenticated identity and a server timestamp. It enables the separate Start migration step for this synthetic target. It does not run migration, apply later setup changes, or declare your books validated.</p>
      {readConfirmed && plan.approval ? <div className="pm-approved-by"><p>Approved by {plan.approval.actor}</p><p>Approved at <time>{plan.approval.approved_at}</time></p><p className="pm-meta">Decision {plan.approval.decision_id}</p></div> : approved ? <p className="pm-meta">The workflow records an earlier approval. Reviewer details are unavailable for this legacy plan; no new consent is inferred.</p> : <div className="pm-actions"><Button disabled={!canApprove || blocked || busy} onClick={() => setConfirm(true)}>Approve migration plan</Button></div>}
    </div>
    {blocked ? <RecoveryNotice title="Unresolved blockers · approval unavailable">
      <ul className="pm-bullets">{plan.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}{assessmentBlocked && <li>The readiness check recorded a blocker in the source books.</li>}{unsupported.map(mapping => <li key={mapping.id}>{mapping.source_label}: this synthetic adapter cannot apply the changed destination treatment.</li>)}</ul>
      <p>Correct the source data before migration. A mapping decision or plan approval cannot waive this gate.</p>
    </RecoveryNotice> : <div className="pm-card pm-clear" role="note"><h2>No unresolved hard readiness blockers</h2><p className="pm-meta">{approved ? "Plan approval is recorded. Starting migration remains a separate action." : "Migration remains stopped until you explicitly approve this plan and separately start the migration."}</p></div>}
    <div className="pm-card"><h2>Review before approval</h2><p className="pm-meta">{plan.summary?.company_name ?? "This migration"}</p>
      <div className="pm-tables">
        <table className="data-table"><caption>Mappings by area</caption><thead><tr><th scope="col">Area</th><th scope="col" className="num">Mappings</th><th scope="col">Status</th></tr></thead><tbody>{[...new Set(mappings.map(mapping => mapping.area))].map(area => { const all = mappings.filter(mapping => mapping.area === area); const done = all.filter(mappingReviewed).length; return <tr key={area}><th scope="row">{areaLabel(area)}</th><td className="num">{all.length}</td><td><span className="status-text" data-tone={done === all.length ? "success" : "warning"}>{done === all.length ? <CheckCircle2 size={15} aria-hidden="true"/> : <CircleAlert size={15} aria-hidden="true"/>}{done === all.length ? "Decided" : `${all.length - done} to decide`}</span></td></tr>; })}</tbody></table>
        {plan.summary ? <table className="data-table"><caption>Included objects and batches</caption><thead><tr><th scope="col">Batch</th><th scope="col" className="num">Records</th></tr></thead><tbody>{plan.summary.batches.map(batch => <tr key={batch.dataset}><th scope="row">{batch.label}</th><td className="num">{batch.record_count.toLocaleString()}</td></tr>)}</tbody></table> : <p className="pm-meta">Object-count summary unavailable for this earlier plan.</p>}
      </div>
    </div>
    <div className="pm-card"><h2>Configuration changes</h2><p className="pm-meta">These are reviewed destination mappings. Settings are checked again after migration; consequential setup changes require their own approval.</p>
      {configs.length ? <ul className="pm-config">{configs.map(mapping => <li key={mapping.id}><strong>{mapping.source_label} → {mapping.selected_target}</strong>{mapping.source_value != null && <p className="pm-meta">Source setting: {mapping.source_value} · {mapping.source_value.replaceAll("_", " ").toLowerCase() === mapping.selected_target.toLowerCase() ? "Value retained" : "Proposed value differs; review this change"}</p>}<p className="pm-meta">{mapping.rationale}</p></li>)}</ul> : <p className="pm-meta">No configuration mapping proposals in this plan.</p>}
    </div>
    <div className="pm-card"><h2>Validation expectations</h2>
      <ul className="pm-bullets">{(plan.summary?.validation_expectations ?? ["Review the deterministic reconciliation report after migration; no validation success is implied by plan approval."]).map(expectation => <li key={expectation}>{expectation}</li>)}</ul>
    </div>
    <Dialog open={confirm} onClose={() => { if (!busy) setConfirm(false); }} fallbackFocusRef={fallbackFocusRef} title="Approve this migration plan?" description="This is an explicit, auditable decision for the current migration.">
      <div className="dialog-scroll"><p className="text-sm leading-6">You approve {reviewed} reviewed mappings{plan.summary ? ` and ${plan.summary.record_count} source records for ${plan.summary.company_name}` : " and this plan's recorded scope"}. Your authenticated identity and the server timestamp will be retained with the approval.</p>
      <ul className="mt-4 space-y-2">{plan.summary?.batches.map(batch => <li key={batch.dataset}>{batch.label} · {batch.record_count} records</li>)}</ul>
      <h3 className="mt-4 font-semibold">Reviewed mappings and settings</h3>
      <ul className="mt-2 space-y-3">{mappings.map(mapping => <li key={mapping.id}><strong>{mapping.source_label} → {mapping.selected_target}</strong><p>{mapping.source_value != null ? `Source setting: ${mapping.source_value}. ` : ""}{mapping.rationale}</p><p>{mapping.risk === "HIGH" ? "High" : mapping.risk === "MEDIUM" ? "Medium" : "Low"} risk · {mapping.policy_reasons.join(" · ")}</p></li>)}</ul>
      <h3 className="mt-4 font-semibold">Validation expectations</h3><ul>{plan.summary?.validation_expectations.map(value => <li key={value}>{value}</li>)}</ul>
      <p className="mt-3 text-sm leading-6">No target writes occur until you separately start migration. Hard blockers cannot be waived by this approval.</p>
      </div>
      <div className="dialog-actions"><Button disabled={!canApprove || blocked || busy} onClick={() => { void approve().then(() => setConfirm(false)); }}>{busy ? "Recording approval…" : "Approve migration plan"}</Button><Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Keep reviewing</Button></div>
    </Dialog>
  </section>;
}
