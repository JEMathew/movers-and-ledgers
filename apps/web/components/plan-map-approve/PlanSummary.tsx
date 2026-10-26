import { RecoveryNotice } from "@/components/v2/Workflow";
import type { MappingProposal, MigrationPlan } from "./types";

export const areaLabel = (area: string) => ({ chart_of_accounts: "Chart of accounts", customers: "Customers", vendors: "Vendors", products_services: "Products and services", tax_configuration: "Tax configuration", general_configuration: "General configuration" }[area] ?? area.replaceAll("_", " "));

export function PlanSummary({ plan, mappings }: { plan: MigrationPlan; mappings: MappingProposal[] }) {
  const summary = plan.summary;
  const reviewCount = mappings.length || summary?.mapping_review_count;
  // Valid company and record names can be 200 unbroken characters; wrap them inside the viewport.
  return <section className="pm-summary min-w-0 [overflow-wrap:anywhere]" aria-label="Migration scope and review">
    <div className="pm-card">
      <div className="pm-card-head">
        <div className="min-w-0"><h2>Migration scope</h2><p className="pm-meta">{summary?.company_name ?? "This migration"} · synthetic target</p></div>
        <span className="pm-tag">{plan.relative_complexity} relative complexity</span>
      </div>
      <p className="pm-meta">Approval covers this plan and its reviewed mappings. It does not start migration or authorize writes to a real accounting provider.</p>
      {summary ? <ul className="pm-batches" aria-label="Included objects">
        {summary.batches.map(batch => <li key={batch.dataset}><strong>{batch.label}</strong><span className="pm-meta">{batch.record_count} {batch.record_count === 1 ? "record" : "records"}</span></li>)}
      </ul> : <p className="pm-meta">This earlier plan has no object-count summary. Review its mappings and recorded planning evidence before continuing.</p>}
      {summary && <p className="pm-total">{summary.record_count} source records across {summary.batches.length} batches</p>}
    </div>
    {plan.blockers.length ? <RecoveryNotice title="Known blockers · migration stays blocked">
      <ul className="pm-bullets">{plan.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul>
      <p>Review these findings and correct the source data. Mapping review and plan approval cannot waive a hard blocker.</p>
    </RecoveryNotice> : <div className="pm-card pm-clear" role="note"><h2>No hard readiness blockers recorded</h2><p className="pm-meta">Every mapping still needs your review, followed by explicit plan approval.</p></div>}
    <details className="pm-more"><summary>Sequence, review workload and planning evidence</summary><div className="pm-more-grid">
      <div className="pm-card"><h2>Migration sequence</h2><p className="pm-meta">The synthetic executor processes one dataset per batch in this order, preserving checkpoints if a batch pauses.</p>
        {summary ? <ol className="pm-sequence">{summary.batches.map(batch => <li key={batch.dataset}>{batch.label} · {batch.record_count} records</li>)}</ol> : <p className="pm-meta">Batch counts are unavailable for this earlier plan.</p>}
      </div>
      <div className="pm-card"><h2>What needs human review</h2><p className="pm-strong">{reviewCount === undefined ? "Review workload not yet available" : `${reviewCount} mapping ${reviewCount === 1 ? "decision" : "decisions"}, then one plan approval`}</p><p className="pm-meta">This estimate counts decisions, not time. Sensitive account, tax and configuration choices may need closer review.</p>
        <ul className="pm-bullets"><li>Source-to-destination recommendations and supporting evidence</li><li>Warnings and any configuration differences</li><li>Scope, validation expectations and the consequence of plan approval</li></ul>
        <details className="pm-more-inner"><summary>Planning evidence and checkpoints</summary><ul className="pm-evidence-list">{plan.risks.map(risk => <li key={risk}>{risk}</li>)}{plan.approvals_required.map(action => <li key={action}>{action}</li>)}{plan.evidence_references.map(evidence => <li key={evidence}>{evidence}</li>)}</ul></details>
      </div>
    </div></details>
  </section>;
}
