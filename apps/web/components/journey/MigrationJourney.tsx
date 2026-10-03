"use client";
import { Check, Circle } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/components/ui/utils";
import { JOURNEY_COMPLETE, journeySteps, type HeldStep } from "./journey";

/** Persistent operational journey: completed, current and upcoming steps, stated in text as well as colour.
 *  A held step sits before the current one but is not finished, for example a paused migration.
 *  `current` is null until an authoritative session read succeeds: no step is then shown as done or current. */
export function MigrationJourney({ current, held, className }: { current: number | null; held?: HeldStep; className?: string }) {
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
      <p id={`${id}-title`} className="font-semibold">Migration journey</p>
      <p className="text-sm text-secondary">{!known ? "Progress not confirmed · nothing is assumed" : done ? `All ${JOURNEY_COMPLETE} steps complete` : `Step ${current + 1} of ${JOURNEY_COMPLETE} · ${journeySteps[current].label}`}</p>
    </div>
    <ol ref={list} className="stepper journey-steps" aria-label="Migration journey">
      {journeySteps.map((step, index) => {
        const isHeld = known && held?.index === index && index < current;
        const complete = known && index < current && !isHeld;
        const active = index === current;
        return <li key={step.label} aria-current={active ? "step" : undefined} className={cn(complete && "is-complete", active && "is-active", isHeld && "is-held")}>
          <span className="step-marker" aria-hidden="true">{complete ? <Check size={15} /> : <Circle size={12} fill={active ? "currentColor" : "none"} />}</span>
          <span><strong>{step.label}</strong>{known && <small>{isHeld ? held?.label : complete ? "Completed" : active ? "Current" : "Upcoming"}</small>}</span>
        </li>;
      })}
    </ol>
  </section>;
}
