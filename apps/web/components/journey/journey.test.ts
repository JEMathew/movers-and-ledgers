import { describe, expect, it } from "vitest";
import { phaseFor } from "@/components/public-surfaces/session";
import { JOURNEY_COMPLETE, isSessionReference, journeyHeldFor, journeyStepFor, journeySteps, nextActionFor } from "./journey";

const id = "11111111-1111-4111-8111-111111111111";
const state = (status: string, counts: Partial<{ readinessIssues: number; migrationIssues: number; verificationIssues: number }> = {}) =>
  ({ id, status, readinessIssues: 0, migrationIssues: 0, verificationIssues: 0, ...counts });
const statuses = ["CREATED", "DISCOVERED", "ASSESSED", "PLANNED", "MAPPING", "AWAITING_APPROVAL", "APPROVED", "MIGRATION_READY", "MIGRATING", "MIGRATION_PAUSED", "RESOLVING", "RETRY_PENDING", "MIGRATION_BLOCKED", "MIGRATION_COMPLETE", "VALIDATING", "VALIDATED", "VALIDATION_BLOCKED", "CONFIGURING", "CONFIGURATION_REVIEW_REQUIRED", "CONFIGURED", "ONBOARDING", "ONBOARDING_BLOCKED", "READY_FOR_FIRST_PRODUCTIVE_USE", "FIRST_PRODUCTIVE_USE_IN_PROGRESS", "FIRST_PRODUCTIVE_USE_BLOCKED", "VERIFIED_FIRST_PRODUCTIVE_USE"];

describe("operational migration journey", () => {
  it("has the nine customer-facing steps in order", () => {
    expect(journeySteps.map(step => step.label)).toEqual(["Assess", "Plan", "Map", "Approve", "Migrate", "Resolve", "Validate", "Set up", "First use"]);
  });
  it("maps every workflow status the product knows to exactly one step, and nothing else", () => {
    for (const status of statuses) {
      expect(phaseFor(status)).not.toBeNull();
      expect(journeyStepFor(status)).not.toBeNull();
    }
    expect(journeyStepFor("MAYBE_COMPLETE")).toBeNull();
    expect(journeyStepFor("constructor")).toBeNull();
    expect(["ASSESSED", "MAPPING", "AWAITING_APPROVAL", "MIGRATING", "RESOLVING", "VALIDATING", "CONFIGURING", "READY_FOR_FIRST_PRODUCTIVE_USE"].map(journeyStepFor)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(journeyStepFor("VERIFIED_FIRST_PRODUCTIVE_USE")).toBe(JOURNEY_COMPLETE);
    for (let i = 1; i < statuses.length; i++) expect(journeyStepFor(statuses[i])!).toBeGreaterThanOrEqual(journeyStepFor(statuses[i - 1])! - (statuses[i - 1] === "VALIDATION_BLOCKED" ? 0 : 1));
  });
  it("gives every state one customer-facing next action that keeps the session", () => {
    for (const status of statuses) {
      const action = nextActionFor(state(status));
      expect(action.label).toBeTruthy();
      expect(action.href).toContain(`session=${id}`);
    }
  });
  it.each([
    [state("CREATED"), "Check my readiness", `/assess?session=${id}`],
    [state("ASSESSED", { readinessIssues: 3 }), "Resolve 3 readiness issues", `/plan-map-approve?session=${id}`],
    [state("ASSESSED", { readinessIssues: 1 }), "Resolve 1 readiness issue", `/plan-map-approve?session=${id}`],
    [state("ASSESSED"), "Create my migration plan", `/plan-map-approve?session=${id}`],
    [state("MAPPING"), "Review mappings", `/plan-map-approve?session=${id}`],
    [state("AWAITING_APPROVAL"), "Approve migration plan", `/plan-map-approve?session=${id}`],
    [state("APPROVED"), "Start migration", `/migrate-resolve?session=${id}`],
    [state("RESOLVING", { migrationIssues: 7 }), "Resolve 7 issues", `/migrate-resolve?session=${id}`],
    [state("MIGRATION_COMPLETE"), "Verify my books", `/validate-configure?session=${id}`],
    [state("VALIDATION_BLOCKED", { verificationIssues: 2 }), "Resolve 2 verification issues", `/validate-configure?session=${id}`],
    [state("CONFIGURING"), "Complete setup", `/validate-configure?session=${id}`],
    [state("ONBOARDING"), "Complete setup", `/onboard-fpu?session=${id}`],
    [state("READY_FOR_FIRST_PRODUCTIVE_USE"), "Start my first task", `/onboard-fpu?session=${id}`],
    [state("VERIFIED_FIRST_PRODUCTIVE_USE"), "Review verified evidence", `/trust?session=${id}`],
  ])("%#: %o -> %s", (input, label, href) => {
    expect(nextActionFor(input)).toMatchObject({ label, href });
  });
  it("starts with a readiness check when there is no migration or the status is unknown", () => {
    expect(nextActionFor(undefined)).toMatchObject({ label: "Check my readiness", href: "/assess?sample=harbor-light-migrate-demo" });
    expect(nextActionFor(state("MAYBE_COMPLETE"))).toMatchObject({ label: "Check my readiness", href: "/assess?sample=harbor-light-migrate-demo" });
  });
  it("holds Migrate as paused, never completed, while issues are being resolved", () => {
    for (const status of ["MIGRATION_PAUSED", "RESOLVING", "RETRY_PENDING", "MIGRATION_BLOCKED"]) expect(journeyHeldFor(status)).toEqual({ index: 4, label: "Paused" });
    for (const status of ["MIGRATING", "MIGRATION_COMPLETE", "ASSESSED"]) expect(journeyHeldFor(status)).toBeUndefined();
  });
  it("accepts only well-formed session references", () => {
    expect(isSessionReference(id)).toBe(true);
    for (const value of ["", "../../private", "session-001", undefined, null, 42]) expect(isSessionReference(value)).toBe(false);
  });
});
