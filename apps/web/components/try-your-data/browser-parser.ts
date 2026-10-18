/** Strict, bounded text parsers. Untrusted values never become code or instructions. */
export class ParseFinding extends Error {
  constructor(public code: string, message: string, public column?: string) { super(message); }
}
const bad = (code: string, message: string): never => { throw new ParseFinding(code, message); };
export const hidden = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/;
export function strictJson(text: string): unknown {
  let cursor = 0, tokens = 0;
  function whitespace() { while (/[ \r\n\t]/.test(text[cursor] ?? "x")) cursor++; }
  function string() {
    const start = cursor++;
    while (cursor < text.length) {
      const char = text[cursor++];
      if (char === "\\") { cursor++; continue; }
      if (char === '"') {
        const value = JSON.parse(text.slice(start, cursor)) as string;
        if (hidden.test(value)) bad("HIDDEN_CHARACTERS", "Remove hidden or escaped control characters.");
        return value;
      }
    }
    return bad("MALFORMED_JSON", "A JSON string is not closed.");
  }
  function value(depth: number): unknown {
    if (depth > 16 || ++tokens > 40000) bad("MALFORMED_JSON", "JSON structure is too deep or complex; use the template structure.");
    whitespace(); const char = text[cursor];
    if (char === '"') return string();
    if (char === "{" || char === "[") {
      const object = char === "{", close = object ? "}" : "]"; cursor++; whitespace();
      const result: Record<string, unknown> = Object.create(null), list: unknown[] = [], seen = new Set<string>();
      if (text[cursor] === close) { cursor++; return object ? result : list; }
      for (;;) {
        whitespace();
        if (object) {
          if (text[cursor] !== '"') bad("MALFORMED_JSON", "JSON object keys need quotes.");
          const key = string(); if (seen.has(key)) bad("MALFORMED_JSON", "A JSON key appears more than once; keep each key once.");
          seen.add(key); whitespace(); if (text[cursor++] !== ":") bad("MALFORMED_JSON", "A JSON key needs a colon.");
          result[key] = value(depth + 1);
        } else list.push(value(depth + 1));
        whitespace(); const next = text[cursor++];
        if (next === close) return object ? result : list;
        if (next !== ",") bad("MALFORMED_JSON", "Check JSON commas, quotes and brackets against the template.");
      }
    }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(cursor));
    if (!match) return bad("MALFORMED_JSON", "Use valid JSON without NaN or Infinity.");
    cursor += match[0].length; const parsed: unknown = JSON.parse(match[0]);
    if (typeof parsed === "number" && !Number.isFinite(parsed)) bad("MALFORMED_JSON", "Use finite JSON numbers.");
    return parsed;
  }
  try { const result = value(0); whitespace(); if (cursor !== text.length) bad("MALFORMED_JSON", "Remove content after the JSON value."); return result; }
  catch (error) { if (error instanceof ParseFinding) throw error; return bad("MALFORMED_JSON", "Check JSON commas, quotes and brackets against the template."); }
}
export function csvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false, closed = false;
  function endCell() { row.push(cell); cell = ""; closed = false; if (row.length > 32) bad("TOO_MANY_COLUMNS", "Use at most 32 columns per CSV."); }
  function endRow() { endCell(); rows.push(row); row = []; if (rows.length > 1001) bad("ROW_LIMIT", "Use at most 1,000 records per CSV."); }
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) { if (char === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } } else cell += char; }
    else if (char === ",") endCell();
    else if (char === "\r" || char === "\n") { if (char === "\r" && text[i + 1] === "\n") i++; endRow(); }
    else if (closed) bad("MALFORMED_CSV", "Only a comma or line ending may follow a closing quote.");
    else if (char === '"') { if (cell.length) bad("MALFORMED_CSV", "Quote the whole CSV cell and escape embedded quotes by doubling them."); quoted = true; }
    else cell += char;
    if (cell.length > 8192) bad("TEXT_TOO_LONG", "Use at most 8,192 characters per CSV cell.");
  }
  if (quoted) bad("MALFORMED_CSV", "Close the quoted CSV cell.");
  if (cell || row.length || closed) endRow();
  return rows;
}
