"use client";
import { useEffect, useRef, useState } from "react";
import type { AcademyMedia, Lesson } from "@/lib/academy/catalog";

export function AcademyPlayer({ lesson, media, onClose }: { lesson: Lesson; media: AcademyMedia; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [speed, setSpeed] = useState("1");
  useEffect(() => { video.current?.focus(); }, []);
  return <section className="academy-player" aria-label={`${lesson.title} player`}>
    <div className="academy-player-heading"><h2>{lesson.title}</h2><button className="button secondary small" onClick={onClose}>Close video</button></div>
    <video ref={video} controls playsInline preload="metadata" poster={media.poster} tabIndex={0}
      aria-label={lesson.title} aria-describedby="academy-player-help" crossOrigin="anonymous"
      onWaiting={() => setLoading(true)} onCanPlay={() => setLoading(false)} onPlaying={() => { setLoading(false); setError(false); }}
      onError={() => { setLoading(false); setError(true); }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        const element = event.currentTarget;
        if (event.key === " " || event.key.toLowerCase() === "k") { event.preventDefault(); if (element.paused) void element.play().catch(() => setError(true)); else element.pause(); }
        if (event.key.toLowerCase() === "m") { event.preventDefault(); element.muted = !element.muted; }
        if (["ArrowLeft", "ArrowRight"].includes(event.key) && Number.isFinite(element.duration)) { event.preventDefault(); element.currentTime = Math.max(0, Math.min(element.duration, element.currentTime + (event.key === "ArrowLeft" ? -5 : 5))); }
        if (event.key === "Escape" && !document.fullscreenElement) onClose();
      }}>
      <source src={media.src} type="video/mp4" onError={() => { setLoading(false); setError(true); }}/>
      <track kind="captions" src={media.captions} srcLang="en" label="English" default/>
      Your browser does not support inline video playback.
    </video>
    <div className="academy-player-tools"><label>Playback speed <select value={speed} onChange={event => { setSpeed(event.target.value); if (video.current) video.current.playbackRate = Number(event.target.value); }}>{["0.75", "1", "1.25", "1.5", "2"].map(rate => <option key={rate} value={rate}>{rate}×</option>)}</select></label><span>English captions · CC in player controls</span></div>
    {loading && !error && <p role="status">Loading video…</p>}
    {error && <div role="alert"><p>This video couldn’t load. Your migration is unchanged.</p><button className="public-text-link" onClick={() => { setError(false); setLoading(true); video.current?.load(); }}>Retry video</button></div>}
    <p id="academy-player-help" className="text-muted">Space or K: play/pause · ← / →: seek · M: mute. Fullscreen and captions are in the player controls.</p>
  </section>;
}
