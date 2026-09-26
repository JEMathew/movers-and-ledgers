import { Bot, Check, CheckCircle2, CircleAlert, CircleDashed, Clock3, Hand, OctagonX, ShieldCheck, TriangleAlert, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "./utils";

export const statusValues = [
  "READY", "NEEDS ATTENTION", "BLOCKED", "IN PROGRESS", "COMPLETED",
  "REQUIRES APPROVAL", "AGENT ACTION", "HUMAN ACTION", "VERIFIED",
] as const;

export type ProductStatus = (typeof statusValues)[number];
type Tone = "success" | "warning" | "error" | "info" | "neutral" | "agent";

const statusConfig: Record<ProductStatus, { icon: LucideIcon; tone: Tone }> = {
  "READY": { icon: CheckCircle2, tone: "success" },
  "NEEDS ATTENTION": { icon: TriangleAlert, tone: "warning" },
  "BLOCKED": { icon: OctagonX, tone: "error" },
  "IN PROGRESS": { icon: Clock3, tone: "info" },
  "COMPLETED": { icon: Check, tone: "success" },
  "REQUIRES APPROVAL": { icon: UserCheck, tone: "warning" },
  "AGENT ACTION": { icon: Bot, tone: "agent" },
  "HUMAN ACTION": { icon: Hand, tone: "info" },
  "VERIFIED": { icon: ShieldCheck, tone: "success" },
};

export function StatusBadge({ status, className }: { status: ProductStatus; className?: string }) {
  const { icon: Icon, tone } = statusConfig[status];
  return (
    <span className={cn("status-badge", `status-${tone}`, className)} data-status={status}>
      <Icon aria-hidden="true" size={14} strokeWidth={2.2} />
      <span>{status}</span>
    </span>
  );
}

export function StatusLegend() {
  return <div className="flex flex-wrap gap-2" aria-label="Product status treatments">{statusValues.map(status => <StatusBadge key={status} status={status} />)}</div>;
}

export const statusFallbackIcons = { pending: CircleDashed, alert: CircleAlert };
