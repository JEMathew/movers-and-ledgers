import Link from "next/link";

const stages = ["Discover", "Assess", "Plan", "Map", "Migrate", "Resolve", "Validate", "Configure"];
const principles = [
  ["01", "Evidence over confidence", "Every recommendation points back to source facts, deterministic checks, and versioned decisions."],
  ["02", "Humans hold the keys", "Consequential mappings, writes, and launch steps pause for explicit, attributable approval."],
  ["03", "Reconciliation is law", "Counts, balances, references, checksums, and constraints decide success—not an agent's prose."],
];

export default function Home() {
  return <main>
    <section className="shell grid min-h-[680px] items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr]">
      <div>
        <p className="eyebrow mb-6 text-[#22594c]">From accounting maze to mapped move</p>
        <h1 className="serif max-w-3xl text-6xl leading-[.96] tracking-[-.05em] sm:text-7xl lg:text-[6.4rem]">
          Move your books.<br/><i className="text-[#e96b3b]">Keep your bearings.</i>
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-8 text-black/65">
          Explore, simulate, plan, and validate a cloud accounting migration—with evidence at every turn and people in control.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/simulator" className="button">Try the simulator <span>→</span></Link>
          <Link href="/learn" className="button secondary">Learn how it works</Link>
        </div>
      </div>
      <div className="grid-lines relative min-h-[520px] overflow-hidden rounded-[32px] border border-black/15 bg-[#fffcf5] p-8 shadow-[0_30px_80px_rgba(23,35,33,.12)]">
        <div className="absolute left-10 right-10 top-10 flex justify-between text-[10px] font-bold uppercase tracking-[.16em] text-black/45"><span>Source environment</span><span>Cloud-ready</span></div>
        <div className="absolute inset-x-12 top-1/2 h-[3px] bg-[#172321]/20"><div className="h-full w-2/3 bg-[#e96b3b]" /></div>
        {stages.map((stage, i) => <div key={stage} className="absolute" style={{left: `${10 + (i % 4) * 25}%`, top: `${24 + Math.floor(i / 4) * 48}%`}}>
          <div className={`grid h-16 w-16 place-items-center rounded-2xl border text-xl font-black shadow-sm ${i < 5 ? "border-[#22594c] bg-[#b9e7d2]" : "border-dashed border-black/30 bg-white"}`}>{i < 5 ? "✓" : i + 1}</div>
          <p className="mt-2 text-xs font-bold">{stage}</p>
        </div>)}
        <div className="absolute bottom-7 right-7 rounded-full bg-[#172321] px-4 py-2 text-xs font-bold text-white">62% mapped · 3 need review</div>
      </div>
    </section>

    <section className="bg-[#172321] py-24 text-[#f5f2e9]">
      <div className="shell">
        <p className="eyebrow text-[#b9e7d2]">Trust is a product feature</p>
        <h2 className="serif mt-5 max-w-3xl text-5xl tracking-tight">Intelligence where it helps.<br/>Determinism where it matters.</h2>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-white/15 md:grid-cols-3">
          {principles.map(([n,title,body]) => <article key={n} className="bg-[#172321] p-8">
            <span className="font-mono text-sm text-[#e96b3b]">{n}</span><h3 className="mt-12 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-white/60">{body}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="shell py-24">
      <div className="card grid gap-12 p-8 md:grid-cols-2 md:p-14">
        <div><p className="eyebrow text-[#e96b3b]">A safe first step</p><h2 className="serif mt-4 text-5xl">Practice before you move.</h2><p className="mt-5 max-w-md leading-7 text-black/60">Use a synthetic company to see discovery, mappings, exceptions, approvals, and reconciliation without connecting a real account.</p></div>
        <div className="flex items-end justify-start md:justify-end"><Link className="button" href="/play">Start in Play mode →</Link></div>
      </div>
    </section>
  </main>;
}

