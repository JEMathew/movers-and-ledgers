import Link from "next/link";
import { Surface } from "@/components/public-surfaces/Surface";
import { AnchoredDetails } from "@/components/public-surfaces/AnchoredDetails";
import { sampleEntry } from "@/components/public-surfaces/content";
export default function Simulator() {
  return <Surface compact eyebrow="Explore Demo" title="Meet your sample business." intro="Discover the five-phase journey with Harbor Light Books, then sign in to run the working synthetic Beta."
    action={<Link className="button" href={`/sign-in?next=${encodeURIComponent(sampleEntry)}`} aria-describedby="demo-boundary">Try the Beta with this sample</Link>}>
    <p id="demo-boundary">Demo introduction only. Running the cloud workflow requires Google sign-in; you explicitly start assessment.</p>
    <p className="text-secondary">Understand → Prepare → Move → Verify → Start</p>
    <AnchoredDetails id="sample-journey" title="What you will experience"><p>Accounts, customers, suppliers, products and transactions move through Assess → Plan → Map → Approve → Migrate → Resolve → Validate → Set Up → Start Using.</p><p>Review mappings, a controlled duplicate-customer remedy, settings and a first synthetic invoice. Nothing is pre-approved on entry.</p><Link className="public-text-link" href="/guide#journey">Follow the five-phase guide</Link><Link className="public-text-link" href={sampleEntry}>Already signed in? Open the sample assessment</Link></AnchoredDetails>
    <AnchoredDetails id="sample-boundaries" title="What is synthetic"><p>Business records, source and target environments, and invoice posting are synthetic. Cloud mode uses real Google sign-in and durable owner-protected workspaces. Local demo access is for development; sessions may expire on restart. No accounting provider is contacted.</p></AnchoredDetails>
    <AnchoredDetails id="sample-success" title="What success means"><p>Business Ready · Verified means required checks pass and an approved synthetic first invoice has verified accounting evidence. Moving records or posting alone is insufficient; this is not production readiness.</p><Link className="public-text-link" href="/learn#business-ready">Understand verified completion</Link></AnchoredDetails>
    <p><Link className="public-text-link" href="/play">Practice three decisions in Play</Link> · No sign-in or workspace changes.</p>
    <Link className="public-text-link" href="/#product-vision">Watch the conceptual Product Vision video</Link>
  </Surface>;
}
