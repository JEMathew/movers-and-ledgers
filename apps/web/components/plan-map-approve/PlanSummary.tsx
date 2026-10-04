import { Badge, Card, Panel } from "@/components/ui/primitives";
import { Alert } from "@/components/ui/feedback";
import type { MappingProposal, MigrationPlan } from "./types";

export const areaLabel = (area: string) => ({ chart_of_accounts: "Chart of accounts", customers: "Customers", vendors: "Vendors", products_services: "Products and services", tax_configuration: "Tax configuration", general_configuration: "General configuration" }[area] ?? area.replaceAll("_", " "));

export function PlanSummary({ plan, mappings }: { plan: MigrationPlan; mappings: MappingProposal[] }) {
  const summary = plan.summary;
  const reviewCount = mappings.length || summary?.mapping_review_count;
  // Valid company and record names can be 200 unbroken characters; wrap them inside the viewport.
  return <section className="mt-8 min-w-0 space-y-6 [overflow-wrap:anywhere]" aria-label="Migration scope and review">
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0"><h2 className="type-section">Migration Scope</h2><p className="mt-2 text-secondary">{summary?.company_name ?? "This migration"} · synthetic target</p></div>
        <Badge>{plan.relative_complexity} relative complexity</Badge>
      </div>
      <p className="mt-4 text-sm text-secondary">Approval covers this plan and its reviewed mappings. It does not start migration or authorize writes to a real accounting provider.</p>
      {summary ? <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Included objects">
        {summary.batches.map(batch => <li key={batch.dataset} className="rounded-lg border border-token p-4"><strong>{batch.label}</strong><p className="mt-1 text-sm text-secondary">{batch.record_count} {batch.record_count === 1 ? "record" : "records"}</p></li>)}
      </ul> : <p className="mt-4 text-secondary">This earlier plan has no object-count summary. Review its mappings and recorded planning evidence before continuing.</p>}
      {summary && <p className="mt-4 text-sm font-semibold">{summary.record_count} source records across {summary.batches.length} batches</p>}
    </Panel>
    <Alert tone={plan.blockers.length ? "warning" : "success"} title={plan.blockers.length ? "Known blockers · migration stays blocked" : "No hard readiness blockers recorded"}>
      {plan.blockers.length ? <><ul className="mt-2 list-disc space-y-1 pl-5">{plan.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul><p className="mt-3">Review these findings and correct the source data. Mapping review and plan approval cannot waive a hard blocker.</p></> : <p className="mt-2">Every mapping still needs your review, followed by explicit plan approval.</p>}
    </Alert>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><h2 className="type-section">Migration Sequence</h2><p className="mt-2 text-sm text-secondary">The synthetic executor processes one dataset per batch in this order, preserving checkpoints if a batch pauses.</p>
        {summary ? <ol className="mt-4 space-y-2">{summary.batches.map((batch, index) => <li key={batch.dataset} className="flex gap-3 text-sm"><span className="font-bold text-primary">{index + 1}.</span><span>{batch.label} · {batch.record_count} records</span></li>)}</ol> : <p className="mt-4 text-sm text-secondary">Batch counts are unavailable for this earlier plan.</p>}
      </Card>
      <Card><h2 className="type-section">What Needs Human Review</h2><p className="mt-3 font-bold">{reviewCount === undefined ? "Review workload not yet available" : `${reviewCount} mapping ${reviewCount === 1 ? "decision" : "decisions"}, then one plan approval`}</p><p className="mt-2 text-sm text-secondary">This estimate counts decisions, not time. Sensitive account, tax and configuration choices may need closer review.</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-secondary"><li>Source-to-destination recommendations and supporting evidence</li><li>Warnings and any configuration differences</li><li>Scope, validation expectations and the consequence of plan approval</li></ul>
        <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Planning Evidence and Checkpoints</summary><ul className="mt-3 space-y-2 break-words text-sm text-secondary">{plan.risks.map(risk => <li key={risk}>{risk}</li>)}{plan.approvals_required.map(action => <li key={action}>{action}</li>)}{plan.evidence_references.map(evidence => <li key={evidence}>{evidence}</li>)}</ul></details>
      </Card>
    </div>
  </section>;
}
