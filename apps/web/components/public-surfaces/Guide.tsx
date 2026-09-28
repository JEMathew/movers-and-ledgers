import NextLink from "next/link";
import { Compass, Gamepad2, ShieldCheck, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, Badge, Card, Link } from "@/components/ui";
import { Surface } from "./Surface";
import { phases } from "./content";

export const guideSections = [
  { id: "what-is-movebooks", title: "What is MoveBooks AI?" },
  { id: "start-here", title: "Start here" },
  { id: "journey", title: "The five-stage journey" },
  { id: "approvals", title: "Approvals and human control" },
  { id: "recovery", title: "Recovering from issues" },
  { id: "reconsideration", title: "Reconsidering a decision" },
  { id: "simulator", title: "Simulator" },
  { id: "play", title: "Play" },
  { id: "try-your-data", title: "Try Your Data" },
  { id: "trust", title: "Trust & evidence" },
  { id: "support-feedback", title: "Support and feedback" },
  { id: "limitations", title: "Beta limitations and data guidance" },
] as const;
type SectionId = (typeof guideSections)[number]["id"];

const startPaths = [
  { Icon: Gamepad2, title: "Just curious", copy: "Try three quick decisions in Play. About five minutes, no sign-in, nothing saved.", cta: "Open Play", href: "/play" },
  { Icon: Compass, title: "See the real workflow", copy: "Rehearse the full journey with Harbor Light Books, a synthetic sample business.", cta: "Open Simulator", href: "/simulator" },
  { Icon: Upload, title: "Check a test export", copy: "Validate a de-identified test package, then continue in the same governed journey.", cta: "Try Your Data", href: "/try-your-data" },
];

const stageActions = [
  "Start discovery and review what was found, with the evidence behind each finding. Nothing moves yet.",
  "Review the migration plan and each proposed mapping. Approve, reject or stop.",
  "Records move in batches. If a batch fails, work pauses and you decide on the proposed remedy.",
  "Rules reconcile counts, balances and relationships. You review the business setup.",
  "Complete onboarding, then approve a first real task — a synthetic invoice — that is verified end to end.",
];

const roles = [
  ["Rules verify", "Check counts, balances and relationships. A failed check blocks progress."],
  ["AI predicts", "Suggests mappings and flags likely issues, with confidence you should question."],
  ["GenAI reasons", "Explains findings and proposed remedies in plain language."],
  ["Agents orchestrate and act", "Run discovery, batches and permitted retries within the workflow's controls."],
  ["Humans govern", "Approve, reject or stop consequential decisions. Every decision is attributable."],
] as const;

function Section({ id, children }: { id: SectionId; children: ReactNode }) {
  const index = guideSections.findIndex(section => section.id === id);
  return <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-8 border-t border-token pt-8 first:border-t-0 first:pt-0"><p className="eyebrow text-muted">{String.fromCharCode(65 + index)}</p><h2 id={`${id}-heading`} className="type-section mt-2">{guideSections[index].title}</h2><div className="mt-5 space-y-5 leading-7">{children}</div></section>;
}

function More({ summary, children }: { summary: string; children: ReactNode }) {
  return <details className="card p-5"><summary className="cursor-pointer py-1 font-semibold text-primary">{summary}</summary><div className="mt-3 space-y-2 text-sm leading-6 text-secondary">{children}</div></details>;
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-2 pl-5 text-secondary marker:text-[var(--primary)]">{items.map(item => <li key={item}>{item}</li>)}</ul>;
}

function Next({ links }: { links: [string, string][] }) {
  return <p className="flex flex-wrap gap-3">{links.map(([label, href], i) => <NextLink key={href} className={`button small ${i ? "secondary" : ""}`} href={href}>{label}</NextLink>)}</p>;
}

