import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextRequest } from "next/server";
import { authHeaders, safeDestination } from "@/lib/identity";
import { IdentityEntry } from "@/components/IdentityEntry";
import { RuntimeNotice } from "@/components/RuntimeNotice";
import { Nav } from "@/components/Nav";
import { IdentityProvider } from "@/components/IdentityProvider";
import { GET } from "@/app/api/auth/demo/route";
const route = vi.hoisted(() => ({ path: "/trust" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.path }));

afterEach(() => vi.unstubAllEnvs());
describe("truthful runtime identity", () => {
  it("retains credential-free local demo", async () => {
    expect(await authHeaders()).toEqual({Authorization:"Bearer demo-user"});
    render(<IdentityEntry destination="/workspace" />);
    expect(screen.getByRole("link", {name:/enter local demo/i})).toBeInTheDocument();
  });
  it("does not use demo identity in a production build", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(authHeaders()).rejects.toThrow(/disabled/i);
    render(<IdentityEntry destination="/workspace" />);
    expect(screen.getByRole("status")).toHaveTextContent(/not configured/i);
  });
  it("fails closed without cloud HTTPS or Firebase configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
    await expect(authHeaders()).rejects.toThrow(/HTTPS/);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
    await expect(authHeaders()).rejects.toThrow(/not configured/i);
    expect((await GET(new NextRequest("http://localhost/api/auth/demo"))).status).toBe(404);
  });
  it("labels cloud scope without claiming successful sign-in", () => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
    render(<IdentityProvider><Nav /><IdentityEntry destination="/workspace" /><RuntimeNotice /></IdentityProvider>);
    expect(screen.getAllByRole("button", {name:"Preparing Google sign-in…"})).toHaveLength(2);
    expect(screen.queryByRole("link", {name:/enter local demo/i})).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", {name:"Beta scope"})).toHaveTextContent(/safely using synthetic data/);
    expect(screen.getByRole("link", {name:"Beta limitations"})).toHaveAttribute("href", "/trust#beta-limitations");
  });
  it.each(["/", "/product", "/workspace", "/sign-in"])("does not duplicate the scope note on %s", path => {
    route.path = path;
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
    render(<IdentityProvider><RuntimeNotice /></IdentityProvider>);
    expect(screen.queryByRole("complementary", {name:"Beta scope"})).not.toBeInTheDocument();
    route.path = "/trust";
  });
  it.each(["//evil.example", "/\\evil.example", "https://evil.example", "/\n/evil.example", "/\t/evil.example"])("rejects redirect %s", value => {
    expect(safeDestination(value)).toBe("/workspace");
  });
  it("preserves internal stage and scenario references", () => {
    expect(safeDestination("/assess?sample=harbor")).toBe("/assess?sample=harbor");
  });
  it("focuses a visible error when cloud sign-in is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
    render(<IdentityProvider><Nav /><IdentityEntry destination="/workspace" /><RuntimeNotice /></IdentityProvider>);
    // Initialization fails before any click, not after losing user activation.
    expect(screen.getAllByRole("button", {name:"Preparing Google sign-in…"})[0]).toBeDisabled();
    const alert = await screen.findByRole("alert");
    // Focus is applied by an effect after the error node is committed.
    await waitFor(() => expect(alert).toHaveFocus());
    expect(screen.getByRole("alert")).toHaveTextContent(/No demo sign-in occurred/);
  });
});
