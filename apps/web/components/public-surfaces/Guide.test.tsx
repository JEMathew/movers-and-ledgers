import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { Guide, guideSections } from "./Guide";
import { phases, publicLinks } from "./content";

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
    const known = new Set([...publicLinks.map(([, href]) => href), "/try-your-data", "/learn"]);
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
    expect(screen.getByText("AI suggestions are policy-based; no live model is active.")).toBeInTheDocument();
    expect(screen.getByText(/The request itself approves nothing/)).toBeVisible();
    expect(screen.queryByText(/QuickBooks|Intuit/i)).not.toBeInTheDocument();
  });
  it("makes no requests and is a public route in the navigation", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Guide/>);
    expect(fetch).not.toHaveBeenCalled();
    expect(publicLinks).toContainEqual(["Guide", "/guide"]);
    expect(middleware(new NextRequest("http://localhost/guide")).headers.get("location")).toBeNull();
  });
});
