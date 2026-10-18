import type { Metadata } from "next";

import { DiscoverAssessExperience } from "@/components/discover-assess/DiscoverAssessExperience";

export const metadata: Metadata = {
  title: "Understand: check readiness",
  description: "Run deterministic discovery and readiness checks against synthetic accounting data.",
};

export default function AssessPage() {
  return <DiscoverAssessExperience />;
}
