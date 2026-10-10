import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { Nav } from "@/components/Nav";
import { IdentityProvider } from "@/components/IdentityProvider";
import { IdentityEntry } from "@/components/IdentityEntry";
import { RuntimeNotice } from "@/components/RuntimeNotice";
import { WorkspaceEntry } from "@/components/WorkspaceEntry";

const mocks = vi.hoisted(() => ({ prepare: vi.fn(), verify: vi.fn(), navigate: vi.fn(), replace: vi.fn(), popup: vi.fn(), signOut: vi.fn(), unsubscribe: vi.fn() }));
vi.mock("@/lib/identity", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/identity")>(),
  prepareGoogleIdentity: mocks.prepare, verifiedIdentity: mocks.verify, navigateAfterAuth: mocks.navigate,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }), usePathname: () => window.location.pathname }));
let listener: (user: User | null) => void;
const user = { uid: "user-b", email: "untrusted-client@example.test" } as User;
const runtime = { signIn: mocks.popup, signOut: mocks.signOut, subscribe: (callback: typeof listener) => { listener = callback; callback(null); return mocks.unsubscribe; } };
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function mount(workspace = false) {
  return render(<IdentityProvider><Nav /><RuntimeNotice />{workspace ? <WorkspaceEntry /> : <IdentityEntry destination="/onboard-fpu?session=preserved" />}</IdentityProvider>);
}
// The sign-in buttons render immediately but stay disabled until the SDK is ready.
async function enabled(name: string, scope: Pick<typeof screen, "findByRole"> = screen) {
  const button = await scope.findByRole("button", { name });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
  mocks.prepare.mockResolvedValue(runtime);
  mocks.verify.mockResolvedValue({ subject: "firebase:user-b", email: "verified-b@example.test" });
  mocks.popup.mockReturnValue(new Promise(() => {}));
  mocks.signOut.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe("shared Google authentication controls", () => {
  it("shows verification immediately after popup completion and routes without reinitializing identity", async () => {
    const verification = deferred<{subject: string; email: string}>();
    mocks.verify.mockReturnValue(verification.promise); mocks.popup.mockResolvedValue({ user });
    mount();
    fireEvent.click(await enabled("Continue with Google"));
    const pending = await screen.findByRole("button", { name: "Account: verifying session" });
    expect(pending).toHaveTextContent("Verifying your account…");
    expect(pending).toBeDisabled();
    expect(screen.queryByText(/Updating session|Session needs attention|untrusted-client/)).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
    await act(async () => verification.resolve({ subject: "firebase:user-b", email: "verified-b@example.test" }));
    expect(screen.getByRole("button", { name: "Account: verified-b@example.test" })).toBeEnabled();
    expect(mocks.replace).toHaveBeenCalledWith("/onboard-fpu?session=preserved");
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.verify).toHaveBeenCalledTimes(1);
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
  });
  it("initializes once before enabling either control; first ready click starts popup synchronously", async () => {
    const init = deferred<typeof runtime>(); mocks.prepare.mockReturnValue(init.promise);
    mount();
    // Both controls show their real labels at once, but neither can start a popup before the SDK is ready.
    for (const button of [screen.getByRole("button", { name: "Sign in with Google" }), screen.getByRole("button", { name: "Continue with Google" })]) {
      expect(button).toBeDisabled(); expect(button).toHaveAttribute("aria-busy", "true"); fireEvent.click(button);
    }
    expect(document.body).not.toHaveTextContent(/Preparing Google sign-in/);
    expect(mocks.popup).not.toHaveBeenCalled();
    await act(async () => { init.resolve(runtime); });
    let inClick = false;
    mocks.popup.mockImplementation(() => { expect(inClick).toBe(true); return new Promise(() => {}); });
    inClick = true; fireEvent.click(screen.getByRole("button", { name: "Continue with Google" })); inClick = false;
    expect(mocks.popup).toHaveBeenCalledTimes(1);
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: "Signing in…" })).toHaveLength(2);
  });
  it("header Sign in starts the same popup directly and preserves the stage destination", async () => {
    window.history.replaceState(null, "", "/onboard-fpu?session=preserved");
    const popup = deferred<{ user: User }>(); mocks.popup.mockReturnValue(popup.promise);
    mount();
    fireEvent.click(await enabled("Sign in with Google", within(screen.getByRole("banner"))));
    expect(mocks.popup).toHaveBeenCalledTimes(1);
    await act(async () => popup.resolve({ user }));
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.verify).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Account: verified-b@example.test" })).toBeVisible();
  });
  it("workspace first-click CTA uses the same supported path", async () => {
    mount(true);
    const button = await enabled("Continue with Google", within(screen.getByRole("main")));
    expect(screen.getByRole("heading", { name: "Sign in to continue your migration" })).toBeVisible();
    expect(screen.getByRole("main")).toHaveTextContent("Use your Google account to securely access your MoveBooks migration.");
    expect(screen.getByRole("main")).toHaveTextContent("Bounded synthetic Beta · No production customer data");
    expect(screen.getByRole("main")).not.toHaveTextContent(/workspace ownership|API verifies|durable storage/);
    expect(button).not.toHaveClass("secondary");
    expect(button).not.toHaveClass("w-full");
    fireEvent.click(button);
    expect(mocks.popup).toHaveBeenCalledTimes(1);
  });
  it("SDK auth listener cannot race popup completion and consume the first successful navigation", async () => {
    const popup = deferred<{ user: User }>(); mocks.popup.mockReturnValue(popup.promise);
    mount();
    fireEvent.click(await enabled("Continue with Google"));
    await act(async () => { listener(user); popup.resolve({ user }); });
    expect(mocks.verify).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it("honors next when signing in from the header on the sign-in page", async () => {
    window.history.replaceState(null, "", "/sign-in?next=%2Fplan-map%3Fsession%3Dpreserved");
    mocks.popup.mockResolvedValue({ user }); mount();
    fireEvent.click(await enabled("Sign in with Google", within(screen.getByRole("banner"))));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/plan-map?session=preserved"));
  });
  it("coalesces duplicate clicks across header and primary controls", async () => {
    mount();
    const header = await enabled("Sign in with Google", within(screen.getByRole("banner")));
    const primary = screen.getByRole("button", { name: "Continue with Google" });
    fireEvent.click(header); fireEvent.click(primary); fireEvent.click(header);
    expect(mocks.popup).toHaveBeenCalledTimes(1);
  });
  it.each([
    ["auth/popup-blocked", "browser blocked"], ["auth/popup-closed-by-user", "closed before completion"],
    ["auth/cancelled-popup-request", "interrupted"], ["auth/network-request-failed", "connection"],
    ["auth/unauthorized-domain", "not configured for this site"], ["auth/web-storage-unsupported", "session storage"],
    ["auth/internal-error", "session verification failed"],
  ])("reports sanitized %s distinctly without automatic retries", async (code, message) => {
    mocks.popup.mockRejectedValue({ code, message: "SECRET_PROVIDER_DETAIL" }); mount();
    fireEvent.click(await enabled("Sign in with Google", within(screen.getByRole("banner"))));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(message); expect(alert).not.toHaveTextContent("SECRET_PROVIDER_DETAIL");
    await waitFor(() => expect(alert).toHaveFocus()); expect(mocks.popup).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).not.toHaveBeenCalled();
    await waitFor(() => expect(within(screen.getByRole("banner")).getByRole("button", { name: "Sign in with Google" })).toBeEnabled());
  });
  it("reports initialization failure before interaction and never uses demo auth", async () => {
    mocks.prepare.mockRejectedValue(new Error("SECRET")); mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("initialization failed");
    expect(screen.queryByText(/enter local demo/i)).not.toBeInTheDocument();
    expect(mocks.popup).not.toHaveBeenCalled();
  });
  it("restores and displays API identity, not client email or approval actor", async () => {
    mount(); await enabled("Sign in with Google", within(screen.getByRole("banner")));
    await act(async () => listener(user));
    expect(screen.getByRole("button", { name: "Account: verified-b@example.test" })).toBeVisible();
    expect(screen.queryByText(/untrusted-client/)).not.toBeInTheDocument();
    expect(mocks.verify).toHaveBeenCalledWith(user);
  });
  it("clears displayed identity on token loss", async () => {
    mount(); await enabled("Sign in with Google", within(screen.getByRole("banner")));
    await act(async () => listener(user)); await act(async () => listener(null));
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Account:.*@/ })).not.toBeInTheDocument();
  });
  it("waits for API verification without showing attention or a client-only email", async () => {
    const verification = deferred<{subject: string; email: string}>(); mocks.verify.mockReturnValue(verification.promise);
    mount(); await enabled("Sign in with Google", within(screen.getByRole("banner")));
    act(() => listener(user));
    expect(screen.getByRole("button", { name: "Account: verifying session" })).toHaveTextContent("Verifying your account…");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/Session needs attention|untrusted-client/)).not.toBeInTheDocument();
    await act(async () => verification.resolve({ subject: "firebase:user-b", email: "verified-b@example.test" }));
    expect(screen.getByRole("button", { name: "Account: verified-b@example.test" })).toBeVisible();
  });
  it("clears a previous verification error while a fresh SDK identity verification is pending", async () => {
    mocks.verify.mockRejectedValueOnce(new Error("failed"));
    mount(); await enabled("Sign in with Google", within(screen.getByRole("banner")));
    await act(async () => listener(user));
    expect(screen.getByRole("alert")).toHaveTextContent("could not be verified");
    const verification = deferred<{subject: string; email: string}>(); mocks.verify.mockReturnValueOnce(verification.promise);
    act(() => listener(user));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account: verifying session" })).toBeVisible();
    await act(async () => verification.resolve({ subject: "firebase:user-b", email: "verified-b@example.test" }));
    expect(screen.getByRole("button", { name: "Account: verified-b@example.test" })).toBeVisible();
  });
  it.each(["resolve", "reject"] as const)("ignores an older verification that later %ss after current identity is verified", async outcome => {
    const old = deferred<{subject: string; email: string}>(); mocks.verify.mockReturnValueOnce(old.promise);
    mount(); await enabled("Sign in with Google", within(screen.getByRole("banner")));
    act(() => listener(user));
    await act(async () => listener(user));
    expect(screen.getByRole("button", { name: "Account: verified-b@example.test" })).toBeVisible();
    await act(async () => {
      if (outcome === "resolve") old.resolve({ subject: "firebase:other", email: "stale@example.test" });
      else old.reject(new Error("stale failure"));
    });
    expect(screen.getByRole("button", { name: "Account: verified-b@example.test" })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/stale@example|Session needs attention/)).not.toBeInTheDocument();
  });
  it("does not label an API-rejected session as signed in or navigate after login", async () => {
    mocks.verify.mockRejectedValue(new Error("rejected")); mocks.popup.mockResolvedValue({ user }); mount();
    fireEvent.click(await enabled("Sign in with Google", within(screen.getByRole("banner"))));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be verified");
    expect(screen.queryByRole("button", { name: /Account:.*@/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument(); expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Account:.*@/ })).not.toBeInTheDocument();
  });
  it("signs out, clears selected-session references, and navigates only after success", async () => {
    const done = deferred<void>(); mocks.signOut.mockReturnValue(done.promise);
    const selectedKeys = ["movebooks-migration-session", "movebooks-validation-session", "movebooks-onboarding-session"];
    for (const key of selectedKeys) sessionStorage.setItem(key, "preserved");
    sessionStorage.setItem("unrelated", "keep"); mount();
    await enabled("Sign in with Google", within(screen.getByRole("banner"))); await act(async () => listener(user));
    fireEvent.click(screen.getByRole("button", { name: /^Account:/ }));
    const signOut = screen.getByRole("button", { name: "Sign Out" });
    fireEvent.pointerDown(signOut); fireEvent.mouseDown(signOut);
    fireEvent.blur(screen.getByRole("button", { name: "Settings" }), { relatedTarget: null });
    fireEvent.mouseUp(signOut); fireEvent.click(signOut);
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(within(screen.getByRole("banner")).queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
    expect(sessionStorage.getItem(selectedKeys[0])).toBe("preserved");
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument(); expect(mocks.navigate).not.toHaveBeenCalled();
    await act(async () => done.resolve());
    expect(mocks.navigate).toHaveBeenCalledWith("/sign-in");
    for (const key of selectedKeys) expect(sessionStorage.getItem(key)).toBeNull();
    expect(within(screen.getByRole("banner")).getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
    expect(sessionStorage.getItem("unrelated")).toBe("keep");
  });
  it("does not claim successful sign-out on SDK failure", async () => {
    mocks.signOut.mockRejectedValue(new Error("SECRET")); mount();
    await enabled("Sign in with Google", within(screen.getByRole("banner")));
    await act(async () => listener(user));
    fireEvent.click(screen.getByRole("button", { name: /^Account:/ })); fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sign-out could not be confirmed");
    expect(screen.getByRole("alert")).not.toHaveTextContent("SECRET");
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(within(screen.getByRole("banner")).queryByRole("button", { name: "Sign in with Google" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Account:/ }));
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeEnabled();
  });
  it("late identity verification cannot restore an account after sign-out", async () => {
    const verification = deferred<{subject: string; email: string}>(); mocks.verify.mockReturnValue(verification.promise);
    const signOut = deferred<void>(); mocks.signOut.mockReturnValue(signOut.promise);
    mount(); await enabled("Sign in with Google", within(screen.getByRole("banner")));
    act(() => listener(user)); fireEvent.click(screen.getByRole("button", { name: /^Account:/ })); fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));
    expect(screen.getByRole("button", { name: "Account: signing out" })).toHaveTextContent("Signing out…");
    expect(screen.queryByRole("button", { name: "Account: verifying session" })).not.toBeInTheDocument();
    await act(async () => verification.resolve({ subject: "firebase:user-b", email: "stale@example.test" }));
    await act(async () => signOut.resolve());
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Account:.*@/ })).not.toBeInTheDocument();
  });
  it("unsubscribes and ignores late verification on unmount", async () => {
    const verification = deferred<{subject: string; email: string}>(); mocks.verify.mockReturnValue(verification.promise);
    const view = mount(); await enabled("Sign in with Google", within(screen.getByRole("banner")));
    act(() => listener(user)); view.unmount();
    await act(async () => verification.resolve({ subject: "firebase:user-b", email: "stale@example.test" }));
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1); expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it("sanitizes sign-in destinations before client navigation", async () => {
    mocks.popup.mockResolvedValue({ user });
    render(<IdentityProvider><IdentityEntry destination="//untrusted.example" /></IdentityProvider>);
    fireEvent.click(await enabled("Continue with Google"));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/workspace"));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
