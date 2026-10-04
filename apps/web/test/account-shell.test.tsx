import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import SignIn from "@/app/sign-in/page";
import Home from "@/app/page";

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
  it("shows Sign in, a primary Start My Migration action and a compact appearance icon, with no Settings text", () => {
    render(shell());
    const signIn = screen.getByRole("button", { name: "Sign in with Google" });
    expect(signIn).toBeEnabled();
    expect(signIn).toHaveTextContent(/^Sign in$/);
    expect(signIn).toHaveClass("button", "small", "ghost");
    const start = screen.getByRole("link", { name: "Start My Migration" });
    expect(start).toHaveAttribute("href", "/workspace");
    expect(start).toHaveClass("button", "small");
    expect(start).not.toHaveClass("ghost", "secondary");
    expect(signIn.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    const appearance = screen.getByRole("button", { name: "Change appearance" });
    expect(appearance).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Change appearance" })).toHaveLength(1);
    expect(appearance).toHaveTextContent("");
    expect(appearance).toHaveAttribute("aria-haspopup", "dialog");
    expect(appearance).toHaveAttribute("aria-expanded", "false");
    // The icon sits next to Sign in, after it, so Sign in stays the first and primary control.
    expect(signIn.compareDocumentPosition(appearance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
  it("shows the real sign-in label immediately while staying disabled until the SDK is ready", () => {
    session.ready = false; render(shell());
    const signIn = screen.getByRole("button", { name: "Sign in with Google" });
    expect(signIn).toBeDisabled();
    expect(signIn).toHaveAttribute("aria-busy", "true");
    expect(signIn).toHaveAccessibleDescription("Getting Google sign-in ready");
    fireEvent.click(signIn);
    expect(session.signIn).not.toHaveBeenCalled();
    expect(document.body).not.toHaveTextContent(/Preparing Google sign-in/);
    expect(screen.getByRole("button", { name: "Change appearance" })).toBeEnabled();
  });
  it("does not claim sign-in is still preparing after initialization failed", () => {
    session.ready = false; session.error = "Google sign-in initialization failed. Reload this page to retry. No demo sign-in occurred.";
    render(shell());
    const signIn = screen.getByRole("button", { name: "Sign in with Google" });
    expect(signIn).toBeDisabled();
    expect(signIn).not.toHaveAttribute("aria-busy");
  });
  it("uses verified identity only and keeps sign-out inside the disclosure", () => {
    signedIn(); render(shell());
    expect(account()).toHaveAccessibleName("Account: verified@example.test");
    expect(account()).toHaveTextContent("verified@example.test");
    expect(screen.queryByText("Session needs attention")).not.toBeInTheDocument();
    expect(account()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change appearance" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign Out" })).not.toBeInTheDocument();
    fireEvent.click(account());
    expect(account()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button", { name: "Settings" })).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Signed in as verified@example.test");
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeEnabled();
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
    fireEvent.blur(screen.getByRole("button", { name: "Sign Out" }), { relatedTarget: screen.getByRole("button", { name: "Outside control" }) });
    expect(account()).toHaveAttribute("aria-expanded", "false");
  });
  it("invokes existing sign-out and removes account identity when the session clears", () => {
    signedIn(); const view = render(shell()); fireEvent.click(account());
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));
    expect(session.signOut).toHaveBeenCalledTimes(1);
    session.identity = null; session.hasSession = false; view.rerender(shell());
    expect(screen.queryByText(/verified@example.test/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign Out" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });
  it("keeps Sign out mounted through Safari's non-focusing pointer click", () => {
    signedIn(); render(shell()); fireEvent.click(account());
    const signOut = screen.getByRole("button", { name: "Sign Out" });
    fireEvent.pointerDown(signOut);
    fireEvent.mouseDown(signOut);
    // Safari can blur the focused Settings button without focusing the clicked button.
    fireEvent.blur(screen.getByRole("button", { name: "Settings" }), { relatedTarget: null });
    expect(signOut).toBeInTheDocument();
    fireEvent.mouseUp(signOut); fireEvent.click(signOut);
    expect(session.signOut).toHaveBeenCalledTimes(1);
  });
  it("never offers sign-in alongside an unverified existing session", () => {
    session.hasSession = true; session.error = "Your Google session could not be verified by the API.";
    render(shell()); fireEvent.click(account());
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("MoveBooks could not verify your account");
    expect(account()).toHaveTextContent("Session needs attention");
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeEnabled();
  });
  it("keeps pending verification distinct from an attention/error state", () => {
    session.hasSession = true; session.ready = false;
    render(shell());
    expect(account()).toHaveAccessibleName("Account: verifying session");
    expect(account()).toHaveTextContent("Verifying your account…");
    fireEvent.click(account());
    expect(screen.getByRole("status")).toHaveTextContent("Verifying your account…");
    expect(screen.queryByText(/Session needs attention|could not verify/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
  });
  it("offers System, Light and Dark from the signed-out appearance icon and nothing about motion", () => {
    render(shell()); screen.getByRole("button", { name: "Change appearance" }).focus(); fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    const dialog = screen.getByRole("dialog", { name: "Appearance" });
    expect(screen.getByRole("button", { name: "Change appearance" })).toHaveAttribute("aria-expanded", "true");
    const options = within(dialog).getAllByRole("radio");
    expect(options.map(option => (option as HTMLInputElement).value)).toEqual(["system", "light", "dark"]);
    expect(within(dialog).getByRole("radio", { name: "System" })).toBeChecked();
    expect(within(dialog).getByRole("radio", { name: "System" })).toHaveFocus();
    expect(dialog).toHaveAttribute("aria-modal", "false");
    expect(dialog).toHaveClass("settings-panel");
    fireEvent.click(within(dialog).getByRole("radio", { name: "Dark" }));
    expect(within(dialog).getByRole("radio", { name: "Dark" })).toBeChecked();
    expect(document.documentElement).toHaveClass("dark");
    fireEvent.click(within(dialog).getByRole("radio", { name: "Light" }));
    expect(within(dialog).getByRole("radio", { name: "Light" })).toBeChecked();
    expect(document.documentElement).toHaveClass("light");
    fireEvent.click(within(dialog).getByRole("radio", { name: "System" }));
    expect(within(dialog).getByRole("radio", { name: "System" })).toBeChecked();
    expect(document.body).not.toHaveTextContent(/Reduced motion|reduced-motion|motion preference/i);
    expect(dialog).not.toHaveTextContent(/Billing|Notifications|Provider integration|Session|Signed out|Signed in/);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close appearance" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change appearance" })).toHaveFocus();
  });
  it("keeps the appearance choice after a refresh and applies it before sign-in", () => {
    localStorage.clear(); document.documentElement.className = "";
    const first = render(shell());
    fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(localStorage.getItem("theme")).toBe("dark");
    first.unmount(); document.documentElement.className = "";
    render(shell());
    expect(document.documentElement).toHaveClass("dark");
    fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    localStorage.clear(); document.documentElement.className = "";
  });
  it("supports keyboard use: Escape closes the appearance panel and returns focus to the icon", () => {
    render(shell()); fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    fireEvent.keyDown(screen.getByRole("radio", { name: "System" }), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change appearance" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("keeps Settings with a Theme select inside the signed-in account menu, with no motion copy", () => {
    signedIn(); render(shell()); fireEvent.click(account());
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const dialog = screen.getByRole("dialog", { name: "Settings" });
    const theme = within(dialog).getByRole("combobox", { name: "Theme" });
    expect(theme).toHaveFocus();
    expect(within(theme).getAllByRole("option").map(option => option.textContent)).toEqual(["System", "Light", "Dark"]);
    fireEvent.change(theme, { target: { value: "dark" } });
    expect(theme).toHaveValue("dark");
    fireEvent.change(theme, { target: { value: "system" } });
    expect(theme).toHaveValue("system");
    expect(within(dialog).queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change appearance" })).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/Reduced motion|reduced-motion|motion preference/i);
    expect(dialog).not.toHaveTextContent(/Billing|Notifications|Provider integration|Signed out|Signed in/);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close settings" }));
    expect(account()).toHaveFocus();
  });
  it("restores the account trigger when Settings closes after its menu unmounts", () => {
    signedIn(); render(shell()); fireEvent.click(account());
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    expect(account()).toHaveFocus();
    expect(account()).toHaveAttribute("aria-expanded", "false");
  });
  it("closes the appearance panel on outside click or keyboard focus exit without trapping focus", () => {
    render(shell()); fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside control" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    fireEvent.blur(screen.getByRole("radio", { name: "System" }), { relatedTarget: screen.getByRole("button", { name: "Outside control" }) });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("preserves the appearance controls through a non-focusing Safari click", () => {
    render(shell()); fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    const close = screen.getByRole("button", { name: "Close appearance" });
    fireEvent.pointerDown(close); fireEvent.blur(screen.getByRole("radio", { name: "System" }), { relatedTarget: null });
    fireEvent.click(close);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change appearance" })).toHaveFocus();
  });
  it("explains migration reasons and the three concrete customer questions", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Why businesses migrate" })).toBeVisible();
    for (const copy of [
      "Outgrown systems, fragmented data, manual processes and limited visibility can make everyday accounting harder to operate and scale.",
      "Support growth without adding manual work.", "Work securely from anywhere.",
      "Reduce disconnected tools and duplicate processes.", "Improve reporting and operational visibility.",
      "Customers, vendors, accounts, transactions and configuration need to arrive complete and usable.",
      "Balances, totals and reconciliation must match before migration is considered successful.",
      "Configuration, access and onboarding must work before the migration is truly complete.",
      "Migration is more than moving files. It is a financial-trust and business-readiness problem.",
    ]) expect(screen.getByText(copy)).toBeVisible();
    for (const question of ["Will all my data move correctly?", "Will my numbers still be right?", "Will my business be ready to operate?"]) expect(screen.getByRole("heading", { name: question })).toBeVisible();
    expect(screen.queryByText("Will everything move?")).not.toBeInTheDocument();
  });
  it("keeps mobile navigation and account controls separate and reachable", () => {
    render(shell());
    expect(screen.getByLabelText("Open navigation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change appearance" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });
  it("swaps public navigation for the signed-in product navigation only after verification, without fetching", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const view = render(shell());
    const links = (name: string | RegExp) => screen.queryAllByRole("link", { name, hidden: true });
    expect(links("My Migration")).toHaveLength(0);
    expect(links("How It Works")).toHaveLength(2);
    session.hasSession = true; session.ready = false; view.rerender(shell());
    expect(links("My Migration")).toHaveLength(0);
    expect(links("Start My Migration")).toHaveLength(0);
    signedIn(); session.ready = true; view.rerender(shell());
    expect(links("My Migration")).toHaveLength(2);
    for (const link of links("My Migration")) expect(link).toHaveAttribute("href", "/workspace");
    for (const [name, href] of [["Explore", "/simulator"], ["Learn", "/learn"], ["Help", "/support"]]) {
      expect(links(name)).toHaveLength(2);
      for (const link of links(name)) expect(link).toHaveAttribute("href", href);
    }
    for (const name of ["How It Works", "Play", "Trust", "Support", "Start My Migration", /Go to My Migration/]) expect(links(name)).toHaveLength(0);
    expect(account()).toHaveAccessibleName("Account: verified@example.test");
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
});
