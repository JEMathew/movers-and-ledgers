import Link from "next/link";
import { footerLinks } from "@/components/public-surfaces/content";

export function Footer() {
  return <footer className="mt-24 border-t border-token py-8 text-xs text-muted">
    <nav aria-label="Footer" className="shell mb-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-secondary">
      {footerLinks.map(([label, href]) => <Link key={href} className="hover:text-[var(--foreground)]" href={href}>{label}</Link>)}
    </nav>
    <div className="shell flex flex-col justify-between gap-3 sm:flex-row">
      <p>© 2026 Movers & Ledgers · An independent synthetic product concept.</p>
      <p>Provider-neutral by design · Financial truth verified by rules</p>
    </div>
  </footer>;
}
