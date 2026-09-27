"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Alert, Button, Card, Checkbox, Input } from "@/components/ui";
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
import { authHeaders, cloudIdentity } from "@/lib/identity";
type Issue = { file: string; row: number | null; severity: string; message: string; why: string; action: string; can_continue: boolean };
type Report = { package_id: string; status: string; files: { name: string; type: string; rows: number; schema_status: string; ignored_fields: string[] }[]; issues: Issue[]; activity: string[] };
const names = ["customers.csv", "vendors.csv", "accounts.csv", "products.csv", "invoices.csv", "bills.csv", "transactions.csv", "configuration.json"];
async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${API}/v1${path}`, { ...init, headers: { ...await authHeaders(), ...init?.headers } });
  if (!response.ok) throw new Error(response.status === 429 ? "Local capacity reached. Discard a package or restart the local API." : response.status === 404 ? "Package expired. Validate your files again." : "Request failed. Check local API access, limits and format, then retry. No downstream stage was authorized.");
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
  const [privacy, setPrivacy] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [session, setSession] = useState<string>();
  const heading = useRef<HTMLHeadingElement>(null);
  const focus = () => requestAnimationFrame(() => heading.current?.focus());
  async function discard() {
    if (report) await request(`/intake/${report.package_id}/discard`, { method: "POST" }).catch(() => undefined);
  }
  function changeFiles(next: File[]) {
    void discard(); setReport(undefined); setReviewed(false); setSession(undefined); setError(""); setFiles(next);
  }
  async function validate() {
    setBusy(true); setError(""); setReviewed(false); setSession(undefined);
    try {
      if (cloudIdentity()) throw new Error("Try Your Data remains local-only. Cloud upload retention is not enabled; no files were sent.");
      if (!privacy) throw new Error("Confirm the local Beta notice before uploading.");
      if (!files.length || files.length > 9 || files.reduce((n, f) => n + f.size, 0) > 2 * 1024 * 1024 || files.some(f => f.size > (f.name.endsWith(".zip") ? 2 * 1024 * 1024 : 256 * 1024))) throw new Error("Choose up to 9 files, at most 256 KiB each and 2 MiB total, or one ZIP up to 2 MiB.");
      await discard(); setReport(undefined);
      const result = await request("/intake/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files: await Promise.all(files.map(encode)) }) });
      setReport(await result.json());
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Validation unavailable."); }
    finally { setBusy(false); focus(); }
  }
  async function create() {
    if (!report || !reviewed || report.status === "BLOCKED") return;
    setBusy(true); setError("");
    try {
      const response = await request(`/intake/${report.package_id}/workspace`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewed: true }) });
      const data = await response.json();
      setSession(data.session_id); sessionStorage.setItem("movebooks-migration-session", data.session_id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Workspace unavailable."); }
    finally { setBusy(false); focus(); }
  }
  async function template() {
    try {
      const response = await request("/intake/template");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a"); a.href = url; a.download = "controlled-package.zip"; a.click(); URL.revokeObjectURL(url);
    } catch { setError("Template unavailable. Check local API access."); }
  }
  return <main className="shell space-y-8 py-12 sm:py-16">
    <header className="max-w-3xl"><p className="eyebrow text-primary">Try Your Data · Local Beta</p><h1 className="type-page mt-4">Understand your export before you move.</h1><p className="mt-5 text-lg leading-8 text-secondary">Upload → Validate → Review → Resolve blockers → Create workspace → Discover + Assess. Your package enters the same governed journey, without skipping approvals.</p></header>
    <Alert tone="warning" title="Local evaluation only — not a secure production intake service"><p>Use de-identified test exports only. Files stay in this tab until you choose Validate, then go to your configured local API. Normalized records stay in process memory until restart; unclaimed packages expire after 30 minutes. Discarding a package does not delete an existing workspace. No production retention, encryption-at-rest or compliance guarantee. No data goes to an LLM. Later writes remain in a synthetic target, never a provider.</p></Alert>
    <Card><h2 className="type-section">Supported package v1</h2><p className="mt-3">Eight required files; metadata.json is optional. Use the exact template schema, not a proprietary export. Header-only CSVs declare empty datasets; accounts and journals need evidence.</p><ul className="my-4 grid gap-2 sm:grid-cols-2">{names.map(name => <li key={name}><code>{name}</code></li>)}</ul><p>Up to 9 files, 1,000 rows and 256 KiB per file, 2 MiB total. One flat ZIP is supported. No PDFs, images, macros, binaries, folders or nested ZIPs.</p><Button className="mt-4" variant="secondary" onClick={template}>Download synthetic package template</Button><details className="mt-4"><summary className="cursor-pointer py-2 font-semibold">Schema and accounting limits</summary><p className="mt-3">Keep the template headers. Identifiers use letters, digits, hyphens or underscores (64 characters maximum). Money uses exact decimal text with at most two decimal places. transactions.csv has a JSON entries cell with account_id, debit and credit. Configuration contains company, eight settings and taxes; it cannot set lifecycle state. Unknown CSV columns are disclosed and excluded only after your review. Invalid references or unbalanced journals block intake; later reconciliation and approvals still apply.</p></details></Card>
    <Card><h2 className="type-section">1. Choose or replace files</h2><div className="mt-4"><Input type="file" multiple label="Accounting package files" hint="Add files incrementally. Remove a file before replacing it with the same name." disabled={busy} onChange={event => { changeFiles([...files, ...Array.from(event.target.files ?? [])]); event.target.value = ""; }}/></div><ul className="my-4 space-y-2">{files.map((file, i) => <li key={`${i}-${file.name}`} className="flex flex-wrap items-center gap-3 break-all"><span>{file.name} · {file.size} bytes</span><Button variant="ghost" disabled={busy} onClick={() => changeFiles(files.filter((_, index) => index !== i))}>Remove {file.name}</Button></li>)}</ul><Checkbox label="I have permission to use these de-identified test records and understand the local Beta limitations." checked={privacy} disabled={busy} onChange={event => setPrivacy(event.target.checked)}/><Button className="mt-5" disabled={busy || !files.length || !privacy} onClick={validate}>{busy ? "Processing…" : report ? "Retry validation" : "Validate package"}</Button><Button variant="ghost" className="ml-2" disabled={busy} onClick={() => changeFiles([])}>Discard selected package</Button></Card>
    <section aria-live="polite" aria-busy={busy}><h2 ref={heading} tabIndex={-1} className="type-section">{session ? "Workspace created · Discover and Assess completed" : "2. Review validation"}</h2>{busy && <p role="status" className="mt-3">Checking the controlled package. Please wait.</p>}{error && <div className="mt-4" role="alert"><Alert tone="error" title="Action needed"><p>{error}</p></Alert></div>}
      {report && <><p className="mt-4 font-semibold">Package status: {report.status}</p><div className="mt-4 grid gap-3 md:grid-cols-2">{report.files.map(file => <Card key={file.name}><h3 className="font-bold">{file.name}</h3><p>{file.type.toUpperCase()} · {file.rows} records · Schema: {file.schema_status}</p>{file.ignored_fields.length > 0 && <p>Excluded fields: {file.ignored_fields.join(", ")}</p>}</Card>)}</div><ul className="mt-5 space-y-3">{report.issues.map((issue, i) => <li key={i}><Alert tone={issue.severity === "BLOCKER" ? "error" : "warning"} title={`${issue.severity}: ${issue.file}${issue.row ? ` · row ${issue.row}` : ""}`}><p>{issue.message}</p><p>{issue.why}</p><p>{issue.action}</p><p>{issue.can_continue ? "Continue only after reviewing this warning." : "Cannot continue until corrected. No automatic accounting repair."}</p></Alert></li>)}</ul><details className="mt-4"><summary className="cursor-pointer py-2 font-semibold">Safe intake activity</summary><ul>{report.activity.map(action => <li key={action}>{action} · Deterministic check</li>)}</ul></details>
      {!session && <div className="mt-5"><Checkbox label="I reviewed findings, excluded fields and the synthetic-target boundary. Create this workspace without skipping approvals." checked={reviewed} disabled={busy || report.status === "BLOCKED"} onChange={event => setReviewed(event.target.checked)}/><Button className="mt-4" disabled={busy || !reviewed || report.status === "BLOCKED"} onClick={create}>Create workspace and enter Discover → Assess</Button></div>}</>}
      {session && <div className="mt-5"><p>Package acceptance is not migration readiness. Review the actual assessment next; all later gates remain required.</p><Link className="button mt-4" href={`/assess?session=${session}`}>Review Discover → Assess</Link><Link className="button secondary mt-4 ml-2" href={`/trust?session=${session}`}>View safe intake evidence</Link></div>}
    </section>
  </main>;
}
