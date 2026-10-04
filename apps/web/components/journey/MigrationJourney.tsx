"use client";
import { Check, Circle } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/components/ui/utils";
import { JOURNEY_COMPLETE, journeySteps, type CurrentStepLabel, type HeldStep, type UnknownProgress } from "./journey";

/** Persistent operational journey: completed, current and upcoming steps, stated in text as well as colour.
 *  A held step sits before the current one but is not finished, for example a paused migration.
 *  `current` is null only while a selected migration is read or after that read failed (see
 *  journeyPosition): no step is then shown as done or current, and `unknown` says which. */
export function MigrationJourney({ current, held, currentLabel = "Current", unknown = "unavailable", className }: { current: number | null; held?: HeldStep; currentLabel?: CurrentStepLabel; unknown?: UnknownProgress; className?: string }) {
  const id = useId();
  const list = useRef<HTMLOListElement>(null);
  const known = current !== null;
  const done = known && current >= JOURNEY_COMPLETE;
  useEffect(() => {
    // On narrow screens the steps scroll sideways; keep the current step in view without moving the page.
    const el = list.current?.querySelector<HTMLElement>('[aria-current="step"]');
    if (el && list.current && list.current.scrollWidth > list.current.clientWidth) list.current.scrollLeft = el.offsetLeft - 16;
  }, [current]);
  return <section className={cn("journey", className)} aria-labelledby={`${id}-title`}>
    <div className="journey-head">
      <p id={`${id}-title`} className="font-semibold">Migration Journey</p>
      <p className="text-sm text-secondary">{!known ? (unknown === "loading" ? "Checking your progress…" : "Progress unavailable · nothing is assumed") : done ? `All ${JOURNEY_COMPLETE} steps complete` : `Step ${current + 1} of ${JOURNEY_COMPLETE} · ${journeySteps[current].label}: ${journeySteps[current].summary}`}</p>
    </div>
    <ol ref={list} className="stepper journey-steps" aria-label="Migration Journey">
      {journeySteps.map((step, index) => {
        const isHeld = known && held?.index === index && index < current;
        const complete = known && index < current && !isHeld;
        const active = index === current;
        return <li key={step.label} aria-current={active ? "step" : undefined} title={`${step.label}: ${step.summary}`} className={cn(complete && "is-complete", active && "is-active", isHeld && (held?.label === "Blocked" ? "is-blocked" : "is-held"), active && currentLabel === "Blocked" && "is-blocked", active && currentLabel === "Needs Attention" && "is-attention")}>
          <span className="step-marker" aria-hidden="true">{complete ? <Check size={15} /> : <Circle size={12} fill={active ? "currentColor" : "none"} />}</span>
          <span><strong>{step.label}</strong>{known && <small>{isHeld ? held?.label : complete ? "Completed" : active ? currentLabel : "Not Started"}</small>}</span>
        </li>;
      })}
    </ol>
  </section>;
}
