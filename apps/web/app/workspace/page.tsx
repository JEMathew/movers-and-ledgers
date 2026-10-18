import { WorkspaceEntry } from "@/components/WorkspaceEntry";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My migration" };
export default async function Page({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams;
  return <WorkspaceEntry reference={session}/>;
}
