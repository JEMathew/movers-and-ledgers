import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" ? [] : sources(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("no user-facing motion preference copy", () => {
  // Reduced-motion behaviour stays in CSS (see motion.test.ts). The UI never mentions it.
  it("has no Reduced motion label or helper text anywhere in app, components or lib source", () => {
    const offenders = ["app", "components", "lib"].flatMap(root => sources(join(process.cwd(), root)))
      .filter(file => /reduced[\s-]?motion|motion preference/i.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
