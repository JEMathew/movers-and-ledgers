import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentActivityItem, Button, EmptyState, Progress, Select, StatusBadge, Stepper, Tabs } from "@/components/ui";

describe("design-system accessibility contracts", () => {
  it("renders status with icon-independent text", () => {
    render(<StatusBadge status="REQUIRES APPROVAL" />);
    expect(screen.getByText("REQUIRES APPROVAL")).toBeVisible();
  });

  it("exposes numeric progress to assistive technology", () => {
    render(<Progress label="Migration readiness" value={68} />);
    expect(screen.getByRole("progressbar", { name: "Migration readiness" })).toHaveAttribute("aria-valuenow", "68");
  });

  it("gives empty states an explicit heading", () => {
    render(<EmptyState title="No blockers" description="Everything is ready." />);
    expect(screen.getByRole("heading", { name: "No blockers" })).toBeVisible();
  });

  it("supports arrow-key navigation between tabs", () => {
    render(<Tabs items={[
      { id: "findings", label: "Findings", content: "Finding list" },
      { id: "evidence", label: "Evidence", content: "Evidence list" },
    ]} />);

    const findings = screen.getByRole("tab", { name: "Findings" });
    const evidence = screen.getByRole("tab", { name: "Evidence" });
    findings.focus();
    fireEvent.keyDown(findings, { key: "ArrowRight" });

    expect(evidence).toHaveFocus();
    expect(evidence).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Evidence list");
  });

  it("keeps reusable buttons from submitting forms by default", () => {
    render(<Button>Review decision</Button>);
    expect(screen.getByRole("button", { name: "Review decision" })).toHaveAttribute("type", "button");
  });

  it("associates select errors with the invalid control", () => {
    render(<Select label="Base currency" error="Choose a supported currency"><option>USD</option></Select>);
    const select = screen.getByRole("combobox", { name: "Base currency" });
    const error = screen.getByText("Choose a supported currency");

    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAttribute("aria-describedby", error.id);
  });

  it("announces completed and current migration steps", () => {
    render(<Stepper steps={[{ label: "Discover" }, { label: "Assess" }]} current={1} />);
    const [completed, current] = screen.getAllByRole("listitem");
    expect(completed).toHaveTextContent("Discover — Completed");
    expect(current).toHaveTextContent("Assess — Current step");
  });

  it("announces agent activity state without relying on its icon", () => {
    render(<AgentActivityItem title="Source profile" detail="Records inspected." time="Now" complete />);
    expect(screen.getByText(/Source profile/)).toHaveTextContent("Completed: Source profile");
  });
});
