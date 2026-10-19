import Link from "next/link";
import { footerLinks } from "@/components/public-surfaces/content";

/** Minimal legal footer. The brand and technology attribution appear once, in the header. */
export function Footer() {
  return <footer className="site-footer">
    <div className="shell site-footer-inner">
      <p>© 2026 Movers & Ledgers</p>
      <nav aria-label="Footer" className="site-footer-links">
        {footerLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
    </div>
  </footer>;
}
