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

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

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
  it("presents the required business message, CTAs, full journey and scope without invented progress", () => {
    render(<Home/>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Move your books.Keep your confidence.");
    expect(screen.getByRole("link", { name: "Start my migration" })).toHaveAttribute("href", "/workspace");
    expect(screen.getByRole("link", { name: "Try a migration" })).toHaveAttribute("href", "/simulator");
    expect(screen.getByRole("link", { name: "See how it works" })).toHaveAttribute("href", "#how-it-works");
    expect(screen.getByText(/Bounded synthetic Beta · No production customer data/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Beta limitations" })).toHaveAttribute("href", "/trust#beta-limitations");
    expect(screen.getByText("Onboard + First Real Task")).toBeVisible();
    const nav = screen.getByRole("navigation", { name: "Explore MoveBooks AI" });
    for (const [label, href] of publicLinks) expect(within(nav).getByRole("link", { name: label })).toHaveAttribute("href", href);
    expect(screen.queryByText(/62%/)).not.toBeInTheDocument();
    expect(screen.getByText(/Live Gemini advice requires explicit deployment configuration/)).toBeVisible();
    expect(screen.queryByText(/Google identity, live Gemini/)).not.toBeInTheDocument();
  });
  it("shows the signed-out navigation on desktop and mobile, without Product or Feedback", () => {
    render(<IdentityProvider><Nav/></IdentityProvider>);
    for (const label of ["Primary navigation", "Mobile primary navigation"]) {
      const nav = screen.getByRole("navigation", { name: label, hidden: true });
      for (const [name, href] of publicLinks) expect(within(nav).getByRole("link", { name, hidden: true })).toHaveAttribute("href", href);
      expect(within(nav).queryByRole("link", { name: /^(Product|Feedback|Guide|Simulator)$/, hidden: true })).not.toBeInTheDocument();
    }
    expect(publicLinks.map(([label]) => label)).toEqual(["Explore", "How it works", "Learn", "Play", "Trust", "Support"]);
    expect(screen.getByRole("link", { name: "MoveBooks AI home" })).toHaveAttribute("href", "/");
    expect(screen.getByLabelText("Open navigation")).toHaveProperty("tagName", "SUMMARY");
    const menu = screen.getByLabelText("Open navigation").closest("details")!;
    menu.open = true;
    const mobileLink = within(screen.getByRole("navigation", { name: "Mobile primary navigation" })).getByRole("link", { name: "Explore" });
    mobileLink.addEventListener("click", event => event.preventDefault());
    fireEvent.click(mobileLink);
    expect(menu.open).toBe(false);
  });
  it("routes Simulator to ordinary discovery with no requests or automatic approvals", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Simulator/>);
    expect(screen.getByRole("link", { name: "Try a migration" })).toHaveAttribute("href", sampleEntry);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Try a migration with a sample business.");
    expect(screen.getByText(/We never pre-approve/)).toBeVisible();
    expect(screen.getByText(/Cloud mode uses real Google sign-in and durable synthetic workspaces/)).toBeVisible();
    expect(screen.queryByText(/Sessions expire when the API restarts/)).not.toBeInTheDocument();
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
    expect(await screen.findByText(/No migration selected/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Start a sample migration" })).toHaveAttribute("href", sampleEntry);
    expect(screen.getByText(/Uploads are unavailable in this public Beta/)).toBeVisible();
    expect(screen.getByText(/Real accounting-provider connections are not available/)).toBeVisible();
    expect(screen.queryByText(/Production identity and durable sessions are not available/)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("continues the existing authoritative stage using a read-only request", async () => {
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json(evidence));
    render(<ProductEntry/>);
    expect(await screen.findByRole("link", { name: "Go to migration" })).toHaveAttribute("href", `/migrate-resolve?session=${id}`);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1]?.method).toBeUndefined();
  });
  it("renders all ten concise Learn topics with contextual destinations", () => {
    render(<Learn/>);
    for (const topic of topics) {
      expect(screen.getByRole("link", { name: topic.title })).toHaveAttribute("href", `#${topic.id}`);
      expect(document.getElementById(topic.id)?.tagName).toBe("DETAILS");
    }
    // With no migration selected, each topic leads to My Migration, never the marketing Product page.
    const links = screen.getAllByRole("link", { name: "Go to My Migration", hidden: true });
    expect(links).toHaveLength(10);
    for (const link of links) expect(link).toHaveAttribute("href", "/workspace");
    expect(document.querySelector('a[href^="/product"]')).toBeNull();
  });
  it.each(["query", "storage"])("keeps the migration session on Learn topic links (from %s)", async source => {
    sessionStorage.clear();
    if (source === "query") window.history.replaceState(null, "", `/learn?session=${id}`);
    else { window.history.replaceState(null, "", "/learn"); sessionStorage.setItem("movebooks-migration-session", id); }
    render(<Learn/>);
    const links = await screen.findAllByRole("link", { name: /in your migration$/, hidden: true });
    expect(links).toHaveLength(10);
    const reconciliation = within(document.getElementById("reconciliation") as HTMLElement).getByRole("link", { hidden: true });
    expect(reconciliation).toHaveTextContent("Open Validate in your migration");
    expect(reconciliation).toHaveAttribute("href", `/validate-configure?session=${id}`);
    const mappings = within(document.getElementById("mappings") as HTMLElement).getByRole("link", { hidden: true });
    expect(mappings).toHaveAttribute("href", `/plan-map-approve?session=${id}`);
    expect(document.querySelector('a[href^="/product"]')).toBeNull();
    sessionStorage.clear();
  });
  it("ignores an invalid stored session on Learn topic links", async () => {
    sessionStorage.setItem("movebooks-migration-session", "../../private");
    render(<Learn/>);
    await waitFor(() => expect(screen.getAllByRole("link", { name: "Go to My Migration", hidden: true })).toHaveLength(10));
    sessionStorage.clear();
  });
  it("returns from Learn to the referenced step without fetching or changing progress", () => {
    window.history.replaceState(null, "", `/learn?stage=3&session=${id}#reconciliation`);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Learn/>);
    expect(screen.getByRole("link", { name: "Return to verify" })).toHaveAttribute("href", `/validate-configure?session=${id}`);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not invent a current migration from invalid Learn context", () => {
    window.history.replaceState(null, "", "/learn?stage=99&session=invalid");
    render(<Learn/>);
    expect(screen.getByRole("link", { name: "Go to migration" })).toHaveAttribute("href", "/workspace");
  });
  it("uses sentence-case landing headings and explicit hero destinations", () => {
    render(<Home/>);
    for (const name of ["The questions behind every move", "How MoveBooks works", "Trust by design"]) {
      expect(screen.getByRole("heading", { name })).toBeVisible();
    }
    expect(screen.getByRole("link", { name: "Start my migration" })).toHaveAttribute("href", "/workspace");
    expect(screen.getByRole("link", { name: "See how it works" })).toHaveAttribute("href", "#how-it-works");
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
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(() => json(evidence));
    render(<Trust/>);
    expect(await screen.findByText("Assessment Agent reviewed source evidence")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Current journey stage: Move" })).toBeVisible();
    expect(screen.getByText("Tool: check_balance")).toBeVisible();
    expect(screen.getByRole("heading", { name: "AI recommendation" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Deterministic verification" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Human decision" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Beta limitations" })).toBeVisible();
    expect(screen.getByText(/not a production or compliance-ready service/)).toBeVisible();
    fireEvent.click(screen.getByText("Sign-in, saved progress and data limits"));
    expect(screen.getByText(/Public-Beta cloud uploads remain disabled/)).toBeVisible();
    expect(screen.getByText(/approval identity is checked on the server/)).toBeVisible();
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
    expect(screen.getByRole("link", { name: "Return to migration" })).toHaveAttribute("href", `/validate-configure?session=${id}`);
    expect(screen.getByRole("link", { name: "Learn about this step" })).toHaveAttribute("href", "/learn#reconciliation");
    expect(screen.getByRole("link", { name: "Prepare issue draft" }).getAttribute("href")).not.toContain("raw_data");
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
