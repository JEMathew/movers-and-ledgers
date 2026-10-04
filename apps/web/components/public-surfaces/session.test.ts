import { describe, expect, it } from "vitest";
import { projectSession } from "./session";

const id = "11111111-1111-4111-8111-111111111111";
const raw = (extra: Record<string, unknown>) => ({ id, synthetic: true, workflow_status: "AWAITING_APPROVAL", ...extra });

describe("mapping_review projection", () => {
  // Only a complete, self-consistent server count is authoritative; anything else is unknown (null).
  it.each([
    ["missing object", {}],
    ["null", { mapping_review: null }],
    ["pending only", { mapping_review: { pending: 0 } }],
    ["no mappings", { mapping_review: { total: 0, pending: 0 } }],
    ["negative pending", { mapping_review: { total: 5, pending: -1 } }],
    ["pending above total", { mapping_review: { total: 2, pending: 3 } }],
    ["fractional counts", { mapping_review: { total: 5.5, pending: 1 } }],
    ["string counts", { mapping_review: { total: "5", pending: "0" } }],
    ["array", { mapping_review: [5, 0] }],
  ])("treats %s as unknown", (_case, extra) => {
    expect(projectSession(raw(extra), id).mappingIssues).toBeNull();
  });
  it.each([
    [{ total: 5, pending: 0 }, 0],
    [{ total: 5, pending: 2 }, 2],
    [{ total: 5, pending: 5 }, 5],
    [{ total: 1, pending: 0 }, 0],
  ])("reads a valid count %j as %i pending", (mapping_review, pending) => {
    expect(projectSession(raw({ mapping_review }), id).mappingIssues).toBe(pending);
  });
});
