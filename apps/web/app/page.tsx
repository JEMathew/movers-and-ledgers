import Link from "next/link";
import { ArrowRight, Check, Cloud, Eye, Network, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui";
import { phases, startMigrationHref } from "@/components/public-surfaces/content";
import { ProductVision } from "@/components/public-surfaces/ProductVision";
const reasons = [{ Icon: TrendingUp, title: "Scale", copy: "Support growth without adding manual work." }, { Icon: Cloud, title: "Access", copy: "Work securely from anywhere." }, { Icon: Network, title: "Connect", copy: "Reduce disconnected tools and duplicate processes." }, { Icon: Eye, title: "See clearly", copy: "Improve reporting and operational visibility." }];
export default function Home() {
  return <main id="main-content" className="discovery-home">
    <section className="shell discovery-hero" aria-labelledby="product-heading">
      <div className="hero-head"><h1 id="product-heading">Move your books with confidence.</h1></div>
      <div className="hero-video"><ProductVision/></div>
      <div className="hero-body">
        <p className="hero-value">Understand what needs to move, stay in control, and verify your numbers before starting fresh.</p>
        <div className="hero-actions"><Link href={startMigrationHref} className="button">Start a sample migration <ArrowRight size={18} aria-hidden="true"/></Link><Link href="/simulator" className="public-text-link">Explore Demo, no sign-in required</Link></div>
        <ul className="hero-assurances" aria-label="How MoveBooks keeps you in control">{["You approve every consequential change", "Rules verify your numbers", "AI guidance is advisory"].map(item => <li key={item}><Check size={16} aria-hidden="true"/>{item}</li>)}</ul>
        <p className="hero-boundary">Synthetic Beta only. Do not use real customer or production provider data. <Link href="/trust#beta-limitations">Beta limitations</Link></p>
      </div>
    </section>
    <section className="shell discovery-details" aria-label="Product overview details">
      <details id="how-it-works" className="home-disclosure"><summary><h2 id="how-heading">How MoveBooks works</h2></summary><div className="disclosure-content"><ol className="phase-overview" aria-label="Journey overview, not live progress">{phases.map(phase => <li key={phase.name}><h3 className="font-bold text-primary">{phase.name}</h3><p className="mt-2 text-sm font-semibold">{phase.detail}</p><p className="mt-2 text-secondary">{phase.copy}</p></li>)}</ol><h3 className="type-card mt-5">A complete synthetic journey.</h3><p className="mt-3 text-secondary">Discover Harbor Light Books, approve mappings, recover from a controlled failure, verify the result, configure the business, and complete onboarding and a verified synthetic invoice.</p><p className="mt-3 text-secondary">Outcome: Business Ready · Verified, demonstrated with a synthetic business.</p><Link href="/guide" className="discovery-link">Getting Started Guide</Link> <Link href="/play" className="discovery-link">Try MoveBooks Play</Link></div></details>
    </section>
    <section className="shell discovery-details" aria-label="More about MoveBooks">
      <details className="home-disclosure"><summary><h2 id="why-migrate">Why businesses migrate</h2></summary><div className="disclosure-content"><p className="text-secondary">Outgrown systems, fragmented data, manual processes and limited visibility can make everyday accounting harder to operate and scale.</p><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{reasons.map(({ Icon, title, copy }) => <Card key={title}><Icon className="text-primary" aria-hidden="true" size={24}/><h3 className="mt-3 font-bold">{title}</h3><p className="mt-2 leading-7 text-secondary">{copy}</p></Card>)}</div><h3 className="type-card mt-5">The questions behind every move</h3><div className="mt-4 grid gap-5 md:grid-cols-3">{[
        ["Will all my data move correctly?", "Customers, vendors, accounts, transactions and configuration need to arrive complete and usable."],
        ["Will my numbers still be right?", "Balances, totals and reconciliation must match before migration is considered successful."],
        ["Will my business be ready to operate?", "Configuration, access and onboarding must work before the migration is truly complete."],
      ].map(([question, context]) => <div key={question}><h4 className="font-bold">{question}</h4><p className="mt-2 text-secondary">{context}</p></div>)}</div><p className="mt-5 text-secondary">Migration is more than moving files. It is a financial-trust and business-readiness problem.</p><Link className="discovery-link" href="/learn#why-migrate">Learn about migration</Link></div></details>
      <details className="home-disclosure"><summary><h2>Trust by design</h2></summary><div className="disclosure-content"><p className="text-secondary">AI that assists. Rules that verify. People who decide.</p><div className="mt-4 grid gap-5 md:grid-cols-3">{[["Evidence before action", "See the facts behind a recommendation, the limits of confidence and what still needs attention."],["You approve key decisions", "Agents coordinate work. People govern consequential changes. A blocked check cannot be approved away."],["We verify your numbers", "Rules check counts, balances and relationships. Success needs evidence—not a convincing explanation."]].map(([title, copy]) => <div key={title}><h3 className="font-bold">{title}</h3><p className="mt-2 text-secondary">{copy}</p></div>)}</div><Link className="discovery-link" href="/trust">Read about controls and trust</Link></div></details>
      <details className="home-disclosure"><summary><h2>Beta boundaries and architecture</h2></summary><div className="disclosure-content"><p className="text-secondary">Cloud uploads, live provider connections and managed ADK remain unavailable. Live Gemini advice requires explicit deployment configuration and is disabled by default. Production customer deployment and live support operations are not available.</p><p className="mt-3 text-secondary">Built with Google Cloud, Gemini and Google ADK</p><p className="mt-3 text-secondary">Independent and provider-neutral. No affiliation with or representation of any accounting software provider.</p><Link className="discovery-link" href="/support">Get Help</Link></div></details>
    </section>
  </main>;
}
