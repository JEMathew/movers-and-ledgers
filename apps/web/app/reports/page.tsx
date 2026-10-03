import { redirect } from "next/navigation";
import { isSessionReference, withSession } from "@/components/journey/journey";

// Compatibility route. Control results and reconciliation live in the session's verification step;
// without a valid session the customer lands in My Migration. No placeholder page remains.
export default async function Reports({ searchParams }: { searchParams: Promise<{ session?: string | string[] }> }) {
  const { session } = await searchParams;
  redirect(isSessionReference(session) ? withSession("/validate-configure", session) : "/workspace");
}
