import Link from "next/link";
import { LearnTopicLink, LearningReturn } from "@/components/public-surfaces/LearningReturn";
import { Surface } from "@/components/public-surfaces/Surface";
import { topics } from "@/components/public-surfaces/content";
export default function Learn() {
  return <Surface eyebrow="Learn" title="Understand the decision in front of you." intro="Short explanations for a safer move. Explore a topic, ask the right question, then return to the working Beta."><LearningReturn/><p className="text-secondary">New to MoveBooks AI? <Link className="font-semibold text-primary underline" href="/guide">Read the User Guide</Link> for a step-by-step introduction.</p><nav aria-label="Learning topics" className="flex flex-wrap gap-3">{topics.map(topic => <Link className="button secondary small" key={topic.id} href={`#${topic.id}`}>{topic.title}</Link>)}</nav><div className="grid items-start gap-4 md:grid-cols-2">{topics.map(topic => <details id={topic.id} className="card scroll-mt-8 p-5" key={topic.id}><summary className="cursor-pointer py-2 font-bold">{topic.title}</summary><p className="mt-4 leading-7 text-secondary">{topic.body}</p><p className="mt-4 font-semibold">Ask: {topic.question}</p><LearnTopicLink phase={topic.phase} /></details>)}</div><p className="text-sm text-muted">Educational information, not accounting, tax or legal advice.</p></Surface>;
}
