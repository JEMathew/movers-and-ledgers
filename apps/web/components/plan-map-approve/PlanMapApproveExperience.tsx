"use client";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileCheck2,
  GitBranch,
  LockKeyhole,
  MessageCircleQuestion,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { AgentActivity } from "@/components/discover-assess/types";
import { Alert, LoadingState } from "@/components/ui/feedback";
import { Select } from "@/components/ui/forms";
import { Stepper } from "@/components/ui/navigation";
import { Badge, Button, Card, Panel } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status";

import type { MappingProposal, MappingState, MigrationPlan } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const AUTH_HEADERS = {
  Authorization: "Bearer demo-user",
  "Content-Type": "application/json",
};

type Phase = "idle" | "planning" | "mapping" | "review" | "error";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...AUTH_HEADERS, ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mappingProductStatus(state: MappingState) {
  if (state === "APPROVED" || state === "MODIFIED") return "COMPLETED" as const;
  if (state === "BLOCKED" || state === "REJECTED") return "BLOCKED" as const;
  return "REQUIRES APPROVAL" as const;
}

function phaseProductStatus(status: string) {
  if (status === "READY") return "READY" as const;
  if (status === "BLOCKED") return "BLOCKED" as const;
  if (status === "NEEDS_ATTENTION") return "NEEDS ATTENTION" as const;
  if (status === "FUTURE") return "NOT STARTED" as const;
  return "IN PROGRESS" as const;
}

