"use client";

import { AlertTriangle, CheckCircle2, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { AgentActivity } from "@/components/discover-assess/types";
import { Dialog } from "@/components/ui/dialog";
import { PhaseProgress, TaskContext } from "@/components/journey/PhaseProgress";
import { journeyStepFor, pendingMappingsIn, PROCESSING, projectJourney } from "@/components/journey/journey";
import { Button } from "@/components/ui/primitives";
import { RecoveryNotice, StageHeader, WorkflowSummary } from "@/components/v2/Workflow";
import type { Outstanding } from "@/components/v2/Workflow";

import { ActionFailure, evidenceHref, ReadFailure, sentence, sessionHref, StateChip } from "./stage-kit";
import type { ChipTone } from "./stage-kit";
import type { DemoSession, MigrationBatch, MigrationExecution } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
import { authHeaders } from "@/lib/identity";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...await authHeaders(), "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** How a batch reads in the batch list. Wording only; the batch status is the API's. */
function batchState(batch: MigrationBatch, paused: boolean): { tone: ChipTone; label: string } {
  if (batch.status === "COMPLETED") return { tone: "approved", label: "Moved" };
  if (batch.status === "RUNNING") return { tone: "low_risk", label: "Moving" };
  if (batch.status === "RETRY_PENDING") return { tone: "needs_review", label: "Ready to retry" };
  if (batch.status === "BLOCKED") return { tone: "blocked", label: "Blocked" };
  if (batch.status === "FAILED") return paused ? { tone: "needs_review", label: "Paused" } : { tone: "blocked", label: "Failed" };
  return { tone: "low_risk", label: "Waiting" };
}

export function MigrateResolveExperience() {
  const headingRef = useRef<HTMLSpanElement>(null);
  const [session, setSession] = useState<DemoSession>();
  const [execution, setExecution] = useState<MigrationExecution>();
  const [busy, setBusy] = useState(false);
  // What MoveBooks is doing right now, shown on the current journey step.
  const [working, setWorking] = useState<"migrate" | "resolve">();
  const [readState, setReadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  // The activity list is a secondary read. If it fails after an action succeeded, the action is still
  // recorded, so this is reported on its own and never as "that step was not completed".
  const [activityStale, setActivityStale] = useState(false);
  async function refreshActivity(id: string) {
    try { setActivity(await api<AgentActivity[]>(`/v1/migration-sessions/${id}/activity`)); setActivityStale(false); }
    catch { setActivityStale(true); }
  }
  const [requested, setRequested] = useState<string>();

  // A user action supersedes a still-pending initial read; the late read is ignored.
  const acted = useRef(0);
  useEffect(() => {
    const saved = new URLSearchParams(window.location.search).get("session") ?? sessionStorage.getItem("movebooks-migration-session");
    if (!saved) { setReadState("ready"); return; }
    setRequested(saved);
    let active = true;
    const before = acted.current;
    const fresh = () => active && acted.current === before;
    void api<DemoSession>(`/v1/migration-sessions/${saved}`).then(data => {
      if (!fresh()) return;
      setReadState("ready"); setSession(data); setExecution(data.execution ?? undefined); setActivity(data.activity);
      sessionStorage.setItem("movebooks-migration-session", data.id);
      window.history.replaceState(null, "", `?session=${encodeURIComponent(data.id)}`);
    }).catch(caught => { if (fresh()) { setReadState("error"); setError(caught.message); } });
    return () => { active = false; };
  }, []);

  // The execution's status is the live read while migrating. Otherwise the session's workflow
  // status is authoritative: once the migration has moved on (for example to blocked validation)
  // the execution still reads MIGRATION_COMPLETE, so it leads only when it is further along.
  const ahead = (a: string, b: string) => (journeyStepFor(a) ?? -1) > (journeyStepFor(b) ?? -1);
  const status = session && (execution && ahead(execution.status, session.workflow_status) ? execution.status : session.workflow_status);
  const projection = readState === "ready" && session && status ? projectJourney({ status, mappingIssues: pendingMappingsIn(session.mappings), readinessIssues: session.assessment?.blocker_count ?? 0 }) : undefined;
  const proposal = execution?.resolutions.at(-1);
  const failure = execution?.failures.find((item) => item.id === proposal?.failure_id);
  const complete = execution?.status === "MIGRATION_COMPLETE" && execution.safe_to_validate;
  const resolving = execution?.status === "RESOLVING";
  const retryPending = execution?.status === "RETRY_PENDING";
  // The decision endpoint reports a rejected fix as BLOCKED; the session reads MIGRATION_BLOCKED.
  const blocked = execution?.status === "MIGRATION_BLOCKED" || (execution?.status as string | undefined) === "BLOCKED";
  const openIssues = execution?.failures.filter((item) => !item.resolved).length ?? 0;
  const approvalRecorded = Boolean(session && (["APPROVED", "MIGRATION_READY"].includes(session.workflow_status) || execution));

  const loadDemo = async () => {
    acted.current += 1;
    setBusy(true);
    setError(undefined);
    try {
      const created = await api<DemoSession>("/v1/migration-demo-sessions", { method: "POST" });
      setReadState("ready"); setSession(created);
      setExecution(undefined);
      sessionStorage.setItem("movebooks-migration-session", created.id);
      window.history.replaceState(null, "", `?session=${encodeURIComponent(created.id)}`);
      setActivity(created.activity);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The synthetic manifest could not load.");
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    acted.current += 1;
    if (!session) return;
    setBusy(true); setWorking("migrate");
    setError(undefined);
    try {
      const started = await api<MigrationExecution>(
        `/v1/migration-sessions/${session.id}/migration/start`,
        {
          method: "POST",
          headers: { "Idempotency-Key": `migrate-demo-${session.id}` },
        },
      );
      setExecution(started);
      setDialogOpen(started.status === "RESOLVING");
      await refreshActivity(session.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Migration could not start safely.");
    } finally {
      setBusy(false); setWorking(undefined);
    }
  };

  const decide = async (approve: boolean) => {
    acted.current += 1;
    if (!session || !proposal) return;
    setBusy(true); setWorking("resolve");
    setError(undefined);
    try {
      const updated = await api<MigrationExecution>(
        `/v1/migration-sessions/${session.id}/migration/resolutions/${proposal.id}/decision`,
        {
          method: "POST",
          body: JSON.stringify({
            approve,
            comment: approve ? "Evidence reviewed in the synthetic demonstration" : "Rejected by user",
          }),
        },
      );
      setExecution(updated);
      setDialogOpen(false);
      await refreshActivity(session.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The decision was not recorded.");
    } finally {
      setBusy(false); setWorking(undefined);
    }
  };

  const retry = async () => {
    acted.current += 1;
    if (!session) return;
    setBusy(true); setWorking("migrate");
    setError(undefined);
    try {
      setExecution(
        await api<MigrationExecution>(`/v1/migration-sessions/${session.id}/migration/resume`, {
          method: "POST",
        }),
      );
      await refreshActivity(session.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The governed retry could not run.");
    } finally {
      setBusy(false); setWorking(undefined);
    }
  };

  const batches = execution?.batches ?? [];
  const moved = batches.filter(batch => batch.status === "COMPLETED").length;
  const pausedBatch = failure ? batches.find(batch => batch.id === failure.batch_id) : undefined;
  const pausedName = pausedBatch ? `Batch ${pausedBatch.sequence} (${sentence(pausedBatch.entity).toLowerCase()})` : "The paused batch";
  const decidedBy = proposal?.decided_by;
  const retryHref = sessionHref("/migrate-resolve", session?.id ?? requested);
  const keptLine = execution ? `${moved} of ${batches.length} batches moved and stay in the new books.` : "Nothing has moved yet.";

  const title = !session ? "Move your approved books"
    : complete ? "Your records moved"
    : blocked ? "The paused batch is blocked"
    : retryPending ? "Fix approved: retry the paused batch"
    : resolving ? "A batch paused for your review"
    : execution ? "Your records are moving"
    : "Move your approved books";
  const guide = !session && readState === "loading" ? "Reading your migration. Nothing is assumed until it loads."
    : !session ? "Open a migration from My migration to move its approved records. A standalone scenario is at the end of this page."
    : complete ? "Every batch moved and no blocking issue remains. Next, check the new books against the old ones."
    : blocked ? `${pausedName} stays blocked because the proposed fix was not approved. Batches that already moved are kept.`
    : retryPending ? "You approved the proposed fix. Retrying runs the paused batch again; batches that already moved are not repeated."
    : resolving ? `A problem pauses one batch, not the move. ${pausedName} needs your decision; batches that already moved are kept.`
    : execution ? "MoveBooks is moving your records in checkpointed batches."
    : "Your plan is approved. MoveBooks moves your records in checkpointed batches; a problem pauses one batch, not the move.";

  const next = complete
    ? { title: "Verify your books", detail: "Compare the new books with the source. Every check must match before setup.", action: <a className="button" href={sessionHref("/validate-configure", session?.id)}><ShieldCheck aria-hidden="true" size={17} />Verify my books</a> }
    : retryPending
      ? { title: "Retry the paused batch", detail: "Only the paused batch runs again.", action: <Button onClick={retry} disabled={busy} leadingIcon={RefreshCw}>Retry failed batch</Button> }
      : resolving && proposal
        ? { title: "Review the proposed fix", detail: "Approve it to retry the paused batch, or reject it to keep the batch blocked. Nothing changes until you decide.", action: <Button onClick={() => setDialogOpen(true)} disabled={busy} leadingIcon={CheckCircle2}>{openIssues > 1 ? `Review ${openIssues} migration issues` : "Review 1 migration issue"}</Button> }
        : session && !execution
          ? { title: "Start moving your records", detail: approvalRecorded ? "Your approved plan is recorded. Records move in checkpointed batches." : "Move starts only after the plan approval is recorded in Prepare.", action: <Button onClick={start} disabled={busy || readState !== "ready" || !["APPROVED", "MIGRATION_READY"].includes(session.workflow_status)} leadingIcon={Play}>Start migration</Button> }
          : blocked && session
            ? { title: "Investigate the blocked batch", detail: "Open the evidence for the paused batch. Help explains the ways forward; no restart is offered here.", action: <a className="button secondary" href={`/support?session=${encodeURIComponent(session.id)}&stage=2`}>Get help with this batch</a> }
            : execution
              ? { title: "Follow the move", detail: "Batches move one after another. You will be asked if anything needs a decision." }
              : undefined;

  const done = [
    ...(approvalRecorded ? ["Plan approval recorded"] : []),
    ...(execution ? [`${moved} of ${batches.length} batches moved`] : []),
    ...(failure?.resolved ? [`Fix approved${decidedBy ? ` by ${decidedBy}` : ""}`] : []),
  ];
  const outstanding: Outstanding[] = [
    ...(resolving && openIssues ? [{ label: openIssues === 1 ? "1 migration issue to review" : `${openIssues} migration issues to review`, tone: "review" as const }] : []),
    ...(retryPending ? [{ label: "Retry the paused batch", tone: "review" as const }] : []),
    ...(blocked ? [{ label: `${pausedName} is blocked`, tone: "blocked" as const }] : []),
  ];

  const recovery = error && readState !== "error"
    ? <ActionFailure message={error} retryHref={retryHref} kept={keptLine} />
    : resolving && failure && !failure.resolved
      ? <RecoveryNotice title="Migration paused safely">
          <p><strong>What happened:</strong> {failure.summary}</p>
          <p><strong>What is kept:</strong> {keptLine}</p>
          <p><strong>Way forward:</strong> review the proposed fix, approve or reject it, then retry the paused batch.</p>
        </RecoveryNotice>
      : blocked
        ? <RecoveryNotice title="The paused batch is blocked">
            <p><strong>What happened:</strong> {failure?.summary ?? "A batch could not move."}{proposal?.state === "REJECTED" ? ` The proposed fix was rejected${decidedBy ? ` by ${decidedBy}` : ""}.` : ""}</p>
            <p><strong>What is kept:</strong> {keptLine}</p>
            <p><strong>Way forward:</strong> {failure?.retryable === false ? "this failure is not retryable; investigate the evidence." : "investigate the evidence. A retry needs an approved fix."}</p>
          </RecoveryNotice>
        : undefined;

  return (
    <main className="shell migration-task v2s-page">
      <TaskContext phase={2} session={session?.id} />
      <PhaseProgress session={session?.id} status={status} current={projection?.current ?? null} held={projection?.held} currentLabel={projection?.currentLabel} processing={working ? PROCESSING[working] : undefined} />

      <StageHeader stage={2} step="move your records" title={<span ref={headingRef} tabIndex={-1} className="v2s-focus">{title}</span>} guide={guide}>
        <p className="v2s-meta">{session && <span>{session.company_name}</span>}<span>Synthetic Beta · no provider writes</span>{execution && <span>Manifest {execution.manifest_version}</span>}</p>
      </StageHeader>

      {readState === "loading" && <p role="status" className="v2s-loading">Loading your migration…</p>}
      {readState === "error" && <ReadFailure retryHref={retryHref} detail={error} />}
      {!session && error && readState !== "error" && <ActionFailure message={error} retryHref={retryHref} kept="Nothing in your migration has changed." />}

      {session && <WorkflowSummary
        label="Where the move stands"
        recovery={<>{recovery}{activityStale && <p className="v2s-meta" role="status">Your last action is recorded. The activity list could not be refreshed; reload the page to read it again.</p>}</>}
        next={next}
        done={done}
        outstanding={outstanding}
        evidence={{ href: evidenceHref(session.id), detail: "Batch checkpoints, decisions and the audit trail.", label: "Open evidence" }}
      />}

      {execution && (
        <section className="v2-card v2s-section" aria-labelledby="progress-heading">
          <div className="v2s-section-head">
            <h2 id="progress-heading">Batches</h2>
            <span className="v2s-quiet">{moved} of {batches.length} moved</span>
          </div>
          <div className="v2s-progress" role="group" aria-label={`${execution.progress_percent}% migration progress`}>
            <div className="v2s-progress-track" aria-hidden="true"><div className="v2s-progress-value" style={{ width: `${execution.progress_percent}%` }} /></div>
            <span className="v2s-quiet">{execution.progress_percent}% of approved records processed</span>
          </div>
          <ol className="v2s-rows" aria-label="Batches in order">
            {batches.map(batch => {
              const state = batchState(batch, Boolean(resolving && failure && failure.batch_id === batch.id));
              return <li key={batch.id}>
                <span className="v2s-row-main"><span className="v2s-quiet">Batch {batch.sequence}</span> {sentence(batch.entity)}</span>
                <span className="v2s-row-figure v2-num">{batch.succeeded_count} of {batch.record_count} {batch.record_count === 1 ? "record" : "records"}</span>
                <StateChip tone={state.tone}>{state.label}</StateChip>
                {batch.last_error && <span className="v2s-row-note">{batch.last_error}</span>}
              </li>;
            })}
          </ol>
          <details className="v2s-details"><summary>Attempts and retry limits</summary>
            <div className="v2s-table-wrap"><table className="v2s-table">
              <caption className="sr-only">Attempts per batch</caption>
              <thead><tr><th scope="col">Batch</th><th scope="col">Records</th><th scope="col">Succeeded</th><th scope="col">Failed</th><th scope="col">Attempts</th><th scope="col">Retry limit</th></tr></thead>
              <tbody>{batches.map(batch => <tr key={batch.id}><th scope="row">{batch.sequence} · {sentence(batch.entity)}</th><td>{batch.record_count}</td><td>{batch.succeeded_count}</td><td>{batch.failed_count}</td><td>{batch.attempt_count}</td><td>{batch.retry_limit}</td></tr>)}</tbody>
            </table></div>
          </details>
        </section>
      )}

      {failure && (
        <section className={`v2-card v2s-section${failure.resolved ? "" : " v2-card-blocked"}`} aria-labelledby="exception-heading">
          <div className="v2s-section-head">
            <div><p className="v2s-kicker">{pausedName}</p><h2 id="exception-heading">{sentence(failure.kind)}</h2></div>
            <StateChip tone={failure.resolved ? "approved" : blocked ? "blocked" : "needs_review"}>{failure.resolved ? "Fix approved" : blocked ? "Blocked" : "Needs your decision"}</StateChip>
          </div>
          <p>{failure.summary}</p>
          <dl className="v2s-facts">
            <div><dt>Cause</dt><dd>{failure.root_cause}</dd></div>
            <div><dt>Code</dt><dd>{failure.code}</dd></div>
            <div><dt>Retries so far</dt><dd className="v2-num">{failure.retry_count}</dd></div>
            <div><dt>Retry</dt><dd>{failure.retryable ? "Available only after a permitted fix is approved" : "Not retryable; investigate the evidence"}</dd></div>
            {proposal && <div><dt>Proposed fix</dt><dd>{sentence(proposal.action)} · {sentence(proposal.state)}{decidedBy ? ` · decided by ${decidedBy}` : ""}{proposal.decided_at ? ` at ${proposal.decided_at}` : ""}</dd></div>}
          </dl>
        </section>
      )}

      {activity.length > 0 && (
        <details className="v2s-details v2s-section"><summary>Decisions and activity</summary>
          <ol className="v2s-activity" aria-label="Latest decisions and activity">
            {activity.slice(-6).reverse().map((item) => (
              <li key={item.id}><strong>{item.action}</strong><span className="v2s-quiet">{sentence(item.agent)} · {sentence(item.status)} · {sentence(item.risk)} risk</span></li>
            ))}
          </ol>
        </details>
      )}
      <details className="v2s-details v2s-section"><summary>Standalone synthetic scenario · separate migration</summary><p>Loading this scenario replays earlier approvals. It does not continue the selected migration.</p><Button variant="secondary" className="mt-3" onClick={loadDemo} disabled={busy || readState === "loading"}>Load reviewed manifest</Button></details>

      <Dialog
        fallbackFocusRef={headingRef}
        open={dialogOpen && Boolean(proposal)}
        onClose={() => setDialogOpen(false)}
        title="Review proposed resolution"
        description="The rules propose a reversible fix for the paused batch. Nothing changes until you decide."
      >
        {proposal && failure && (
          <div className="v2s-dialog">
            <p className="v2s-meta"><span>{sentence(proposal.specialist)}</span><span>{sentence(proposal.risk)} risk</span><span>{Math.round(proposal.confidence * 100)}% policy confidence</span></p>
            <h3>{sentence(proposal.action)}</h3>
            <p>{proposal.rationale}</p>
            <div className="v2s-evidence">
              <strong>Evidence</strong>
              <ul>{proposal.evidence.map((item) => <li className="break-all" key={item}>{item}</li>)}</ul>
            </div>
            <p className="v2s-note"><AlertTriangle aria-hidden="true" size={18} />{proposal.escalation_rule}</p>
            <p className="v2s-quiet">Your decision is recorded with your name. Approving lets you retry the paused batch; rejecting keeps it blocked.</p>
            <div className="v2s-dialog-actions">
              <Button variant="secondary" onClick={() => decide(false)} disabled={busy}>Reject and block</Button>
              <Button onClick={() => decide(true)} disabled={busy || !resolving || !failure.retryable || !proposal.deterministic_fix_available || !["PROPOSED", "AWAITING_APPROVAL"].includes(proposal.state)} leadingIcon={CheckCircle2}>Approve resolution</Button>
            </div>
          </div>
        )}
      </Dialog>
    </main>
  );
}
