import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuidedDemo } from "./GuidedDemo";
import { demoPhases } from "./demo-content";
import { sampleEntry } from "./content";

// Tour rendering must never depend on identity or an authorized migration reader.
vi.mock("@/components/IdentityProvider", () => ({ useIdentity: () => { throw new Error("Tour requested identity"); } }));
vi.mock("./session", () => ({ useSessionView: () => { throw new Error("Tour requested a migration"); } }));
afterEach(() => vi.restoreAllMocks());
const next = () => fireEvent.click(screen.getByRole("button", { name: /^Next:|Finish demo$/ }));

describe("PR03 authored public Demo", () => {
  it("explores all five phases and debrief without requests, persistence or success events", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const xhr = vi.spyOn(XMLHttpRequest.prototype, "open");
    const stored = vi.spyOn(Storage.prototype, "setItem");
    const events = vi.spyOn(window, "dispatchEvent");
    render(<GuidedDemo/>);
    expect(screen.getByText(/No sign-in · No workspace changes/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    for (const [index, phase] of demoPhases.entries()) {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(phase.title);
      expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
      expect(screen.getByRole("button", { name: `Preview ${phase.name}, phase ${index + 1} of 5` })).toHaveAttribute("aria-current", "step");
      expect(screen.getByText(phase.insight)).toBeVisible();
      const evidence = screen.getByRole("region", { name: `${phase.name} sample evidence` });
      for (const [label, value] of phase.evidence) {
        expect(within(evidence).getByText(label)).toBeVisible();
        expect(within(within(evidence).getByText(label).parentElement!).getByText(value)).toBeVisible();
      }
      fireEvent.click(screen.getByText("How assistance and controls work"));
      expect(screen.getByText(phase.guidance)).toBeVisible();
      expect(screen.getByRole("link", { name: `Learn about ${phase.name.toLowerCase()}` })).toHaveAttribute("href", `/learn#${phase.topic}`);
      next();
    }
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("You’ve explored the five phases.");
    expect(screen.getByText(/No approvals, posting or verification occurred/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Try the Guided Migration" })).toHaveAttribute("href", `/sign-in?next=${encodeURIComponent(sampleEntry)}`);
    expect(fetch).not.toHaveBeenCalled();
    expect(xhr).not.toHaveBeenCalled();
    expect(stored).not.toHaveBeenCalled();
    expect(events).not.toHaveBeenCalled();
  });
  it("supports previous, arbitrary phase preview, debrief back and restart without granting workflow progress", () => {
    render(<GuidedDemo/>);
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    next();
    fireEvent.click(screen.getByRole("button", { name: "Previous phase" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(demoPhases[0].title);
    fireEvent.click(screen.getByRole("button", { name: "Back to introduction" }));
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview Start, phase 5 of 5" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous phase" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(demoPhases[4].title);
    next();
    fireEvent.click(screen.getByRole("button", { name: "Restart demo" }));
    expect(screen.getByRole("button", { name: "Start demo" })).toBeEnabled();
    expect(screen.queryByRole("link", { name: "Try the Guided Migration" })).not.toBeInTheDocument();
  });
  it("forgets the preview on remount and preserves an existing selected migration pointer", () => {
    sessionStorage.setItem("movebooks-migration-session", "11111111-1111-4111-8111-111111111111");
    const { unmount } = render(<GuidedDemo/>);
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    next();
    unmount();
    render(<GuidedDemo/>);
    expect(screen.getByRole("button", { name: "Start demo" })).toBeEnabled();
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe("11111111-1111-4111-8111-111111111111");
  });
  it("keeps ordinary exploration, existing sample deep links and legacy disclosures", () => {
    window.history.replaceState(null, "", "/simulator#sample-boundaries");
    render(<GuidedDemo/>);
    expect(document.querySelector("#sample-boundaries summary")).toHaveFocus();
    expect(screen.getByText(/No real customer or production provider data/)).toBeVisible();
    fireEvent.click(screen.getByText("Demo and Beta are different"));
    expect(screen.getByRole("link", { name: "Already signed in? Open the sample assessment" })).toHaveAttribute("href", sampleEntry);
    for (const [name, href] of [["Back to Home", "/"], ["Practice three decisions in Play", "/play"], ["Learn", "/learn"], ["Conceptual Product Vision video", "/#product-vision"]])
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
  });
  it("labels authored amounts and separates controls from AI advice", () => {
    render(<GuidedDemo/>);
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview Verify, phase 4 of 5" }));
    expect(screen.getByText(/Sample evidence/)).toBeVisible();
    expect(screen.getByText("USD 7.25 · blocked")).toBeVisible();
    fireEvent.click(screen.getByText("How assistance and controls work"));
    expect(screen.getByText(/not measured or calculated by this Demo/)).toBeVisible();
    expect(screen.queryByRole("button", { name: /Approve|Repair|Post|Retry|Validate/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Preview Prepare, phase 2 of 5" }));
    expect(document.querySelector("details[open]")).toBeNull();
    fireEvent.click(screen.getByText("How assistance and controls work"));
    expect(screen.getByText(/not calibrated live-model predictions/)).toBeVisible();
  });
});
