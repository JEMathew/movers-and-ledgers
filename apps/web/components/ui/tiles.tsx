import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type TileTone = "success" | "warning" | "neutral";
const StatusIcon = { success: CheckCircle2, warning: AlertTriangle, neutral: CircleDashed } as const;

/** A compact figure with a visible text status; colour and icon never carry the meaning alone. */
export function Tile({ icon: Icon, label, value, status, tone = "neutral" }: { icon: LucideIcon; label: string; value: ReactNode; status: string; tone?: TileTone }) {
  const Status = StatusIcon[tone];
  return <div className="tile" data-tone={tone}>
    <dt><span className="tile-icon" aria-hidden="true"><Icon size={20}/></span><span className="tile-label">{label}</span></dt>
    <dd className="tile-value">{value}</dd>
    <dd className="tile-status"><Status size={14} aria-hidden="true"/>{status}</dd>
  </div>;
}

export function Tiles({ label, children }: { label: string; children: ReactNode }) {
  return <dl className="tiles" aria-label={label}>{children}</dl>;
}
