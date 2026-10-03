import { ArrowRight } from "lucide-react";
import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "@/components/ui/utils";

/** The one dominant next-action link for a journey state. Navigation only: the destination enforces
 *  ownership, approvals and deterministic checks. A full page load lets the stage read its session. */
export function ActionLink({ label, href, onClick, className }: { label: string; href: string; onClick?: MouseEventHandler<HTMLAnchorElement>; className?: string }) {
  return <a className={cn("button", className)} href={href} onClick={onClick}>{label} <ArrowRight size={17} aria-hidden="true" /></a>;
}

/** A "Next step" panel: short context, then the single primary action. */
export function NextAction({ label, href, children, onClick, className }: { label: string; href: string; children?: ReactNode; onClick?: MouseEventHandler<HTMLAnchorElement>; className?: string }) {
  return <section className={cn("panel mt-6 p-6", className)} aria-label="Next step">
    <p className="eyebrow text-primary">Next step</p>
    {children && <div className="mt-2 max-w-2xl leading-7 text-secondary">{children}</div>}
    <ActionLink className="mt-4" label={label} href={href} onClick={onClick} />
  </section>;
}
