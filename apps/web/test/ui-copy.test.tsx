import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SignIn from "@/app/sign-in/page";
import { journeyCurrentLabelFor, journeySteps, nextActionFor } from "@/components/journey/journey";
import { footerLinks, memberLinks, publicLinks } from "@/components/public-surfaces/content";

afterEach(() => vi.unstubAllEnvs());

// Grammatical Title Case: every word capitalised except short articles, conjunctions and
// prepositions after the first word. Numbers and the "·" separator are allowed.
const small = new Set(["a", "an", "the", "and", "or", "for", "to", "of", "in", "on", "with", "at", "by"]);
const titleCase = (label: string) => label.split(/\s+/).every((word, index) =>
  /^[\d·→&]/.test(word) || (index > 0 && small.has(word)) || /^[A-Z]/.test(word));

const statuses = ["CREATED", "DISCOVERED", "ASSESSED", "PLANNED", "MAPPING", "AWAITING_APPROVAL", "APPROVED", "MIGRATION_READY", "MIGRATING", "MIGRATION_PAUSED", "RESOLVING", "RETRY_PENDING", "MIGRATION_BLOCKED", "MIGRATION_COMPLETE", "VALIDATING", "VALIDATION_BLOCKED", "VALIDATED", "CONFIGURING", "CONFIGURATION_REVIEW_REQUIRED", "CONFIGURED", "ONBOARDING", "ONBOARDING_BLOCKED", "READY_FOR_FIRST_PRODUCTIVE_USE", "FIRST_PRODUCTIVE_USE_IN_PROGRESS", "FIRST_PRODUCTIVE_USE_BLOCKED", "VERIFIED_FIRST_PRODUCTIVE_USE", "UNKNOWN"];
const id = "11111111-1111-4111-8111-111111111111";

describe("customer-facing label casing", () => {
  it("uses Title Case for menus, journey steps and every next action", () => {
    const labels = [
      ...[...publicLinks, ...memberLinks, ...footerLinks].map(([label]) => label),
      ...journeySteps.map(step => step.label),
      ...statuses.flatMap(status => [0, 2].flatMap(n => {
        const action = nextActionFor({ id, status, readinessIssues: n, migrationIssues: n, verificationIssues: n, mappingIssues: n });
        return [action.label, action.heading];
      })),
      nextActionFor(undefined).label, nextActionFor(undefined).heading,
    ];
    expect(labels.filter(label => !titleCase(label))).toEqual([]);
  });
  it("frames readiness as readiness to migrate", () => {
    expect(nextActionFor(undefined)).toMatchObject({
      heading: "See If Your Books Are Ready to Migrate",
      label: "Check If My Books Are Ready to Migrate",
      detail: "We'll review your accounting data and identify anything that could block or complicate the migration.",
    });
  });
  it("names every journey state as part of the current product", () => {
    expect(journeySteps.map(step => step.label)).toEqual(["Assess", "Plan", "Map", "Approve", "Migrate", "Resolve", "Validate", "Set Up", "First Use"]);
    expect(journeyCurrentLabelFor("VALIDATION_BLOCKED")).toBe("Blocked");
    expect(journeyCurrentLabelFor("MIGRATION_BLOCKED")).toBe("Blocked");
    expect(journeyCurrentLabelFor("RESOLVING")).toBe("Needs Attention");
    expect(journeyCurrentLabelFor("CONFIGURATION_REVIEW_REQUIRED")).toBe("Needs Attention");
    expect(journeyCurrentLabelFor("MAPPING")).toBe("Current");
  });
});

describe("demo workspace entry", () => {
  it("explains the local demo workspace without identity jargon", async () => {
    render(await SignIn({ searchParams: Promise.resolve({ next: "/assess" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "Continue Your Migration" })).toBeVisible();
    expect(screen.getByText("Review and continue your migration using the demo workspace.")).toBeVisible();
    expect(screen.getByRole("link", { name: /Enter Demo Workspace/ })).toHaveAttribute("href", "/api/auth/demo?next=%2Fassess");
    expect(screen.getByText("Synthetic Data Only")).toBeVisible();
    expect(document.body).not.toHaveTextContent(/Local demo identity|controlled de-identified test exports only/i);
  });
  // Google sign-in copy stays as it was; test/google-sign-in.test.tsx asserts it in cloud mode.
});
