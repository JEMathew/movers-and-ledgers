import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "firebase/auth";
import { Nav } from "@/components/Nav";
import { IdentityProvider } from "@/components/IdentityProvider";
import { IdentityEntry } from "@/components/IdentityEntry";
import { RuntimeNotice } from "@/components/RuntimeNotice";
import { WorkspaceEntry } from "@/components/WorkspaceEntry";

const mocks = vi.hoisted(() => ({ prepare: vi.fn(), verify: vi.fn(), navigate: vi.fn(), popup: vi.fn(), signOut: vi.fn(), unsubscribe: vi.fn() }));
vi.mock("@/lib/identity", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/identity")>(),
  prepareGoogleIdentity: mocks.prepare, verifiedIdentity: mocks.verify, navigateAfterAuth: mocks.navigate,
}));
let listener: (user: User | null) => void;
const user = { uid: "user-b", email: "untrusted-client@example.test" } as User;
const runtime = { signIn: mocks.popup, signOut: mocks.signOut, subscribe: (callback: typeof listener) => { listener = callback; callback(null); return mocks.unsubscribe; } };
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (error: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function mount(workspace = false) {
  return render(<IdentityProvider><Nav /><RuntimeNotice />{workspace ? <WorkspaceEntry /> : <IdentityEntry destination="/onboard-fpu?session=preserved" />}</IdentityProvider>);
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
  it("initializes once before enabling either control; first ready click starts popup synchronously", async () => {
    const init = deferred<typeof runtime>(); mocks.prepare.mockReturnValue(init.promise);
    mount();
    for (const button of screen.getAllByRole("button", { name: "Preparing Google sign-in…" })) {
      expect(button).toBeDisabled(); fireEvent.click(button);
    }
    expect(mocks.popup).not.toHaveBeenCalled();
    await act(async () => { init.resolve(runtime); });
    let inClick = false;
    mocks.popup.mockImplementation(() => { expect(inClick).toBe(true); return new Promise(() => {}); });
    inClick = true; fireEvent.click(screen.getAllByRole("button", { name: "Sign in with Google" }).at(-1)!); inClick = false;
    expect(mocks.popup).toHaveBeenCalledTimes(1);
    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: "Signing in…" })).toHaveLength(2);
  });
  it("header Sign in starts the same popup directly and preserves the stage destination", async () => {
    window.history.replaceState(null, "", "/onboard-fpu?session=preserved");
    const popup = deferred<{ user: User }>(); mocks.popup.mockReturnValue(popup.promise);
    mount();
    fireEvent.click(await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" }));
    expect(mocks.popup).toHaveBeenCalledTimes(1);
    await act(async () => popup.resolve({ user }));
    expect(mocks.navigate).toHaveBeenCalledWith("/onboard-fpu?session=preserved");
    expect(screen.getByRole("button", { name: "Account: verified-b@example.test" })).toBeVisible();
  });
  it("workspace first-click CTA uses the same supported path", async () => {
    mount(true);
    fireEvent.click(await within(screen.getByRole("main")).findByRole("button", { name: "Sign in with Google" }));
    expect(mocks.popup).toHaveBeenCalledTimes(1);
  });
  it("SDK auth listener cannot race popup completion and consume the first successful navigation", async () => {
    const popup = deferred<{ user: User }>(); mocks.popup.mockReturnValue(popup.promise);
    mount();
    fireEvent.click(await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" }));
    await act(async () => { listener(user); popup.resolve({ user }); });
    expect(mocks.verify).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
  });
  it("honors next when signing in from the header on the sign-in page", async () => {
    window.history.replaceState(null, "", "/sign-in?next=%2Fplan-map%3Fsession%3Dpreserved");
    mocks.popup.mockResolvedValue({ user }); mount();
    fireEvent.click(await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/plan-map?session=preserved"));
  });
  it("coalesces duplicate clicks across header and primary controls", async () => {
    mount();
    const header = await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" });
    const primary = screen.getAllByRole("button", { name: "Sign in with Google" }).at(-1)!;
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
    fireEvent.click(await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" }));
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
    mount(); await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" });
    await act(async () => listener(user));
    expect(screen.getByRole("button", { name: "Account: verified-b@example.test" })).toBeVisible();
    expect(screen.queryByText(/untrusted-client/)).not.toBeInTheDocument();
    expect(mocks.verify).toHaveBeenCalledWith(user);
  });
  it("clears displayed identity on token loss", async () => {
    mount(); await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" });
    await act(async () => listener(user)); await act(async () => listener(null));
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Account:.*@/ })).not.toBeInTheDocument();
  });
  it("does not label an API-rejected session as signed in or navigate after login", async () => {
    mocks.verify.mockRejectedValue(new Error("rejected")); mocks.popup.mockResolvedValue({ user }); mount();
    fireEvent.click(await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be verified");
    expect(screen.queryByRole("button", { name: /Account:.*@/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument(); expect(mocks.navigate).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Account:.*@/ })).not.toBeInTheDocument();
  });
  it("signs out, clears selected-session references, and navigates only after success", async () => {
    const done = deferred<void>(); mocks.signOut.mockReturnValue(done.promise);
    sessionStorage.setItem("movebooks-migration-session", "preserved");
    sessionStorage.setItem("unrelated", "keep"); mount();
    await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" }); await act(async () => listener(user));
    fireEvent.click(screen.getByRole("button", { name: /^Account:/ })); fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument(); expect(mocks.navigate).not.toHaveBeenCalled();
    await act(async () => done.resolve());
    expect(mocks.navigate).toHaveBeenCalledWith("/sign-in");
    expect(sessionStorage.getItem("movebooks-migration-session")).toBeNull();
    expect(sessionStorage.getItem("unrelated")).toBe("keep");
  });
  it("does not claim successful sign-out on SDK failure", async () => {
    mocks.signOut.mockRejectedValue(new Error("SECRET")); mount();
    await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" });
    await act(async () => listener(user));
    fireEvent.click(screen.getByRole("button", { name: /^Account:/ })); fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sign-out could not be confirmed");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it("late identity verification cannot restore an account after sign-out", async () => {
    const verification = deferred<{subject: string; email: string}>(); mocks.verify.mockReturnValue(verification.promise);
    mount(); await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" });
    act(() => listener(user)); fireEvent.click(screen.getByRole("button", { name: /^Account:/ })); fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await act(async () => verification.resolve({ subject: "firebase:user-b", email: "stale@example.test" }));
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Account:.*@/ })).not.toBeInTheDocument();
  });
  it("unsubscribes and ignores late verification on unmount", async () => {
    const verification = deferred<{subject: string; email: string}>(); mocks.verify.mockReturnValue(verification.promise);
    const view = mount(); await within(screen.getByRole("banner")).findByRole("button", { name: "Sign in with Google" });
    act(() => listener(user)); view.unmount();
    await act(async () => verification.resolve({ subject: "firebase:user-b", email: "stale@example.test" }));
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1); expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
