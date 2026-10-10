"use client";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  FileSearch,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/feedback";
import { Badge, Button, Card, Link, Panel } from "@/components/ui/primitives";
import { PhaseProgress, TaskContext } from "@/components/journey/PhaseProgress";
import { ActionLink } from "@/components/journey/NextAction";
import { journeyPosition, pendingMappingsIn, PROCESSING, projectJourney, type JourneyEvidence } from "@/components/journey/journey";
import { StatusBadge } from "@/components/ui/status";

import type {
  AgentActivity,
  AssessmentResult,
  DiscoveryResult,
  Finding,
  FindingCategory,
  ReadinessStatus,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
import { authHeaders } from "@/lib/identity";
import { ASSESSMENT_UNREACHABLE, changes, reach, UNCONFIRMED } from "@/lib/reach";

type Phase = "select" | "discovering" | "assessing" | "complete" | "error";
/** One explicit "start an assessment" action. Its key makes retries return the same migration. */
type CreationIntent = { key: string; sample: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await reach(`${API_BASE}${path}`, {
    ...init,
    headers: { ...await authHeaders(), "Content-Type": "application/json", ...init?.headers },
  }, ASSESSMENT_UNREACHABLE);
  // A change whose response failed may still have happened on the server.
  if (changes(init) && response.status >= 500) throw new Error(UNCONFIRMED);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** Starts a read or assessment run. Only the latest may change what is shown, selected, stored
 *  or in the address; a superseded response is dropped silently and its request aborted, so an
 *  old migration can never replace the one the user just chose. */
function begin(latest: RefObject<number>, inflight: RefObject<AbortController | null>) {
  inflight.current?.abort();
  const controller = new AbortController();
  inflight.current = controller;
  const token = ++latest.current;
  return { signal: controller.signal, current: () => token === latest.current };
}

function findingStatus(category: FindingCategory): ReadinessStatus {
  if (category === "BLOCKER") return "BLOCKED";
  if (category === "WARNING") return "NEEDS ATTENTION";
  return "READY";
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** One plain-language sentence for the assessment result. Derived only from the deterministic counts. */
function outcomeFor(company: string, assessment: AssessmentResult) {
  if (assessment.blocker_count > 0) return `${company} has ${count(assessment.blocker_count, "blocker")} to fix before migration.`;
  if (assessment.warning_count > 0) return `${company} can move forward. ${count(assessment.warning_count, "item")} ${assessment.warning_count === 1 ? "needs" : "need"} your review first.`;
  return `${company} is ready to plan its migration.`;
}

export function DiscoverAssessExperience() {
  const [phase, setPhase] = useState<Phase>("select");
  const [sessionId, setSessionId] = useState<string>();
  // Reading a migration named in the address; "none" when there is no such migration.
  const [reading, setReading] = useState<"none" | "loading" | "failed">("none");
  const [discovery, setDiscovery] = useState<DiscoveryResult>();
  const [assessment, setAssessment] = useState<AssessmentResult>();
  // The authoritative journey evidence for the migration on screen.
  const [evidence, setEvidence] = useState<JourneyEvidence>();
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [error, setError] = useState<string>();
  const [sample, setSample] = useState("northstar-supplies");

  // Every read or assessment run starts a new operation (see begin). Unmounting supersedes them all.
  const latest = useRef(0);
  const inflight = useRef<AbortController | null>(null);
  // The assessment the user started whose migration has not been adopted yet.
  const creating = useRef<CreationIntent | null>(null);
  useEffect(() => () => { latest.current += 1; inflight.current?.abort(); }, []);

  const loadExisting = (saved: string) => {
    const op = begin(latest, inflight);
    setError(undefined);
    setReading("loading");
    void api<{id: string; sample_company_id: string; workflow_status?: string; discovery?: DiscoveryResult; assessment?: AssessmentResult; mappings?: { state: string }[]; activity: AgentActivity[]}>(`/v1/migration-sessions/${saved}`, { signal: op.signal }).then(data => {
      if (!op.current()) return;
      setSessionId(data.id); setDiscovery(data.discovery); setAssessment(data.assessment);
      // Keep the fetched workflow status: a migration that has moved on must not read as just assessed.
      setEvidence({
        status: data.workflow_status ?? (data.assessment ? "ASSESSED" : data.discovery ? "DISCOVERED" : "CREATED"),
        mappingIssues: pendingMappingsIn(data.mappings),
        readinessIssues: data.assessment?.blocker_count ?? 0,
      });
      sessionStorage.setItem("movebooks-migration-session", data.id);
      if (["northstar-supplies", "harbor-light-migrate-demo"].includes(data.sample_company_id)) setSample(data.sample_company_id);
      setActivity(data.activity); setPhase(data.assessment ? "complete" : "select");
      setReading("none");
    }).catch(caught => { if (!op.current()) return; setError(caught.message); setPhase("error"); setReading("failed"); });
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const saved = query.get("session");
    if (!saved && query.get("sample") === "harbor-light-migrate-demo") setSample("harbor-light-migrate-demo");
    if (!saved) return;
    loadExisting(saved);
  }, []);

  // Discovery and assessment return the stored result when they have already run,
  // so finishing an unfinished check never repeats or replaces earlier work.
  type Operation = ReturnType<typeof begin>;
  const assess = async (id: string, op: Operation) => {
    setPhase("discovering");
    const discovered = await api<DiscoveryResult>(
      `/v1/migration-sessions/${id}/discovery`,
      { method: "POST", signal: op.signal },
    );
    if (!op.current()) return;
    setDiscovery(discovered);
    setPhase("assessing");
    const assessed = await api<AssessmentResult>(
      `/v1/migration-sessions/${id}/assessment`,
      { method: "POST", signal: op.signal },
    );
    if (!op.current()) return;
    setAssessment(assessed);
    setEvidence({ status: "ASSESSED", readinessIssues: assessed.blocker_count });
    // The assessment is done; the activity record is secondary evidence, not assessing work.
    setPhase("complete");
    const recorded = await api<AgentActivity[]>(`/v1/migration-sessions/${id}/activity`, { signal: op.signal }).catch(() => [] as AgentActivity[]);
    if (op.current()) setActivity(recorded);
  };

  const failed = (caught: unknown, op: Operation) => {
    // A superseded operation is not a failure the user needs to see.
    if (!op.current()) return;
    setError(caught instanceof Error ? caught.message : "The assessment could not be completed.");
    setPhase("error");
  };

  // Creating a migration is always this explicit action; it never happens on resume.
  // Each explicit start is a new intent with a new key.
  const startAssessment = () => create({ key: crypto.randomUUID(), sample });

  // Creates (or, on retry, recovers) the migration for one intent. A retry after a lost
  // response returns the migration the server already created; it never creates another
  // and never falls back to the migration that was open before.
  const create = async (intent: CreationIntent) => {
    const op = begin(latest, inflight);
    creating.current = intent;
    setError(undefined);
    setEvidence(undefined);
    // A new assessment is a different migration: never show or offer the previous one while it runs.
    setSessionId(undefined); setReading("none");
    setDiscovery(undefined); setAssessment(undefined); setActivity([]);
    window.history.replaceState(null, "", window.location.pathname);
    try {
      setPhase("discovering");
      const session = await api<{ id: string }>("/v1/migration-sessions", {
        method: "POST",
        headers: { "Idempotency-Key": intent.key },
        body: JSON.stringify({ sample_company_id: intent.sample }),
        signal: op.signal,
      });
      if (!op.current()) return;
      // Adopted: this start is complete, and the next start is a new assessment.
      creating.current = null;
      setSessionId(session.id);
      setEvidence({ status: "CREATED" });
      sessionStorage.setItem("movebooks-migration-session", session.id);
      window.history.replaceState(null, "", `?session=${encodeURIComponent(session.id)}`);
      await assess(session.id, op);
    } catch (caught) { failed(caught, op); }
  };

  // Try Again continues what failed: an unconfirmed start is retried with the same intent;
  // otherwise the migration in the address is read again.
  const retry = () => {
    if (creating.current) { void create(creating.current); return; }
    const saved = new URLSearchParams(window.location.search).get("session");
    if (saved) loadExisting(saved);
  };

  // Continue the same migration (CREATED or DISCOVERED): no new session is created.
  const resumeAssessment = async () => {
    if (!sessionId) return;
    const op = begin(latest, inflight);
    setError(undefined);
    try { await assess(sessionId, op); } catch (caught) { failed(caught, op); }
  };

  // Diagnostic event only. It never blocks or delays the navigation to planning.
  const recordPlanSelection = () => {
    if (!sessionId) return;
    sessionStorage.setItem("movebooks-migration-session", sessionId);
    void api(`/v1/migration-sessions/${sessionId}/events`, {
      method: "POST",
      keepalive: true,
      body: JSON.stringify({
        name: "continue_to_plan_selected",
        attributes: { readiness: assessment?.readiness ?? "unknown" },
      }),
    }).catch(() => undefined);
  };

  const running = phase === "discovering" || phase === "assessing";
  const projection = evidence ? projectJourney(evidence) : undefined;
  const pastAssessment = evidence && !["CREATED", "DISCOVERED", "ASSESSED"].includes(evidence.status);
  const resumable = !!sessionId && !assessment && !running;
  const blockers = discovery?.findings.filter((item) => item.category === "BLOCKER") ?? [];
  const warnings = discovery?.findings.filter((item) => item.category === "WARNING") ?? [];
  const issues = [...blockers, ...warnings];

  const sourcePicker = (
<section aria-labelledby="sample-heading" className={assessment || resumable ? "mt-14" : "mt-8"}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="sample-heading" className="type-section">{assessment || resumable ? "Check Another Business" : "Choose How to Check Your Books"}</h2>
            <p className="mt-2 text-secondary">MoveBooks never connects to your accounting provider. Use a sample business or a de-identified test export.</p>
          </div>
        </div>
        {discovery?.synthetic === false && <Alert tone="info" title="Current Workspace: Your Test Export"><p>The results above come from your test export, not the sample selector. Starting a sample creates a separate workspace.</p></Alert>}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Card className="assessment-source-card border-[var(--primary)]" aria-label="Synthetic business selection">
            <div className="flex items-start justify-between gap-4">
              <div className="metric-icon"><Database aria-hidden="true" size={18} /></div>
              <Badge>Synthetic Data Only</Badge>
            </div>
            <h3 className="mt-3 text-xl font-bold">Try a Sample Business</h3>
            <label className="mt-4 block font-bold">Sample business
              <select className="field-control mt-2 block w-full" value={sample} disabled={running} onChange={event => setSample(event.target.value)}>
                <option value="northstar-supplies">Northstar Supplies — Needs Attention</option>
                <option value="harbor-light-migrate-demo">Harbor Light Books — Ready to Migrate</option>
              </select>
            </label>
            <Button className="mt-6" variant={assessment || sessionId || reading !== "none" ? "secondary" : "primary"} onClick={startAssessment} disabled={running}>
              {assessment || sessionId ? "Start a New Assessment" : "Check If My Books Are Ready to Migrate"}
              <ArrowRight aria-hidden="true" size={17} />
            </Button>
            <p className="mt-2 text-sm leading-6 text-secondary">
              {sample === "northstar-supplies" ? "A deliberately imperfect office-supply distributor with duplicates, a missing value, an invalid relationship, and an unsupported setting." : "One synthetic business from discovery to verified first use. You approve key decisions; a controlled migration exception demonstrates safe recovery."}
            </p>

          </Card>
          <Card aria-label="Use My Test Export">
            <div className="flex items-start justify-between gap-4">
              <div className="metric-icon"><Upload aria-hidden="true" size={18} /></div>
              <Badge>De-Identified Test Data Only</Badge>
            </div>
            <h3 className="mt-3 text-xl font-bold">Use My Test Export</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Use supported de-identified accounting files to test the migration flow.
            </p>
            <Link className="button secondary mt-6" href="/try-your-data">Choose Test Files</Link>
          </Card>
        </div>
      </section>
  );

  return (
    // Company and record names come from the user's files and can be 200 unbroken characters:
    // wrap them anywhere (as Plan does) rather than widen or hide.
    <main className="shell migration-task min-h-[75vh]">
      <header>
        <div className="max-w-3xl">
          <p className="eyebrow text-primary">Understand</p>
          <h1 className="type-page mt-4">Understand Your Books</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
            See what can move, what needs attention, and what to address before migration.
          </p>
        </div>
      </header>

      <TaskContext phase={0} session={sessionId} />
      <p className="mt-2 text-secondary">Synthetic Beta · no real customer or production provider data.</p>
      <PhaseProgress
        session={sessionId} status={evidence?.status}
        current={journeyPosition({ selected: reading !== "none" || Boolean(sessionId), loading: reading === "loading", failed: reading === "failed", step: projection?.current ?? 0 })}
        held={projection?.held}
        currentLabel={projection?.currentLabel}
        unknown={reading === "loading" ? "loading" : "unavailable"}
        processing={running ? { ...PROCESSING.assess, stage: phase === "assessing" ? 1 : 0 } : undefined}
      />

      {assessment && discovery && (
        <>
          {/* 1. Outcome and 2. readiness */}
          <section className="mt-4 motion-enter" aria-labelledby="readiness-heading">
            <Panel className="assessment-summary task-outcome">
              <p className="eyebrow text-primary">Are Your Books Ready to Migrate?</p>
              <h2 id="readiness-heading" className="type-section mt-2">Migration Readiness</h2>
              <p className="mt-2 max-w-3xl leading-6">{outcomeFor(discovery.company_name, assessment)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-5">
                <StatusBadge status={assessment.readiness} />
                <div><p className="type-financial">{assessment.blocker_count}</p><p className="type-meta">blockers</p></div>
                <div><p className="type-financial">{assessment.warning_count}</p><p className="type-meta">warnings</p></div>
              </div>
              <ActionLink className="mt-4" label={pastAssessment ? "Return to My Migration" : assessment.blocker_count ? `Review ${count(assessment.blocker_count, "Readiness Issue")}` : "Create My Migration Plan"} href={`${pastAssessment ? "/workspace" : "/plan-map-approve"}?session=${sessionId}`} onClick={recordPlanSelection} />
              <p className="mt-3 text-secondary">Source: {discovery.synthetic ? "synthetic sample" : "de-identified test export"} · {discovery.fixture_version}. {discovery.profiles.length} datasets · {discovery.profiles.reduce((total, profile) => total + profile.record_count, 0)} records profiled. Full dataset counts in technical evidence.</p>
              <p className="mt-2 text-secondary">Deterministic assessment · Policy {assessment.policy_version}</p>
              <p className="mt-3 text-secondary">{assessment.blocker_count ? "Planning preserves these blockers; migration cannot start until source data is corrected." : "This assessment does not move data or approve a plan."}</p>

            </Panel>
          </section>

          {/* 3. Blockers and items to review */}
          {issues.length > 0 && (
            <section id="readiness-issues" className="mt-8 scroll-mt-8" aria-labelledby="issues-heading">
              <h2 id="issues-heading" className="type-section">What Needs Attention</h2>
              <ul className="mt-4 grid gap-3">
                {issues.map((finding) => (
                  <li key={finding.id}>
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="type-card">{finding.title}</h3>
                        <StatusBadge status={findingStatus(finding.category)} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-secondary"><strong className="text-[var(--foreground)]">What to do: </strong>{finding.recommended_action}</p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Technical evidence comes second, behind native disclosure. */}
          <details className="evidence-disclosure mt-10">
            <summary>Show technical evidence</summary>
            <div className="grid gap-12 pt-6">
              <section aria-labelledby="basis-heading">
                <p className="eyebrow text-primary">Assessment Agent</p>
                <h2 id="basis-heading" className="type-section mt-2">Why this result</h2>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <ul className="grid gap-2 text-sm leading-6 text-secondary">{assessment.decision_basis.map((item) => <li key={item}>• {item}</li>)}</ul>
                  <div><h3 className="font-bold">Recommended next actions</h3><ol className="mt-3 grid gap-2 text-sm leading-6 text-secondary">{assessment.recommended_next_actions.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol></div>
                </div>
                <div className="mt-6 grid gap-4 border-t border-token pt-6 md:grid-cols-3">
                  <div><h3 className="font-bold text-[var(--success)]">Ready</h3><p className="mt-2 text-sm leading-6 text-secondary">{assessment.ready_areas.length ? assessment.ready_areas.join(", ") : "No area is clear of findings yet."}</p></div>
                  <div><h3 className="font-bold text-[var(--warning)]">Needs attention</h3><p className="mt-2 text-sm leading-6 text-secondary">{warnings.map((item) => item.title).join(", ") || "No warnings."}</p></div>
                  <div><h3 className="font-bold text-[var(--error)]">Blocked</h3><p className="mt-2 text-sm leading-6 text-secondary">{blockers.map((item) => item.title).join(", ") || "No blockers."}</p></div>
                </div>
                <p className="mt-6 type-meta">Policy: {assessment.policy_version} · No AI confidence score</p>
              </section>

              <section aria-labelledby="profiles-heading">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow text-primary">Discovery Agent</p>
                    <h2 id="profiles-heading" className="type-section mt-2">What we found</h2>
                    <p className="mt-2 text-secondary">Profiles are facts from declared checks, not generated interpretations.</p>
                  </div>
                  <Badge>{discovery.fixture_version}</Badge>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {discovery.profiles.map((profile) => (
                    <Card key={profile.dataset}>
                      <div className="flex items-start justify-between gap-3">
                        <FileSearch aria-hidden="true" className="text-primary" size={20} />
                        <StatusBadge status={profile.status} />
                      </div>
                      <h3 className="mt-5 font-bold">{profile.label}</h3>
                      <p className="mt-1 type-financial">{profile.record_count}</p>
                      <p className="type-meta">records profiled</p>
                      <dl className="mt-4 grid gap-2 text-xs text-secondary">
                        <div className="flex justify-between gap-3"><dt>Missing values</dt><dd>{Object.values(profile.missing_values).reduce((sum, value) => sum + value, 0)}</dd></div>
                        <div className="flex justify-between gap-3"><dt>Duplicate candidates</dt><dd>{profile.duplicate_candidates}</dd></div>
                        <div className="flex justify-between gap-3"><dt>Relationship issues</dt><dd>{profile.referential_integrity_issues}</dd></div>
                        <div className="flex justify-between gap-3"><dt>Unsupported settings</dt><dd>{profile.unsupported_items}</dd></div>
                      </dl>
                    </Card>
                  ))}
                </div>
              </section>

              <section aria-labelledby="findings-heading">
                <p className="eyebrow text-primary">Evidence-backed findings</p>
                <h2 id="findings-heading" className="type-section mt-2">What needs attention—and why</h2>
                <div className="mt-5 grid gap-4">
                  {discovery.findings.map((finding: Finding) => (
                    <Card key={finding.id} className="finding-card">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="type-meta">{finding.rule_code} · {humanize(finding.affected_entity)}</p>
                          <h3 className="mt-1 type-card">{finding.title}</h3>
                        </div>
                        <StatusBadge status={findingStatus(finding.category)} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-secondary">{finding.explanation}</p>
                      <div className="mt-4 grid gap-3 border-t border-token pt-4 text-sm md:grid-cols-2">
                        <div><strong>Evidence</strong><p className="mt-1 text-secondary">{finding.evidence.at(-1)}</p></div>
                        <div><strong>Next action</strong><p className="mt-1 text-secondary">{finding.recommended_action}</p></div>
                      </div>
                      <p className="mt-4 type-meta">Deterministic · {humanize(finding.tool)} · {finding.customer_action_required ? "Customer review needed" : "No action needed"}</p>
                    </Card>
                  ))}
                </div>
              </section>

              {activity.length > 0 && (
                <section aria-labelledby="activity-heading">
                  <div className="flex items-center gap-3">
                    <div className="activity-icon"><Bot aria-hidden="true" size={18} /></div>
                    <div><p className="eyebrow text-primary">Agent operations</p><h2 id="activity-heading" className="type-section mt-1">Activity and evidence</h2></div>
                  </div>
                  <Panel className="mt-5">
                    <ul>
                      {activity.map((item) => (
                        <li className="activity-item" key={item.id}>
                          <div className="activity-icon"><CheckCircle2 aria-hidden="true" size={17} /></div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{item.action}</strong><Badge>{humanize(item.risk)} risk</Badge></div>
                            <p className="mt-1 text-xs text-secondary">{humanize(item.agent)} used {humanize(item.tool)} · {item.provenance}</p>
                            <p className="mt-1 truncate text-sm">Evidence: {item.evidence_references.join(", ")}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </section>
              )}
            </div>
          </details>
        </>
      )}

      {resumable && (
        <section className="panel mt-10 p-6" aria-labelledby="resume-heading">
          <p className="eyebrow text-primary">Next step</p>
          <h2 id="resume-heading" className="type-section mt-2">Finish Checking If Your Books Are Ready</h2>
          <p className="mt-2 max-w-2xl leading-7 text-secondary">This migration has started, but its readiness check is not finished. Continue with the same migration; nothing new is created.</p>
          <Button className="mt-4" onClick={resumeAssessment}>
            Continue This Assessment
            <ArrowRight aria-hidden="true" size={17} />
          </Button>
        </section>
      )}

      {(assessment || resumable || reading !== "none") && !running ? <details className="mt-6"><summary>Check another business · starts a separate assessment</summary>{sourcePicker}</details> : reading === "none" && !running ? sourcePicker : null}

      {error && (
        <div className="mt-8" role={error === UNCONFIRMED ? "alert" : undefined}>
          <Alert tone={error === UNCONFIRMED ? "warning" : "error"} title={error === UNCONFIRMED ? "We Couldn't Confirm This Step" : "Assessment Stopped"}>
            <p className="mt-1">{error}</p>
            {error === UNCONFIRMED && <p className="mt-2">Trying again is safe: it continues the same assessment and never starts a second one.</p>}
            <Button className="mt-3" size="small" variant="secondary" onClick={retry}>Try Again</Button>
          </Alert>
        </div>
      )}

      <footer className="mt-14 flex items-start gap-3 border-t border-token py-8 text-sm text-secondary">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={20} />
        <p>This synthetic Beta never connects to an accounting provider. Sample businesses are synthetic, test exports must be de-identified, and every migration result stays in a synthetic workspace. No data is sent to an AI model.</p>
      </footer>
    </main>
  );
}
