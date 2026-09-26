"use client";

import { useId } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

import { cn } from "./utils";

type FieldProps = { label: string; hint?: string; error?: string };

export function Input({ label, hint, error, className, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const inputId = id ?? generated;
  const helpId = `${inputId}-help`;
  return <label className="field-label" htmlFor={inputId}><span>{label}</span><input id={inputId} className={cn("field-control", error && "field-error", className)} aria-describedby={(hint || error) ? helpId : undefined} aria-invalid={Boolean(error)} {...props}/>{(hint || error) && <span id={helpId} className={error ? "field-error-text" : "field-hint"}>{error ?? hint}</span>}</label>;
}

export function Select({ label, hint, children, className, id, ...props }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const generated = useId();
  const inputId = id ?? generated;
  const helpId = `${inputId}-help`;
  return <label className="field-label" htmlFor={inputId}><span>{label}</span><select id={inputId} className={cn("field-control", className)} aria-describedby={hint ? helpId : undefined} {...props}>{children}</select>{hint && <span id={helpId} className="field-hint">{hint}</span>}</label>;
}

export function Checkbox({ label, description, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return <label className="choice-control"><input type="checkbox" {...props}/><span><strong>{label}</strong>{description && <small>{description}</small>}</span></label>;
}

export function Radio({ label, description, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return <label className="choice-control"><input type="radio" {...props}/><span><strong>{label}</strong>{description && <small>{description}</small>}</span></label>;
}

export function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} disabled={disabled} className="toggle-control" onClick={() => onChange(!checked)}><span aria-hidden="true" className="toggle-track"><span className="toggle-thumb" /></span><span>{label}</span></button>;
}
