"use client";

import { useState } from "react";
import type { RefObject } from "react";
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
    <Panel><h2 className="type-section">Review before approval</h2><p className="mt-3 text-secondary">{plan.summary?.company_name ?? "This migration"} · {plan.summary ? `${plan.summary.record_count} source records · ${plan.summary.batches.length} batches` : "Object-count summary unavailable for this earlier plan"}</p>
      <p className="mt-3 font-bold">{reviewed} of {mappings.length} mappings reviewed</p>
      <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">{[...new Set(mappings.map(mapping => mapping.area))].map(area => <li key={area}>{areaLabel(area)} · {mappings.filter(mapping => mapping.area === area && mappingReviewed(mapping)).length} reviewed</li>)}</ul>
      <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Included objects and batches</summary><ol className="mt-3 space-y-2 text-sm text-secondary">{plan.summary?.batches.map((batch, index) => <li key={batch.dataset}>{index + 1}. {batch.label} · {batch.record_count} records</li>)}</ol></details>
    </Panel>
    <Alert tone={blocked ? "warning" : "success"} title={blocked ? "Unresolved blockers · approval unavailable" : "No unresolved hard readiness blockers"}>
      <ul className="mt-2 list-disc space-y-1 pl-5 [overflow-wrap:anywhere]">{plan.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}{unsupported.map(mapping => <li key={mapping.id}>{mapping.source_label}: this synthetic adapter cannot apply the changed destination treatment.</li>)}</ul>
      <p className="mt-2">{blocked ? "Correct the source data before migration. A mapping decision or plan approval cannot waive this gate." : approved ? "Plan approval is recorded. Starting migration remains a separate action." : "Migration remains stopped until you explicitly approve this plan and separately start the migration."}</p>
    </Alert>
    <Panel><h2 className="type-section">Configuration changes</h2><p className="mt-2 text-sm text-secondary">These are reviewed destination mappings. Settings are checked again after migration; consequential setup changes require their own approval.</p>
      {configs.length ? <ul className="mt-4 space-y-3 text-sm [overflow-wrap:anywhere]">{configs.map(mapping => <li key={mapping.id}><strong>{mapping.source_label} → {mapping.selected_target}</strong>{mapping.source_value != null && <p className="mt-1 text-secondary">Source setting: {mapping.source_value} · {mapping.source_value.replaceAll("_", " ").toLowerCase() === mapping.selected_target.toLowerCase() ? "Value retained" : "Proposed value differs; review this change"}</p>}<p className="mt-1 text-secondary">{mapping.rationale}</p></li>)}</ul> : <p className="mt-4 text-secondary">No configuration mapping proposals in this plan.</p>}
    </Panel>
    <Panel><h2 className="type-section">Validation expectations</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-secondary">{(plan.summary?.validation_expectations ?? ["Review the deterministic reconciliation report after migration; no validation success is implied by plan approval."]).map(expectation => <li key={expectation}>{expectation}</li>)}</ul>
    </Panel>
    <Panel><h2 className="type-section">Consequence of approval</h2><p className="mt-3 text-secondary">Approval records your consent to this scope and the reviewed mappings, with your authenticated identity and a server timestamp. It enables the separate Start Migration step for this synthetic target. It does not run migration, apply later setup changes, or declare your books validated.</p>
      {readConfirmed && plan.approval ? <div className="mt-4 break-all text-sm"><p>Approved by {plan.approval.actor}</p><p className="mt-1">Approved at <time>{plan.approval.approved_at}</time></p><p className="mt-1 text-secondary">Decision {plan.approval.decision_id}</p></div> : approved ? <p className="mt-4 text-sm text-secondary">The workflow records an earlier approval. Reviewer details are unavailable for this legacy plan; no new consent is inferred.</p> : <Button className="mt-5" disabled={!canApprove || blocked || busy} onClick={() => setConfirm(true)}>Approve Migration Plan</Button>}
    </Panel>
    <Dialog open={confirm} onClose={() => { if (!busy) setConfirm(false); }} fallbackFocusRef={fallbackFocusRef} title="Approve this migration plan?" description="This is an explicit, auditable decision for the current migration.">
      <p className="text-sm leading-6">You approve {reviewed} reviewed mappings{plan.summary ? ` and ${plan.summary.record_count} source records for ${plan.summary.company_name}` : " and this plan's recorded scope"}. Your authenticated identity and the server timestamp will be retained with the approval.</p>
      <p className="mt-3 text-sm leading-6">No target writes occur until you separately start migration. Hard blockers cannot be waived by this approval.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Button disabled={!canApprove || blocked || busy} onClick={() => { void approve().then(() => setConfirm(false)); }}>{busy ? "Recording approval…" : "Approve Migration Plan"}</Button><Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>Keep Reviewing</Button></div>
    </Dialog>
  </section>;
}
