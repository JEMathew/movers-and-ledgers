/**
 * Maps the API's mapping contract (MappingProposal.state / .risk, domain/planning_mapping/models.py)
 * to the three distinct V2 review states plus approved and low-risk. Display only: it never decides anything.
 */
export type ApiMappingState =
  | "PROPOSED" | "AUTO_ACCEPTABLE" | "REVIEW_REQUIRED" | "APPROVED" | "MODIFIED" | "REJECTED" | "BLOCKED";
export type ApiMappingRisk = "LOW" | "MEDIUM" | "HIGH";
export type V2MappingStatus = "needs_review" | "blocked" | "rejected" | "approved" | "changed" | "low_risk";

export const V2_STATUS_LABEL: Record<V2MappingStatus, string> = {
  needs_review: "Needs review",
  blocked: "Blocked",
  rejected: "Rejected",
  approved: "Approved",
  changed: "Changed",
  low_risk: "Low risk, ready",
};

/** What the person can do next, in the words the screens use. Mirrors apply_mapping_decision. */
export const V2_STATUS_RECOVERY: Record<V2MappingStatus, string> = {
  needs_review: "Approve, change the mapping or reject it.",
  blocked: "It can't be approved or rejected. Change it to a compatible target, or fix the source record and check readiness again.",
  rejected: "It stays out of the move and keeps Move locked. Ask to reconsider it, or fix the source record.",
  approved: "Recorded with your name. Ask to reconsider it if it needs to change.",
  changed: "Recorded with your name. Ask to reconsider it if it needs to change.",
  low_risk: "Review the details, then approve.",
};

export function v2MappingStatus(state: ApiMappingState, risk: ApiMappingRisk): V2MappingStatus {
  switch (state) {
    case "BLOCKED": return "blocked";
    case "REJECTED": return "rejected";
    case "APPROVED": return "approved";
    case "MODIFIED": return "changed";
    case "AUTO_ACCEPTABLE": return risk === "LOW" ? "low_risk" : "needs_review";
    case "REVIEW_REQUIRED":
    case "PROPOSED":
    default: return "needs_review";
  }
}
