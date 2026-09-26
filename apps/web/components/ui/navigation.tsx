"use client";

import { Check, Circle } from "lucide-react";
import { useId, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { cn } from "./utils";

export type TabItem = { id: string; label: string; content: ReactNode };

export function Tabs({ items, defaultTab }: { items: TabItem[]; defaultTab?: string }) {
  const groupId = useId();
  const [active, setActive] = useState(defaultTab ?? items[0]?.id);
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    setActive(items[next].id);
    document.getElementById(`${groupId}-tab-${items[next].id}`)?.focus();
  };
  return <div><div role="tablist" aria-label="View options" className="tabs-list">{items.map((item, index) => <button key={item.id} id={`${groupId}-tab-${item.id}`} role="tab" type="button" aria-selected={active === item.id} aria-controls={`${groupId}-panel-${item.id}`} tabIndex={active === item.id ? 0 : -1} onClick={() => setActive(item.id)} onKeyDown={(event) => move(event, index)}>{item.label}</button>)}</div>{items.map(item => <div key={item.id} id={`${groupId}-panel-${item.id}`} role="tabpanel" aria-labelledby={`${groupId}-tab-${item.id}`} hidden={active !== item.id} className="pt-4">{item.content}</div>)}</div>;
}

export function Progress({ value, label, showValue = true }: { value: number; label: string; showValue?: boolean }) {
  const safe = Math.max(0, Math.min(100, value));
  return <div className="grid gap-2"><div className="flex justify-between gap-4 text-sm"><span className="font-semibold">{label}</span>{showValue && <span className="type-meta">{safe}%</span>}</div><div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}><div className="progress-value" style={{width: `${safe}%`}} /></div></div>;
}

export type Step = { label: string; description?: string };
export function Stepper({ steps, current }: { steps: Step[]; current: number }) {
  return <ol className="stepper" aria-label="Migration progress">{steps.map((step, index) => { const complete = index < current; const active = index === current; return <li key={step.label} aria-current={active ? "step" : undefined} className={cn(complete && "is-complete", active && "is-active")}><span className="step-marker" aria-hidden="true">{complete ? <Check size={15}/> : <Circle size={12} fill={active ? "currentColor" : "none"}/>}</span><span><strong>{step.label}</strong>{step.description && <small>{step.description}</small>}</span></li>;})}</ol>;
}
