import type { Metadata } from "next";

import { PlanMapApproveExperience } from "@/components/plan-map-approve/PlanMapApproveExperience";

export const metadata: Metadata = {
  title: "Plan, Map & Approve · MoveBooks AI",
  description: "Build a structured migration plan and govern evidence-backed mapping decisions.",
};

export default function PlanMapApprovePage() {
  return <PlanMapApproveExperience />;
}
