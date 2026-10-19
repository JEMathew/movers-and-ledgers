"use client";

import Link from "next/link";
import { ChevronDown, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cloudIdentity } from "@/lib/identity";
import { useIdentity } from "./IdentityProvider";
import { GoogleSignIn } from "./IdentityEntry";
import { AppearanceOptions } from "./theme/AppearanceMenu";

export function AccountControls() {
  const session = useIdentity();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstAction = useRef<HTMLButtonElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const preferences = useRef<HTMLDivElement>(null);
  const id = useId();
  const settingsId = useId();
  const cloud = cloudIdentity();
  const verifying = session.hasSession && !session.identity && !session.ready;
  const accountLabel = session.identity ? `Account: ${session.identity.email}`
    : verifying ? "Account: verifying session" : session.busy ? "Account: signing out" : "Account: session not verified";
  const accountMessage = session.identity ? `Signed in as ${session.identity.email}`
    : verifying ? "Verifying your account…"
    : session.busy ? "Signing out…"
    : "Google sign-in is present, but MoveBooks could not verify your account. Sign out, then sign in again. No verified email is shown.";
  const accountKey = session.identity?.email ?? (session.hasSession ? "unverified" : null);
  const open = openFor !== null && openFor === accountKey;

  useEffect(() => {
    if (!open) return;
    firstAction.current?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpenFor(null);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (!settingsOpen) return;
    const panel = preferences.current;
    // A radio group takes focus on its checked option; querySelector with a list would return the first in document order.
    (panel?.querySelector<HTMLElement>("input[type=radio]:checked") ?? panel?.querySelector<HTMLElement>("input[type=radio]"))?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !controls.current?.contains(event.target)) setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [settingsOpen]);

  function showSettings() { setOpenFor(null); setSettingsOpen(true); }
  function closeSettings() {
    setSettingsOpen(false);
    trigger.current?.focus();
  }

  return <div ref={controls} className="account-controls flex items-center gap-2">
    {/* The local demo workspace has no Google sign-in, so it offers no dead Sign in control; its
        entry is the demo workspace itself. Cloud keeps Google sign-in exactly as before. */}
    {!cloud ? null
      : session.hasSession ? <div ref={root} className="account-menu" onKeyDown={event => {
        if (event.key === "Escape" && open) { event.preventDefault(); setOpenFor(null); trigger.current?.focus(); }
      }} onBlur={event => {
        // Safari pointer clicks can blur to null before dispatching click. Keep
        // the action mounted; outside pointers and real focus exits close it.
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpenFor(null);
      }}>
        <button ref={trigger} type="button" className="button secondary small account-trigger" disabled={session.busy}
          aria-expanded={open} aria-controls={id} aria-label={accountLabel}
          onClick={() => { setSettingsOpen(false); setOpenFor(open ? null : accountKey); }}>
          <UserRound size={17} aria-hidden="true" />
          <span className="truncate" aria-live="polite">{session.identity ? "Account" : verifying ? "Verifying your account…" : session.busy ? "Signing out…" : "Session needs attention"}</span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
        {open && <div id={id} className="account-panel" aria-label="Account controls">
          <p role="status" className="mb-3 break-all text-sm text-secondary">{accountMessage}</p>
          <button ref={firstAction} type="button" className="button ghost small w-full" onClick={showSettings} aria-haspopup="dialog" aria-controls={settingsId}>Settings</button>
          <button type="button" className="button secondary small mt-2 w-full" disabled={session.busy} onClick={() => { setOpenFor(null); session.signOut(); }}>Sign Out</button>
        </div>}
      </div> : <GoogleSignIn compact />}
    {!cloud && !session.hasSession && <Link className="nav-link" href="/workspace">My Migration</Link>}
    {settingsOpen && session.hasSession && <div ref={preferences} id={settingsId} className="account-panel settings-panel" role="dialog" aria-modal="false" aria-labelledby={`${settingsId}-title`}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); closeSettings(); } }}
      onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setSettingsOpen(false); }}>
      <div className="mb-3 flex items-center justify-between gap-3"><h2 id={`${settingsId}-title`} className="font-semibold">Settings</h2><button type="button" className="button ghost small" aria-label="Close settings" onClick={closeSettings}><X size={16} aria-hidden="true" /></button></div>
      {/* Settings holds only Trust and Security and Appearance. Sign Out stays an Account action. */}
      <Link className="settings-link" href="/trust" onClick={() => setSettingsOpen(false)}><ShieldCheck size={18} aria-hidden="true" />Trust and Security</Link>
      <h3 className="settings-heading">Appearance</h3>
      <AppearanceOptions autoFocus />
    </div>}
  </div>;
}
