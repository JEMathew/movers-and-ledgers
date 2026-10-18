import Link from "next/link";
import { Cloud, Eye, Network, TrendingUp } from "lucide-react";
import { phases, sampleOutcome, startMigrationHref } from "@/components/public-surfaces/content";
import { ProductVision } from "@/components/public-surfaces/ProductVision";
import { AiStatusBadge, formatApiAmount } from "@/components/v2/primitives";
import { Attribution } from "@/components/v2/Attribution";

const reasons = [
  { Icon: TrendingUp, title: "Scale", copy: "Support growth without adding manual work." },
  { Icon: Cloud, title: "Access", copy: "Work securely from anywhere." },
  { Icon: Network, title: "Connect", copy: "Reduce disconnected tools and duplicate processes." },
  { Icon: Eye, title: "See clearly", copy: "Improve reporting and operational visibility." },
];

const questions = [
  ["Will all my data move correctly?", "Customers, vendors, accounts, transactions and settings need to arrive complete and usable."],
  ["Will my numbers still be right?", "Balances, totals and reconciliation must match before the move counts as a success."],
  ["Will my business be ready to operate?", "Settings, access and onboarding must work before the move is truly complete."],
];

const owners = [
  { title: "Rules check", copy: "Fixed accounting rules compare counts and balances and stop the move if anything disagrees. They give the same answer every time." },
  { title: "You approve", copy: "Every mapping, setting and invoice that changes your books waits for your decision, and each one is recorded with your name." },
];

function Tick() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="var(--primary)" strokeWidth="2" /></svg>;
}

export default function Home() {
  return <main id="main-content" className="v2-landing">
    <section className="shell v2-hero" aria-labelledby="product-heading">
      <div className="v2-hero-copy">
        <h1 id="product-heading" className="v2-hero-title">Move your books.<br />Prove every total.</h1>
        <p className="hero-value">MoveBooks checks what can move, shows you each mapping to approve, and only finishes when the old and new books agree to the cent.</p>
        <div className="hero-actions">
          <Link href={startMigrationHref} className="button v2-cta">Start a sample migration</Link>
          <Link href="/simulator" className="public-text-link">Explore the demo, no sign-in needed</Link>
        </div>
        <p className="hero-boundary">Synthetic Beta with sample books. Do not use real customer or production provider data. <Link href="/trust#beta-limitations">Beta limitations</Link></p>
        <Attribution />
      </div>
      <figure className="v2-proof" aria-labelledby="proof-caption">
        <div className="v2-proof-head"><span className="font-semibold">{sampleOutcome.company}</span><span className="v2-proof-sample">Sample result</span></div>
        <div>
          <span className="v2-proof-label">Trial balance difference, old vs new books</span>
          <span className="v2-proof-figure">{formatApiAmount(sampleOutcome.trialBalanceDifference, sampleOutcome.currency)}</span>
        </div>
        <ul className="v2-proof-checks">
          {sampleOutcome.highlights.map(check => <li key={check}><span>{check}</span><span className="v2-proof-ok"><Tick />Matches</span></li>)}
        </ul>
        <div className="v2-proof-invoice"><span className="font-semibold">First invoice posted and verified</span><span className="v2-proof-invoice-total">{formatApiAmount(sampleOutcome.firstInvoiceTotal, sampleOutcome.currency)}</span></div>
        <figcaption id="proof-caption" className="text-sm text-secondary">{sampleOutcome.checksMatched} of {sampleOutcome.checksTotal} checks matched in the sample walkthrough. Every mapping was approved by the bookkeeper.</figcaption>
      </figure>
    </section>

    <section id="how-it-works" className="v2-band" aria-labelledby="how-heading">
      <div className="shell">
        <h2 id="how-heading" className="type-section">Five stages, each with a clear owner</h2>
        <p className="mt-3 max-w-2xl text-secondary">Rules do the checking. You make the decisions. Nothing moves until you approve it.</p>
        <ol className="v2-stage-overview" aria-label="Journey overview, not live progress">
          {phases.map((phase, index) => <li key={phase.name}><span className="text-sm text-muted">{index + 1}</span><h3 className="font-bold">{phase.name}</h3><p className="text-sm font-semibold">{phase.detail}</p><p className="text-secondary">{phase.copy}</p></li>)}
        </ol>
        <p className="mt-6"><Link href="/guide" className="public-text-link">Read how it works</Link></p>
      </div>
    </section>

    <section className="shell v2-section" aria-labelledby="who-decides">
      <h2 id="who-decides" className="type-section">Who decides what</h2>
      <div className="v2-owner-grid">
        {owners.map(owner => <article key={owner.title} className={`card p-6${owner.title === "You approve" ? " v2-card-emphasis" : ""}`}><h3 className="type-card">{owner.title}</h3><p className="mt-3 text-secondary">{owner.copy}</p></article>)}
        <article className="card p-6 v2-card-planned"><div className="flex items-center justify-between gap-3"><h3 className="type-card">AI suggests</h3><AiStatusBadge /></div><p className="mt-3 text-secondary">A Gemini Advisor will explain tricky mappings when you ask, and an independent Reviewer will check them separately. Neither can change your books. Not switched on in the Beta.</p></article>
      </div>
      <p className="mt-6"><Link className="public-text-link" href="/trust">Read about controls and trust</Link></p>
    </section>

    <section className="shell v2-section" aria-labelledby="why-migrate">
      <h2 id="why-migrate" className="type-section">Why businesses migrate</h2>
      <p className="mt-3 max-w-2xl text-secondary">Outgrown systems, fragmented data, manual processes and limited visibility make everyday accounting harder to run and to scale. A move is a financial-trust problem, not a file copy.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{reasons.map(({ Icon, title, copy }) => <article key={title} className="card p-5"><Icon className="text-primary" aria-hidden="true" size={22} /><h3 className="mt-3 font-bold">{title}</h3><p className="mt-2 text-secondary">{copy}</p></article>)}</div>
      <div className="v2-questions">{questions.map(([question, context]) => <div key={question}><h3 className="font-bold">{question}</h3><p className="mt-2 text-secondary">{context}</p></div>)}</div>
      <p className="mt-6"><Link className="public-text-link" href="/learn#why-migrate">Learn about migration</Link></p>
    </section>

    <section className="shell v2-section v2-vision" aria-label="Product overview video">
      <ProductVision />
    </section>

    <section className="shell v2-section v2-boundaries" aria-label="Beta boundaries">
      <details className="home-disclosure"><summary><h2 className="type-card">Beta boundaries and architecture</h2></summary><div className="disclosure-content"><p className="text-secondary">Cloud uploads, live provider connections and managed ADK remain unavailable. Live Gemini advice requires explicit deployment configuration and is disabled by default. Production customer deployment and live support operations are not available.</p><p className="mt-3 text-secondary">Independent and provider-neutral. No affiliation with or representation of any accounting software provider.</p><Link className="public-text-link mt-3 inline-block" href="/support">Get help</Link></div></details>
    </section>

    <section className="v2-cta-band" aria-labelledby="start-heading">
      <div className="shell v2-cta-band-inner">
        <div><h2 id="start-heading" className="type-section">Try a complete move with sample books</h2><p className="mt-2">Harbor Light Books, a small sample bookshop, is ready to move. You make every decision.</p></div>
        <Link href={startMigrationHref} className="button secondary v2-cta-invert">Start a sample migration</Link>
      </div>
    </section>
  </main>;
}
