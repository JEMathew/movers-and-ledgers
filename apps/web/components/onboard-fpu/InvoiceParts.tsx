import type { ReactNode } from "react";
import { formatApiAmount } from "@/components/v2/primitives";
import { sentence, StateChip } from "@/components/migrate-resolve/stage-kit";
import type { ChipTone } from "@/components/migrate-resolve/stage-kit";
import type { Fpu, Snapshot } from "./types";

/**
 * The first invoice as a document, and its journal. Every value is an API string shown as given:
 * the posted invoice once it exists, otherwise the prepared contract. Customer and product names come
 * from the snapshot's migrated customer and product lists; account names are not in the contract, so
 * accounts show their ids.
 */
const str = (value: unknown) => typeof value === "string" && value.trim() ? value : undefined;

export function invoiceFigures(fpu: Fpu) {
  const invoice = fpu.invoice ?? undefined;
  return {
    currency: str(invoice?.currency) ?? fpu.contract.currency,
    subtotal: str(invoice?.subtotal) ?? fpu.contract.totals.subtotal,
    tax: str(invoice?.tax) ?? fpu.contract.totals.tax,
    total: str(invoice?.total) ?? fpu.contract.totals.total,
    terms: str(invoice?.payment_terms) ?? fpu.contract.payment_terms,
    taxCode: str(invoice?.tax_code) ?? fpu.contract.tax_code,
    quantity: typeof invoice?.quantity === "number" ? invoice.quantity : fpu.inputs.quantity,
    unitPrice: str(invoice?.unit_price) ?? fpu.inputs.unit_price,
    customerId: str(invoice?.customer_id) ?? fpu.inputs.customer_id,
    productId: str(invoice?.product_id) ?? fpu.inputs.product_id,
    number: str(invoice?.number),
  };
}

/** "Cedar School" when the migrated customer list names this id, otherwise the id itself. */
export function customerName(snapshot: Snapshot, id: string) {
  return snapshot.customers.find(customer => customer.id === id)?.display_name ?? id;
}
export function productName(snapshot: Snapshot, id: string) {
  return snapshot.products.find(product => product.id === id)?.name ?? id;
}

/** "Posted and verified: 107.25 = 100.00 + 7.25 tax", joined from the API's own strings, never computed. */
export function totalsSentence(fpu: Fpu) {
  const { subtotal, tax, total } = invoiceFigures(fpu);
  return subtotal && tax && total ? `${total} = ${subtotal} + ${tax} tax` : undefined;
}

export function invoiceStage(fpu: Fpu, verified: boolean): { tone: ChipTone; label: string } {
  const last = fpu.decisions.at(-1)?.action;
  if (verified) return { tone: "approved", label: "Posted and verified" };
  if (fpu.status === "BLOCKED") return { tone: "blocked", label: "Blocked" };
  if (fpu.checkpoint === "POSTED") return { tone: "needs_review", label: "Posted · not yet verified" };
  if (last === "reject") return { tone: "rejected", label: "Rejected · not posted" };
  if (last === "approve") return { tone: "changed", label: "Approved · not posted" };
  return { tone: "needs_review", label: "Draft · needs your approval" };
}

