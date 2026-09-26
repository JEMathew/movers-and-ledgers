import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

describe("motion accessibility", () => {
  it("disables nonessential animation and transitions for reduced motion", () => {
    const reducedMotion = stylesheet.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*)\}\s*$/)?.[1];

    expect(reducedMotion).toContain("animation-duration: 0.01ms !important");
    expect(reducedMotion).toContain("animation-iteration-count: 1 !important");
    expect(reducedMotion).toContain("transition-duration: 0.01ms !important");
  });
});
