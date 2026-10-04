"use client";

import { useEffect, useRef, useState } from "react";
import { authHeaders } from "@/lib/identity";
import { Alert, LoadingState } from "@/components/ui/feedback";
import { Button, Panel } from "@/components/ui/primitives";
import { MigrationJourney } from "@/components/journey/MigrationJourney";
import { journeyCurrentFor, journeyHeldFor, journeyStepFor, PROCESSING } from "@/components/journey/journey";
import { ActionLink } from "@/components/journey/NextAction";
import { isSessionId, projectSession, SELECTED_SESSION_KEY } from "@/components/public-surfaces/session";
import { MappingReview, mappingReviewed } from "./MappingReview";
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

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...await authHeaders(), "Content-Type": "application/json", ...init?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : `Request failed with status ${response.status}`);
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
  const heading = useRef<HTMLHeadingElement>(null);

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
        if (!id) throw new Error("Start with Discover → Assess, then continue with the same business session.");
        if (!isSessionId(id)) throw new Error("Invalid session reference. Open an existing migration from My Migration.");
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
  const current = ready && snapshot ? journeyCurrentFor({ id: snapshot.id, status: snapshot.workflow_status, mappingIssues: mappings.filter(mapping => !mappingReviewed(mapping)).length, readinessIssues: 0, migrationIssues: 0, verificationIssues: 0 }) : null;

  async function reviewMappings() {
    if (!ready || !plan || busy) return;
    if (!mappings.length && status === "PLANNED" && !await mutate("/mappings")) return;
    changeView("map");
  }

  return <main id="main-content" className="shell min-h-[75vh] py-12 sm:py-16">
    <header className="max-w-3xl"><p className="eyebrow text-primary">Plan → Map → Approve</p>
      <h1 ref={heading} tabIndex={-1} className="type-page mt-4">{approved ? "Your Migration Plan Is Approved" : plan ? view === "map" ? "Choose Where Your Records Go" : view === "approve" ? "Review Your Migration Plan" : "Your Migration Plan Is Ready" : "Prepare Your Migration Plan"}</h1>
      <p className="mt-5 text-lg leading-8 text-secondary">{approved ? (status === "APPROVED" || status === "MIGRATION_READY" ? "Your approval is recorded. Start Migration separately when you are ready." : "Your approved plan is retained with this migration. Return to My Migration for your current next step.") : "Review the scope and evidence, confirm each mapping, then explicitly approve your plan. Nothing moves during this review."}</p>
    </header>
    <MigrationJourney className="mt-8" current={current} held={status && ready ? journeyHeldFor(status, plan?.blockers.length ?? 0) : undefined} unknown={readState === "loading" ? "loading" : "unavailable"} processing={working === "/plan" ? PROCESSING.plan : working === "/mappings" ? PROCESSING.map : undefined} />
    {readState === "loading" && <div className="mt-6"><LoadingState label="Loading your migration" /></div>}
    {error && <div className="mt-6"><Alert tone="error" title="Migration Review Stopped"><p>{error}</p><p className="mt-2">No new approval or progress is assumed. Read this migration again before recording another decision.</p>{sessionRef.current && <Button variant="secondary" className="mt-4" disabled={busy} onClick={() => { setError(undefined); void refresh().catch(caught => setError(caught instanceof Error ? caught.message : "Session unavailable.")); }}>Read migration again</Button>}<a className="ml-4 font-semibold underline" href="/workspace">My Migration</a></Alert></div>}
    {!plan && <Panel className="mt-8"><h2 className="type-section">Create the Plan for This Migration</h2><p className="mt-2 text-secondary">Complete your assessment first. Planning preserves its blockers and prepares the scope for your review.</p><Button className="mt-4" variant={ready && status === "ASSESSED" ? "primary" : "secondary"} disabled={!ready || status !== "ASSESSED" || busy} onClick={() => void mutate("/plan")}>Create My Migration Plan</Button>{ready && ["CREATED", "DISCOVERED"].includes(status ?? "") && <ActionLink className="mt-4 sm:ml-4" label="Continue Assessment" href={`/assess?session=${snapshot?.id}`} />}</Panel>}
    {plan && <>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Plan review views">
        <Button variant="ghost" aria-current={view === "plan" ? "page" : undefined} onClick={() => changeView("plan")}>Plan Summary</Button>
        {mappings.length > 0 && <Button variant="ghost" aria-current={view === "map" ? "page" : undefined} onClick={() => changeView("map")}>Mappings</Button>}
        {reviewed && <Button variant="ghost" aria-current={view === "approve" ? "page" : undefined} onClick={() => changeView("approve")}>Approval Review</Button>}
      </nav>
      {view === "plan" && <><Panel className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="max-w-xl text-secondary">{approved ? "This scope is retained with the migration." : "Check the scope, blockers and review workload, then review the destination for every mapping."}</p>{!approved && <Button disabled={!ready || busy || !["PLANNED", "MAPPING", "AWAITING_APPROVAL"].includes(status ?? "")} onClick={() => void reviewMappings()}>Review Mappings</Button>}{approved && <ApprovedHandoff snapshot={snapshot!} />}</Panel><PlanSummary plan={plan} mappings={mappings} /></>}
      {view === "map" && <MappingReview handoff={approved ? <ApprovedHandoff snapshot={snapshot!} /> : undefined} mappings={mappings} history={snapshot?.human_decisions ?? []} editable={editable} busy={busy} planApproved={approved} decide={async (mapping, action, target) => {
        if (!editable) return;
        await mutate(`/mappings/${mapping.id}/${action}`, action === "modify" ? { selected_target: target, comment: "Changed after reviewing the displayed evidence" } : { comment: action === "approve" ? "Reviewed the displayed mapping and evidence" : "Rejected after reviewing the displayed evidence" });
      }} reconsider={async (mapping, path, body) => { if (!editable || !await mutate(`/mappings/${mapping.id}${path}`, body)) throw new Error("Reconsideration could not be confirmed. Read the migration again."); }} onReviewPlan={() => changeView("approve")} />}
      {view === "approve" && <>
        <ApprovalReview plan={plan} mappings={mappings} approved={approved} readConfirmed={ready} busy={busy} fallbackFocusRef={heading} assessmentBlocked={Boolean(snapshot?.assessment?.blocker_count) || snapshot?.assessment?.readiness === "BLOCKED"} canApprove={editable && reviewed && !plan.blockers.length} approve={() => mutate("/plan", { action: "approve", plan_id: plan.id })} />
        {approved && <div className="mt-6"><ApprovedHandoff snapshot={snapshot!} /></div>}
      </>}
    </>}
    {snapshot && <details className="mt-8"><summary className="cursor-pointer font-semibold">Recorded Human Decisions</summary><ul className="mt-4 space-y-3 break-words text-sm text-secondary">{(snapshot.human_decisions ?? []).map(decision => <li key={decision.id}>{decision.decision} · {decision.actor} · <time>{decision.occurred_at}</time> · Decision {decision.id}</li>)}</ul>{!snapshot.human_decisions?.length && <p className="mt-3 text-secondary">No human decisions recorded yet.</p>}</details>}
    <p className="mt-10 border-t border-token pt-6 text-sm text-secondary">Deterministic controls remain authoritative. This review uses a synthetic target; no production accounting writes are enabled.</p>
  </main>;
}

function ApprovedHandoff({ snapshot }: { snapshot: Snapshot }) {
  return ["APPROVED", "MIGRATION_READY"].includes(snapshot.workflow_status) ? <ActionLink label="Start Migration" href={`/migrate-resolve?session=${snapshot.id}`} /> : <ActionLink label="Return to My Migration" href={`/workspace?session=${snapshot.id}`} />;
}
