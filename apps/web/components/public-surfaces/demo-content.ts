// Authored educational examples, never migration snapshots or computed results.
// These values illustrate the approved IA v2 wireframe; they do not predict sample-run output.
export const demoPhases = [
  {
    name: "Understand", title: "Check readiness.",
    scenario: "Harbor Light Books checks its fictional shop’s records before moving.",
    evidence: [["Source records", "Shop records"], ["Readiness", "Missing fields block"]],
    insight: "Find gaps before committing.",
    guidance: "Agents organize source evidence and explain findings. Versioned readiness rules determine supported scope and blockers; an explanation cannot override them.",
    topic: "evidence",
  },
  {
    name: "Prepare", title: "Keep account meaning.",
    scenario: "Harbor Light Books needs an asset account for money owed by customers.",
    evidence: [["Source", "Receivables · Asset"], ["Suggested destination", "Receivables · Asset"]],
    insight: "Match meaning, then review the plan.",
    guidance: "The Beta uses policy-based mapping suggestions, not calibrated live-model predictions. An authorized person reviews consequential mappings and the plan. Plan approval and starting the move remain separate actions.",
    topic: "mappings",
  },
  {
    name: "Move", title: "Keep completed work.",
    scenario: "Duplicate shop customers pause one batch for review.",
    evidence: [["Accounts batch", "Checkpoint kept"], ["Customers batch", "Paused for review"]],
    insight: "Retry only the permitted failed batch.",
    guidance: "Agents explain the failure and propose a bounded remedy. Existing policy and an authorized human approval govern consequential recovery. The engine checks retry eligibility and preserves completed checkpoints. This preview executes none of these actions.",
    topic: "recovery",
  },
  {
    name: "Verify", title: "Check exact totals.",
    scenario: "Harbor Light Books’ illustrative invoice totals differ.",
    evidence: [["Source", "USD 107.25"], ["Target", "USD 100.00"], ["Difference", "USD 7.25 · blocked"]],
    insight: "Approval cannot waive a failed check.",
    guidance: "Deterministic rules compare exact financial facts, counts and references. Agents may explain the mismatch; only a permitted repair followed by revalidation can resolve it. Required settings are reviewed separately. These authored values are illustrative, not measured or calculated by this Demo.",
    topic: "reconciliation",
  },
  {
    name: "Start", title: "Verify the first task.",
    scenario: "Harbor Light Books prepares a first synthetic invoice.",
    evidence: [["Subtotal", "USD 100.00"], ["Tax", "USD 7.25"], ["Total", "USD 107.25"]],
    insight: "Posting alone is not verified completion.",
    guidance: "Onboarding prerequisites and authorized roles gate the task. A person reviews the exact invoice terms and explicitly consents before posting. The engine verifies accounting evidence separately, preserving posted checkpoints to prevent duplicates. Only a server-verified first task earns Business Ready · Verified in the synthetic Beta. This preview posts or verifies nothing.",
    topic: "business-ready",
  },
] as const;
