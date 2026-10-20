import type { ReactNode } from "react";
import { AiStatusBadge, MoneyFigure } from "@/components/v2/primitives";
import { checkGroups, differenceText, evidenceHref, Facts, sessionHref, StateChip, trialBalanceCheck } from "@/components/migrate-resolve/stage-kit";
import { customerName, ImpactTable, invoiceFigures, InvoiceDocument, JournalTable, totalsSentence } from "./InvoiceParts";
import type { Fpu, SessionEvidence, Snapshot } from "./types";

/**
 * Start, verified first invoice (design frame V2-FPU, phone frame in V2-Mobile). The invoice, essentials and
 * approvals come from GET …/onboarding; the Verify counts, trial balance difference and earlier decisions come
 * from one read-only GET …/migration-sessions/{id}. Nothing is computed: counts are counted from API lists,
 * amounts are API strings, and anything missing reads "Not available".
 */
/** True only when the latest validation report is VERIFIED and every one of its checks matched. */
function booksAgreeIn(data?: SessionEvidence) {
  const report = data?.validation_reports?.at(-1);
  return !!report?.checks?.length && report.status === "VERIFIED" && report.checks.every(check => check.status === "VERIFIED");
}

/** The guide sentence for the verified screen; "agree to the cent" only when the report says so. */
export function verifiedGuide(data?: SessionEvidence) {
  return `Your first invoice is in the new books and the rules confirmed it posted correctly.${booksAgreeIn(data) ? " The old and new books agree to the cent." : ""} Keep the verified evidence with the client file.`;
}

