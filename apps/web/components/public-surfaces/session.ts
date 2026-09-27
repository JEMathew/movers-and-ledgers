"use client";
import { useEffect, useState } from "react";

export const isSessionId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function phaseFor(status: string): number | null {
  if (["CREATED", "DISCOVERED", "ASSESSED"].includes(status)) return 0;
  if (["PLANNED", "MAPPING", "AWAITING_APPROVAL", "APPROVED"].includes(status)) return 1;
  if (["MIGRATION_READY", "MIGRATING", "MIGRATION_PAUSED", "RESOLVING", "RETRY_PENDING", "MIGRATION_BLOCKED"].includes(status)) return 2;
  if (["MIGRATION_COMPLETE", "VALIDATING", "VALIDATED", "VALIDATION_BLOCKED", "CONFIGURING", "CONFIGURATION_REVIEW_REQUIRED"].includes(status)) return 3;
  if (["CONFIGURED", "ONBOARDING", "ONBOARDING_BLOCKED", "READY_FOR_FIRST_PRODUCTIVE_USE", "FIRST_PRODUCTIVE_USE_IN_PROGRESS", "FIRST_PRODUCTIVE_USE_BLOCKED", "VERIFIED_FIRST_PRODUCTIVE_USE"].includes(status)) return 4;
  return null;
}
type RecordData = Record<string, unknown>;
const object = (value: unknown): RecordData => value && typeof value === "object" && !Array.isArray(value) ? value as RecordData : {};
const list = (value: unknown): RecordData[] => Array.isArray(value) ? value.map(object) : [];
const text = (value: unknown) => typeof value === "string" ? value.slice(0, 400) : "";
const refs = (value: unknown) => Array.isArray(value) ? value.filter((x): x is string => typeof x === "string").slice(0, 12).map(x => x.slice(0, 160)) : [];
export type TraceRow = { id: string; title: string; kind: string; status: string; time: string; actor: string; tool: string; evidence: string[] };
export type SessionView = { id: string; status: string; phase: number; sourceKind: string; activity: TraceRow[]; decisions: TraceRow[]; checks: TraceRow[]; blockers: string[]; events: TraceRow[] };

// Explicit presentation projection. Never stringify a session, prompt, payload,
// model trace, invoice, selected value or raw reconciliation amount into the UI.
export function projectSession(raw: unknown, expectedId: string): SessionView {
  const s = object(raw);
  const status = text(s.workflow_status);
  const phase = phaseFor(status);
  if (s.id !== expectedId || s.synthetic !== true || phase === null) throw new Error("Unsupported session evidence. Open the original workflow; no success is inferred.");
  const activity = list(s.activity).map(a => ({ id: text(a.id), title: text(a.action), kind: a.provenance === "DETERMINISTIC" ? "Rule-backed agent action" : a.provenance === "HUMAN" ? "Human decision" : "AI recommendation", status: text(a.status), time: text(a.occurred_at), actor: text(a.agent), tool: text(a.tool), evidence: refs(a.evidence_references) }));
  const decisions = list(s.human_decisions).map(d => ({ id: text(d.id), title: `${text(d.stage)} · ${text(d.decision)}`, kind: "Human decision", status: text(d.decision), time: text(d.occurred_at), actor: text(d.actor), tool: "", evidence: refs(d.evidence) }));
  const report = list(s.validation_reports).at(-1);
  const checks = list(report?.checks).map(c => ({ id: text(c.id), title: text(c.label), kind: "Deterministic verification", status: text(c.status), time: text(report?.created_at), actor: "Validation rules", tool: "", evidence: refs(c.evidence) }));
  const fpu = object(object(s.onboarding).fpu);
  checks.push(...list(fpu.checks).map(c => ({ id: text(c.id), title: text(c.id).replaceAll("_", " "), kind: "Deterministic verification", status: c.passed === true ? "VERIFIED" : "BLOCKED", time: text(fpu.verified_at), actor: "First productive use rules", tool: "", evidence: refs(c.evidence) })));
  const blockers = [
    ...list(object(s.discovery).findings).filter(f => f.category === "BLOCKER").map(f => `Discovery finding: ${text(f.title)}`),
    ...list(object(s.execution).failures).filter(f => f.resolved !== true).map(f => `${text(f.code)}: ${text(f.summary)}`),
    ...list(object(s.execution).resolutions).filter(r => r.state === "ESCALATED").map(r => `Escalation: ${text(r.escalation_rule)}`),
    ...checks.filter(c => c.status === "BLOCKED").map(c => `Check blocked: ${c.title}`),
    ...list(object(s.configuration).proposals).filter(p => ["REJECTED", "BLOCKED", "REVIEW_REQUIRED"].includes(text(p.state))).map(p => `Configuration ${text(p.state)}: ${text(p.label)}`),
    ...list(object(s.onboarding).tasks).filter(t => t.status !== "COMPLETED").map(t => `Onboarding ${text(t.status)}: ${text(t.label)}`),
  ];
  const events = list(s.events).map(e => ({ id: text(e.id), title: text(e.name).replaceAll("_", " "), kind: "Lifecycle audit reference", status: "Recorded", time: text(e.occurred_at), actor: "Workflow", tool: "", evidence: [] }));
  return { id: expectedId, status, phase, sourceKind: s.source_kind === "user_upload" ? "User-provided data · synthetic target" : "Synthetic sample · synthetic target", activity, decisions, checks, blockers, events };
}

export function useSessionView() {
  const [view, setView] = useState<SessionView>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function read() {
      setLoading(true); setView(undefined); setError("");
      try {
        const id = new URLSearchParams(window.location.search).get("session") ?? sessionStorage.getItem("movebooks-migration-session");
        if (!id) return;
        if (!isSessionId(id)) throw new Error("Invalid session reference. Start or open a synthetic session from Product.");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/v1/migration-sessions/${id}/intake-trust`, { headers: { Authorization: "Bearer demo-user" }, signal: controller.signal });
        if (!response.ok) throw new Error(response.status === 404 ? "Session unavailable or expired. No replacement session was created." : "Session could not be read. Check local demo access and the API, then refresh.");
        const projection = projectSession(await response.json(), id);
        if (active) setView(projection);
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Session unavailable."); }
      finally { if (active) setLoading(false); }
    }
    void read();
    return () => { active = false; controller.abort(); };
  }, [revision]);
  return { view, error, loading, refresh: () => setRevision(x => x + 1) };
}
