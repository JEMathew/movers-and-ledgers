import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const session = vi.hoisted(() => ({ ready: true, busy: false, hasSession: false,
  identity: null as null | { subject: string; email: string }, error: "", signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("@/components/IdentityProvider", () => ({ useIdentity: () => session }));
function shell() { return <ThemeProvider><Nav /><button>Outside control</button></ThemeProvider>; }
function account() { return screen.getByRole("button", { name: /^Account:/ }); }
function signedIn() { session.hasSession = true; session.identity = { subject: "firebase:internal-only", email: "verified@example.test" }; }
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((media: string) => ({ media, matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
  Object.assign(session, { ready: true, busy: false, hasSession: false, identity: null, error: "" });
  vi.clearAllMocks();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("global account and settings shell", () => {
  it("shows Settings and Google sign-in without a stale account or sign-out", () => {
    render(shell());
    expect(screen.getByRole("button", { name: "Settings" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Account:|Sign out/ })).not.toBeInTheDocument();
  });
  it("shows a disabled bounded initialization state instead of claiming sign-in", () => {
    session.ready = false; render(shell());
    expect(screen.getByRole("button", { name: "Preparing Google sign-in…" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeEnabled();
  });
  it("uses verified identity only and keeps sign-out inside the disclosure", () => {
    signedIn(); render(shell());
    expect(account()).toHaveAccessibleName("Account: verified@example.test");
    expect(account()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    fireEvent.click(account());
    expect(account()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Signed in as verified@example.test")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("internal-only");
  });
  it("focuses the first action, closes on Escape and restores trigger focus", () => {
    signedIn(); render(shell()); fireEvent.click(account());
    expect(screen.getAllByRole("button", { name: "Settings" }).at(-1)).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(account()).toHaveFocus(); expect(account()).toHaveAttribute("aria-expanded", "false");
  });
  it("closes on outside pointer or focus leaving without trapping Tab navigation", () => {
    signedIn(); render(shell()); fireEvent.click(account());
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside control" }));
    expect(account()).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(account());
    fireEvent.blur(screen.getByRole("button", { name: "Sign out" }), { relatedTarget: screen.getByRole("button", { name: "Outside control" }) });
    expect(account()).toHaveAttribute("aria-expanded", "false");
  });
  it("invokes existing sign-out and removes account identity when the session clears", () => {
    signedIn(); const view = render(shell()); fireEvent.click(account());
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(session.signOut).toHaveBeenCalledTimes(1);
    session.identity = null; session.hasSession = false; view.rerender(shell());
    expect(screen.queryByText(/verified@example.test/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });
  it("never offers sign-in alongside an unverified existing session", () => {
    session.hasSession = true; render(shell()); fireEvent.click(account());
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
    expect(screen.getByText(/Account not verified/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  });
  it("offers only supported theme and system accessibility settings", () => {
    render(shell()); screen.getByRole("button", { name: "Settings" }).focus(); fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const dialog = screen.getByRole("dialog", { name: "Settings" });
    const theme = within(dialog).getByRole("combobox", { name: "Theme preference" });
    fireEvent.change(theme, { target: { value: "dark" } });
    expect(theme).toHaveValue("dark");
    fireEvent.change(theme, { target: { value: "system" } });
    expect(theme).toHaveValue("system");
    expect(dialog).toHaveTextContent("device’s reduced-motion preference");
    expect(dialog).not.toHaveTextContent(/Billing|Notifications|Provider integration/);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close dialog" }));
    expect(screen.getByRole("button", { name: "Settings" })).toHaveFocus();
  });
  it("restores a connected Settings trigger when dialog opened from account disclosure closes", () => {
    signedIn(); render(shell()); fireEvent.click(account());
    fireEvent.click(screen.getAllByRole("button", { name: "Settings" }).at(-1)!);
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.getByRole("button", { name: "Settings" })).toHaveFocus();
  });
  it("keeps mobile navigation and account controls separate and reachable", () => {
    render(shell());
    expect(screen.getByLabelText("Open navigation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });
});
