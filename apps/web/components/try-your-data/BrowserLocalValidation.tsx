"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Alert, Badge, Button, Card, Checkbox, Input } from "@/components/ui";
import { ValidationIssues } from "./ValidationIssues";
import { storedZip } from "./browser-archive";
import { validateBrowserPackage, type BrowserReport } from "./browser-validation";
import template from "./browser-template.json";
import contract from "./package-contract.json";
const templateFiles = () => Object.entries(template).map(([name, text]) => ({ name, bytes: new TextEncoder().encode(text) }));
function download(bytes: BlobPart, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
export function BrowserLocalValidation() {
  const [files, setFiles] = useState<File[]>([]), [permission, setPermission] = useState(false);
  const [report, setReport] = useState<BrowserReport>(), [reviewed, setReviewed] = useState(false), [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null), picker = useRef<HTMLDivElement>(null);
  function changeFiles(next: File[]) { setFiles(next); setReport(undefined); setReviewed(false); setConfirmed(false); setError(""); }
  async function validate() {
    setBusy(true); setError(""); setReport(undefined); setReviewed(false); setConfirmed(false);
    try {
      if (!permission) throw new Error("Confirm that these files are permitted synthetic or de-identified test data.");
      if (!files.length || files.length > 9 || files.reduce((n, f) => n + f.size, 0) > contract.limits.max_total_bytes || files.some(f => f.size > (f.name.toLowerCase().endsWith(".zip") ? contract.limits.max_total_bytes : contract.limits.max_file_bytes))) throw new Error("Choose up to 9 files, 256 KiB per expanded file, 2 MiB total, or one ZIP up to 2 MiB. Nothing was sent.");
      setReport(await validateBrowserPackage(await Promise.all(files.map(async file => ({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) })))));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The browser could not check these files. Re-export and try again."); }
    finally { setBusy(false); requestAnimationFrame(() => heading.current?.focus()); }
  }
  return <main className="shell space-y-8 py-12 sm:py-16">
    <header className="max-w-3xl">
      <p className="eyebrow text-primary">Try your data</p>
      <h1 className="type-page mt-4">Check your export in this browser</h1>
      <p className="mt-5 text-lg leading-8 text-secondary">Find missing files, broken references and unbalanced journals before migration. Correct your test export and check it again.</p>
      <Badge className="mt-4">Browser-local compatibility check</Badge>
    </header>
    <Alert tone="info" title="Your files stay in this tab">
      <p>This check runs on your device. No file contents, validation results or hashes are uploaded, stored in browser storage, or sent to Gemini. Use only permitted synthetic or de-identified test data; do not select confidential customer records. Reload or clear files to discard this check.</p>
      <p className="mt-2">Hosted upload and workspace creation are unavailable in this Beta. A passing local check is compatibility evidence; migration readiness, financial verification and your first verified accounting task require the governed journey.</p>
    </Alert>
    <Card>
      <h2 className="type-section">1. Download template</h2>
      <p className="mt-2 text-secondary">Eight synthetic Harbor Light files demonstrate the controlled-package-v1 format. Keep the exact filenames and columns.</p>
      <Button className="mt-4" variant="secondary" onClick={() => download(storedZip(templateFiles()) as BlobPart, "application/zip", "movebooks-controlled-package-v1.zip")}>Download template ZIP</Button>
    </Card>
    <Card>
      <h2 className="type-section">2. Choose test files</h2>
      <div ref={picker} className="mt-4"><Input type="file" multiple accept=".csv,.json,.zip" label="Test files" hint="Choose the individual CSV/JSON files or one flat ZIP. Choosing a filename again replaces that file and clears the earlier review." disabled={busy} onChange={event => { const chosen = Array.from(event.target.files ?? []); const replacementNames = new Set(chosen.map(f => f.name)); changeFiles([...files.filter(f => !replacementNames.has(f.name)), ...chosen]); event.target.value = ""; }}/></div>
      <ul className="my-4 space-y-2">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex flex-wrap items-center gap-3 [overflow-wrap:anywhere]"><span>{file.name} · {file.size.toLocaleString("en-US")} bytes</span><Button variant="ghost" size="small" disabled={busy} onClick={() => changeFiles(files.filter((_, i) => i !== index))}>Remove {file.name}</Button></li>)}</ul>
      <Checkbox label="I have permission to use these synthetic or de-identified test files. They contain no confidential customer data." checked={permission} disabled={busy} onChange={event => { setPermission(event.target.checked); setReviewed(false); setConfirmed(false); }}/>
      {!!files.length && <Button className="mt-4" variant="ghost" disabled={busy} onClick={() => changeFiles([])}>Clear files</Button>}
    </Card>
    <section className="card p-6" aria-live="polite" aria-busy={busy}>
      <h2 ref={heading} tabIndex={-1} className="type-section">3. Validate and review issues</h2>
      <Button className="mt-4" disabled={busy || !files.length || !permission} onClick={validate}>{busy ? "Checking Files…" : report ? "Revalidate files" : "Validate files"}</Button>
      {busy && <p role="status" className="mt-3">Checking locally. No files are being sent.</p>}
      {error && <div role="alert" className="mt-4"><Alert tone="error" title="Files not checked"><p>{error}</p></Alert></div>}
      {report && <div className="mt-4 space-y-4">
        <Alert tone={report.status === "BLOCKED" ? "error" : report.status === "READY" ? "success" : "warning"} title={report.status === "BLOCKED" ? "Correct these files and revalidate" : report.status === "READY" ? "Local compatibility checks passed" : "Review the compatibility notes"}>
          <p>{report.files.length} files checked · {report.files.reduce((n, f) => n + f.rows, 0)} records. {report.status === "BLOCKED" ? "The package has blocking issues. Nothing was imported." : "Review the report and any excluded columns. This does not create a migration workspace."}</p>
        </Alert>
        {!!report.issues.length && <ValidationIssues issues={report.issues}/>}
        {report.issue_count > report.issues.length && <p>{report.issue_count} issues found; showing the first {report.issues.length}. Correct these files and revalidate to continue.</p>}
        <Button variant="secondary" onClick={() => picker.current?.querySelector("input")?.focus()}>Correct or replace files</Button>
        <details className="text-sm"><summary className="cursor-pointer py-2 font-semibold">Files, Checksums and Provenance</summary>
          <p className="mt-2 text-secondary">SHA-256 identifies the selected expanded file bytes. CSV row numbers count records, with the header as row 1. This browser report is not a server-issued review or approval.</p>
          <ul className="mt-3 space-y-3 [overflow-wrap:anywhere]">{report.files.map(file => <li key={file.name}><strong>{file.name}</strong> · {file.rows} records{file.ignored_fields.length ? ` · Excluded columns: ${file.ignored_fields.join(", ")}` : ""}<p>SHA-256: <code>{file.sha256 || "unavailable"}</code></p></li>)}</ul>
        </details>
        <Button variant="ghost" onClick={() => download(JSON.stringify(report, null, 2), "application/json", "movebooks-local-compatibility-report.json")}>Download local report</Button>
      </div>}
    </section>
    {report && report.status !== "BLOCKED" && <Card>
      <h2 className="type-section">4. Review and confirm</h2>
      <p className="mt-2 text-secondary">Confirm that you reviewed this local compatibility result, including any exclusions. Confirmation stays in this tab and does not approve financial actions.</p>
      <div className="mt-4"><Checkbox label="I reviewed the local results and any columns that will not migrate." checked={reviewed} disabled={busy || !permission} onChange={event => { setReviewed(event.target.checked); setConfirmed(false); }}/></div>
      <Button className="mt-4" disabled={!reviewed || !permission || confirmed} onClick={() => setConfirmed(true)}>{confirmed ? "Local review confirmed" : "Confirm local review"}</Button>
      {confirmed && <div className="mt-4"><Alert tone="info" title="Hosted workspace creation is unavailable"><p>The package was checked and reviewed locally. Public uploads are not enabled. Creating a workspace from selected files is available only in local evaluation. Explore the synthetic journey to see migration, verification and your first verified accounting task.</p></Alert><Link className="button mt-4" href="/assess?sample=harbor-light-migrate-demo">Run Harbor Light migration</Link></div>}
    </Card>}
    <details className="card p-6"><summary className="cursor-pointer font-semibold">Supported format and safety limits</summary>
      <div className="mt-4 space-y-4 text-sm leading-6 [overflow-wrap:anywhere]">
        <p>Eight required files and optional metadata.json. Empty datasets use a header-only CSV. Accounts and transactions require actual balanced evidence. No files are corrected automatically.</p>
        <ul className="space-y-3">{contract.files.map(file => <li key={file.name}><code className="font-bold">{file.name}</code><p>Required: {file.required.join(", ")}. {file.optional.length ? `Optional: ${file.optional.join(", ")}.` : ""}</p></li>)}<li><code className="font-bold">configuration.json</code><p>Required keys: {contract.configuration.keys.join(", ")}. Use the template for the exact company, settings and tax keys. No workflow or approval fields.</p></li></ul>
        <p>Maximum 9 expanded files, 256 KiB per file, 2 MiB total, 1,000 records per CSV, 32 columns, 8,192 characters per cell. ZIP stored/deflate only, maximum 100:1 expansion; no directories, duplicate names, encryption, comments, extra fields or data descriptors. If this browser cannot inflate a ZIP, choose its individual files.</p>
        <p>UTF-8 only. IDs use 1–64 letters, digits, hyphens or underscores, starting with a letter or digit. Fixed-point decimal money has at most two places, within ±1e18. Dates use YYYY-MM-DD. Unknown CSV columns require explicit review and are excluded. JSON duplicate keys, hidden characters, unsupported keys and malformed content are blocked.</p>
        <p>This browser check uses a narrower decimal syntax and ZIP subset than local server intake. It cannot certify malware safety or hosted readiness. The full authenticated server flow remains available in local development; public uploads and handoff are unfinished capabilities awaiting security review.</p>
      </div>
    </details>
  </main>;
}
