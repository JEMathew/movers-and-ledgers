"use client";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, CircleDashed, Loader2, Plus } from "lucide-react";
import { authHeaders } from "@/lib/identity";
import { Button } from "@/components/ui/primitives";
import { isSessionId } from "../public-surfaces/session";

export type MigrationItem = { id: string; company: string; status: string; created: string };
export type MigrationList = { items: MigrationItem[]; next: string | null; incomplete: boolean; skipped: number };
type Failure = "identity" | "unavailable";

const API = () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const isoDate = (value: unknown) => typeof value === "string" && !Number.isNaN(Date.parse(value));

/** Validates the owner-scoped listing. Anything unexpected is a failure, never an empty list. */
export function parseList(raw: unknown): MigrationList {
  const body = raw as { items?: unknown; next_cursor?: unknown; incomplete?: unknown; skipped?: unknown };
  if (!body || !Array.isArray(body.items) || typeof body.incomplete !== "boolean") throw new Error("shape");
  const items = body.items.map((entry): MigrationItem => {
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== "string" || !isSessionId(e.id) || typeof e.workflow_status !== "string" || !isoDate(e.created_at)) throw new Error("shape");
    return { id: e.id, company: typeof e.company_name === "string" ? e.company_name.slice(0, 120) : "Migration", status: e.workflow_status, created: e.created_at as string };
  });
  return { items, next: typeof body.next_cursor === "string" ? body.next_cursor : null, incomplete: body.incomplete, skipped: typeof body.skipped === "number" ? body.skipped : 0 };
}

export function useMigrationList(enabled: boolean) {
  const [state, setState] = useState<{ list?: MigrationList; failure?: Failure; loading: boolean; more: boolean }>({ loading: enabled, more: false });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let active = true;
    setState({ loading: true, more: false });
    (async () => {
      try {
        const response = await fetch(`${API()}/v1/migration-sessions?limit=20`, { headers: await authHeaders(), signal: controller.signal });
        if (!response.ok) throw response.status === 401 ? new Error("identity") : new Error("unavailable");
        const list = parseList(await response.json());
        if (active) setState({ list, loading: false, more: false });
      } catch (error) { if (active && !controller.signal.aborted) setState({ failure: (error as Error).message === "identity" ? "identity" : "unavailable", loading: false, more: false }); }
    })();
    return () => { active = false; controller.abort(); };
  }, [enabled, revision]);
  const loadMore = useCallback(async () => {
    const cursor = state.list?.next;
    if (!cursor) return;
    setState(s => ({ ...s, more: true }));
    try {
      const response = await fetch(`${API()}/v1/migration-sessions?limit=20&cursor=${encodeURIComponent(cursor)}`, { headers: await authHeaders() });
      if (!response.ok) throw new Error("unavailable");
      const next = parseList(await response.json());
      setState(s => ({ loading: false, more: false, list: { items: [...(s.list?.items ?? []), ...next.items.filter(n => !s.list?.items.some(i => i.id === n.id))], next: next.next, incomplete: s.list?.incomplete || next.incomplete, skipped: (s.list?.skipped ?? 0) + next.skipped } }));
    } catch { setState(s => ({ ...s, more: false, failure: "unavailable" })); }
  }, [state.list?.next]);
  return { ...state, retry: () => setRevision(x => x + 1), loadMore };
}

const label = (status: string) => status === "VERIFIED_FIRST_PRODUCTIVE_USE" ? ["Complete", "success", BadgeCheck] as const : /BLOCKED|PAUSED|RESOLVING|RETRY_PENDING|REVIEW_REQUIRED/.test(status) ? ["Needs attention", "warning", AlertTriangle] as const : ["In progress", "neutral", CircleDashed] as const;
const dateText = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function MigrationPicker({ list, loadMore, more, failure }: { list: MigrationList; loadMore: () => void; more: boolean; failure?: Failure }) {
  return <main id="main-content" className="shell mm" aria-labelledby="picker-title">
    <header className="mm-header"><p className="mm-eyebrow"><strong>My migration</strong></p><h1 id="picker-title" className="mm-title">Choose a migration</h1>
      <p className="mm-meta">Each migration keeps its own decisions and evidence. Opening one changes nothing.</p></header>
    <ul className="mm-pick" aria-label="Your migrations">{list.items.map(item => { const [text, tone, Icon] = label(item.status); return <li key={item.id}><a href={`/workspace?session=${item.id}`}>
      <span className="mm-pick-name">{item.company}</span>
      <span className="status-text" data-tone={tone}><Icon size={16} aria-hidden="true"/>{text}</span>
      <span className="mm-pick-meta">Started {dateText(item.created)} · …{item.id.slice(-4)}</span></a></li>; })}</ul>
    {list.incomplete && <p className="mm-notice" role="status" data-tone="warning"><AlertTriangle size={16} aria-hidden="true"/>History may be incomplete. Some older migrations are not shown. Open one with its saved link or reference.</p>}
    {list.skipped > 0 && <p className="mm-notice" role="status">{list.skipped} stored {list.skipped === 1 ? "migration" : "migrations"} could not be read and {list.skipped === 1 ? "is" : "are"} not shown.</p>}
    {failure && <p className="mm-notice" role="alert" data-tone="warning">More migrations could not be loaded. Try again.</p>}
    <nav className="mm-actions" aria-label="Migration actions">
      {list.next && <button type="button" className="mm-text-button" onClick={loadMore} disabled={more}>{more ? <Loader2 size={16} aria-hidden="true"/> : null}Show more migrations</button>}
      <a className="button secondary" href="/assess?sample=harbor-light-migrate-demo"><Plus size={18} aria-hidden="true"/>Start a new sample migration</a>
    </nav>
    <details className="mm-details"><summary>Open a migration by reference</summary><form action="/workspace" method="get"><label className="field-label">Migration reference<input className="field-control" name="session" required pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" placeholder="UUID from your migration link"/></label><Button variant="secondary" type="submit">Open reference</Button></form></details>
  </main>;
}

export function ListProblem({ failure, retry }: { failure: Failure; retry: () => void }) {
  return <main id="main-content" className="shell mm"><header className="mm-header"><p className="mm-eyebrow"><strong>My migration</strong></p><h1 className="mm-title">Your migrations could not be checked</h1></header>
    <section className="mm-card mm-problem" aria-label="Problem"><p>Nothing was started</p>
      <p className="mm-meta">{failure === "identity" ? "Your access needs verification. Sign in again to see your migrations." : "We could not read your saved migrations. This is not the same as having none. Check your connection and try again."}</p>
      <div className="mm-actions"><button type="button" className="button" onClick={retry}>Try again</button></div></section></main>;
}
