import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState, Progress, StatusBadge, Tabs } from "@/components/ui";

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
});
