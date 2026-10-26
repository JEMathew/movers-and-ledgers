import type { SessionView } from "../public-surfaces/session";

/**
 * At-a-glance counts for My migration. Every figure is counted from the session evidence already read;
 * a figure the snapshot does not carry is said plainly ("Not in this snapshot"), never shown as zero.
 */
export function MigrationSnapshot({ view }: { view: SessionView }) {
  const passed = view.checks.filter(check => check.status === "VERIFIED").length;
  const issues = view.blockers.length;
  const issuesKnown = view.attentionComplete || issues > 0;
  const early = ["CREATED", "DISCOVERED", "ASSESSED", "PLANNED"].includes(view.status);
  const rows: [string, string, string?][] = [
    ["Mappings waiting for you", view.mappingIssues === null ? early ? "Not proposed yet" : "Not in this snapshot" : view.mappingIssues === 0 ? "None" : String(view.mappingIssues), view.mappingIssues ? "review" : undefined],
    ["Open issues", issuesKnown ? (issues ? String(issues) : "None") : "Not in this snapshot", issues ? "review" : undefined],
    ["Decisions recorded", String(view.decisions.length)],
  ];
  if (view.checks.length) rows.push(["Checks passed", `${passed} of ${view.checks.length}`, passed === view.checks.length ? "done" : "review"]);
  return <section className="mm-card mm-glance" aria-labelledby="glance-title">
    <h2 id="glance-title" className="mm-card-title">At a glance</h2>
    <dl className="mm-glance-list">{rows.map(([label, value, tone]) => <div key={label} data-tone={tone}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </section>;
}
