import type { ReactNode } from "react";
import { AI_ASSISTANCE_STATUS, AI_STATUS_DETAIL, AI_STATUS_LABEL } from "./ai-status";
import { V2_STATUS_LABEL, type V2MappingStatus } from "./mapping-status";

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" aria-hidden="true">
      <rect x="3" y="4" width="8" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="15" y="4" width="8" height="18" rx="2" fill="var(--v2-accent)" />
    </svg>
  );
}

/** Companion-style guide sentence: what has happened and what is next, in plain words. */
export function GuideNote({ children }: { children: ReactNode }) {
  return <p className="v2-guide"><Mark /><span>{children}</span></p>;
}

export function StatusChip({ status }: { status: V2MappingStatus }) {
  return <span className="v2-chip" data-state={status}>{V2_STATUS_LABEL[status]}</span>;
}

export function AiStatusBadge({ withDetail = false }: { withDetail?: boolean }) {
  const label = AI_STATUS_LABEL[AI_ASSISTANCE_STATUS];
  return (
    <span className="v2-chip v2-chip-ai" data-ai-status={AI_ASSISTANCE_STATUS}>
      {withDetail ? `${label} · ${AI_STATUS_DETAIL[AI_ASSISTANCE_STATUS]}` : label}
    </span>
  );
}

/**
 * Formats an exact decimal string from the API (e.g. "107.25") for display: thousands separators only.
 * Digits are never parsed into floating point, rounded or recalculated. An empty, missing or malformed
 * value reads "Not available" and must never be shown as 0.00.
 */
export function formatApiAmount(amount: string | number | null | undefined, currency: string): string {
  const text = typeof amount === "number" ? (Number.isFinite(amount) ? String(amount) : "") : (amount ?? "").trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) return "Not available";
  const [, sign, whole, fraction = ""] = match;
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency} ${sign}${grouped}.${fraction.padEnd(2, "0")}`;
}

/**
 * A money figure as reported by the API. The value is always passed in from an API response field;
 * this component formats it and never computes or defaults an amount.
 */
export function MoneyFigure({ label, amount, currency, caption, strong = false }: {
  label: string; amount: string | number; currency: string; caption?: ReactNode; strong?: boolean;
}) {
  const formatted = formatApiAmount(amount, currency);
  return (
    <div className={`v2-card v2-money${strong ? " v2-card-strong" : ""}`}>
      <span className="v2-money-label">{label}</span>
      <span className={formatted === "Not available" ? "v2-money-missing" : "v2-money-value"}>{formatted}</span>
      {caption ? <span className="v2-money-caption">{caption}</span> : null}
    </div>
  );
}

/** The one dominant next action for a screen. Secondary detail goes in children. */
export function NextStepPanel({ title, action, children, headingLevel = 2 }: {
  title: string; action: ReactNode; children?: ReactNode; headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className="v2-card v2-card-strong" aria-label="Your next step" style={{ display: "grid", gap: 16, padding: 32 }}>
      <span className="v2-quiet" style={{ fontSize: "0.9rem" }}>Your next step</span>
      <Heading style={{ margin: 0, fontSize: "clamp(1.6rem, 3vw, 2.1rem)", lineHeight: 1.15, letterSpacing: "-0.015em" }}>{title}</Heading>
      {children}
      <div>{action}</div>
    </section>
  );
}

/** Labelled container for a scripted example of planned AI behaviour (design references, prototypes, docs). */
export function PlannedExample({ children }: { children: ReactNode }) {
  return (
    <div className="v2-example" role="note">
      <div className="v2-example-label">Example of planned behaviour. Not live model output.</div>
      <div>{children}</div>
    </div>
  );
}
