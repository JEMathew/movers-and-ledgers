import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhaseProgress, TaskContext } from "./PhaseProgress";
import { PROCESSING, projectJourney } from "./journey";

const id = "55555555-5555-4555-8555-555555555555";
describe("five-phase task progress", () => {
  it.each([
    ["CREATED", 0], ["ASSESSED", 1], ["AWAITING_APPROVAL", 1], ["APPROVED", 2],
    ["RESOLVING", 2], ["VALIDATION_BLOCKED", 3], ["CONFIGURATION_REVIEW_REQUIRED", 3],
    ["CONFIGURED", 4], ["ONBOARDING_BLOCKED", 4], ["FIRST_PRODUCTIVE_USE_IN_PROGRESS", 4],
  ])("projects %s without enabling forward navigation", (status, expected) => {
    render(<PhaseProgress {...projectJourney({ status, mappingIssues: 0 })} status={status} session={id} />);
    const list = screen.getAllByRole("list", { name: "Five-phase migration journey" })[0];
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items[expected]).toHaveAttribute("aria-current", "step");
    expect(items.slice(expected + 1).every(item => !item.querySelector("a"))).toBe(true);
    expect(within(list).getAllByRole("link").every(link => link.getAttribute("href")?.endsWith(`session=${id}`))).toBe(true);
    expect(screen.getByText("Five phases and operational steps").closest("details")).not.toHaveAttribute("open");
  });
  it("keeps readiness held during Prepare and recovery within Move", () => {
    const view = render(<PhaseProgress {...projectJourney({ status: "MAPPING", readinessIssues: 2 })} session={id} />);
    expect(screen.getAllByRole("list", { name: "Five-phase migration journey" })[0].firstElementChild).toHaveTextContent("UnderstandBlocked");
    view.rerender(<PhaseProgress {...projectJourney({ status: "RESOLVING" })} session={id} />);
    const move = screen.getAllByRole("list", { name: "Five-phase migration journey" })[0].children[2];
    expect(move).toHaveTextContent("MoveNeeds Attention");
    expect(move).not.toHaveTextContent("Completed");
  });
  it.each(["loading", "unavailable"] as const)("assumes no phase or navigation when %s", unknown => {
    render(<PhaseProgress current={null} unknown={unknown} session={id} />);
    const list = screen.getAllByRole("list", { name: "Five-phase migration journey" })[0];
    expect(list.querySelector("[aria-current]")).toBeNull();
    expect(list.querySelector("a")).toBeNull();
    expect(list.textContent).not.toContain("Completed");
  });
  it("does not present a measured percentage for named work", () => {
    render(<PhaseProgress current={0} processing={PROCESSING.assess} />);
    expect(screen.getAllByRole("status").find(item => item.textContent?.includes("Assessing"))).not.toHaveTextContent("%");
    fireEvent.click(screen.getByText("Five phases and operational steps"));
    expect(screen.getByRole("list", { name: "Migration Journey" })).toBeVisible();
  });
  it("keeps context navigation tied to the selected reference", () => {
    render(<TaskContext phase={4} session={id} />);
    expect(screen.getByRole("link", { name: "Help with this task" })).toHaveAttribute("href", `/support?session=${id}&stage=4`);
    expect(screen.getByRole("link", { name: "Evidence & results" })).toHaveAttribute("href", `/trust?view=evidence&session=${id}`);
  });
});
