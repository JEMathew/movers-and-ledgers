import { IdentityEntry } from "@/components/IdentityEntry";
export default async function SignIn({searchParams}: {searchParams: Promise<{next?: string}>}) {
  const {next = "/workspace"} = await searchParams;
  return <main className="shell grid min-h-[65vh] place-items-center py-16">
    <section className="card w-full max-w-lg p-9 text-center">
      <p className="eyebrow text-primary">Private workspace</p>
      <h1 className="serif mt-4 text-5xl">Welcome aboard.</h1>
      <p className="mx-auto mt-5 max-w-sm leading-7 text-secondary">Workspace access is checked by the API. Google sign-in requires configured cloud identity; local demo access is separate.</p>
      <IdentityEntry destination={next} />
    </section>
  </main>;
}
