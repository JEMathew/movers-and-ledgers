"use client";
import Link from "next/link";
import { Alert, Button } from "@/components/ui";
import { Surface } from "./Surface";
import { phases } from "./content";
import { useSessionView } from "./session";

// The overview has one owner: Home. Explicit legacy references retain their validated
// compatibility read until PR04's workspace error handling supports retirement.
export function ProductEntry() {
  const { view, loading, error, refresh } = useSessionView();
  return <Surface compact eyebrow="Migration link" title="Resume your migration." intro="Read the linked synthetic migration before returning to its current phase.">
    {loading ? <p role="status">Reading your migration…</p> : error ? <Alert tone="warning" title="Migration unavailable"><p>{error}</p><p>No replacement migration was created. Check your reference and access.</p></Alert> : view ? <section className="panel p-5"><h2 className="type-section">{phases[view.phase].name}</h2><p className="mt-3">{view.status.replaceAll("_", " ")}</p><p className="mt-2 break-words text-secondary">Reference: {view.id}</p><Link className="button mt-4" href={`${phases[view.phase].route}?session=${view.id}`}>Continue My Migration</Link><p className="mt-3"><Link className="public-text-link" href={`/trust?view=evidence&session=${view.id}`}>View evidence</Link></p></section> : <Alert tone="warning" title="Migration reference unavailable"><p>No replacement migration was created. Open a valid owned migration link.</p></Alert>}
    <Button variant={view ? "secondary" : "primary"} onClick={refresh} disabled={loading}>Refresh migration</Button>
    <Link className="public-text-link" href="/">Product overview</Link>
  </Surface>;
}
