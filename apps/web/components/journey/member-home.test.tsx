import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MyMigration } from "@/components/MyMigration";
import type { SessionView } from "../public-surfaces/session";
import { memberHomeGuide, memberHomeStageLines, memberHomeStep } from "./member-home";

const id = "11111111-1111-4111-8111-111111111111";
const view = (extra: Partial<SessionView> = {}): SessionView => ({
  id, status: "AWAITING_APPROVAL", phase: 1, sourceKind: "Synthetic sample · synthetic target", activity: [], decisions: [], checks: [], blockers: [], events: [],
  readinessIssues: 0, migrationIssues: 0, verificationIssues: 0, mappingIssues: 2, attention: [], attentionComplete: true, readinessKnown: true, ...extra,
});
afterEach(() => vi.restoreAllMocks());

describe("My migration copy comes from the session evidence", () => {
  it("names the step inside the stage", () => {
    expect(memberHomeStep(view())).toBe("map and approve");
    expect(memberHomeStep(view({ mappingIssues: 0 }))).toBe("approve the plan");
    expect(memberHomeStep(view({ status: "RESOLVING" }))).toBe("recover");
  });
  it("uses the real pending count and says unknown plainly", () => {
    expect(memberHomeGuide(view())).toBe("Your books passed the readiness check and the rules have proposed where every record goes. Before anything moves, 2 mappings need your decision.");
    expect(memberHomeGuide(view({ mappingIssues: 1 }))).toMatch(/1 mapping needs your decision/);
    expect(memberHomeGuide(view({ mappingIssues: null }))).toMatch(/isn't in this snapshot/);
    expect(memberHomeGuide(view({ readinessIssues: 1 }))).toMatch(/found 1 blocker/);
  });
  it("gives one line per stage, never a number the snapshot lacks", () => {
    const lines = memberHomeStageLines(view({ mappingIssues: null }));
    expect(lines.map(line => [line.name, line.state])).toEqual([["Understand", "done"], ["Prepare", "current"], ["Move", "locked"], ["Verify", "locked"], ["Start", "locked"]]);
    expect(lines[1].text).toBe("Mappings proposed. How many still need you isn't in this snapshot.");
    expect(lines[2].text).toMatch(/Unlocks when every mapping is approved or changed/);
    expect(JSON.stringify(lines)).not.toMatch(/\b(12|10|17)\b/);
  });
  it("counts checks from the list and marks a paused move as blocked", () => {
    const check = (status: string) => ({ id: status, title: "t", kind: "", status, time: "", actor: "", tool: "", evidence: [] });
    expect(memberHomeStageLines(view({ status: "VALIDATING", checks: [check("VERIFIED"), check("UNCONFIRMED")] }))[3].text).toBe("1 of 2 recorded checks passed.");
    const paused = memberHomeStageLines(view({ status: "RESOLVING", migrationIssues: 1 }));
    expect(paused[2]).toMatchObject({ state: "blocked", text: "1 issue to review. Completed batches are kept." });
  });
});

describe("My migration screen", () => {
  const json = (value: unknown) => Promise.resolve(new Response(JSON.stringify(value)));
  const evidence = { id, synthetic: true, workflow_status: "AWAITING_APPROVAL", mapping_review: { total: 12, pending: 2 }, discovery: { findings: [] }, execution: { failures: [] }, validation_reports: [], configuration: { proposals: [] }, onboarding: { tasks: [], fpu: {} }, activity: [], human_decisions: [], events: [] };
  it("shows stage, guide, one next action, progress lines, evidence, released AI status and attribution", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json(evidence));
    render(<MyMigration reference={id} />);
    expect(await screen.findByText(/stage 2 of 5 · map and approve/)).toHaveTextContent("Prepare · stage 2 of 5 · map and approve");
    expect(screen.getByText(/Before anything moves, 2 mappings need your decision/)).toBeVisible();
    expect(within(screen.getByRole("region", { name: "Your next step" })).getByRole("link", { name: "Review 2 mappings" })).toHaveAttribute("href", `/plan-map-approve?session=${id}`);
    expect(within(screen.getByRole("region", { name: "How this move is going" })).getAllByRole("listitem")).toHaveLength(5);
    expect(within(screen.getByRole("region", { name: "At a glance" })).getByText("Mappings waiting for you").nextSibling).toHaveTextContent("2");
    expect(screen.getByRole("link", { name: "Open evidence" })).toHaveAttribute("href", `/trust?view=evidence&session=${id}`);
    expect(within(screen.getByRole("region", { name: "Second opinions" })).getByText("Live · limited evaluation")).toBeVisible();
    // The attribution now appears once per page, in the shared header, not in this screen.
    expect(screen.queryByText(/Built on Google Cloud/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gemini AI planned/)).toBeNull();
  });
  it("never shows an unknown mapping count as zero", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ ...evidence, mapping_review: null }));
    render(<MyMigration reference={id} />);
    const glance = await screen.findByRole("region", { name: "At a glance" });
    expect(within(glance).getByText("Mappings waiting for you").nextSibling).toHaveTextContent("Not in this snapshot");
  });
});
