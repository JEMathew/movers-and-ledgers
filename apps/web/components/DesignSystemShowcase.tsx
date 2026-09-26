"use client";

import { ArrowRight, Bell, Check, DollarSign, Download, MoreHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";

import {
  AgentActivityItem, Alert, ApprovalCard, Badge, Button, Card, Checkbox, Dialog,
  EmptyState, FindingCard, IconButton, Input, Link, LoadingState, MetricCard, Panel,
  Progress, Radio, Select, Skeleton, StatusLegend, Stepper, Tabs, Toggle, Tooltip,
  productIcons,
} from "@/components/ui";

const swatches = [
  ["Background", "--background"], ["Surface", "--surface"], ["Elevated", "--surface-elevated"],
  ["Primary", "--primary"], ["Success", "--success"], ["Warning", "--warning"],
  ["Error", "--error"], ["Agent", "--agent"], ["Neutral", "--neutral"],
];

const stages = ["Discover", "Assess", "Plan", "Map & Approve", "Migrate", "Validate"].map(label => ({label}));

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="grid gap-6 border-t border-token py-12"><div><p className="type-label text-primary">{eyebrow}</p><h2 className="mt-2 type-section">{title}</h2></div>{children}</section>;
}

export function DesignSystemShowcase() {
  const [enabled, setEnabled] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  return <main className="shell pb-20 pt-12">
    <header className="grid gap-5 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
      <div><Badge>Internal visual QA</Badge><h1 className="mt-5 type-page">MoveBooks AI design system</h1><p className="mt-4 max-w-2xl type-body-secondary">A calm, evidence-first foundation for product, simulator, play, learn, and trust experiences. Toggle the global theme to validate both palettes.</p></div>
      <div className="rounded-xl border border-token bg-[var(--primary-subtle)] p-4 text-sm text-primary"><strong>Financial trust first.</strong><br/>Product intelligence second.<br/>Visual sophistication third.</div>
    </header>

    <Section eyebrow="Foundations" title="Semantic color and typography">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{swatches.map(([label, token]) => <div key={token} className="card overflow-hidden"><div className="h-16 border-b border-token" style={{background: `var(${token})`}}/><div className="p-3"><strong className="text-xs">{label}</strong><code className="mt-1 block text-[10px] text-muted">{token}</code></div></div>)}</div>
      <Panel className="grid gap-6"><div><p className="type-display text-5xl">Display / Trust the move</p><p className="mt-2 type-meta">Display · responsive · semibold</p></div><div><p className="type-page">Page heading</p><p className="type-section">Section heading</p><p className="type-card">Card heading</p></div><div className="grid gap-2 md:grid-cols-2"><p className="type-body">Body copy is optimized for sustained reading and clear product decisions.</p><p className="type-body-secondary">Secondary body supports explanations, context, and lower-emphasis guidance.</p></div><div className="flex flex-wrap items-end gap-8"><span className="type-label">Label text</span><span className="type-meta">Metadata · 09:42 UTC</span><span className="type-financial">$1,284,920.45</span></div></Panel>
    </Section>

    <Section eyebrow="Actions" title="Buttons, links, and icon controls">
      <div className="flex flex-wrap items-center gap-3"><Button>Primary action <ArrowRight aria-hidden="true" size={16}/></Button><Button variant="secondary" leadingIcon={Download}>Export report</Button><Button variant="ghost">Quiet action</Button><Button variant="danger">Block migration</Button><Button disabled>Unavailable</Button><Tooltip label="More migration actions"><IconButton label="More migration actions" icon={MoreHorizontal} variant="secondary"/></Tooltip><Link href="#forms">View form controls</Link></div>
    </Section>

    <Section eyebrow="Product language" title="Statuses never rely on color alone"><StatusLegend/><div className="grid gap-4 md:grid-cols-2"><Alert tone="success" title="Reconciliation verified">All 1,248 source records are represented in the target manifest.</Alert><Alert tone="warning" title="Decision required">Three tax mappings need an authorized reviewer before migration.</Alert><Alert tone="error" title="Migration blocked">Opening balances differ by $120.00. Writes remain disabled.</Alert><Alert title="Agent observation">The mapping agent found a likely match and attached source evidence.</Alert></div></Section>

    <Section eyebrow="Journey" title="Progress and migration lifecycle"><Progress value={68} label="Migration readiness"/><Stepper steps={stages} current={3}/><Tabs items={[{id:"findings",label:"Findings",content:<p className="type-body-secondary">Seven findings are ready for review.</p>},{id:"decisions",label:"Decisions",content:<p className="type-body-secondary">Three decisions require a human owner.</p>},{id:"evidence",label:"Evidence",content:<p className="type-body-secondary">Evidence is immutable and linked to its source.</p>}]} /></Section>

    <Section eyebrow="Forms" title="Clear controls with generous touch targets"><div id="forms" className="grid gap-5 md:grid-cols-2"><Input label="Workspace name" placeholder="Northstar migration" hint="Visible to workspace members."/><Select label="Base currency" defaultValue="USD"><option>USD</option><option>CAD</option><option>GBP</option></Select><div className="grid gap-3"><Checkbox label="Include archived accounts" description="Archived accounts remain read-only."/><Radio name="strategy" label="Phased migration" description="Move entities in validated waves." defaultChecked/><Radio name="strategy" label="Single cutover" description="Move the approved manifest at once."/></div><div className="grid content-start gap-3"><Toggle label="Agent recommendations" checked={enabled} onChange={setEnabled}/><Button variant="secondary" onClick={() => setDialogOpen(true)}>Open approval dialog</Button></div></div></Section>

    <Section eyebrow="Cards" title="Migration findings and decisions"><div className="grid gap-4 lg:grid-cols-3"><MetricCard label="Records discovered" value="24,860" change="Across 12 canonical entities" icon={Sparkles}/><MetricCard label="Balance variance" value="$0.00" change="Verified 4 minutes ago" icon={DollarSign}/><MetricCard label="Approvals open" value="3" change="Two owners assigned" icon={Bell}/></div><div className="grid gap-4 lg:grid-cols-2"><FindingCard title="Tax code has no direct target" description="The source code combines state and municipal rates. Review the proposed split before migration." status="NEEDS ATTENTION" evidence="tax-profile-48"/><ApprovalCard title="Approve chart-of-accounts mappings" impact="This decision authorizes 86 account mappings for the controlled migration run." requestedBy="Mapping Agent"/></div></Section>

    <Section eyebrow="Agent operations" title="Activity, loading, and empty states"><div className="grid gap-4 lg:grid-cols-2"><Card><h3 className="type-card">Recent agent activity</h3><div className="mt-3"><AgentActivityItem title="Source profile completed" detail="12 entity types and 24,860 records profiled." time="09:42" complete/><AgentActivityItem title="Assessing feature compatibility" detail="Comparing evidence against the target capability manifest." time="Now"/></div></Card><Card className="grid gap-5"><LoadingState/><Skeleton className="h-4 w-4/5"/><Skeleton className="h-20 w-full"/><EmptyState title="No unresolved blockers" description="New blockers will appear here with evidence and an accountable owner." action={<Button variant="secondary" size="small" leadingIcon={Check}>View validation</Button>}/></Card></div></Section>

    <Section eyebrow="Iconography" title="One neutral outline family"><div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">{Object.entries(productIcons).slice(0,18).map(([name, Icon]) => <div key={name} className="card grid justify-items-center gap-2 p-3 text-center"><Icon aria-hidden="true" size={20}/><span className="type-meta capitalize">{name.replace(/([A-Z])/g, " $1")}</span></div>)}</div></Section>

    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Approve proposed mappings?" description="Your decision will be recorded in the audit history."><div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => setDialogOpen(false)}>Approve mappings</Button></div></Dialog>
  </main>;
}
