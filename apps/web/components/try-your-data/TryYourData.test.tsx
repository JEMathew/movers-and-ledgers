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
const validate = () => fireEvent.click(screen.getByRole("button", { name: "Validate files" }));
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); sessionStorage.clear(); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("test export check", () => {
  it("offers browser-local compatibility checks while hosted handoff stays gated", () => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
    render(<TryYourData/>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Check your export in this browser");
    expect(screen.getByLabelText("Test files")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Validate files" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download template ZIP" })).toBeVisible();
    expect(screen.getByText(/Hosted upload and workspace creation are unavailable/)).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("leads with four plain steps and keeps format detail behind a disclosure", () => {
    render(<TryYourData/>);
    expect(screen.getByRole("heading", { level: 1, name: "Check your export before migration" })).toBeVisible();
    expect(screen.getByText("We'll check the files, identify missing or inconsistent data, and show what needs attention before anything moves.")).toBeVisible();
    for (const name of ["1. Download sample package", "2. Choose test files", "3. Validate files"]) expect(screen.getByRole("heading", { name })).toBeVisible();
    expect(screen.getByText("See a small example of the files and formats MoveBooks accepts.")).toBeVisible();
    expect(screen.getByText("De-identified test data only")).toBeVisible();
    const format = screen.getByText("View supported file format and limits").closest("details")!;
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
    fireEvent.click(screen.getByRole("button", { name: "Download sample package" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/v1\/intake\/template$/);
    expect(revoke).toHaveBeenCalledWith("blob:sample");
  });
  it("has an accessible file picker, a privacy notice and no automatic upload", () => {
    render(<TryYourData/>); select();
    expect(screen.getByLabelText("Test files")).toHaveAttribute("type", "file");
    expect(screen.getByRole("button", { name: "Validate files" })).toBeDisabled();
    expect(screen.getByText(/No data goes to an LLM/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("validates, requires review, continues to the same assessment and focuses the result", async () => {
    fetchMock.mockResolvedValueOnce(response(report)).mockResolvedValueOnce(response({ session_id: id, workflow_status: "ASSESSED" }));
    render(<TryYourData/>); select(); consent(); validate();
    await screen.findByText("Your files are ready");
    const next = screen.getByRole("button", { name: "Continue to assessment" });
    expect(next).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("heading", { name: "3. Validate files" })).toHaveFocus());
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed the results/ }));
    fireEvent.click(next);
    expect(await screen.findByRole("link", { name: "View assessment results" })).toHaveAttribute("href", `/assess?session=${id}`);
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
    expect(await screen.findByRole("heading", { name: "3 things need attention before we can use these files." })).toBeVisible();
    const invoices = screen.getByRole("region", { name: "Issues in invoices.csv" });
    expect(invoices).toHaveTextContent("Broken reference · Row 18 · Column customer_id");
    expect(invoices).toHaveTextContent("Row 18 references customer C104, but C104 does not exist in customers.csv.");
    expect(invoices).toHaveTextContent("Fix: Add C104 to customers.csv or correct the reference.");
    expect(screen.getByRole("region", { name: "Issues in configuration.json" })).toHaveTextContent("Missing required key · Key company.base_currency");
    expect(screen.getByText("We couldn't use this package yet. Nothing was imported or changed.")).toBeVisible();
    // A blocked package never offers the next step.
    expect(screen.queryByRole("button", { name: "Continue to assessment" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fix files and validate again" }));
    expect(screen.getByLabelText("Test files")).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "View expected format" }));
    expect(screen.getByText("View supported file format and limits").closest("details")).toHaveAttribute("open");
  });
  it("words a single problem in the singular", async () => {
    fetchMock.mockResolvedValueOnce(response({ ...report, status: "BLOCKED", issues: [blocker({})] }));
    render(<TryYourData/>); select(); consent(); validate();
    expect(await screen.findByRole("heading", { name: "1 thing needs attention before we can use these files." })).toBeVisible();
  });
  it("lets a blocked package be replaced and validated again without keeping earlier review", async () => {
    fetchMock.mockResolvedValueOnce(response({ ...report, status: "BLOCKED", issues: [blocker({})] })).mockResolvedValueOnce(response({})).mockResolvedValueOnce(response(report));
    render(<TryYourData/>); select(); consent(); validate();
    await screen.findByText("Missing required column: display_name.");
    fireEvent.click(screen.getByRole("button", { name: "Remove customers.csv" }));
    expect(screen.queryByText("Missing required column: display_name.")).not.toBeInTheDocument();
    select(); validate();
    await screen.findByText("Your files are ready");
    expect(screen.getByRole("button", { name: "Continue to assessment" })).toBeDisabled();
  });
  it("shows warnings as notes that allow continuing after review", async () => {
    fetchMock.mockResolvedValueOnce(response({ ...report, status: "NEEDS ATTENTION", issues: [blocker({ code: "IGNORED_FIELDS", severity: "WARNING", row: 1, message: "Unsupported columns will not migrate: memo.", fix: "Remove the columns or continue without them.", can_continue: true })] }));
    render(<TryYourData/>); select(); consent(); validate();
    expect(await screen.findByText("Your files can be used after review")).toBeVisible();
    expect(screen.getByRole("heading", { name: "1 note to review" })).toBeVisible();
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
    [500, "We couldn't confirm whether this step completed. Your request may have been received. Try again or check your migration status."],
  ])("explains an HTTP %i without fabricating a workspace", async (status, text) => {
    fetchMock.mockResolvedValue(response({ detail: "ignored" }, status));
    render(<TryYourData/>); select(); consent(); validate();
    expect(await screen.findByText(new RegExp(text.replace(/[.()?]/g, "\\$&")))).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View assessment results" })).not.toBeInTheDocument();
    expect(sessionStorage.getItem("movebooks-migration-session")).toBeNull();
  });
  it("explains a lost response to validation without promising nothing changed", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<TryYourData/>); select(); consent(); validate();
    expect(await screen.findByText("We couldn't confirm whether this step completed. Your request may have been received. Try again or check your migration status.")).toBeInTheDocument();
    expect(screen.queryByText(/Nothing was imported or changed/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
    expect(sessionStorage.getItem("movebooks-migration-session")).toBeNull();
  });
  it("recovers a workspace whose creation succeeded but whose response was lost, without a duplicate", async () => {
    fetchMock.mockResolvedValueOnce(response(report))
      // The server created the workspace; the browser never saw the response.
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      // Retrying the same ticket replays the existing workspace.
      .mockResolvedValueOnce(response({ session_id: id, workflow_status: "ASSESSED" }));
    render(<TryYourData/>); select(); consent(); validate();
    await screen.findByText("Your files are ready");
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed the results/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to assessment" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We Couldn't Confirm This Step");
    expect(alert).toHaveTextContent("Your request may have been received.");
    expect(alert).not.toHaveTextContent(/Nothing was (imported or )?changed/);
    expect(sessionStorage.getItem("movebooks-migration-session")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("link", { name: "View assessment results" })).toHaveAttribute("href", `/assess?session=${id}`);
    const creates = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/workspace"));
    // Both attempts used the same package ticket; no second package or new workspace was requested.
    expect(creates.map(([url]) => url)).toEqual([expect.stringContaining(`/intake/${id}/workspace`), expect.stringContaining(`/intake/${id}/workspace`)]);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/intake/validate"))).toHaveLength(1);
    expect(sessionStorage.getItem("movebooks-migration-session")).toBe(id);
  });
  it("defines ten uninstrumented contracts with server-owned outcomes", () => {
    expect(Object.keys(intakeEvents)).toHaveLength(10);
    expect(intakeEvents.workspace_created_from_upload.source).toBe("server");
    expect(intakeEvents.package_validation_passed.trigger).toContain("not migration readiness");
  });
});
