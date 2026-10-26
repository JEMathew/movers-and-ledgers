import type { TraceRow } from "./session";

/** Customer wording for recorded decision stages. Unknown stages are shown as recorded, never guessed. */
const STAGE: Record<string, string> = {
  map_approve: "Mapping",
  approve: "Migration plan",
  resolve: "Migration fix",
  configure: "Setting",
  onboard: "Onboarding essential",
  first_productive_use: "First invoice",
  reconsider: "Reconsideration",
  reconsideration: "Reconsideration",
};
const DECISION: Record<string, string> = {
  APPROVE: "approved", APPROVED: "approved", PLAN_APPROVED: "approved",
  REJECT: "rejected", REJECTED: "rejected",
  MODIFY: "changed", MODIFIED: "changed",
  REQUEST: "requested", REQUESTED: "requested",
};
const sentence = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
const words = (value: string) => value.replaceAll("_", " ").trim();

/** "map_approve · APPROVED" → "Mapping approved". Presentation only; the raw values stay in the record. */
export function decisionLabel(row: TraceRow): string {
  const [stage = "", decision = row.status] = row.title.split(" · ");
  const what = STAGE[stage] ?? sentence(words(stage)) ?? "Decision";
  const verb = DECISION[decision.toUpperCase()] ?? words(decision).toLowerCase();
  return `${what || "Decision"} ${verb}`.trim();
}

/** Plain result words for recorded statuses. */
export function statusLabel(status: string): string {
  const key = status.toUpperCase();
  if (key === "VERIFIED" || key === "COMPLETED") return key === "VERIFIED" ? "Passed" : "Completed";
  if (key === "BLOCKED") return "Did not pass";
  if (key === "UNCONFIRMED" || !key) return "Not confirmed";
  if (DECISION[key]) return sentence(DECISION[key]);
  return sentence(words(status).toLowerCase());
}

/** "discovery_agent: profile_dataset" → "Discovery: profile dataset". Rules and tools, not AI advice. */
export function activityLabel(row: TraceRow): string {
  const [agent, action] = row.title.includes(": ") ? row.title.split(": ", 2) : ["", row.title];
  const who = sentence(words(agent.replace(/_agent$/, "")));
  const what = words(action);
  return who ? `${who}: ${what}` : sentence(what) || "Recorded action";
}

/** The plain title for any evidence row in a category. */
export function rowLabel(category: string, row: TraceRow): string {
  if (category === "decisions") return decisionLabel(row);
  if (category === "activity") return activityLabel(row);
  return sentence(words(row.title)) || "Untitled recorded event";
}
