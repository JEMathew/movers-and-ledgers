import { Feedback } from "@/components/public-surfaces/Feedback";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Send feedback" };
export default function Page() { return <Feedback/>; }
