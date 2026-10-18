import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceEntry } from "./WorkspaceEntry";
import { parseList } from "./journey/MigrationPicker";

const A = "11111111-1111-4111-8111-111111111111", B = "22222222-2222-4222-8222-222222222222";
const row = (id: string, name: string, status = "ASSESSED", created = "2026-10-18T00:00:00+00:00") => ({ id, company_name: name, status: "CREATED", workflow_status: status, created_at: created });
const page = (items: unknown[], extra: Record<string, unknown> = {}) => ({ items, next_cursor: null, incomplete: false, reason: null, skipped: 0, ...extra });
const json = (value: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(value), { status }));
const evidence = (id: string) => ({ id, synthetic: true, workflow_status: "ASSESSED", mapping_review: { total: 1, pending: 0 }, discovery: { findings: [] }, execution: { failures: [] }, validation_reports: [], configuration: { proposals: [] }, onboarding: { tasks: [], fpu: {} }, activity: [], human_decisions: [], events: [] });
const route = (list: () => Promise<Response>) => vi.spyOn(globalThis, "fetch").mockImplementation(input => {
  const url = String(input);
  const read = /migration-sessions\/([0-9a-f-]{36})\/intake-trust/.exec(url);
  return read ? json(evidence(read[1])) : list();
});

beforeEach(() => { sessionStorage.clear(); localStorage.clear(); window.history.replaceState({}, "", "/workspace"); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("owner-scoped migration listing in My Migration", () => {
  it("shows the welcome only when the account has no accessible migration", async () => {
    route(() => json(page([])));
    render(<WorkspaceEntry/>);
    expect(await screen.findByRole("link", { name: "Start a sample migration" })).toBeVisible();
  });
  it("never silently selects one of several migrations", async () => {
    route(() => json(page([row(A, "Harbor Light Books"), row(B, "Maple Street Studio", "RESOLVING")])));
    render(<WorkspaceEntry/>);
    const list = await screen.findByRole("list", { name: "Your migrations" });
    expect(within(list).getAllByRole("link")).toHaveLength(2);
    expect(within(list).getByRole("link", { name: /Maple Street Studio/ })).toHaveAttribute("href", `/workspace?session=${B}`);
    expect(within(list).getByText("Needs attention")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Start a sample migration" })).not.toBeInTheDocument();
  });
  it("opens the only migration directly when the history is complete", async () => {
    route(() => json(page([row(A, "Harbor Light Books")])));
    render(<WorkspaceEntry/>);
    expect(await screen.findByText(/Migration 11111111…1111/)).toBeVisible();
    expect(screen.queryByRole("list", { name: "Your migrations" })).not.toBeInTheDocument();
  });
  it("makes an incomplete history explicit even with a single migration", async () => {
    route(() => json(page([row(A, "Harbor Light Books")], { incomplete: true, reason: "scan_limit" })));
    render(<WorkspaceEntry/>);
    expect(await screen.findByRole("list", { name: "Your migrations" })).toBeVisible();
    expect(screen.getByText(/History may be incomplete/)).toBeVisible();
    expect(screen.getByText("Open a migration by reference")).toBeVisible();
  });
  it("never presents a failed listing as having no migrations", async () => {
    route(() => json({}, 503));
    render(<WorkspaceEntry/>);
    expect(await screen.findByRole("heading", { name: "Your migrations could not be checked" })).toBeVisible();
    expect(screen.getByText(/not the same as having none/)).toBeVisible();
    expect(screen.queryByRole("link", { name: "Start a sample migration" })).not.toBeInTheDocument();
  });
  it("a saved browser reference is a convenience: it opens, and the API authorises it", async () => {
    localStorage.setItem("movebooks-last-migration:demo", A);
    const fetch = route(() => json(page([])));
    render(<WorkspaceEntry/>);
    expect(await screen.findByText(/Migration 11111111…1111/)).toBeVisible();
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith("/migration-sessions?limit=20"))).toBe(false);
  });
  it("Switch migration lists every migration instead of the remembered one", async () => {
    localStorage.setItem("movebooks-last-migration:demo", A);
    window.history.replaceState({}, "", "/workspace?pick=1");
    route(() => json(page([row(A, "Harbor Light Books"), row(B, "Maple Street Studio")])));
    render(<WorkspaceEntry/>);
    expect(await screen.findByRole("list", { name: "Your migrations" })).toBeVisible();
  });
  it("loads more pages without duplicates", async () => {
    let calls = 0;
    route(() => json(++calls === 1 ? page([row(A, "One"), row(B, "Two")], { next_cursor: "c1" }) : page([row(B, "Two"), row("33333333-3333-4333-8333-333333333333", "Three")])));
    render(<WorkspaceEntry/>);
    fireEvent.click(await screen.findByRole("button", { name: "Show more migrations" }));
    await waitFor(() => expect(within(screen.getByRole("list", { name: "Your migrations" })).getAllByRole("link")).toHaveLength(3));
  });
  it("rejects a malformed listing instead of trusting it", () => {
    expect(() => parseList({ items: [{ id: "x" }], incomplete: false })).toThrow();
    expect(() => parseList({})).toThrow();
  });
});
