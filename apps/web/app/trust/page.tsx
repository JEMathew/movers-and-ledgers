import { Trust } from "@/components/public-surfaces/Trust";
export default async function Page({ searchParams }: { searchParams: Promise<{ session?: string | string[]; view?: string | string[] }> }) {
  const query = await searchParams;
  // Explicit mode follows URL navigation, including same-page public/evidence transitions.
  const session = Array.isArray(query.session) ? query.session[0] : query.session;
  return <Trust evidenceMode={query.session !== undefined || query.view === "evidence"} session={session}/>;
}
