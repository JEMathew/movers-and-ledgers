import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TryYourData } from "./TryYourData";
import { intakeEvents } from "./events";

const id = "11111111-1111-4111-8111-111111111111";
const report = { package_id: id, status: "READY", files: [{ name: "customers.csv", type: "csv", rows: 2, schema_status: "READY", ignored_fields: [] }], issues: [], activity: ["Package received", "Files validated"] };
const blocker = (extra: Record<string, unknown>) => ({ file: "customers.csv", row: null, column: null, key: null, code: "MISSING_COLUMN", severity: "BLOCKER", message: "Missing required column: display_name.", fix: "Add display_name using the Sample Package as a reference.", can_continue: false, ...extra });
const fetchMock = vi.fn();
function file(name = "customers.csv") {
  const f = new File(["id,display_name\nc1,Name"], name);
  Object.defineProperty(f, "arrayBuffer", { value: async () => new TextEncoder().encode("id,display_name\nc1,Name").buffer });
  return f;
}
function select(f = file()) {
  fireEvent.change(screen.getByLabelText("Test files"), { target: { files: [f] } });
}
function consent() { fireEvent.click(screen.getByRole("checkbox", { name: /de-identified test data/ })); }
function response(data: unknown, status = 200) { return { ok: status < 400, status, json: async () => data }; }
const validate = () => fireEvent.click(screen.getByRole("button", { name: "Validate Files" }));
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); sessionStorage.clear(); });
afterEach(() => vi.unstubAllGlobals());

