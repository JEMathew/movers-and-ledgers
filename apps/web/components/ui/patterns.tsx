import { ArrowRight, Bot, Check, CircleAlert, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button, Card } from "./primitives";
import { StatusBadge, type ProductStatus } from "./status";

export function MetricCard({ label, value, change, icon: Icon }: { label: string; value: string; change?: string; icon?: LucideIcon }) {
  return <Card className="grid gap-4"><div className="flex items-center justify-between gap-3"><span className="type-label text-muted">{label}</span>{Icon && <span className="metric-icon"><Icon aria-hidden="true" size={18}/></span>}</div><strong className="type-financial">{value}</strong>{change && <span className="type-meta">{change}</span>}</Card>;
}

export function FindingCard({ title, description, status, evidence }: { title: string; description: string; status: ProductStatus; evidence: string }) {
  return <Card className="grid gap-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="type-label text-muted">Finding</p><h3 className="mt-1 type-card">{title}</h3></div><StatusBadge status={status}/></div><p className="type-body-secondary">{description}</p><div className="flex items-center gap-2 border-t border-token pt-3 type-meta"><CircleAlert aria-hidden="true" size={14}/><span>Evidence: {evidence}</span></div></Card>;
}

export function AgentActivityItem({ title, detail, time, complete = false }: { title: string; detail: string; time: string; complete?: boolean }) {
  return <div className="activity-item"><span className="activity-icon">{complete ? <Check aria-hidden="true" size={16}/> : <Bot aria-hidden="true" size={16}/>}</span><div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm"><span className="sr-only">{complete ? "Completed" : "In progress"}: </span>{title}</strong><time className="type-meta">{time}</time></div><p className="mt-1 type-body-secondary">{detail}</p></div></div>;
}

export function ApprovalCard({ title, impact, requestedBy, status = "REQUIRES APPROVAL" }: { title: string; impact: string; requestedBy: string; status?: ProductStatus }) {
  return <Card className="grid gap-4 border-[var(--warning)]"><div className="flex flex-wrap items-start justify-between gap-3"><span className="approval-icon"><UserCheck aria-hidden="true" size={20}/></span><StatusBadge status={status}/></div><div><h3 className="type-card">{title}</h3><p className="mt-2 type-body-secondary">{impact}</p></div><p className="type-meta">Requested by {requestedBy}</p><div className="flex flex-wrap gap-2"><Button size="small">Review decision <ArrowRight aria-hidden="true" size={15}/></Button><Button variant="secondary" size="small">Defer</Button></div></Card>;
}