export function VerifiedStart({ snapshot, fpu, evidence, recovery }: {
  snapshot: Snapshot; fpu: Fpu; recovery?: ReactNode;
  evidence?: { state: "loading" | "ready" | "error"; data?: SessionEvidence };
}) {
  const figures = invoiceFigures(fpu);
  const customer = customerName(snapshot, figures.customerId);
  const sum = totalsSentence(fpu);
  const report = evidence?.data?.validation_reports?.at(-1);
  const groups = report?.checks?.length ? checkGroups(report.checks) : undefined;
  const trial = trialBalanceCheck(report?.checks);
  const difference = report ? differenceText(trial, report.currency) : undefined;
  const pending = !evidence || evidence.state === "loading";
  const unknown = pending ? "Checking…" : "Not available";
  const checksLine = groups ? `${groups.matched} of ${groups.total} checks matched` : `Checks matched: ${unknown.toLowerCase()}`;
  const ready = snapshot.tasks.filter(task => task.status === "COMPLETED").length;
  const invoiceChecks = fpu.checks.filter(check => check.passed).length;
  const booksAgree = booksAgreeIn(evidence?.data);

  // Decisions recorded with the person who posted the invoice (the API's verified identity).
  const actor = fpu.posted_by ?? fpu.decisions.at(-1)?.actor;
  const data = evidence?.state === "ready" ? evidence.data : undefined;
  const count = (list: unknown[] | undefined) => list ? String(list.length) : unknown;
  const decisions = actor ? [
    { label: "Mappings approved or changed", value: count(data?.mappings?.filter(m => m.decided_by === actor && ["APPROVED", "MODIFIED"].includes(m.state))) },
    { label: "Settings approved or changed", value: count(data?.configuration?.proposals?.filter(p => p.decided_by === actor && ["approve", "modify"].includes(p.decision ?? ""))) },
    { label: "Batch fix approved", value: count(data ? (data.execution?.resolutions ?? []).filter(r => r.decided_by === actor && ["APPROVED", "APPLIED"].includes(r.state)) : undefined) },
    { label: "Essentials confirmed", value: String(snapshot.tasks.filter(task => task.decision?.actor === actor && task.decision.action !== "reject").length) },
    { label: "First invoice approved", value: String(fpu.decisions.filter(d => d.actor === actor && d.action === "approve").length) },
  ] : [];
  const noAiRecords = data && Array.isArray(data.reasoning_records) && Array.isArray(data.review_records) && data.reasoning_records.length === 0 && data.review_records.length === 0;

  return <>
    {recovery}
    <section className="v2s-money" aria-label="Verified results">
      <MoneyFigure strong label={`First invoice, ${customer}`} amount={figures.total} currency={figures.currency} caption={sum ? <span className="v2s-caption"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" /></svg>Posted and verified: {sum}</span> : "Posted and verified"} />
      <div className="v2-card v2-money v2s-desk-only">
        <span className="v2-money-label">Trial balance difference, old vs new books</span>
        <span className={difference?.amount ? "v2-money-value" : "v2s-money-text"}>{difference?.text ?? unknown}</span>
        <span className="v2s-caption" data-tone={groups && booksAgree ? undefined : "quiet"}>{groups && booksAgree ? <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" /></svg> : null}{trial ? `${trial.label}: ${trial.status === "VERIFIED" ? "matched" : "does not match"} · ` : ""}{checksLine}</span>
      </div>
      {/* Phone frame: one compact card instead of the second figure. */}
      <div className="v2-card v2s-phone-block">
        <Facts label="Verified results summary" rows={[
          { label: "Trial balance difference", value: difference?.text ?? unknown },
          { label: "Verify checks", value: groups ? `${groups.matched} of ${groups.total}` : unknown, tone: booksAgree ? "ok" : undefined },
          { label: "Readiness checks", value: `${ready} of ${snapshot.tasks.length}`, tone: ready === snapshot.tasks.length ? "ok" : "review" },
        ]} />
      </div>
    </section>
    <div className="v2s-actions">
      <a className="button" href={evidenceHref(snapshot.session_id)}>Review verified evidence</a>
      <a className="v2s-text-link" href={sessionHref("/workspace", snapshot.session_id)}>Back to my migrations</a>
      <a className="v2s-text-link v2s-phone-only" href="#invoice">See the invoice and journal</a>
    </div>
    <p className="v2s-small" style={{ marginTop: 12 }}>Nothing is waiting on you. Posted by {fpu.posted_by ?? "Not available"} at {fpu.posted_at ?? "Not available"} · verified at {fpu.verified_at ?? "Not available"}. Synthetic Beta: not production readiness or a real-provider transaction.</p>

    <div className="v2s-split">
      <div className="v2s-split-main">
        <InvoiceDocument fpu={fpu} snapshot={snapshot} verified>
          <JournalTable fpu={fpu} open />
          <details className="v2s-details"><summary>Invoice checks · {invoiceChecks} of {fpu.checks.length} passed</summary>
            <ol className="v2s-rows" aria-label="Invoice checks">{fpu.checks.map(check => <li key={check.id}><span className="v2s-row-main">{check.id.replaceAll("_", " ")}<span className="v2s-row-sub">{check.explanation}</span></span><StateChip tone={check.passed ? "approved" : "blocked"}>{check.passed ? "Passed" : "Failed"}</StateChip></li>)}</ol>
          </details>
          <ImpactTable impact={snapshot.accounting_impact} />
        </InvoiceDocument>
      </div>
      <aside className="v2s-split-side" aria-label="Checks and decisions">
        <section className="v2-card v2s-section" aria-labelledby="verify-summary">
          <h2 id="verify-summary">Verify: {checksLine}</h2>
          <Facts rows={[
            ...(groups ? groups.groups.map(group => ({ label: group.name, value: `${group.matched} of ${group.checks.length}`, tone: group.matched === group.checks.length ? "ok" as const : "blocked" as const })) : [{ label: "Checks", value: unknown }]),
            { label: "Difference", value: difference?.text ?? unknown },
          ]} />
          <a className="v2s-text-link" href={sessionHref("/validate-configure", snapshot.session_id)}>See all checks</a>
        </section>
        <section className="v2-card v2s-section" aria-labelledby="start-summary">
          <h2 id="start-summary">Start: ready for daily use</h2>
          <Facts rows={[
            { label: "Readiness checks", value: `${ready} of ${snapshot.tasks.length}`, tone: ready === snapshot.tasks.length ? "ok" : "review" },
            { label: "Invoice checks", value: `${invoiceChecks} of ${fpu.checks.length}`, tone: invoiceChecks === fpu.checks.length ? "ok" : "blocked" },
          ]} />
          <details className="v2s-details"><summary>Show the {snapshot.tasks.length} readiness checks</summary>
            <ul className="v2s-rows">{snapshot.tasks.map(task => <li key={task.id}><span className="v2s-row-main">{task.label}</span><StateChip tone={task.status === "COMPLETED" ? "approved" : task.status === "BLOCKED" ? "blocked" : "needs_review"}>{task.status === "COMPLETED" ? "Ready" : task.status === "BLOCKED" ? "Blocked" : "Needs you"}</StateChip></li>)}</ul>
          </details>
        </section>
        {actor && <section className="v2-card v2s-section" aria-labelledby="decision-summary">
          <h2 id="decision-summary">Decisions by {actor}</h2>
          <Facts rows={decisions} />
          <div className="v2s-ai-note">
            <AiStatusBadge />
            <p style={{ margin: 0 }}>{noAiRecords ? "No AI advice was used. " : ""}The Advisor and Reviewer are planned and not switched on in the Beta. You approve every change.</p>
          </div>
        </section>}
      </aside>
    </div>
  </>;
}
