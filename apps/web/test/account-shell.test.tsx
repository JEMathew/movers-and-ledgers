import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import SignIn from "@/app/sign-in/page";
import Home from "@/app/page";

const session = vi.hoisted(() => ({ ready: true, busy: false, hasSession: false,
  identity: null as null | { subject: string; email: string }, error: "", signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("@/components/IdentityProvider", () => ({ useIdentity: () => session }));
vi.mock("next/navigation", () => ({ usePathname: () => window.location.pathname }));
function shell() { return <ThemeProvider><Nav /><button>Outside control</button></ThemeProvider>; }
function account() { return screen.getByRole("button", { name: /^Account:/ }); }
function signedIn() { session.hasSession = true; session.identity = { subject: "firebase:internal-only", email: "verified@example.test" }; }
beforeEach(() => {
  window.history.replaceState(null, "", "/");
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((media: string) => ({ media, matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
  Object.assign(session, { ready: true, busy: false, hasSession: false, identity: null, error: "" });
  vi.clearAllMocks();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("global account and settings shell", () => {
  it.each(["/", "/sign-in", "/simulator", "/try-your-data", "/workspace", "/settings", "/migration/synthetic"])(
    "keeps factual provider attribution exclusive to the marketing homepage: %s", pathname => {
      window.history.replaceState(null, "", pathname);
      render(shell());
      const lines = document.querySelectorAll(".v2-attribution");
      expect(lines).toHaveLength(pathname === "/" ? 1 : 0);
      if (pathname === "/") expect(lines[0]).toHaveTextContent(/^Built on Google Cloud · Built with Google Gemini$/);
      expect(screen.getByRole("banner")).not.toHaveTextContent(/powered by|endorsed|sponsored|partnership/i);
      if (pathname === "/") {
        expect(screen.getByRole("img", { name: "Google Cloud logo" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Google Gemini logo" })).toBeInTheDocument();
      } else {
        expect(screen.getByRole("banner")).not.toHaveTextContent(/Gemini|Built on Google Cloud/i);
        expect(screen.queryByRole("img", { name: /Google (Cloud|Gemini) logo/ })).not.toBeInTheDocument();
      }
      const brand = screen.getByRole("link", { name: "MoveBooks AI home" });
      expect(brand).toHaveAttribute("href", "/");
      expect(brand.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(brand.querySelector("svg")).toHaveAttribute("viewBox", "0 0 32 32");
    });
  it("preserves the verified member-home identity without persistent provider attribution", () => {
    window.history.replaceState(null, "", "/workspace");
    signedIn();
    render(shell());
    expect(screen.getByRole("link", { name: "MoveBooks AI, member home" })).toHaveAttribute("href", "/workspace");
    expect(document.querySelector(".v2-attribution")).toBeNull();
    expect(screen.getByRole("banner")).not.toHaveTextContent(/Google Cloud|Gemini/);
  });
  it("in the local demo workspace offers My Migration and no dead Sign in control", () => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "demo");
    render(shell());
    const banner = screen.getByRole("banner");
    expect(within(banner).queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
    expect(within(banner).queryByRole("link", { name: "Start My Migration" })).not.toBeInTheDocument();
    expect(within(banner).getByRole("link", { name: "My Migration" })).toHaveAttribute("href", "/workspace");
  });
  it("keeps sign-in and appearance utilities without a competing header launch", () => {
    render(shell());
    const banner = screen.getByRole("banner");
    const signIn = within(banner).getByRole("button", { name: "Sign in with Google" });
    expect(signIn).toBeEnabled();
    expect(signIn).toHaveClass("header-sign-in");
    expect(signIn).toHaveTextContent("Sign In");
    expect(within(banner).queryByRole("link", { name: "Start My Migration" })).not.toBeInTheDocument();
    expect(within(banner).queryByRole("link", { name: "Start a sample migration" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change appearance" })).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
    fireEvent.click(signIn);
    expect(session.signIn).toHaveBeenCalledWith("/");
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
    expect(account()).toHaveTextContent("Account");
    expect(screen.queryByText("Session needs attention")).not.toBeInTheDocument();
    expect(account()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
    // The appearance shortcut stays in the header after sign-in.
    expect(screen.getByRole("button", { name: "Change appearance" })).toBeEnabled();
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
  it("offers Dark, Light and System from the appearance icon, Dark by default, and nothing about motion", () => {
    render(shell()); screen.getByRole("button", { name: "Change appearance" }).focus(); fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    const dialog = screen.getByRole("dialog", { name: "Appearance" });
    expect(screen.getByRole("button", { name: "Change appearance" })).toHaveAttribute("aria-expanded", "true");
    const options = within(dialog).getAllByRole("radio");
    expect(options.map(option => (option as HTMLInputElement).value)).toEqual(["dark", "light", "system"]);
    // First-time visitors get Dark (approved V2 design); the checked option takes focus.
    expect(within(dialog).getByRole("radio", { name: "Dark" })).toBeChecked();
    expect(within(dialog).getByRole("radio", { name: "Dark" })).toHaveFocus();
    expect(dialog).toHaveAttribute("aria-modal", "false");
    expect(dialog).toHaveTextContent("System follows your device appearance");
    fireEvent.click(within(dialog).getByRole("radio", { name: "Light" }));
    expect(document.documentElement).toHaveClass("light");
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
    fireEvent.keyDown(within(dialog).getByRole("radio", { name: "System" }), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change appearance" })).toHaveFocus();
  });
  it("keeps the appearance choice after a refresh and applies it before sign-in", () => {
    localStorage.clear(); document.documentElement.className = "";
    const first = render(shell());
    fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    fireEvent.click(screen.getByRole("radio", { name: "Light" }));
    expect(localStorage.getItem("theme")).toBe("light");
    first.unmount(); document.documentElement.className = "";
    render(shell());
    expect(document.documentElement).toHaveClass("light");
    fireEvent.click(screen.getByRole("button", { name: "Change appearance" }));
    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
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
  it("keeps Settings to Trust and Security and Appearance inside the signed-in account menu, with no motion copy", () => {
    signedIn(); render(shell()); fireEvent.click(account());
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const dialog = screen.getByRole("dialog", { name: "Settings" });
    expect(within(dialog).getByRole("radio", { name: "Dark" })).toHaveFocus();
    expect(within(dialog).getAllByRole("radio").map(option => (option as HTMLInputElement).value)).toEqual(["dark", "light", "system"]);
    fireEvent.click(within(dialog).getByRole("radio", { name: "System" }));
    expect(within(dialog).getByRole("radio", { name: "System" })).toBeChecked();
    expect(within(dialog).getByRole("link", { name: "Trust and Security" })).toHaveAttribute("href", "/trust");
    expect(within(dialog).getAllByRole("link")).toHaveLength(1);
    expect(within(dialog).queryByRole("combobox")).not.toBeInTheDocument();
    expect(dialog).not.toHaveTextContent(/Profile|Workspace|Sign Out/);
    expect(document.body).not.toHaveTextContent(/Reduced motion|reduced-motion|motion preference/i);
    expect(dialog).not.toHaveTextContent(/Billing|Notifications|Provider integration|Signed out|Signed in/);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close settings" }));
    expect(account()).toHaveFocus();
  });
  it("restores the account trigger when Settings closes after its menu unmounts", () => {
    signedIn(); render(shell()); fireEvent.click(account());
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.keyDown(screen.getByRole("radio", { name: "Dark" }), { key: "Escape" });
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
    const light = screen.getByRole("radio", { name: "Light" });
    fireEvent.pointerDown(light); fireEvent.blur(screen.getByRole("radio", { name: "Dark" }), { relatedTarget: null });
    fireEvent.click(light);
    expect(screen.getByRole("dialog", { name: "Appearance" })).toBeInTheDocument();
    expect(light).toBeChecked();
  });
  it("keeps the three concrete customer questions, with no migration-reasons section", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Three Questions. One Confident Move." })).toBeVisible();
    for (const copy of [
      "Customers, vendors, accounts, transactions and settings need to arrive complete and usable.",
      "Balances, totals and reconciliation must match before the move counts as a success.",
      "Settings, access and onboarding must work before the move is truly complete.",
    ]) expect(screen.getByText(copy)).toBeVisible();
    for (const question of ["Will All My Data Move Correctly?", "Will My Numbers Still Be Right?", "Will My Business Be Ready to Operate?"]) expect(screen.getByRole("heading", { name: question })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Why businesses migrate" })).not.toBeInTheDocument();
  });
  it("keeps mobile navigation and account controls separate and reachable", () => {
    render(shell());
    expect(screen.getByLabelText("Open navigation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change appearance" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });
  it("uses verified member navigation even on Play, without fetching or starting a task", () => {
    window.history.replaceState(null, "", "/play");
    const fetch = vi.spyOn(globalThis, "fetch");
    const view = render(shell());
    const primary = () => screen.getByRole("navigation", { name: "Primary navigation" });
    expect(within(primary()).queryByRole("link", { name: "My Migration" })).not.toBeInTheDocument();
    expect(within(primary()).getAllByRole("link").map(a => a.textContent)).toEqual(["Learn", "Trust and Security"]);
    expect(screen.getByRole("link", { name: "MoveBooks AI home" })).toHaveAttribute("href", "/");
    session.hasSession = true; session.ready = false; view.rerender(shell());
    expect(within(primary()).queryByRole("link", { name: "My Migration" })).not.toBeInTheDocument();
    signedIn(); session.ready = true; view.rerender(shell());
    // Play stays reachable at /play but is out of navigation while its flag is off.
    expect(within(primary()).getAllByRole("link").map(a => [a.textContent, a.getAttribute("href")])).toEqual([
      ["My Migration", "/workspace"], ["Explore Demo", "/simulator"], ["Learn", "/learn"], ["Trust and Security", "/trust"]]);
    // After sign-in the logo is Member Home.
    expect(screen.getByRole("link", { name: "MoveBooks AI, member home" })).toHaveAttribute("href", "/workspace");
    fireEvent.click(account());
    expect(screen.queryByRole("navigation", { name: "Explore MoveBooks" })).not.toBeInTheDocument();
    expect(session.signIn).not.toHaveBeenCalled();
    expect(session.signOut).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
  it("closes navigation on Escape and returns focus to the menu trigger", () => {
    render(shell());
    const menu = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    const demo = within(screen.getByRole("navigation", { name: "Primary navigation" })).getByRole("link", { name: "Learn" });
    expect(demo).toHaveFocus();
    fireEvent.keyDown(demo, { key: "Escape" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(menu).toHaveFocus();
  });
  it("closes the mobile menu when resizing to desktop", () => {
    render(shell());
    const menu = screen.getByRole("button", { name: "Open navigation" });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    fireEvent(window, new Event("resize"));
    expect(menu).toHaveAttribute("aria-expanded", "false");
  });
  it("closes navigation on selection, outside pointer and focus exit", () => {
    render(shell());
    const menu = screen.getByRole("button", { name: "Open navigation" });
    const demo = within(screen.getByRole("navigation", { name: "Primary navigation" })).getByRole("link", { name: "Learn" });
    demo.addEventListener("click", event => event.preventDefault());
    fireEvent.click(menu); fireEvent.click(demo);
    expect(menu).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menu); fireEvent.pointerDown(screen.getByRole("button", { name: "Outside control" }));
    expect(menu).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menu); fireEvent.blur(demo, { relatedTarget: screen.getByRole("button", { name: "Outside control" }) });
    expect(menu).toHaveAttribute("aria-expanded", "false");
  });
});
