"use client";

import { useEffect, useRef, useState } from "react";
import { authHeaders } from "@/lib/identity";
import { Alert, LoadingState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/primitives";
import { PhaseProgress, TaskContext } from "@/components/journey/PhaseProgress";
import { journeyStepFor, pendingMappingsIn, PROCESSING, projectJourney } from "@/components/journey/journey";
import { ActionLink } from "@/components/journey/NextAction";
import { isSessionId, projectSession, SELECTED_SESSION_KEY } from "@/components/public-surfaces/session";
import { StageHeader } from "@/components/v2/Workflow";
import { MappingReview, mappingReviewed } from "./MappingReview";
import { bulkEligible, RefusedError, runBulkApproval, type BulkItem, type BulkOutcome } from "./bulk-approval";
import { groupMappings } from "./mapping-groups";
import { ApprovalReview } from "./ApprovalReview";
import { PlanSummary } from "./PlanSummary";
import type { MappingHistoryDecision, MappingProposal, MigrationPlan } from "./types";

type Snapshot = {
  id: string; synthetic: boolean; workflow_status: string;
  plan?: MigrationPlan | null; mappings: MappingProposal[];
  human_decisions?: MappingHistoryDecision[];
  assessment?: { blocker_count: number; readiness: string };
};
type View = "plan" | "map" | "approve";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** The API answered with an error status (as opposed to no answer at all). */
class HttpError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...await authHeaders(), "Content-Type": "application/json", ...init?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new HttpError(typeof body?.detail === "string" ? body.detail : `Request failed with status ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}

export function PlanMapApproveExperience() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [readState, setReadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [view, setView] = useState<View>("plan");
  const [busy, setBusy] = useState(false);
  // The path MoveBooks is working on, so the journey can say what is happening.
  const [working, setWorking] = useState<string>();
  const mutation = useRef(false);
  const mounted = useRef(false);
  const sessionRef = useRef<string | undefined>(undefined);
  const heading = useRef<HTMLSpanElement>(null);

  function validate(data: Snapshot, id: string) {
    projectSession(data, id);
    return { ...data, mappings: data.mappings ?? [] };
  }

  useEffect(() => {
    const controller = new AbortController();
    mounted.current = true;
    let active = true;
    async function read() {
      try {
        const id = new URLSearchParams(window.location.search).get("session") ?? sessionStorage.getItem(SELECTED_SESSION_KEY);
        if (!id) throw new Error("Start with Understand, then continue with the same migration.");
        if (!isSessionId(id)) throw new Error("Invalid session reference. Open an existing migration from My migration.");
        sessionRef.current = id;
        const data = validate(await api<Snapshot>(`/v1/migration-sessions/${id}`, { signal: controller.signal }), id);
        if (!active) return;
        // Selection adoption belongs only to the validated initial read, never a mutation.
        sessionStorage.setItem(SELECTED_SESSION_KEY, id);
        setSnapshot(data); setReadState("ready");
      } catch (caught) {
        if (!active) return;
        setReadState("error"); setError(caught instanceof Error ? caught.message : "Session unavailable.");
      }
    }
    void read();
    return () => { active = false; mounted.current = false; controller.abort(); };
  }, []);

  async function refresh() {
    const id = sessionRef.current;
    if (!id) return;
    setReadState("loading");
    try {
      const data = validate(await api<Snapshot>(`/v1/migration-sessions/${id}`), id);
      if (mounted.current) {
        // A successful retry of the initial read may adopt its validated deep link.
        // Refreshes after decisions never replace a selection made elsewhere.
        if (!snapshot) sessionStorage.setItem(SELECTED_SESSION_KEY, data.id);
        setSnapshot(data); setReadState("ready");
      }
    } catch (caught) {
      if (mounted.current) setReadState("error");
      throw caught;
    }
  }

  async function mutate(path: string, body?: unknown) {
    if (readState !== "ready" || !snapshot || mutation.current) return false;
    mutation.current = true; setBusy(true); setWorking(path); setError(undefined);
    try {
      await api(`/v1/migration-sessions/${snapshot.id}${path}`, { method: "POST", ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      await refresh(); // POST responses never substitute for an authoritative session read.
      return true;
    } catch (caught) {
      if (mounted.current) {
        setError(caught instanceof Error ? caught.message : "The decision could not be confirmed.");
        setReadState("error");
      }
      return false;
    } finally {
      mutation.current = false;
      if (mounted.current) { setBusy(false); setWorking(undefined); }
    }
  }

  function changeView(next: View) { setView(next); heading.current?.focus(); }
  const plan = snapshot?.plan;
  const mappings = snapshot?.mappings ?? [];
  const status = snapshot?.workflow_status;
  const ready = readState === "ready";
  const editable = ready && status === "AWAITING_APPROVAL";
  const reviewed = mappings.length > 0 && mappings.every(mappingReviewed);
  const approved = ready && status !== undefined && (journeyStepFor(status) ?? 0) >= 4;
  const projection = ready && snapshot ? projectJourney({ status: snapshot.workflow_status, mappingIssues: pendingMappingsIn(mappings), readinessIssues: snapshot.assessment?.blocker_count ?? 0 }) : undefined;
  const current = projection?.current ?? null;

  async function reviewMappings() {
    if (!ready || !plan || busy) return;
    if (!mappings.length && status === "PLANNED" && !await mutate("/mappings")) return;
    changeView("map");
  }

  /** Low-risk batch approval: N separate calls to the existing per-item approve endpoint (bulk-approval.ts).
   *  Holds the same single-mutation lock as every other decision and ends with an authoritative read. */
  async function runBulk(set: BulkItem[]): Promise<BulkOutcome> {
    if (readState !== "ready" || !snapshot || mutation.current || snapshot.workflow_status !== "AWAITING_APPROVAL") return { kind: "unread", message: "This migration is not ready for decisions. Read it again first.", set };
    const id = snapshot.id;
    mutation.current = true; setBusy(true); setWorking("/bulk"); setError(undefined);
    try {
      const outcome = await runBulkApproval({
        set, setId: crypto.randomUUID().slice(0, 8),
        readFresh: async () => validate(await api<Snapshot>(`/v1/migration-sessions/${id}`), id).mappings,
        // A 4xx answer is a refusal. A lost connection or a 5xx (including the proxy's 503 after an upstream
        // timeout) is not: that approval may have been recorded.
        approve: (item, body) => api(`/v1/migration-sessions/${id}/mappings/${item.id}/approve`, { method: "POST", body: JSON.stringify(body) }).catch(caught => { throw caught instanceof HttpError && caught.status < 500 ? new RefusedError(caught.message) : caught; }),
      });
      // POST responses never substitute for an authoritative session read.
      if (outcome.kind !== "unread") await refresh().catch(caught => { if (mounted.current) setError(caught instanceof Error ? caught.message : "Session unavailable."); });
      return outcome;
    } finally {
      mutation.current = false;
      if (mounted.current) { setBusy(false); setWorking(undefined); }
    }
  }

  const groups = groupMappings(mappings);
  const needs = groups.find(group => group.id === "needs_review")?.items.length ?? 0;
  const batch = mappings.filter(bulkEligible).length;
  const pending = mappings.filter(mapping => !mappingReviewed(mapping)).length;
  const title = approved ? "Your migration plan is approved" : plan ? view === "map" ? "Map and approve" : view === "approve" ? "Review your migration plan" : "Your migration plan is ready" : "Prepare your migration plan";
  const step = !plan ? "plan" : view === "map" ? "map and approve" : view === "approve" ? "approve the plan" : "plan";
  const guide = approved
    ? (status === "APPROVED" || status === "MIGRATION_READY" ? "Your approval is recorded. Start migration separately when you are ready." : "Your approved plan is retained with this migration. Return to My migration for your current next step.")
    : !plan ? (ready && ["CREATED", "DISCOVERED"].includes(status ?? "") ? "Finish the readiness check first. Planning keeps every blocker visible beside your plan." : "Create the plan to see what will move and which decisions need you. Nothing moves during this review.")
    : view === "map" ? (pending === 0 ? "Every mapping is decided. Review the plan, then approve it. Records move only after you start the move." : `${needs ? `Riskiest first. Decide on ${needs === 1 ? "this one" : `these ${needs}`}, then` : "Start with any mapping, then"} ${batch ? "approve the low-risk ones together" : "decide the rest one by one"}. Records move only when every mapping is approved or changed.`)
    : view === "approve" ? "Approving the plan records your consent to this scope and these mappings. It doesn't move anything; you start the move separately."
    : mappings.length ? `The rules have proposed where every record goes. ${pending ? `${pending} of ${mappings.length} mappings still need your decision before anything moves.` : "Every mapping is decided."}` : "Review the scope and blockers, then the rules propose where each record goes. Nothing moves during this review.";

  return <main id="main-content" className={`shell migration-task pm-page${view === "approve" ? " approval-surface" : ""}`}>
    <nav className="pm-crumbs" aria-label="Breadcrumb"><ol><li><a href={snapshot ? `/workspace?session=${snapshot.id}` : "/workspace"}>My migration</a></li><li aria-current="page">{view === "map" && plan ? "Map and approve" : view === "approve" && plan ? "Approve the plan" : "Plan"}</li></ol></nav>
    <StageHeader stage={1} step={step} title={<span ref={heading} tabIndex={-1}>{title}</span>} guide={guide} />
    <TaskContext phase={1} session={snapshot?.id} />
    <PhaseProgress session={snapshot?.id} status={status} current={current} held={projection?.held} currentLabel={projection?.currentLabel} unknown={readState === "loading" ? "loading" : "unavailable"} processing={working === "/plan" ? PROCESSING.plan : working === "/mappings" ? PROCESSING.map : undefined} />
    {readState === "loading" && <div className="mt-6"><LoadingState label="Loading your migration" /></div>}
    {error && <div className="mt-6"><Alert tone="error" title="Migration review stopped"><p>{error}</p><p className="mt-2">No new approval or progress is assumed. Read this migration again before recording another decision.</p>{sessionRef.current && <Button variant="secondary" className="mt-4" disabled={busy} onClick={() => { setError(undefined); void refresh().catch(caught => setError(caught instanceof Error ? caught.message : "Session unavailable.")); }}>Read migration again</Button>}<a className="ml-4 font-semibold underline" href="/workspace">My migration</a></Alert></div>}
    {!plan && <section className="pm-card pm-start" aria-labelledby="create-plan-heading"><p className="pm-eyebrow">Your next step</p><h2 id="create-plan-heading">Create the plan for this migration</h2><p className="pm-meta">Complete your assessment first. Planning preserves its blockers and prepares the scope for your review.</p><div className="pm-actions"><Button variant={ready && status === "ASSESSED" ? "primary" : "secondary"} disabled={!ready || status !== "ASSESSED" || busy} onClick={() => void mutate("/plan")}>Create my migration plan</Button>{ready && ["CREATED", "DISCOVERED"].includes(status ?? "") && <ActionLink label="Continue assessment" href={`/assess?session=${snapshot?.id}`} />}</div></section>}
    {plan && <>
      <nav className="pm-views" aria-label="Plan review views">
        <Button variant="ghost" aria-current={view === "plan" ? "page" : undefined} onClick={() => changeView("plan")}>Plan summary</Button>
        {mappings.length > 0 && <Button variant="ghost" aria-current={view === "map" ? "page" : undefined} onClick={() => changeView("map")}>Mappings</Button>}
        {reviewed && <Button variant="ghost" aria-current={view === "approve" ? "page" : undefined} onClick={() => changeView("approve")}>Approval review</Button>}
      </nav>
      {view === "plan" && <><section className="pm-card pm-next" aria-label="Your next step"><div className="min-w-0"><p className="pm-eyebrow">Your next step</p><p className="pm-next-title">{approved ? "This scope is retained with the migration." : mappings.length ? `Decide ${pending} of ${mappings.length} mappings` : "Review where your records go"}</p><p className="pm-meta">{approved ? "Your decisions and the plan approval are recorded with your name." : "Check the scope and blockers below, then review the destination for every mapping."}</p></div>{!approved && <Button disabled={!ready || busy || !["PLANNED", "MAPPING", "AWAITING_APPROVAL"].includes(status ?? "")} onClick={() => void reviewMappings()}>Review mappings</Button>}{approved && <ApprovedHandoff snapshot={snapshot!} />}</section><PlanSummary plan={plan} mappings={mappings} /></>}
      {view === "map" && <MappingReview readinessBlocked={!snapshot?.assessment || Boolean(snapshot.assessment.blocker_count) || snapshot.assessment.readiness === "BLOCKED"} handoff={approved ? <ApprovedHandoff snapshot={snapshot!} /> : undefined} mappings={mappings} history={snapshot?.human_decisions ?? []} editable={editable} busy={busy} planApproved={approved} decide={async (mapping, action, target) => {
        if (!editable) return;
        await mutate(`/mappings/${mapping.id}/${action}`, action === "modify" ? { selected_target: target, comment: "Changed after reviewing the displayed evidence" } : { comment: action === "approve" ? "Reviewed the displayed mapping and evidence" : "Rejected after reviewing the displayed evidence" });
      }} reconsider={async (mapping, path, body) => { if (!editable || !await mutate(`/mappings/${mapping.id}${path}`, body)) throw new Error("Reconsideration could not be confirmed. Read the migration again."); }} runBulk={runBulk} onReviewPlan={() => changeView("approve")} />}
      {view === "approve" && <>
        {approved && <div className="mt-4"><ApprovedHandoff snapshot={snapshot!} /></div>}
        <ApprovalReview plan={plan} mappings={mappings} approved={approved} readConfirmed={ready} busy={busy} fallbackFocusRef={heading} assessmentBlocked={Boolean(snapshot?.assessment?.blocker_count) || snapshot?.assessment?.readiness === "BLOCKED"} canApprove={editable && reviewed && !plan.blockers.length} approve={() => mutate("/plan", { action: "approve", plan_id: plan.id })} />
      </>}
    </>}
    {snapshot && <details className="pm-history"><summary>Recorded decisions · {(snapshot.human_decisions ?? []).length}</summary><ul>{(snapshot.human_decisions ?? []).map(decision => <li key={decision.id}>{decision.decision} · {decision.actor} · <time>{decision.occurred_at}</time> · Decision {decision.id}</li>)}</ul>{!snapshot.human_decisions?.length && <p className="pm-meta">No decisions recorded yet.</p>}</details>}
    <p className="pm-boundary">Synthetic Beta · plan review never starts migration. Deterministic controls remain authoritative; this review uses a synthetic target and no production accounting writes are enabled.</p>
  </main>;
}

function ApprovedHandoff({ snapshot }: { snapshot: Snapshot }) {
  return ["APPROVED", "MIGRATION_READY"].includes(snapshot.workflow_status) ? <ActionLink label="Continue to Move" href={`/migrate-resolve?session=${snapshot.id}`} /> : <ActionLink label="Return to my migration" href={`/workspace?session=${snapshot.id}`} />;
}
