import type { Metadata } from "next";
import { PolicyDocument } from "@/components/policies/PolicyDocument";

export const metadata: Metadata = { title: "Terms of Use" };
export default function Page() { return <PolicyDocument kind="terms"/>; }
