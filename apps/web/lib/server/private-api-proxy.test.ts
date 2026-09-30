import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxyConfig, proxyRequest, type ProxyDependencies } from "./private-api-proxy";
import { allowedRoute } from "./proxy-policy";

const config = { upstream: "https://private-api.example.run.app", publicOrigin: "https://web.example.run.app", projectId: "synthetic-project" };
const id = "00000000-0000-4000-8000-000000000001";
const path = `/api/v1/migration-sessions/${id}`;
const token = "synthetic.header.signature";
let dependencies: ProxyDependencies;
function request(route = path, init: RequestInit = {}) {
  return new Request(`${config.publicOrigin}${route}`, { ...init, headers: { Authorization: `Bearer ${token}`, Origin: config.publicOrigin, ...init.headers } });
}
beforeEach(() => {
  dependencies = { verifyUser: vi.fn().mockResolvedValue(undefined), workloadAuthorization: vi.fn().mockResolvedValue("Bearer workload-only"), fetch: vi.fn().mockResolvedValue(Response.json({ synthetic: true })) };
});

describe("private API proxy", () => {
  it("accepts only the explicit additional Hosting origin without changing the API audience", async () => {
    const hosted = { ...config, additionalOrigins: ["https://movebooks-si.web.app"] };
    for (const Origin of [config.publicOrigin, "https://movebooks-si.web.app"]) {
      const response = await proxyRequest(request(`${path}/plan`, { method: "POST", headers: { Origin, "Sec-Fetch-Site": "same-origin" } }), hosted, dependencies);
      expect(response.status).toBe(200);
    }
    expect(dependencies.verifyUser).toHaveBeenCalledTimes(2);
    expect(dependencies.workloadAuthorization).toHaveBeenLastCalledWith(config.upstream);
    vi.mocked(dependencies.fetch).mockClear();
    for (const Origin of ["https://evil.web.app", "https://movebooks-si.web.app.evil.test", "null", ""]) {
      expect((await proxyRequest(request(`${path}/plan`, { method: "POST", headers: { Origin } }), hosted, dependencies)).status).toBe(403);
    }
    expect((await proxyRequest(request(path, { headers: { Origin: hosted.additionalOrigins[0], "Sec-Fetch-Site": "cross-site" } }), hosted, dependencies)).status).toBe(403);
    expect(dependencies.fetch).not.toHaveBeenCalled();
  });
  it("rejects unsafe additional origins and never derives them from request headers", () => {
    const env = { NEXT_PUBLIC_IDENTITY_MODE: "firebase", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "synthetic-project", MOVEBOOKS_PRIVATE_API_ORIGIN: config.upstream, MOVEBOOKS_PUBLIC_WEB_ORIGIN: config.publicOrigin };
    expect(proxyConfig({ ...env, MOVEBOOKS_ADDITIONAL_WEB_ORIGINS: "https://movebooks-si.web.app" }).additionalOrigins).toEqual(["https://movebooks-si.web.app"]);
    for (const value of ["*", "https://*.web.app", "http://movebooks-si.web.app", "https://user:pass@movebooks-si.web.app", "https://movebooks-si.web.app/path", "https://movebooks-si.web.app?next=evil", config.upstream, "https://movebooks-si.web.app,"]) {
      expect(() => proxyConfig({ ...env, MOVEBOOKS_ADDITIONAL_WEB_ORIGINS: value })).toThrow();
    }
  });
  it("exposes only authenticated read-only identity, with no client owner headers or cache", async () => {
    const response = await proxyRequest(request("/api/v1/identity", { headers: { "X-Email": "spoof", "X-Owner": "spoof" } }), config, dependencies);
    expect(response.status).toBe(200);
    expect(dependencies.verifyUser).toHaveBeenCalledWith(token, config.projectId);
    const [url, init] = vi.mocked(dependencies.fetch).mock.calls[0];
    expect(url).toBe(`${config.upstream}/v1/identity`);
    expect(new Headers(init?.headers).has("x-email")).toBe(false);
    expect(new Headers(init?.headers).has("x-owner")).toBe(false);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(allowedRoute("POST", "/v1/identity")).toBe(false);
    expect((await proxyRequest(request("/api/v1/identity", { headers: { Authorization: "" } }), config, dependencies)).status).toBe(401);
  });
  it("separates workload and Firebase credentials and strips all unapproved headers", async () => {
    const response = await proxyRequest(request(path, { headers: { Cookie: "not-forwarded", "X-Serverless-Authorization": "spoof", "X-Owner": "spoof", "X-Forwarded-Host": "evil.example" } }), config, dependencies);
    expect(response.status).toBe(200);
    expect(dependencies.verifyUser).toHaveBeenCalledWith(token, config.projectId);
    expect(dependencies.workloadAuthorization).toHaveBeenCalledWith(config.upstream);
    const [url, init] = vi.mocked(dependencies.fetch).mock.calls[0];
    expect(url).toBe(`${config.upstream}/v1/migration-sessions/${id}`);
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe(`Bearer ${token}`);
    expect(headers.get("x-serverless-authorization")).toBe("Bearer workload-only");
    for (const name of ["cookie", "x-owner", "x-forwarded-host"]) expect(headers.has(name)).toBe(false);
    expect(init).toMatchObject({ cache: "no-store", redirect: "error" });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it.each(["", "Bearer demo-user", "Bearer invalid", "Basic synthetic"])("rejects missing/malformed identity: %s", async Authorization => {
    expect((await proxyRequest(request(path, { headers: { Authorization } }), config, dependencies)).status).toBe(401);
    expect(dependencies.fetch).not.toHaveBeenCalled();
    expect(dependencies.workloadAuthorization).not.toHaveBeenCalled();
  });
  it("rejects failed JWT verification before obtaining workload credentials", async () => {
    vi.mocked(dependencies.verifyUser).mockRejectedValue(new Error("sensitive SDK detail"));
    const response = await proxyRequest(request(), config, dependencies);
    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain("sensitive");
    expect(dependencies.workloadAuthorization).not.toHaveBeenCalled();
  });
  it.each(["/api/v1/admin", "/api/healthz", `${path}?owner=spoof`, `${path}/%2e%2e/admin`, `${path}/unknown`, "/api/v1/https://evil.example"])("does not expose %s", async route => {
    expect((await proxyRequest(request(route), config, dependencies)).status).toBe(404);
    expect(dependencies.fetch).not.toHaveBeenCalled();
  });
  it("denies cross-site requests and POSTs without the configured origin", async () => {
    for (const Origin of ["https://evil.example", "null", ""]) {
      expect((await proxyRequest(request(`${path}/plan`, { method: "POST", headers: { Origin } }), config, dependencies)).status).toBe(403);
    }
    expect(dependencies.fetch).not.toHaveBeenCalled();
  });
  it("forwards approved mutations once, unchanged, including idempotency", async () => {
    const body = JSON.stringify({ action: "reject", comment: "synthetic evidence" });
    expect((await proxyRequest(request(`${path}/fpu/decision`, { method: "POST", body, headers: { "Content-Type": "application/json", "Idempotency-Key": "synthetic-test-key" } }), config, dependencies)).status).toBe(200);
    const init = vi.mocked(dependencies.fetch).mock.calls[0][1];
    expect(Buffer.from(init?.body as Buffer).toString()).toBe(body);
    expect(new Headers(init?.headers).get("idempotency-key")).toBe("synthetic-test-key");
    expect(dependencies.fetch).toHaveBeenCalledTimes(1);
  });
  it("preserves backend denial without converting it into success", async () => {
    vi.mocked(dependencies.fetch).mockResolvedValue(Response.json({ detail: "Workspace unavailable" }, { status: 404, headers: { "Set-Cookie": "forbidden", "Access-Control-Allow-Origin": "*" } }));
    const response = await proxyRequest(request(), config, dependencies);
    expect(response.status).toBe(404);
    expect(response.headers.has("set-cookie")).toBe(false);
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });
  it("rejects cloud uploads before reading a payload or invoking the API", async () => {
    const req = request("/api/v1/intake/validate", { method: "POST", body: "synthetic payload", headers: { "Content-Type": "application/zip" } });
    const response = await proxyRequest(req, config, dependencies);
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("local-only");
    expect(req.bodyUsed).toBe(false);
    expect(dependencies.fetch).not.toHaveBeenCalled();
  });
  it("preserves authenticated synthetic template download without enabling intake", async () => {
    vi.mocked(dependencies.fetch).mockResolvedValue(new Response("synthetic zip fixture", { headers: { "Content-Type": "application/zip" } }));
    const response = await proxyRequest(request("/api/v1/intake/template"), config, dependencies);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="controlled-package.zip"');
    expect(dependencies.verifyUser).toHaveBeenCalled();
  });
  it("enforces the streamed request limit without invoking the API", async () => {
    expect((await proxyRequest(request(`${path}/plan`, { method: "POST", body: "x".repeat(256 * 1024 + 1), headers: { "Content-Type": "application/json" } }), config, dependencies)).status).toBe(413);
    expect(dependencies.fetch).not.toHaveBeenCalled();
  });
  it("fails closed without retrying or leaking upstream exceptions", async () => {
    vi.mocked(dependencies.fetch).mockRejectedValue(new Error("secret credential"));
    const response = await proxyRequest(request(`${path}/migration/resume`, { method: "POST" }), config, dependencies);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret credential");
    expect(dependencies.fetch).toHaveBeenCalledTimes(1);
  });
  it("fails closed on missing or unsafe deployment configuration", () => {
    const env = { NEXT_PUBLIC_IDENTITY_MODE: "firebase", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "synthetic-project", MOVEBOOKS_PRIVATE_API_ORIGIN: config.upstream, MOVEBOOKS_PUBLIC_WEB_ORIGIN: config.publicOrigin };
    expect(proxyConfig(env)).toEqual(config);
    for (const upstream of ["http://metadata.google.internal", "https://evil.example", `${config.upstream}/redirect`, `https://user:pass@private-api.example.run.app`, `${config.upstream}?target=evil`]) {
      expect(() => proxyConfig({ ...env, MOVEBOOKS_PRIVATE_API_ORIGIN: upstream })).toThrow();
    }
    expect(() => proxyConfig({})).toThrow();
  });
  it("retains reconsideration and string-keyed onboarding routes, not arbitrary methods", () => {
    expect(allowedRoute("POST", `/v1/migration-sessions/${id}/mappings/${id}/reconsiderations/${id}/review`)).toBe(true);
    expect(allowedRoute("POST", `/v1/migration-sessions/${id}/onboarding/tasks/opening_balances/decision`)).toBe(true);
    expect(allowedRoute("DELETE", `/v1/migration-sessions/${id}`)).toBe(false);
  });
});