export function InvoiceDocument({ fpu, snapshot, verified, children, nested = false }: { fpu: Fpu; snapshot: Snapshot; verified: boolean; children?: ReactNode; nested?: boolean }) {
  const Heading = nested ? "h3" : "h2";
  const figures = invoiceFigures(fpu);
  const customer = snapshot.customers.find(item => item.id === figures.customerId);
  const stage = invoiceStage(fpu, verified);
  return <section className="v2-card v2s-section" aria-labelledby="invoice-number" id="invoice">
    <div className="v2s-section-head">
      <div><p className="v2s-kicker">Invoice</p><Heading id="invoice-number" className="v2s-invoice-number">{figures.number ?? "Draft, not posted"}</Heading></div>
      <StateChip tone={stage.tone}>{stage.label}</StateChip>
    </div>
    <dl className="v2s-terms">
      <div><dt>Bill to</dt><dd>{customer?.display_name ?? figures.customerId}{customer?.email ? <span className="v2s-row-sub">{customer.email}</span> : null}</dd></div>
      <div><dt>From</dt><dd>{snapshot.company_name}</dd></div>
      <div><dt>Terms</dt><dd>{sentence(figures.terms)}</dd></div>
      <div><dt>Currency</dt><dd>{figures.currency}</dd></div>
    </dl>
    <div className="v2s-table-wrap">
      <table className="v2s-table">
        <caption className="sr-only">Invoice lines and totals</caption>
        <thead><tr><th scope="col">Item</th><th scope="col" className="v2s-amount">Qty</th><th scope="col" className="v2s-amount">Rate</th><th scope="col" className="v2s-amount">Amount</th></tr></thead>
        {/* One line per invoice in this contract, so the line amount is the invoice subtotal as reported. */}
        <tbody><tr><th scope="row">{productName(snapshot, figures.productId)}</th><td className="v2s-amount">{figures.quantity}</td><td className="v2s-amount">{figures.unitPrice}</td><td className="v2s-amount">{figures.subtotal}</td></tr></tbody>
        <tfoot>
          <tr><th scope="row" colSpan={3} className="v2s-amount">Subtotal</th><td className="v2s-amount">{figures.subtotal}</td></tr>
          <tr><th scope="row" colSpan={3} className="v2s-amount">Tax {figures.taxCode} at rate {fpu.contract.tax_rate}</th><td className="v2s-amount">{figures.tax}</td></tr>
          <tr className="v2s-total"><th scope="row" colSpan={3} className="v2s-amount">Total</th><td className="v2s-amount">{formatApiAmount(figures.total, figures.currency)}</td></tr>
        </tfoot>
      </table>
    </div>
    {children}
  </section>;
}

export function JournalTable({ fpu, open = false }: { fpu: Fpu; open?: boolean }) {
  const entries = fpu.journal?.entries;
  if (!entries?.length) return null;
  const impact = fpu.checks.find(check => check.id === "accounting_impact");
  return <details className="v2s-details" open={open}>
    <summary>{impact?.passed ? "Journal entry: balanced, the rules checked debits equal credits" : "Journal entry"}</summary>
    <div className="v2s-table-wrap">
      <table className="v2s-table">
        <caption className="sr-only">Journal entry lines</caption>
        <thead><tr><th scope="col">Account</th><th scope="col" className="v2s-amount">Debit</th><th scope="col" className="v2s-amount">Credit</th></tr></thead>
        <tbody>{entries.map((entry, index) => <tr key={`${entry.account_id}-${index}`}><th scope="row">{entry.account_id}</th><td className="v2s-amount">{entry.debit}</td><td className="v2s-amount">{entry.credit}</td></tr>)}</tbody>
      </table>
    </div>
    <p className="v2s-small">Accounts show their ids from the new chart of accounts.</p>
  </details>;
}

export function ImpactTable({ impact }: { impact?: Snapshot["accounting_impact"] }) {
  const before = impact?.before ?? {}, after = impact?.after ?? {};
  const accounts = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  if (!accounts.length) return null;
  return <details className="v2s-details">
    <summary>Account balances before and after the invoice</summary>
    <div className="v2s-table-wrap"><table className="v2s-table">
      <caption className="sr-only">Account balances before and after the invoice</caption>
      <thead><tr><th scope="col">Account</th><th scope="col" className="v2s-amount">Before</th><th scope="col" className="v2s-amount">After</th></tr></thead>
      <tbody>{accounts.map(account => <tr key={account}><th scope="row">{account}</th><td className="v2s-amount">{before[account] ?? "Not available"}</td><td className="v2s-amount">{after[account] ?? "Not available"}</td></tr>)}</tbody>
    </table></div>
  </details>;
}
