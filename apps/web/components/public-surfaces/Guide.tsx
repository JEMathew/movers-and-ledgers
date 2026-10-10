import NextLink from "next/link";
import type { ReactNode } from "react";
import { Surface } from "./Surface";
import { AnchoredDetails } from "./AnchoredDetails";
import { phases } from "./content";

export const guideSections = [
  { id: "what-is-movebooks", title: "What is MoveBooks AI?" },
  { id: "start-here", title: "Start here" },
  { id: "journey", title: "The five-phase journey" },
  { id: "approvals", title: "Approvals and human control" },
  { id: "recovery", title: "Recovering from issues" },
  { id: "reconsideration", title: "Reconsidering a decision" },
  { id: "simulator", title: "Explore Demo" },
  { id: "play", title: "MoveBooks Play" },
  { id: "try-your-data", title: "Local test-export evaluation" },
  { id: "trust", title: "Trust and evidence" },
  { id: "support-feedback", title: "Help and feedback" },
  { id: "limitations", title: "Beta limitations and data guidance" },
] as const;
type SectionId = (typeof guideSections)[number]["id"];
function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  return <AnchoredDetails id={id} title={guideSections.find(s => s.id === id)!.title}>{children}</AnchoredDetails>;
}
function Next({ href, children }: { href: string; children: ReactNode }) {
  return <NextLink className="public-text-link" href={href}>{children}</NextLink>;
}
export function Guide() {
  return <Surface compact eyebrow="Getting Started Guide" title="Find your next step." intro="Open the instruction you need; Learn explains concepts and Trust explains controls and boundaries." action={<NextLink className="button" href="/workspace">Try the Beta</NextLink>}>
    <section aria-label="Guide instructions">
      <Section id="what-is-movebooks"><p>Provider-neutral AI-assisted accounting migration and onboarding: agents coordinate, rules check financial facts, and people approve consequential decisions.</p><p>Outcome: Business Ready · Verified in a synthetic environment. Moving records alone is insufficient.</p><Next href="/">Product overview</Next></Section>
      <Section id="start-here"><ol><li>Explore the read-only guided Demo or try the public Play exercise.</li><li>Choose Try the Beta and sign in with Google in cloud mode.</li><li>Choose the sample and explicitly start assessment. Sign-in alone creates nothing.</li></ol><p>Local development uses demo access. Production builds without configured identity disable sign-in.</p><Next href="/simulator">Explore Demo</Next></Section>
      <Section id="journey"><ol>{phases.map((phase, i) => <li key={phase.name}><strong>{i+1}. {phase.name}:</strong> {phase.copy} <Next href={`/learn#${phase.topic}`}>Learn more about {phase.name}</Next></li>)}</ol><p>Use the help bar on each migration step for contextual Learn, evidence and Help. Stage access still follows the workflow checks.</p></Section>
      <Section id="approvals"><p>Review evidence and consequences before mappings, plan consent, remedies, settings, onboarding and first-task decisions. Approve, reject or stop in the working task. An approval cannot turn a failed check into a pass.</p><Next href="/learn#approvals">Why approvals matter</Next><Next href="/trust#financial-controls">Financial controls and accountability</Next></Section>
      <Section id="recovery"><ol><li>Read the failed batch and its evidence.</li><li>Keep completed checkpoints; review the proposed bounded remedy.</li><li>Approve or reject it. Retry the failed batch only when enabled.</li><li>For a financial mismatch, review a permitted repair and rerun verification.</li></ol><p>Resume an already posted first task from its existing checkpoint; do not repost. Cloud storage preserves synthetic progress; local sessions may expire on restart.</p><Next href="/support">Help with a blocker</Next></Section>
      <Section id="reconsideration"><p>During mapping review, before migration starts, a final rejected mapping can be reconsidered. This does not undo an executed migration.</p><ol><li>Review the mapping, enter a reason, then choose Request reconsideration.</li><li>Prior history retains the original rejection, actor, timestamp, reason and evidence. The request itself approves nothing.</li><li>The owner separately chooses Approve reconsideration or Reject reconsideration. Only the authenticated owner can request or review.</li><li>Approval records a new decision; it never overwrites the original rejection or bypasses the remaining checks. Rejection keeps the mapping blocked.</li></ol></Section>
      <Section id="simulator"><p>Explore Demo is a public, read-only five-phase walkthrough. No sign-in or workspace changes. At the end, choose Try the Guided Migration to sign in and explicitly start sample assessment in the synthetic Beta.</p><Next href="/simulator">Open Explore Demo</Next><Next href="/#product-vision">Conceptual Product Vision video</Next></Section>
      <Section id="play"><p>Practice three decisions about mappings, recovery and reconciliation. Unsafe choices cannot advance. No sign-in, saved results or changes to migration progress.</p><Next href="/play">Open Play</Next></Section>
      <Section id="try-your-data"><p>Cloud uploads are unavailable, including for signed-in users. In local development only: download the template, choose synthetic or de-identified test files, validate, fix issues, review the report, then continue to assessment.</p><p>CSV/JSON or one flat ZIP; eight required files plus optional metadata.json. Up to nine files, 1,000 rows and 256 KiB per file, 2 MiB total. No PDFs, images, macros, binaries, folders or nested ZIPs.</p><Next href="/try-your-data">Local evaluation availability and limits</Next></Section>
      <Section id="trust"><p>Public Trust explains the controls. For an owned migration, open Trust &amp; Evidence from its task to read its authorized snapshot. Inspect attention items, recorded checks and decisions, then return to the workflow to act. Empty evidence is not a pass.</p><Next href="/trust">Trust principles and boundaries</Next><Next href="/learn#evidence">What evidence means</Next></Section>
      <Section id="support-feedback"><p>Help offers self-service guidance for a blocker. Feedback prepares a local unsent draft you can review and download. There is no staffed support team, ticket submission or response-time commitment.</p><Next href="/support">Get help</Next><Next href="/feedback">Prepare unsent feedback</Next></Section>
      <Section id="limitations"><p>Use synthetic samples only in the public Beta. Never enter real customer names, financial records, account or tax numbers, passwords or tokens. Local exports must be synthetic or de-identified.</p><p>No real provider integration, production readiness or production uptime guarantee. AI advice is advisory; financial checks remain deterministic. Independent and provider-neutral, with no accounting-provider affiliation.</p><Next href="/trust#beta-limitations">Full Beta and data boundaries</Next><Next href="/trust#ai-boundaries">AI limitations and fallback</Next></Section>
    </section>
  </Surface>;
}
