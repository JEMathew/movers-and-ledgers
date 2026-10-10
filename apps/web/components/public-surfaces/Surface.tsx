import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import { scope } from "./content";
export function Surface({ eyebrow, title, intro, children, sourceScope, scopeNote, compact = false, action }: { eyebrow: string; title: string; intro: string; children: ReactNode; sourceScope?: string; scopeNote?: ReactNode; compact?: boolean; action?: ReactNode }) {
  return <main id="main-content" className={compact ? "shell public-content" : "shell min-h-[70vh] py-12 sm:py-20"}>
    <header className="max-w-3xl"><p className="eyebrow text-primary">MoveBooks AI · {eyebrow}</p><h1 className={`type-page ${compact ? "mt-2" : "mt-4"}`}>{title}</h1><p className={`${compact ? "mt-3 leading-7" : "mt-5 text-lg leading-8"} text-secondary`}>{intro}</p>
      <div className={compact ? "mt-3" : "mt-5"}><Badge>{sourceScope ?? (compact ? "V1.0 Bounded Synthetic Public Beta" : "Beta · Synthetic Data")}</Badge></div>
      <p className={`${compact ? "mt-2" : "mt-3 text-sm"} text-muted`}>{scopeNote ?? (compact ? "No real customer or production provider data. No live provider migration." : sourceScope ? "Public-reference Beta. No live provider migration or production readiness claim." : scope)}</p>
      {action && <div className="mt-4 flex flex-wrap items-center gap-3">{action}</div>}
    </header><div className={compact ? "public-content-body" : "mt-10 space-y-10"}>{children}</div>
  </main>;
}
