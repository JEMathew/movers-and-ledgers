import { IdentityEntry } from "@/components/IdentityEntry";
import { demoEntry } from "@/lib/identity";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };
export default async function SignIn({searchParams}: {searchParams: Promise<{next?: string}>}) {
  const {next = "/workspace"} = await searchParams;
  const demo = demoEntry();
  return <main id="main-content" className="shell entry">
    <section className="entry-card" aria-labelledby="sign-in-title">
      <p className="entry-eyebrow">MoveBooks AI · Beta</p>
      {/* Google sign-in copy is unchanged; the local demo path explains the demo workspace instead. */}
      <h1 id="sign-in-title" className="entry-title">{demo ? "Continue your migration" : "Sign in to continue your migration"}</h1>
      <p className="entry-lead">{demo ? "Review and continue your migration using the demo workspace." : "Use your Google account to securely access your MoveBooks migration."}</p>
      <IdentityEntry destination={next} />
      <ul className="entry-points" aria-label="What to expect">
        <li>New here? You start with a synthetic sample business.</li>
        <li>Returning? Your migration resumes where you left off.</li>
        <li>You approve every change. Rules verify every figure.</li>
      </ul>
    </section>
  </main>;
}
