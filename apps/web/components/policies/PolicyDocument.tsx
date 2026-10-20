import Link from "next/link";
import content from "./policy-content.json";

/** Public policy content. Deployment requires approval of the exact text. */
export function PolicyDocument({ kind }: { kind: "privacy" | "terms" }) {
  const policy = content[kind];
  return <main id="main-content" className="shell public-content">
    <article className="max-w-3xl [overflow-wrap:anywhere]" aria-labelledby="policy-title">
      <header className="v2-surface-header">
        <p className="v2-surface-eyebrow">MoveBooks AI · Hackathon MVP</p>
        <h1 id="policy-title" className="type-page mt-2">{policy.title}</h1>
        <p className="mt-3 leading-7 text-secondary">{policy.intro}</p>
        <p className="mt-3 leading-7 text-secondary">{content.effectiveDate}</p>
      </header>
      <div className="space-y-8">
        {policy.sections.map(section => <section key={section.id} aria-labelledby={`policy-${section.id}`}>
          <h2 id={`policy-${section.id}`} className="type-section">{section.title}</h2>
          {section.paragraphs.map(paragraph => <p key={paragraph} className="mt-3 leading-7 text-secondary">{paragraph}</p>)}
        </section>)}
        <section aria-labelledby="policy-contact">
          <h2 id="policy-contact" className="type-section">{content.contact.title}</h2>
          <p className="mt-3 leading-7 text-secondary">{content.contact.description}{" "}
            <a className="public-text-link" href={`mailto:${content.contact.email}`}>{content.contact.email}</a>
          </p>
        </section>
        <nav aria-label="Related policies" className="flex flex-wrap gap-6 pb-8">
          <Link className="public-text-link" href={kind === "privacy" ? "/terms" : "/privacy"}>{kind === "privacy" ? "Terms of Use" : "Privacy Policy"}</Link>
          <Link className="public-text-link" href="/support">Self-service Help</Link>
        </nav>
      </div>
    </article>
  </main>;
}
