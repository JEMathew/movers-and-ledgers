"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Alert, Badge, Button, Card, Checkbox, Input } from "@/components/ui";
import { authHeaders, cloudIdentity } from "@/lib/identity";
import { INTAKE_UNREACHABLE, reach } from "@/lib/reach";
import contract from "./package-contract.json";
import { ValidationIssues, type Issue } from "./ValidationIssues";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
type Report = { package_id: string; status: "READY" | "NEEDS ATTENTION" | "BLOCKED"; files: { name: string; type: string; rows: number; schema_status: string; ignored_fields: string[] }[]; issues: Issue[]; activity: string[] };
const { limits } = contract;
const kib = (bytes: number) => `${bytes / 1024} KiB`;
const mib = (bytes: number) => `${bytes / 1024 / 1024} MiB`;
const LIMIT_TEXT = `Choose up to ${limits.max_files} files (${kib(limits.max_file_bytes)} each, ${mib(limits.max_total_bytes)} in total), or one ZIP up to ${mib(limits.max_total_bytes)}.`;

// The API's error details are fixed, safe strings; only status-specific guidance is added here.
async function request(path: string, init?: RequestInit) {
  const response = await reach(`${API}/v1${path}`, { ...init, headers: { ...await authHeaders(), ...init?.headers } }, INTAKE_UNREACHABLE);
  if (!response.ok) {
    const message = {
      400: "MoveBooks couldn't read this package. Choose supported CSV and JSON files, or one ZIP, and try again. Nothing was imported or changed.",
      404: "This check has expired. Validate your files again.",
      409: "These files still need attention. Fix them and validate again before continuing.",
      413: `These files are larger than this Beta accepts. ${LIMIT_TEXT} Nothing was imported or changed.`,
      429: "Too many packages are waiting to be checked. Remove an earlier package or restart the local service, then try again.",
    }[response.status] ?? "MoveBooks couldn't check these files right now. Nothing was imported or changed; try again.";
    throw new Error(message);
  }
  return response;
}
async function encode(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { name: file.name, content: btoa(binary) };
}

