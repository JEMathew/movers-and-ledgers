"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/primitives";
import { PhaseProgress, TaskContext } from "@/components/journey/PhaseProgress";
import { journeyEvidenceFrom, journeyStepFor, PROCESSING, projectJourney } from "@/components/journey/journey";
import { ActionLink } from "@/components/journey/NextAction";
import { RecoveryNotice, StageHeader, WorkflowSummary } from "@/components/v2/Workflow";
import type { Outstanding } from "@/components/v2/Workflow";
import { ActionFailure, checkGroups, differenceText, evidenceHref, Facts, ReadFailure, sentence, sessionHref, StateChip, trialBalanceCheck } from "@/components/migrate-resolve/stage-kit";
import type { ChipTone } from "@/components/migrate-resolve/stage-kit";
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

const DONE_STATES = ["APPLIED", "APPROVED", "MODIFIED"];
/** Setting state wording. The stored value stays the API's. */
const SETTING_STATE: Record<string, { tone: ChipTone; label: string }> = {
  APPLIED: { tone: "approved", label: "Applied" }, APPROVED: { tone: "approved", label: "Approved" }, MODIFIED: { tone: "changed", label: "Changed" },
  REJECTED: { tone: "rejected", label: "Rejected" }, BLOCKED: { tone: "blocked", label: "Blocked" },
};
const settingState = (state: string) => SETTING_STATE[state] ?? { tone: "needs_review" as const, label: "Needs review" };
const checkState = (status: Check["status"]): { tone: ChipTone; label: string } => status === "VERIFIED" ? { tone: "approved", label: "Matched" } : status === "WARNING" ? { tone: "needs_review", label: "Needs attention" } : { tone: "blocked", label: "Does not match" };
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Evidence({ values }: { values: string[] }) {
  return <ul className="v2s-evidence-list">{values.map(value => <li key={value}>{value}</li>)}</ul>;
}

function CheckCard({ check, currency, policy }: { check: Check; currency: string; policy: string }) {
  const state = checkState(check.status);
  return <article className={`v2-card v2s-section${check.status === "VERIFIED" ? "" : " v2-card-blocked"}`}>
    <div className="v2s-section-head"><h3>{check.label}</h3><StateChip tone={state.tone}>{state.label}</StateChip></div>
    <dl className="v2s-terms">
      {[["Source", check.source], ["Target", check.target], ["Difference (target − source)", check.difference]].map(([label, value]) => <div key={label} className="min-w-0"><dt>{label}</dt><dd className="v2-num">{value}</dd></div>)}
    </dl>
    <p className="v2s-small">{currency} · Rule {check.id} · Policy {policy}</p>
    <p>{check.explanation}</p>
    <p className="v2s-quiet">Next: {check.next_action}</p>
    <details className="v2s-details"><summary>Evidence and contributing records</summary><Evidence values={check.evidence} /><p className="v2s-small">Records: {check.record_ids.join(", ") || "Dataset-level check"}</p></details>
  </article>;
}

const APPLIED_STATUSES = ["CONFIGURED", "ONBOARDING", "ONBOARDING_BLOCKED", "READY_FOR_FIRST_PRODUCTIVE_USE", "FIRST_PRODUCTIVE_USE_IN_PROGRESS", "FIRST_PRODUCTIVE_USE_BLOCKED", "VERIFIED_FIRST_PRODUCTIVE_USE"];

