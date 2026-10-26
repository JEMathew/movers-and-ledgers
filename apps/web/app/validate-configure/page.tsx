import { ValidateConfigureExperience } from "@/components/validate-configure/ValidateConfigureExperience";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verify: checks and settings" };

export default function ValidateConfigurePage() {
  return <ValidateConfigureExperience />;
}
