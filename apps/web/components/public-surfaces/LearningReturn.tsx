"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { safeContext, type SafeContext } from "./context";
import { phases } from "./content";

// Context is a navigation hint only. The destination still enforces ownership
// and lifecycle checks; reading a lesson cannot advance a migration.
export function LearningReturn() {
  const [context, setContext] = useState<SafeContext>({});
  useEffect(() => setContext(safeContext(new URLSearchParams(window.location.search))), []);
  const phase = context.stage === undefined ? undefined : phases[Number(context.stage)];
  return <div><Link className="button" href={context.session && phase ? `${phase.route}?session=${context.session}` : "/workspace"}>
    {context.session && phase ? `Return to ${phase.name.toLowerCase()}` : "Go to migration"}
  </Link><p className="mt-3 text-sm text-muted">Learning does not change migration progress. Review decisions in the migration itself.</p></div>;
}
