import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { journeyStepFor } from "../journey/journey";
import {
  AI_ASSISTANCE_STATUS, AiStatusBadge, formatApiAmount, MoneyFigure, StageBar, StatusChip,
  V2_STAGE_NAMES, V2_STATUS_LABEL, v2MappingStatus, v2Stages,
} from "./index";

const stagesFor = (status: string, detail?: string) => v2Stages(journeyStepFor(status), status, detail);

describe("V2 AI status rule", () => {
  it("stays Planned until a separate release gate verifies live inference", () => {
    expect(AI_ASSISTANCE_STATUS).toBe("planned");
    render(<AiStatusBadge withDetail />);
    expect(screen.getByText("Planned · not available in the Beta")).toBeVisible();
  });
});

describe("V2 five-stage model", () => {
  it("uses exactly Understand, Prepare, Move, Verify, Start", () => {
    expect(V2_STAGE_NAMES).toEqual(["Understand", "Prepare", "Move", "Verify", "Start"]);
  });

  it.each([
    ["CREATED", "Understand"], ["ASSESSED", "Prepare"], ["MAPPING", "Prepare"], ["AWAITING_APPROVAL", "Prepare"],
    ["MIGRATING", "Move"], ["MIGRATION_PAUSED", "Move"], ["VALIDATING", "Verify"], ["VALIDATED", "Verify"],
    ["CONFIGURED", "Start"], ["READY_FOR_FIRST_PRODUCTIVE_USE", "Start"],
  ])("workflow status %s puts the person in %s", (status, stage) => {
    const stages = stagesFor(status)!;
    expect(stages.filter((item) => item.status === "current").map((item) => item.name)).toEqual([stage]);
    const current = (V2_STAGE_NAMES as readonly string[]).indexOf(stage);
    stages.forEach((item, index) => expect(item.status).toBe(index < current ? "done" : index === current ? "current" : "locked"));
  });

  it("marks every stage done only after verified first productive use", () => {
    expect(stagesFor("VERIFIED_FIRST_PRODUCTIVE_USE")!.every((item) => item.status === "done")).toBe(true);
  });

  it("never guesses a position for an unknown status", () => {
    expect(stagesFor("SOMETHING_NEW")).toBeNull();
  });

  it("renders one current stage, the step detail and a compact phone line", () => {
    render(<StageBar stages={stagesFor("MAPPING", "Now: map and approve")!} />);
    const nav = screen.getByRole("navigation", { name: "Migration stages" });
    const current = within(nav).getAllByRole("listitem").filter((item) => item.getAttribute("aria-current") === "step");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Prepare");
    expect(current[0]).toHaveTextContent("Now: map and approve");
    expect(nav).toHaveTextContent("Prepare · stage 2 of 5");
  });
});

describe("V2 mapping states", () => {
  it.each([
    ["REVIEW_REQUIRED", "MEDIUM", "needs_review"], ["PROPOSED", "LOW", "needs_review"], ["BLOCKED", "LOW", "blocked"],
    ["REJECTED", "HIGH", "rejected"], ["APPROVED", "LOW", "approved"], ["MODIFIED", "MEDIUM", "changed"],
    ["AUTO_ACCEPTABLE", "LOW", "low_risk"], ["AUTO_ACCEPTABLE", "MEDIUM", "needs_review"],
  ] as const)("%s with %s risk shows as %s", (state, risk, expected) => {
    expect(v2MappingStatus(state, risk)).toBe(expected);
  });

  it("gives Needs review, Blocked and Rejected three different labels and looks", () => {
    const { container } = render(<><StatusChip status="needs_review" /><StatusChip status="blocked" /><StatusChip status="rejected" /></>);
    const labels = ["needs_review", "blocked", "rejected"].map((state) => V2_STATUS_LABEL[state as keyof typeof V2_STATUS_LABEL]);
    expect(new Set(labels).size).toBe(3);
    expect(Array.from(container.querySelectorAll("[data-state]")).map((chip) => chip.getAttribute("data-state"))).toEqual(["needs_review", "blocked", "rejected"]);
  });
});

describe("V2 money figure", () => {
  it("formats the API's decimal string without recalculating it", () => {
    render(<MoneyFigure label="First invoice" amount="107.25" currency="USD" />);
    expect(screen.getByText("USD 107.25")).toBeVisible();
  });

  it("keeps large amounts exact and groups thousands", () => {
    expect(formatApiAmount("12345678901234.57", "USD")).toBe("USD 12,345,678,901,234.57");
    expect(formatApiAmount("-20.00", "USD")).toBe("USD -20.00");
  });

  it.each(["", "  ", "abc", "1,000.00"])("never shows a malformed value %j as money", (value) => {
    expect(formatApiAmount(value, "USD")).toBe("Not available");
  });

  it("says Not available instead of inventing a value", () => {
    render(<MoneyFigure label="Trial balance difference" amount="" currency="USD" />);
    expect(screen.getByText("Not available")).toBeVisible();
  });
});

describe("V2 component sheet", () => {
  it("renders every primitive inside the scoped V2 theme with samples labelled", async () => {
    const { V2ComponentSheet } = await import("./V2ComponentSheet");
    render(<V2ComponentSheet />);
    const sheet = screen.getByTestId("v2-component-sheet");
    expect(sheet).toHaveClass("mb-v2");
    expect(screen.getAllByRole("navigation", { name: "Migration stages" })).toHaveLength(2);
    expect(screen.getByText("First invoice (sample)")).toBeVisible();
    expect(screen.getByText("Not available")).toBeVisible();
    expect(screen.getByText("Example of planned behaviour. Not live model output.")).toBeVisible();
    expect(sheet.textContent).not.toMatch(/\bLive\b/);
  });
});
