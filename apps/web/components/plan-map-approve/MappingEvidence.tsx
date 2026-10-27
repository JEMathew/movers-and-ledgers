import type { MappingProposal } from "./types";

const datasetByArea: Record<string, string> = { chart_of_accounts: "accounts", customers: "customers", vendors: "vendors", products_services: "products", tax_configuration: "taxes", general_configuration: "configuration" };

/** The one evidence view for a mapping, used by single decisions and by the low-risk batch panel. */
export function MappingEvidence({ mapping, open = false, label }: { mapping: MappingProposal; open?: boolean; label?: string }) {
  const relevant = mapping.evidence.filter(evidence => evidence.startsWith("mapping-rule:") || evidence.includes(`:${datasetByArea[mapping.area]}:`));
  const shown = relevant.length ? relevant : mapping.evidence;
  const context = mapping.evidence.filter(evidence => !shown.includes(evidence));
  return <details open={open} className="pm-evidence">
    <summary>{label ?? "Evidence and policy"} · {shown.length} direct {shown.length === 1 ? "reference" : "references"}</summary>
    <ul className="pm-evidence-list">{shown.map(evidence => <li key={evidence}>{evidence}</li>)}{mapping.policy_reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
    {context.length > 0 && <details className="pm-evidence-more"><summary>Additional planning context · {context.length} references</summary><ul className="pm-evidence-list">{context.map(evidence => <li key={evidence}>{evidence}</li>)}</ul></details>}
  </details>;
}
