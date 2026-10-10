"use client";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { phases } from "./content";
import { isSessionId } from "./session";
import { phaseHelp } from "./help-content";
import { ReasoningAdvice } from "./ReasoningAdvice";
export function WorkflowHelp() {
  const path = usePathname();
  const phase = phases.findIndex(p => p.route === path);
  if (phase < 0) return null;
  function attachCurrentSession(event: MouseEvent<HTMLAnchorElement>) {
    // Read at navigation time: creating another assessment changes the query
    // without remounting the shared layout. Never keep a previous session ID.
    const id = new URLSearchParams(window.location.search).get("session") ?? sessionStorage.getItem("movebooks-migration-session") ?? "";
    const target = new URL(event.currentTarget.href);
    target.searchParams.delete("session");
    if (isSessionId(id)) target.searchParams.set("session", id);
    event.currentTarget.href = target.toString();
  }
  return <aside className="shell mt-6" aria-label="Help for this workflow"><details className="public-disclosure"><summary>Help for {phases[phase].name}</summary><div className="public-detail"><p>{phaseHelp[phase].text}</p><nav className="flex flex-wrap gap-3" aria-label="Contextual help"><a className="public-text-link" href={`/guide#${phaseHelp[phase].guide}`}>Task instructions</a><a className="button secondary small" href={`/learn?stage=${phase}#${phases[phase].topic}`} onClick={attachCurrentSession}>Learn About {phases[phase].name}</a><a className="button secondary small" href="/trust?view=evidence" onClick={attachCurrentSession}>Evidence & Results</a><a className="button secondary small" href={`/support?stage=${phase}`} onClick={attachCurrentSession}>Get Help with This Step</a></nav></div></details><details className="evidence-disclosure mt-4"><summary>Optional agent guidance · advisory only</summary><ReasoningAdvice key={path} path={path}/></details></aside>;
}
