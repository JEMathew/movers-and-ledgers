import Link from "next/link";

export function JourneyPage({kind, title, copy, protectedRoute = false}: {kind: string; title: string; copy: string; protectedRoute?: boolean}) {
  return <main className="shell min-h-[70vh] py-20">
    <div className="max-w-3xl">
      <p className="eyebrow text-primary">{kind}</p>
      <h1 className="serif mt-5 text-6xl tracking-tight">{title}</h1>
      <p className="mt-7 max-w-2xl text-xl leading-8 text-secondary">{copy}</p>
      {protectedRoute && <div className="card mt-10 p-7">
        <p className="text-sm font-black">Protected experience</p>
        <p className="mt-2 text-sm leading-6 text-secondary">Google-compatible sign-in is required here. The Beta scaffold defines this boundary but does not contain production credentials.</p>
        <button className="button mt-5">Continue with Google <span>→</span></button>
      </div>}
      {!protectedRoute && <Link className="button mt-9" href="/simulator">Continue the journey →</Link>}
    </div>
  </main>;
}
