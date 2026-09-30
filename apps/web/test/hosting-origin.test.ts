import { describe, expect, it } from "vitest";
import { identityEndpoint } from "@/lib/identity";

describe("Hosting same-origin identity transport", () => {
  it.each(["https://movebooks-si.web.app", "https://web.example.run.app"])("keeps Firebase verification on the current HTTPS origin: %s", origin => {
    expect(identityEndpoint("/api", origin).href).toBe(`${origin}/api`);
  });
  it.each(["//evil.example", "/other", "http://evil.example", "https://user:pass@evil.example"])("does not permit an unsafe relative or credential-bearing endpoint: %s", base => {
    expect(() => identityEndpoint(base, "https://movebooks-si.web.app")).toThrow();
  });
  it("does not send cloud credentials from a non-HTTPS or absent browser origin", () => {
    expect(() => identityEndpoint("/api", "http://localhost")).toThrow();
    expect(() => identityEndpoint("/api")).toThrow();
  });
});