export function ValidateConfigureExperience() {
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [readState, setReadState] = useState<"loading" | "ready" | "error">("loading");
  const [readFailed, setReadFailed] = useState(false);
  const [requested, setRequested] = useState<string>();
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
    setRequested(id);
    let active = true;
    const before = acted.current;
    const fresh = () => active && acted.current === before;
    request(`/migration-sessions/${encodeURIComponent(id)}/validation-configuration`, undefined, "GET")
      .then(data => { if (fresh()) { setReadState("ready"); setSnapshot(data); sessionStorage.setItem("movebooks-migration-session", data.session_id); } })
      .catch(() => { if (fresh()) { setReadState("error"); setReadFailed(true); setError("This migration is unavailable. Read the same migration again; no replacement or progress is assumed."); } });
    return () => { active = false; };
  }, []);

  async function perform(path: string, body?: object, close = false) {
    acted.current += 1;
    // Checking the books is the one long-running step worth naming on the journey.
    setBusy(true); setChecking(/\/(re)?validation$/.test(path)); setError(undefined); setReadFailed(false);
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
  const currentConfiguration = plan?.proposals.find(p => p.id === configurationId) ?? plan?.proposals.find(p => !DONE_STATES.includes(p.state)) ?? plan?.proposals[0];
  const approved = plan?.proposals.length && plan.proposals.every(p => DONE_STATES.includes(p.state));
  const discrepancies = report?.checks.filter(c => c.status !== "VERIFIED") ?? [];
  const altered = report?.checks.find(c => c.id === "transformations")?.record_ids ?? [];
  const pendingRepair = snapshot?.repairs.find(r => !r.applied);
  const appliedRepairs = snapshot?.repairs.filter(r => r.applied) ?? [];
  const restored = (key: string) => appliedRepairs.some(r => `${r.entity}:${r.record_id}` === key);
  // Verifying (or re-verifying after a repair) leads only until the books match; after that,
  // continuing to configuration or completing setup is the one dominant action.
  const revalidateLeads = !report || (report.status !== "VERIFIED" && !plan);
  const repairLeads = !!pendingRepair || altered.some(key => !restored(key));
  const groups = report ? checkGroups(report.checks) : undefined;
  const trial = trialBalanceCheck(report?.checks);
  const difference = report ? differenceText(trial, report.currency) : undefined;
  const pendingSettings = plan?.proposals.filter(p => !DONE_STATES.includes(p.state)) ?? [];
  const stuckSettings = plan?.proposals.filter(p => ["REJECTED", "BLOCKED"].includes(p.state)) ?? [];
  const decidedSettings = plan?.proposals.filter(p => p.decided_by) ?? [];
  const retryHref = sessionHref("/validate-configure", snapshot?.session_id ?? requested);
  const moved = snapshot ? (journeyStepFor(snapshot.workflow_status) ?? -1) >= 6 : false;
  // Settings are applied once the migration reaches Start; `ready_for_onboarding` is only true at CONFIGURED, so a
  // migration that has moved on must not be offered "Apply" again (the API would refuse it).
  const settingsApplied = Boolean(snapshot?.ready_for_onboarding) || APPLIED_STATUSES.includes(snapshot?.workflow_status ?? "");
  const firstInvoiceVerified = snapshot?.workflow_status === "VERIFIED_FIRST_PRODUCTIVE_USE";

  function openDecision(proposal: Proposal, action: "approve" | "modify" | "reject") {
    setSelected(proposal.selected_value); setComment(""); setError(undefined);
    setDialog({ kind: "decision", proposal, action });
  }

  const revalidate = <Button variant={revalidateLeads && !repairLeads ? "primary" : "secondary"} size={revalidateLeads ? "default" : "small"} disabled={!ready || !!pendingRepair} leadingIcon={RefreshCw} onClick={() => perform(`${root}/${report ? "revalidation" : "validation"}`)}>{report ? "Verify again" : "Verify my books"}</Button>;
  const repairActions = pendingRepair
    ? <Button disabled={!ready} onClick={() => setDialog({ kind: "repair", resolutionId: pendingRepair.resolution_id })}>Review proposed repair</Button>
    : altered.map((key, index) => <Button key={key} variant={index === 0 && !restored(key) ? "primary" : "secondary"} disabled={!ready} onClick={async () => { const [entity, record_id] = key.split(":"); const data = await perform(`${root}/validation/resolutions`, { entity, record_id }); const repair = data?.repairs.find(r => !r.applied); if (repair) setDialog({ kind: "repair", resolutionId: repair.resolution_id }); }}>Review repair: {key}</Button>);
  const apply = <Button variant={approved ? "primary" : "secondary"} disabled={!ready || !approved} leadingIcon={CheckCircle2} onClick={() => perform(`${root}/configuration/apply`)}>Apply reviewed configuration</Button>;

  // Page title, guide and the one next step, from the read alone.
  const verified = report?.status === "VERIFIED";
  const step = settingsApplied ? "settings applied" : plan ? "review settings" : "check your books";
  const title = !report ? "Verify your books"
    : !verified ? "Your books don't match yet"
    : settingsApplied ? "Your books match and settings are applied"
    : plan ? "Review the settings for your new books"
    : "Your books match";
  const guide = !snapshot && readState === "loading" ? "Reading your migration. Nothing is assumed until it loads."
    : !snapshot ? "Open a migration from My migration to check its books. Standalone scenarios are at the end of this page."
    : !report ? "Compare the new books with the source. Every count and balance must match exactly before setup; nothing is rounded or written off."
    : !verified ? `${groups!.matched} of ${groups!.total} checks matched. Nothing is written off; review the permitted repair, then verify again.`
    : firstInvoiceVerified ? `${groups!.matched} of ${groups!.total} checks matched, every required setting is applied and your first invoice is verified.`
    : settingsApplied ? `${groups!.matched} of ${groups!.total} checks matched and every required setting is applied. Next, finish the essentials and post your first invoice.`
    : plan ? `${groups!.matched} of ${groups!.total} checks matched. ${pendingSettings.length ? `${plural(pendingSettings.length, "setting")} need${pendingSettings.length === 1 ? "s" : ""} your decision; unchanged low-risk settings apply on their own.` : "Every setting is decided; apply them to finish setup."}`
    : `${groups!.matched} of ${groups!.total} checks matched. Next, review the settings that shape your new books.`;

  const next = !snapshot ? undefined
    : !report ? { title: "Check your books", detail: "MoveBooks compares every record and balance with the source under an exact-decimal rule.", action: revalidate }
    : !verified ? { title: repairLeads ? "Review the permitted repair" : appliedRepairs.length ? "Verify again" : "Investigate the difference", detail: repairLeads ? "A changed record can be restored to its approved source with your approval. Then verify again." : appliedRepairs.length ? "The restored record is in place. Run every check again." : "Missing records, source errors or unsupported repairs can't be waived here.", action: <>{repairActions}{revalidate}</> }
    : firstInvoiceVerified ? { title: "Your first invoice is verified", detail: "Verification and settings are complete. Start shows the verified invoice and its evidence.", action: <ActionLink label="Open Start" href={sessionHref("/onboard-fpu", snapshot.session_id)} /> }
    : settingsApplied ? { title: "Finish the essentials and post your first invoice", detail: "Start uses the settings you applied here.", action: <ActionLink label="Complete setup" href={sessionHref("/onboard-fpu", snapshot.session_id)} /> }
    : !plan ? { title: "Review your settings", detail: "Settings that need a person are listed for your decision. Nothing is applied until you confirm.", action: <Button disabled={!ready || report.status !== "VERIFIED"} leadingIcon={ShieldCheck} onClick={() => perform(`${root}/configuration`)}>Continue to configuration</Button> }
    : approved ? { title: "Apply the reviewed settings", detail: "Every required setting is decided. Applying sets up your new books with them.", action: apply }
    : { title: pendingSettings.length ? `Decide ${plural(pendingSettings.length, "setting")}` : "Review your settings", detail: <>Approve, modify or reject each one in <a className="v2s-text-link" href="#configuration-title">Settings for your new books</a>. A rejection keeps setup blocked until you revise it.</> };

  const done = [
    ...(moved ? ["Records moved"] : []),
    ...(groups ? [`${groups.matched} of ${groups.total} checks matched`] : []),
    ...(appliedRepairs.length ? [`${plural(appliedRepairs.length, "record")} restored with your approval`] : []),
    ...(plan ? [`${plan.proposals.filter(p => DONE_STATES.includes(p.state)).length} of ${plan.proposals.length} settings approved, changed or applied`] : []),
    ...(settingsApplied ? ["Settings applied"] : []),
  ];
  const outstanding: Outstanding[] = [
    ...(discrepancies.length ? [{ label: `${plural(discrepancies.length, "check")} ${discrepancies.length === 1 ? "doesn't" : "don't"} match`, tone: "blocked" as const }] : []),
    ...(pendingRepair ? [{ label: "A proposed repair needs your decision" }] : []),
    ...(stuckSettings.map(p => ({ label: `${p.label}: ${settingState(p.state).label.toLowerCase()}`, tone: "blocked" as const }))),
    ...(pendingSettings.filter(p => !stuckSettings.includes(p)).length ? [{ label: `${plural(pendingSettings.filter(p => !stuckSettings.includes(p)).length, "setting")} to decide`, href: "#configuration-title" }] : []),
    ...(verified && !plan ? [{ label: "Review your settings" }] : []),
    ...(!report && snapshot ? [{ label: "Check your books" }] : []),
    ...(approved && !settingsApplied ? [{ label: "Apply the reviewed settings" }] : []),
  ];

  const recovery = error && !dialog && snapshot
    ? <ActionFailure message={error} retryHref={retryHref} kept="Your books, checks and recorded decisions are unchanged." />
    : report && !verified
      ? <RecoveryNotice title="Your books don't match yet">
          <p><strong>What happened:</strong> {discrepancies.map(c => c.label).join(", ")} {discrepancies.length === 1 ? "does" : "do"} not match the source.</p>
          <p><strong>What is kept:</strong> the migrated records and your decisions. Nothing is adjusted or written off to force a match.</p>
          <p><strong>Way forward:</strong> {pendingRepair ? "approve or close the proposed restoration, then verify again." : repairLeads ? "review the permitted repair for the changed record, approve it, then verify again." : appliedRepairs.length ? "verify again to rerun every check." : "investigate missing records or source errors in the source; they can't be waived here."}</p>
        </RecoveryNotice>
      : stuckSettings.length
        ? <RecoveryNotice title="Setup can't finish yet">
            <p><strong>What happened:</strong> {stuckSettings.map(p => `${p.label} is ${settingState(p.state).label.toLowerCase()}`).join("; ")}.</p>
            <p><strong>What is kept:</strong> your books still match, and your other setting decisions stay recorded.</p>
            <p><strong>Way forward:</strong> modify the setting to a supported value, or revise your decision.</p>
          </RecoveryNotice>
        : undefined;

  const results = report && groups && <section className="v2s-section" aria-labelledby="validation-title">
    <div className="v2s-section-head"><h2 id="validation-title">Verify results</h2>{verified && revalidate}</div>
    {plan && <p className="v2s-quiet">Verifying again reruns every check and discards the current configuration, so settings must be reviewed and applied again.</p>}
    <div className="v2s-grid">
      <div className="v2-card v2s-section v2s-results-card">
        <h3>{groups.matched} of {groups.total} checks matched</h3>
        <Facts label="Checks by group" rows={[
          ...groups.groups.map(group => ({ label: group.name, value: `${group.matched} of ${group.checks.length}`, tone: group.matched === group.checks.length ? "ok" as const : "blocked" as const })),
          { label: "Trial balance difference", value: difference!.text },
        ]} />
        <p className="v2s-small">{report.currency} · exact decimals · policy {report.policy_version}. No tolerance or write-off.</p>
      </div>
      {discrepancies.length > 0 && <div className="v2s-section" style={{ marginTop: 0 }}>{discrepancies.map(check => <CheckCard key={check.id} check={check} currency={report.currency} policy={report.policy_version} />)}</div>}
    </div>
    {!verified && !plan && <div className="v2s-buttons"><Button variant="secondary" disabled={!ready || report.status !== "VERIFIED"} leadingIcon={ShieldCheck} onClick={() => perform(`${root}/configuration`)}>Continue to configuration</Button><span className="v2s-small">Settings unlock when every check matches.</span></div>}
    <details className="v2s-details"><summary>See all {groups.total} checks: source, target, difference and evidence</summary>
      {groups.groups.map(group => <div key={group.name} className="v2s-section">
        <h3>{group.name} · {group.matched} of {group.checks.length}</h3>
        <ol className="v2s-rows">{group.checks.map(check => { const state = checkState(check.status); return <li key={check.id}><span className="v2s-row-main">{check.label}</span><StateChip tone={state.tone}>{state.label}</StateChip></li>; })}</ol>
      </div>)}
      <div className="v2s-grid v2s-section">{report.checks.filter(check => check.status === "VERIFIED").map(check => <CheckCard key={check.id} check={check} currency={report.currency} policy={report.policy_version} />)}</div>
    </details>
  </section>;

  const settings = plan && <section className="v2s-section" aria-labelledby="configuration-title">
    <h2 id="configuration-title" tabIndex={-1}>Settings for your new books</h2>
    <p className="v2s-section-lede">Review each required setting. Unchanged low-risk settings apply on their own; a rejection keeps setup blocked.</p>
    <div className="v2s-split">
      <div className="v2s-split-main">
        <label className="v2s-queue review-queue">Settings queue · {pendingSettings.length} pending<select className="field-control" value={currentConfiguration?.id ?? ""} onChange={event => setConfigurationId(event.target.value)}>{plan.proposals.map(p => <option key={p.id} value={p.id}>{p.label} · {settingState(p.state).label}</option>)}</select></label>
        {plan.proposals.filter(proposal => proposal.id === currentConfiguration?.id).map(proposal => { const state = settingState(proposal.state); return <article key={proposal.id} className="v2-card v2-card-strong v2s-section" aria-labelledby={`setting-${proposal.id}`}>
          <div className="v2s-section-head"><div><p className="v2s-kicker">{sentence(proposal.risk)} risk</p><h3 id={`setting-${proposal.id}`}>{proposal.label}</h3></div><StateChip tone={state.tone}>{state.label}</StateChip></div>
          <Facts rows={[{ label: "In your old books", value: proposal.source_value || "Missing evidence" }, { label: "In your new books", value: proposal.selected_value || "Not set" }]} />
          <p className="v2s-quiet">{proposal.policy_reason}</p>
          {proposal.decided_by && <p className="v2s-small">Decision by {proposal.decided_by}: {proposal.decision}{proposal.decided_at ? ` · ${proposal.decided_at}` : ""}</p>}
          <div className="v2s-buttons">{proposal.state !== "APPLIED" && <>{proposal.state === "APPROVED" ? <Button size="small" variant="secondary" disabled leadingIcon={CheckCircle2} aria-label={`${proposal.label} approved`}>Approved</Button> : <Button size="small" variant={approved ? "secondary" : "primary"} disabled={!ready || proposal.state === "BLOCKED"} onClick={() => openDecision(proposal, "approve")}>Approve {proposal.label.toLowerCase()}</Button>}<Button size="small" variant="secondary" disabled={!ready} onClick={() => openDecision(proposal, "modify")}>Modify {proposal.label.toLowerCase()}</Button><Button size="small" variant="danger" disabled={!ready} onClick={() => openDecision(proposal, "reject")}>Reject {proposal.label.toLowerCase()}</Button></>}<Button variant="ghost" size="small" disabled={!ready} onClick={() => { setError(undefined); setDialog({ kind: "explain", proposal }); }}>Explain {proposal.label.toLowerCase()}</Button></div>
        </article>; })}
        {!approved && currentConfiguration && DONE_STATES.includes(currentConfiguration.state) && <div><Button variant="secondary" disabled={!ready} onClick={() => setConfigurationId(plan.proposals.find(p => !DONE_STATES.includes(p.state))?.id)}>Review next setting</Button></div>}
        {!settingsApplied && !approved && <div className="v2s-buttons">{apply}<span className="v2s-small">All eight areas need valid evidence and every required approval before handoff.</span></div>}
      </div>
      <div className="v2s-split-side v2-card v2s-section">
        <h3>{plan.proposals.filter(p => DONE_STATES.includes(p.state)).length} of {plan.proposals.length} settings settled</h3>
        <ol className="v2s-rows" aria-label="All settings">{plan.proposals.map(p => { const state = settingState(p.state); return <li key={p.id} aria-current={p.id === currentConfiguration?.id ? "true" : undefined}><span className="v2s-row-main">{p.label}<span className="v2s-row-sub">{p.selected_value || "Not set"}</span></span><StateChip tone={state.tone}>{state.label}</StateChip></li>; })}</ol>
        {decidedSettings.length > 0 && <p className="v2s-small">{decidedSettings.length} decided by {Array.from(new Set(decidedSettings.map(p => p.decided_by))).join(", ")}</p>}
      </div>
    </div>
  </section>;

  return <main className="shell migration-task v2s-page">
    <TaskContext phase={3} session={snapshot?.session_id} />
    <PhaseProgress session={snapshot?.session_id} status={snapshot?.workflow_status} current={projection?.current ?? null} held={projection?.held} currentLabel={projection?.currentLabel} processing={checking ? PROCESSING.validate : undefined} />
    <StageHeader stage={3} step={step} title={title} guide={guide}>
      <p className="v2s-meta" ref={statusRef} tabIndex={-1} role="status" aria-live="polite">{busy ? <span>Checking evidence and recording the action…</span> : <>{snapshot && <span>{snapshot.company_name}</span>}<span>Synthetic Beta · exact checks and your decisions are required</span></>}</p>
    </StageHeader>
    {readState === "loading" && <p role="status" className="v2s-loading">Reading verification evidence…</p>}
    {readFailed && !snapshot && <ReadFailure retryHref={retryHref} />}
    {error && !dialog && !snapshot && !readFailed && <ActionFailure message={error} retryHref={retryHref} kept="Nothing in your migration has changed." />}

    {snapshot && <WorkflowSummary
      label="Where verification stands"
      recovery={recovery}
      next={next}
      done={done}
      outstanding={outstanding}
      evidence={{ href: evidenceHref(snapshot.session_id), detail: "Every check with source, target and evidence, and each decision.", label: "Open evidence" }}
    />}

    {readState === "ready" && settingsApplied && plan && <section className="v2-card v2s-section" aria-labelledby="applied-title">
      <div className="v2s-section-head"><h2 id="applied-title">Settings applied to your new books</h2><StateChip tone="approved">Applied</StateChip></div>
      <Facts rows={Object.entries(plan.target_settings).map(([key, value]) => ({ label: sentence(key), value }))} />
    </section>}
    {plan && !settingsApplied ? <>{settings}<details className="v2s-details v2s-section"><summary>Verified financial report · exact source, target and evidence</summary>{results}</details></>
      : plan ? <><details className="v2s-details v2s-section"><summary>Verified financial report · exact source, target and evidence</summary>{results}</details><details className="v2s-details v2s-section"><summary>How each setting was decided</summary>{settings}</details></>
      : results}
    {!!snapshot?.activity.length && <details className="v2s-details v2s-section"><summary>Decisions and activity</summary><ol className="v2s-activity" aria-label="Decisions and activity">{snapshot.activity.slice().reverse().map(item => <li key={item.id}><strong>{item.action}</strong><span className="v2s-quiet">{sentence(item.agent)} · {sentence(item.provenance ?? "")} · {sentence(item.status)}</span><details><summary>Action evidence</summary><Evidence values={item.evidence_references} /></details></li>)}</ol></details>}
    <details className="v2s-details v2s-section"><summary>Standalone verification scenarios · separate migration</summary><div className="v2-card v2s-section"><p className="v2s-quiet">Synthetic public-reference Beta. No provider writes. No production readiness claim. These scenarios explicitly replay earlier synthetic migration approvals; your validation repairs and configuration decisions remain interactive. Local demo sessions are process-local and may expire; cloud synthetic workspaces persist across restarts.</p>
      <div className="v2s-buttons"><Button disabled={busy} variant="secondary" onClick={() => perform("/validation-demo-sessions", { scenario: "ar_discrepancy" })}>Load discrepancy scenario</Button><Button disabled={busy} variant="ghost" onClick={() => perform("/validation-demo-sessions", { scenario: "clean" })}>Load reconciled scenario</Button></div>
    </div></details>
    <Dialog fallbackFocusRef={statusRef} open={!!dialog} onClose={() => { if (!busy) { setDialog(undefined); setError(undefined); } }} title={dialog?.kind === "repair" ? "Approve synthetic record restoration?" : dialog?.kind === "explain" ? "Grounded configuration explanation" : dialog?.kind === "decision" ? `${sentence(dialog.action ?? "review")} ${dialog.proposal.label.toLowerCase()}` : "Review"}>
      <div className="v2s-dialog">
        {dialog?.kind === "repair" ? <><p>{snapshot?.resolutions.find(r => r.id === dialog.resolutionId)?.rationale}</p><Evidence values={snapshot?.resolutions.find(r => r.id === dialog.resolutionId)?.evidence ?? []} /><p>This copies only the checksum-bound source record into the synthetic target and retains its previous payload for audit. You must verify again afterwards.</p><div><Button disabled={!ready} onClick={() => perform(`${root}/validation/resolutions/${dialog.resolutionId}/approve`, undefined, true)}>Approve restoration</Button></div></> : dialog && <><h3>{dialog.proposal.label}</h3><p>{dialog.proposal.explanation}</p><Facts rows={[{ label: "In your old books", value: dialog.proposal.source_value || "Missing evidence" }, { label: "In your new books", value: dialog.proposal.selected_value || "Not set" }]} /><p className="v2s-quiet">{sentence(dialog.proposal.risk)} risk · {dialog.proposal.policy_reason}</p><Evidence values={dialog.proposal.evidence} />{dialog.kind === "decision" && <><p>Selected: {dialog.proposal.selected_value}. {dialog.action === "reject" ? "Rejection blocks configuration completion; you can revise this decision later." : "Your decision will be attributed to the current demo identity."}</p>{dialog.action === "modify" && <label className="v2s-queue">Supported target value<select className="field-control" value={selected} onChange={event => setSelected(event.target.value)}>{dialog.proposal.alternatives.map(value => <option key={value}>{value}</option>)}</select></label>}<label className="v2s-queue">Decision note (optional)<textarea className="field-control" maxLength={1000} value={comment} onChange={event => setComment(event.target.value)} /></label><div><Button disabled={!ready} onClick={() => perform(`${root}/configuration/${dialog.proposal.id}/decision`, { action: dialog.action, ...(dialog.action === "modify" ? { value: selected } : {}), comment }, true)}>Confirm {dialog.action}</Button></div></>}</>}
        {error && <div role="alert" className="v2s-dialog-error">{error} No new consent is assumed. <a className="v2s-text-link" href={`/validate-configure?session=${snapshot?.session_id}`}>Read current evidence</a></div>}
        <div><Button variant="secondary" disabled={!ready} onClick={() => { setDialog(undefined); setError(undefined); }}>Close review</Button></div>
      </div>
    </Dialog>
  </main>;
}
