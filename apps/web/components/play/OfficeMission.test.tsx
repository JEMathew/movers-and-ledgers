import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfficeMission } from "./OfficeMission";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function start() { fireEvent.click(screen.getByRole("button", { name: "Start mission" })); }
function shortcut(name: string) { fireEvent.click(screen.getByRole("button", { name })); }
function evidence() {
  fireEvent.click(screen.getByText("Object shortcuts · keyboard, touch & screen reader"));
  for (const name of ["desk", "ledger", "filing cabinet", "laptop"]) shortcut(`Inspect ${name}`);
}
function choose(balance: string, mapping: string) {
  fireEvent.change(screen.getByLabelText("Amount still held by the processor (USD)"), { target: { value: balance } });
  fireEvent.change(screen.getByLabelText("Destination for 1200 · Misc Clearing"), { target: { value: mapping } });
  fireEvent.click(screen.getByRole("button", { name: "Run readiness check" }));
}
describe("opening mission", () => {
  it("walks with the keyboard, interacts spatially, returns focus and resumes without losing evidence", () => {
    render(<OfficeMission />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
    start();
    const office = screen.getByRole("group", { name: /^Navigable office/ });
    expect(office).toHaveFocus();
    for (let i = 0; i < 4; i++) fireEvent.keyDown(office, { key: "ArrowUp" });
    expect(office).toHaveAccessibleName(/column 4, row 5.*Desk nearby/);
    fireEvent.keyDown(office, { key: "e" });
    expect(screen.getByRole("heading", { name: "A letter on Eli’s desk" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByText("Mission paused")).toBeVisible();
    expect(screen.getByRole("button", { name: "Close evidence & return to office" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Resume mission" }));
    expect(screen.getByRole("heading", { name: "A letter on Eli’s desk" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("heading", { name: "A letter on Eli’s desk" }), { key: "Escape" });
    expect(office).toHaveFocus();
    expect(screen.getByText("1 / 3")).toBeVisible();
  });
  it("supports touch movement and blocks readiness until the evidence is collected", () => {
    render(<OfficeMission />); start();
    fireEvent.click(screen.getByRole("button", { name: "Walk right" }));
    expect(screen.getByRole("group", { name: /^Navigable office/ })).toHaveAccessibleName(/column 5, row 9/);
    fireEvent.click(screen.getByRole("button", { name: "Inspect laptop in the office" }));
    expect(screen.getByRole("button", { name: "Run readiness check" })).toBeDisabled();
    expect(screen.getByText(/Readiness locked/)).toBeVisible();
    expect(screen.queryByRole("link", { name: /Explore Demo/ })).not.toBeInTheDocument();
  });
  it("makes a meaningful error, recovers, unlocks Demo, and never reads or mutates financial state", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    localStorage.setItem("unrelated-state", "retain");
    sessionStorage.setItem("movebooks-migration-session", "retain-session");
    render(<OfficeMission />); start(); evidence();
    choose("25.00", "bank");
    expect(screen.getByRole("status")).toHaveTextContent("Bank reconciliation failed");
    expect(screen.queryByRole("link", { name: /Explore Demo/ })).not.toBeInTheDocument();
    choose("25", "clearing");
    expect(screen.getByRole("status")).toHaveTextContent("Mission complete");
    expect(screen.getByRole("link", { name: /Explore Demo/ })).toHaveAttribute("href", "/simulator");
    expect(screen.getByRole("button", { name: "Run readiness check" })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem("unrelated-state")).toBe("retain");
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe("retain-session");
    expect(localStorage.length).toBe(1);
    expect(sessionStorage.length).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Restart mission" }));
    expect(screen.getByRole("button", { name: "Start mission" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Explore Demo/ })).not.toBeInTheDocument();
    localStorage.clear();
  });
  it("keeps form keys from moving Eli and honors muted-by-default sound", () => {
    const audio = vi.fn(function () {
      const gain = { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
      const oscillator = { frequency: { value: 0 }, connect: vi.fn(() => gain), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn() };
      return { resume: vi.fn().mockResolvedValue(undefined), suspend: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined), createGain: vi.fn(() => gain), createOscillator: vi.fn(() => oscillator), currentTime: 0 };
    });
    vi.stubGlobal("AudioContext", audio);
    render(<OfficeMission />);
    expect(screen.getByRole("button", { name: "Sound: off" })).toHaveAttribute("aria-pressed", "false");
    start(); evidence();
    const office = screen.getByRole("group", { name: /^Navigable office/ });
    const before = office.getAttribute("aria-label");
    fireEvent.keyDown(screen.getByLabelText("Amount still held by the processor (USD)"), { key: "ArrowUp" });
    expect(office.getAttribute("aria-label")).toBe(before);
    expect(audio).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Sound: off" }));
    expect(screen.getByRole("button", { name: "Sound: on" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Sound: on" }));
    expect(screen.getByRole("button", { name: "Sound: off" })).toHaveAttribute("aria-pressed", "false");
  });
  it("pauses when the browser tab is hidden", () => {
    render(<OfficeMission />); start();
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.getByText("Mission paused")).toBeVisible();
    expect(within(screen.getByLabelText("Touch movement controls")).getByRole("button", { name: "Walk up" })).toBeDisabled();
  });
});
