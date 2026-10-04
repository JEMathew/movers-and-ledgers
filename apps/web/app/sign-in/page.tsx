import { IdentityEntry } from "@/components/IdentityEntry";
import { demoEntry } from "@/lib/identity";
export default async function SignIn({searchParams}: {searchParams: Promise<{next?: string}>}) {
  const {next = "/workspace"} = await searchParams;
  return <main className="shell grid min-h-[65vh] place-items-center py-16">
    <section className="card w-full max-w-lg p-9 text-center">
      {/* Google sign-in copy is unchanged; the local demo path explains the demo workspace instead. */}
      <h1 className="type-section">{demoEntry() ? "Continue Your Migration" : "Sign in to continue your migration"}</h1>
      <p className="mx-auto mt-5 max-w-sm leading-7 text-secondary">{demoEntry() ? "Review and continue your migration using the demo workspace." : "Use your Google account to securely access your MoveBooks migration."}</p>
      <IdentityEntry destination={next} />
    </section>
  </main>;
}
