import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscoverAssessExperience } from "@/components/discover-assess/DiscoverAssessExperience";
import { MigrationJourney } from "./MigrationJourney";
import { PROCESSING } from "./journey";

afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); });
const steps = () => within(screen.getByRole("list", { name: "Migration Journey" })).getAllByRole("listitem");

describe("journey processing", () => {
  it("marks only the current step as processing and explains the work in stages", () => {
    render(<MigrationJourney current={1} held={{ index: 0, label: "Blocked" }} processing={{ ...PROCESSING.assess, stage: 1 }} />);
    expect(steps()[1]).toHaveTextContent("PlanAssessing…");
    expect(steps()[1]).toHaveClass("is-processing");
    expect(steps().filter(step => step.classList.contains("is-processing"))).toHaveLength(1);
    // Held, completed and idle steps never carry the animated state.
    expect(steps()[0]).toHaveClass("is-blocked");
    expect(steps()[0]).not.toHaveClass("is-processing");
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Assessing your migration readiness");
    expect(status).toHaveTextContent("Reviewing your books, identifying risks, and preparing recommendations.");
    expect(within(status).getAllByRole("listitem").map(item => item.textContent)).toEqual([
      "Reviewing your data · Done", "Checking migration risks · In progress", "Preparing recommendations · Next",
    ]);
    expect(status).not.toHaveTextContent(/%/);
    expect(screen.getByRole("region", { name: "Migration Journey" })).toHaveAttribute("aria-busy", "true");
  });
  it("shows nothing animated when nothing is running", () => {
    render(<MigrationJourney current={2} />);
    expect(document.querySelector(".is-processing")).toBeNull();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("region", { name: "Migration Journey" })).toHaveAttribute("aria-busy", "false");
  });
  it("uses business language only", () => {
    const text = JSON.stringify(PROCESSING);
    expect(text).not.toMatch(/agent|orchestrat|schema|deterministic|pipeline|LLM|%/i);
  });
});

describe("Assess processing", () => {
  it("shows the work on the Assess step, then completes it", async () => {
    const json = (value: unknown, status = 200) => ({ ok: status < 400, status, json: async () => value });
    let finish: (value: unknown) => void = () => undefined;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ id: "session-1" }, 201))
      .mockReturnValueOnce(new Promise(resolveDiscovery => { finish = resolveDiscovery; }));
    vi.stubGlobal("fetch", fetchMock);
    render(<DiscoverAssessExperience />);
    fireEvent.click(screen.getByRole("button", { name: /Check If My Books Are Ready to Migrate/ }));
    await waitFor(() => expect(steps()[0]).toHaveTextContent("AssessAssessing…"));
    expect(screen.getByRole("status")).toHaveTextContent("Reviewing your data · In progress");
    expect(document.querySelector(".migration-orb")).toBeNull();
    fetchMock
      .mockResolvedValueOnce(json({ readiness: "READY", blocker_count: 0, warning_count: 0, decision_basis: [], recommended_next_actions: [], ready_areas: [], policy_version: "p1" }))
      .mockResolvedValueOnce(json([]));
    await act(async () => finish(json({ company_name: "Harbor Light Books", findings: [], profiles: [], fixture_version: "v1", synthetic: true })));
    await screen.findByRole("heading", { name: "Migration Readiness" });
    expect(steps()[0]).toHaveTextContent("AssessCompleted");
    expect(steps()[0].querySelector("svg.lucide-check")).not.toBeNull();
    expect(document.querySelector(".is-processing")).toBeNull();
  });
});

describe("motion", () => {
  const css = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");
  it("has no decorative orbit left", () => {
    expect(css).not.toMatch(/migration-orb|mb-orbit/);
  });
  it("animates only the processing node and stops it for reduced motion", () => {
    const journeyAnimations = css.split("\n").filter(line => line.includes(".journey-steps") && line.includes("animation") && !line.includes("animation: none"));
    expect(journeyAnimations).toHaveLength(1);
    expect(journeyAnimations[0]).toContain(".is-processing");
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toMatch(/\.journey-steps \.is-processing \.step-marker::after \{ animation: none;/);
  });
});
