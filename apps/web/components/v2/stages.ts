import { phases } from "../public-surfaces/content";
import { JOURNEY_COMPLETE, phaseIndexFor } from "../journey/journey";

/** The one five-stage model: Understand → Prepare → Move → Verify → Start (names from the existing phases). */
export const V2_STAGE_NAMES = phases.map((phase) => phase.name);

export type V2StageStatus = "done" | "current" | "locked";
export type V2Stage = { name: string; status: V2StageStatus; detail: string };

const DETAIL: Record<V2StageStatus, string> = { done: "Done", current: "Now", locked: "Locked" };

/** Stage bar items for an operational step from the API workflow status. Display only. */
export function v2Stages(current: number | null, status?: string | null, currentDetail?: string): V2Stage[] | null {
  const phase = phaseIndexFor(current, status);
  if (phase === null) return null;
  const allDone = current !== null && current >= JOURNEY_COMPLETE;
  return V2_STAGE_NAMES.map((name, index) => {
    const stageStatus: V2StageStatus = allDone || index < phase ? "done" : index === phase ? "current" : "locked";
    return { name, status: stageStatus, detail: stageStatus === "current" && currentDetail ? currentDetail : DETAIL[stageStatus] };
  });
}
