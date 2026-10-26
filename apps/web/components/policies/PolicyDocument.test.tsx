import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import Privacy from "@/app/privacy/page";
import Terms from "@/app/terms/page";
import { Footer } from "@/components/Footer";
import { middleware, STATIC_HTML_CACHE } from "@/middleware";

afterEach(() => vi.unstubAllEnvs());

describe("public disclosure routes", () => {
  it.each([["Privacy Policy", Privacy], ["Terms of Use", Terms]] as const)("renders final %s without review placeholders or fetching account data", (title, Page) => {
    const fetch = vi.spyOn(globalThis, "fetch");
    render(<Page/>);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    expect(screen.queryByText(/Local review draft|Draft for owner review|Owner decisions before publication|owner has not yet confirmed|to be set/)).not.toBeInTheDocument();
    expect(screen.getByText("Effective date: the date this policy is first published at https://movebooks-si.web.app/.")).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
    expect(document.querySelectorAll("form,input,textarea")).toHaveLength(0);
    fetch.mockRestore();
  });
  it.each(["firebase", "demo"])("allows anonymous policy access in %s mode without weakening protected routes", mode => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", mode);
    for (const path of ["/privacy", "/terms"]) {
      const response = middleware(new NextRequest(`https://example.test${path}`));
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("Cache-Control")).toBe(STATIC_HTML_CACHE);
    }
    if (mode === "demo") expect(new URL(middleware(new NextRequest("https://example.test/workspace")).headers.get("location")!).pathname).toBe("/sign-in");
  });
  it("provides genuine policy destinations in the shared homepage and sign-in footer", () => {
    render(<Footer/>);
    const footer = within(screen.getByRole("navigation", { name: "Footer" }));
    expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(footer.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(footer.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/support");
  });
  it("states verified deletion limits and the approved privacy contact without invented guarantees", () => {
    render(<Privacy/>);
    expect(screen.getByText(/Signing out ends the application session/)).toHaveTextContent(/does not delete your Firebase account/);
    expect(screen.getByText(/does not currently provide a self-service/)).toBeVisible();
    expect(screen.getByText(/seven-day soft-delete window/)).toHaveTextContent(/does not automatically delete active objects/);
    expect(screen.getByRole("link", { name: "jeasom@gmail.com" })).toHaveAttribute("href", "mailto:jeasom@gmail.com");
    expect(screen.getByText(/There is no verified end-to-end deletion procedure/)).toHaveTextContent(/removal from all backups or copies is not promised/);
  });
  it("states the approved global audience, operator location and minimum age", () => {
    render(<Terms/>);
    expect(screen.getByText(/India identifies the operator/)).toHaveTextContent(/Jincen Mathew/);
    expect(screen.getByText("You must be at least 18 years old to use the MVP.")).toBeVisible();
    expect(screen.getByText(/not a commercial accounting or financial advisory service/)).toBeVisible();
    expect(screen.getByRole("link", { name: "jeasom@gmail.com" })).toHaveAttribute("href", "mailto:jeasom@gmail.com");
  });
});
