"use client";

import Link from "next/link";
import { ChevronDown, SunMoon, UserRound, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState } from "react";
import { cloudIdentity } from "@/lib/identity";
import { useIdentity } from "./IdentityProvider";
import { GoogleSignIn } from "./IdentityEntry";
import { startMigrationHref } from "./public-surfaces/content";

const themes = [["system", "System"], ["light", "Light"], ["dark", "Dark"]] as const;

export function AccountControls() {
  const session = useIdentity();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
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

  useEffect(() => setMounted(true), []);
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
    preferences.current?.querySelector<HTMLElement>("select, input[type=radio]:checked, input[type=radio]")?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !controls.current?.contains(event.target)) setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [settingsOpen]);

  function showSettings() { setOpenFor(null); setSettingsOpen(true); }
  function closeSettings() {
    setSettingsOpen(false);
    (session.hasSession ? trigger : settingsTrigger).current?.focus();
  }

  return <div ref={controls} className="account-controls flex items-center gap-2">
    {!cloud ? <button type="button" className="button ghost small" disabled aria-label="Sign in with Google" title="Google sign-in is not configured in this environment">Sign in</button>
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
          <span className="truncate" aria-live="polite">{session.identity?.email ?? (verifying ? "Verifying your account…" : session.busy ? "Signing out…" : "Session needs attention")}</span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
        {open && <div id={id} className="account-panel" aria-label="Account controls">
          <p role="status" className="mb-3 break-all text-sm text-secondary">{accountMessage}</p>
          <button ref={firstAction} type="button" className="button ghost small w-full" onClick={showSettings} aria-haspopup="dialog" aria-controls={settingsId}>Settings</button>
          <button type="button" className="button secondary small mt-2 w-full" disabled={session.busy} onClick={() => { setOpenFor(null); session.signOut(); }}>Sign Out</button>
        </div>}
      </div> : <GoogleSignIn compact />}
    {!session.hasSession && <Link className="button small" href={startMigrationHref}>Start My Migration</Link>}
    {!session.hasSession && <button ref={settingsTrigger} type="button" className="button ghost small appearance-trigger" aria-label="Change appearance" title="Change appearance"
      onClick={() => settingsOpen ? closeSettings() : showSettings()} aria-haspopup="dialog" aria-expanded={settingsOpen} aria-controls={settingsId}>
      <SunMoon size={18} aria-hidden="true" />
    </button>}
    {settingsOpen && <div ref={preferences} id={settingsId} className="account-panel settings-panel" role="dialog" aria-modal="false" aria-labelledby={`${settingsId}-title`}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); closeSettings(); } }}
      onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setSettingsOpen(false); }}>
      <div className="mb-3 flex items-center justify-between gap-3"><h2 id={`${settingsId}-title`} className="font-semibold">{session.hasSession ? "Settings" : "Appearance"}</h2><button type="button" className="button ghost small" aria-label={session.hasSession ? "Close settings" : "Close appearance"} onClick={closeSettings}><X size={16} aria-hidden="true" /></button></div>
      {session.hasSession ? <label className="field-label grid gap-2">Theme
        <select className="field-control" value={mounted ? theme ?? "system" : "system"} disabled={!mounted} onChange={event => setTheme(event.target.value)}>
          <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
        </select>
      </label> : <fieldset className="appearance-options">
        <legend className="sr-only">Display mode</legend>
        {themes.map(([value, label]) => <label key={value} className="appearance-option">
          <input type="radio" name={`${settingsId}-appearance`} value={value} checked={mounted && (theme ?? "system") === value} disabled={!mounted} onChange={() => setTheme(value)} />
          <span>{label}</span>
        </label>)}
      </fieldset>}
    </div>}
  </div>;
}
