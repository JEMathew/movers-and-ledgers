import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Guide, guideSections } from "./Guide";
import { phases } from "./content";

describe("compact task guide", () => {
  it("retains twelve stable instructions as keyboard-reachable native disclosures", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Guide/>);
    expect(guideSections).toHaveLength(12);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Try the Beta" })).toHaveAttribute("href", "/workspace");
    for (const section of guideSections) {
      const details = document.getElementById(section.id)!;
      expect(details.tagName).toBe("DETAILS");
      expect(details).not.toHaveAttribute("open");
      expect(details.querySelector("summary")).toHaveTextContent(section.title);
      expect(details).toHaveAttribute("aria-labelledby", `${section.id}-heading`);
    }
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
  it.each(guideSections)("opens and focuses legacy #$id without any workflow request", ({ id }) => {
    window.history.replaceState(null, "", `/guide#${id}`);
    render(<Guide/>);
    const details = document.getElementById(id)!;
    expect(details).toHaveAttribute("open");
    expect(details.querySelector("summary")).toHaveFocus();
    expect(document.querySelectorAll("details[open]")).toHaveLength(1);
  });
  it("keeps phase destinations, reconsideration controls and local limits accessible", () => {
    render(<Guide/>);
    fireEvent.click(screen.getByText("The five-phase journey"));
    for (const phase of phases) expect(screen.getByRole("link", { name: `Learn more about ${phase.name}` })).toHaveAttribute("href", `/learn#${phase.topic}`);
    fireEvent.click(screen.getByText("Reconsidering a decision"));
    for (const copy of [/before migration starts/, /enter a reason/, /original rejection, actor, timestamp, reason and evidence/, /The request itself approves nothing/, /Only the authenticated owner/, /never overwrites the original rejection or bypasses/]) expect(screen.getByText(copy)).toBeVisible();
    fireEvent.click(screen.getByText("Local test-export evaluation"));
    expect(screen.getByText(/Cloud uploads are unavailable, including for signed-in users/)).toBeVisible();
    expect(screen.getByText(/1,000 rows and 256 KiB/)).toBeVisible();
    expect(document.body).not.toHaveTextContent(/first real task|First Productive Use|FPU|QuickBooks|Intuit/);
  });
  it("assigns full concept/control explanations to Learn and Trust", () => {
    render(<Guide/>);
    fireEvent.click(screen.getByText("Approvals and human control"));
    expect(screen.getByRole("link", { name: "Why approvals matter" })).toHaveAttribute("href", "/learn#approvals");
    expect(screen.getByRole("link", { name: "Financial controls and accountability" })).toHaveAttribute("href", "/trust#financial-controls");
  });
});
