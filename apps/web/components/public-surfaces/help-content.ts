/** Canonical short task guidance; Guide/Learn/Trust own the deeper explanations. */
export const phaseHelp = [
  { text: "Check readiness findings before preparing a plan. A blocker cannot be cleared by reading Help.", guide: "journey" },
  { text: "Review the mapping and its evidence. Plan consent is separate from starting the move.", guide: "approvals" },
  { text: "Keep completed checkpoints. Review a bounded remedy, then retry only when the task permits it.", guide: "recovery" },
  { text: "Inspect mismatches before settings. A repair requires revalidation; approval cannot waive a failed check.", guide: "recovery" },
  { text: "Review required setup and exact invoice terms. If already posted, resume verification with the original checkpoint.", guide: "journey" },
] as const;
export const helpIssues = [
  { name: "Readiness or mapping blocker", phase: 1, topic: "mappings", guide: "journey", why: "A missing fact, incompatible mapping or unresolved finding prevents a safe move.", action: "Review the finding and its evidence in Understand or Prepare. Rejection is a valid decision; it does not authorize migration." },
  { name: "Approval required", phase: 1, topic: "approvals", guide: "approvals", why: "A decision affects accounting meaning, access or a consequential action.", action: "Read impact and evidence in the current workflow, then approve or reject there. Support cannot approve on your behalf." },
  { name: "Migration paused", phase: 2, topic: "recovery", guide: "recovery", why: "A batch failed or needs a governed remedy. Earlier completed checkpoints are preserved.", action: "Review the proposal in Move. Use Retry failed batch only if the workflow enables it after the required decision. Do not restart completed work." },
  { name: "Validation mismatch", phase: 3, topic: "reconciliation", guide: "recovery", why: "A rule found a difference between source evidence and the executed target.", action: "Inspect the failed check in Verify. Review a permitted repair and rerun validation. An approval cannot waive a financial mismatch." },
  { name: "Onboarding prerequisite", phase: 4, topic: "business-ready", guide: "journey", why: "Required setup, access or onboarding decisions are incomplete or blocked.", action: "Open Start, review the prerequisite and record the required decision. The productive task stays unavailable until the checks pass." },
  { name: "First synthetic task failed", phase: 4, topic: "business-ready", guide: "recovery", why: "The agreed task has not reached verified completion. Posting alone is insufficient.", action: "Read the task failure in Start. Resume a POSTED checkpoint with its original key; do not post another invoice. Review remediation only when the task offers it." },
] as const;
