import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ redirect: vi.fn((url: string) => { throw new Error(`REDIRECT ${url}`); }) }));
vi.mock("next/navigation", () => navigation);

import Approvals from "@/app/approvals/page";
import Reports from "@/app/reports/page";
import { Footer } from "@/components/Footer";
import { memberLinks, publicLinks } from "@/components/public-surfaces/content";

const id = "11111111-1111-4111-8111-111111111111";
const params = (value: { session?: string | string[] }) => ({ searchParams: Promise.resolve(value) });

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" ? [] : sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("legacy /approvals and /reports routes", () => {
  it.each([
    ["approvals", Approvals, `/plan-map-approve?session=${id}`],
    ["reports", Reports, `/validate-configure?session=${id}`],
  ] as const)("/%s keeps working and opens the session's own migration step", async (_name, Page, target) => {
    await expect(Page(params({ session: id }))).rejects.toThrow(`REDIRECT ${target}`);
  });
  it.each([[Approvals], [Reports]])("sends anyone without a valid session reference to My Migration, never to Trust", async Page => {
    for (const value of [{}, { session: "../../private" }, { session: [id, id] }, { session: "session-001" }]) {
      await expect(Page(params(value))).rejects.toThrow("REDIRECT /workspace");
    }
    for (const call of navigation.redirect.mock.calls) expect(call[0]).not.toMatch(/^\/trust/);
  });
  it("leaves no placeholder page or non-functional sign-in button behind", () => {
    const root = process.cwd();
    expect(existsSync(join(root, "components/JourneyPage.tsx"))).toBe(false);
    const offenders = ["app", "components"].flatMap(dir => sources(join(root, dir)))
      .filter(file => /JourneyPage|Protected experience|Beta scaffold defines this boundary/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
  it("keeps both routes out of normal navigation", () => {
    for (const [, href] of [...publicLinks, ...memberLinks]) expect(href).not.toMatch(/^\/(approvals|reports)/);
  });
});

describe("footer", () => {
  it("carries Feedback with Help and the Beta limits, outside the primary navigation", () => {
    render(<Footer />);
    const footer = screen.getByRole("navigation", { name: "Footer" });
    for (const [name, href] of [["Getting Started Guide", "/guide"], ["Help", "/support"], ["Feedback", "/feedback"], ["Beta Limitations", "/trust#beta-limitations"]]) {
      expect(within(footer).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(publicLinks.map(([label]) => label as string)).not.toContain("Feedback");
    expect(screen.getByText(/independent synthetic product concept/)).toBeInTheDocument();
  });
});
