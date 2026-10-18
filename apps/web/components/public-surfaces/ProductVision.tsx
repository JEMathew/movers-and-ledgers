"use client";
import { useRef, useState } from "react";
import { Play } from "lucide-react";

/** The conceptual vision video. Playback is always user-initiated; native controls stay available. */
export function ProductVision() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  return <section id="product-vision" className="vision-player" aria-labelledby="vision-label">
    <p id="vision-label" className="vision-label">Our vision · 25 sec</p>
    <div className="vision-frame" data-playing={playing}>
      <video ref={video} className="aspect-video w-full" width="1920" height="1080"
        controls playsInline preload="none" poster="/media/movebooks-ai-product-vision-poster.webp"
        aria-label="MoveBooks AI Product Vision"
        onPlay={() => setPlaying(true)} onEnded={() => setPlaying(false)}>
        <source src="/media/movebooks-ai-product-vision.mp4" type="video/mp4"/>
        <a href="/media/movebooks-ai-product-vision.mp4">Watch the MoveBooks AI Product Vision</a>
      </video>
      {!playing && <button type="button" className="vision-play" onClick={() => { void video.current?.play(); }}><Play size={22} aria-hidden="true" fill="currentColor"/><span>Play the vision</span></button>}
    </div>
    <details className="vision-transcript"><summary>Video description</summary>
      <p>The video shows the MoveBooks AI title with the line &ldquo;From Migration Uncertainty to Business-Ready Accounting.&rdquo; Five stages light up in turn: Understand (Discover + Assess), Prepare (Plan, Map &amp; Approve), Move (Migrate + Resolve), Verify (Validate + Configure) and Start (Onboard + First Real Task). Beneath them are three statements: &ldquo;You approve key decisions,&rdquo; &ldquo;We resolve blockers before moving forward&rdquo; and &ldquo;We verify your numbers.&rdquo; It ends on &ldquo;Business Ready · Verified.&rdquo; This describes the on-screen visuals only; spoken captions are not provided yet.</p>
    </details>
  </section>;
}
