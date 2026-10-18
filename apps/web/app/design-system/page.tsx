import type { Metadata } from "next";
import { DesignSystemShowcase } from "@/components/DesignSystemShowcase";
import { V2ComponentSheet } from "@/components/v2/V2ComponentSheet";

export const metadata: Metadata = {
  title: "Design System · MoveBooks AI",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <><V2ComponentSheet /><DesignSystemShowcase /></>;
}
