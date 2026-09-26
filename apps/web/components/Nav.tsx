import Link from "next/link";

const links = [["Learn", "/learn"], ["Play", "/play"], ["Simulator", "/simulator"]];

export function Nav() {
  return <header className="shell flex items-center justify-between py-6">
    <Link href="/" className="flex items-center gap-3 font-black tracking-tight">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#22594c] text-white">M</span>
      <span>MoveBooks <i className="font-normal text-[#e96b3b]">AI</i></span>
    </Link>
    <nav className="hidden items-center gap-7 text-sm font-bold md:flex">
      {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      <Link href="/workspace" className="button !py-2">Open workspace <span>↗</span></Link>
    </nav>
  </header>;
}