export function TryYourData() {
  const [files, setFiles] = useState<File[]>([]);
  const [report, setReport] = useState<Report>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [session, setSession] = useState<string>();
  const results = useRef<HTMLHeadingElement>(null);
  const chooser = useRef<HTMLDivElement>(null);
  const format = useRef<HTMLDetailsElement>(null);
  const focusResults = () => requestAnimationFrame(() => results.current?.focus());
  async function discard() {
    if (report) await request(`/intake/${report.package_id}/discard`, { method: "POST" }).catch(() => undefined);
  }
  function changeFiles(next: File[]) {
    void discard(); setReport(undefined); setReviewed(false); setSession(undefined); setError(""); setFiles(next);
  }
  async function validate() {
    setBusy(true); setError(""); setReviewed(false); setSession(undefined);
    try {
      if (cloudIdentity()) throw new Error("Test exports can only be checked in the local Beta. No files were sent.");
      if (!permission) throw new Error("Confirm that you're using de-identified test data before validating.");
      if (!files.length || files.length > limits.max_files || files.reduce((n, f) => n + f.size, 0) > limits.max_total_bytes || files.some(f => f.size > (f.name.toLowerCase().endsWith(".zip") ? limits.max_total_bytes : limits.max_file_bytes))) throw new Error(`${LIMIT_TEXT} Nothing was sent.`);
      await discard(); setReport(undefined);
      const result = await request("/intake/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files: await Promise.all(files.map(encode)) }) });
      setReport(await result.json());
    } catch (caught) { setError(caught instanceof Error ? caught.message : "MoveBooks couldn't check these files right now. Nothing was imported or changed."); }
    finally { setBusy(false); focusResults(); }
  }
  async function continueToAssessment() {
    if (!report || !reviewed || report.status === "BLOCKED") return;
    setBusy(true); setError("");
    try {
      const response = await request(`/intake/${report.package_id}/workspace`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewed: true }) });
      const data = await response.json();
      setSession(data.session_id); sessionStorage.setItem("movebooks-migration-session", data.session_id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "MoveBooks couldn't start the assessment. Nothing was changed."); }
    finally { setBusy(false); focusResults(); }
  }
  async function downloadSample() {
    try {
      const response = await request("/intake/template");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a"); a.href = url; a.download = "movebooks-sample-package.zip"; a.click(); URL.revokeObjectURL(url);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The sample package isn't available right now."); }
  }
  function fixFiles() {
    chooser.current?.scrollIntoView?.({ block: "start" });
    chooser.current?.querySelector<HTMLInputElement>("input[type=file]")?.focus();
  }
  function viewFormat() {
    if (format.current) format.current.open = true;
    format.current?.scrollIntoView?.({ block: "start" });
    format.current?.querySelector("summary")?.focus();
  }
  const blocked = report?.status === "BLOCKED";

  return <main className="shell space-y-8 py-12 sm:py-16">
    <header className="max-w-3xl">
      <p className="eyebrow text-primary">Use My Test Export</p>
      <h1 className="type-page mt-4">Check Your Export Before Migration</h1>
      <p className="mt-5 text-lg leading-8 text-secondary">We&apos;ll check the files, identify missing or inconsistent data, and show what needs attention before anything moves.</p>
      <Badge className="mt-4">De-Identified Test Data Only</Badge>
    </header>

    <Card>
      <h2 className="type-section">1. Download Sample Package</h2>
      <p className="mt-2 text-secondary">See a small example of the files and formats MoveBooks accepts.</p>
      <Button className="mt-4" variant="secondary" onClick={downloadSample}>Download Sample Package</Button>
    </Card>

    <Card>
      <div ref={chooser} className="scroll-mt-8">
        <h2 className="type-section">2. Choose Test Files</h2>
        <div className="mt-4"><Input type="file" multiple label="Test files" hint="Choose CSV and JSON files from your export, or one ZIP. You can add files in more than one pick." disabled={busy} onChange={event => { changeFiles([...files, ...Array.from(event.target.files ?? [])]); event.target.value = ""; }}/></div>
      </div>
      <ul className="my-4 space-y-2">{files.map((file, i) => <li key={`${i}-${file.name}`} className="flex flex-wrap items-center gap-3 [overflow-wrap:anywhere]"><span className="min-w-0">{file.name} · {file.size} bytes</span><Button variant="ghost" size="small" disabled={busy} onClick={() => changeFiles(files.filter((_, index) => index !== i))}>Remove {file.name}</Button></li>)}</ul>
      <Checkbox label="I'm using de-identified test data and understand this Beta's limits." checked={permission} disabled={busy} onChange={event => setPermission(event.target.checked)}/>
      {files.length > 0 && <Button className="mt-4" variant="ghost" size="small" disabled={busy} onClick={() => changeFiles([])}>Clear Files</Button>}
    </Card>

    <section aria-live="polite" aria-busy={busy} className="card p-6">
      <h2 ref={results} tabIndex={-1} className="type-section">3. Validate Files</h2>
      {!report && !session && <Button className="mt-4" disabled={busy || !files.length || !permission} onClick={validate}>{busy ? "Checking Files…" : "Validate Files"}</Button>}
      {busy && <p role="status" className="mt-3">Checking your files. Nothing is imported while we check.</p>}
      {error && <div className="mt-4" role="alert"><Alert tone="error" title="Files Not Checked"><p>{error}</p></Alert></div>}
      {report && blocked && <div className="mt-4">
        <ValidationIssues issues={report.issues.filter(issue => issue.severity === "BLOCKER")} />
        <p className="mt-4 font-semibold">We couldn&apos;t use this package yet. Nothing was imported or changed.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Button onClick={fixFiles}>Fix Files and Validate Again</Button><Button variant="secondary" onClick={viewFormat}>View Expected Format</Button></div>
      </div>}
      {report && !blocked && <div className="mt-4">
        <Alert tone={report.status === "READY" ? "success" : "warning"} title={report.status === "READY" ? "Your Files Are Ready" : "Your Files Can Be Used After Review"}>
          <p>{report.files.length} files checked{report.files.length ? ` · ${report.files.reduce((n, f) => n + f.rows, 0)} records` : ""}.{report.status === "READY" ? " Nothing needs attention." : " Review the notes below before you continue."}</p>
        </Alert>
        {report.issues.length > 0 && <div className="mt-4"><ValidationIssues issues={report.issues} /></div>}
        <Button className="mt-4" variant="ghost" size="small" disabled={busy} onClick={validate}>Validate Again</Button>
      </div>}
      {report && <details className="mt-4 text-sm"><summary className="cursor-pointer py-2 font-semibold">Files Checked</summary><ul className="mt-2 space-y-1 text-secondary">{report.files.map(file => <li key={file.name}>{file.name} · {file.rows} records · {file.schema_status === "READY" ? "Ready" : "Needs attention"}{file.ignored_fields.length > 0 ? ` · Not migrated: ${file.ignored_fields.join(", ")}` : ""}</li>)}</ul></details>}
    </section>

    {report && !blocked && <section className="card p-6" aria-labelledby="continue-title">
      <h2 id="continue-title" className="type-section">4. Continue to Assessment</h2>
      {!session ? <>
        <p className="mt-2 text-secondary">We&apos;ll create a workspace from these files and check whether the books are ready to migrate. Every later step still needs your approval.</p>
        <div className="mt-4"><Checkbox label="I reviewed the results, including any columns that won't migrate." checked={reviewed} disabled={busy} onChange={event => setReviewed(event.target.checked)}/></div>
        <Button className="mt-4" disabled={busy || !reviewed} onClick={continueToAssessment}>Continue to Assessment</Button>
      </> : <>
        <p className="mt-2 text-secondary">Your workspace is ready and its migration readiness has been checked. Accepted files don&apos;t mean the books are ready to migrate; review the assessment next.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Link className="button" href={`/assess?session=${session}`}>View Assessment Results</Link><Link className="button secondary" href={`/trust?session=${session}`}>View Intake Evidence</Link></div>
      </>}
    </section>}

    <details ref={format} className="card scroll-mt-8 p-6">
      <summary className="cursor-pointer font-semibold">View Supported File Format and Limits</summary>
      <div className="mt-4 space-y-4 text-sm leading-6 [overflow-wrap:anywhere]">
        <p>Use the sample package as a reference. File names and column headers must match exactly. A CSV with only its header row means that dataset is empty.</p>
        <table className="w-full text-left"><thead><tr><th className="py-1 pr-4">Required file</th><th className="py-1 pr-4">Required columns</th><th className="py-1">Optional columns</th></tr></thead>
          <tbody>{contract.files.map(file => <tr key={file.name} className="border-t border-token align-top"><td className="py-2 pr-4"><code>{file.name}</code></td><td className="py-2 pr-4">{file.required.join(", ")}</td><td className="py-2">{file.optional.join(", ") || "None"}</td></tr>)}
            <tr className="border-t border-token align-top"><td className="py-2 pr-4"><code>{contract.configuration.name}</code></td><td className="py-2 pr-4">{contract.configuration.keys.join(", ")}</td><td className="py-2">None</td></tr></tbody></table>
        <p><code>configuration.json</code> company keys: {contract.configuration.company.join(", ")}. Settings: {contract.configuration.settings.join(", ")}. Each tax entry: {contract.configuration.taxes.join(", ")}.</p>
        <p>Optional file: <code>{contract.optional_files.join(", ")}</code> (package_version and description only).</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Accepted: <code>.csv</code> and <code>.json</code> files with the names above, or one ZIP containing only those files (no folders).</li>
          <li>Up to {limits.max_files} files, {kib(limits.max_file_bytes)} per file and {mib(limits.max_total_bytes)} in total.</li>
          <li>Up to {limits.max_rows.toLocaleString("en-US")} rows and {limits.max_columns} columns per CSV; text values up to {limits.max_text_length} characters.</li>
          <li>UTF-8 text with comma-separated values. Excel, PDF, images, macros and other binary files are not accepted, even when renamed.</li>
          <li>Identifiers use letters, digits, hyphens or underscores (up to 64 characters). Money uses decimal text with at most two decimal places. Dates use YYYY-MM-DD.</li>
          <li>Each row in <code>transactions.csv</code> has an <code>entries</code> JSON list of account_id, debit and credit; every journal must balance.</li>
        </ul>
      </div>
    </details>

    <Alert tone="info" title="About This Beta">
      <p>Use de-identified test exports only. Files stay in this tab until you choose Validate Files, then go to your local MoveBooks service. Checked records stay in memory until the service restarts, and unused packages expire after 30 minutes. This Beta offers no production retention, encryption at rest or compliance guarantee. No data goes to an LLM, and results stay in a synthetic workspace, never an accounting provider.</p>
    </Alert>
  </main>;
}
