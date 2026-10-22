import "server-only";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { isPreviewEligible, lessons, type AcademyManifest } from "./catalog";

// Publication is deliberately closed. Add reviewed HTTPS CDN locations here only after owner approval.
const publishedMedia: AcademyManifest = {};
export async function previewFile(id: string, extension: string): Promise<string | undefined> {
  const root = process.env.MOVEBOOKS_ACADEMY_MEDIA_DIR;
  if (process.env.NODE_ENV !== "development" || !root || !path.isAbsolute(root) || !isPreviewEligible(id) || !["mp4", "vtt", "jpg"].includes(extension)) return;
  try {
    const resolvedRoot = await realpath(root);
    const filename = await realpath(path.join(root, `${id}.${extension}`));
    if (path.dirname(filename) !== resolvedRoot) return;
    return filename;
  } catch { return; }
}
export async function academyMedia(): Promise<AcademyManifest> {
  const result: AcademyManifest = { ...publishedMedia };
  const root = process.env.MOVEBOOKS_ACADEMY_MEDIA_DIR;
  if (process.env.NODE_ENV !== "development" || !root || !path.isAbsolute(root)) return result;
  try {
    const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
    for (const lesson of lessons) {
      const entry = manifest[lesson.id];
      const reviewOnly = process.env.MOVEBOOKS_ACADEMY_REVIEW_PREVIEW === "1" && entry?.reviewPreviewAllowed === true;
      if (!isPreviewEligible(lesson.id) || (!reviewOnly && entry?.previewApproved !== true) || entry?.technicalChecksPassed !== true || !Number.isFinite(entry.durationSeconds) || entry.durationSeconds <= 0) continue;
      if (!(await Promise.all(["mp4", "jpg"].map(ext => previewFile(lesson.id, ext)))).every(Boolean)) continue;
      const captions = entry.captionsVerified === true && await previewFile(lesson.id, "vtt");
      if (!captions && !reviewOnly) continue;
      const base = `/api/academy-media/${lesson.id}`;
      result[lesson.id] = { src: `${base}/mp4`, poster: `${base}/jpg`, ...(captions ? { captions: `${base}/vtt` } : {}), durationSeconds: entry.durationSeconds, reviewOnly };
    }
  } catch { /* Missing or invalid media stays unavailable, without exposing filesystem details. */ }
  return result;
}
