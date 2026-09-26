import type { Metadata } from "next";
import { DesignSystemShowcase } from "@/components/DesignSystemShowcase";

export const metadata: Metadata = {
  title: "Design System · MoveBooks AI",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignSystemShowcase />;
}
