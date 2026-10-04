import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscoverAssessExperience } from "@/components/discover-assess/DiscoverAssessExperience";
import { MigrateResolveExperience } from "@/components/migrate-resolve/MigrateResolveExperience";
import { MyMigration } from "@/components/MyMigration";
import { OnboardFpuExperience } from "@/components/onboard-fpu/OnboardFpuExperience";
import { PlanMapApproveExperience } from "@/components/plan-map-approve/PlanMapApproveExperience";
import { ValidateConfigureExperience } from "@/components/validate-configure/ValidateConfigureExperience";

const id = "55555555-5555-4555-8555-555555555555";
afterEach(() => { cleanup(); vi.restoreAllMocks(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); });

/** One migration's authoritative state. Each page reads it through its own endpoint, so the
 *  fixtures below mirror each backend projection rather than serving one shared blob. */
type State = { status: string; mappings: { state: string }[]; blockers: number; run: ReturnType<typeof run> | null };
/** The migration run as the session reports it. Its own status stays at the migration step even
 *  after the workflow has moved on, which every page must still read the same way. */
const run = (status: string) => ({
  id: "execution-1", version: "migration-execution-v1", status, manifest_version: "plan-v1", progress_percent: status === "MIGRATION_COMPLETE" ? 100 : 50,
  current_batch_id: null, current_agent: "migration_agent", safe_to_validate: status === "MIGRATION_COMPLETE", batches: [], failures: [], resolutions: [],
});
const findings = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `f${i}`, category: "BLOCKER", title: "Invoices reference a missing customer", recommended_action: "Correct it.", rule_code: "R1", affected_entity: "invoices", explanation: "", evidence: [], tool: "check", customer_action_required: true }));
// services/api discover_assess.service.mapping_review: only APPROVED or MODIFIED are reviewed.
const review = (s: State) => s.mappings.length ? { total: s.mappings.length, pending: s.mappings.filter(m => !["APPROVED", "MODIFIED"].includes(m.state)).length } : null;

/** GET /v1/migration-sessions/{id}: the full session (Assess, Plan, Migrate). */
const sessionRead = (s: State) => ({
  id, synthetic: true, company_name: "Harbor Light Books", sample_company_id: "harbor-light-migrate-demo", source_kind: "synthetic_sample",
  workflow_status: s.status, status: "CREATED", stage: "discover", plan: null, execution: s.run, mappings: s.mappings,
  discovery: { company_name: "Harbor Light Books", findings: findings(s.blockers), profiles: [], fixture_version: "v1", synthetic: true },
  assessment: { readiness: s.blockers ? "BLOCKED" : "READY", blocker_count: s.blockers, warning_count: 0, decision_basis: [], recommended_next_actions: [], ready_areas: [], policy_version: "p1" },
  activity: [], human_decisions: [], events: [], validation_reports: [],
});
/** GET .../intake-trust: the payload-free projection My Migration reads. */
const trustRead = (s: State) => ({
  id, workflow_status: s.status, source_kind: "synthetic_sample", synthetic: true, intake_status: null, mapping_review: review(s),
  activity: [], human_decisions: [], events: [], validation_reports: [],
  discovery: { findings: findings(s.blockers).map(() => ({ category: "BLOCKER", title: "Readiness blocker: review Assessment" })) },
  intake_activity: [], execution: { failures: [] }, configuration: { proposals: [] }, onboarding: { tasks: [], fpu: {} },
});
/** GET .../validation-configuration. */
const validationRead = (s: State) => ({
  session_id: id, company_name: "Harbor Light Books", workflow_status: s.status, mapping_review: review(s), readiness_blockers: s.blockers,
  report: null, configuration: null, activity: [], repairs: [], resolutions: [], ready_for_onboarding: false,
});
/** GET .../onboarding. */
const onboardingRead = (s: State) => ({
  session_id: id, company_name: "Harbor Light Books", workflow_status: s.status, effective_status: s.status, mapping_review: review(s), readiness_blockers: s.blockers,
  gate_error: null, tasks: [], onboarding: null, verified_fpu: false, ready: false, customers: [], products: [], settings: {}, accounting_impact: {}, activity: [],
});
function respond(state: State, url: string) {
  const path = new URL(url, "http://localhost").pathname;
  const body = path.endsWith("/intake-trust") ? trustRead(state)
    : path.endsWith("/validation-configuration") ? validationRead(state)
    : path.endsWith("/onboarding") ? onboardingRead(state)
    : path.endsWith(`/migration-sessions/${id}`) ? sessionRead(state)
    : path.endsWith("/activity") ? []
    : undefined;
  return Promise.resolve(body === undefined ? new Response("{}", { status: 404 }) : new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
}

const pages: [string, ComponentType][] = [
  ["My Migration", MyMigration], ["Assess", DiscoverAssessExperience], ["Plan", PlanMapApproveExperience],
  ["Migrate", MigrateResolveExperience], ["Validate", ValidateConfigureExperience], ["Start Using", OnboardFpuExperience],
];
const steps = () => within(screen.getByRole("list", { name: "Migration Journey" })).getAllByRole("listitem").map(step => step.textContent);
const reviewed = (n: number) => Array.from({ length: n }, () => ({ state: "APPROVED" }));
const open = (n: number) => Array.from({ length: n }, () => ({ state: "REVIEW_REQUIRED" }));
const state = (status: string, mappings: { state: string }[] = [], blockers = 0, execution: State["run"] = null): State => ({ status, mappings, blockers, run: execution });
const C = "Completed", N = "Not Started";
const labels = ["Assess", "Plan", "Map", "Approve", "Migrate", "Resolve", "Validate", "Set Up", "Start Using"];
const expected = (...states: string[]) => labels.map((label, i) => label + (states[i] ?? N));

describe.each([
  ["a fresh migration", state("CREATED"), expected("Current")],
  ["a readiness blocker during mapping", state("MAPPING", [...reviewed(3), ...open(8)], 1), expected("Blocked", C, "Current")],
  ["pending mappings", state("AWAITING_APPROVAL", [...reviewed(3), ...open(8)]), expected(C, C, "Current")],
  ["all mappings reviewed, awaiting approval", state("AWAITING_APPROVAL", reviewed(11)), expected(C, C, C, "Current")],
  ["an approved plan", state("APPROVED", reviewed(11)), expected(C, C, C, C, "Current")],
  ["a paused migration", state("RESOLVING", reviewed(11), 0, run("RESOLVING")), expected(C, C, C, C, "Paused", "Needs Attention")],
  ["blocked validation", state("VALIDATION_BLOCKED", reviewed(11), 0, run("MIGRATION_COMPLETE")), expected(C, C, C, C, C, C, "Blocked")],
  ["Set Up", state("ONBOARDING", reviewed(11), 0, run("MIGRATION_COMPLETE")), expected(C, C, C, C, C, C, C, "Current")],
  ["a completed migration", state("VERIFIED_FIRST_PRODUCTIVE_USE", reviewed(11), 0, run("MIGRATION_COMPLETE")), expected(C, C, C, C, C, C, C, C, C)],
])("journey parity for %s", (_name, migration, journey) => {
  it.each(pages)("%s shows the same journey", async (_page, Page) => {
    sessionStorage.setItem("movebooks-migration-session", id);
    window.history.replaceState(null, "", `/stage?session=${id}`);
    vi.spyOn(globalThis, "fetch").mockImplementation(input => respond(migration, String(input)));
    render(<Page />);
    await waitFor(() => expect(steps()).toEqual(journey));
  });
});
