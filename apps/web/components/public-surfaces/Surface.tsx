import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import { scope } from "./content";
export function Surface({ eyebrow, title, intro, children, sourceScope }: { eyebrow: string; title: string; intro: string; children: ReactNode; sourceScope?: string }) {
  return <main id="main-content" className="shell min-h-[70vh] py-12 sm:py-20"><header className="max-w-3xl"><p className="eyebrow text-primary">MoveBooks AI · {eyebrow}</p><h1 className="type-page mt-4">{title}</h1><p className="mt-5 text-lg leading-8 text-secondary">{intro}</p><div className="mt-5"><Badge>{sourceScope ?? "Beta · Synthetic Data"}</Badge></div><p className="mt-3 text-sm text-muted">{sourceScope ? "Local public-reference Beta. No live provider migration or production readiness claim." : scope}</p></header><div className="mt-10 space-y-10">{children}</div></main>;
}
