import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { Guide, guideSections } from "./Guide";
import { footerLinks, phases, publicLinks } from "./content";

afterEach(() => vi.restoreAllMocks());

describe("User Guide", () => {
  it("lists every section in a keyboard-reachable contents nav with matching labelled anchors", () => {
    render(<Guide/>);
    expect(guideSections).toHaveLength(12);
    const toc = screen.getByRole("navigation", { name: "User guide contents" });
    for (const section of guideSections) {
      expect(within(toc).getByRole("link", { name: new RegExp(section.title) })).toHaveAttribute("href", `#${section.id}`);
      expect(screen.getByRole("region", { name: section.title })).toHaveAttribute("id", section.id);
    }
  });
  it("has one page heading and presents all five stages with their Learn topics", () => {
    render(<Guide/>);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const phase of phases) expect(screen.getByRole("link", { name: `Learn more about ${phase.name}` })).toHaveAttribute("href", `/learn#${phase.topic}`);
    expect(screen.getByText("Outcome: Business Ready · Verified")).toBeVisible();
    expect(screen.getByText("Verified First Productive Use")).toBeVisible();
  });
  it("links only to existing product routes", () => {
    render(<Guide/>);
    const known = new Set([...publicLinks.map(([, href]) => href), ...footerLinks.map(([, href]) => href.split("#")[0]), "/try-your-data", "/learn", "/workspace", "/product"]);
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href")!;
      if (href.startsWith("#")) continue;
      expect(known.has(href.split("#")[0])).toBe(true);
    }
  });
  it("keeps technical detail behind native disclosure and states Beta limits honestly", () => {
    render(<Guide/>);
    expect(document.querySelectorAll("details > summary").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/Not production-ready, and not a live migration/)).toBeInTheDocument();
    expect(screen.getByText("AI suggestions are advisory, never approval or financial verification.")).toBeInTheDocument();
    expect(screen.getByText(/The request itself approves nothing/)).toBeVisible();
    expect(screen.queryByText(/QuickBooks|Intuit/i)).not.toBeInTheDocument();
  });
  it("makes no requests and is a public route in the navigation", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Guide/>);
    expect(fetch).not.toHaveBeenCalled();
    expect(publicLinks).toContainEqual(["How It Works", "/guide"]);
    expect(middleware(new NextRequest("http://localhost/guide")).headers.get("location")).toBeNull();
  });
  it("explains merged pre-execution reconsideration without suggesting an approval bypass", () => {
    render(<Guide/>);
    const section = within(screen.getByRole("region", { name: "Reconsidering a decision" }));
    expect(section.getByText(/before migration starts/)).toBeVisible();
    expect(section.getByText(/enter a reason, then choose Request reconsideration/)).toBeVisible();
    expect(section.getByText(/original rejection, actor, timestamp, reason and evidence/)).toBeVisible();
    expect(section.getByText(/Only the authenticated owner can request or review/)).toBeVisible();
    expect(section.getByText(/never overwrites the original rejection or bypasses the remaining checks/)).toBeVisible();
    expect(screen.queryByText(/Rolling out in Beta|your build does not include it yet/)).not.toBeInTheDocument();
  });
  it("distinguishes local and cloud identity, persistence and intake without activating either", () => {
    render(<Guide/>);
    expect(screen.getByText(/Production builds without configured identity disable sign-in/)).toBeVisible();
    expect(screen.getByText(/cloud Google sign-in uses real authenticated identities/)).toBeVisible();
    expect(screen.getByText(/persists synthetic workspaces, approvals and checkpoints across restarts/)).toBeInTheDocument();
    expect(screen.getByText(/uploads remain disabled, including for signed-in users/)).toBeVisible();
    expect(screen.getByText(/availability follows the current deployment status/)).toBeVisible();
    expect(screen.queryByText(/cloud access is limited to authorized validation windows/)).not.toBeInTheDocument();
    expect(screen.getByText("Gemini guidance is disabled by default and limited to explicitly configured synthetic dev/test advice. Managed ADK remains disabled.")).toBeVisible();
  });
});
