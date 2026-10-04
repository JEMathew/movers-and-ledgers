"use client";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { phases } from "./content";
import { isSessionId } from "./session";
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
  return <aside className="shell mt-10" aria-label="Help for this workflow"><nav className="panel flex flex-wrap gap-3 p-4" aria-label="Contextual help"><a className="button secondary small" href={`/learn?stage=${phase}#${phases[phase].topic}`} onClick={attachCurrentSession}>Learn About {phases[phase].name}</a><a className="button secondary small" href="/trust" onClick={attachCurrentSession}>Trust & Evidence</a><a className="button secondary small" href={`/support?stage=${phase}`} onClick={attachCurrentSession}>Get Help with This Step</a></nav><ReasoningAdvice key={path} path={path}/></aside>;
}
