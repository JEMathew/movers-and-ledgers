import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, middleware, STATIC_HTML_CACHE, STATIC_HTML_ROUTES } from "../middleware";

afterEach(() => vi.unstubAllEnvs());
const app = resolve(__dirname, "../app");

/** Routes whose page is prerendered: a page.tsx with no dynamic API use (searchParams, cookies, headers, redirect). */
function staticRoutes() {
  const pages: string[] = [];
  const walk = (dir: string) => readdirSync(dir).forEach(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) { if (!name.startsWith("api")) walk(path); }
    else if (name === "page.tsx") pages.push(path);
  });
  walk(app);
  return pages.filter(page => !/searchParams|cookies\(|headers\(|redirect\(|force-dynamic/.test(readFileSync(page, "utf8")))
    .map(page => "/" + relative(app, page).replace(/\/?page\.tsx$/, "")).map(route => route === "/" ? "/" : route.replace(/\/$/, "")).sort();
}

describe("HTML caching for prerendered pages", () => {
  it("covers exactly the prerendered pages", () => {
    expect([...STATIC_HTML_ROUTES].sort()).toEqual(staticRoutes());
  });
  it.each(["firebase", "demo"])("bounds shared caching of static HTML to a minute (%s identity mode)", mode => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", mode);
    for (const route of ["/", "/simulator", "/guide", "/play"]) {
      expect(middleware(new NextRequest(`http://localhost${route}`)).headers.get("Cache-Control")).toBe(STATIC_HTML_CACHE);
    }
  });
  it("leaves dynamic pages to Next's own private, no-store", () => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "firebase");
    for (const route of ["/learn", "/trust", "/sign-in", "/workspace", "/product"]) {
      expect(middleware(new NextRequest(`http://localhost${route}`)).headers.get("Cache-Control")).toBeNull();
    }
  });
  it("keeps the demo sign-in boundary unchanged on protected routes", () => {
    vi.stubEnv("NEXT_PUBLIC_IDENTITY_MODE", "demo");
    const response = middleware(new NextRequest("http://localhost/try-your-data"));
    expect(new URL(response.headers.get("location")!).pathname).toBe("/sign-in");
  });
  it("matches every protected prefix as before, and never hashed assets or the API proxy", () => {
    for (const prefix of ["/try-your-data/:path*", "/workspace/:path*", "/approvals/:path*", "/reports/:path*", "/assess/:path*"]) expect(config.matcher).toContain(prefix);
    expect(config.matcher.some(entry => entry.startsWith("/_next") || entry.startsWith("/api"))).toBe(false);
  });
});
