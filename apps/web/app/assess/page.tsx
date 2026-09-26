import type { Metadata } from "next";

import { DiscoverAssessExperience } from "@/components/discover-assess/DiscoverAssessExperience";

export const metadata: Metadata = {
  title: "Assess My Migration · MoveBooks AI",
  description: "Run deterministic discovery and readiness checks against synthetic accounting data.",
};

export default function AssessPage() {
  return <DiscoverAssessExperience />;
}