describe("test export check", () => {
  it("leads with four plain steps and keeps format detail behind a disclosure", () => {
    render(<TryYourData/>);
    expect(screen.getByRole("heading", { level: 1, name: "Check Your Export Before Migration" })).toBeVisible();
    expect(screen.getByText("We'll check the files, identify missing or inconsistent data, and show what needs attention before anything moves.")).toBeVisible();
    for (const name of ["1. Download Sample Package", "2. Choose Test Files", "3. Validate Files"]) expect(screen.getByRole("heading", { name })).toBeVisible();
    expect(screen.getByText("See a small example of the files and formats MoveBooks accepts.")).toBeVisible();
    expect(screen.getByText("De-Identified Test Data Only")).toBeVisible();
    const format = screen.getByText("View Supported File Format and Limits").closest("details")!;
    expect(format).not.toHaveAttribute("open");
    expect(within(format).getByText("customers.csv")).toBeInTheDocument();
    expect(format).toHaveTextContent("Up to 9 files, 256 KiB per file and 2 MiB in total.");
    expect(document.body).not.toHaveTextContent(/Upload your data|Understand your export/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("downloads the canonical sample package", async () => {
    const blob = new Blob(["zip"]);
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, blob: async () => blob });
    const create = vi.fn(() => "blob:sample"); const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<TryYourData/>);
    fireEvent.click(screen.getByRole("button", { name: "Download Sample Package" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/v1\/intake\/template$/);
    expect(revoke).toHaveBeenCalledWith("blob:sample");
  });
  it("has an accessible file picker, a privacy notice and no automatic upload", () => {
    render(<TryYourData/>); select();
    expect(screen.getByLabelText("Test files")).toHaveAttribute("type", "file");
    expect(screen.getByRole("button", { name: "Validate Files" })).toBeDisabled();
    expect(screen.getByText(/No data goes to an LLM/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("validates, requires review, continues to the same assessment and focuses the result", async () => {
    fetchMock.mockResolvedValueOnce(response(report)).mockResolvedValueOnce(response({ session_id: id, workflow_status: "ASSESSED" }));
    render(<TryYourData/>); select(); consent(); validate();
    await screen.findByText("Your Files Are Ready");
    const next = screen.getByRole("button", { name: "Continue to Assessment" });
    expect(next).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("heading", { name: "3. Validate Files" })).toHaveFocus());
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed the results/ }));
    fireEvent.click(next);
    expect(await screen.findByRole("link", { name: "View Assessment Results" })).toHaveAttribute("href", `/assess?session=${id}`);
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(id);
    expect(fetchMock.mock.calls[1][0]).toContain(`/intake/${id}/workspace`);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ reviewed: true });
  });
  it("lists every problem by file, row and column with a fix, and offers recovery actions", async () => {
    const issues = [
      blocker({}),
      blocker({ file: "invoices.csv", row: 18, column: "customer_id", code: "BROKEN_REFERENCE", message: "Row 18 references customer C104, but C104 does not exist in customers.csv.", fix: "Add C104 to customers.csv or correct the reference." }),
      blocker({ file: "configuration.json", key: "company.base_currency", code: "MISSING_KEY", message: "Missing required key: company.base_currency.", fix: "Add company.base_currency using the Sample Package as a reference." }),
    ];
    fetchMock.mockResolvedValueOnce(response({ ...report, status: "BLOCKED", issues }));
    render(<TryYourData/>); select(); consent(); validate();
    expect(await screen.findByRole("heading", { name: "3 Things Need Attention Before We Can Use These Files." })).toBeVisible();
    const invoices = screen.getByRole("region", { name: "Issues in invoices.csv" });
    expect(invoices).toHaveTextContent("Broken Reference · Row 18 · Column customer_id");
    expect(invoices).toHaveTextContent("Row 18 references customer C104, but C104 does not exist in customers.csv.");
    expect(invoices).toHaveTextContent("Fix: Add C104 to customers.csv or correct the reference.");
    expect(screen.getByRole("region", { name: "Issues in configuration.json" })).toHaveTextContent("Missing Required Key · Key company.base_currency");
    expect(screen.getByText("We couldn't use this package yet. Nothing was imported or changed.")).toBeVisible();
    // A blocked package never offers the next step.
    expect(screen.queryByRole("button", { name: "Continue to Assessment" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fix Files and Validate Again" }));
    expect(screen.getByLabelText("Test files")).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "View Expected Format" }));
    expect(screen.getByText("View Supported File Format and Limits").closest("details")).toHaveAttribute("open");
  });
  it("words a single problem in the singular", async () => {
    fetchMock.mockResolvedValueOnce(response({ ...report, status: "BLOCKED", issues: [blocker({})] }));
    render(<TryYourData/>); select(); consent(); validate();
    expect(await screen.findByRole("heading", { name: "1 Thing Needs Attention Before We Can Use These Files." })).toBeVisible();
  });
  it("lets a blocked package be replaced and validated again without keeping earlier review", async () => {
    fetchMock.mockResolvedValueOnce(response({ ...report, status: "BLOCKED", issues: [blocker({})] })).mockResolvedValueOnce(response({})).mockResolvedValueOnce(response(report));
    render(<TryYourData/>); select(); consent(); validate();
    await screen.findByText("Missing required column: display_name.");
    fireEvent.click(screen.getByRole("button", { name: "Remove customers.csv" }));
    expect(screen.queryByText("Missing required column: display_name.")).not.toBeInTheDocument();
    select(); validate();
    await screen.findByText("Your Files Are Ready");
    expect(screen.getByRole("button", { name: "Continue to Assessment" })).toBeDisabled();
  });
  it("shows warnings as notes that allow continuing after review", async () => {
    fetchMock.mockResolvedValueOnce(response({ ...report, status: "NEEDS ATTENTION", issues: [blocker({ code: "IGNORED_FIELDS", severity: "WARNING", row: 1, message: "Unsupported columns will not migrate: memo.", fix: "Remove the columns or continue without them.", can_continue: true })] }));
    render(<TryYourData/>); select(); consent(); validate();
    expect(await screen.findByText("Your Files Can Be Used After Review")).toBeVisible();
    expect(screen.getByRole("heading", { name: "1 Note to Review" })).toBeVisible();
    expect(screen.getByText("You can continue after reviewing this.")).toBeVisible();
  });
  it("rejects oversized files before anything is sent", async () => {
    render(<TryYourData/>); select(new File([new Uint8Array(256 * 1024 + 1)], "customers.csv")); consent(); validate();
    expect(await screen.findByText(/Choose up to 9 files \(256 KiB each, 2 MiB in total\)/)).toBeInTheDocument();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    [404, "This check has expired. Validate your files again."],
    [413, "These files are larger than this Beta accepts."],
    [400, "MoveBooks couldn't read this package."],
    [500, "MoveBooks couldn't check these files right now. Nothing was imported or changed; try again."],
  ])("explains an HTTP %i without fabricating a workspace", async (status, text) => {
    fetchMock.mockResolvedValue(response({ detail: "ignored" }, status));
    render(<TryYourData/>); select(); consent(); validate();
    expect(await screen.findByText(new RegExp(text.replace(/[.()?]/g, "\\$&")))).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View Assessment Results" })).not.toBeInTheDocument();
    expect(sessionStorage.getItem("movebooks-migration-session")).toBeNull();
  });
  it("explains an unreachable file-checking service instead of a raw network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<TryYourData/>); select(); consent(); validate();
    expect(await screen.findByText("MoveBooks couldn't reach the file-checking service. Nothing was imported or changed.")).toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
    expect(sessionStorage.getItem("movebooks-migration-session")).toBeNull();
  });
  it("defines ten uninstrumented contracts with server-owned outcomes", () => {
    expect(Object.keys(intakeEvents)).toHaveLength(10);
    expect(intakeEvents.workspace_created_from_upload.source).toBe("server");
    expect(intakeEvents.package_validation_passed.trigger).toContain("not migration readiness");
  });
});
