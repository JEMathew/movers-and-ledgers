import { Bot, CheckCircle2, CircleAlert, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { Button } from "./primitives";
import { cn } from "./utils";

type AlertTone = "success" | "warning" | "error" | "info";
const alertIcons = { success: CheckCircle2, warning: TriangleAlert, error: CircleAlert, info: Info };

export function Alert({ tone = "info", title, children }: { tone?: AlertTone; title: string; children: ReactNode }) {
  const Icon = alertIcons[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={cn("alert", `alert-${tone}`)}><Icon aria-hidden="true" size={20}/><div><strong>{title}</strong><div>{children}</div></div></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Bot aria-hidden="true" size={24}/></div><h3 className="type-card">{title}</h3><p className="type-body-secondary">{description}</p>{action ?? <Button variant="secondary" size="small">Explore options</Button>}</div>;
}

export function LoadingState({ label = "Analyzing migration data" }: { label?: string }) {
  return <div role="status" className="inline-flex items-center gap-2 text-sm text-secondary"><LoaderCircle aria-hidden="true" size={18} className="motion-spin"/><span>{label}</span></div>;
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("skeleton motion-pulse", className)} {...props}/>;
}
