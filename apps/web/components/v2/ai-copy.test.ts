import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "..");
const files = [
  "app/page.tsx", "components/public-surfaces/Trust.tsx", "components/public-surfaces/GuidedDemo.tsx",
  "components/public-surfaces/Guide.tsx", "components/MyMigration.tsx",
];

describe("AI status in product copy", () => {
  it.each(files)("%s claims no AI advice that is running today", (file) => {
    const source = readFileSync(join(root, file), "utf8");
    expect(source).not.toMatch(/AI advises|Agents coordinate|agents coordinate|AI that assists|AI is advisory|AI-assisted|powered by Gemini|Featuring Gemini/i);
  });

  it.each(["components/public-surfaces/ReasoningAdvice.tsx", "components/plan-map-approve/IndependentReview.tsx"])(
    "%s carries the Planned badge", (file) => {
      expect(readFileSync(join(root, file), "utf8")).toContain("<AiStatusBadge />");
    });
});
