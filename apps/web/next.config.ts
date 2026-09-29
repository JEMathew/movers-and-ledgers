import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  return {
    // A production build must not remove assets used by a running local dev server.
    // Keep .next for production/standalone consumers; isolate only development.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    output: "standalone",
    poweredByHeader: false,
    typedRoutes: false,
  };
}
