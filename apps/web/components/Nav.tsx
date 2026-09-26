import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const links = [["Learn", "/learn"], ["Play", "/play"], ["Simulator", "/simulator"]];

export function Nav() {
  return <header className="shell relative flex min-h-20 items-center justify-between py-4">
    <Link href="/" className="flex items-center gap-3 font-black tracking-tight">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary)] text-[var(--on-primary)]">M</span>
      <span>MoveBooks <span className="font-semibold text-primary">AI</span></span>
    </Link>
    <div className="flex items-center gap-2">
      <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm font-semibold md:flex">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        <Link href="/workspace" className="button small">Open workspace <span aria-hidden="true">↗</span></Link>
      </nav>
      <ThemeToggle />
      <details className="mobile-nav md:hidden">
        <summary className="button ghost icon-button" aria-label="Open navigation">
          <Menu aria-hidden="true" size={19} />
        </summary>
        <nav aria-label="Mobile primary navigation" className="mobile-nav-panel">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <Link href="/workspace" className="button small">Open workspace <span aria-hidden="true">↗</span></Link>
        </nav>
      </details>
    </div>
  </header>;
}
