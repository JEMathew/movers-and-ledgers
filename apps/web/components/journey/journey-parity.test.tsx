import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscoverAssessExperience } from "@/components/discover-assess/DiscoverAssessExperience";
import { MyMigration } from "@/components/MyMigration";
import { journeyPosition } from "./journey";

afterEach(() => { cleanup(); vi.restoreAllMocks(); sessionStorage.clear(); window.history.replaceState(null, "", "/"); });

const journey = () => within(screen.getByRole("list", { name: "Migration Journey" })).getAllByRole("listitem").map(step => step.textContent);
const fresh = ["AssessCurrent", "PlanNot Started", "MapNot Started", "ApproveNot Started", "MigrateNot Started", "ResolveNot Started", "ValidateNot Started", "Set UpNot Started", "Start UsingNot Started"];

describe("journey starting state", () => {
  it("keeps the empty home explicit and starts the operational journey only in Assess", async () => {
    vi.spyOn(globalThis, "fetch");
    render(<MyMigration />);
    expect(await screen.findByRole("link", { name: "Start a sample migration" })).toHaveAttribute("href", "/assess?sample=harbor-light-migrate-demo");
    expect(screen.queryByRole("list", { name: "Migration Journey" })).not.toBeInTheDocument();
    cleanup();
    render(<DiscoverAssessExperience />);
    expect(journey()).toEqual(fresh);
    expect(document.body).not.toHaveTextContent(/Progress not confirmed|Progress unavailable/);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps unknown for genuine reads and failures only", () => {
    expect(journeyPosition({ selected: false })).toBe(0);
    expect(journeyPosition({ selected: true, loading: true, step: 3 })).toBeNull();
    expect(journeyPosition({ selected: true, failed: true, step: 3 })).toBeNull();
    expect(journeyPosition({ selected: true, step: 3 })).toBe(3);
  });
});
