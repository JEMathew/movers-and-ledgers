"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Badge, Button, Card, Panel } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status";
import { MigrationJourney } from "@/components/journey/MigrationJourney";
import { stepWithin } from "@/components/journey/journey";
import { ActionLink } from "@/components/journey/NextAction";
import type { Snapshot, Task } from "./types";
import { authHeaders } from "@/lib/identity";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const STORAGE = "movebooks-onboarding-session";
async function request(path: string, body?: object, method = "POST", key?: string): Promise<Snapshot> {
  const result = await fetch(`${BASE}/v1${path}`, { method, headers: { ...await authHeaders(), "Content-Type": "application/json", ...(key ? {"Idempotency-Key": key} : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (!result.ok) { const error = await result.json().catch(() => null); throw new Error(typeof error?.detail === "string" ? error.detail : "Action failed. Check the inputs and retry safely."); }
  return result.json();
}
function Evidence({ values }: {values: string[]}) { return <ul className="mt-3 space-y-2 break-all font-mono text-xs text-secondary">{values.map(v => <li key={v}>{v}</li>)}</ul>; }
type Review = { kind: "task" | "explain"; task: Task; action?: "approve" | "modify" | "reject" } | {kind: "invoice"; action: "approve" | "reject"} | {kind: "repair"};

export function OnboardFpuExperience() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [review, setReview] = useState<Review>();
  const [selection, setSelection] = useState("");
  const [comment, setComment] = useState("");
  const [scenario, setScenario] = useState("clean");
  const [customer, setCustomer] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("100.00");
  const statusRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLHeadingElement>(null);
  const [editing, setEditing] = useState(false);
  function accept(data: Snapshot) {
    setSnapshot(data);
    setCustomer(data.onboarding?.fpu?.inputs.customer_id ?? data.customers[0]?.id ?? "");
    setProduct(data.onboarding?.fpu?.inputs.product_id ?? data.products[0]?.id ?? "");
  }
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session") ?? sessionStorage.getItem("movebooks-migration-session") ?? sessionStorage.getItem(STORAGE);
    if (!id) return;
    let active = true;
    request(`/migration-sessions/${encodeURIComponent(id)}/onboarding`, undefined, "GET").then(data => { if (active) { accept(data); sessionStorage.setItem("movebooks-migration-session", data.session_id); } }).catch(() => { if (active) setError("Saved session unavailable. Start a new synthetic scenario."); });
    return () => { active = false; };
  }, []);
  async function perform(path: string, body?: object, key?: string) {
    setBusy(true); setError(undefined);
    try {
      const data = await request(path, body, "POST", key); accept(data);
      sessionStorage.setItem(STORAGE, data.session_id);
      sessionStorage.setItem("movebooks-migration-session", data.session_id);
      window.history.replaceState(null, "", `?session=${encodeURIComponent(data.session_id)}`);
      setReview(undefined); return data;
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Action not completed."); }
    finally { setBusy(false); }
  }
  function open(value: Review) { setError(undefined); setComment(""); setSelection("task" in value ? value.task.choices[0] ?? "" : ""); setReview(value); }
  const root = `/migration-sessions/${snapshot?.session_id}`;
  const fpu = snapshot?.onboarding?.fpu;
  const complete = snapshot?.tasks.filter(t => t.status === "COMPLETED").length ?? 0;
  const frozen = !!fpu && (fpu.checkpoint !== "DRAFT" || fpu.attempts > 0);
  const approved = fpu?.decisions.at(-1)?.action === "approve";
  const safe = !busy && !snapshot?.gate_error;

  return <main className="shell py-12">
    <div className="max-w-3xl"><p className="eyebrow text-primary">Set Up → Start Using</p><h1 className="type-page mt-3">Start Using Your Books</h1><p className="mt-5 type-body-secondary">Complete your first real task in your migrated books.</p></div>
    <MigrationJourney className="mt-8" current={!snapshot ? null : stepWithin(snapshot.workflow_status, snapshot.verified_fpu ? 9 : snapshot.ready || fpu ? 8 : 7)} />
    <Panel className="mt-8"><Badge>Synthetic public-reference Beta</Badge><p className="mt-3 text-sm text-secondary">No real provider writes, bank connection, or production readiness claim. Demo loading explicitly replays earlier migration and configuration approvals. All new onboarding and invoice decisions are yours, attributed to the API-verified workspace owner. Local demo sessions are process-local; cloud-mode synthetic sessions use durable state.</p><div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-sm">Synthetic scenario<select className="field-control mt-2 block max-w-full" value={scenario} onChange={e => setScenario(e.target.value)}>{["clean", "posting_failure", "missing_customer", "missing_product", "invalid_tax", "invalid_mapping", "totals_mismatch", "missing_role", "incomplete_configuration", "verification_interrupted"].map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></label><Button disabled={busy} variant="secondary" onClick={async () => { if (await perform("/onboarding-demo-sessions", {scenario})) { setEditing(false); setQuantity(1); setPrice("100.00"); } }}>Load synthetic scenario</Button></div></Panel>
    <div className="mt-4 min-h-6 text-sm" ref={statusRef} tabIndex={-1} role="status" aria-live="polite">{busy ? "Checking evidence and recording your action…" : snapshot ? `${snapshot.company_name} · ${snapshot.effective_status.replaceAll("_", " ")}` : "Choose a scenario or continue from Configure."}</div>
    {error && !review && <Alert tone="error" title="Action not completed"><p>{error}</p><p>No success is assumed. Review and retry.</p></Alert>}
    {snapshot?.gate_error && <Alert tone="error" title="Evidence gate blocked"><p>{snapshot.gate_error}</p><p>Investigate the configured handoff; it cannot be bypassed here.</p></Alert>}
    {snapshot && !snapshot.onboarding && <Button className="mt-4" disabled={!safe} onClick={() => perform(`${root}/onboarding`)}>Start onboarding from configured evidence</Button>}
    {snapshot?.onboarding && <>
      <section className="mt-8" aria-labelledby="onboard-title"><p className="eyebrow text-primary">01 / Guided Setup</p><h2 id="onboard-title" className="type-section mt-2">Finish the Essentials</h2><p className="mt-3 text-secondary">Migration complete · books validated · environment configured. {complete} of {snapshot.tasks.length} prerequisites complete. {snapshot.verified_fpu ? "Your first real task is verified; review the posted evidence below." : snapshot.ready ? "Ready for the invoice workflow below." : "Review the remaining setup and blockers below before your first real task."}</p><progress className="mt-4 w-full accent-blue-600" aria-label="Onboarding prerequisites completed" max={snapshot.tasks.length || 10} value={complete} />
        {!!snapshot.onboarding.faults.length && <Panel className="mt-4"><StatusBadge status="BLOCKED" /><h3 className="type-card mt-3">Declared Synthetic Fault</h3><p className="mt-2 break-words">{snapshot.onboarding.faults.join(", ").replaceAll("_", " ")}</p><p className="mt-2 text-sm text-secondary">Restoration removes only this demo adapter fault. Migrated records and configured evidence are not edited; checks run again.</p><Button className="mt-3" disabled={!safe} onClick={() => open({kind: "repair"})}>Review synthetic remediation</Button></Panel>}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">{snapshot.tasks.map(task => <Card key={task.id} className="min-w-0 motion-enter"><div className="flex flex-wrap justify-between gap-3"><h3 className="type-card">{task.label}</h3><StatusBadge status={task.status === "REVIEW_REQUIRED" ? "REQUIRES APPROVAL" : task.status} /></div><p className="mt-3 text-sm">{task.explanation}</p><p className="mt-2 text-sm text-secondary">Next: {task.next_action}</p>{task.decision && <p className="mt-2 break-words text-xs">{task.decision.actor} · {task.decision.role} · {task.decision.action}: {task.decision.selection}</p>}<details className="mt-3 text-sm"><summary className="cursor-pointer">Setup evidence</summary><Evidence values={task.evidence} /></details><div className="mt-3 flex flex-wrap gap-2"><Button size="small" variant="ghost" disabled={busy} onClick={() => open({kind: "explain", task})}>Explain {task.label.toLowerCase()}</Button>{task.approval_required && !frozen && ["approve", "modify", "reject"].map(action => <Button key={action} size="small" variant={action === "reject" ? "danger" : "secondary"} disabled={!safe} onClick={() => open({kind: "task", task, action: action as "approve" | "modify" | "reject"})}>{action[0].toUpperCase() + action.slice(1)} {task.label.toLowerCase()}</Button>)}</div></Card>)}</div>
      </section>
      <section className="mt-12" aria-labelledby="fpu-title"><p className="eyebrow text-primary">02 / Your First Real Task</p><h2 id="fpu-title" className="type-section mt-2" ref={formRef} tabIndex={-1}>Your First Customer Invoice</h2><p className="mt-3 text-secondary">Use migrated customer and service records, approved accounts, configured tax and payment terms. A button click is not success: posting, balanced accounting impact and audit evidence must all verify.</p>
        {(!fpu || editing) && <form className="mt-5" onSubmit={async e => {e.preventDefault(); if (await perform(`${root}/fpu/task`, {customer_id: customer, product_id: product, quantity, unit_price: price})) setEditing(false);}}><Panel><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Migrated customer<select required className="field-control mt-2 w-full" value={customer} onChange={e => setCustomer(e.target.value)}><option value="">Select customer</option>{snapshot.customers.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}</select></label><label className="text-sm">Migrated service<select required className="field-control mt-2 w-full" value={product} onChange={e => setProduct(e.target.value)}><option value="">Select service</option>{snapshot.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="text-sm">Quantity<input required type="number" min={1} max={1000} step={1} className="field-control mt-2 w-full" value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label><label className="text-sm">Unit price (USD)<input required inputMode="decimal" className="field-control mt-2 w-full" maxLength={20} value={price} onChange={e => setPrice(e.target.value)} /></label></div><Button className="mt-4" type="submit" disabled={!safe || !snapshot.ready || frozen}>Prepare invoice contract</Button><p className="mt-2 text-sm text-secondary">Preparing or changing a draft requires fresh approval. No transaction is posted yet.</p></Panel></form>}
        {fpu && <Panel className="mt-5 motion-enter"><StatusBadge status={snapshot.verified_fpu ? "VERIFIED" : fpu.status === "BLOCKED" ? "BLOCKED" : approved ? "READY" : "REQUIRES APPROVAL"} /><h3 className="type-card mt-3">Invoice contract · {fpu.contract.currency}</h3><dl className="mt-4 grid gap-4 sm:grid-cols-3">{Object.entries(fpu.contract.totals).map(([k,v]) => <div key={k}><dt className="text-sm text-secondary capitalize">{k}</dt><dd className="mt-1 text-xl font-semibold">{v}</dd></div>)}</dl><p className="mt-4 text-sm">Tax {fpu.contract.tax_code} at {fpu.contract.tax_rate} · {fpu.contract.payment_terms}. Debit A/R {fpu.contract.receivable_account}; credit income {fpu.contract.income_account} and approved synthetic tax control {fpu.contract.tax_account}.</p><p className="mt-2 text-sm text-secondary">Checkpoint: {fpu.checkpoint} · Posting attempts: {fpu.attempts}/{fpu.retry_limit}. Identical retries use the original key; completed work is not replayed.</p><details className="mt-3 text-sm"><summary className="cursor-pointer">Explain contract and evidence</summary><p className="mt-2">Exact decimals and half-up two-decimal line tax. The selected entities must remain usable, the approved mapping and configuration unchanged, and the invoice and journal must exactly match the contract.</p><Evidence values={[`contract:${fpu.contract_hash}`, `customer:${fpu.inputs.customer_id}`, `service:${fpu.inputs.product_id}`]} /></details>
          {!snapshot.verified_fpu && <div className="mt-4 flex flex-wrap gap-3">{!frozen && <><Button disabled={!safe || editing} onClick={() => open({kind:"invoice", action:"approve"})}>Review invoice approval</Button><Button variant="secondary" disabled={!safe} onClick={() => {setEditing(true); setQuantity(fpu.inputs.quantity); setPrice(fpu.inputs.unit_price); formRef.current?.focus();}}>Modify invoice</Button><Button variant="danger" disabled={!safe} onClick={() => open({kind:"invoice", action:"reject"})}>Reject invoice</Button></>}<Button disabled={!safe || !approved || editing || !snapshot.ready || (fpu.checkpoint === "DRAFT" && fpu.attempts >= fpu.retry_limit)} onClick={() => perform(`${root}/fpu/execute`, undefined, fpu.idempotency_key ?? `fpu-${fpu.id}`)}>{fpu.checkpoint === "POSTED" ? "Resume verification" : fpu.attempts ? "Retry approved invoice" : "Post and verify invoice"}</Button></div>}
          {fpu.checks.length > 0 && <ul className="mt-4 space-y-3">{fpu.checks.map(check => <li key={check.id} className="text-sm"><StatusBadge status={check.passed ? "VERIFIED" : "BLOCKED"} /><span className="ml-2">{check.id.replaceAll("_", " ")}: {check.explanation}</span><details className="mt-2"><summary className="cursor-pointer">Verification evidence</summary><Evidence values={check.evidence} /></details></li>)}</ul>}
          {snapshot.verified_fpu && <div className="mt-6 motion-enter"><h3 className="type-section">Business Ready · Verified</h3><p className="mt-3">Migration complete. Books validated. Environment configured. Onboarding complete. Your business has posted and verified its first real invoice in the synthetic target environment.</p><p className="mt-2 text-sm text-secondary">Posted by {fpu.posted_by} at {fpu.posted_at}. Verified at {fpu.verified_at}. This is not production readiness or a real-provider accounting transaction.</p><ActionLink className="mt-5" label="Review Verified Evidence" href={`/trust?session=${encodeURIComponent(snapshot.session_id)}`} /></div>}
          {fpu.invoice && <details className="mt-5"><summary className="cursor-pointer font-semibold">Posted invoice, journal and accounting impact</summary><pre className="mt-3 overflow-auto rounded-lg bg-surface-sunken p-4 text-xs">{JSON.stringify({invoice:fpu.invoice, journal:fpu.journal, accounting_impact:snapshot.accounting_impact}, null, 2)}</pre></details>}
        </Panel>}
      </section>
    </>}
    {!!snapshot?.activity.length && <section className="mt-12"><h2 className="type-section">Agent & Human Activity</h2><Panel className="mt-4"><ol className="space-y-4">{snapshot.activity.slice().reverse().map(a => <li key={a.id} className="text-sm"><p className="font-semibold">{a.action}</p><p className="mt-1 text-secondary">{a.agent}</p><details><summary className="cursor-pointer">Action evidence</summary><Evidence values={a.evidence_references} /></details></li>)}</ol></Panel></section>}
    <Dialog open={!!review} fallbackFocusRef={statusRef} onClose={() => {if (!busy) {setReview(undefined); setError(undefined);}}} title={review?.kind === "repair" ? "Approve synthetic remediation?" : review?.kind === "invoice" ? "Review productive transaction" : review?.kind === "explain" ? "Grounded setup explanation" : "Review onboarding decision"}>
      {review && <>{"task" in review ? <><h3 className="type-card">{review.task.label}</h3><p className="mt-3 text-sm">{review.task.explanation}</p><p className="mt-2 text-sm">{review.task.next_action}</p><Evidence values={review.task.evidence} />{review.kind === "task" && <label className="mt-4 block text-sm">Supported setup choice<select className="field-control mt-2 w-full" value={selection} onChange={e => setSelection(e.target.value)}>{review.task.choices.map(c => <option key={c}>{c}</option>)}</select></label>}</> : review.kind === "repair" ? <p>Approve removing the declared synthetic adapter faults ({snapshot?.onboarding?.faults.join(", ")}). Required decisions and deterministic checks still apply; retry uses the original task and key.</p> : <p>{review.action === "approve" ? `Approve posting ${fpu?.contract.currency} ${fpu?.contract.totals.total} to the displayed customer, service, tax and accounts?` : "Rejecting prevents posting. You may revise the draft or explicitly approve later."}</p>}
      {review.kind !== "explain" && <><p className="mt-4 text-sm text-secondary">Recorded with the API-verified owner identity, role, timestamp and evidence hash. Local mode uses demo-user · DEMO_WORKSPACE_OWNER. Synthetic-only authority; no provider access.</p><label className="mt-4 block text-sm">Decision note (optional)<textarea maxLength={1000} className="field-control mt-2 w-full" value={comment} onChange={e => setComment(e.target.value)} /></label><Button className="mt-4" disabled={busy} onClick={() => review.kind === "repair" ? perform(`${root}/onboarding/remediation`, {action:"approve",comment}) : review.kind === "invoice" ? perform(`${root}/fpu/decision`, {action:review.action,comment}) : perform(`${root}/onboarding/tasks/${review.task.id}/decision`, {action:review.action,selection,comment})}>Confirm {review.kind === "repair" ? "remediation" : review.action}</Button></>}
      {error && <p className="mt-4" role="alert">{error} No success is assumed.</p>}<Button className="mt-4 ml-2" variant="secondary" disabled={busy} onClick={() => {setReview(undefined); setError(undefined);}}>Close review</Button></>}
    </Dialog>
  </main>;
}
