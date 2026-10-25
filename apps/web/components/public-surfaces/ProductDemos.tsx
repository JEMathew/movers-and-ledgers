import Link from "next/link";
import styles from "./ProductDemos.module.css";

const demos = [
  {
    "id": "complete-customer-journey",
    "title": "Complete Customer Journey",
    "duration": "7:14",
    "description": "Follow the five stages from readiness and mapping through reconciliation and Verified First Productive Use."
  },
  {
    "id": "gemini-advisor-independent-reviewer",
    "title": "Gemini Advisor & Independent Reviewer",
    "duration": "2:34",
    "description": "Examine genuine saved Gemini explanations, grounding, uncertainty and an independent Reviewer’s QUESTION assessment. Human approval remains essential."
  },
  {
    "id": "assessment-preparation",
    "title": "Assessment & Preparation",
    "duration": "1:39",
    "description": "Explore readiness, source evidence and account mappings before approving the next step."
  },
  {
    "id": "migration-verification-fpu",
    "title": "Migration, Verification & FPU",
    "duration": "2:41",
    "description": "Review recorded recovery checkpoints, deterministic reconciliation and a verified synthetic accounting task."
  }
] as const;

export function ProductDemos() {
  return <section id="product-demos" className={styles.section} aria-labelledby="product-demos-heading">
    <p className={styles.positioning}>MoveBooks AI — Built on Google Cloud and powered by Gemini AI.</p>
    <h2 id="product-demos-heading" className="type-section">See MoveBooks AI in Action</h2>
    <p className={styles.intro}>Explore the full customer journey and genuine Gemini advice, then focus on the stages that matter to you.</p>
    <nav className={styles.chapters} aria-label="Product demonstration chapters">{demos.map(demo => <a key={demo.id} href={`#demo-${demo.id}`}>{demo.title} · {demo.duration}</a>)}</nav>
    <div className={styles.grid}>{demos.map((demo, index) => <article key={demo.id} id={`demo-${demo.id}`} className={styles.card} aria-labelledby={`title-${demo.id}`}>
      <p className={styles.kicker}>{index < 2 ? "Featured demonstration" : "Focused chapter"} · {demo.duration}</p>
      <h3 id={`title-${demo.id}`}>{demo.title}</h3>
      <video controls playsInline preload="none" width="1920" height="1080" poster={`/media/product-demos/${demo.id}.jpg`} aria-label={`${demo.title}, ${demo.duration}`}>
        <source src={`/media/product-demos/${demo.id}.mp4`} type="video/mp4" />
        <track kind="captions" src={`/media/product-demos/${demo.id}.vtt`} srcLang="en" label="English" default />
        <a href={`/media/product-demos/${demo.id}.mp4`}>Watch {demo.title}</a>
      </video>
      <p>{demo.description}</p>
      <div className={styles.resources}><a href={`/media/product-demos/${demo.id}.mp4`}>Watch video</a><a href={`/media/product-demos/${demo.id}.txt`}>Read transcript</a><a href={`/media/product-demos/${demo.id}.vtt`}>English captions</a><a href={`/media/product-demos/${demo.id}.chapters.txt`}>Chapters</a></div>
    </article>)}</div>
    <p className={styles.scope}>Recorded synthetic journeys and genuine saved Gemini results. Separate records are identified in the videos; viewing saved analysis makes no new model call. Non-commercial, synthetic-data-only MVP; no live accounting-provider integrations. Account access and real-time inference remain restricted.</p>
    <p className={styles.resources}><Link href="/learn?tab=videos">Explore the nine-module Academy</Link><Link href="/guide">Getting Started Guide</Link><Link href="/trust">Trust and Security</Link></p>
  </section>;
}
