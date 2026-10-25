import Link from "next/link";
import { ArrowRight, ChartColumn, CircleCheck, Database, ShieldCheck, Store } from "lucide-react";
import { HeroVideo } from "@/components/public-surfaces/HeroVideo";
import { LandingJourney } from "@/components/public-surfaces/LandingJourney";
import { AiStatusBadge } from "@/components/v2/primitives";

const questions = [
  { Icon: Database, title: "Will All My Data Move Correctly?", copy: "Customers, vendors, accounts, transactions and settings need to arrive complete and usable." },
  { Icon: ChartColumn, title: "Will My Numbers Still Be Right?", copy: "Balances, totals and reconciliation must match before the move counts as a success." },
  { Icon: Store, title: "Will My Business Be Ready to Operate?", copy: "Settings, access and onboarding must work before the move is truly complete." },
];

// Each claim is scoped to what the Beta does: the demo is public, uses synthetic books, and Try Your Data
// checks files in the browser on the hosted Beta (no upload).
const assurances = ["No sign-in for the demo", "Synthetic demo data", "Files checked in your browser"];

export default function Home() {
  return <main id="main-content" className="v2-landing lp">
    <section className="lp-hero" aria-labelledby="product-heading">
      <div className="shell lp-hero-inner">
        <div className="lp-hero-copy">
          <p className="lp-eyebrow">Built on Google Cloud and powered by Gemini AI</p>
          <h1 id="product-heading" className="lp-title">Move Your Books<br />With <span className="lp-title-accent">Confidence.</span></h1>
          <p className="lp-lead">Prepare, move and validate your books with guided workflows, transparent checks and human control.</p>
          <div className="lp-actions">
            <Link href="/simulator" className="lp-button lp-button-primary" data-hero-cta>Explore Demo<ArrowRight size={20} aria-hidden="true" /></Link>
            <Link href="/try-your-data" className="lp-button lp-button-secondary">Try Your Data (Beta)</Link>
          </div>
          <p className="mt-4"><Link href="/learn?tab=demos" className="lp-link">Watch Product Demos<ArrowRight size={18} aria-hidden="true" /></Link></p>
          <ul className="lp-assurances">
            {assurances.map(item => <li key={item}><CircleCheck size={20} aria-hidden="true" />{item}</li>)}
          </ul>
        </div>
        <HeroVideo />
      </div>
    </section>

    <LandingJourney />

    <section className="shell lp-section" aria-labelledby="questions-heading">
      <div className="lp-questions">
        <div className="lp-questions-head">
          <div>
            <p className="lp-kicker">Common questions</p>
            <h2 id="questions-heading" className="lp-h2">Three Questions. One Confident Move.</h2>
          </div>
          <Link href="/learn" className="lp-link">Learn more<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <div className="lp-question-grid">
          {questions.map(({ Icon, title, copy }) => <article key={title} className="lp-question">
            <span className="lp-question-icon" aria-hidden="true"><Icon size={34} strokeWidth={2} /></span>
            <div><h3>{title}</h3><p>{copy}</p></div>
          </article>)}
        </div>
      </div>
    </section>

    <section className="shell lp-section lp-section-last" aria-labelledby="control-heading">
      <div className="lp-control">
        <span className="lp-control-icon" aria-hidden="true"><ShieldCheck size={22} /></span>
        <div className="lp-control-copy">
          <h2 id="control-heading" className="lp-h3">Your Data. Your Control.</h2>
          <AiStatusBadge />
          <p>In the verified saved example, Gemini Advisor explains mapping evidence and uncertainty; an independent Reviewer can challenge the recommendation. You approve consequential decisions, and deterministic checks verify your numbers. Saved analysis can be reviewed without another model call. Access and real-time AI assistance are restricted and cannot bypass human approval; this MVP uses synthetic data, without live accounting-provider connectivity or a commercial-readiness claim.</p>
        </div>
        <Link href="/trust" className="lp-link lp-control-link">View Trust and Security<ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
    </section>
  </main>;
}
