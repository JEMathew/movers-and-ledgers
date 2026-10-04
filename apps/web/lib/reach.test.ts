import { afterEach, describe, expect, it, vi } from "vitest";
import { reach } from "./reach";

afterEach(() => vi.unstubAllGlobals());

describe("reach", () => {
  it("replaces a network failure with the caller's plain-language message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(reach("http://localhost:8000/v1/x", undefined, "Service unreachable.")).rejects.toThrow("Service unreachable.");
  });
  it("returns HTTP error responses unchanged so their own handling still applies", async () => {
    const response = new Response("{}", { status: 503 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(reach("http://localhost:8000/v1/x", undefined, "Service unreachable.")).resolves.toBe(response);
  });
  it("does not disguise other failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")));
    await expect(reach("http://localhost:8000/v1/x", undefined, "Service unreachable.")).rejects.toThrow("Aborted");
  });
});
