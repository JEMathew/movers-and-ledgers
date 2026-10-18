import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import type { SessionView, TraceRow } from "../public-surfaces/session";

const result = (status: string) => status === "VERIFIED" ? ["Passed", "success", CheckCircle2] as const : status === "BLOCKED" ? ["Did not pass", "warning", CircleAlert] as const : ["Not confirmed", "neutral", CircleDashed] as const;
const label = (title: string) => title ? title.charAt(0).toUpperCase() + title.slice(1) : "Check";

function Rows({ rows }: { rows: TraceRow[] }) {
  return <>{rows.map((row, index) => { const [text, tone, Icon] = result(row.status); return <tr key={`${row.id}-${index}`}><th scope="row">{label(row.title)}</th><td><span className="status-text" data-tone={tone}><Icon size={15} aria-hidden="true"/>{text}</span></td></tr>; })}</>;
}

/** Recorded deterministic checks only. Nothing is summarised beyond what the session evidence contains. */
export function ChecksTable({ view }: { view: SessionView }) {
  if (!view.checks.length) return null;
  const head = view.checks.slice(0, 5), rest = view.checks.slice(5);
  const passed = view.checks.filter(check => check.status === "VERIFIED").length;
  return <section className="mm-card mm-checks" aria-labelledby="checks-title"><h2 id="checks-title" className="mm-card-title">Verification checks</h2>
    <p className="mm-meta">{passed} of {view.checks.length} recorded checks passed. Each compares your old and new books with rules, not estimates.</p>
    <table className="data-table"><thead><tr><th scope="col">Check</th><th scope="col">Result</th></tr></thead><tbody><Rows rows={head}/></tbody></table>
    {rest.length > 0 && <details><summary>Show all {view.checks.length} checks</summary><table className="data-table"><tbody><Rows rows={rest}/></tbody></table></details>}
  </section>;
}
