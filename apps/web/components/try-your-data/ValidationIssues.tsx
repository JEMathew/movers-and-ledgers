"use client";

/** One structured validation finding from the API. File names are the supported names only;
 *  row, column and key point at the cell; message and fix are plain-language and never echo
 *  free-text values from the uploaded files. */
export type Issue = {
  file: string; row: number | null; column?: string | null; key?: string | null;
  code: string; severity: "BLOCKER" | "WARNING"; message: string; fix?: string;
  why?: string; action?: string; can_continue: boolean;
};

const TITLES: Record<string, string> = {
  MISSING_FILE: "Missing required file", UNSUPPORTED_FILE: "Unsupported file", DUPLICATE_FILENAME: "Duplicate file",
  PACKAGE_LIMIT: "Package too large", UNSAFE_ARCHIVE: "Unsafe ZIP", FILE_TOO_LARGE: "File too large",
  EMPTY_FILE: "Empty file", INVALID_ENCODING: "Not UTF-8 Text", BINARY_CONTENT: "Not a text file", HIDDEN_CHARACTERS: "Hidden characters",
  MALFORMED_CSV: "Malformed CSV", MALFORMED_JSON: "Malformed JSON", MISSING_COLUMN: "Missing required column",
  DUPLICATE_HEADER: "Duplicate column", INVALID_HEADER: "Invalid column name", TOO_MANY_COLUMNS: "Too many columns",
  ROW_LIMIT: "Too many rows", MALFORMED_ROW: "Malformed row", MISSING_VALUE: "Missing required value",
  INVALID_IDENTIFIER: "Invalid identifier", INVALID_TYPE: "Invalid value type", INVALID_VALUE: "Invalid value", INVALID_NUMBER: "Invalid amount",
  UNBALANCED_JOURNAL: "Journal Doesn't Balance",
  INVALID_DATE: "Invalid date", TEXT_TOO_LONG: "Text too long", DUPLICATE_ID: "Duplicate identifier",
  MISSING_KEY: "Missing required key", UNSUPPORTED_KEY: "Unsupported key", INVALID_RECORD: "Invalid record",
  INVALID_SCHEMA: "File Can't Be Read", BROKEN_REFERENCE: "Broken reference", ACCOUNT_ROLE: "Wrong account type",
  ACCOUNTING_EVIDENCE: "Books Don't Balance", IGNORED_FIELDS: "Columns That Won't Migrate", METADATA_ONLY: "Metadata not migrated",
};
export const issueTitle = (code: string) => TITLES[code] ?? "Needs attention";

const where = (issue: Issue) => [issue.row ? `Row ${issue.row}` : "", issue.column ? `Column ${issue.column}` : "", issue.key ? `Key ${issue.key}` : ""].filter(Boolean).join(" · ");

export function ValidationIssues({ issues }: { issues: Issue[] }) {
  const blocking = issues.filter(issue => issue.severity === "BLOCKER").length;
  const files = [...new Set(issues.map(issue => issue.file))];
  return <div className="[overflow-wrap:anywhere]">
    <h3 className="type-card">{blocking
      ? `${blocking} ${blocking === 1 ? "thing needs" : "things need"} attention before we can use these files.`
      : `${issues.length} ${issues.length === 1 ? "note" : "notes"} to review`}</h3>
    {files.map(file => <section key={file} className="mt-4" aria-label={`Issues in ${file}`}>
      <h4 className="font-bold"><code>{file}</code></h4>
      <ul className="mt-2 space-y-3">{issues.filter(issue => issue.file === file).map((issue, index) => <li key={index} className="rounded-lg border border-token p-4">
        <p className="font-semibold">{issueTitle(issue.code)}{where(issue) ? <span className="font-normal text-secondary"> · {where(issue)}</span> : null}</p>
        <p className="mt-1">{issue.message}</p>
        {(issue.fix ?? issue.action) && <p className="mt-1"><strong>Fix:</strong> {issue.fix ?? issue.action}</p>}
        {issue.severity === "WARNING" && <p className="mt-1 text-sm text-secondary">You can continue after reviewing this.</p>}
      </li>)}</ul>
    </section>)}
  </div>;
}
