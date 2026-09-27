import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TryYourData } from "./TryYourData";
import { intakeEvents } from "./events";

const id = "11111111-1111-4111-8111-111111111111";
const report = { package_id: id, status: "READY", files: [{ name: "customers.csv", type: "csv", rows: 2, schema_status: "READY", ignored_fields: [] }], issues: [], activity: ["Package received", "Files validated"] };
const fetchMock = vi.fn();
function file(name = "customers.csv") {
  const f = new File(["id,display_name\nc1,Name"], name);
  Object.defineProperty(f, "arrayBuffer", { value: async () => new TextEncoder().encode("id,display_name\nc1,Name").buffer });
  return f;
}
function select(f = file()) {
  fireEvent.change(screen.getByLabelText("Accounting package files"), { target: { files: [f] } });
}
function consent() { fireEvent.click(screen.getByRole("checkbox", { name: /I have permission/ })); }
function response(data: unknown, status = 200) { return { ok: status < 400, status, json: async () => data }; }
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); sessionStorage.clear(); });
afterEach(() => vi.unstubAllGlobals());

describe("controlled intake", () => {
  it("has accessible file picker, privacy notice and no automatic upload", () => {
    render(<TryYourData/>); select();
    expect(screen.getByLabelText("Accounting package files")).toHaveAttribute("type", "file");
    expect(screen.getByRole("button", { name: "Validate package" })).toBeDisabled();
    expect(screen.getByText(/No data goes to an LLM/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("validates, requires review, creates same journey, and focuses result", async () => {
    fetchMock.mockResolvedValueOnce(response(report)).mockResolvedValueOnce(response({ session_id: id, workflow_status: "ASSESSED" }));
    render(<TryYourData/>); select(); consent();
    fireEvent.click(screen.getByRole("button", { name: "Validate package" }));
    await screen.findByText("Package status: READY");
    const create = screen.getByRole("button", { name: /Create workspace and enter/ });
    expect(create).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("heading", { name: "2. Review validation" })).toHaveFocus());
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed findings/ }));
    fireEvent.click(create);
    expect(await screen.findByRole("link", { name: "Review Discover → Assess" })).toHaveAttribute("href", `/assess?session=${id}`);
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(id);
    expect(fetchMock.mock.calls[1][0]).toContain(`/intake/${id}/workspace`);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ reviewed: true });
  });
  it("blocks bad packages, supports removal/replacement and retry without retaining approval", async () => {
    fetchMock.mockResolvedValueOnce(response({ ...report, status: "BLOCKED", issues: [{ file: "customers.csv", row: 2, severity: "BLOCKER", message: "Missing identifier", why: "Identity must be preserved", action: "Replace the file", can_continue: false }] })).mockResolvedValueOnce(response({})).mockResolvedValueOnce(response(report));
    render(<TryYourData/>); select(); consent();
    fireEvent.click(screen.getByRole("button", { name: "Validate package" }));
    await screen.findByText("Missing identifier");
    expect(screen.getByRole("checkbox", { name: /I reviewed findings/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Remove customers.csv" }));
    expect(screen.queryByText("Package status: BLOCKED")).not.toBeInTheDocument();
    select(); fireEvent.click(screen.getByRole("button", { name: "Validate package" }));
    await screen.findByText("Package status: READY");
    expect(screen.getByRole("button", { name: /Create workspace and enter/ })).toBeDisabled();
  });
  it("announces failure and rejects oversized files before network", async () => {
    render(<TryYourData/>); select(new File([new Uint8Array(256 * 1024 + 1)], "customers.csv")); consent();
    fireEvent.click(screen.getByRole("button", { name: "Validate package" }));
    expect(await screen.findByText(/Choose up to 9 files/)).toBeInTheDocument();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("handles API expiry without fabricated workspace or downstream navigation", async () => {
    fetchMock.mockResolvedValue(response(null, 404));
    render(<TryYourData/>); select(); consent(); fireEvent.click(screen.getByRole("button", { name: "Validate package" }));
    await screen.findByText(/Package expired/);
    expect(screen.queryByRole("link", { name: "Review Discover → Assess" })).not.toBeInTheDocument();
  });
  it("defines ten uninstrumented contracts with server-owned outcomes", () => {
    expect(Object.keys(intakeEvents)).toHaveLength(10);
    expect(intakeEvents.workspace_created_from_upload.source).toBe("server");
    expect(intakeEvents.package_validation_passed.trigger).toContain("not migration readiness");
  });
});
