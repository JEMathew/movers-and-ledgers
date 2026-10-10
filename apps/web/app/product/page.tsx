import { redirect } from "next/navigation";
import { ProductEntry } from "@/components/public-surfaces/ProductEntry";
export default async function Page({ searchParams }: { searchParams: Promise<{ session?: string | string[] }> }) {
  const query = await searchParams;
  // Query-only, temporary alias. Never make an identity-cached permanent redirect.
  if (query.session === undefined) redirect("/");
  return <ProductEntry/>;
}
