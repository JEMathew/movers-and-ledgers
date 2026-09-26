"use client";

import { useId } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

import { cn } from "./utils";

type FieldProps = { label: string; hint?: string; error?: string };

export function Input({ label, hint, error, className, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const inputId = id ?? generated;
  const helpId = `${inputId}-help`;
  return <div className="field-label"><label htmlFor={inputId}>{label}</label><input id={inputId} className={cn("field-control", error && "field-error", className)} aria-describedby={(hint || error) ? helpId : undefined} aria-invalid={Boolean(error)} {...props}/>{(hint || error) && <span id={helpId} className={error ? "field-error-text" : "field-hint"}>{error ?? hint}</span>}</div>;
}

export function Select({ label, hint, error, children, className, id, ...props }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const generated = useId();
  const inputId = id ?? generated;
  const helpId = `${inputId}-help`;
  return <div className="field-label"><label htmlFor={inputId}>{label}</label><select id={inputId} className={cn("field-control", error && "field-error", className)} aria-describedby={(hint || error) ? helpId : undefined} aria-invalid={Boolean(error)} {...props}>{children}</select>{(hint || error) && <span id={helpId} className={error ? "field-error-text" : "field-hint"}>{error ?? hint}</span>}</div>;
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
