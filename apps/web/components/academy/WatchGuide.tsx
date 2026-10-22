import Link from "next/link";
import { Video } from "lucide-react";
import { isPreviewEligible, type LessonId } from "@/lib/academy/catalog";
import { safeContext, contextQuery } from "@/components/public-surfaces/context";

export function WatchGuide({ lesson, session, stage, label = "Watch guide" }: { lesson: LessonId; session?: string; stage?: number; label?: string }) {
  if (!isPreviewEligible(lesson)) return null;
  const context = session || stage !== undefined ? contextQuery(safeContext(new URLSearchParams({ session: session ?? "", stage: String(stage ?? "") }))) : "";
  return <Link className="public-text-link academy-context-link" href={`/learn?tab=videos${context ? `&${context}` : ""}#lesson-${lesson}`}><Video size={15} aria-hidden="true"/>{label}</Link>;
}
