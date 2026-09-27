import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import Learn from "@/app/learn/page";
import Simulator from "@/app/simulator/page";
import { Nav } from "@/components/Nav";
import { DiscoverAssessExperience } from "@/components/discover-assess/DiscoverAssessExperience";
import { Feedback } from "./Feedback";
import { Play } from "./Play";
import { ProductEntry } from "./ProductEntry";
import { Support } from "./Support";
import { Trust } from "./Trust";
import { publicLinks, sampleEntry, topics } from "./content";
import { contextQuery, safeContext } from "./context";
import { phaseFor, projectSession } from "./session";
import { surfaceEvents } from "./analytics";

afterEach(() => vi.restoreAllMocks());
const id = "11111111-1111-4111-8111-111111111111";
const json = (value: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(value), { status }));
const evidence = {
  id, synthetic: true, workflow_status: "RESOLVING",
  activity: [{ id: "activity-1", action: "Assessment Agent reviewed source evidence", agent: "assessment_agent", provenance: "DETERMINISTIC", tool: "check_balance", status: "COMPLETED", occurred_at: "2026-09-27T00:00:00Z", evidence_references: ["rule:balance"] }],
  human_decisions: [{ id: "decision-1", stage: "mapping", decision: "APPROVED", actor: "demo-user", occurred_at: "2026-09-27T00:00:00Z", evidence: ["mapping:1"], selected_value: "PRIVATE_VALUE" }],
  validation_reports: [{ id: "report-1", created_at: "2026-09-27T00:00:00Z", checks: [{ id: "balance", label: "Balance equality", status: "BLOCKED", source: "PRIVATE_AMOUNT", target: "PRIVATE_AMOUNT", evidence: ["report:1"] }] }],
  execution: { failures: [{ resolved: false, code: "MB-DUPLICATE_CUSTOMER", summary: "Customer needs review" }] },
  events: [{ id: "event-1", name: "migration_paused", occurred_at: "2026-09-27T00:00:00Z", attributes: { raw_data: "PRIVATE_PAYLOAD" } }],
  chain_of_thought: "PRIVATE_REASONING", prompt: "PRIVATE_PROMPT", secret: "PRIVATE_SECRET",
};

