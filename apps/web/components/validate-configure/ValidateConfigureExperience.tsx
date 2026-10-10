"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { Badge, Button, Card, Panel } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status";
import { PhaseProgress, TaskContext } from "@/components/journey/PhaseProgress";
import { journeyEvidenceFrom, PROCESSING, projectJourney } from "@/components/journey/journey";
import { ActionLink } from "@/components/journey/NextAction";
import type { Check, Proposal, Snapshot } from "./types";
import { demoCreationKey, finishDemoCreation } from "@/lib/demo-creation";
import { authHeaders } from "@/lib/identity";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const STORAGE_KEY = "movebooks-validation-session";

async function request(path: string, body?: object, method = "POST", key?: string): Promise<Snapshot> {
  const response = await fetch(`${API_BASE}/v1${path}`, {
    method, headers: { ...await authHeaders(), "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => null);
    throw new Error(failure?.detail ?? "Request failed. Retry after checking the local API.");
  }
  return response.json();
}

function Evidence({ values }: { values: string[] }) {
  return <ul className="mt-3 space-y-2 break-all font-mono text-xs text-secondary">{values.map(value => <li key={value}>{value}</li>)}</ul>;
}

function CheckCard({ check, currency, policy }: { check: Check; currency: string; policy: string }) {
  return <Card className="min-w-0 motion-enter">
    <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="type-card">{check.label}</h3><StatusBadge status={check.status === "WARNING" ? "NEEDS ATTENTION" : check.status} /></div>
    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
      {[ ["Source", check.source], ["Target", check.target], ["Difference (target − source)", check.difference] ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-secondary">{label}</dt><dd className="mt-1 break-all font-mono">{value}</dd></div>)}
    </dl>
    <p className="mt-3 text-sm">{currency} · Rule {check.id} · Policy {policy}</p>
    <p className="mt-4 text-sm">{check.explanation}</p>
    <p className="mt-2 text-sm text-secondary">Next: {check.next_action}</p>
    <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">Evidence and contributing records</summary><Evidence values={check.evidence} /><p className="mt-2 break-all">Records: {check.record_ids.join(", ") || "Dataset-level check"}</p></details>
  </Card>;
}

export function ValidateConfigureExperience() {
  const statusRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [readState, setReadState] = useState<"loading" | "ready" | "error">("loading");
  const [configurationId, setConfigurationId] = useState<string>();
  const [error, setError] = useState<string>();
  const [dialog, setDialog] = useState<{ kind: "explain" | "decision"; proposal: Proposal; action?: "approve" | "modify" | "reject" } | { kind: "repair"; resolutionId: string }>();
  const [selected, setSelected] = useState("");
  const [comment, setComment] = useState("");

  // A user action supersedes a still-pending initial read; the late read is ignored.
  const acted = useRef(0);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session") ?? sessionStorage.getItem("movebooks-migration-session") ?? sessionStorage.getItem(STORAGE_KEY);
    if (!id) { setReadState("ready"); return; }
    let active = true;
    const before = acted.current;
    const fresh = () => active && acted.current === before;
    request(`/migration-sessions/${encodeURIComponent(id)}/validation-configuration`, undefined, "GET")
      .then(data => { if (fresh()) { setReadState("ready"); setSnapshot(data); sessionStorage.setItem("movebooks-migration-session", data.session_id); } })
      .catch(() => { if (fresh()) { setReadState("error"); setError("This migration is unavailable. Read the same migration again; no replacement or progress is assumed."); } });
    return () => { active = false; };
  }, []);

  async function perform(path: string, body?: object, close = false) {
    acted.current += 1;
    // Checking the books is the one long-running step worth naming on the journey.
    setBusy(true); setChecking(/\/(re)?validation$/.test(path)); setError(undefined);
    try {
      const demo = path === "/validation-demo-sessions";
      const key = demo ? demoCreationKey(path, body) : undefined;
      const data = await request(path, body, "POST", key);
      if (demo) finishDemoCreation(path);
      setReadState("ready"); setSnapshot(data);
      sessionStorage.setItem(STORAGE_KEY, data.session_id);
      sessionStorage.setItem("movebooks-migration-session", data.session_id);
      window.history.replaceState(null, "", `?session=${encodeURIComponent(data.session_id)}`);
      if (close) setDialog(undefined);
      return data;
    } catch (caught) {
      setReadState("error"); setError(caught instanceof Error ? caught.message : "The action could not complete safely.");
    } finally { setBusy(false); setChecking(false); }
  }
  const root = `/migration-sessions/${snapshot?.session_id}`;
  const projection = readState === "ready" && snapshot ? projectJourney(journeyEvidenceFrom(snapshot)) : undefined;
  const report = snapshot?.report;
  const plan = snapshot?.configuration;
  const ready = readState === "ready" && !busy;
  const currentConfiguration = plan?.proposals.find(p => p.id === configurationId) ?? plan?.proposals.find(p => !["APPLIED", "APPROVED", "MODIFIED"].includes(p.state)) ?? plan?.proposals[0];
  const approved = plan?.proposals.length && plan.proposals.every(p => ["APPLIED", "APPROVED", "MODIFIED"].includes(p.state));
  const discrepancies = report?.checks.filter(c => c.status !== "VERIFIED") ?? [];
  const altered = report?.checks.find(c => c.id === "transformations")?.record_ids ?? [];
  const pendingRepair = snapshot?.repairs.find(r => !r.applied);
  // Verifying (or re-verifying after a repair) leads only until the books match; after that,
  // continuing to configuration or completing setup is the one dominant action.
  const revalidateLeads = !report || (report.status !== "VERIFIED" && !plan);

  function openDecision(proposal: Proposal, action: "approve" | "modify" | "reject") {
    setSelected(proposal.selected_value); setComment(""); setError(undefined);
    setDialog({ kind: "decision", proposal, action });
  }

  const verification = (
snapshot && <section className="mt-4" aria-labelledby="validation-title">
    {plan && <p className="mt-2 text-secondary">Revalidating reruns every check and discards the current configuration, so settings must be reviewed and applied again.</p>}

      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow text-primary">01 / Book Verification</p><h2 id="validation-title" className="type-section mt-2">Migration Validation</h2></div><Button variant={revalidateLeads && !pendingRepair && !altered.length ? "primary" : "secondary"} size={revalidateLeads ? "default" : "small"} disabled={!ready || !!pendingRepair} leadingIcon={RefreshCw} onClick={() => perform(`${root}/${report ? "revalidation" : "validation"}`)}>{report ? "Revalidate Migration" : "Verify My Books"}</Button></div>
      {report && <><Panel className="mt-5"><div className="flex flex-wrap items-center gap-3"><StatusBadge status={report.status === "WARNING" ? "NEEDS ATTENTION" : report.status} /><span className="text-sm">{report.checks.length - discrepancies.length} matched · {discrepancies.length} need attention · {report.currency}</span></div><p className="mt-3 text-sm text-secondary">{report.status === "VERIFIED" ? "All supplied checks match. Continue to governed configuration; this does not certify production books." : "Configuration is blocked. Resolve the differences below and run validation again."} Exact decimal policy; no silent tolerance or write-off.</p></Panel>
        {discrepancies.length > 0 && <Panel className="mt-4"><h3 className="type-card">Resolution Path</h3><p className="mt-2 text-sm text-secondary">A changed synthetic record can be restored to its approved source with your explicit approval. Missing records, source errors, or unsupported repairs require investigation; they cannot be waived here.</p>
          <div className="mt-4 flex flex-wrap gap-3">{pendingRepair ? <Button disabled={!ready} onClick={() => setDialog({ kind: "repair", resolutionId: pendingRepair.resolution_id })}>Review proposed repair</Button> : altered.map((key, index) => <Button key={key} variant={index === 0 ? "primary" : "secondary"} disabled={!ready} onClick={async () => { const [entity, record_id] = key.split(":"); const data = await perform(`${root}/validation/resolutions`, { entity, record_id }); const repair = data?.repairs.find(r => !r.applied); if (repair) setDialog({ kind: "repair", resolutionId: repair.resolution_id }); }}>Review repair: {key}</Button>)}</div>
        </Panel>}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">{discrepancies.map(check => <CheckCard key={check.id} check={check} currency={report.currency} policy={report.policy_version} />)}</div>
        <details className="mt-5"><summary className="cursor-pointer font-semibold">{report.checks.length - discrepancies.length} matching checks — inspect source, target, difference, and evidence</summary><p className="mt-3 text-sm text-secondary">{report.checks.filter(check => check.status === "VERIFIED").map(check => check.label).join(" · ")}</p><div className="mt-4 grid gap-4 lg:grid-cols-2">{report.checks.filter(check => check.status === "VERIFIED").map(check => <CheckCard key={check.id} check={check} currency={report.currency} policy={report.policy_version} />)}</div></details>
        {!plan && <Button className="mt-6" disabled={!ready || report.status !== "VERIFIED"} leadingIcon={ShieldCheck} onClick={() => perform(`${root}/configuration`)}>Continue to configuration</Button>}
      </>}
    </section>
  );

  return <main className="shell migration-task">
    <div className="max-w-3xl"><p className="eyebrow text-primary">Verify</p><h1 className="type-page mt-3">Verify Your Books</h1>
      <p className="mt-5 type-body-secondary">Match books. Review settings.</p>
    </div>
    <p className="mt-2 text-secondary">Synthetic Beta · exact financial checks and human decisions remain required.</p>
    <TaskContext phase={3} session={snapshot?.session_id} />
    <PhaseProgress session={snapshot?.session_id} status={snapshot?.workflow_status} current={projection?.current ?? null} held={projection?.held} currentLabel={projection?.currentLabel} processing={checking ? PROCESSING.validate : undefined} />
    <div className="mt-4 min-h-6 text-sm" ref={statusRef} tabIndex={-1} role="status" aria-live="polite">{busy ? "Checking evidence and recording the action…" : snapshot ? `${snapshot.company_name} · ${snapshot.workflow_status.replaceAll("_", " ")}` : "Choose a scenario or continue from a completed migration."}</div>
    {readState === "loading" && <p role="status">Reading verification evidence…</p>}
    {error && !dialog && <Alert tone="error" title="Action not completed"><p>{error}</p><p className="mt-2">No successful handoff is assumed. Read current evidence before another decision.</p><a className="underline" href={snapshot ? `?session=${encodeURIComponent(snapshot.session_id)}` : "/workspace"}>Read migration again</a></Alert>}
      {readState === "ready" && snapshot?.ready_for_onboarding && <Panel className="mt-6 motion-enter"><StatusBadge status="VERIFIED" /><h3 className="type-card mt-3">Configured · ready for Onboarding</h3><p className="mt-3 text-secondary">Validation is verified and required decisions are complete. Continue to governed onboarding and verify a first productive invoice in the synthetic target.</p><ActionLink className="mt-4" label="Complete Setup" href={`/onboard-fpu?session=${encodeURIComponent(snapshot.session_id)}`} /><details className="mt-4 text-sm"><summary className="cursor-pointer">Applied target settings</summary><dl>{Object.entries(plan!.target_settings).map(([key, value]) => <div key={key} className="mt-2"><dt>{key.replaceAll("_", " ")}</dt><dd className="font-mono">{value}</dd></div>)}</dl></details></Panel>}
    {plan && <section className="mt-4" aria-labelledby="configuration-title"><h2 id="configuration-title" className="type-section mt-2">Review Your Settings</h2>
      <label className="review-queue">Settings queue · {plan.proposals.filter(p => !["APPLIED", "APPROVED", "MODIFIED"].includes(p.state)).length} pending<select className="field-control" value={currentConfiguration?.id ?? ""} onChange={event => setConfigurationId(event.target.value)}>{plan.proposals.map(p => <option key={p.id} value={p.id}>{p.label} · {p.state.replaceAll("_", " ")}</option>)}</select></label>
      <div className="mt-4 grid gap-4">{plan.proposals.filter(proposal => proposal.id === currentConfiguration?.id).map(proposal => <Card key={proposal.id} className="min-w-0 motion-enter"><div className="flex flex-wrap justify-between gap-3"><h3 className="type-card">{proposal.label}</h3><Badge>{proposal.risk} risk</Badge></div><div className="mt-3"><StatusBadge status={proposal.state === "APPLIED" ? "COMPLETED" : ["BLOCKED", "REJECTED"].includes(proposal.state) ? "BLOCKED" : ["APPROVED", "MODIFIED"].includes(proposal.state) ? "READY" : "REQUIRES APPROVAL"} /><span className="ml-2 text-xs">{proposal.state}</span></div>        <div className="mt-4 flex flex-wrap gap-2">{proposal.state !== "APPLIED" && <>{proposal.state === "APPROVED" ? <Button size="small" variant="secondary" disabled leadingIcon={CheckCircle2} aria-label={`${proposal.label} approved`}>Approved</Button> : <Button size="small" variant={approved ? "secondary" : "primary"} disabled={!ready || proposal.state === "BLOCKED"} onClick={() => openDecision(proposal, "approve")}>Approve {proposal.label.toLowerCase()}</Button>}<Button size="small" variant="secondary" disabled={!ready} onClick={() => openDecision(proposal, "modify")}>Modify {proposal.label.toLowerCase()}</Button><Button size="small" variant="danger" disabled={!ready} onClick={() => openDecision(proposal, "reject")}>Reject {proposal.label.toLowerCase()}</Button></>}<Button variant="ghost" size="small" disabled={!ready} onClick={() => { setError(undefined); setDialog({ kind: "explain", proposal }); }}>Explain {proposal.label.toLowerCase()}</Button></div><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-secondary">Source</dt><dd className="break-all">{proposal.source_value || "Missing evidence"}</dd></div><div><dt className="text-secondary">Target selection</dt><dd className="break-all">{proposal.selected_value || "Not set"}</dd></div></dl><p className="mt-4 text-sm text-secondary">{proposal.policy_reason}</p>{proposal.decided_by && <p className="mt-2 text-xs">Decision by {proposal.decided_by}: {proposal.decision}</p>}

      </Card>)}</div>
<p className="mt-3 text-secondary">Review each required setting. Unchanged low-risk preferences auto-apply; rejection keeps setup blocked.</p>
      {!approved && currentConfiguration && ["APPLIED", "APPROVED", "MODIFIED"].includes(currentConfiguration.state) && <Button className="mt-4" disabled={!ready} onClick={() => setConfigurationId(plan.proposals.find(p => !["APPLIED", "APPROVED", "MODIFIED"].includes(p.state))?.id)}>Review next setting</Button>}
      {!snapshot?.ready_for_onboarding && <div className="mt-6"><Button variant={approved ? "primary" : "secondary"} disabled={!ready || !approved} leadingIcon={CheckCircle2} onClick={() => perform(`${root}/configuration/apply`)}>Apply reviewed configuration</Button><p className="mt-2 text-sm text-secondary">All eight areas need valid evidence and every required approval before handoff.</p></div>}

    </section>}
    {plan ? <details className="mt-6"><summary>Verified financial report · exact source, target and evidence</summary>{verification}</details> : verification}
    {!!snapshot?.activity.length && <details className="mt-6"><summary>Agent and human activity</summary><section className="mt-4" aria-labelledby="activity-title"><h2 id="activity-title" className="type-section">Agent & Human Activity</h2><Panel className="mt-4"><ol className="space-y-4">{snapshot.activity.slice().reverse().map(item => <li key={item.id} className="break-words text-sm"><p className="font-semibold">{item.action}</p><p className="mt-1 text-secondary">{item.agent} · {item.provenance} · {item.status}</p><details><summary className="mt-2 cursor-pointer">Action evidence</summary><Evidence values={item.evidence_references} /></details></li>)}</ol></Panel></section></details>}
    <details className="mt-6"><summary>Standalone verification scenarios · separate migration</summary>    <Panel className="mt-8"><Badge>Synthetic public-reference Beta</Badge><p className="mt-3 text-sm text-secondary">No provider writes. No production readiness claim. These scenarios explicitly replay earlier synthetic migration approvals; your validation repairs and configuration decisions remain interactive. Local demo sessions are process-local and may expire; cloud synthetic workspaces persist across restarts.</p>
      <div className="mt-4 flex flex-wrap gap-3"><Button disabled={busy} variant="secondary" onClick={() => perform("/validation-demo-sessions", { scenario: "ar_discrepancy" })}>Load discrepancy scenario</Button><Button disabled={busy} variant="ghost" onClick={() => perform("/validation-demo-sessions", { scenario: "clean" })}>Load reconciled scenario</Button></div>
    </Panel>
</details>
     <Dialog fallbackFocusRef={statusRef} open={!!dialog} onClose={() => { if (!busy) { setDialog(undefined); setError(undefined); } }} title={dialog?.kind === "repair" ? "Approve synthetic record restoration?" : dialog?.kind === "explain" ? "Grounded configuration explanation" : `${dialog?.action ?? "Review"} configuration`}>
      {dialog?.kind === "repair" ? <><p className="text-sm">{snapshot?.resolutions.find(r => r.id === dialog.resolutionId)?.rationale}</p><Evidence values={snapshot?.resolutions.find(r => r.id === dialog.resolutionId)?.evidence ?? []} /><p className="mt-4 text-sm">This copies only the checksum-bound source record into the synthetic target and retains its previous payload for audit. You must revalidate afterwards.</p><Button className="mt-5" disabled={!ready} onClick={() => perform(`${root}/validation/resolutions/${dialog.resolutionId}/approve`, undefined, true)}>Approve restoration</Button></> : dialog && <><h3 className="type-card">{dialog.proposal.label}</h3><p className="mt-3 text-sm">{dialog.proposal.explanation}</p><p className="mt-2">Source: {dialog.proposal.source_value || "Missing evidence"} · Target: {dialog.proposal.selected_value || "Not set"}</p><p>{dialog.proposal.risk} risk · {dialog.proposal.policy_reason}</p><Evidence values={dialog.proposal.evidence} />{dialog.kind === "decision" && <><p className="mt-3 text-sm">Selected: {dialog.proposal.selected_value}. {dialog.action === "reject" ? "Rejection blocks configuration completion; you can revise this decision later." : "Your decision will be attributed to the current demo identity."}</p>{dialog.action === "modify" && <label className="mt-4 block text-sm">Supported target value<select className="field-control mt-2 w-full" value={selected} onChange={event => setSelected(event.target.value)}>{dialog.proposal.alternatives.map(value => <option key={value}>{value}</option>)}</select></label>}<label className="mt-4 block text-sm">Decision note (optional)<textarea className="field-control mt-2 w-full" maxLength={1000} value={comment} onChange={event => setComment(event.target.value)} /></label><Button className="mt-4" disabled={!ready} onClick={() => perform(`${root}/configuration/${dialog.proposal.id}/decision`, { action: dialog.action, ...(dialog.action === "modify" ? { value: selected } : {}), comment }, true)}>Confirm {dialog.action}</Button></>}</>}
      {error && <div className="mt-4" role="alert">{error} No new consent is assumed. <a className="underline" href={`/validate-configure?session=${snapshot?.session_id}`}>Read current evidence</a></div>}
      <Button className="mt-4 ml-2" variant="secondary" disabled={!ready} onClick={() => { setDialog(undefined); setError(undefined); }}>Close review</Button>
    </Dialog>
  </main>;
}
