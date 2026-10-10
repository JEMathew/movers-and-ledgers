import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Learn from "@/app/learn/page";
import { ProductEntry } from "./ProductEntry";
import ProductPage from "@/app/product/page";
import TrustPage from "@/app/trust/page";
import { Trust } from "./Trust";
import { Support } from "./Support";
import { Feedback } from "./Feedback";
import { topics } from "./content";
import * as identityLib from "@/lib/identity";
const id = "11111111-1111-4111-8111-111111111111";
const state = vi.hoisted(() => ({ replace: vi.fn(), identity: null as null | { uid: string } }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("@/components/IdentityProvider", () => ({ useIdentity: () => ({ identity: state.identity, ready: false, busy: false, hasSession: false, error: "", signIn: vi.fn() }) }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); state.identity = null; state.replace.mockReset(); });

describe("PR02 navigation and disclosure contracts", () => {
  it.each(topics)("opens and focuses the requested Learn #$id", ({ id }) => {
    window.history.replaceState(null, "", `/learn?stage=1#${id}`);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Learn/>);
    const details = document.getElementById(id)!;
    expect(details).toHaveAttribute("open");
    expect(details.querySelector("summary")).toHaveFocus();
    expect(document.querySelectorAll("details[open]")).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("handles a new hash by focusing its rendered topic, while ignoring malformed/unknown hashes", () => {
    window.history.replaceState(null, "", "/learn#%E0%A4%A");
    render(<Learn/>);
    expect(document.querySelectorAll("details[open]")).toHaveLength(0);
    window.history.replaceState(null, "", "/learn#unknown");
    fireEvent(window, new Event("hashchange"));
    expect(document.querySelectorAll("details[open]")).toHaveLength(0);
    window.history.replaceState(null, "", "/learn#recovery");
    fireEvent(window, new Event("hashchange"));
    expect(document.querySelector("#recovery summary")).toHaveFocus();
  });
  it("temporarily aliases plain Product to Home regardless of stored selection", async () => {
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch");
    await expect(ProductPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/");
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["invalid", "", id])("retains the explicit Product reference '%s' compatibility wrapper", async session => {
    const page = await ProductPage({ searchParams: Promise.resolve({ session }) });
    expect(page.type).toBe(ProductEntry);
  });
  it.each(["invalid", "", "../../private"])("keeps explicit invalid Product reference '%s' unresolved without a new scenario", async session => {
    window.history.replaceState(null, "", `/product?session=${encodeURIComponent(session)}`);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<ProductEntry/>);
    expect(await screen.findByRole("status")).toHaveTextContent(/No replacement migration/);
    expect(state.replace).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(document.querySelector('a[href*="sample="]')).toBeNull();
  });
  it("keeps Help's selected issue destination separate from the original task", () => {
    window.history.replaceState(null, "", `/support?session=${id}&stage=3`);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Support/>);
    fireEvent.change(screen.getByLabelText("What do you need help with?"), { target: { value: "2" } });
    expect(screen.getByRole("link", { name: "Open Move for this issue" })).toHaveAttribute("href", `/migrate-resolve?session=${id}`);
    expect(screen.getByRole("link", { name: "Return to original task" })).toHaveAttribute("href", `/validate-configure?session=${id}`);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps feedback type and categories available while no delivery is implied", () => {
    render(<Feedback/>);
    fireEvent.click(screen.getByText("Feedback type and category"));
    expect(within(screen.getByLabelText("Category")).getAllByRole("option")).toHaveLength(6);
    expect(within(screen.getByLabelText("Feedback type")).getAllByRole("option")).toHaveLength(3);
    expect(screen.getByText(/nothing is submitted or stored on a server/)).toBeVisible();
    expect(screen.getByLabelText("I checked that this draft contains no sensitive data")).toBeVisible();
  });
});

describe("public Trust and explicit evidence mode", () => {
  it("derives public/evidence mode on each route render, including empty and legacy references", async () => {
    for (const [query, expected] of [[{}, false], [{ view: "unknown" }, false], [{ view: "evidence" }, true], [{ session: id }, true], [{ session: "" }, true]] as const) {
      const page = await TrustPage({ searchParams: Promise.resolve(query) });
      expect(page.props.evidenceMode).toBe(expected);
    }
  });
  it.each(["/trust", "/trust?view=unknown"])("does not read a saved migration on public %s", path => {
    window.history.replaceState(null, "", path);
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Trust/>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A move you can inspect.");
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/No session selected/)).not.toBeInTheDocument();
  });
  it("opens same-page links even when client navigation does not emit hashchange", () => {
    window.history.replaceState(null, "", "/trust");
    render(<><Trust/><a href="/trust#beta-limitations">Open limits</a></>);
    const link = screen.getByRole("link", { name: "Open limits" });
    link.addEventListener("click", event => event.preventDefault());
    fireEvent.click(link);
    expect(document.querySelector("#beta-limitations")).toHaveAttribute("open");
    expect(document.querySelector("#beta-limitations summary")).toHaveFocus();
  });
  it("retains the requested Beta anchor and complete data/control boundaries", () => {
    window.history.replaceState(null, "", "/trust#beta-limitations");
    render(<Trust/>);
    expect(document.querySelector("#beta-limitations summary")).toHaveFocus();
    expect(screen.getByText(/not a production or compliance-ready service/)).toBeVisible();
    expect(screen.getByText(/Cloud test-export uploads remain disabled, including for signed-in users/)).toBeVisible();
    fireEvent.click(screen.getByText("Financial controls and human approvals"));
    expect(screen.getByText(/cannot waive a failed check/)).toBeVisible();
  });
  it.each([`/trust?session=${id}`, "/trust?view=evidence"])("gates cloud evidence on verified identity for %s", path => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
    window.history.replaceState(null, "", path);
    sessionStorage.setItem("movebooks-migration-session", id);
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Trust evidenceMode session={path.includes("session=") ? id : undefined}/>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sign in to inspect your migration.");
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("reads explicit cloud selection only after verified identity, and clears it on identity loss", async () => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
    window.history.replaceState(null, "", "/trust?view=evidence");
    sessionStorage.setItem("movebooks-migration-session", id);
    state.identity = { uid: "unit-test-owner" };
    vi.spyOn(identityLib, "authHeaders").mockResolvedValue({ Authorization: "Bearer unit-test-owner" });
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id, synthetic: true, workflow_status: "ASSESSED" })));
    const { rerender } = render(<Trust evidenceMode/>);
    expect(await screen.findByRole("heading", { name: "Current journey stage: Understand" })).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1]?.method).toBeUndefined();
    state.identity = null;
    rerender(<Trust evidenceMode/>);
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Current journey stage: Understand" })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sign in to inspect your migration.");
  });
});
