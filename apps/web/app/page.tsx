import Link from "next/link";
import { ArrowRight, Cloud, Eye, Gamepad2, Network, TrendingUp } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { phases, startMigrationHref } from "@/components/public-surfaces/content";
import { ProductVision } from "@/components/public-surfaces/ProductVision";
const reasons = [{ Icon: TrendingUp, title: "Scale", copy: "Support growth without adding manual work." }, { Icon: Cloud, title: "Access", copy: "Work securely from anywhere." }, { Icon: Network, title: "Connect", copy: "Reduce disconnected tools and duplicate processes." }, { Icon: Eye, title: "See clearly", copy: "Improve reporting and operational visibility." }];
export default function Home() {
  return <main id="main-content" className="discovery-home">
    <section className="shell discovery-hero" aria-labelledby="product-heading">
      <Badge>V1.0 Bounded Synthetic Public Beta</Badge>
      <h1 id="product-heading" className="serif">Move your books.<br/><span className="text-primary">Keep your confidence.</span></h1>
      <p className="hero-value">Provider-neutral, AI-assisted accounting migration and onboarding. Review decisions, verify your numbers, and complete a first task with synthetic data.</p>
      <p className="hero-boundary">Synthetic Beta only. Do not use real customer or production provider data. <Link href="/trust#beta-limitations">Beta limitations</Link></p>
      <div className="hero-actions"><Link href={startMigrationHref} className="button">Try the Beta <ArrowRight size={18} aria-hidden="true"/></Link><Link href="/simulator" className="button secondary" aria-describedby="demo-intro">Explore Demo</Link></div>
      <p id="demo-intro" className="demo-intro">Demo introduction only. Sign-in is required to run the Beta workflow.</p>
    </section>
    <section className="shell play-preview" aria-labelledby="play-heading">
      <div className="panel"><Gamepad2 className="text-primary" size={28} aria-hidden="true"/><div><h2 id="play-heading" className="type-section">Learn through MoveBooks Play</h2><p>Practice three decisions about mappings, safe recovery and financial checks. No sign-in; nothing changes your migration.</p></div><Link className="button secondary" href="/play">Open Play <ArrowRight size={17} aria-hidden="true"/></Link></div>
    </section>
    <section className="shell discovery-details" aria-label="Product overview details">
      <details id="how-it-works" className="home-disclosure"><summary><h2 id="how-heading">How MoveBooks works</h2></summary><div className="disclosure-content"><ol className="phase-overview" aria-label="Journey overview, not live progress">{phases.map(phase => <li key={phase.name}><h3 className="font-bold text-primary">{phase.name}</h3><p className="mt-2 text-sm font-semibold">{phase.detail}</p><p className="mt-2 text-secondary">{phase.copy}</p></li>)}</ol><h3 className="type-card mt-5">A complete synthetic journey.</h3><p className="mt-3 text-secondary">Discover Harbor Light Books, approve mappings, recover from a controlled failure, verify the result, configure the business, and complete onboarding and a verified synthetic invoice.</p><p className="mt-3 text-secondary">Outcome: Business Ready · Verified, demonstrated with a synthetic business.</p><Link href="/guide" className="discovery-link">Getting Started Guide</Link></div></details>
    </section>
    <ProductVision/>
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
