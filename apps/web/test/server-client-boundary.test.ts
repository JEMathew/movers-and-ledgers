import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// A server component can render a client component, but calling a plain function exported
// from a "use client" module throws at render ("Attempted to call ... from the server").
// jsdom tests cannot see this boundary, so check it statically.
const root = resolve(__dirname, "..");
const files = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : [];
});
const isClient = (source: string) => /^\s*["']use client["']/.test(source);
const resolveModule = (specifier: string) => {
  const base = resolve(root, specifier.replace(/^@\//, ""));
  return [".tsx", ".ts", "/index.tsx", "/index.ts"].map(ext => base + ext).find(path => { try { return statSync(path).isFile(); } catch { return false; } });
};

describe("server/client module boundary", () => {
  it("server pages import only components from client modules", () => {
    const violations: string[] = [];
    for (const file of files(join(root, "app"))) {
      const source = readFileSync(file, "utf8");
      if (isClient(source)) continue;
      for (const [, names, specifier] of source.matchAll(/import\s+\{([^}]+)\}\s+from\s+["'](@\/[^"']+)["']/g)) {
        const target = resolveModule(specifier);
        if (!target || !isClient(readFileSync(target, "utf8"))) continue;
        for (const name of names.split(",").map(part => part.trim().split(/\s+as\s+/)[0]).filter(Boolean)) {
          if (!/^[A-Z]/.test(name) && !name.startsWith("type ")) violations.push(`${file.replace(root, "")}: ${name} from ${specifier}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
