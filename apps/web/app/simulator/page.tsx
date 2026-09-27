import Link from "next/link";
import { Card } from "@/components/ui";
import { Surface } from "@/components/public-surfaces/Surface";
import { sampleEntry } from "@/components/public-surfaces/content";
export default function Simulator() {
  return <Surface eyebrow="Simulator" title="Rehearse the move. Keep every safeguard." intro="Harbor Light Books is a synthetic business with accounts, customers, suppliers, products and transactions. Experience the real Beta workflow—not a parallel mock."><div className="grid gap-5 md:grid-cols-2">{[
    ["What you will experience", "Discover → Assess → Plan → Map & Approve → Migrate → Resolve → Validate → Configure → Onboard → Verified First Productive Use."],
    ["What is synthetic", "All records, source and target environments, identity and invoice posting are local demonstration data. No real accounting provider is contacted. Sessions expire when the API restarts."],
    ["What you decide", "Review mappings, approve or reject a controlled duplicate-customer remedy, and govern configuration, onboarding and the first invoice. We never pre-approve these steps on entry."],
    ["What success looks like", "Business Ready · Verified in the synthetic environment: required checks pass and an approved first invoice has verified accounting evidence. Moving records alone is not completion."],
  ].map(([title, body]) => <Card key={title}><h2 className="type-card">{title}</h2><p className="mt-3 leading-7 text-secondary">{body}</p></Card>)}</div><div><Link className="button" href={sampleEntry}>Start Harbor Light Books</Link><p className="mt-3 text-sm text-muted">Opens Understand with Harbor Light selected. You explicitly start discovery. Local demo access only; production authentication remains unavailable.</p></div><Link className="button secondary" href="/learn#approvals">Learn about your decisions</Link></Surface>;
}
