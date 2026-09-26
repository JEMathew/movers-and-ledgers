"use client";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  FileSearch,
  LockKeyhole,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { Alert, LoadingState } from "@/components/ui/feedback";
import { Badge, Button, Card, Panel } from "@/components/ui/primitives";
import { Stepper } from "@/components/ui/navigation";
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
const AUTH_HEADERS = {
  Authorization: "Bearer demo-user",
  "Content-Type": "application/json",
};

type Phase = "select" | "discovering" | "assessing" | "complete" | "error";

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

function findingStatus(category: FindingCategory): ReadinessStatus {
  if (category === "BLOCKER") return "BLOCKED";
  if (category === "WARNING") return "NEEDS ATTENTION";
  return "READY";
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function DiscoverAssessExperience() {
  const [phase, setPhase] = useState<Phase>("select");
  const [sessionId, setSessionId] = useState<string>();
  const [discovery, setDiscovery] = useState<DiscoveryResult>();
  const [assessment, setAssessment] = useState<AssessmentResult>();
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [error, setError] = useState<string>();
  const [planningNotice, setPlanningNotice] = useState(false);

  const startAssessment = async () => {
    setError(undefined);
    setPlanningNotice(false);
    try {
      setPhase("discovering");
      const session = await api<{ id: string }>("/v1/migration-sessions", {
        method: "POST",
        body: JSON.stringify({ sample_company_id: "northstar-supplies" }),
      });
      setSessionId(session.id);
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

  const continueToPlanning = async () => {
    setPlanningNotice(true);
    if (!sessionId) return;
    try {
      await api(`/v1/migration-sessions/${sessionId}/events`, {
        method: "POST",
        body: JSON.stringify({
          name: "continue_to_plan_selected",
          attributes: { readiness: assessment?.readiness ?? "unknown" },
        }),
      });
    } catch {
      // This diagnostic event must never prevent the user from seeing the future-state explanation.
    }
  };

  const running = phase === "discovering" || phase === "assessing";
  const activeStep = phase === "select" || phase === "error" ? 0 : phase === "discovering" ? 1 : 2;

  return (
    <main className="shell min-h-[75vh] py-12 sm:py-16">
      <header className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <p className="eyebrow text-primary">Discover → Assess</p>
          <h1 className="type-page mt-4">Assess My Migration</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
            See what is in a synthetic accounting source, what needs attention, and why—before any
            plan, mapping, or target write exists.
          </p>
        </div>
        <div className="migration-orb" aria-hidden="true">
          <span />
        </div>
      </header>

      <div className="mt-10" aria-live="polite">
        <Stepper
          label="Assessment progress"
          current={activeStep}
          steps={[
            { label: "Choose a sample", description: activeStep === 0 ? "Current" : "Complete" },
            { label: "Discover the source", description: activeStep === 1 ? "Current" : activeStep > 1 ? "Complete" : "Next" },
            { label: "Assess readiness", description: activeStep === 2 ? "Current" : "Next" },
          ]}
        />
      </div>

      <section aria-labelledby="sample-heading" className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="sample-heading" className="type-section">Choose a safe source</h2>
            <p className="mt-2 text-secondary">No provider connection or real customer data is used.</p>
          </div>
          {running && <LoadingState label={phase === "discovering" ? "Discovering source data" : "Calculating readiness"} />}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Card className="assessment-source-card border-[var(--primary)]" aria-label="Northstar Supplies selected">
            <div className="flex items-start justify-between gap-4">
              <div className="metric-icon"><Database aria-hidden="true" size={18} /></div>
              <Badge>Synthetic sample company · selected</Badge>
            </div>
            <h3 className="mt-8 text-xl font-bold">Northstar Supplies</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              A deliberately imperfect office-supply distributor with duplicates, a missing value,
              an invalid relationship, and an unsupported setting.
            </p>
            <Button className="mt-6" onClick={startAssessment} disabled={running}>
              {phase === "complete" ? "Run assessment again" : "Assess this migration"}
              <ArrowRight aria-hidden="true" size={17} />
            </Button>
          </Card>
          <Card className="opacity-70" aria-label="Upload your data unavailable">
            <div className="flex items-start justify-between gap-4">
              <div className="metric-icon"><Upload aria-hidden="true" size={18} /></div>
              <Badge>Coming next</Badge>
            </div>
            <h3 className="mt-8 text-xl font-bold">Upload your data</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Private source uploads and live provider connections are intentionally outside this
              public-reference slice.
            </p>
            <Button className="mt-6" variant="secondary" disabled>Coming next</Button>
          </Card>
        </div>
      </section>

      {error && (
        <div className="mt-8">
          <Alert tone="error" title="Assessment stopped">
            <p className="mt-1">{error}</p>
            <Button className="mt-3" size="small" variant="secondary" onClick={startAssessment}>Try again</Button>
          </Alert>
        </div>
      )}

      {discovery && (
        <section className="mt-14 motion-enter" aria-labelledby="profiles-heading">
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
      )}

      {discovery && (
        <section className="mt-14" aria-labelledby="findings-heading">
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
      )}

      {assessment && (
        <section className="mt-14 motion-enter" aria-labelledby="readiness-heading">
          <Panel className="assessment-summary">
            <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
              <div>
                <p className="eyebrow text-primary">Assessment Agent</p>
                <h2 id="readiness-heading" className="type-section mt-2">Migration readiness</h2>
                <div className="mt-5"><StatusBadge status={assessment.readiness} /></div>
                <div className="mt-6 flex gap-8">
                  <div><p className="type-financial">{assessment.blocker_count}</p><p className="type-meta">blockers</p></div>
                  <div><p className="type-financial">{assessment.warning_count}</p><p className="type-meta">warnings</p></div>
                </div>
                <p className="mt-6 type-meta">Policy: {assessment.policy_version} · No AI confidence score</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div><h3 className="font-bold">Why this result</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-secondary">{assessment.decision_basis.map((item) => <li key={item}>• {item}</li>)}</ul></div>
                <div><h3 className="font-bold">Recommended next actions</h3><ol className="mt-3 grid gap-2 text-sm leading-6 text-secondary">{assessment.recommended_next_actions.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol></div>
              </div>
            </div>
            <div className="mt-8 grid gap-4 border-t border-token pt-6 md:grid-cols-3">
              <div>
                <h3 className="font-bold text-[var(--success)]">Ready</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{assessment.ready_areas.length ? assessment.ready_areas.join(", ") : "No area is clear of findings yet."}</p>
              </div>
              <div>
                <h3 className="font-bold text-[var(--warning)]">Needs attention</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{discovery?.findings.filter((item) => item.category === "WARNING").map((item) => item.title).join(", ") || "No warnings."}</p>
              </div>
              <div>
                <h3 className="font-bold text-[var(--error)]">Blocked</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{discovery?.findings.filter((item) => item.category === "BLOCKER").map((item) => item.title).join(", ") || "No blockers."}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-token pt-6">
              <div className="flex items-center gap-3 text-sm text-secondary"><LockKeyhole aria-hidden="true" className="text-primary" size={19} /><span>No mapping, target write, or approval was performed.</span></div>
              <Button onClick={continueToPlanning}>Continue to Planning <ArrowRight aria-hidden="true" size={17} /></Button>
            </div>
            {planningNotice && <div className="mt-5"><Alert tone="info" title="Planning is the next governed phase"><p className="mt-1">This release stops here. Resolve blockers first; Plan → Map &amp; Approve remains a future, human-governed capability.</p></Alert></div>}
          </Panel>
        </section>
      )}

      {activity.length > 0 && (
        <section className="mt-14" aria-labelledby="activity-heading">
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

      <footer className="mt-14 flex items-start gap-3 border-t border-token py-8 text-sm text-secondary">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={20} />
        <p>This independent public-reference experience uses synthetic data and ephemeral demo storage. It does not describe or connect to any accounting provider&apos;s internal systems.</p>
      </footer>
    </main>
  );
}
