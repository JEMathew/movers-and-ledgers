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
  MISSING_FILE: "Missing Required File", UNSUPPORTED_FILE: "Unsupported File", DUPLICATE_FILENAME: "Duplicate File",
  PACKAGE_LIMIT: "Package Too Large", UNSAFE_ARCHIVE: "Unsafe ZIP", FILE_TOO_LARGE: "File Too Large",
  EMPTY_FILE: "Empty File", INVALID_ENCODING: "Not UTF-8 Text", BINARY_CONTENT: "Not a Text File", HIDDEN_CHARACTERS: "Hidden Characters",
  MALFORMED_CSV: "Malformed CSV", MALFORMED_JSON: "Malformed JSON", MISSING_COLUMN: "Missing Required Column",
  DUPLICATE_HEADER: "Duplicate Column", INVALID_HEADER: "Invalid Column Name", TOO_MANY_COLUMNS: "Too Many Columns",
  ROW_LIMIT: "Too Many Rows", MALFORMED_ROW: "Malformed Row", MISSING_VALUE: "Missing Required Value",
  INVALID_IDENTIFIER: "Invalid Identifier", INVALID_TYPE: "Invalid Value Type", INVALID_VALUE: "Invalid Value", INVALID_NUMBER: "Invalid Amount",
  UNBALANCED_JOURNAL: "Journal Doesn't Balance",
  INVALID_DATE: "Invalid Date", TEXT_TOO_LONG: "Text Too Long", DUPLICATE_ID: "Duplicate Identifier",
  MISSING_KEY: "Missing Required Key", UNSUPPORTED_KEY: "Unsupported Key", INVALID_RECORD: "Invalid Record",
  INVALID_SCHEMA: "File Can't Be Read", BROKEN_REFERENCE: "Broken Reference", ACCOUNT_ROLE: "Wrong Account Type",
  ACCOUNTING_EVIDENCE: "Books Don't Balance", IGNORED_FIELDS: "Columns That Won't Migrate", METADATA_ONLY: "Metadata Not Migrated",
};
export const issueTitle = (code: string) => TITLES[code] ?? "Needs Attention";

const where = (issue: Issue) => [issue.row ? `Row ${issue.row}` : "", issue.column ? `Column ${issue.column}` : "", issue.key ? `Key ${issue.key}` : ""].filter(Boolean).join(" · ");

export function ValidationIssues({ issues }: { issues: Issue[] }) {
  const blocking = issues.filter(issue => issue.severity === "BLOCKER").length;
  const files = [...new Set(issues.map(issue => issue.file))];
  return <div className="[overflow-wrap:anywhere]">
    <h3 className="type-card">{blocking
      ? `${blocking} ${blocking === 1 ? "Thing Needs" : "Things Need"} Attention Before We Can Use These Files.`
      : `${issues.length} ${issues.length === 1 ? "Note" : "Notes"} to Review`}</h3>
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
