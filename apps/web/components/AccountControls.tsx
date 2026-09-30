"use client";

import { ChevronDown, Settings, UserRound, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState } from "react";
import { cloudIdentity } from "@/lib/identity";
import { useIdentity } from "./IdentityProvider";
import { GoogleSignIn } from "./IdentityEntry";

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
  const themeControl = useRef<HTMLSelectElement>(null);
  const id = useId();
  const settingsId = useId();
  const cloud = cloudIdentity();
  const verifying = session.hasSession && !session.identity && !session.ready;
  const accountLabel = session.identity ? `Account: ${session.identity.email}`
    : session.busy ? "Account: updating session" : verifying ? "Account: verifying session" : "Account: session not verified";
  const accountMessage = session.identity ? `Signed in as ${session.identity.email}`
    : session.busy ? "Updating your session…"
    : verifying ? "Verifying your account with MoveBooks. This can take up to a minute when the Beta starts."
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
    themeControl.current?.focus();
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
    {!session.hasSession && <button ref={settingsTrigger} type="button" className="button ghost small" onClick={() => settingsOpen ? closeSettings() : showSettings()} aria-haspopup="dialog" aria-expanded={settingsOpen} aria-controls={settingsId}>
      <Settings size={17} aria-hidden="true" /><span>Settings</span>
    </button>}
    {!cloud ? <button type="button" className="button small" disabled title="Google sign-in is not configured in this environment">Sign in with Google</button>
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
          <span className="truncate">{session.identity?.email ?? (session.busy ? "Updating session…" : !session.ready ? "Verifying account…" : "Session needs attention")}</span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
        {open && <div id={id} className="account-panel" aria-label="Account controls">
          <p role="status" className="mb-3 break-all text-sm text-secondary">{accountMessage}</p>
          <button ref={firstAction} type="button" className="button ghost small w-full" onClick={showSettings} aria-haspopup="dialog" aria-controls={settingsId}>Settings</button>
          <button type="button" className="button secondary small mt-2 w-full" disabled={session.busy} onClick={() => { setOpenFor(null); session.signOut(); }}>Sign out</button>
        </div>}
      </div> : <GoogleSignIn compact />}
    {settingsOpen && <div ref={preferences} id={settingsId} className="account-panel settings-panel" role="dialog" aria-modal="false" aria-labelledby={`${settingsId}-title`}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); closeSettings(); } }}
      onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setSettingsOpen(false); }}>
      <div className="mb-3 flex items-center justify-between gap-3"><h2 id={`${settingsId}-title`} className="font-semibold">Settings</h2><button type="button" className="button ghost small" aria-label="Close settings" onClick={closeSettings}><X size={16} aria-hidden="true" /></button></div>
      <label className="field-label grid gap-2">Theme preference
        <select ref={themeControl} className="field-control" value={mounted ? theme ?? "system" : "system"} disabled={!mounted} onChange={event => setTheme(event.target.value)}>
          <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
        </select>
      </label>
      <h3 className="mt-4 text-sm font-semibold">Reduced motion</h3>
      <p className="mt-2 text-sm text-secondary">MoveBooks respects your device’s reduced-motion preference. Change it in your operating system’s accessibility settings.</p>
    </div>}
  </div>;
}
