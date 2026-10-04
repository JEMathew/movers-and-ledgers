import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkflowHelp } from "./WorkflowHelp";
vi.mock("next/navigation", () => ({ usePathname: () => "/assess" }));
describe("context after a same-page new assessment", () => {
  it("uses the current URL session instead of a captured old session", () => {
    const oldId = "11111111-1111-4111-8111-111111111111";
    const newId = "22222222-2222-4222-8222-222222222222";
    window.history.replaceState(null, "", `/assess?session=${oldId}`);
    sessionStorage.setItem("movebooks-migration-session", oldId);
    render(<WorkflowHelp/>);
    window.history.replaceState(null, "", `/assess?session=${newId}`);
    const link = screen.getByRole("link", { name: "Trust & Evidence" });
    // Stop actual navigation while exercising the real React click handler.
    link.addEventListener("click", event => event.preventDefault());
    fireEvent.click(link);
    expect(link).toHaveAttribute("href", `http://localhost:3000/trust?session=${newId}`);
    expect(link.getAttribute("href")).not.toContain(oldId);
    const learn = screen.getByRole("link", { name: "Learn About Understand" });
    learn.addEventListener("click", event => event.preventDefault());
    fireEvent.click(learn);
    expect(learn).toHaveAttribute("href", `http://localhost:3000/learn?stage=0&session=${newId}#evidence`);
  });
});
