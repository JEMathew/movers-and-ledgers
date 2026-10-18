"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/primitives";
import { PhaseProgress, TaskContext } from "@/components/journey/PhaseProgress";
import { journeyEvidenceFrom, projectJourney } from "@/components/journey/journey";
import { RecoveryNotice, StageHeader, WorkflowSummary } from "@/components/v2/Workflow";
import type { Outstanding } from "@/components/v2/Workflow";
import { ActionFailure, evidenceHref, Facts, ReadFailure, sentence, sessionHref, StateChip } from "@/components/migrate-resolve/stage-kit";
import type { ChipTone } from "@/components/migrate-resolve/stage-kit";
import { customerName, ImpactTable, invoiceFigures, InvoiceDocument, JournalTable } from "./InvoiceParts";
import { VerifiedStart, verifiedGuide } from "./VerifiedStart";
import type { SessionEvidence, Snapshot, Task } from "./types";
import { demoCreationKey, finishDemoCreation } from "@/lib/demo-creation";
import { authHeaders } from "@/lib/identity";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const STORAGE = "movebooks-onboarding-session";
async function request(path: string, body?: object, method = "POST", key?: string): Promise<Snapshot> {
  const result = await fetch(`${BASE}/v1${path}`, { method, headers: { ...await authHeaders(), "Content-Type": "application/json", ...(key ? {"Idempotency-Key": key} : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (!result.ok) { const error = await result.json().catch(() => null); throw new Error(typeof error?.detail === "string" ? error.detail : "Action failed. Check the inputs and retry safely."); }
  return result.json();
}
/** Read-only: the migration record, for the verified summary (checks matched, earlier decisions). */
async function readEvidence(id: string): Promise<SessionEvidence> {
  const result = await fetch(`${BASE}/v1/migration-sessions/${encodeURIComponent(id)}`, { headers: { ...await authHeaders(), "Content-Type": "application/json" } });
  if (!result.ok) throw new Error("Migration evidence unavailable");
  return result.json();
}
function Evidence({ values }: {values: string[]}) { return <ul className="v2s-evidence-list">{values.map(v => <li key={v}>{v}</li>)}</ul>; }
type Review = { kind: "task" | "explain"; task: Task; action?: "approve" | "modify" | "reject" } | {kind: "invoice"; action: "approve" | "reject"} | {kind: "repair"};
/** Essentials the rules check on their own read "Waiting"; only those needing a person read "Needs you". */
const taskState = (task: Task): { tone: ChipTone; label: string } => task.status === "COMPLETED" ? { tone: "approved", label: "Ready" } : task.status === "BLOCKED" ? { tone: "blocked", label: "Blocked" } : task.approval_required ? { tone: "needs_review", label: "Needs you" } : { tone: "low_risk", label: "Waiting" };
const faultText = (faults: string[]) => faults.map(fault => sentence(fault).toLowerCase()).join(", ");

export function OnboardFpuExperience() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [busy, setBusy] = useState(false);
  const [readState, setReadState] = useState<"loading" | "ready" | "error">("loading");
  const [readFailed, setReadFailed] = useState(false);
  const [requested, setRequested] = useState<string>();
  const [error, setError] = useState<string>();
  const [review, setReview] = useState<Review>();
  const [selection, setSelection] = useState("");
  const [comment, setComment] = useState("");
  const [taskId, setTaskId] = useState<string>();
  const [scenario, setScenario] = useState("clean");
  const [customer, setCustomer] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("100.00");
  const [evidence, setEvidence] = useState<{ id: string; state: "loading" | "ready" | "error"; data?: SessionEvidence }>();
  const statusRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLHeadingElement>(null);
  const [editing, setEditing] = useState(false);
  function accept(data: Snapshot) {
    setSnapshot(data);
    setCustomer(data.onboarding?.fpu?.inputs.customer_id ?? data.customers[0]?.id ?? "");
    setProduct(data.onboarding?.fpu?.inputs.product_id ?? data.products[0]?.id ?? "");
  }
  // A user action supersedes a still-pending initial read; the late read is ignored.
  const acted = useRef(0);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session") ?? sessionStorage.getItem("movebooks-migration-session") ?? sessionStorage.getItem(STORAGE);
    if (!id) { setReadState("ready"); return; }
    setRequested(id);
    let active = true;
    const before = acted.current;
    const fresh = () => active && acted.current === before;
    request(`/migration-sessions/${encodeURIComponent(id)}/onboarding`, undefined, "GET").then(data => { if (fresh()) { setReadState("ready"); accept(data); sessionStorage.setItem("movebooks-migration-session", data.session_id); } }).catch(() => { if (fresh()) { setReadState("error"); setReadFailed(true); setError("This migration is unavailable. Read the same migration again; no replacement is assumed."); } });
    return () => { active = false; };
  }, []);
  // Once the first invoice is verified, read the migration record once for the summary of earlier
  // stages. It never enables or disables an action; if it fails those figures read "Not available".
  const verifiedId = snapshot?.verified_fpu ? snapshot.session_id : undefined;
  const evidenceFor = useRef<string>(undefined);
  useEffect(() => {
    if (!verifiedId || evidenceFor.current === verifiedId) return;
    evidenceFor.current = verifiedId;
    setEvidence({ id: verifiedId, state: "loading" });
    readEvidence(verifiedId)
      .then(data => { if (evidenceFor.current === verifiedId) setEvidence({ id: verifiedId, state: "ready", data }); })
      .catch(() => { if (evidenceFor.current === verifiedId) setEvidence({ id: verifiedId, state: "error" }); });
  }, [verifiedId]);
  async function perform(path: string, body?: object, key?: string) {
    acted.current += 1;
    setBusy(true); setError(undefined); setReadFailed(false);
    try {
      const demo = path === "/onboarding-demo-sessions";
      const data = await request(path, body, "POST", demo ? demoCreationKey(path, body) : key);
      if (demo) finishDemoCreation(path);
      setReadState("ready"); accept(data);
      sessionStorage.setItem(STORAGE, data.session_id);
      sessionStorage.setItem("movebooks-migration-session", data.session_id);
      window.history.replaceState(null, "", `?session=${encodeURIComponent(data.session_id)}`);
      setReview(undefined); return data;
    } catch (caught) { setReadState("error"); setError(caught instanceof Error ? caught.message : "Action not completed."); }
    finally { setBusy(false); }
  }
  function open(value: Review) { setError(undefined); setComment(""); setSelection("task" in value ? value.task.choices[0] ?? "" : ""); setReview(value); }
  const root = `/migration-sessions/${snapshot?.session_id}`;
  const projection = readState === "ready" && snapshot ? projectJourney(journeyEvidenceFrom(snapshot)) : undefined;
  const fpu = snapshot?.onboarding?.fpu;
  const currentTask = snapshot?.tasks.find(task => task.id === taskId) ?? snapshot?.tasks.find(task => task.status !== "COMPLETED") ?? snapshot?.tasks[0];
  const complete = snapshot?.tasks.filter(t => t.status === "COMPLETED").length ?? 0;
  const frozen = !!fpu && (fpu.checkpoint !== "DRAFT" || fpu.attempts > 0);
  const approved = fpu?.decisions.at(-1)?.action === "approve";
  const rejected = fpu?.decisions.at(-1)?.action === "reject";
  const safe = readState === "ready" && !busy && !snapshot?.gate_error;
  const faults = snapshot?.onboarding?.faults ?? [];
  const invoiceFaults = faults.filter(fault => fault !== "verification_interrupted");
  const blockedTasks = snapshot?.tasks.filter(task => task.status === "BLOCKED") ?? [];
  const verified = !!(snapshot?.verified_fpu && fpu);
  const retryHref = sessionHref("/onboard-fpu", snapshot?.session_id ?? requested);
  const nextTaskForApproval = snapshot?.tasks.find(t => t.status !== "COMPLETED" && t.approval_required)?.id;

  // Every invoice control is rendered once, with the same enabled rules as before; only its place differs.
  const reviewInvoice = fpu && !frozen ? <Button key="review" variant={approved || editing || !snapshot!.ready ? "secondary" : "primary"} disabled={!safe || editing || !snapshot!.ready} onClick={() => open({kind:"invoice", action:"approve"})}>Review invoice approval</Button> : null;
  const postInvoice = fpu && !verified ? <Button key="post" variant={approved && !editing && !invoiceFaults.length ? "primary" : "secondary"} disabled={!safe || !approved || editing || !snapshot!.ready || (fpu.checkpoint === "DRAFT" && fpu.attempts >= fpu.retry_limit)} onClick={() => perform(`${root}/fpu/execute`, undefined, fpu.idempotency_key ?? `fpu-${fpu.id}`)}>{fpu.checkpoint === "POSTED" ? "Resume verification" : fpu.attempts ? "Retry approved invoice" : "Post and verify invoice"}</Button> : null;
  const invoiceLeads = !!fpu && !verified && !frozen && !approved;
  const remediation = <Button disabled={!safe} onClick={() => open({kind: "repair"})}>Review synthetic remediation</Button>;

  const step = !snapshot?.onboarding ? "begin setup" : verified ? "ready to use" : !snapshot.ready && !fpu ? "finish the essentials" : !fpu ? "prepare your first invoice" : fpu.checkpoint === "POSTED" ? "verify your first invoice" : approved ? "post your first invoice" : "approve your first invoice";
  const title = !snapshot?.onboarding ? "Start using your books"
    : !snapshot.ready && !fpu ? "Finish the essentials"
    : !fpu ? "Prepare your first invoice"
    : fpu.checkpoint === "POSTED" ? "Finish verifying your first invoice"
    : approved ? "Post and verify your first invoice"
    : "Approve your first invoice";
  const guide = !snapshot ? "Open a migration from My migration to start using its books. Standalone scenarios are at the end of this page."
    : !snapshot.onboarding ? "Your books match and the settings are applied. Start onboarding to check the essentials your team needs before the first invoice."
    : !snapshot.ready && !fpu ? `${complete} of ${snapshot.tasks.length} essentials are ready. Confirm the ones that need you; the rules check the rest.`
    : !fpu ? "Every essential is ready. Prepare one invoice for a migrated customer; nothing posts until you approve it."
    : fpu.checkpoint === "POSTED" ? "The invoice posted but verification did not finish. Resuming uses the original posting key, so nothing posts twice."
    : approved ? "You approved the invoice terms. Posting writes it to the synthetic books, then the rules check it posted exactly as approved."
    : rejected ? "You rejected these terms, so nothing will post. Modify the invoice, or approve it when you are ready."
    : "The invoice terms are ready. Check the customer, amounts, tax and accounts, then approve. Posting is a separate step.";

  const next = !snapshot ? undefined
    : !snapshot.onboarding ? { title: "Start onboarding", detail: "Onboarding uses the configured evidence from Verify. Nothing posts yet.", action: <Button disabled={!safe} onClick={() => perform(`${root}/onboarding`)}>Start onboarding from configured evidence</Button> }
    : !snapshot.ready && !fpu ? { title: currentTask && currentTask.status !== "COMPLETED" ? `${currentTask.label}` : "Confirm the essentials", detail: <>Confirm each essential that needs you in <a className="v2s-text-link" href="#onboard-title">Essentials for daily use</a>. Your first invoice unlocks when all are ready.</> }
    : !fpu ? { title: "Prepare your first invoice", detail: <>Choose a migrated customer and service in <a className="v2s-text-link" href="#fpu-title">Your first invoice</a>. Preparing does not post anything.</> }
    : invoiceLeads ? { title: "Review and approve the invoice", detail: "Approval records your consent to these exact terms. Changed terms need a fresh approval.", action: reviewInvoice }
    : { title: fpu.checkpoint === "POSTED" ? "Resume verification" : fpu.attempts ? "Retry the approved invoice" : "Post and verify the invoice", detail: "Identical retries use the original key; completed work is not repeated.", action: postInvoice };

  const done = snapshot ? [
    ...(snapshot.onboarding ? ["Books verified and settings applied"] : []),
    ...(snapshot.onboarding ? [`${complete} of ${snapshot.tasks.length} essentials ready`] : []),
    ...(fpu ? ["First invoice prepared"] : []),
    ...(approved ? [`First invoice approved by ${fpu!.decisions.at(-1)!.actor}`] : []),
    ...(fpu?.checkpoint === "POSTED" ? ["First invoice posted"] : []),
  ] : [];
  const outstanding: Outstanding[] = snapshot ? [
    ...(snapshot.onboarding && !snapshot.ready && !fpu ? snapshot.tasks.filter(t => t.status === "REVIEW_REQUIRED" && t.approval_required).map(t => ({ label: t.label, href: "#onboard-title" })) : []),
    ...blockedTasks.map(t => ({ label: `${t.label} is blocked`, tone: "blocked" as const })),
    ...(invoiceFaults.length || (faults.length && !fpu) ? [{ label: "A setup fault needs remediation", tone: "blocked" as const }] : []),
    ...(fpu && !approved && !frozen ? [{ label: "Approve the first invoice" }] : []),
    ...(fpu && approved && !verified ? [{ label: fpu.checkpoint === "POSTED" ? "Resume verification" : "Post and verify the first invoice" }] : []),
  ] : [];

  const recovery = error && !review && snapshot ? <ActionFailure message={error} retryHref={retryHref} kept={fpu ? "The prepared invoice, its posting key and your decisions are kept." : "Your essentials and decisions are kept."} />
    : snapshot?.gate_error ? <RecoveryNotice title="MoveBooks stopped before your first invoice" action={<a className="button secondary" href={sessionHref("/validate-configure", snapshot.session_id)}>Open Verify</a>}>
        <p><strong>What happened:</strong> {snapshot.gate_error}</p>
        <p><strong>What is kept:</strong> your migrated books, settings and decisions are unchanged.</p>
        <p><strong>Way forward:</strong> investigate the configured handoff in Verify. This check can&apos;t be bypassed here.</p>
      </RecoveryNotice>
    : snapshot?.onboarding && !fpu && faults.length ? <RecoveryNotice title="Onboarding is blocked" action={remediation}>
        <p><strong>What happened:</strong> a declared synthetic fault: {faultText(faults)}.</p>
        <p><strong>What is kept:</strong> migrated records and configured evidence are not edited.</p>
        <p><strong>Way forward:</strong> review the synthetic remediation. Removing the fault runs the checks again.</p>
      </RecoveryNotice>
    : fpu && invoiceFaults.length ? <RecoveryNotice title="Your first invoice is blocked" action={remediation}>
        <p><strong>What happened:</strong> {faultText(faults)}.</p>
        <p><strong>What is kept:</strong> the prepared invoice and its posting key. Nothing posts twice.</p>
        <p><strong>Way forward:</strong> review the synthetic remediation, then retry the approved invoice.</p>
      </RecoveryNotice>
    : fpu?.status === "BLOCKED" ? <RecoveryNotice title="Your first invoice is blocked">
        <p><strong>What happened:</strong> {fpu.checks.filter(c => !c.passed).map(c => `${sentence(c.id)}: ${c.explanation}`).join(" ") || "Posting stopped."}</p>
        <p><strong>What is kept:</strong> the prepared invoice, its posting key and your approval record.</p>
        <p><strong>Way forward:</strong> open the evidence; a retry needs the original approved terms.</p>
      </RecoveryNotice>
    : blockedTasks.length ? <RecoveryNotice title="Onboarding is blocked">
        <p><strong>What happened:</strong> {blockedTasks.map(t => `${t.label}: ${t.explanation}`).join(" ")}</p>
        <p><strong>What is kept:</strong> your migrated books and earlier decisions.</p>
        <p><strong>Way forward:</strong> {blockedTasks.map(t => t.next_action).join(" ")}</p>
      </RecoveryNotice>
    : undefined;

  const essentials = snapshot?.onboarding && <section className="v2s-section" aria-labelledby="onboard-title">
    <h2 id="onboard-title" tabIndex={-1}>Essentials for daily use · {complete} of {snapshot.tasks.length} ready</h2>
    <p className="v2s-section-lede">Migration complete · books verified · settings applied. {snapshot.verified_fpu ? "Your first synthetic invoice is verified." : snapshot.ready ? "Every essential is ready for your first invoice." : "Confirm the essentials that need you before your first synthetic invoice."}</p>
    <div className="v2s-split">
      <div className="v2s-split-main">
        <label className="v2s-queue review-queue">Onboarding checklist · {complete} of {snapshot.tasks.length} complete<select className="field-control" value={currentTask?.id ?? ""} onChange={event => setTaskId(event.target.value)}>{snapshot.tasks.map(task => <option key={task.id} value={task.id}>{task.label} · {taskState(task).label}</option>)}</select></label>
        {snapshot.tasks.filter(task => task.id === currentTask?.id).map(task => { const state = taskState(task); return <article key={task.id} className="v2-card v2-card-strong v2s-section" aria-labelledby={`task-${task.id}`}>
          <div className="v2s-section-head"><h3 id={`task-${task.id}`}>{task.label}</h3><StateChip tone={state.tone}>{state.label}</StateChip></div>
          <p>{task.explanation}</p>
          <p className="v2s-quiet">Next: {task.next_action}</p>
          {task.decision && <p className="v2s-small">{task.decision.actor} · {task.decision.role} · {task.decision.action}: {task.decision.selection} · {task.decision.at}</p>}
          <details className="v2s-details"><summary>Setup evidence</summary><Evidence values={task.evidence} /></details>
          <div className="v2s-buttons">{task.approval_required && !frozen && ["approve", "modify", "reject"].map(action => <Button key={action} size="small" variant={action === "reject" ? "danger" : action === "approve" && task.status !== "COMPLETED" && task.id === nextTaskForApproval ? "primary" : "secondary"} disabled={!safe} onClick={() => open({kind: "task", task, action: action as "approve" | "modify" | "reject"})}>{action[0].toUpperCase() + action.slice(1)} {task.label.toLowerCase().replace(/^(approve|confirm|choose) /, "")}</Button>)}<Button size="small" variant="ghost" disabled={busy} onClick={() => open({kind: "explain", task})}>Explain {task.label.toLowerCase()}</Button></div>
        </article>; })}
        {!snapshot.ready && currentTask?.status === "COMPLETED" && <div><Button variant="secondary" disabled={!safe} onClick={() => setTaskId(snapshot.tasks.find(task => task.status !== "COMPLETED")?.id)}>Review next prerequisite</Button></div>}
      </div>
      {snapshot.tasks.length > 0 && <div className="v2s-split-side v2-card v2s-section">
        <h3>{complete} of {snapshot.tasks.length} ready</h3>
        <ol className="v2s-rows" aria-label="All essentials">{snapshot.tasks.map(task => { const state = taskState(task); return <li key={task.id} aria-current={task.id === currentTask?.id ? "true" : undefined}><span className="v2s-row-main">{task.label}</span><StateChip tone={state.tone}>{state.label}</StateChip></li>; })}</ol>
      </div>}
    </div>
  </section>;

  const invoice = snapshot?.onboarding && <section className="v2s-section" aria-labelledby="fpu-title">
    <h2 id="fpu-title" ref={formRef} tabIndex={-1}>Your first invoice</h2>
    <p className="v2s-section-lede">Use migrated records and applied settings. The rules check the posting and its accounting impact.</p>
    {(!fpu || editing) && <form className="v2-card v2s-section" onSubmit={async e => {e.preventDefault(); if (await perform(`${root}/fpu/task`, {customer_id: customer, product_id: product, quantity, unit_price: price})) setEditing(false);}}>
      <div className="v2s-form">
        <label>Migrated customer<select required className="field-control" value={customer} onChange={e => setCustomer(e.target.value)}><option value="">Select customer</option>{snapshot.customers.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}</select></label>
        <label>Migrated service<select required className="field-control" value={product} onChange={e => setProduct(e.target.value)}><option value="">Select service</option>{snapshot.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Quantity<input required type="number" min={1} max={1000} step={1} className="field-control" value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label>
        <label>Unit price (USD)<input required inputMode="decimal" className="field-control" maxLength={20} value={price} onChange={e => setPrice(e.target.value)} /></label>
      </div>
      <div className="v2s-buttons"><Button type="submit" variant={snapshot.ready && !frozen ? "primary" : "secondary"} disabled={!safe || !snapshot.ready || frozen}>Prepare invoice contract</Button><span className="v2s-small">{snapshot.ready ? "Preparing or changing a draft requires fresh approval. No transaction is posted yet." : "Unlocks when every essential is ready. No transaction is posted yet."}</span></div>
    </form>}
    {fpu && <InvoiceDocument fpu={fpu} snapshot={snapshot} verified={false} nested>
      <div className="v2s-buttons">{invoiceLeads ? null : reviewInvoice}{!frozen && <><Button variant="secondary" disabled={!safe} onClick={() => {setEditing(true); setQuantity(fpu.inputs.quantity); setPrice(fpu.inputs.unit_price); formRef.current?.focus();}}>Modify invoice</Button><Button variant="danger" disabled={!safe} onClick={() => open({kind:"invoice", action:"reject"})}>Reject invoice</Button></>}{invoiceLeads ? postInvoice : null}</div>
      {fpu.decisions.length > 0 && <p className="v2s-small">Last decision: {fpu.decisions.at(-1)!.action} by {fpu.decisions.at(-1)!.actor}{fpu.decisions.at(-1)!.at ? ` · ${fpu.decisions.at(-1)!.at}` : ""}</p>}
      <JournalTable fpu={fpu} />
      {fpu.checks.length > 0 && <ol className="v2s-rows" aria-label="Invoice checks">{fpu.checks.map(check => <li key={check.id}><span className="v2s-row-main">{sentence(check.id)}<span className="v2s-row-sub">{check.explanation}</span></span><StateChip tone={check.passed ? "approved" : "blocked"}>{check.passed ? "Passed" : "Failed"}</StateChip></li>)}</ol>}
      <details className="v2s-details"><summary>Contract and posting details</summary>
        <Facts rows={[
          { label: "Tax", value: `${fpu.contract.tax_code} at ${fpu.contract.tax_rate}` },
          { label: "Receivable account (debit)", value: fpu.contract.receivable_account },
          { label: "Income account (credit)", value: fpu.contract.income_account },
          { label: "Tax control account (credit)", value: fpu.contract.tax_account },
          { label: "Checkpoint", value: fpu.checkpoint },
          { label: "Posting attempts", value: `${fpu.attempts} of ${fpu.retry_limit}` },
          { label: "Contract", value: fpu.contract_hash },
        ]} />
        <p className="v2s-small">Exact decimals and half-up two-decimal line tax. The selected records must stay usable, the approved mapping and configuration unchanged, and the invoice and journal must exactly match the contract. Identical retries use the original key; completed work is not replayed.</p>
        <Evidence values={[`contract:${fpu.contract_hash}`, `customer:${fpu.inputs.customer_id}`, `service:${fpu.inputs.product_id}`]} />
      </details>
      <ImpactTable impact={snapshot.accounting_impact} />
    </InvoiceDocument>}
  </section>;

  const figures = fpu ? invoiceFigures(fpu) : undefined;

  return <main className="shell migration-task v2s-page">
    <TaskContext phase={4} session={snapshot?.session_id} />
    <PhaseProgress session={snapshot?.session_id} status={snapshot?.workflow_status} current={projection?.current ?? null} held={projection?.held} currentLabel={projection?.currentLabel} />
    {verified && <p className="v2s-verified-chip"><svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor" /><path d="M5.5 10.5l3 3 6-6.5" fill="none" stroke="var(--v2-surface)" strokeWidth="2" /></svg>Ready to use · Verified</p>}
    <StageHeader stage={4} step={step} title={verified ? `${snapshot!.company_name} is ready to use` : title} guide={verified ? verifiedGuide(evidence?.id === snapshot?.session_id ? evidence?.data : undefined) : guide}>
      <p className="v2s-meta" ref={statusRef} tabIndex={-1} role="status" aria-live="polite">{busy ? <span>Checking evidence and recording your action…</span> : <>{snapshot && !verified && <span>{snapshot.company_name}</span>}<span>Synthetic Beta · no production provider or real customer data</span></>}</p>
    </StageHeader>
    {readState === "loading" && <p role="status" className="v2s-loading">Reading setup and invoice evidence…</p>}
    {readFailed && !snapshot && <ReadFailure retryHref={retryHref} />}
    {error && !review && !snapshot && !readFailed && <ActionFailure message={error} retryHref={retryHref} kept="Nothing in your migration has changed." />}

    {verified && snapshot && fpu && figures ? <VerifiedStart snapshot={snapshot} fpu={fpu} evidence={evidence?.id === snapshot.session_id ? evidence : undefined} recovery={recovery} />
      : snapshot && <WorkflowSummary
        label="Where Start stands"
        recovery={recovery}
        next={next}
        done={done}
        outstanding={outstanding}
        evidence={{ href: evidenceHref(snapshot.session_id), detail: "Essentials, invoice terms, approvals and checks.", label: "Open evidence" }}
      />}

    {snapshot?.onboarding && !verified && <>
      {!snapshot.ready && !fpu && essentials}
      {invoice}
      {(snapshot.ready || fpu) && <details className="v2s-details v2s-section"><summary>All essentials · {complete} of {snapshot.tasks.length} ready</summary>{essentials}</details>}
    </>}
    {verified && <details className="v2s-details v2s-section"><summary>All essentials · {complete} of {snapshot!.tasks.length} ready</summary>{essentials}</details>}
    {!!snapshot?.activity.length && <details className="v2s-details v2s-section"><summary>Decisions and activity</summary><ol className="v2s-activity" aria-label="Decisions and activity">{snapshot.activity.slice().reverse().map(a => <li key={a.id}><strong>{a.action}</strong><span className="v2s-quiet">{sentence(a.agent)}</span><details><summary>Action evidence</summary><Evidence values={a.evidence_references} /></details></li>)}</ol></details>}
    <details className="v2s-details v2s-section"><summary>Standalone onboarding scenarios · separate migration</summary><div className="v2-card v2s-section"><p className="v2s-quiet">Synthetic public-reference Beta. No real provider writes, bank connection, or production readiness claim. Demo loading explicitly replays earlier migration and configuration approvals. All new onboarding and invoice decisions are yours, attributed to the API-verified workspace owner. Local demo sessions are process-local; cloud-mode synthetic sessions use durable state.</p><div className="v2s-buttons"><label className="v2s-queue">Synthetic scenario<select className="field-control" value={scenario} onChange={e => setScenario(e.target.value)}>{["clean", "posting_failure", "missing_customer", "missing_product", "invalid_tax", "invalid_mapping", "totals_mismatch", "missing_role", "incomplete_configuration", "verification_interrupted"].map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></label><Button disabled={busy} variant="secondary" onClick={async () => { if (await perform("/onboarding-demo-sessions", {scenario})) { setEditing(false); setQuantity(1); setPrice("100.00"); } }}>Load synthetic scenario</Button></div></div></details>
    <Dialog open={!!review} fallbackFocusRef={statusRef} onClose={() => {if (!busy) {setReview(undefined); setError(undefined);}}} title={review?.kind === "repair" ? "Approve synthetic remediation?" : review?.kind === "invoice" ? "Review productive transaction" : review?.kind === "explain" ? "Grounded setup explanation" : "Review onboarding decision"}>
      {review && <div className="v2s-dialog">{"task" in review ? <><h3>{review.task.label}</h3><p>{review.task.explanation}</p><p className="v2s-quiet">{review.task.next_action}</p><Evidence values={review.task.evidence} />{review.kind === "task" && <label className="v2s-queue">Supported setup choice<select className="field-control" value={selection} onChange={e => setSelection(e.target.value)}>{review.task.choices.map(c => <option key={c}>{c}</option>)}</select></label>}</> : review.kind === "repair" ? <p>Approve removing the declared synthetic adapter faults ({snapshot?.onboarding?.faults.join(", ")}). Required decisions and deterministic checks still apply; retry uses the original task and key.</p> : <p>{review.action === "approve" ? `Approve posting ${fpu?.contract.currency} ${fpu?.contract.totals.total} to the displayed customer, service, tax and accounts?` : "Rejecting prevents posting. You may revise the draft or explicitly approve later."}</p>}
      {review.kind === "invoice" && fpu && snapshot && <div className="v2s-dialog">
        <h3>Invoice terms · {fpu.contract.currency}</h3>
        <Facts rows={[
          { label: "Customer", value: `${customerName(snapshot, fpu.inputs.customer_id)} (${fpu.inputs.customer_id})` },
          { label: "Service", value: `${snapshot.products.find(p => p.id === fpu.inputs.product_id)?.name ?? fpu.inputs.product_id} (${fpu.inputs.product_id})` },
          { label: "Quantity", value: fpu.inputs.quantity },
          { label: "Unit price", value: fpu.inputs.unit_price },
          { label: "Subtotal", value: fpu.contract.totals.subtotal },
          { label: "Tax", value: `${fpu.contract.totals.tax} (${fpu.contract.tax_code} at ${fpu.contract.tax_rate})` },
          { label: "Total", value: `${fpu.contract.currency} ${fpu.contract.totals.total}` },
          { label: "Terms", value: fpu.contract.payment_terms },
          { label: "Accounts", value: `Debit ${fpu.contract.receivable_account}; credit ${fpu.contract.income_account} and ${fpu.contract.tax_account}` },
          { label: "Contract", value: `${fpu.contract_hash} · checkpoint ${fpu.checkpoint}` },
        ]} />
        <p className="v2s-small">Approval records consent; posting and exact verification are separate. Changed terms require fresh approval.</p>
      </div>}
      {review.kind !== "explain" && <><p className="v2s-small">Recorded with the API-verified owner identity, role, timestamp and evidence hash. Local mode uses demo-user · DEMO_WORKSPACE_OWNER. Synthetic-only authority; no provider access.</p><label className="v2s-queue">Decision note (optional)<textarea maxLength={1000} className="field-control" value={comment} onChange={e => setComment(e.target.value)} /></label><div><Button disabled={busy} onClick={() => review.kind === "repair" ? perform(`${root}/onboarding/remediation`, {action:"approve",comment}) : review.kind === "invoice" ? perform(`${root}/fpu/decision`, {action:review.action,comment}) : perform(`${root}/onboarding/tasks/${review.task.id}/decision`, {action:review.action,selection,comment})}>Confirm {review.kind === "repair" ? "remediation" : review.action}</Button></div></>}
      {error && <p role="alert" className="v2s-dialog-error">{error} No success is assumed. <a className="v2s-text-link" href={`/onboard-fpu?session=${snapshot?.session_id}`}>Read current evidence</a></p>}<div><Button variant="secondary" disabled={busy} onClick={() => {setReview(undefined); setError(undefined);}}>Close review</Button></div></div>}
    </Dialog>
  </main>;
}