export function PlanMapApproveExperience() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string>();
  const [plan, setPlan] = useState<MigrationPlan>();
  const [mappings, setMappings] = useState<MappingProposal[]>([]);
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [error, setError] = useState<string>();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modifications, setModifications] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = new URLSearchParams(window.location.search).get("session") ?? sessionStorage.getItem("movebooks-migration-session");
    if (!saved) return;
    void api<{id: string; plan?: MigrationPlan; mappings: MappingProposal[]; activity: AgentActivity[]}>(`/v1/migration-sessions/${saved}`).then(data => {
      setSessionId(data.id); setPlan(data.plan ?? undefined); setMappings(data.mappings); setActivity(data.activity);
      if (data.plan) setPhase("review");
    }).catch(caught => { setError(caught.message); setPhase("error"); });
  }, []);

  const preparePlan = async () => {
    setError(undefined);
    try {
      setPhase("planning");
      const activeSession = sessionId ?? new URLSearchParams(window.location.search).get("session") ?? sessionStorage.getItem("movebooks-migration-session");
      if (!activeSession) {
        throw new Error("Start with Discover → Assess, then continue with the same business session.");
      }
      setSessionId(activeSession);
      sessionStorage.setItem("movebooks-migration-session", activeSession);
      window.history.replaceState(null, "", `?session=${encodeURIComponent(activeSession)}`);
      const generatedPlan = await api<MigrationPlan>(
        `/v1/migration-sessions/${activeSession}/plan`,
        { method: "POST" },
      );
      setPlan(generatedPlan);
      setPhase("mapping");
      const generatedMappings = await api<MappingProposal[]>(
        `/v1/migration-sessions/${activeSession}/mappings`,
        { method: "POST" },
      );
      setMappings(generatedMappings);
      setActivity(
        await api<AgentActivity[]>(`/v1/migration-sessions/${activeSession}/activity`),
      );
      setPhase("review");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Planning could not be completed.");
      setPhase("error");
    }
  };

  const decide = async (
    proposal: MappingProposal,
    decision: "approve" | "reject" | "modify",
  ) => {
    if (!sessionId) return;
    setError(undefined);
    try {
      const body =
        decision === "modify"
          ? { selected_target: modifications[proposal.id], comment: "Customer-selected alternative" }
          : { comment: decision === "approve" ? "Approved with displayed evidence" : "Rejected for review" };
      const updated = await api<MappingProposal>(
        `/v1/migration-sessions/${sessionId}/mappings/${proposal.id}/${decision}`,
        { method: "POST", body: JSON.stringify(body) },
      );
      setMappings((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setActivity(await api<AgentActivity[]>(`/v1/migration-sessions/${sessionId}/activity`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The mapping decision was not recorded.");
    }
  };

  const running = phase === "planning" || phase === "mapping";
  const decisionsComplete = mappings.length > 0 && mappings.every((item) => ["APPROVED", "MODIFIED"].includes(item.state));
  const handoffReady = decisionsComplete && plan !== undefined && plan.blockers.length === 0;

  return (
    <main className="shell min-h-[75vh] py-12 sm:py-16">
      <header className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <p className="eyebrow text-primary">Plan → Map &amp; Approve</p>
          <h1 className="type-page mt-4">Build the governed migration handoff</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
            Understand the sequence, review every source-to-target recommendation, and keep
            consequential accounting decisions under human control.
          </p>
        </div>
        <div className="migration-orb" aria-hidden="true"><span /></div>
      </header>

      <div className="mt-10">
        <Stepper
          label="Complete migration journey"
          current={phase === "idle" ? 2 : phase === "planning" ? 2 : 3}
          steps={[
            { label: "Discover", complete: Boolean(sessionId), description: sessionId ? "Complete" : "Required" },
            { label: "Assess", complete: Boolean(sessionId), description: sessionId ? "Complete" : "Required" },
            { label: "Plan", description: plan ? "Prepared" : "Next" },
            { label: "Map & Approve", description: phase === "review" ? "Current" : "Next" },
            { label: "Migrate" },
            { label: "Resolve" },
            { label: "Validate" },
            { label: "Configure" },
            { label: "Onboard" },
            { label: "First Productive Use" },
          ]}
        />
      </div>

      <Panel className="mt-8 border-[var(--primary)]">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="activity-icon"><GitBranch aria-hidden="true" size={19} /></div>
            <div>
              <h2 className="type-section">Migration Plan</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
                Planning explains what happens, why the sequence matters, and what you must do.
                It does not execute a migration.
              </p>
            </div>
          </div>
          <Button onClick={preparePlan} disabled={running || Boolean(mappings.length)}>
            {plan ? "Plan and mappings prepared" : "Build migration plan"}
            <ArrowRight aria-hidden="true" size={17} />
          </Button>
        </div>
        {running && <div className="mt-5"><LoadingState label={phase === "planning" ? "Planning dependencies and checkpoints" : "Preparing mapping proposals"} /></div>}
      </Panel>

      {error && <div className="mt-6"><Alert tone="error" title="Governed workflow stopped"><p className="mt-1">{error}</p></Alert></div>}

      {plan && (
        <section className="mt-14 motion-enter" aria-labelledby="plan-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="eyebrow text-primary">Planning Agent</p><h2 id="plan-heading" className="type-section mt-2">Seven-phase plan</h2></div>
            <div className="flex gap-2"><Badge>{plan.version}</Badge><Badge>{plan.relative_complexity} relative complexity</Badge></div>
          </div>
          <ol className="mt-5 grid gap-4">
            {plan.phases.map((item) => (
              <li key={item.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="type-meta">Sequence {item.sequence} · {item.agent_responsible}</p><h3 className="mt-1 type-card">{item.name}</h3></div>
                    <StatusBadge status={phaseProductStatus(item.status)} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-secondary">{item.objective}</p>
                  <dl className="mt-4 grid gap-3 border-t border-token pt-4 text-sm md:grid-cols-3">
                    <div><dt className="font-bold">Depends on</dt><dd className="mt-1 text-secondary">{item.dependencies.join(", ") || "Assessment evidence"}</dd></div>
                    <div><dt className="font-bold">Customer action</dt><dd className="mt-1 text-secondary">{item.customer_action}</dd></div>
                    <div><dt className="font-bold">Approval checkpoint</dt><dd className="mt-1 text-secondary">{item.approval_checkpoint ?? "None"}</dd></div>
                  </dl>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      )}

      {mappings.length > 0 && (
        <section className="mt-14" aria-labelledby="mapping-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="eyebrow text-primary">Mapping Agent + specialists</p><h2 id="mapping-heading" className="type-section mt-2">Review mapping proposals</h2><p className="mt-2 text-secondary">Confidence supports review; deterministic controls and your decision govern progression.</p></div>
            <StatusBadge status={decisionsComplete ? "COMPLETED" : "REQUIRES APPROVAL"} />
          </div>
          <div className="mt-5 grid gap-4">
            {mappings.map((item) => (
              <Card key={item.id} aria-label={`${item.source_label} mapping`}>
                <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto]">
                  <div><p className="type-meta">Source · {humanize(item.area)}</p><h3 className="mt-1 type-card">{item.source_label}</h3><p className="mt-2 text-sm text-secondary">Specialist: {humanize(item.specialist)}</p></div>
                  <div><p className="type-meta">Recommended target</p><p className="mt-1 font-bold">{item.selected_target}</p><p className="mt-2 text-sm text-secondary">Confidence {Math.round(item.confidence * 100)}% · {humanize(item.risk)} risk</p></div>
                  <StatusBadge status={mappingProductStatus(item.state)} />
                </div>
                <p className="mt-4 text-sm leading-6 text-secondary">{item.rationale}</p>
                {expanded[item.id] && <div className="mt-4 rounded-lg bg-[var(--surface-subtle)] p-4 text-sm"><strong>Evidence and policy</strong><ul className="mt-2 grid gap-1 text-secondary">{item.evidence.map((evidence) => <li key={evidence}>• {evidence}</li>)}{item.policy_reasons.map((reason) => <li key={reason}>• {reason}</li>)}</ul></div>}
                <div className="mt-5 grid gap-4 border-t border-token pt-4 lg:grid-cols-[1fr_auto]">
                  <div className="max-w-md">
                    <Select label="Modify target" value={modifications[item.id] ?? ""} onChange={(event) => setModifications((current) => ({ ...current, [item.id]: event.target.value }))} disabled={item.state === "APPROVED" || item.state === "MODIFIED" || item.state === "REJECTED"}>
                      <option value="">Choose a supported alternative</option>
                      {[item.recommended_target, ...item.alternatives].filter((value, index, values) => values.indexOf(value) === index).map((option) => <option key={option} value={option}>{option}</option>)}
                    </Select>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <Button size="small" variant="ghost" onClick={() => setExpanded((current) => ({ ...current, [item.id]: !current[item.id] }))}><MessageCircleQuestion aria-hidden="true" size={16} /> Ask for explanation</Button>
                    <Button size="small" variant="secondary" onClick={() => decide(item, "reject")} disabled={["APPROVED", "MODIFIED", "REJECTED"].includes(item.state)}>Reject</Button>
                    <Button size="small" variant="secondary" onClick={() => decide(item, "modify")} disabled={!modifications[item.id] || ["APPROVED", "MODIFIED", "REJECTED"].includes(item.state)}>Modify</Button>
                    <Button size="small" onClick={() => decide(item, "approve")} disabled={item.state === "BLOCKED" || ["APPROVED", "MODIFIED", "REJECTED"].includes(item.state)}>Approve</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <Alert tone={handoffReady ? "success" : "warning"} title={handoffReady ? "Approved manifest ready for handoff" : "Migration remains stopped"}>
              <p className="mt-1">{handoffReady ? "Your approved mappings and plan will be used by migration in this same business session. No target writes have occurred yet." : decisionsComplete ? "Mapping decisions are complete, but deterministic assessment blockers must be resolved before migration handoff." : "Every proposal must reach an approved or modified state. Blocked, rejected, or pending decisions prevent migration handoff."}</p>
              {handoffReady && <a className="mt-3 inline-block font-semibold underline" href={`/migrate-resolve?session=${sessionId}`}>Continue to Migrate → Resolve</a>}
            </Alert>
          </div>
        </section>
      )}

      {activity.length > 0 && (
        <section className="mt-14" aria-labelledby="planning-activity-heading">
          <div className="flex items-center gap-3"><div className="activity-icon"><Bot aria-hidden="true" size={18} /></div><div><p className="eyebrow text-primary">Agent operations</p><h2 id="planning-activity-heading" className="type-section mt-1">Planning, mapping, and approval activity</h2></div></div>
          <Panel className="mt-5"><ul>{activity.slice(-12).map((item) => <li className="activity-item" key={item.id}><div className="activity-icon"><CheckCircle2 aria-hidden="true" size={17} /></div><div><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{item.action}</strong><Badge>{humanize(item.risk)} risk</Badge></div><p className="mt-1 text-xs text-secondary">{humanize(item.agent)} · {humanize(item.tool)} · {item.provenance}</p></div></li>)}</ul></Panel>
        </section>
      )}

      <footer className="mt-14 grid gap-3 border-t border-token py-8 text-sm text-secondary sm:grid-cols-3">
        <div className="flex gap-2"><ShieldCheck aria-hidden="true" className="shrink-0 text-primary" size={19} /><span>Deterministic controls remain authoritative.</span></div>
        <div className="flex gap-2"><LockKeyhole aria-hidden="true" className="shrink-0 text-primary" size={19} /><span>Human approval gates consequential mappings.</span></div>
        <div className="flex gap-2"><FileCheck2 aria-hidden="true" className="shrink-0 text-primary" size={19} /><span>Synthetic evidence only; no target writes.</span></div>
      </footer>
    </main>
  );
}
