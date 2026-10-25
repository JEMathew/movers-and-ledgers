"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Captions, LockKeyhole, Play, Video } from "lucide-react";
import { academyGroups, lessons, measuredDuration, type AcademyManifest, type LessonId } from "@/lib/academy/catalog";
import { topics } from "@/components/public-surfaces/content";
import { AcademyPlayer } from "./AcademyPlayer";
import { ProductDemos } from "@/components/public-surfaces/ProductDemos";

const tabOrder = ["videos", "concepts", "demos"] as const;
type Tab = typeof tabOrder[number];
export function LearnAcademy({ children, media }: { children: ReactNode; media: AcademyManifest }) {
  const [tab, setTab] = useState<Tab>("videos");
  const [active, setActive] = useState<LessonId>();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const opener = useRef<HTMLButtonElement | null>(null);
  const player = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tab === "demos") {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith("demo-")) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView?.({ block: "start" }));
    }
    if (tab !== "concepts") return;
    const topic = topics.find(item => `#${item.id}` === window.location.hash);
    if (topic) {
      const details = document.getElementById(topic.id) as HTMLDetailsElement | null;
      if (details) { details.open = true; details.querySelector("summary")?.focus({ preventScroll: true }); details.scrollIntoView?.({ block: "start" }); }
    }
  }, [tab]);
  useEffect(() => {
    function sync() {
      const query = new URLSearchParams(window.location.search);
      const hash = window.location.hash.slice(1);
      const concept = topics.some(topic => topic.id === hash);
      setTab(concept || query.get("tab") === "concepts" ? "concepts" : query.get("tab") === "demos" ? "demos" : "videos");
      setActive(undefined);
      if (hash.startsWith("lesson-")) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView?.({ block: "center" }));
    }
    sync(); window.addEventListener("popstate", sync); window.addEventListener("hashchange", sync);
    // Same-page Next links may push a fragment without firing hashchange.
    function click(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== "/learn") return;
      if (topics.some(topic => `#${topic.id}` === url.hash)) { setTab("concepts"); setActive(undefined); }
      else {
        const requested = url.searchParams.get("tab");
        if (requested === "videos" || requested === "concepts" || requested === "demos") { setTab(requested); setActive(undefined); }
      }
    }
    document.addEventListener("click", click);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("hashchange", sync); document.removeEventListener("click", click); };
  }, []);
  function select(next: Tab) {
    setActive(undefined); setTab(next);
    const url = new URL(window.location.href); url.searchParams.set("tab", next); url.hash = "";
    window.history.pushState(null, "", url);
  }
  function close() { setActive(undefined); requestAnimationFrame(() => opener.current?.focus()); }
  const selected = lessons.find(lesson => lesson.id === active && lesson.sourceStatus === "completed");
  const introduction = lessons.find(lesson => lesson.id === "09" && lesson.sourceStatus === "completed" && media[lesson.id]) ?? lessons.find(lesson => lesson.sourceStatus === "completed" && media[lesson.id]);
  return <div className="academy">
    <div className="academy-tabs" role="tablist" aria-label="Learn formats">
      {tabOrder.map((item, index) => <button type="button" key={item} ref={node => { tabs.current[index] = node; }} role="tab" id={`tab-${item}`} aria-controls={`panel-${item}`} aria-selected={tab === item} tabIndex={tab === item ? 0 : -1} onClick={() => select(item)} onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? tabOrder.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabOrder.length) % tabOrder.length;
        select(tabOrder[next]); tabs.current[next]?.focus();
      }}>{item === "videos" ? "Video Tutorials" : item === "concepts" ? "Learn the Concepts" : "Product Demos"}</button>)}
    </div>
    <div role="tabpanel" id="panel-videos" aria-labelledby="tab-videos" hidden={tab !== "videos"} tabIndex={0}>
      <div className="academy-intro"><div><h2>One guide. Your next step.</h2><p className="text-secondary">Short walkthroughs for every stage, with decisions and evidence in view.</p></div><span className="academy-count">9 guides · 4 collections</span></div>
      <p className="academy-availability">{introduction ? `Start with ${introduction.title}.` : "Completed recordings are awaiting media verification before playback."} {Object.values(media).some(asset => asset?.reviewOnly) && "Local review previews only; original subtitles and publication approval are pending. "}{lessons.some(lesson => lesson.sourceStatus === "review-cut") && "Review cuts remain unavailable pending approval."}</p>
      {tab === "videos" && selected && media[selected.id] && <div ref={player}><AcademyPlayer key={selected.id} lesson={selected} media={media[selected.id]!} onClose={close}/></div>}
      {academyGroups.map(group => <section key={group} className="academy-collection" aria-labelledby={`collection-${academyGroups.indexOf(group)}`}><h3 id={`collection-${academyGroups.indexOf(group)}`}>{group}</h3><div className="academy-grid">
        {lessons.filter(lesson => lesson.group === group).map(lesson => {
          const asset = lesson.sourceStatus === "completed" ? media[lesson.id] : undefined;
          return <article key={lesson.id} id={`lesson-${lesson.id}`} className="academy-card" data-publication={lesson.sourceStatus === "review-cut" ? "review-cut" : asset ? "preview-ready" : "awaiting-media"}>
            <div className="academy-poster">{asset ? <>
              {/* eslint-disable-next-line @next/next/no-img-element -- verified video frame, lazily loaded */}
              <img src={asset.poster} alt={`Video frame from ${lesson.title}`} width={1920} height={1080} loading="lazy" decoding="async"/>
              <span className="academy-play-icon" aria-hidden="true"><Play size={24}/></span>
            </> : <div className="academy-placeholder" aria-label="Video poster not yet available"><Video size={32} aria-hidden="true"/><span>{lesson.sourceStatus === "review-cut" ? "Review cut" : "Recording complete"}</span></div>}
            <span className="academy-duration">{asset ? measuredDuration(asset.durationSeconds) : lesson.duration}</span></div>
            <div className="academy-card-body"><div className="academy-card-meta"><span>GUIDE {lesson.id}</span>{introduction?.id === lesson.id && <span>Start here</span>}</div><h4>{lesson.title}</h4><p>{lesson.description}</p>
              <div className="academy-caption"><Captions size={16} aria-hidden="true"/>{asset?.captions ? "English captions" : "Captions awaiting verification"}</div>
              {asset?.reviewOnly && <span className="academy-unavailable">Local review only · unpublished</span>}
              {asset ? <button className="button secondary small" onClick={event => { opener.current = event.currentTarget; setActive(lesson.id); requestAnimationFrame(() => player.current?.scrollIntoView?.({ block: "start" })); }} aria-label={`Watch ${lesson.title}`}><Play size={15} aria-hidden="true"/>Watch guide</button> : <span className="academy-unavailable"><LockKeyhole size={14} aria-hidden="true"/>{lesson.sourceStatus === "review-cut" ? "Not published · review cut" : "Not published · media pending"}</span>}
            </div>
          </article>;
        })}
      </div></section>)}
    </div>
    <div role="tabpanel" id="panel-demos" aria-labelledby="tab-demos" hidden={tab !== "demos"} tabIndex={0}>{tab === "demos" && <ProductDemos />}</div>
    {/* Keep the original disclosures mounted so their open state survives tab changes. */}
    <div role="tabpanel" id="panel-concepts" aria-labelledby="tab-concepts" hidden={tab !== "concepts"} tabIndex={0}>{children}</div>
  </div>;
}
