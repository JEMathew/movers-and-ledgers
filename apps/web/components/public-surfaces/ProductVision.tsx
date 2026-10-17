"use client";
import { useRef, useState } from "react";
import { Play } from "lucide-react";

/** The conceptual vision video. Playback is always user-initiated; native controls stay available. */
export function ProductVision() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  return <section id="product-vision" className="vision-player" aria-labelledby="vision-heading">
    <div className="vision-head"><h2 id="vision-heading">The MoveBooks AI vision</h2><span className="vision-tag">Concept · 25 sec</span></div>
    <div className="vision-frame" data-playing={playing}>
      <video ref={video} className="aspect-video w-full" width="1920" height="1080"
        controls playsInline preload="none" poster="/media/movebooks-ai-product-vision-poster.webp"
        aria-label="MoveBooks AI Product Vision" aria-describedby="vision-boundary"
        onPlay={() => setPlaying(true)} onEnded={() => setPlaying(false)}>
        <source src="/media/movebooks-ai-product-vision.mp4" type="video/mp4"/>
        <a href="/media/movebooks-ai-product-vision.mp4">Watch the MoveBooks AI Product Vision</a>
      </video>
      {!playing && <button type="button" className="vision-play" onClick={() => { void video.current?.play(); }}><Play size={22} aria-hidden="true" fill="currentColor"/><span>Play the vision</span></button>}
    </div>
    <details className="vision-transcript"><summary>Read a text description of the video</summary>
      <p>The video shows the MoveBooks AI title with the line &ldquo;From Migration Uncertainty to Business-Ready Accounting.&rdquo; Five stages light up in turn: Understand (Discover + Assess), Prepare (Plan, Map &amp; Approve), Move (Migrate + Resolve), Verify (Validate + Configure) and Start (Onboard + First Real Task). Beneath them are three statements: &ldquo;You approve key decisions,&rdquo; &ldquo;We resolve blockers before moving forward&rdquo; and &ldquo;We verify your numbers.&rdquo; It ends on &ldquo;Business Ready · Verified.&rdquo; This describes the on-screen visuals only. No spoken captions are provided yet.</p>
    </details>
    <p id="vision-boundary" className="vision-note">A conceptual preview of where MoveBooks AI is heading, not a walkthrough of the current Beta. Start a sample migration to use what works today.</p>
  </section>;
}
