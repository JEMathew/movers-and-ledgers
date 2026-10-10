import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkflowHelp } from "./WorkflowHelp";
vi.mock("next/navigation", () => ({ usePathname: () => window.location.pathname, useSearchParams: () => new URLSearchParams(window.location.search) }));
describe("context after a same-page new assessment", () => {
  it("uses the current URL session instead of a captured old session", () => {
    const oldId = "11111111-1111-4111-8111-111111111111";
    const newId = "22222222-2222-4222-8222-222222222222";
    window.history.replaceState(null, "", `/assess?session=${oldId}`);
    sessionStorage.setItem("movebooks-migration-session", oldId);
    render(<WorkflowHelp/>);
    window.history.replaceState(null, "", `/assess?session=${newId}`);
    fireEvent.click(screen.getByText("Help for Understand"));
    const link = screen.getByRole("link", { name: "Evidence & Results" });
    // Stop actual navigation while exercising the real React click handler.
    link.addEventListener("click", event => event.preventDefault());
    fireEvent.click(link);
    expect(link).toHaveAttribute("href", `http://localhost:3000/trust?view=evidence&session=${newId}`);
    expect(link.getAttribute("href")).not.toContain(oldId);
    const learn = screen.getByRole("link", { name: "Learn About Understand" });
    learn.addEventListener("click", event => event.preventDefault());
    fireEvent.click(learn);
    expect(learn).toHaveAttribute("href", `http://localhost:3000/learn?stage=0&session=${newId}#evidence`);
  });
});

const phaseCases = [["Understand", "/assess", "journey"], ["Prepare", "/plan-map-approve", "approvals"], ["Move", "/migrate-resolve", "recovery"], ["Verify", "/validate-configure", "recovery"], ["Start", "/onboard-fpu", "journey"]];
it.each(phaseCases)("offers canonical guidance for %s without a request", (name, path, guide) => {
  window.history.replaceState(null, "", `${path}?session=invalid`);
  const fetch = vi.spyOn(globalThis, "fetch");
  render(<WorkflowHelp/>);
  fireEvent.click(screen.getByText(`Help for ${name}`));
  expect(screen.getByRole("link", { name: "Task instructions" })).toHaveAttribute("href", `/guide#${guide}`);
  const link = screen.getByRole("link", { name: "Evidence & Results" });
  link.addEventListener("click", event => event.preventDefault()); fireEvent.click(link);
  expect(link.getAttribute("href")).not.toContain("session=");
  expect(fetch).not.toHaveBeenCalled();
});
