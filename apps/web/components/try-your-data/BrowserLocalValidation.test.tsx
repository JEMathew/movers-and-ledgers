import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { BrowserLocalValidation } from "./BrowserLocalValidation";
import template from "./browser-template.json";
import { storedZip } from "./browser-archive";
const fetchMock = vi.fn();
function file(name: string, content: string | Uint8Array) {
  const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
  const result = new File([bytes as BlobPart], name);
  Object.defineProperty(result, "arrayBuffer", { configurable: true, value: async () => bytes.buffer }); return result;
}
function select(files = Object.entries(template).map(([name, content]) => file(name, content))) { fireEvent.change(screen.getByLabelText("Test files"), { target: { files } }); }
function consent() { fireEvent.click(screen.getByRole("checkbox", { name: /I have permission/ })); }
function validate() { fireEvent.click(screen.getByRole("button", { name: /^(Validate|Revalidate) files$/ })); }
beforeEach(() => { vi.stubGlobal("crypto", webcrypto); vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); });
afterEach(() => vi.unstubAllGlobals());
describe("browser-local fallback", () => {
  it("requires consent, validates locally, confirms review and keeps hosted creation gated", async () => {
    render(<BrowserLocalValidation/>); select();
    expect(screen.getByRole("button", { name: "Validate files" })).toBeDisabled(); expect(fetchMock).not.toHaveBeenCalled();
    consent(); validate(); await screen.findByText("Local compatibility checks passed");
    await waitFor(() => expect(screen.getByRole("heading", { name: "3. Validate and review issues" })).toHaveFocus());
    expect(screen.getByRole("button", { name: "Confirm local review" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed the local results/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm local review" }));
    expect(screen.getByText("Hosted workspace creation is unavailable")).toBeVisible();
    expect(screen.getByRole("link", { name: "Run Harbor Light migration" })).toHaveAttribute("href", "/assess?sample=harbor-light-migrate-demo");
    expect(screen.queryByRole("button", { name: "Continue to assessment" })).not.toBeInTheDocument();
    expect(sessionStorage.length).toBe(0); expect(localStorage.length).toBe(0); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("replaces the same filename, clears confirmation and allows repair and revalidation", async () => {
    render(<BrowserLocalValidation/>); select(); consent(); validate(); await screen.findByText("Local compatibility checks passed");
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed the local results/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm local review" }));
    select([file("customers.csv", "id\ncustomer-001")]);
    expect(screen.queryByText("Hosted workspace creation is unavailable")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remove customers.csv" })).toHaveLength(1);
    validate(); await screen.findByText("Missing required columns: display_name.");
    expect(screen.queryByRole("button", { name: "Confirm local review" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Correct or replace files" })); expect(screen.getByLabelText("Test files")).toHaveFocus();
    select([file("customers.csv", template["customers.csv"])]); validate(); await screen.findByText("Local compatibility checks passed");
    expect(screen.getByRole("button", { name: "Confirm local review" })).toBeDisabled(); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("checks a flat template ZIP and clears every selected file and report", async () => {
    render(<BrowserLocalValidation/>);
    select([file("template.zip", storedZip(Object.entries(template).map(([name, content]) => ({ name, bytes: new TextEncoder().encode(content) }))))]); consent(); validate();
    await screen.findByText("Local compatibility checks passed");
    fireEvent.click(screen.getByRole("button", { name: "Clear files" }));
    expect(screen.queryByText("Local compatibility checks passed")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Validate files" })).toBeDisabled(); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("checks declared sizes before reading or uploading file contents", async () => {
    const oversized = file("customers.csv", new Uint8Array(262145)); const read = vi.spyOn(oversized, "arrayBuffer");
    render(<BrowserLocalValidation/>); select([oversized]); consent(); validate();
    await screen.findByText(/Choose up to 9 files, 256 KiB/); expect(read).not.toHaveBeenCalled(); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("downloads the template and report locally without an API", async () => {
    const create = vi.fn((blob: Blob) => { expect(blob.size).toBeGreaterThan(0); return "blob:local"; }), revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<BrowserLocalValidation/>); fireEvent.click(screen.getByRole("button", { name: "Download template ZIP" }));
    expect(click).toHaveBeenCalled(); expect(create.mock.calls[0][0]).toBeInstanceOf(Blob);
    select(); consent(); validate(); await screen.findByText("Local compatibility checks passed");
    fireEvent.click(screen.getByRole("button", { name: "Download local report" })); expect(click).toHaveBeenCalledTimes(2); expect(fetchMock).not.toHaveBeenCalled();
    await waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:local")); click.mockRestore();
  });
});
