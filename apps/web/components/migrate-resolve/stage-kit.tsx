import type { ReactNode } from "react";
import { RecoveryNotice } from "@/components/v2/Workflow";
import { formatApiAmount } from "@/components/v2/primitives";

/**
 * Small presentation pieces shared by the Move, Verify and Start stage pages (workstream C).
 * They only arrange what a page already read from the API; nothing here computes a figure,
 * infers progress or enables an action.
 */

export type ChipTone = "approved" | "needs_review" | "blocked" | "rejected" | "low_risk" | "changed";

/** A status chip with page-specific wording, drawn with the shared V2 chip styles. */
export function StateChip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return <span className="v2-chip" data-state={tone}>{tone === "blocked" ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="5" width="8" height="6" rx="1" fill="currentColor" /><path d="M4 5V3.5a2 2 0 014 0V5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg> : tone === "rejected" ? <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.6" /></svg> : tone === "approved" ? <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" /></svg> : null}{children}</span>;
}

/** A read of the migration failed: what happened, what is kept, the way forward. */
export function ReadFailure({ retryHref, detail }: { retryHref: string; detail?: ReactNode }) {
  return <div role="alert" className="v2s-recovery-wrap">
    <RecoveryNotice title="Can't reach MoveBooks" action={<a className="button secondary" href={retryHref}>Try again</a>}>
      <p><strong>Nothing in your migration has changed.</strong> This page could not read the migration, so no progress is shown or assumed.</p>
      {detail ? <p>{detail}</p> : null}
    </RecoveryNotice>
  </div>;
}

/** An action was refused or did not finish: the server's reason, what is kept, the way forward. */
export function ActionFailure({ message, retryHref, kept = "Your earlier decisions and completed work are kept." }: { message: string; retryHref: string; kept?: ReactNode }) {
  return <div role="alert" className="v2s-recovery-wrap">
    <RecoveryNotice title="That step was not completed" action={<a className="button secondary" href={retryHref}>Read the migration again</a>}>
      <p>{message}</p>
      <p>{kept} Nothing new is assumed; read the current evidence before deciding again.</p>
    </RecoveryNotice>
  </div>;
}

/** Label and value rows inside a side card. */
export function Facts({ rows, label }: { rows: { label: ReactNode; value: ReactNode; tone?: "ok" | "review" | "blocked" }[]; label?: string }) {
  return <dl className="v2s-facts" aria-label={label}>
    {rows.map((row, index) => <div key={index}><dt>{row.label}</dt><dd data-tone={row.tone}>{row.value}</dd></div>)}
  </dl>;
}

/** "account_mapping_specialist" → "Account mapping specialist". Display only. */
export function sentence(value: string) {
  const text = value.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type CheckLike = { id: string; label: string; status: string; difference?: string | null };

/** The trial balance check of a validation report, found by its rule id (label as a fallback). */
export function trialBalanceCheck<T extends CheckLike>(checks?: readonly T[] | null): T | undefined {
  return checks?.find(check => check.id === "trial-balance") ?? checks?.find(check => /^trial balance/i.test(check.label));
}

/**
 * The trial balance difference as the API reports it. A decimal string is formatted with the report
 * currency; a non-numeric report value ("None", "Mismatch") is shown in the API's own words; a missing
 * check or field reads "Not available". Never computed and never defaulted to zero.
 */
export function differenceText(check: CheckLike | undefined, currency: string): { text: string; amount: boolean } {
  const raw = typeof check?.difference === "string" ? check.difference.trim() : "";
  if (!raw) return { text: "Not available", amount: false };
  const formatted = formatApiAmount(raw, currency);
  if (formatted !== "Not available") return { text: formatted, amount: true };
  // tools/validation/checks.py reports a non-numeric comparison as "None" (no difference found) or "Mismatch".
  return { text: raw === "None" ? "No difference" : raw === "Mismatch" ? "Mismatch found" : raw, amount: false };
}

/** Record counts (count:* rules) and every other check, counted from the report's own list. */
export function checkGroups<T extends CheckLike>(checks: readonly T[]) {
  const counts = checks.filter(check => check.id.startsWith("count:"));
  const integrity = checks.filter(check => !check.id.startsWith("count:"));
  const matched = (list: readonly T[]) => list.filter(check => check.status === "VERIFIED").length;
  return {
    total: checks.length, matched: matched(checks),
    groups: [
      { name: "Record counts", checks: counts, matched: matched(counts) },
      { name: "Balances and integrity", checks: integrity, matched: matched(integrity) },
    ].filter(group => group.checks.length > 0),
  };
}

export const sessionHref =(route: string, session?: string) => session ? `${route}?session=${encodeURIComponent(session)}` : route;
export const evidenceHref = (session?: string) => session ? `/trust?view=evidence&session=${encodeURIComponent(session)}` : "/trust?view=evidence";
