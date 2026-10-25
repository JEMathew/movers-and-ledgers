"use client";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

export const VIDEO = {
  title: "Product vision",
  src: "/media/movebooks-ai-product-vision.mp4",
  poster: "/media/movebooks-ai-product-vision-poster.webp",
  /** Measured from the asset's mvhd box: 25.04 s. */
  duration: "0:25",
  durationLabel: "25 seconds",
  kind: "Conceptual overview",
} as const;

/**
 * Dedicated desk photograph generated with owner approval. Final visual acceptance remains pending;
 * the original photograph and product video are retained.
 */
export const HERO_IMAGE = { src: "/media/movebooks-ai-hero-desk-v2.webp", width: 1536, height: 1024, approved: false } as const;

/**
 * Playback replaces the photograph in the existing frame only after an explicit request.
 * Native controls provide pause, sound, seeking and optional fullscreen.
 */
export function HeroVideo() {
  const playButton = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const restoreFocus = useRef(false);
  const playAttempt = useRef(0);
  const [active, setActive] = useState(false);
  const [ended, setEnded] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  useEffect(() => {
    if (active) video.current?.focus();
    else if (restoreFocus.current) {
      // Wait for the hidden native controls to finish their focus transition.
      const frame = requestAnimationFrame(() => playButton.current?.focus());
      restoreFocus.current = false;
      return () => cancelAnimationFrame(frame);
    }
  }, [active]);
  function open() {
    const attempt = ++playAttempt.current;
    setActive(true);
    setEnded(false);
    setPlaybackError(false);
    if (active) video.current?.focus();
    if (video.current) video.current.currentTime = 0;
    const failed = () => { if (playAttempt.current === attempt) restore("error"); };
    try {
      // Re-select the unchanged source after a failed media request.
      if (video.current?.error || video.current?.networkState === 3) video.current.load();
      void video.current?.play()?.catch(failed);
    } catch { failed(); }
  }
  function restore(reason: "restore" | "complete" | "error" = "restore") {
    ++playAttempt.current; // Ignore a rejected play promise after the user restores the photograph.
    video.current?.pause?.();
    if (video.current) video.current.currentTime = 0;
    restoreFocus.current = reason !== "complete" || !!video.current?.closest("section")?.contains(document.activeElement);
    setActive(false);
    setEnded(reason === "complete");
    setPlaybackError(reason === "error");
  }
  return <div id="product-vision" className="lp-hero-media" data-image-status={HERO_IMAGE.approved ? "approved" : "pending-visual-acceptance"}>
    {/* The picture repeats the play control for pointer users; keyboard and screen readers use the one button. */}
    <div className="lp-hero-picture" style={active ? { visibility: "hidden" } : undefined} onClick={open} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- locally optimized, art-directed hero photograph */}
      <img src={HERO_IMAGE.src} alt="" width={HERO_IMAGE.width} height={HERO_IMAGE.height} fetchPriority="high" decoding="async" />
    </div>
    <button ref={playButton} aria-hidden={active || undefined} disabled={active} type="button" className="lp-play" onClick={open} aria-label={`${ended ? "Replay" : playbackError ? "Retry" : "Play"} video: ${VIDEO.title}, ${VIDEO.durationLabel}`}>
      <span className="lp-play-icon" aria-hidden="true"><Play size={26} fill="currentColor" /></span>
      <span className="lp-play-text" aria-hidden="true"><strong>{ended ? "Replay video" : playbackError ? "Retry video" : VIDEO.title}</strong><span>{VIDEO.duration} · {VIDEO.kind}</span></span>
    </button>
    {playbackError && <p role="alert" className="lp-video-error">The video couldn’t play. The photograph has been restored. Select Retry video to try again.</p>}
    <section hidden={!active} className="lp-inline-player" aria-label={VIDEO.title}
      onKeyDown={event => { if (event.key === "Escape" && !document.fullscreenElement) { event.preventDefault(); restore(); } }}>
      <video ref={video} className="lp-video" width="1920" height="1080" controls playsInline preload="none"
        tabIndex={0} poster={HERO_IMAGE.src} aria-label="MoveBooks AI Product Vision" aria-describedby="lp-caption-status"
        onEnded={() => { if (active) restore("complete"); }} onPlay={() => { setEnded(false); setPlaybackError(false); }}
        onError={() => { if (active) restore("error"); }}>
        <source src={VIDEO.src} type="video/mp4" onError={() => { if (active) restore("error"); }} />
        <a href={VIDEO.src}>Watch the MoveBooks AI Product Vision</a>
      </video>
      <div className="lp-video-actions">
        <button type="button" onClick={() => restore()}>Restore photograph</button>
      </div>
      <p id="lp-caption-status" className="lp-caption-status">The description below covers on-screen visuals. Explore the captioned product demonstrations that follow.</p>
      <details className="vision-transcript"><summary>Video description</summary>
        <p>The video shows the MoveBooks AI title with the line &ldquo;From Migration Uncertainty to Business-Ready Accounting.&rdquo; Five stages light up in turn: Understand (Discover + Assess), Prepare (Plan, Map &amp; Approve), Move (Migrate + Resolve), Verify (Validate + Configure) and Start (Onboard + First Real Task). Beneath them are three statements: &ldquo;You approve key decisions,&rdquo; &ldquo;We resolve blockers before moving forward&rdquo; and &ldquo;We verify your numbers.&rdquo; It ends on &ldquo;Business ready · verified.&rdquo; This description covers the conceptual on-screen visuals; the product demonstrations below include English captions.</p>
      </details>
    </section>
  </div>;
}
