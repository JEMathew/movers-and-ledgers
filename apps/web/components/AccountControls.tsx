"use client";

import { ChevronDown, Settings, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState } from "react";
import { cloudIdentity } from "@/lib/identity";
import { useIdentity } from "./IdentityProvider";
import { GoogleSignIn } from "./IdentityEntry";
import { Dialog } from "./ui/dialog";

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
  const id = useId();
  const cloud = cloudIdentity();
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

  function showSettings() { setOpenFor(null); setSettingsOpen(true); }

  return <div className="account-controls flex items-center gap-2">
    <button ref={settingsTrigger} type="button" className="button ghost small" onClick={showSettings} aria-haspopup="dialog">
      <Settings size={17} aria-hidden="true" /><span>Settings</span>
    </button>
    {!cloud ? <button type="button" className="button small" disabled title="Google sign-in is not configured in this environment">Sign in with Google</button>
      : session.hasSession ? <div ref={root} className="relative" onKeyDown={event => {
        if (event.key === "Escape" && open) { event.preventDefault(); setOpenFor(null); trigger.current?.focus(); }
      }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenFor(null); }}>
        <button ref={trigger} type="button" className="button secondary small account-trigger" disabled={session.busy}
          aria-expanded={open} aria-controls={id} aria-label={session.identity ? `Account: ${session.identity.email}` : "Account: session not verified"}
          onClick={() => setOpenFor(open ? null : accountKey)}>
          <UserRound size={17} aria-hidden="true" />
          <span className="truncate">{session.identity?.email ?? (session.busy ? "Updating session…" : !session.ready ? "Verifying account…" : "Session needs attention")}</span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>
        {open && <div id={id} className="account-panel" aria-label="Account controls">
          <p className="mb-3 break-all text-sm text-secondary">{session.identity ? `Signed in as ${session.identity.email}` : "Account not verified. Sign out to clear this session."}</p>
          <button ref={firstAction} type="button" className="button ghost small w-full" onClick={showSettings}>Settings</button>
          <button type="button" className="button secondary small mt-2 w-full" disabled={session.busy} onClick={() => { setOpenFor(null); session.signOut(); }}>Sign out</button>
        </div>}
      </div> : <GoogleSignIn compact />}
    <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" description="Preferences for this browser. No workspace or financial settings are changed." fallbackFocusRef={settingsTrigger}>
      <label className="field-label grid gap-2">Theme preference
        <select className="field-control" value={mounted ? theme ?? "system" : "system"} disabled={!mounted} onChange={event => setTheme(event.target.value)}>
          <option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option>
        </select>
      </label>
      <h3 className="mt-6 font-semibold">Reduced motion</h3>
      <p className="mt-2 text-sm text-secondary">MoveBooks respects your device’s reduced-motion preference. Change it in your operating system’s accessibility settings.</p>
      <h3 className="mt-6 font-semibold">Session</h3>
      <p className="mt-2 break-all text-sm text-secondary">{!cloud ? "Google sign-in is not configured in this environment." : session.identity ? `Verified account: ${session.identity.email}` : session.hasSession ? "Your account has not been verified. No account identity is displayed." : session.ready ? "Signed out." : "Checking sign-in availability…"}</p>
    </Dialog>
  </div>;
}
