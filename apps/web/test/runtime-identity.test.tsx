import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { authHeaders, safeDestination } from "@/lib/identity";
import { IdentityEntry } from "@/components/IdentityEntry";
import { RuntimeNotice } from "@/components/RuntimeNotice";
import { GET } from "@/app/api/auth/demo/route";

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
    render(<><IdentityEntry destination="/workspace" /><RuntimeNotice /></>);
    expect(screen.getByRole("button", {name:"Sign in with Google"})).toBeInTheDocument();
    expect(screen.queryByRole("link", {name:/enter local demo/i})).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", {name:"Runtime scope"})).toHaveTextContent(/local-only/);
  });
  it.each(["//evil.example", "/\\evil.example", "https://evil.example"])("rejects redirect %s", value => {
    expect(safeDestination(value)).toBe("/workspace");
  });
  it("preserves internal stage and scenario references", () => {
    expect(safeDestination("/assess?sample=harbor")).toBe("/assess?sample=harbor");
  });
  it("focuses a visible error when cloud sign-in is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
    render(<IdentityEntry destination="/workspace" />);
    fireEvent.click(screen.getByRole("button", {name:"Sign in with Google"}));
    expect(await screen.findByRole("alert")).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent(/No demo sign-in occurred/);
  });
});
