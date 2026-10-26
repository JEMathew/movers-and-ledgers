import type { Metadata } from "next";
import { PolicyDocument } from "@/components/policies/PolicyDocument";

export const metadata: Metadata = { title: "Privacy Policy" };
export default function Page() { return <PolicyDocument kind="privacy"/>; }
