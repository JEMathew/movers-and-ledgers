import { MigrateResolveExperience } from "@/components/migrate-resolve/MigrateResolveExperience";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Move: move your records" };

export default function MigrateResolvePage() {
  return <MigrateResolveExperience />;
}
