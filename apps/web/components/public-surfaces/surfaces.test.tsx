import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import Learn from "@/app/learn/page";
import Simulator from "@/app/simulator/page";
import { Nav } from "@/components/Nav";
import { IdentityProvider } from "@/components/IdentityProvider";
import { DiscoverAssessExperience } from "@/components/discover-assess/DiscoverAssessExperience";
import { Feedback } from "./Feedback";
import { Play } from "./Play";
import { ProductEntry } from "./ProductEntry";
import { Support } from "./Support";
import { Trust } from "./Trust";
import { Guide } from "./Guide";
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

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), usePathname: () => window.location.pathname }));

describe("public surface contracts", () => {
  it.each([
    ["Product", ProductEntry], ["Guide", Guide], ["Simulator", Simulator],
    ["Learn", Learn], ["Play", Play], ["Trust", Trust],
    ["Feedback", Feedback], ["Support", Support],
  ] as const)("keeps %s section headings out of uppercase label styling", async (_name, Page) => {
    render(<Page/>);
    await waitFor(() => {
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      for (const heading of screen.getAllByRole("heading")) expect(heading.className).not.toMatch(/uppercase|type-label|eyebrow/);
    });
  });
  it("presents one Beta launch, an honest Demo introduction and prominent public Play", () => {
    render(<Home/>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Move your books.Keep your confidence.");
    expect(screen.getByRole("link", { name: "Try the Beta" })).toHaveAttribute("href", "/workspace");
    expect(screen.getByRole("link", { name: "Explore Demo" })).toHaveAttribute("href", "/simulator");
    expect(screen.getByRole("link", { name: "Explore Demo" })).toHaveAccessibleDescription("Demo introduction only. Sign-in is required to run the Beta workflow.");
    expect(screen.getByRole("link", { name: "Open Play" })).toHaveAttribute("href", "/play");
    expect(screen.getByText("V1.0 Bounded Synthetic Public Beta")).toBeVisible();
    expect(screen.getByText(/Do not use real customer or production provider data/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Beta limitations" })).toHaveAttribute("href", "/trust#beta-limitations");
    const main = screen.getByRole("main");
    expect(main.querySelectorAll("a.button:not(.secondary):not(.ghost)")).toHaveLength(1);
    expect(screen.queryByText(/62%/)).not.toBeInTheDocument();
    const journey = document.querySelector<HTMLDetailsElement>("#how-it-works")!;
    expect(journey.open).toBe(false);
    fireEvent.click(within(journey).getByText("How MoveBooks works"));
    expect(screen.getByText("Onboard + First Synthetic Task")).toBeVisible();
    expect(screen.getByRole("link", { name: "Getting Started Guide" })).toHaveAttribute("href", "/guide");
    fireEvent.click(screen.getByText("Beta boundaries and architecture"));
    expect(screen.getByText(/Live Gemini advice requires explicit deployment configuration/)).toBeVisible();
    expect(screen.getByText(/No affiliation with or representation/)).toBeVisible();
  });
  it("simplifies public navigation with Play outside the mobile menu", () => {
    render(<IdentityProvider><Nav/></IdentityProvider>);
    const nav = screen.getByRole("navigation", { name: "Primary navigation", hidden: true });
    for (const [name, href] of publicLinks) expect(within(nav).getByRole("link", { name, hidden: true })).toHaveAttribute("href", href);
    expect(publicLinks.map(([label]) => label)).toEqual(["Explore Demo", "Play", "Learn", "Trust"]);
    expect(screen.getByRole("link", { name: "MoveBooks AI home" })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Play", hidden: true })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/support");
    const menu = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(menu);
    const demo = within(nav).getByRole("link", { name: "Explore Demo" });
    demo.addEventListener("click", event => event.preventDefault());
    fireEvent.click(demo);
    expect(menu).toHaveAttribute("aria-expanded", "false");
  });
  it("routes Simulator to ordinary discovery with no requests or automatic approvals", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Simulator/>);
    expect(screen.getByRole("link", { name: "Try the Beta with this sample" })).toHaveAttribute("href", `/sign-in?next=${encodeURIComponent(sampleEntry)}`);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Meet your sample business.");
    fireEvent.click(screen.getByText("What you will experience"));
    expect(screen.getByText(/Nothing is pre-approved/)).toBeVisible();
    fireEvent.click(screen.getByText("What is synthetic"));
    expect(screen.getByText(/Cloud mode uses real Google sign-in and durable owner-protected workspaces/)).toBeVisible();
    expect(screen.queryByText(/Sessions expire when the API restarts/)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("preselects Harbor Light without creating a session or running a demo loader", async () => {
    window.history.replaceState(null, "", sampleEntry);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<DiscoverAssessExperience/>);
    expect(await screen.findByLabelText("Sample business")).toHaveValue("harbor-light-migrate-demo");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("continues the existing authoritative stage using a read-only request", async () => {
    window.history.replaceState(null, "", `/product?session=${id}`);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json(evidence));
    render(<ProductEntry/>);
    expect(await screen.findByRole("link", { name: "Continue My Migration" })).toHaveAttribute("href", `/migrate-resolve?session=${id}`);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1]?.method).toBeUndefined();
  });
  it("renders all ten concise Learn topics with contextual destinations", () => {
    render(<Learn/>);
    for (const topic of topics) {
      expect(document.getElementById(topic.id)?.querySelector("summary")).toHaveTextContent(topic.title);
      expect(document.getElementById(topic.id)?.tagName).toBe("DETAILS");
    }
    // With no migration selected, each topic leads to My Migration, never the marketing Product page.
    const links = screen.getAllByRole("link", { name: "Open My Migration", hidden: true });
    expect(links).toHaveLength(10);
    for (const link of links) expect(link).toHaveAttribute("href", "/workspace");
    expect(document.querySelector('a[href^="/product"]')).toBeNull();
  });
  it.each(["query", "storage"])("keeps the migration session on Learn topic links (from %s)", async source => {
    sessionStorage.clear();
    if (source === "query") window.history.replaceState(null, "", `/learn?session=${id}`);
    else { window.history.replaceState(null, "", "/learn"); sessionStorage.setItem("movebooks-migration-session", id); }
    render(<Learn/>);
    const links = await screen.findAllByRole("link", { name: /in Your Migration$/, hidden: true });
    expect(links).toHaveLength(10);
    const reconciliation = within(document.getElementById("reconciliation") as HTMLElement).getByRole("link", { hidden: true });
    expect(reconciliation).toHaveTextContent("Open Validate in Your Migration");
    expect(reconciliation).toHaveAttribute("href", `/validate-configure?session=${id}`);
    const mappings = within(document.getElementById("mappings") as HTMLElement).getByRole("link", { hidden: true });
    expect(mappings).toHaveAttribute("href", `/plan-map-approve?session=${id}`);
    expect(document.querySelector('a[href^="/product"]')).toBeNull();
    sessionStorage.clear();
  });
  it("ignores an invalid stored session on Learn topic links", async () => {
    sessionStorage.setItem("movebooks-migration-session", "../../private");
    render(<Learn/>);
    await waitFor(() => expect(screen.getAllByRole("link", { name: "Open My Migration", hidden: true })).toHaveLength(10));
    sessionStorage.clear();
  });
  it("returns from Learn to the referenced step without fetching or changing progress", () => {
    window.history.replaceState(null, "", `/learn?stage=3&session=${id}#reconciliation`);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Learn/>);
    expect(screen.getByRole("link", { name: "Return to Verify" })).toHaveAttribute("href", `/validate-configure?session=${id}`);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not invent a current migration from invalid Learn context", () => {
    window.history.replaceState(null, "", "/learn?stage=99&session=invalid");
    render(<Learn/>);
    expect(screen.getByRole("link", { name: "Go to My Migration" })).toHaveAttribute("href", "/workspace");
  });
  it("keeps detailed copy available through native disclosures without a second launch CTA", () => {
    render(<Home/>);
    for (const summary of ["How MoveBooks works", "Why businesses migrate", "Trust by design", "Beta boundaries and architecture"]) {
      const control = screen.getByText(summary).closest("summary")!;
      expect(control.closest("details")).not.toHaveAttribute("open");
      fireEvent.click(control);
      expect(control.closest("details")).toHaveAttribute("open");
    }
    for (const name of ["The questions behind every move", "How MoveBooks works", "Trust by design"]) expect(screen.getByRole("heading", { name })).toBeVisible();
    expect(screen.getByRole("link", { name: "Try the Beta" })).toHaveAttribute("href", "/workspace");
    expect(screen.queryByRole("link", { name: "Try a migration" })).not.toBeInTheDocument();
    for (const heading of screen.getAllByRole("heading")) expect(heading.className).not.toMatch(/uppercase|type-label|eyebrow/);
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
    window.history.replaceState(null, "", `/trust?session=${id}`);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json(evidence));
    render(<Trust evidenceMode/>);
    expect(await screen.findByText("Assessment Agent reviewed source evidence")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Current journey stage: Move" })).toBeVisible();
    expect(screen.getByText("Tool: check_balance")).toBeVisible();
    expect(document.body.textContent).not.toContain("PRIVATE_");
    expect(fetch.mock.calls.every(call => !call[1]?.method || call[1].method === "GET")).toBe(true);
  });
  it.each([401, 404, 500])("shows Trust read failure (%s), never fabricated activity or success", async status => {
    window.history.replaceState(null, "", `/trust?view=evidence&session=${id}`);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => json({}, status));
    render(<Trust evidenceMode/>);
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
    render(<Trust evidenceMode/>);
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
    fireEvent.click(screen.getByText("Optional context preview"));
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
    expect(screen.getByRole("link", { name: "Open Verify for this issue" })).toHaveAttribute("href", `/validate-configure?session=${id}`);
    expect(screen.getByRole("link", { name: "Learn about this step" })).toHaveAttribute("href", "/learn#reconciliation");
    expect(screen.getByRole("link", { name: "Prepare unsent issue draft" }).getAttribute("href")).not.toContain("raw_data");
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
