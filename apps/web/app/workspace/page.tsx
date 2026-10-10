import { WorkspaceEntry } from "@/components/WorkspaceEntry";
export default async function Page({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams;
  return <WorkspaceEntry reference={session}/>;
}
