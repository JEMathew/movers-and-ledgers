import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import SignIn from "@/app/sign-in/page";

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
    expect(screen.getAllByRole("button", { name: "Settings" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toHaveClass("button", "small", "ghost");
    expect(screen.getByRole("button", { name: "Sign in with Google" })).not.toHaveClass("w-full", "primary");
    expect(screen.queryByRole("button", { name: /Account:|Sign out/ })).not.toBeInTheDocument();
  });
  it("uses customer-facing sign-in copy and preserves the protected destination", async () => {
    render(await SignIn({ searchParams: Promise.resolve({ next: "/onboard-fpu?session=preserved" }) }));
    expect(screen.getByRole("heading", { name: "Sign in to continue your migration" })).toBeVisible();
    expect(screen.getByText("Use your Google account to securely access your MoveBooks migration.")).toBeVisible();
    expect(screen.getAllByText("Bounded synthetic Beta · No production customer data")).toHaveLength(1);
    expect(screen.getByRole("main")).not.toHaveTextContent(/workspace ownership|API|durable storage|production-ready/);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(session.signIn).toHaveBeenCalledWith("/onboard-fpu?session=preserved");
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
    expect(account()).toHaveTextContent("verified@example.test");
    expect(screen.queryByText("Session needs attention")).not.toBeInTheDocument();
    expect(account()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    fireEvent.click(account());
    expect(account()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button", { name: "Settings" })).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Signed in as verified@example.test");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("internal-only");
  });
  it("focuses the first action, closes on Escape and restores trigger focus", () => {
    signedIn(); render(shell()); fireEvent.click(account());
    expect(screen.getByRole("button", { name: "Settings" })).toHaveFocus();
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
    session.hasSession = true; session.error = "Your Google session could not be verified by the API.";
    render(shell()); fireEvent.click(account());
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("MoveBooks could not verify your account");
    expect(account()).toHaveTextContent("Session needs attention");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  });
  it("keeps pending verification distinct from an attention/error state", () => {
    session.hasSession = true; session.ready = false;
    render(shell());
    expect(account()).toHaveAccessibleName("Account: verifying session");
    expect(account()).toHaveTextContent("Verifying account…");
    fireEvent.click(account());
    expect(screen.getByRole("status")).toHaveTextContent("Verifying your account with MoveBooks");
    expect(screen.queryByText(/Session needs attention|could not verify/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
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
  it("restores the account trigger when Settings closes after its menu unmounts", () => {
    signedIn(); render(shell()); fireEvent.click(account());
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(account()).toHaveFocus();
    expect(account()).toHaveAttribute("aria-expanded", "false");
  });
  it("keeps mobile navigation and account controls separate and reachable", () => {
    render(shell());
    expect(screen.getByLabelText("Open navigation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });
  it("uses a migration fallback only with verified identity, without fetching progress", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const view = render(shell());
    expect(screen.queryByRole("link", { name: /Go to migration|Open workspace/, hidden: true })).not.toBeInTheDocument();
    signedIn(); view.rerender(shell());
    expect(screen.getAllByRole("link", { name: /Go to migration/, hidden: true })).toHaveLength(2);
    for (const link of screen.getAllByRole("link", { name: /Go to migration/, hidden: true })) expect(link).toHaveAttribute("href", "/workspace");
    expect(screen.queryByText(/Open workspace|Continue migration|Start a migration|View migration/)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
});
