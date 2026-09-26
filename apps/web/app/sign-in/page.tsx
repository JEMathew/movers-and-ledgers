export default async function SignIn({searchParams}: {searchParams: Promise<{next?: string}>}) {
  const {next = "/workspace"} = await searchParams;
  return <main className="shell grid min-h-[65vh] place-items-center py-16">
    <section className="card w-full max-w-lg p-9 text-center">
      <p className="eyebrow text-primary">Private workspace</p>
      <h1 className="serif mt-4 text-5xl">Welcome aboard.</h1>
      <p className="mx-auto mt-5 max-w-sm leading-7 text-secondary">Production will verify a Google-compatible identity. No client ID or secret is committed to this repository.</p>
      <a className="button mt-7 w-full" href={`/api/auth/demo?next=${encodeURIComponent(next)}`}>Enter local demo →</a>
      <p className="mt-4 text-xs text-muted">Development only · synthetic data</p>
    </section>
  </main>;
}
