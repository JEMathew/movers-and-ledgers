import { describe, expect, it } from "vitest";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";
import nextConfig from "../next.config";

describe("Next build output isolation", () => {
  it("keeps development assets separate from production build cleanup", () => {
    expect(nextConfig(PHASE_DEVELOPMENT_SERVER).distDir).toBe(".next-dev");
    expect(nextConfig(PHASE_DEVELOPMENT_SERVER).distDir).not.toBe(nextConfig(PHASE_PRODUCTION_BUILD).distDir);
  });

  it("preserves the production build/start and standalone image paths", () => {
    for (const phase of [PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER]) {
      expect(nextConfig(phase)).toEqual({
        distDir: ".next",
        output: "standalone",
        poweredByHeader: false,
        typedRoutes: false,
      });
    }
  });
});
