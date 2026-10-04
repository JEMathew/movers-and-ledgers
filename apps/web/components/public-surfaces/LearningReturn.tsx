"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { withSession } from "@/components/journey/journey";
import { safeContext, type SafeContext } from "./context";
import { phases } from "./content";
import { isSessionId, SELECTED_SESSION_KEY } from "./session";

// Context is a navigation hint only. The destination still enforces ownership
// and lifecycle checks; reading a lesson cannot advance a migration.
export function LearningReturn() {
  const [context, setContext] = useState<SafeContext>({});
  useEffect(() => setContext(safeContext(new URLSearchParams(window.location.search))), []);
  const phase = context.stage === undefined ? undefined : phases[Number(context.stage)];
  return <div><Link className="button" href={context.session && phase ? `${phase.route}?session=${context.session}` : withSession("/workspace", context.session)}>
    {context.session && phase ? `Return to ${phase.name}` : "Go to My Migration"}
  </Link><p className="mt-3 text-sm text-muted">Learning does not change migration progress. Review decisions in the migration itself.</p></div>;
}

/** Operational journey step for each explanatory phase. */
const stepLabels = ["Assess", "Plan", "Migrate", "Validate", "Start Using"] as const;

/** A Learn topic's way back to work: the matching journey step of the customer's migration,
 *  or My Migration when no migration is selected. Never the marketing Product page. */
export function LearnTopicLink({ phase }: { phase: number }) {
  const [session, setSession] = useState<string>();
  useEffect(() => {
    let stored: string | null = null;
    try { stored = sessionStorage.getItem(SELECTED_SESSION_KEY); } catch { /* storage unavailable */ }
    setSession(safeContext(new URLSearchParams(window.location.search)).session ?? (stored && isSessionId(stored) ? stored : undefined));
  }, []);
  const label = stepLabels[phase];
  return <Link className="button secondary small mt-5" href={session ? withSession(phases[phase].route, session) : "/workspace"}>
    {session ? `Open ${label} in Your Migration` : "Open My Migration"}
  </Link>;
}
