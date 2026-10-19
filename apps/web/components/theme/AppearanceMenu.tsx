"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useId, useRef, useState } from "react";

const choices = [
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
] as const;

/** The one shared appearance preference: Dark, Light or System. next-themes stores it and applies it before paint. */
export function AppearanceOptions({ autoFocus = false }: { autoFocus?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const name = useId();
  const group = useRef<HTMLFieldSetElement>(null);
  useEffect(() => setMounted(true), []);
  // A radio group takes focus on its checked option.
  useEffect(() => { if (mounted && autoFocus) group.current?.querySelector<HTMLInputElement>("input:checked")?.focus(); }, [mounted, autoFocus]);
  const current = mounted ? theme ?? "dark" : undefined;
  return <fieldset ref={group} className="appearance-options">
    <legend className="sr-only">Appearance</legend>
    {choices.map(({ value, label, Icon }) => <label key={value} className="appearance-option">
      <Icon size={20} aria-hidden="true" className="appearance-option-icon" />
      <span className="appearance-option-label">{label}</span>
      <input type="radio" name={name} value={value} checked={current === value} disabled={!mounted} onChange={() => setTheme(value)} />
    </label>)}
    <p className="appearance-note">System follows your device appearance</p>
  </fieldset>;
}

/** Compact header icon that opens the appearance dropdown. Available before and after sign-in. */
export function AppearanceMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  return <div ref={root} className="appearance-menu"
    onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); close(); } }}
    onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="appearance-trigger" aria-label="Change appearance" title="Change appearance"
      aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      <Sun size={20} aria-hidden="true" />
    </button>
    {open && <div id={id} className="appearance-panel" role="dialog" aria-modal="false" aria-label="Appearance">
      <AppearanceOptions autoFocus />
    </div>}
  </div>;
}
