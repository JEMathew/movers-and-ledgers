import { OnboardFpuExperience } from "@/components/onboard-fpu/OnboardFpuExperience";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Start: your first invoice" };

export default function OnboardFpuPage() { return <OnboardFpuExperience />; }
