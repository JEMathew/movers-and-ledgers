export const academyGroups = ["Getting Started", "Migration Journey", "Gemini AI", "Trust & Help"] as const;
export type LessonId = "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09";
export type AcademyMedia = { src: string; poster: string; captions?: string; durationSeconds: number; reviewOnly?: boolean };
export type Lesson = {
  id: LessonId; title: string; group: typeof academyGroups[number]; duration: string;
  description: string; sourceStatus: "completed" | "review-cut";
};
// Durations are the owner's inventory, not measurements. A validated media manifest overrides them.
export const lessons: readonly Lesson[] = [
  { id: "01", title: "Getting Started", group: "Getting Started", duration: "1:28", sourceStatus: "completed", description: "Find your way around the demo and take your first step with synthetic books." },
  { id: "02", title: "Understand Your Migration", group: "Migration Journey", duration: "1:10", sourceStatus: "completed", description: "Read the migration scope, source evidence and items that need attention." },
  { id: "03", title: "Prepare and Approve", group: "Migration Journey", duration: "1:34", sourceStatus: "completed", description: "Review mappings and make informed decisions before your books move." },
  { id: "04", title: "Gemini Advisor", group: "Gemini AI", duration: "1:46", sourceStatus: "review-cut", description: "Understand AI suggestions, their evidence and the decisions that stay yours." },
  { id: "05", title: "Independent Gemini Reviewer", group: "Gemini AI", duration: "1:43", sourceStatus: "review-cut", description: "See how independent review checks advice without replacing financial controls." },
  { id: "06", title: "Move and Verify", group: "Migration Journey", duration: "1:31", sourceStatus: "completed", description: "Follow migration checkpoints, resolve blockers and inspect reconciliation." },
  { id: "07", title: "First Productive Use", group: "Migration Journey", duration: "1:30", sourceStatus: "completed", description: "Complete your first synthetic task and check the evidence of readiness." },
  { id: "08", title: "Trust and Troubleshooting", group: "Trust & Help", duration: "1:30", sourceStatus: "completed", description: "Understand safeguards, find evidence and return safely to a paused task." },
  { id: "09", title: "Three-Minute Journey", group: "Getting Started", duration: "2:58", sourceStatus: "review-cut", description: "A guided overview from understanding your books to verified first use." },
];
export type AcademyManifest = Partial<Record<LessonId, AcademyMedia>>;
export function isPreviewEligible(id: string): id is LessonId {
  return lessons.some(lesson => lesson.id === id && lesson.sourceStatus === "completed");
}
export function measuredDuration(seconds: number) {
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}
