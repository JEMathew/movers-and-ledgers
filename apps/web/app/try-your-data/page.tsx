import { TryYourData } from "@/components/try-your-data/TryYourData";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Check your export in this browser" };
export default function Page() { return <TryYourData/>; }
