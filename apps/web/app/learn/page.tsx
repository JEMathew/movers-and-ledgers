import type { Metadata } from "next";
import { LearnContent } from "@/components/academy/LearnContent";
import { academyMedia } from "@/lib/academy/media";
export const metadata: Metadata = { title: "Learn" };
export const dynamic = "force-dynamic";
export default async function Learn() {
  return <LearnContent media={await academyMedia()}/>;
}
