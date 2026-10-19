"use client";
import { useRef } from "react";
import { Play, X } from "lucide-react";

export const VIDEO = {
  title: "See MoveBooks AI in Action",
  src: "/media/movebooks-ai-product-vision.mp4",
  poster: "/media/movebooks-ai-product-vision-poster.webp",
  /** Measured from the asset's mvhd box: 25.04 s. */
  duration: "0:25",
  durationLabel: "25 seconds",
  kind: "Product overview",
} as const;

/**
 * Dedicated desk photograph generated with owner approval. Final visual acceptance remains pending;
 * the product video retains its original poster and playback behavior.
 */
export const HERO_IMAGE = { src: "/media/movebooks-ai-hero-desk-v2.webp", width: 1536, height: 1024, approved: false } as const;

/**
 * Hero media: the image slot with one play control. The control and the picture open the same native video
 * dialog. Playback is always user-initiated; native controls stay available and closing the dialog pauses it.
 */
export function HeroVideo() {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  function open() {
    const element = dialog.current;
    if (!element) return;
    if (typeof element.showModal === "function") element.showModal(); else element.setAttribute("open", "");
    try { void video.current?.play()?.catch(() => {}); } catch { /* Playback stays available from the native controls. */ }
  }
  function close() {
    const element = dialog.current;
    if (typeof element?.close === "function") element.close(); else element?.removeAttribute("open");
    video.current?.pause?.();
  }
  return <div id="product-vision" className="lp-hero-media" data-image-status={HERO_IMAGE.approved ? "approved" : "pending-visual-acceptance"}>
    {/* The picture repeats the play control for pointer users; keyboard and screen readers use the one button. */}
    <div className="lp-hero-picture" onClick={open} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- locally optimized, art-directed hero photograph */}
      <img src={HERO_IMAGE.src} alt="" width={HERO_IMAGE.width} height={HERO_IMAGE.height} fetchPriority="high" decoding="async" />
    </div>
    <button type="button" className="lp-play" onClick={open} aria-haspopup="dialog" aria-label={`Play video: ${VIDEO.title}, ${VIDEO.durationLabel}`}>
      <span className="lp-play-icon" aria-hidden="true"><Play size={26} fill="currentColor" /></span>
      <span className="lp-play-text" aria-hidden="true"><strong>{VIDEO.title}</strong><span>{VIDEO.duration} · {VIDEO.kind}</span></span>
    </button>
    <dialog ref={dialog} className="lp-video-dialog" aria-labelledby="lp-video-title" onClose={() => video.current?.pause?.()}
      onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="lp-video-head">
        <h2 id="lp-video-title">{VIDEO.title}</h2>
        <button type="button" className="lp-video-close" onClick={close} aria-label="Close video"><X size={20} aria-hidden="true" /></button>
      </div>
      <video ref={video} className="lp-video" width="1920" height="1080" controls playsInline preload="none" poster={VIDEO.poster} aria-label="MoveBooks AI Product Vision">
        <source src={VIDEO.src} type="video/mp4" />
        <a href={VIDEO.src}>Watch the MoveBooks AI Product Vision</a>
      </video>
      <details className="vision-transcript"><summary>Video description</summary>
        <p>The video shows the MoveBooks AI title with the line &ldquo;From Migration Uncertainty to Business-Ready Accounting.&rdquo; Five stages light up in turn: Understand (Discover + Assess), Prepare (Plan, Map &amp; Approve), Move (Migrate + Resolve), Verify (Validate + Configure) and Start (Onboard + First Real Task). Beneath them are three statements: &ldquo;You approve key decisions,&rdquo; &ldquo;We resolve blockers before moving forward&rdquo; and &ldquo;We verify your numbers.&rdquo; It ends on &ldquo;Business ready · verified.&rdquo; This describes the on-screen visuals only; spoken captions are not provided yet.</p>
      </details>
    </dialog>
  </div>;
}
