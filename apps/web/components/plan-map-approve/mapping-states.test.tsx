import { describe, expect, it } from "vitest";
import { mappingLabel, mappingRecovery } from "./MappingReview";
import type { MappingProposal } from "./types";

const base = {
  id: "m1", version: "v1", area: "vendors", source_id: "vendor-002", source_label: "vendor-002",
  recommended_target: "Vendor", selected_target: "Vendor", confidence: 0.98, risk: "LOW", evidence: [],
  rationale: "", alternatives: [], approval_required: true, policy_reasons: [], deterministic_checks: [], specialist: "mapping",
} as unknown as MappingProposal;
const withState = (state: MappingProposal["state"], extra: Partial<MappingProposal> = {}) => ({ ...base, state, ...extra }) as MappingProposal;

describe("mapping states", () => {
  it("shows Needs review, Blocked and Rejected as three different states", () => {
    const labels = (["REVIEW_REQUIRED", "BLOCKED", "REJECTED"] as const).map(state => mappingLabel(withState(state), false));
    expect(labels).toEqual(["Needs review", "Blocked", "Rejected"]);
  });

  it("keeps the existing labels for settled and suggested mappings", () => {
    expect(mappingLabel(withState("APPROVED"), false)).toBe("Reviewed");
    expect(mappingLabel(withState("APPROVED"), true)).toBe("Approved");
    expect(mappingLabel(withState("MODIFIED"), false)).toBe("Changed");
    expect(mappingLabel(withState("AUTO_ACCEPTABLE"), false)).toBe("Suggested");
  });

  it("explains a blocked mapping with the rule's own reason and a way forward", () => {
    const reason = "Required target evidence is missing for fields: display_name.";
    const text = mappingRecovery(withState("BLOCKED", { policy_reasons: [reason] }))!;
    expect(text).toContain(reason);
    expect(text).toMatch(/can't be confirmed or rejected/);
    expect(text).toMatch(/Save a compatible destination.*correct the source record/);
  });

  it("tells the person a rejected mapping holds the plan and how to reconsider it", () => {
    expect(mappingRecovery(withState("REJECTED"))).toMatch(/plan can't be approved while a mapping is rejected\. Request reconsideration/);
  });

  it("adds no recovery text to settled mappings", () => {
    expect(mappingRecovery(withState("APPROVED"))).toBeUndefined();
    expect(mappingRecovery(withState("MODIFIED"))).toBeUndefined();
  });
});
