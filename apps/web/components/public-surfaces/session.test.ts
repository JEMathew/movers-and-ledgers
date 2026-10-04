import { describe, expect, it } from "vitest";
import { migrationIssueTitle, projectSession } from "./session";

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

describe("attention items", () => {
  it("give primary screens plain titles and keep internal codes as evidence", () => {
    const view = projectSession(raw({ execution: { failures: [{ resolved: false, code: "MB-DUPLICATE_CUSTOMER", summary: "Migration paused; review in the governed workflow." }] } }), id);
    expect(view.blockers).toEqual(["Possible duplicate customer"]);
    expect(view.attention).toEqual([{ title: "Possible duplicate customer", evidence: "MB-DUPLICATE_CUSTOMER: Migration paused; review in the governed workflow." }]);
  });
  it.each([
    ["MB-DUPLICATE_CUSTOMER", "Possible duplicate customer"],
    ["MB-VALIDATION_DISCREPANCY", "Migrated records don't match the source"],
    ["MB-MISSING_REFERENCE", "A linked record is missing"],
    ["MB-UNSUPPORTED_TAX_CODE", "Unsupported tax code"],
    ["MB-INVALID_CONFIGURATION_DEPENDENCY", "A setting depends on missing setup"],
    ["MB-TRANSIENT_EXECUTION", "Temporary interruption during migration"],
    ["MB-RETRYABLE_BATCH", "A batch needs to be retried"],
    ["MB-NON_RETRYABLE_BLOCKED", "A batch can't continue without your review"],
    ["MB-RETRY-LIMIT", "Retry limit reached"],
    ["MB-VALIDATION-PAYLOAD", "A migrated record differs from the source"],
    ["MB-SOMETHING_NEW", "A migration issue needs your review"],
  ])("titles %s plainly", (code, title) => {
    expect(migrationIssueTitle(code)).toBe(title);
  });
});
