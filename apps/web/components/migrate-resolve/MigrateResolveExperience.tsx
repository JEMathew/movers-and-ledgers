"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Database,
  Play,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { AgentActivity } from "@/components/discover-assess/types";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/feedback";
import { MigrationJourney } from "@/components/journey/MigrationJourney";
import { journeyStepFor, pendingMappingsIn, PROCESSING, projectJourney } from "@/components/journey/journey";
import { NextAction } from "@/components/journey/NextAction";
import { Badge, Button, Card, Panel } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status";

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

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function batchStatus(batch: MigrationBatch) {
  if (batch.status === "COMPLETED") return "COMPLETED" as const;
  if (batch.status === "FAILED" || batch.status === "BLOCKED") return "BLOCKED" as const;
  if (batch.status === "RUNNING") return "IN PROGRESS" as const;
  if (batch.status === "RETRY_PENDING") return "REQUIRES APPROVAL" as const;
  return "NOT STARTED" as const;
}

export function MigrateResolveExperience() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [session, setSession] = useState<DemoSession>();
  const [execution, setExecution] = useState<MigrationExecution>();
  const [busy, setBusy] = useState(false);
  // What MoveBooks is doing right now, shown on the current journey step.
  const [working, setWorking] = useState<"migrate" | "resolve">();
  const [error, setError] = useState<string>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activity, setActivity] = useState<AgentActivity[]>([]);

  // A user action supersedes a still-pending initial read; the late read is ignored.
  const acted = useRef(0);
  useEffect(() => {
    const saved = new URLSearchParams(window.location.search).get("session") ?? sessionStorage.getItem("movebooks-migration-session");
    if (!saved) return;
    let active = true;
    const before = acted.current;
    const fresh = () => active && acted.current === before;
    void api<DemoSession>(`/v1/migration-sessions/${saved}`).then(data => {
      if (!fresh()) return;
      setSession(data); setExecution(data.execution ?? undefined); setActivity(data.activity);
      sessionStorage.setItem("movebooks-migration-session", data.id);
      window.history.replaceState(null, "", `?session=${encodeURIComponent(data.id)}`);
    }).catch(caught => { if (fresh()) setError(caught.message); });
    return () => { active = false; };
  }, []);

  // The execution's status is the live read while migrating. Otherwise the session's workflow
  // status is authoritative: once the migration has moved on (for example to blocked validation)
  // the execution still reads MIGRATION_COMPLETE, so it leads only when it is further along.
  const ahead = (a: string, b: string) => (journeyStepFor(a) ?? -1) > (journeyStepFor(b) ?? -1);
  const status = session && (execution && ahead(execution.status, session.workflow_status) ? execution.status : session.workflow_status);
  const projection = session && status ? projectJourney({ status, mappingIssues: pendingMappingsIn(session.mappings), readinessIssues: session.assessment?.blocker_count ?? 0 }) : undefined;
  const proposal = execution?.resolutions.at(-1);
  const failure = execution?.failures.find((item) => item.id === proposal?.failure_id);
  const complete = execution?.status === "MIGRATION_COMPLETE";
  const resolving = execution?.status === "RESOLVING";
  const retryPending = execution?.status === "RETRY_PENDING";
  const openIssues = execution?.failures.filter((item) => !item.resolved).length ?? 0;

  const loadDemo = async () => {
    acted.current += 1;
    setBusy(true);
    setError(undefined);
    try {
      const created = await api<DemoSession>("/v1/migration-demo-sessions", { method: "POST" });
      setSession(created);
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
      setActivity(await api<AgentActivity[]>(`/v1/migration-sessions/${session.id}/activity`));
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
      setActivity(await api<AgentActivity[]>(`/v1/migration-sessions/${session.id}/activity`));
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
      setActivity(await api<AgentActivity[]>(`/v1/migration-sessions/${session.id}/activity`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The governed retry could not run.");
    } finally {
      setBusy(false); setWorking(undefined);
    }
  };

  return (
    <main className="shell min-h-[75vh] py-12 sm:py-16">
      <header>
        <div className="max-w-3xl">
          <p className="eyebrow text-primary">Migrate → Resolve</p>
          <h1 ref={headingRef} tabIndex={-1} className="type-page mt-4">Execute Visibly. Pause Safely. Resolve with Evidence.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
            Run an approved synthetic migration, inspect every batch, and keep consequential
            remediation under your control. No accounting-provider writes occur in this Beta slice.
          </p>
        </div>
      </header>

      <MigrationJourney className="mt-10" current={projection?.current ?? null} held={projection?.held} currentLabel={projection?.currentLabel} processing={working ? PROCESSING[working] : undefined} />

      {error && (
        <div className="mt-6">
          <Alert tone="error" title="Governed workflow stopped">
            <p className="mt-1">{error}</p>
          </Alert>
        </div>
      )}

      <Panel className="mt-8 border-[var(--primary)]">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="activity-icon"><Database aria-hidden="true" size={19} /></div>
            <div>
              <h2 className="type-section">Approved Synthetic Manifest</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
                Continue with your approved business session. Standalone demo loading replays prior
                approvals in a new session; it is not evidence of completing the full journey.
              </p>
            </div>
          </div>
          {!session ? (
            <Button onClick={loadDemo} disabled={busy}>Load reviewed manifest</Button>
          ) : !execution ? (
            <Button onClick={start} disabled={busy} leadingIcon={Play}>Start Migration</Button>
          ) : retryPending ? (
            <Button onClick={retry} disabled={busy} leadingIcon={RefreshCw}>Retry failed batch</Button>
          ) : resolving && proposal ? (
            <Button onClick={() => setDialogOpen(true)} disabled={busy} leadingIcon={Bot}>{openIssues > 1 ? `Review ${openIssues} Migration Issues` : "Review 1 Migration Issue"}</Button>
          ) : null}
        </div>
        {session && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge>{session.company_name}</Badge>
            <Badge>synthetic target</Badge>
            <Badge>approved manifest</Badge>
          </div>
        )}
      </Panel>

      {execution && (
        <section className="mt-12 motion-enter" aria-labelledby="progress-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-primary">Migration Agent</p>
              <h2 id="progress-heading" className="type-section mt-2">Execution Progress</h2>
              <p className="mt-2 text-secondary">Current agent: {humanize(execution.current_agent)}</p>
            </div>
            <StatusBadge
              status={complete ? "COMPLETED" : resolving ? "REQUIRES APPROVAL" : execution.status === "MIGRATION_BLOCKED" ? "BLOCKED" : "IN PROGRESS"}
            />
          </div>
          <div className="mt-5" aria-label={`${execution.progress_percent}% migration progress`}>
            <div className="mb-2 flex justify-between text-sm"><span>Approved records processed</span><strong>{execution.progress_percent}%</strong></div>
            <div className="progress-track"><div className="progress-value" style={{ width: `${execution.progress_percent}%` }} /></div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {execution.batches.map((batch) => (
              <Card key={batch.id}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="type-meta">Batch {batch.sequence}</p><h3 className="type-card mt-1">{humanize(batch.entity)}</h3></div>
                  <StatusBadge status={batchStatus(batch)} />
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-muted">Records</dt><dd className="mt-1 font-bold">{batch.record_count}</dd></div>
                  <div><dt className="text-muted">Attempts</dt><dd className="mt-1 font-bold">{batch.attempt_count}</dd></div>
                  <div><dt className="text-muted">Retry limit</dt><dd className="mt-1 font-bold">{batch.retry_limit}</dd></div>
                </dl>
              </Card>
            ))}
          </div>
        </section>
      )}

      {failure && (
        <section className="mt-12" aria-labelledby="exception-heading">
          <Alert tone={failure.resolved ? "success" : "warning"} title={failure.resolved ? "Exception resolved" : "Migration paused safely"}>
            <p className="mt-1">{failure.summary} Prior completed checkpoints remain intact.</p>
          </Alert>
          <Card className="mt-4">
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow text-primary">Controlled exception</p><h2 id="exception-heading" className="type-card mt-2">{humanize(failure.kind)}</h2></div>
              <Badge>{failure.code}</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-secondary">{failure.root_cause}</p>
            <p className="mt-3 text-sm"><strong>Retry count:</strong> {failure.retry_count}</p>
            <Button className="mt-5" variant="secondary" onClick={() => setDialogOpen(true)} disabled={!resolving} leadingIcon={Bot}>
              Review Resolution Agent proposal
            </Button>
          </Card>
        </section>
      )}

      {complete && (
        <section className="mt-12">
          <Alert tone="success" title="Synthetic migration complete">
            <p className="mt-1">All batches completed, no blocking exceptions remain, and the target state is inspectable.</p>
          </Alert>
          <NextAction className="mt-4" label="Verify My Books" href={`/validate-configure?session=${session?.id}`}>
            <span className="flex items-start gap-3"><ShieldCheck aria-hidden="true" className="mt-1 shrink-0 text-primary" size={19} />Compare your migrated books with the source evidence before setting up the environment.</span>
          </NextAction>
        </section>
      )}

      {activity.length > 0 && (
        <section className="mt-12" aria-labelledby="activity-heading">
          <p className="eyebrow text-primary">Audit activity</p>
          <h2 id="activity-heading" className="type-section mt-2">Evidence-Backed Actions</h2>
          <Panel className="mt-5">
            <ol>
              {activity.slice(-6).reverse().map((item) => (
                <li className="activity-item" key={item.id}>
                  <div className="activity-icon"><Bot aria-hidden="true" size={17} /></div>
                  <div><p className="font-semibold">{item.action}</p><p className="mt-1 text-sm text-secondary">{humanize(item.agent)} · {humanize(item.status)} · {humanize(item.risk)} risk</p></div>
                </li>
              ))}
            </ol>
          </Panel>
        </section>
      )}

      <Dialog
        fallbackFocusRef={headingRef}
        open={dialogOpen && Boolean(proposal)}
        onClose={() => setDialogOpen(false)}
        title="Review proposed resolution"
        description="The Resolution Agent can propose a reversible action. You govern this consequential decision."
      >
        {proposal && failure && (
          <div>
            <div className="flex flex-wrap gap-2"><Badge>{humanize(proposal.specialist)}</Badge><Badge>{proposal.risk} risk</Badge><Badge>{Math.round(proposal.confidence * 100)}% policy confidence</Badge></div>
            <h3 className="type-card mt-5">{humanize(proposal.action)}</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">{proposal.rationale}</p>
            <div className="mt-5 rounded-lg bg-[var(--surface-subtle)] p-4 text-sm">
              <strong>Evidence</strong>
              <ul className="mt-2 grid gap-1 text-secondary">{proposal.evidence.map((item) => <li className="break-all" key={item}>• {item}</li>)}</ul>
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-secondary"><AlertTriangle aria-hidden="true" size={18} />{proposal.escalation_rule}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => decide(false)} disabled={busy}>Reject and block</Button>
              <Button onClick={() => decide(true)} disabled={busy} leadingIcon={CheckCircle2}>Approve resolution</Button>
            </div>
          </div>
        )}
      </Dialog>
    </main>
  );
}
