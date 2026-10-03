import { redirect } from "next/navigation";
import { isSessionReference, withSession } from "@/components/journey/journey";

// Compatibility route. Decisions are made inside the migration, so send the customer to the approval
// step of their own session, or to My Migration. The destination still enforces ownership and gates.
export default async function Approvals({ searchParams }: { searchParams: Promise<{ session?: string | string[] }> }) {
  const { session } = await searchParams;
  redirect(isSessionReference(session) ? withSession("/plan-map-approve", session) : "/workspace");
}
