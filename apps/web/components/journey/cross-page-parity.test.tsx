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

/** One migration as every endpoint sees it, so each page reads the same authoritative state. */
/** The migration run as the session reports it. Its own status stays at the migration step even
 *  after the workflow has moved on, which every page must still read the same way. */
const run = (status: string) => ({
  id: "execution-1", version: "migration-execution-v1", status, manifest_version: "plan-v1", progress_percent: status === "MIGRATION_COMPLETE" ? 100 : 50,
  current_batch_id: null, current_agent: "migration_agent", safe_to_validate: status === "MIGRATION_COMPLETE", batches: [], failures: [], resolutions: [],
});
function session(status: string, mappings: { state: string }[] = [], blockers = 0, execution: ReturnType<typeof run> | null = null) {
  const pending = mappings.filter(m => !["APPROVED", "MODIFIED"].includes(m.state)).length;
  const findings = Array.from({ length: blockers }, (_, i) => ({ id: `f${i}`, category: "BLOCKER", title: "Invoices reference a missing customer", recommended_action: "Correct it.", rule_code: "R1", affected_entity: "invoices", explanation: "", evidence: [], tool: "check", customer_action_required: true }));
  return {
    id, session_id: id, synthetic: true, company_name: "Harbor Light Books", sample_company_id: "harbor-light-migrate-demo",
    workflow_status: status, effective_status: status, plan: null, execution,
    discovery: { company_name: "Harbor Light Books", findings, profiles: [], fixture_version: "v1", synthetic: true },
    assessment: { readiness: blockers ? "BLOCKED" : "READY", blocker_count: blockers, warning_count: 0, decision_basis: [], recommended_next_actions: [], ready_areas: [], policy_version: "p1" },
    mappings, mapping_review: mappings.length ? { total: mappings.length, pending } : null,
    activity: [], human_decisions: [], events: [], validation_reports: [], repairs: [], resolutions: [],
    ready_for_onboarding: false, tasks: [], onboarding: { faults: [] }, customers: [], products: [], ready: false, verified_fpu: false,
  };
}
const pages: [string, ComponentType][] = [
  ["My Migration", MyMigration], ["Assess", DiscoverAssessExperience], ["Plan", PlanMapApproveExperience],
  ["Migrate", MigrateResolveExperience], ["Validate", ValidateConfigureExperience], ["Start Using", OnboardFpuExperience],
];
const steps = () => within(screen.getByRole("list", { name: "Migration Journey" })).getAllByRole("listitem").map(step => step.textContent);
const reviewed = (n: number) => Array.from({ length: n }, () => ({ state: "APPROVED" }));
const open = (n: number) => Array.from({ length: n }, () => ({ state: "REVIEW_REQUIRED" }));
const C = "Completed", N = "Not Started";
const labels = ["Assess", "Plan", "Map", "Approve", "Migrate", "Resolve", "Validate", "Set Up", "Start Using"];
const expected = (...states: string[]) => labels.map((label, i) => label + (states[i] ?? N));

describe.each([
  ["a fresh migration", session("CREATED"), expected("Current")],
  ["pending mappings", session("AWAITING_APPROVAL", [...reviewed(3), ...open(8)]), expected(C, C, "Current")],
  ["an approved plan", session("APPROVED", reviewed(11)), expected(C, C, C, C, "Current")],
  ["a paused migration", session("RESOLVING", reviewed(11), 0, run("RESOLVING")), expected(C, C, C, C, "Paused", "Needs Attention")],
  ["blocked validation", session("VALIDATION_BLOCKED", reviewed(11), 0, run("MIGRATION_COMPLETE")), expected(C, C, C, C, C, C, "Blocked")],
  ["a completed migration", session("VERIFIED_FIRST_PRODUCTIVE_USE", reviewed(11), 0, run("MIGRATION_COMPLETE")), expected(C, C, C, C, C, C, C, C, C)],
])("journey parity for %s", (_name, data, journey) => {
  it.each(pages)("%s shows the same journey", async (_page, Page) => {
    sessionStorage.setItem("movebooks-migration-session", id);
    window.history.replaceState(null, "", `/stage?session=${id}`);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } })));
    render(<Page />);
    await waitFor(() => expect(steps()).toEqual(journey));
  });
});

it("keeps readiness blockers on Assess the same on every page", async () => {
  const data = session("AWAITING_APPROVAL", reviewed(11), 1);
  for (const [, Page] of pages.slice(0, 3)) {
    sessionStorage.setItem("movebooks-migration-session", id);
    window.history.replaceState(null, "", `/stage?session=${id}`);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(new Response(JSON.stringify(data), { status: 200 })));
    render(<Page />);
    await waitFor(() => expect(steps()).toEqual(expected("Blocked", C, C, "Current")));
    cleanup(); vi.restoreAllMocks();
  }
});
