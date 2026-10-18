import type { MappingProposal } from "./types";

/**
 * Low-risk batch approval (docs/v2/phase1/bulk-approval-requirements.md).
 *
 * A UI convenience over N individual, individually audited calls to the existing
 * POST /v1/migration-sessions/{id}/mappings/{mapping_id}/approve endpoint. It never bypasses or weakens
 * a server rule: the server still decides every approval, and refuses anything it would refuse one by one.
 *
 * Eligibility is computed from the API response, never from a list in code, and it is deliberately
 * stricter than the requirements' minimum. A mapping qualifies only when ALL of these hold:
 *  1. risk is LOW (MEDIUM and HIGH never qualify);
 *  2. state is AUTO_ACCEPTABLE or REVIEW_REQUIRED (never BLOCKED, REJECTED, APPROVED, MODIFIED or PROPOSED);
 *  3. selected_target equals recommended_target (nobody has started changing it);
 *  4. it is not tax: area tax_configuration, or "tax" anywhere in its source or target (a tax rate setting);
 *  5. it is not flagged sensitive: every policy reason the rules gave must be the server's own
 *     streamlined-approval statement. Any other reason, including "Sensitive accounting or tax mappings
 *     require human approval." (chart of accounts and tax) or a reason this client does not know, keeps it
 *     out. This fails closed: if the server wording changes, nothing qualifies and the panel says so;
 *  6. its deterministic checks did not fail;
 *  7. it has no open reconsideration.
 */
export const STREAMLINED_REASON = "Eligible for streamlined human approval.";

export type Ineligibility = "risk" | "state" | "changed" | "tax" | "sensitive" | "checks" | "reconsideration";

const OPEN_STATES = new Set(["AUTO_ACCEPTABLE", "REVIEW_REQUIRED"]);
const TAX = /tax/i;

/** Every rule a mapping fails, in rule order. Empty means it may be offered for batch approval. */
export function bulkIneligibility(mapping: MappingProposal): Ineligibility[] {
  const reasons: Ineligibility[] = [];
  if (mapping.risk !== "LOW") reasons.push("risk");
  if (!OPEN_STATES.has(mapping.state)) reasons.push("state");
  if (mapping.selected_target !== mapping.recommended_target) reasons.push("changed");
  const text = [mapping.area, mapping.source_id, mapping.source_label, mapping.source_value ?? "", mapping.selected_target, mapping.recommended_target];
  if (mapping.area === "tax_configuration" || text.some(value => TAX.test(value))) reasons.push("tax");
  const policy = Array.isArray(mapping.policy_reasons) ? mapping.policy_reasons : [];
  if (!policy.length || policy.some(reason => reason !== STREAMLINED_REASON)) reasons.push("sensitive");
  if ((mapping.deterministic_checks ?? []).some(check => check !== "PASSED")) reasons.push("checks");
  if ((mapping.reconsiderations ?? []).some(review => review.state === "REVIEW_REQUIRED")) reasons.push("reconsideration");
  return reasons;
}

export const bulkEligible = (mapping: MappingProposal) => bulkIneligibility(mapping).length === 0;

/** Why a low-risk mapping still needs its own decision, in the words the screen uses. */
export const INELIGIBLE_TEXT: Record<Ineligibility, string> = {
  risk: "Medium and high risk mappings are always decided one by one.",
  state: "Only mappings waiting for a first decision can be approved together.",
  changed: "Its target has been changed from the recommendation.",
  tax: "Tax mappings are always decided one by one.",
  sensitive: "The rules mark it as sensitive, so it needs its own approval.",
  checks: "A rule check did not pass.",
  reconsideration: "It has an open reconsideration.",
};

/** The audit comment each approval in a set carries, so the trail shows the batch context per item. */
export const bulkComment = (setId: string, count: number) => `Bulk approval set ${setId}: reviewed ${count} low-risk mappings`;

/** What the person inspected and consented to, per item. */
export type BulkItem = { id: string; label: string; target: string; version: string; state: string; selected_target: string };
export const bulkItem = (mapping: MappingProposal): BulkItem => ({
  id: mapping.id, label: mapping.source_label, target: mapping.selected_target,
  version: mapping.version, state: mapping.state, selected_target: mapping.selected_target,
});

export type StaleItem = { item: BulkItem; reason: string };
/** Items that changed between consent and submission, read from a fresh API response. */
export function staleItems(set: BulkItem[], fresh: MappingProposal[]): StaleItem[] {
  return set.flatMap(item => {
    const now = fresh.find(mapping => mapping.id === item.id);
    if (!now) return [{ item, reason: "it is no longer in this migration" }];
    if (now.state !== item.state) return [{ item, reason: "its state changed" }];
    if (now.selected_target !== item.selected_target) return [{ item, reason: "its target changed" }];
    if (now.version !== item.version) return [{ item, reason: "its rule version changed" }];
    if (!bulkEligible(now)) return [{ item, reason: "it no longer qualifies for approval together" }];
    return [];
  });
}

export type BulkOutcome =
  | { kind: "aborted"; stale: StaleItem[]; set: BulkItem[] }
  | { kind: "unread"; message: string; set: BulkItem[] }
  | { kind: "done"; approved: BulkItem[]; failed?: { item: BulkItem; message: string }; notAttempted: BulkItem[]; set: BulkItem[] };

/**
 * Re-reads the mappings, aborts if anything in the set changed, then approves one item at a time in the
 * listed order. Stops at the first failure. Never retries and never undoes an approval already recorded.
 */
export async function runBulkApproval({ set, setId, readFresh, approve }: {
  set: BulkItem[];
  setId: string;
  readFresh: () => Promise<MappingProposal[]>;
  approve: (item: BulkItem, body: { comment: string }) => Promise<unknown>;
}): Promise<BulkOutcome> {
  let fresh: MappingProposal[];
  try { fresh = await readFresh(); }
  catch (caught) { return { kind: "unread", message: caught instanceof Error ? caught.message : "The mappings could not be read again.", set }; }
  const stale = staleItems(set, fresh);
  if (stale.length) return { kind: "aborted", stale, set };
  const comment = bulkComment(setId, set.length);
  const approved: BulkItem[] = [];
  for (const [index, item] of set.entries()) {
    try { await approve(item, { comment }); }
    catch (caught) {
      return { kind: "done", approved, failed: { item, message: caught instanceof Error ? caught.message : "The approval was refused." }, notAttempted: set.slice(index + 1), set };
    }
    approved.push(item);
  }
  return { kind: "done", approved, notAttempted: [], set };
}
