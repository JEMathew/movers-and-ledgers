import { features } from "@/lib/features";
import Link from "next/link";
import { LearnTopicLink, LearningReturn } from "@/components/public-surfaces/LearningReturn";
import { Surface } from "@/components/public-surfaces/Surface";
import { AnchoredDetails } from "@/components/public-surfaces/AnchoredDetails";
import { topics } from "@/components/public-surfaces/content";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Learn" };
export default function Learn() {
  return <Surface compact eyebrow="Learn" title="Understand one decision." intro="Choose a concept, review its meaning, then return to your task." action={<LearningReturn/>}>
    <section aria-label="Learning topics">{topics.map(topic => <AnchoredDetails id={topic.id} title={topic.title} key={topic.id}><p>{topic.body}</p><p className="font-semibold">Ask: {topic.question}</p><LearnTopicLink phase={topic.phase}/></AnchoredDetails>)}</section>
    <p><Link className="public-text-link" href="/guide">Getting Started Guide</Link> for practical instructions{features.playInNavigation && <> · <Link className="public-text-link" href="/play">Practice in Play</Link></>}</p>
    <p className="text-secondary">Educational information, not accounting, tax or legal advice.</p>
  </Surface>;
}
