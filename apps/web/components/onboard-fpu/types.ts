export type Task = {
  id: string; label: string; status: "COMPLETED" | "REVIEW_REQUIRED" | "BLOCKED";
  explanation: string; next_action: string; evidence: string[]; approval_required: boolean;
  choices: string[]; decision?: { actor: string; role: string; at: string; action: string; selection: string } | null;
};
export type Fpu = {
  id: string; status: string; contract_hash: string; checkpoint: "DRAFT" | "POSTED" | "VERIFIED";
  attempts: number; retry_limit: number; idempotency_key?: string; posted_by?: string; posted_at?: string; verified_at?: string;
  contract: { currency: string; tax_code: string; tax_rate: string; payment_terms: string; receivable_account: string; income_account: string; tax_account: string; totals: {subtotal: string; tax: string; total: string} };
  inputs: { customer_id: string; product_id: string; quantity: number; unit_price: string };
  decisions: {action: string; actor: string}[];
  checks: { id: string; passed: boolean; explanation: string; evidence: string[] }[];
  invoice?: Record<string, unknown>; journal?: Record<string, unknown>;
};
export type Snapshot = {
  session_id: string; company_name: string; workflow_status: string; effective_status: string;
  /** Journey evidence every stage read carries; see journeyEvidenceFrom. */
  mapping_review?: { total: number; pending: number } | null; readiness_blockers?: number;
  gate_error?: string | null; ready: boolean; verified_fpu: boolean; tasks: Task[];
  onboarding?: { fpu?: Fpu | null; faults: string[] } | null;
  customers: {id: string; display_name: string}[]; products: {id: string; name: string}[];
  accounting_impact?: { before?: Record<string, string>; after?: Record<string, string> };
  activity: {id: string; agent: string; action: string; evidence_references: string[]}[];
};