describe("public surface contracts", () => {
  it("presents the required business message, CTAs, full journey and scope without invented progress", () => {
    render(<Home/>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Move your books.Keep your confidence.");
    expect(screen.getByRole("link", { name: "Explore Beta" })).toHaveAttribute("href", "/product");
    expect(screen.getByRole("link", { name: "See How It Works" })).toHaveAttribute("href", "#how-it-works");
    expect(screen.getByText(/No live provider migration or production readiness claim/)).toBeVisible();
    expect(screen.getByText("Onboard + First Real Task")).toBeVisible();
    const nav = screen.getByRole("navigation", { name: "Explore MoveBooks AI" });
    for (const [label, href] of publicLinks) expect(within(nav).getByRole("link", { name: label })).toHaveAttribute("href", href);
    expect(screen.queryByText(/62%/)).not.toBeInTheDocument();
  });
  it("preserves Product, workspace and all public navigation on desktop and mobile", () => {
    render(<Nav/>);
    for (const label of ["Primary navigation", "Mobile primary navigation"]) {
      const nav = screen.getByRole("navigation", { name: label, hidden: true });
      for (const [name, href] of publicLinks) expect(within(nav).getByRole("link", { name, hidden: true })).toHaveAttribute("href", href);
    }
    expect(screen.getByLabelText("Open navigation")).toHaveProperty("tagName", "SUMMARY");
    const menu = screen.getByLabelText("Open navigation").closest("details")!;
    menu.open = true;
    const mobileLink = within(screen.getByRole("navigation", { name: "Mobile primary navigation" })).getByRole("link", { name: "Product" });
    mobileLink.addEventListener("click", event => event.preventDefault());
    fireEvent.click(mobileLink);
    expect(menu.open).toBe(false);
  });
  it("routes Simulator to ordinary discovery with no requests or automatic approvals", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Simulator/>);
    expect(screen.getByRole("link", { name: "Start Harbor Light Books" })).toHaveAttribute("href", sampleEntry);
    expect(screen.getByText(/We never pre-approve/)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("preselects Harbor Light without creating a session or running a demo loader", async () => {
    window.history.replaceState(null, "", sampleEntry);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<DiscoverAssessExperience/>);
    expect(await screen.findByLabelText("Synthetic business")).toHaveValue("harbor-light-migrate-demo");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("offers sample entry without creating a session", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<ProductEntry/>);
    expect(await screen.findByText(/No session selected/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Explore Sample Business" })).toHaveAttribute("href", sampleEntry);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("continues the existing authoritative stage using a read-only request", async () => {
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json(evidence));
    render(<ProductEntry/>);
    expect(await screen.findByRole("link", { name: "Continue current session" })).toHaveAttribute("href", `/migrate-resolve?session=${id}`);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1]?.method).toBeUndefined();
  });
  it("renders all ten concise Learn topics with contextual destinations", () => {
    render(<Learn/>);
    for (const topic of topics) {
      expect(screen.getByRole("link", { name: topic.title })).toHaveAttribute("href", `#${topic.id}`);
      expect(document.getElementById(topic.id)?.tagName).toBe("DETAILS");
    }
    expect(screen.getAllByRole("link", { name: /Explore/, hidden: true })).toHaveLength(10);
  });
  it("teaches consequences without allowing unsafe shortcuts or changing any workflow", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Play/>);
    fireEvent.click(screen.getByRole("button", { name: "Start learning scenario" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve from the name alone" }));
    expect(screen.getByText("Unsafe shortcut — try again")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Continue lesson" })).not.toBeInTheDocument();
    for (const name of ["Check account meaning, then approve", "Review evidence and approve a bounded remedy", "Stop, investigate and revalidate"]) {
      fireEvent.click(screen.getByRole("button", { name }));
      fireEvent.click(screen.getByRole("button", { name: "Continue lesson" }));
    }
    expect(screen.getByRole("heading", { name: "Learning exercise complete" })).toBeVisible();
    expect(screen.getByText(/This is not migration completion/)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Restart exercise" }));
    expect(screen.getByRole("button", { name: "Start learning scenario" })).toBeVisible();
  });
  it("shows actual Trust activity, decisions, tools and checks, but never hidden payload fields", async () => {
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json(evidence));
    render(<Trust/>);
    expect(await screen.findByText("Assessment Agent reviewed source evidence")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Current journey stage: Move" })).toBeVisible();
    expect(screen.getByText("Tool: check_balance")).toBeVisible();
    expect(screen.getByRole("heading", { name: "AI recommendation" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Deterministic verification" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Human decision" })).toBeVisible();
    expect(document.body.textContent).not.toContain("PRIVATE_");
    expect(fetch.mock.calls.every(call => !call[1]?.method || call[1].method === "GET")).toBe(true);
  });
  it.each([401, 404, 500])("shows Trust read failure (%s), never fabricated activity or success", async status => {
    sessionStorage.setItem("movebooks-migration-session", id);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json({}, status));
    render(<Trust/>);
    expect(await screen.findByText("Evidence unavailable")).toBeVisible();
    expect(screen.queryByRole("heading", { name: /Current journey stage/ })).not.toBeInTheDocument();
  });
  it("does not infer a stage from an unknown or non-synthetic session", () => {
    expect(() => projectSession({ ...evidence, workflow_status: "MAYBE_COMPLETE" }, id)).toThrow();
    expect(() => projectSession({ ...evidence, synthetic: false }, id)).toThrow();
    expect(() => projectSession({ ...evidence, id: "different" }, id)).toThrow();
    expect(phaseFor("MIGRATION_COMPLETE")).toBe(3);
    expect(phaseFor("VERIFIED_FIRST_PRODUCTIVE_USE")).toBe(4);
  });
  it("rejects invalid references without sending a request", async () => {
    window.history.replaceState(null, "", "/trust?session=../../private");
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Trust/>);
    expect(await screen.findByText(/Invalid session reference/)).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("minimizes context to validated references, categories and bounded counts", () => {
    expect(safeContext(new URLSearchParams(`session=${id}&stage=3&error_code=MB-MISMATCH&failed_action=validation&affected_record_count=2&audit_reference=${id}&raw_data=private&token=private&timestamp=untrusted`))).toEqual({ session: id, stage: "3", error_code: "MB-MISMATCH", failed_action: "validation", affected_record_count: 2, audit_reference: id });
    expect(safeContext(new URLSearchParams("session=secret&stage=999&error_code=secret&failed_action=delete_all&affected_record_count=-1&audit_reference=secret"))).toEqual({});
    expect(contextQuery({ session: id })).toBe(`session=${id}`);
  });
  it("validates feedback and prepares only an explicit local draft, with context opt-in", async () => {
    window.history.replaceState(null, "", `/feedback?session=${id}&raw_data=PRIVATE_PAYLOAD`);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Feedback/>);
    fireEvent.click(screen.getByRole("button", { name: "Prepare feedback draft" }));
    expect(screen.getByRole("alert")).toHaveTextContent("10–1500");
    fireEvent.change(screen.getByLabelText("What should we understand?"), { target: { value: "The explanation could be clearer." } });
    fireEvent.click(screen.getByRole("button", { name: "Prepare feedback draft" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Confirm");
    fireEvent.click(screen.getByLabelText("I checked that this draft contains no sensitive data"));
    fireEvent.click(screen.getByRole("button", { name: "Prepare feedback draft" }));
    const link = screen.getByRole("link", { name: "Download reviewed draft" });
    let draft = JSON.parse(decodeURIComponent(link.getAttribute("href")!.split(",")[1]));
    expect(draft.context).toBeUndefined();
    expect(draft.delivery).toBe("NOT_SUBMITTED");
    fireEvent.click(screen.getByRole("checkbox", { name: /Include only this context in my draft/ }));
    fireEvent.click(screen.getByRole("button", { name: "Prepare feedback draft" }));
    draft = JSON.parse(decodeURIComponent(screen.getByRole("link", { name: "Download reviewed draft" }).getAttribute("href")!.split(",")[1]));
    expect(draft.context).toEqual({ session: id });
    expect(JSON.stringify(draft)).not.toContain("PRIVATE_PAYLOAD");
    expect(fetch).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Draft ready — not submitted" })).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: "Clear draft" }));
    expect(screen.queryByRole("link", { name: "Download reviewed draft" })).not.toBeInTheDocument();
  });
  it("offers contextual Support and safe return links without retrying or approving", () => {
    window.history.replaceState(null, "", `/support?session=${id}&stage=3&raw_data=PRIVATE_PAYLOAD`);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Support/>);
    expect(screen.getByRole("heading", { name: "Validation mismatch" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Return to current workflow" })).toHaveAttribute("href", `/validate-configure?session=${id}`);
    expect(screen.getByRole("link", { name: "Learn about this step" })).toHaveAttribute("href", "/learn#reconciliation");
    expect(screen.getByRole("link", { name: "Report Issue" }).getAttribute("href")).not.toContain("raw_data");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps analytics as uninstrumented contracts, with server-owned completion and intake", () => {
    expect(Object.keys(surfaceEvents)).toHaveLength(10);
    expect(surfaceEvents.simulator_completed.source).toBe("server");
    expect(surfaceEvents.feedback_submitted.trigger).toContain("never local draft");
    for (const event of Object.values(surfaceEvents)) {
      expect(event.owner).toBeTruthy();
      expect(event.fields).not.toContain("raw_data");
    }
  });
});
