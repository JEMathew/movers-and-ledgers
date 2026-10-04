import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MyMigration } from "./MyMigration";

const id = "11111111-1111-4111-8111-111111111111";
const json = (value: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(value), { status }));
const evidence = {
  id, synthetic: true, workflow_status: "RESOLVING",
  execution: { failures: [{ resolved: false, code: "MB-DUPLICATE_CUSTOMER", summary: "Customer needs review" }] },
  validation_reports: [], activity: [], human_decisions: [], events: [],
};
const steps = () => within(screen.getByRole("list", { name: "Migration Journey" })).getAllByRole("listitem");

afterEach(() => { vi.restoreAllMocks(); window.history.replaceState(null, "", "/"); });

describe("My Migration", () => {
  it("starts at Assess with one readiness CTA and makes no request when no migration exists", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<MyMigration />);
    expect(screen.getByRole("heading", { level: 1, name: "My Migration" })).toBeVisible();
    const cta = await screen.findByRole("link", { name: /Check If My Books Are Ready to Migrate/ });
    expect(cta).toHaveAttribute("href", "/assess?sample=harbor-light-migrate-demo");
    expect(cta).toHaveClass("button");
    expect(screen.getAllByRole("link").filter(link => link.classList.contains("button"))).toHaveLength(1);
    expect(steps().map(step => step.textContent)).toEqual(["AssessCurrent", "PlanNot Started", "MapNot Started", "ApproveNot Started", "MigrateNot Started", "ResolveNot Started", "ValidateNot Started", "Set UpNot Started", "Start UsingNot Started"]);
    expect(screen.getByText("Step 1 of 9 · Assess: Understand readiness and risks")).toBeVisible();
    expect(screen.getByText(/Bounded synthetic Beta/)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("shows completed, current and upcoming steps and one next action from the authoritative status", async () => {
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json(evidence));
    render(<MyMigration />);
    const cta = await screen.findByRole("link", { name: /Review 1 Migration Issue/ });
    expect(cta).toHaveAttribute("href", `/migrate-resolve?session=${id}`);
    expect(steps().map(step => step.textContent?.replace(/^(.*?)(Completed|Current|Not Started|Paused|Needs Attention|Blocked)$/, "$2"))).toEqual(["Completed", "Completed", "Completed", "Completed", "Paused", "Needs Attention", "Not Started", "Not Started", "Not Started"]);
    expect(steps()[5]).toHaveAttribute("aria-current", "step");
    // A paused migration is never shown as completed.
    expect(steps()[4]).not.toHaveClass("is-complete");
    expect(screen.getByRole("heading", { name: "Review Migration Issues" })).toBeVisible();
    expect(screen.getByText("MB-DUPLICATE_CUSTOMER: Customer needs review")).toBeVisible();
    expect(screen.getByRole("link", { name: "Review Evidence and Audit History" })).toHaveAttribute("href", `/trust?session=${id}`);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1]?.method).toBeUndefined();
  });
  it.each([404, 500])("never invents progress when the migration cannot be read (%s)", async status => {
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json({}, status));
    render(<MyMigration />);
    expect(await screen.findByText("Migration Unavailable")).toBeVisible();
    expect(screen.getByText("No progress is assumed.")).toBeVisible();
    // An expired or unreadable migration shows no completed or current step.
    expect(steps().some(step => step.hasAttribute("aria-current"))).toBe(false);
    expect(screen.getByText(/^(Checking your progress…|Progress unavailable · nothing is assumed)$/)).toBeVisible();
    expect(screen.queryByText(/Completed|Current/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Check If My Books Are Ready to Migrate/ })).toHaveAttribute("href", "/assess?sample=harbor-light-migrate-demo");
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
  it("adopts a deep-linked migration in a fresh tab so it survives navigation", async () => {
    sessionStorage.clear();
    window.history.replaceState(null, "", `/workspace?session=${id}`);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json(evidence));
    const first = render(<MyMigration />);
    await screen.findByRole("link", { name: /Review 1 Migration Issue/ });
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(id);
    first.unmount();
    // Learn → Go to My Migration links to /workspace without a session reference.
    window.history.replaceState(null, "", "/workspace");
    render(<MyMigration />);
    expect(await screen.findByRole("link", { name: /Review 1 Migration Issue/ })).toHaveAttribute("href", `/migrate-resolve?session=${id}`);
    expect(String(fetch.mock.calls[1][0])).toContain(`/v1/migration-sessions/${id}/`);
  });
  it.each([404, 500])("keeps the selected migration when a deep link cannot be read (%s)", async status => {
    const selected = "22222222-2222-4222-8222-222222222222";
    sessionStorage.setItem("movebooks-migration-session", selected);
    window.history.replaceState(null, "", `/workspace?session=${id}`);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json({}, status));
    render(<MyMigration />);
    expect(await screen.findByText("Migration Unavailable")).toBeVisible();
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(selected);
  });
  // Shape of GET /intake-trust: mapping_review is { total, pending } once mappings exist, otherwise null.
  const awaiting = (mapping_review?: Record<string, unknown> | null) => ({
    ...evidence, workflow_status: "AWAITING_APPROVAL", execution: {},
    ...(mapping_review === undefined ? {} : { mapping_review }),
  });
  const label = (step: HTMLElement) => step.textContent?.replace(/^(.*?)(Completed|Current|Not Started|Paused|Needs Attention|Blocked)$/, "$2");
  it.each([
    ["absent", undefined],
    ["unavailable", null],
    ["pending without total", { pending: 0 }],
    ["zero total", { total: 0, pending: 0 }],
    ["negative pending", { total: 5, pending: -1 }],
    ["pending above total", { total: 2, pending: 3 }],
  ])("keeps Map open and never offers approval when the mapping count is %s", async (_case, review) => {
    sessionStorage.setItem("movebooks-migration-session", id);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json(awaiting(review)));
    render(<MyMigration />);
    expect(await screen.findByRole("link", { name: /^Review Mappings/ })).toHaveAttribute("href", `/plan-map-approve?session=${id}`);
    expect(label(steps()[2])).toBe("Current");
    expect(steps()[2]).not.toHaveClass("is-complete");
    expect(screen.queryByText(/Approve Migration Plan/)).not.toBeInTheDocument();
  });
  it("keeps Map open while mapping reviews are pending", async () => {
    sessionStorage.setItem("movebooks-migration-session", id);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json(awaiting({ total: 5, pending: 2 })));
    render(<MyMigration />);
    expect(await screen.findByRole("link", { name: /^Review 2 Mappings/ })).toBeVisible();
    expect(label(steps()[2])).toBe("Current");
    expect(screen.queryByText(/Approve Migration Plan/)).not.toBeInTheDocument();
  });
  it("completes Map and offers approval only when no mapping review is pending", async () => {
    sessionStorage.setItem("movebooks-migration-session", id);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json(awaiting({ total: 5, pending: 0 })));
    render(<MyMigration />);
    expect(await screen.findByRole("link", { name: /^Approve Migration Plan/ })).toBeVisible();
    expect(steps().map(label).slice(0, 4)).toEqual(["Completed", "Completed", "Completed", "Current"]);
  });
  it("answers where I am, what needs attention, what to do and what comes next", async () => {
    sessionStorage.setItem("movebooks-migration-session", id);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ ...evidence, workflow_status: "VALIDATION_BLOCKED", execution: {}, validation_reports: [{ created_at: "t", checks: [{ id: "ar", label: "A/R totals", status: "BLOCKED", evidence: [] }] }] }));
    render(<MyMigration />);
    expect(await screen.findByRole("heading", { name: "Review Verification Issues" })).toBeVisible();
    expect(screen.getByText("See where your migration stands, what needs your attention, and what comes next.")).toBeVisible();
    expect(screen.getByText(/You stay in control of important migration decisions\./)).toBeVisible();
    for (const name of ["Where Am I?", "What Needs My Attention?", "What Comes Next?"]) expect(screen.getByRole("heading", { name })).toBeVisible();
    expect(screen.getByText("What Do I Do Next?")).toBeVisible();
    expect(screen.getByText("Check blocked: A/R totals")).toBeVisible();
    // A blocked current step says so; later steps are part of this product, not a roadmap.
    expect(steps()[6]).toHaveTextContent("ValidateBlocked");
    expect(steps()[6]).toHaveClass("is-blocked");
    expect(steps()[8]).toHaveTextContent("Start UsingNot Started");
    expect(screen.getByText("Set Up:")).toBeVisible();
    expect(document.body).not.toHaveTextContent(/Upcoming|One journey from readiness/);
  });
  it("says plainly when nothing needs attention", async () => {
    sessionStorage.setItem("movebooks-migration-session", id);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json({ ...evidence, workflow_status: "MIGRATION_COMPLETE", execution: {} }));
    render(<MyMigration />);
    expect(await screen.findByText("Nothing needs your attention right now.")).toBeVisible();
  });
  it("rejects an invalid session reference without a request", async () => {
    window.history.replaceState(null, "", "/workspace?session=../../private");
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<MyMigration />);
    expect(await screen.findByText(/Invalid session reference/)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });
});