export function Guide() {
  return <Surface eyebrow="User Guide" title="Your guide to a verified move." intro="Everything a first-time user needs for Beta V1.0, in about ten minutes. Skim the headings, open the details when you want more.">
    <div className="grid items-start gap-10 lg:grid-cols-[15rem_1fr]">
      <nav aria-label="User guide contents" className="panel p-5 lg:sticky lg:top-6"><h2 className="type-label text-muted">Contents</h2><ol className="mt-3 grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-1">{guideSections.map((section, i) => <li key={section.id}><a className="flex min-h-9 items-center gap-2 rounded-md px-2 font-semibold hover:bg-[var(--surface-subtle)]" href={`#${section.id}`}><span aria-hidden="true" className="w-4 text-muted">{String.fromCharCode(65 + i)}</span>{section.title}</a></li>)}</ol></nav>
      <div className="min-w-0 space-y-12">

        <Section id="what-is-movebooks">
          <p className="text-lg">MoveBooks AI guides a business through moving its accounting books to a new system — and proves the business can actually work afterward.</p>
          <p className="text-secondary">It is for business owners, bookkeepers and accountants who want a move they can inspect, not a black box. Agents do the coordination. Rules check the numbers. You make the consequential decisions.</p>
          <Card className="flex items-start gap-3"><ShieldCheck aria-hidden="true" className="mt-1 shrink-0 text-primary" size={22}/><div><p className="font-bold">Outcome: Business Ready · Verified</p><p className="mt-1 text-sm text-secondary">Required checks pass and a first real task is completed with verified evidence. Formally: <strong>Verified First Productive Use</strong>. Moving records alone is never counted as success.</p></div></Card>
        </Section>

        <Section id="start-here">
          <p className="text-secondary">Pick the path that fits how much time you have.</p>
          <ol className="grid gap-4 md:grid-cols-3">{startPaths.map(({ Icon, title, copy, cta, href }) => <li key={href} className="card flex flex-col p-5"><Icon aria-hidden="true" className="text-primary" size={22}/><h3 className="type-card mt-4">{title}</h3><p className="mt-2 flex-1 text-sm text-secondary">{copy}</p><Link className="mt-4" href={href}>{cta} <span aria-hidden="true">→</span></Link></li>)}</ol>
          <p className="text-sm text-muted">Workflow pages use local demo access in this Beta. Opening a page never approves anything; your decisions control progress.</p>
        </Section>

        <Section id="journey">
          <p className="text-secondary">One journey, five stages. Each stage must be satisfied before the next one unlocks.</p>
          <ol className="space-y-3">{phases.map((phase, i) => <li key={phase.name} className="card grid gap-3 p-5 sm:grid-cols-[2.5rem_1fr]"><span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl border border-token font-bold text-primary">{i + 1}</span><div><h3 className="type-card">{phase.name} <span className="text-sm font-normal text-muted">· {phase.detail}</span></h3><p className="mt-1 text-sm text-secondary"><span className="font-semibold text-[var(--foreground)]">You: </span>{stageActions[i]}</p><Link className="mt-2 inline-block text-sm" href={`/learn#${phase.topic}`}>Learn more about {phase.name}</Link></div></li>)}</ol>
          <p className="text-sm text-muted">During any stage, the help bar at the bottom of the page links to Learn, Trust and contextual Support for that step.</p>
        </Section>

        <Section id="approvals">
          <p className="text-secondary">Anything that changes accounting meaning, access or business operations waits for a person.</p>
          <Bullets items={[
            "You approve mappings, recovery remedies, configuration, onboarding decisions and the first productive task.",
            "You can always approve, reject or stop. Rejecting is a valid, recorded decision.",
            "Each decision records who made it, when, and the evidence it was based on.",
            "An agent cannot approve its own proposal, and nothing is pre-approved when you enter a workflow.",
            "An approval can never turn a failed check into a pass.",
          ]}/>
          <h3 className="type-card">Who does what</h3>
          <dl className="grid gap-3 sm:grid-cols-2">{roles.map(([role, copy]) => <div key={role} className="card p-4"><dt className="font-bold">{role}</dt><dd className="mt-1 text-sm text-secondary">{copy}</dd></div>)}</dl>
          <More summary="How AI is used in this Beta"><p>Recommendations and explanations currently come from versioned, policy-based suggestions — no live model is active. Treat confidence as a statement of uncertainty, not a guarantee or permission to act.</p><p>Financial truth is deterministic: the same inputs and rule versions always give the same result.</p></More>
          <Next links={[["Why approvals matter", "/learn#approvals"], ["What confidence means", "/learn#confidence"]]}/>
        </Section>

        <Section id="recovery">
          <p className="text-secondary">Problems are expected. The workflow is designed to stop safely rather than push through.</p>
          <ol className="grid gap-3 sm:grid-cols-2">{[
            ["Pause", "A failed batch stops the move at a safe boundary. The failure and its evidence are shown."],
            ["Keep what worked", "Completed batches are saved as checkpoints. They are not redone."],
            ["Decide", "Review the root cause and the proposed remedy, then approve or reject it."],
            ["Retry", "Retry failed batch appears only after the required decision. It resumes from the failed batch."],
          ].map(([title, copy], i) => <li key={title} className="card p-4"><p className="font-bold"><span className="text-primary">{i + 1}.</span> {title}</p><p className="mt-1 text-sm text-secondary">{copy}</p></li>)}</ol>
          <p className="text-secondary">If Verify finds a mismatch, it blocks progress until a permitted repair is made and the checks are rerun.</p>
          <More summary="Technical detail: retries and checkpoints"><p>Each batch has a retry limit. Retries are governed, so a remedy must be decided before retry is enabled.</p><p>The first productive task resumes from its own posting checkpoint with the original request key, so an invoice is never posted twice.</p><p>This Beta keeps sessions in local memory. If the local API restarts, synthetic work expires — start a new session.</p></More>
          <Next links={[["Get help with a blocker", "/support"], ["What happens when migration fails", "/learn#recovery"]]}/>
        </Section>

        <Section id="reconsideration">
          <p className="text-secondary">Changed your mind about a rejected mapping? You can ask for it to be reconsidered — without rewriting history.</p>
          <Bullets items={[
            "On a rejected mapping, choose Request reconsideration and give a reason.",
            "The original rejection, its reason and evidence stay on record alongside your request.",
            "The request itself approves nothing and does not allow migration to continue.",
            "A separate, explicit review then approves or rejects the reconsideration. Only the workspace owner can request or review.",
          ]}/>
          <Alert tone="info" title="Rolling out in Beta"><p>If a rejected mapping does not show Request reconsideration, your build does not include it yet. Tell us through Feedback if you need it.</p></Alert>
        </Section>

        <Section id="simulator">
          <p className="text-secondary">Simulator runs the real Beta workflow with Harbor Light Books, a synthetic business with accounts, customers, suppliers, products and transactions.</p>
          <ol className="list-decimal space-y-2 pl-5 text-secondary">
            <li>Open Simulator and choose <strong className="text-[var(--foreground)]">Start Harbor Light Books</strong>.</li>
            <li>Sign in with local demo access, then start discovery yourself.</li>
            <li>Work through the five stages, making each decision. Expect a controlled duplicate-customer failure to practise recovery.</li>
            <li>You finish when the first invoice is verified: Business Ready · Verified in the synthetic environment.</li>
          </ol>
          <Next links={[["Open Simulator", "/simulator"]]}/>
        </Section>

        <Section id="play">
          <p className="text-secondary">Play is a short learning exercise: review a mapping, resolve a blocker and interpret a reconciliation result.</p>
          <Bullets items={[
            "Unsafe shortcuts show their consequence and cannot advance the exercise.",
            "Nothing reads or changes your workspace. Finishing Play is learning, not migration progress.",
          ]}/>
          <Next links={[["Open Play", "/play"]]}/>
        </Section>

        <Section id="try-your-data">
          <p className="text-secondary">Try Your Data checks a de-identified test package against a fixed template, then hands the reviewed data to the same discovery and assessment used by Simulator. All target operations stay synthetic.</p>
          <ol className="list-decimal space-y-2 pl-5 text-secondary">
            <li>Download the synthetic package template and shape your test export to match it.</li>
            <li>Add your files, confirm the local Beta notice and validate.</li>
            <li>Read the package report. Fix any action-needed items and validate again.</li>
            <li>Continue into the governed journey from Understand.</li>
          </ol>
          <Alert tone="warning" title="Test exports only"><p>Use synthetic or de-identified data. This is a local evaluation, not a secure production intake service.</p></Alert>
          <More summary="File formats and limits"><p>CSV or JSON files, or one flat ZIP. Eight required files; <code>metadata.json</code> is optional.</p><p>Up to 9 files, 1,000 rows and 256 KiB per file, 2 MiB in total. No PDFs, images, macros, binaries, folders or nested ZIPs.</p></More>
          <Next links={[["Open Try Your Data", "/try-your-data"]]}/>
        </Section>

        <Section id="trust">
          <p className="text-secondary">Trust shows what happened in your current session and why, as a snapshot you can refresh.</p>
          <div className="grid gap-3 sm:grid-cols-3">{[
            ["AI recommendation", "A suggestion to review. Not authorization."],
            ["Deterministic check", "A rule result. Only a pass lets work proceed."],
            ["Human decision", "Who decided what, when, and on which evidence."],
          ].map(([title, copy]) => <Card key={title}><Badge>{title}</Badge><p className="mt-3 text-sm text-secondary">{copy}</p></Card>)}</div>
          <Bullets items={[
            "Start with Blockers and decisions needing attention, then return to the workflow to act.",
            "Agent activity, approvals, checks and the lifecycle audit each list their latest records.",
            "An empty section means nothing is recorded yet — it is not a passed check.",
          ]}/>
          <More summary="What Trust does not show"><p>Raw financial amounts, record payloads, prompts and hidden reasoning are never displayed. Trust is read-only: it cannot approve, retry or repair anything.</p></More>
          <Next links={[["Open Trust", "/trust"], ["What evidence means", "/learn#evidence"]]}/>
        </Section>

        <Section id="support-feedback">
          <div className="grid gap-4 md:grid-cols-2">
            <Card><h3 className="type-card">Support</h3><p className="mt-2 text-sm text-secondary">Choose what you are stuck on — a blocker, an approval, a paused move, a mismatch — and get the safe next step. From any stage, use <strong>Get help with this step</strong>. Support is self-service; it cannot approve or retry for you.</p><Link className="mt-4 inline-block" href="/support">Open Support <span aria-hidden="true">→</span></Link></Card>
            <Card><h3 className="type-card">Feedback</h3><p className="mt-2 text-sm text-secondary">Share feedback, report an issue or suggest an improvement. The Beta prepares a draft on your device; nothing is sent. Review it, download it and share it through your agreed channel.</p><Link className="mt-4 inline-block" href="/feedback">Open Feedback <span aria-hidden="true">→</span></Link></Card>
          </div>
          <p className="text-sm text-muted">There is no live support team or response-time commitment in this Beta.</p>
        </Section>

        <Section id="limitations">
          <div className="grid gap-4 md:grid-cols-2">
            <Card><h3 className="type-card">What this Beta is not</h3><div className="mt-3 text-sm"><Bullets items={[
              "Not production-ready, and not a live migration to any accounting provider.",
              "Target systems, identity and invoice posting are synthetic.",
              "Sign-in is local demo access; sessions can expire when the local API restarts.",
              "AI suggestions are policy-based; no live model is active.",
              "Not accounting, tax or legal advice.",
            ]}/></div></Card>
            <Card><h3 className="type-card">Keep your data safe</h3><div className="mt-3 text-sm"><Bullets items={[
              "Use the Harbor Light sample, or synthetic or de-identified test exports.",
              "Never enter real customer names, account or tax numbers, passwords or tokens.",
              "Describe behavior in Feedback, not business records.",
            ]}/></div></Card>
          </div>
          <p className="text-sm text-muted">MoveBooks AI is independent and provider-neutral, with no affiliation with any accounting software provider.</p>
        </Section>

      </div>
    </div>
  </Surface>;
}
