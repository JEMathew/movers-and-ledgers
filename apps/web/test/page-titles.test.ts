import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appDir = join(__dirname, "..", "app");
const pages = readdirSync(appDir)
  .filter((name) => statSync(join(appDir, name)).isDirectory())
  .map((name) => ({ route: `/${name}`, file: join(appDir, name, "page.tsx") }))
  .filter(({ file }) => { try { return statSync(file).isFile(); } catch { return false; } })
  .map((page) => ({ ...page, source: readFileSync(page.file, "utf8") }))
  .filter(({ source }) => !/\bredirect\(/.test(source));

describe("page titles", () => {
  it("gives every routed page its own title through the root template", () => {
    const layout = readFileSync(join(appDir, "layout.tsx"), "utf8");
    expect(layout).toContain('template: "%s · MoveBooks AI"');
    const titles = pages.map(({ route, source }) => {
      const match = /title: "([^"]+)"/.exec(source);
      expect(match, `${route} has no title`).not.toBeNull();
      expect(match![1], `${route} repeats the product name`).not.toMatch(/MoveBooks/);
      return match![1];
    });
    expect(new Set(titles).size).toBe(titles.length);
    expect(titles.length).toBeGreaterThanOrEqual(16);
  });
});
