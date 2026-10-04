import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SignIn from "@/app/sign-in/page";
import { assessHeldFor, journeyCurrentLabelFor, journeyHeldFor, journeySteps, nextActionFor } from "@/components/journey/journey";
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
  it("describes the nine steps in customer language", () => {
    expect(journeySteps.map(step => `${step.label} — ${step.summary}`)).toEqual([
      "Assess — Understand readiness and risks",
      "Plan — Define what will move",
      "Map — Align your accounts and data",
      "Approve — Confirm the migration plan",
      "Migrate — Move your approved data",
      "Resolve — Fix items needing attention",
      "Validate — Confirm balances and accuracy",
      "Set Up — Complete your business setup",
      "Start Using — Start working in your migrated books",
    ]);
    expect(JSON.stringify(journeySteps)).not.toMatch(/FPU|first live cycle|First Use/);
  });
  it("holds Assess when readiness blockers remain, on every page that shows the journey", () => {
    expect(journeyHeldFor("ASSESSED", 1)).toEqual({ index: 0, label: "Blocked" });
    expect(journeyHeldFor("AWAITING_APPROVAL", 2)).toEqual({ index: 0, label: "Blocked" });
    expect(journeyHeldFor("ASSESSED", 0)).toBeUndefined();
    expect(assessHeldFor(1, 3)).toEqual({ index: 0, label: "Blocked" });
    expect(assessHeldFor(0, 2)).toEqual({ index: 0, label: "Needs Attention" });
    expect(assessHeldFor(0, 0)).toBeUndefined();
  });
  it("names every journey state as part of the current product", () => {
    expect(journeySteps.map(step => step.label)).toEqual(["Assess", "Plan", "Map", "Approve", "Migrate", "Resolve", "Validate", "Set Up", "Start Using"]);
    expect(journeyCurrentLabelFor("VALIDATION_BLOCKED")).toBe("Blocked");
    expect(journeyCurrentLabelFor("MIGRATION_BLOCKED")).toBe("Blocked");
    expect(journeyCurrentLabelFor("RESOLVING")).toBe("Needs Attention");
    expect(journeyCurrentLabelFor("CONFIGURATION_REVIEW_REQUIRED")).toBe("Needs Attention");
    expect(journeyCurrentLabelFor("MAPPING")).toBe("Current");
  });
});

describe("Plan-stage label casing", () => {
  it("keeps Plan, Map and Approve headings and buttons in Title Case", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const { join, resolve } = await import("node:path");
    const dir = resolve(__dirname, "../components/plan-map-approve");
    const labels = readdirSync(dir).filter(name => name.endsWith(".tsx") && !name.includes(".test.")).flatMap(name => {
      const source = readFileSync(join(dir, name), "utf8");
      return [
        ...[...source.matchAll(/<h[1-4][^>]*>([^<{]+)<\/h[1-4]>/g)].map(match => match[1].trim()),
        ...[...source.matchAll(/<Button[^>]*>([A-Z][^<{]+)<\/Button>/g)].map(match => match[1].trim()),
        ...[...source.matchAll(/title="([^"]+)"/g)].map(match => match[1]),
      ];
    });
    expect(labels.length).toBeGreaterThan(10);
    expect(labels.filter(label => !titleCase(label.replace(/[?.]$/, "")))).toEqual([]);
  });
});

describe("internal terms stay out of customer copy", () => {
  it("never shows First Productive Use, FPU or first live cycle in UI source text", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const { join, resolve } = await import("node:path");
    const root = resolve(__dirname, "..");
    const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) && !name.includes(".test.") ? [path] : [];
    });
    // Analytics contracts are internal and never rendered.
    const sources = [...files(join(root, "app")), ...files(join(root, "components"))].filter(file => !file.endsWith("analytics.ts"));
    const hits = sources.flatMap(file => readFileSync(file, "utf8").split("\n")
      .filter(line => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .filter(line => /First Productive Use|first productive use|first live cycle|"[^"]*\bFPU\b[^"]*"|>[^<]*\bFPU\b/.test(line))
      .map(line => `${file.replace(root, "")}: ${line.trim().slice(0, 80)}`));
    expect(hits).toEqual([]);
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
