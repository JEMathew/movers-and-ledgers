import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { middleware } from "../middleware";
import { GET } from "../app/api/auth/demo/route";
describe("public introductions and protected execution", () => {
  it("allows the public Simulator introduction", () => {
    expect(middleware(new NextRequest("http://localhost/simulator")).headers.get("location")).toBeNull();
  });
  it("preserves the canonical scenario through the existing authentication boundary", () => {
    const response = middleware(new NextRequest("http://localhost/assess?sample=harbor-light-migrate-demo"));
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/sign-in");
    expect(location.searchParams.get("next")).toBe("/assess?sample=harbor-light-migrate-demo");
  });
  it("does not activate production demo authentication", async () => {
    vi.stubEnv("NODE_ENV", "production");
    try { expect((await GET(new NextRequest("http://localhost/api/auth/demo"))).status).toBe(404); }
    finally { vi.unstubAllEnvs(); }
  });
});
