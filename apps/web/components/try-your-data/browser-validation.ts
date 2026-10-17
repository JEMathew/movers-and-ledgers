/** Browser-local compatibility check. Never creates a server ticket or financial authority. */
import contract from "./package-contract.json";
import { readFlatZip, type PackageFile } from "./browser-archive";
import { csvRows, hidden, ParseFinding, strictJson } from "./browser-parser";
import type { Issue } from "./ValidationIssues";
export type BrowserReport = {
  version: string; mode: "browser-local"; status: "READY" | "NEEDS ATTENTION" | "BLOCKED";
  files: { name: string; rows: number; sha256: string; ignored_fields: string[] }[];
  issues: Issue[]; issue_count: number;
};
type Row = { values: Record<string, string>; line: number; journal?: Entry[] };
type Entry = { account_id: string; debit: string; credit: string };
const allowed = new Set([...contract.files.map(f => f.name), "configuration.json", "metadata.json"]);
const id = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/, header = /^[a-z][a-z0-9_]{0,63}$/;
const accountTypes = ["bank", "accounts_receivable", "accounts_payable", "asset", "liability", "equity", "income", "expense", "cost_of_goods_sold"];
const references: Record<string, string> = { customer_id: "customers", vendor_id: "vendors", receivable_account_id: "accounts", payable_account_id: "accounts", income_account_id: "accounts", expense_account_id: "accounts", parent_id: "accounts", product_id: "products", invoice_id: "invoices", bill_id: "bills", transaction_id: "transactions" };
const policies: Record<string, string[]> = { fiscal_year: Array.from({ length: 12 }, (_, i) => String(i + 1)), base_currency: ["USD", "INR", "GBP", "EUR"], tax_setup: ["CA-SALES", "NONE"], payment_terms: ["NET_15", "NET_30", "DUE_ON_RECEIPT"], inventory: ["WEIGHTED_AVERAGE", "FIFO"], invoice_preferences: ["HL-", "INV-"], user_roles: ["FINANCE_REVIEWER", "READ_ONLY"], integrations: ["DISABLED", "SANDBOX_READ_ONLY"] };
function fail(code: string, message: string, column?: string): never { throw new ParseFinding(code, message, column); }
/** Integer cents avoid IEEE-754 rounding. Narrow fixed-point syntax is intentional. */
export function cents(value: unknown, column: string): bigint {
  if (typeof value !== "string" || !/^-?\d+(?:\.\d{1,2})?$/.test(value)) return fail("INVALID_NUMBER", "Use decimal text with at most two decimal places, such as 125.00.", column);
  const negative = value.startsWith("-"), [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  // Bound conversion work before BigInt; the whole input is already cell/field bounded.
  if (whole.length > 19) return fail("INVALID_NUMBER", "Amounts must be within the Beta limit of 1e18.", column);
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (amount > 100000000000000000000n) return fail("INVALID_NUMBER", "Amounts must be within the Beta limit of 1e18.", column);
  return negative ? -amount : amount;
}
function object(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exact(value: unknown, keys: string[], label: string): asserts value is Record<string, unknown> {
  if (!object(value)) fail("INVALID_TYPE", `${label} must be a JSON object.`);
  if (keys.some(key => !Object.hasOwn(value, key))) fail("MISSING_KEY", `${label} is missing a required key. Compare it with the template.`);
  if (Object.keys(value).some(key => !keys.includes(key))) fail("UNSUPPORTED_KEY", `${label} contains unsupported keys. Remove them; files cannot set workflow or approval state.`);
}
function config(value: unknown) {
  exact(value, contract.configuration.keys, "configuration.json");
  const company = value.company, settings = value.settings, taxes = value.taxes;
  exact(company, contract.configuration.company, "company"); exact(settings, contract.configuration.settings, "settings");
  if (typeof company.id !== "string" || !id.test(company.id)) fail("INVALID_IDENTIFIER", "Use a valid company.id from the template.");
  for (const key of ["legal_name", "display_name"]) if (typeof company[key] !== "string" || !(company[key] as string).length || (company[key] as string).length > 200) fail("INVALID_VALUE", `company.${key} needs 1–200 characters of text.`);
  const month = company.fiscal_year_start_month;
  if (!Number.isInteger(month) || (month as number) < 1 || (month as number) > 12) fail("INVALID_TYPE", "company.fiscal_year_start_month needs an integer from 1 to 12.");
  for (const [key, values] of Object.entries(policies)) if (typeof settings[key] !== "string" || !values.includes(settings[key] as string)) fail("INVALID_VALUE", `settings.${key} must be one of: ${values.join(", ")}.`);
  if (company.base_currency !== settings.base_currency || String(month) !== settings.fiscal_year) fail("INVALID_VALUE", "Company currency and fiscal month must match settings.");
  if (!Array.isArray(taxes) || taxes.length > 20) fail("INVALID_TYPE", "taxes must be a list of up to 20 tax entries.");
  const ids = new Set<string>(); let matches = 0;
  for (const tax of taxes) {
    exact(tax, contract.configuration.taxes, "Each tax");
    if (Object.values(tax).some(v => typeof v !== "string" || !v.length || v.length > 64)) fail("INVALID_TYPE", "Each tax value needs 1–64 characters of text.");
    const taxId = tax.id as string;
    if (!id.test(taxId)) fail("INVALID_IDENTIFIER", "Each tax needs a valid identifier.");
    if (ids.has(taxId)) fail("DUPLICATE_ID", "Give each tax a unique identifier."); ids.add(taxId);
    const rate = tax.rate as string;
    if (!/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(rate)) fail("INVALID_NUMBER", "Tax rate must be decimal text between 0 and 1, such as 0.0725.");
    if (tax.code === settings.tax_setup) matches++;
  }
  if (!(settings.tax_setup === "NONE" && !taxes.length) && matches !== 1) fail("INVALID_VALUE", "tax_setup must match exactly one tax code, or be NONE with no taxes.");
}
function validateRow(entity: string, record: Row, required: string[]) {
  const row = record.values;
  for (const column of required) if (!row[column]) fail("MISSING_VALUE", `${column} is required but empty.`, column);
  for (const [key, value] of Object.entries(row)) {
    if (key === "id" || key.endsWith("_id")) { if (!id.test(value)) fail("INVALID_IDENTIFIER", "Identifiers need 1–64 letters, digits, hyphens or underscores, beginning with a letter or digit.", key); }
    else if (key !== "entries" && value.length > 200) fail("TEXT_TOO_LONG", "Shorten this text to 200 characters or fewer.", key);
  }
  if (entity === "accounts") { if (!accountTypes.includes(row.account_type)) fail("INVALID_TYPE", `account_type must be one of: ${accountTypes.join(", ")}.`, "account_type"); cents(row.opening_balance, "opening_balance"); }
  if (entity === "products" && !["service", "inventory", "non_inventory"].includes(row.item_type)) fail("INVALID_TYPE", "item_type must be service, inventory or non_inventory.", "item_type");
  if (["invoices", "bills"].includes(entity)) { const total = cents(row.total, "total"), paid = cents(row.paid ?? "0", "paid"); if (paid < 0n || paid > total) fail("INVALID_VALUE", "paid must be between zero and the document total.", "paid"); }
  if (entity === "transactions") {
    const date = row.transaction_date, parsed = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith("0000") || !Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) fail("INVALID_DATE", "Use a valid date in YYYY-MM-DD format.", "transaction_date");
    const entries = strictJson(row.entries);
    if (!Array.isArray(entries) || entries.length < 2 || entries.length > 100) fail("INVALID_TYPE", "entries must be a JSON list of 2–100 journal lines.", "entries");
    let debit = 0n, credit = 0n;
    for (const entry of entries) {
      exact(entry, ["account_id", "debit", "credit"], "Each journal line");
      if (typeof entry.account_id !== "string" || !id.test(entry.account_id)) fail("INVALID_IDENTIFIER", "Each journal line needs a valid account_id.", "entries");
      const d = cents(entry.debit, "entries"), c = cents(entry.credit, "entries");
      if (d < 0n || c < 0n || (d > 0n) === (c > 0n)) fail("INVALID_VALUE", "Each journal line needs exactly one positive debit or credit; the other side must be zero.", "entries");
      debit += d; credit += c;
    }
    if (debit !== credit) fail("UNBALANCED_JOURNAL", "Journal debits and credits must balance exactly.", "entries");
    record.journal = entries as Entry[];
  }
}
async function sha(bytes: Uint8Array) { const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource); return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join(""); }
export async function validateBrowserPackage(input: PackageFile[]): Promise<BrowserReport> {
  const report: BrowserReport = { version: contract.version, mode: "browser-local", status: "READY", files: [], issues: [], issue_count: 0 };
  let blocked = false;
  const issue = (file: string, code: string, message: string, row: number | null = null, column?: string, warning = false) => {
    report.issue_count++; if (!warning) blocked = true;
    if (report.issues.length < 200) report.issues.push({ file: allowed.has(file) ? file : "package", row, column, code, message, severity: warning ? "WARNING" : "BLOCKER", fix: "Correct or replace the named file using the template, then validate again.", can_continue: warning });
  };
  let files = input;
  const datasets: Record<string, Row[]> = Object.create(null);
  // Validate before allocating/decompressing. FileReader UI also checks file.size before reading.
  if (!files.length || files.length > 9 || files.reduce((sum, f) => sum + f.bytes.length, 0) > contract.limits.max_total_bytes) issue("package", "PACKAGE_LIMIT", "Use 1–9 files and at most 2 MiB in total.");
  else if (files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")) {
    try { files = await readFlatZip(files[0].bytes); } catch { issue("package", "UNSAFE_ARCHIVE", "The ZIP is malformed or outside the supported flat ZIP limits. Use stored/deflated entries without folders, comments, extra fields or encryption; individual files also work."); files = []; }
  }
  if (blocked) { report.status = "BLOCKED"; return report; }
  for (const name of [...contract.files.map(f => f.name), "configuration.json"]) if (!files.some(f => f.name === name)) issue(name, "MISSING_FILE", `Required file ${name} is missing.`);
  const seen = new Set<string>();
  for (const file of files) {
    const { name, bytes } = file;
    if (!allowed.has(name)) { issue("package", "UNSUPPORTED_FILE", "Remove unsupported files. Filenames are case-sensitive and must exactly match the template."); continue; }
    if (seen.has(name)) { issue(name, "DUPLICATE_FILENAME", "Keep one copy of each supported file."); continue; } seen.add(name);
    const entry = { name, rows: 0, sha256: "", ignored_fields: [] as string[] }; report.files.push(entry);
    if (bytes.length > contract.limits.max_file_bytes) { issue(name, "FILE_TOO_LARGE", "Reduce this file to 256 KiB or less."); continue; }
    try {
      entry.sha256 = await sha(bytes);
      if (!bytes.length) fail("EMPTY_FILE", "Use a header-only CSV for an empty dataset; configuration.json cannot be empty.");
      let text: string;
      try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { fail("INVALID_ENCODING", "Export this file as UTF-8 text."); }
      if (hidden.test(text)) fail("HIDDEN_CHARACTERS", "Remove hidden or unsupported control characters from this file.");
      if (/^(?:PK\x03\x04|%PDF-|\x7fELF|GIF8|\{\\rtf)/.test(text)) fail("BINARY_CONTENT", "Export actual CSV or JSON text; renamed binary files are not accepted.");
      if (name.endsWith(".json")) {
        const value = strictJson(text);
        if (name === "configuration.json") config(value);
        else {
          if (!object(value) || Object.keys(value).some(k => !["package_version", "description"].includes(k))) fail("UNSUPPORTED_KEY", "metadata.json may contain only package_version and description.");
          if (Object.values(value).some(v => typeof v !== "string" || v.length > 500) || (Object.hasOwn(value, "package_version") && value.package_version !== contract.version)) fail("INVALID_VALUE", "Use short text metadata and the controlled-package-v1 version.");
          issue(name, "METADATA_ONLY", "Metadata is evidence only and cannot change migration behavior.", null, undefined, true);
        }
        entry.rows = 1; continue;
      }
      const schema = contract.files.find(f => f.name === name)!, rows = csvRows(text), columns = rows.shift();
      if (!columns?.length) fail("MISSING_COLUMN", "Add the required CSV header row from the template.");
      if (columns.some(c => !header.test(c))) fail("INVALID_HEADER", "Use lowercase column names from the template; no spaces or hidden characters.");
      if (new Set(columns).size !== columns.length) fail("DUPLICATE_HEADER", "Keep each column name once.");
      const missing = schema.required.filter(c => !columns.includes(c));
      if (missing.length) fail("MISSING_COLUMN", `Missing required columns: ${missing.join(", ")}.`);
      entry.ignored_fields = columns.filter(c => !schema.required.includes(c) && !schema.optional.includes(c));
      if (entry.ignored_fields.length) issue(name, "IGNORED_FIELDS", `Unsupported columns will not migrate: ${entry.ignored_fields.join(", ")}. Review these exclusions.`, 1, undefined, true);
      const entity = name.slice(0, -4), accepted: Row[] = [], ids = new Set<string>(); datasets[entity] = accepted; entry.rows = rows.length;
      rows.forEach((cells, index) => {
        try {
          if (cells.length !== columns.length) fail("MALFORMED_ROW", "The row width must match the header. Check commas and quoting.");
          const row: Row = { values: Object.create(null), line: index + 2 };
          columns.forEach((c, i) => { if (!entry.ignored_fields.includes(c) && cells[i] !== "") row.values[c] = cells[i]; });
          validateRow(entity, row, schema.required);
          if (ids.has(row.values.id)) fail("DUPLICATE_ID", "Give each record a unique id.", "id");
          ids.add(row.values.id); accepted.push(row);
        } catch (error) { if (error instanceof ParseFinding) issue(name, error.code, error.message, index + 2, error.column); else throw error; }
      });
    } catch (error) {
      if (error instanceof ParseFinding) issue(name, error.code, error.message, null, error.column);
      else issue(name, "INVALID_SCHEMA", "This file could not be checked. Use a supported browser with Web Crypto and compare the file with the template.");
    }
  }
  const known = Object.fromEntries(Object.entries(datasets).map(([entity, rows]) => [entity, new Set(rows.map(r => r.values.id))]));
  for (const [entity, rows] of Object.entries(datasets)) for (const row of rows) {
    for (const [field, target] of Object.entries(references)) if (row.values[field] && known[target] && !known[target].has(row.values[field])) issue(`${entity}.csv`, "BROKEN_REFERENCE", `This reference does not exist in ${target}.csv. Add the missing record or correct the reference.`, row.line, field);
    for (const journal of row.journal ?? []) if (known.accounts && !known.accounts.has(journal.account_id)) issue("transactions.csv", "BROKEN_REFERENCE", "A journal account does not exist in accounts.csv.", row.line, "entries");
    for (const [field, expected] of [["receivable_account_id", "accounts_receivable"], ["payable_account_id", "accounts_payable"]]) {
      const account = datasets.accounts?.find(a => a.values.id === row.values[field]);
      if (account && account.values.account_type !== expected) issue(`${entity}.csv`, "ACCOUNT_ROLE", `Use an account with account_type ${expected}.`, row.line, field);
    }
  }
  if (!blocked) {
    const accounts = datasets.accounts, transactions = datasets.transactions;
    if (!accounts?.length || !transactions?.length || accounts.reduce((n, row) => n + cents(row.values.opening_balance, "opening_balance"), 0n) !== 0n) issue("transactions.csv", "ACCOUNTING_EVIDENCE", "Provide account and journal evidence with opening balances and journals balanced to zero. MoveBooks never balances the books automatically.");
  }
  report.status = blocked ? "BLOCKED" : report.issue_count ? "NEEDS ATTENTION" : "READY";
  return report;
}
