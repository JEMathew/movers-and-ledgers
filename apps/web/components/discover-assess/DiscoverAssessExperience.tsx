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
import { useEffect, useState } from "react";

import { Alert, LoadingState } from "@/components/ui/feedback";
import { Badge, Button, Card, Link, Panel } from "@/components/ui/primitives";
import { MigrationJourney } from "@/components/journey/MigrationJourney";
import { NextAction } from "@/components/journey/NextAction";
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

type Phase = "select" | "discovering" | "assessing" | "complete" | "error";

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
  if (assessment.blocker_count > 0) return `${company} has ${count(assessment.blocker_count, "readiness blocker")} to resolve before anything moves.`;
  if (assessment.warning_count > 0) return `${company} can move forward. ${count(assessment.warning_count, "item")} ${assessment.warning_count === 1 ? "needs" : "need"} your review first.`;
  return `${company} is ready to plan its migration.`;
}

export function DiscoverAssessExperience() {
  const [phase, setPhase] = useState<Phase>("select");
  const [sessionId, setSessionId] = useState<string>();
  const [discovery, setDiscovery] = useState<DiscoveryResult>();
  const [assessment, setAssessment] = useState<AssessmentResult>();
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [error, setError] = useState<string>();
  const [sample, setSample] = useState("northstar-supplies");

  const loadExisting = (saved: string) => {
    setError(undefined);
    void api<{id: string; sample_company_id: string; discovery?: DiscoveryResult; assessment?: AssessmentResult; activity: AgentActivity[]}>(`/v1/migration-sessions/${saved}`).then(data => {
      setSessionId(data.id); setDiscovery(data.discovery); setAssessment(data.assessment);
      if (["northstar-supplies", "harbor-light-migrate-demo"].includes(data.sample_company_id)) setSample(data.sample_company_id);
      setActivity(data.activity); setPhase(data.assessment ? "complete" : "select");
    }).catch(caught => { setError(caught.message); setPhase("error"); });
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const saved = query.get("session");
    if (!saved && query.get("sample") === "harbor-light-migrate-demo") setSample("harbor-light-migrate-demo");
    if (!saved) return;
    loadExisting(saved);
  }, []);

  const startAssessment = async () => {
    setError(undefined);
    try {
      setPhase("discovering");
      const session = await api<{ id: string }>("/v1/migration-sessions", {
        method: "POST",
        body: JSON.stringify({ sample_company_id: sample }),
      });
      setSessionId(session.id);
      sessionStorage.setItem("movebooks-migration-session", session.id);
      window.history.replaceState(null, "", `?session=${encodeURIComponent(session.id)}`);
      const discovered = await api<DiscoveryResult>(
        `/v1/migration-sessions/${session.id}/discovery`,
        { method: "POST" },
      );
      setDiscovery(discovered);
      setPhase("assessing");
      const assessed = await api<AssessmentResult>(
        `/v1/migration-sessions/${session.id}/assessment`,
        { method: "POST" },
      );
      setAssessment(assessed);
      setActivity(
        await api<AgentActivity[]>(`/v1/migration-sessions/${session.id}/activity`),
      );
      setPhase("complete");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The assessment could not be completed.");
      setPhase("error");
    }
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
  const blockers = discovery?.findings.filter((item) => item.category === "BLOCKER") ?? [];
  const warnings = discovery?.findings.filter((item) => item.category === "WARNING") ?? [];
  const issues = [...blockers, ...warnings];

  return (
    <main className="shell min-h-[75vh] py-12 sm:py-16">
      <header className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <p className="eyebrow text-primary">Assess</p>
          <h1 className="type-page mt-4">Assess My Migration</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
            Find out what can move, what needs attention and what to do next—before any plan,
            mapping or target write exists.
          </p>
        </div>
        <div className="migration-orb" aria-hidden="true">
          <span />
        </div>
      </header>

      <MigrationJourney className="mt-10" current={assessment ? 1 : 0} />

      {assessment && discovery && (
        <>
          {/* 1. Outcome and 2. readiness */}
          <section className="mt-10 motion-enter" aria-labelledby="readiness-heading">
            <Panel className="assessment-summary">
              <p className="eyebrow text-primary">Your readiness result</p>
              <h2 id="readiness-heading" className="type-section mt-2">Migration readiness</h2>
              <p className="mt-3 max-w-3xl text-xl leading-8">{outcomeFor(discovery.company_name, assessment)}</p>
              <div className="mt-6 flex flex-wrap items-center gap-8">
                <StatusBadge status={assessment.readiness} />
                <div><p className="type-financial">{assessment.blocker_count}</p><p className="type-meta">blockers</p></div>
                <div><p className="type-financial">{assessment.warning_count}</p><p className="type-meta">warnings</p></div>
              </div>
            </Panel>
          </section>

          {/* 3. Blockers and items to review */}
          {issues.length > 0 && (
            <section id="readiness-issues" className="mt-8 scroll-mt-8" aria-labelledby="issues-heading">
              <h2 id="issues-heading" className="type-section">What needs attention</h2>
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

          {/* 4. Next recommended action */}
          <NextAction
            className="mt-8"
            label={blockers.length ? `Resolve ${count(blockers.length, "readiness issue")}` : "Create my migration plan"}
            href={`/plan-map-approve?session=${sessionId}`}
            onClick={recordPlanSelection}
          >
            <p>{blockers.length ? "Planning keeps every issue visible and holds migration until each blocker is resolved." : "Next, the plan sequences your records and proposes mappings for you to approve."}</p>
            <p className="mt-1 text-sm">No mapping, target write or approval has happened yet.</p>
          </NextAction>

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
                            <p className="mt-1 truncate type-meta">Evidence: {item.evidence_references.join(", ")}</p>
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

      <section aria-labelledby="sample-heading" className={assessment ? "mt-14" : "mt-8"}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="sample-heading" className="type-section">{assessment ? "Assess another source" : "Choose a safe source"}</h2>
            <p className="mt-2 text-secondary">No provider connection. Use samples or controlled, de-identified test exports only.</p>
          </div>
          {running && <LoadingState label={phase === "discovering" ? "Discovering source data" : "Calculating readiness"} />}
        </div>
        {discovery?.synthetic === false && <Alert tone="info" title="Current workspace: user-provided source"><p>The evidence above belongs to your uploaded package, not the sample selector. Target operations remain synthetic. Starting a new sample creates a separate workspace.</p></Alert>}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Card className="assessment-source-card border-[var(--primary)]" aria-label="Synthetic business selection">
            <div className="flex items-start justify-between gap-4">
              <div className="metric-icon"><Database aria-hidden="true" size={18} /></div>
              <Badge>{discovery?.synthetic === false ? "Optional new sample workspace" : "Synthetic sample company · selected"}</Badge>
            </div>
            <label className="mt-8 block font-bold">Synthetic business
              <select className="field-control mt-2 block w-full" value={sample} disabled={running} onChange={event => setSample(event.target.value)}>
                <option value="northstar-supplies">Northstar Supplies — readiness blockers</option>
                <option value="harbor-light-migrate-demo">Harbor Light Books — complete governed journey</option>
              </select>
            </label>
            <p className="mt-2 text-sm leading-6 text-secondary">
              {sample === "northstar-supplies" ? "A deliberately imperfect office-supply distributor with duplicates, a missing value, an invalid relationship, and an unsupported setting." : "One synthetic business from discovery to verified first use. You approve key decisions; a controlled migration exception demonstrates safe recovery."}
            </p>
            <Button className="mt-6" variant={assessment ? "secondary" : "primary"} onClick={startAssessment} disabled={running}>
              {phase === "complete" ? "Start a new assessment" : "Assess this migration"}
              <ArrowRight aria-hidden="true" size={17} />
            </Button>
          </Card>
          <Card aria-label="Try Your Data entry">
            <div className="flex items-start justify-between gap-4">
              <div className="metric-icon"><Upload aria-hidden="true" size={18} /></div>
              <Badge>Controlled package · Local Beta</Badge>
            </div>
            <h3 className="mt-8 text-xl font-bold">Upload your data</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Validate a supported de-identified CSV/JSON package before creating a governed workspace.
              No live provider connection or production storage is available.
            </p>
            <Link className="button secondary mt-6" href="/try-your-data">Try Your Data</Link>
          </Card>
        </div>
      </section>

      {error && (
        <div className="mt-8">
          <Alert tone="error" title="Assessment stopped">
            <p className="mt-1">{error}</p>
            <Button className="mt-3" size="small" variant="secondary" onClick={() => {
              const saved = new URLSearchParams(window.location.search).get("session");
              if (saved) loadExisting(saved); else void startAssessment();
            }}>Try again</Button>
          </Alert>
        </div>
      )}

      <footer className="mt-14 flex items-start gap-3 border-t border-token py-8 text-sm text-secondary">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={20} />
        <p>This independent local Beta uses ephemeral demo storage. Uploaded records are user-provided; sample records and all target operations remain synthetic. It does not connect to any accounting provider. No data is sent to an LLM.</p>
      </footer>
    </main>
  );
}
