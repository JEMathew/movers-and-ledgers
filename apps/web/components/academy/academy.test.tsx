import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LearnAcademy } from "./LearnAcademy";
import { WatchGuide } from "./WatchGuide";
import { AcademyPlayer } from "./AcademyPlayer";
import { lessons, type AcademyManifest } from "@/lib/academy/catalog";
import { AnchoredDetails } from "@/components/public-surfaces/AnchoredDetails";
import { topics } from "@/components/public-surfaces/content";

const sample = { src: "/test/01.mp4", captions: "/test/01.vtt", transcript: "/test/01.txt", poster: "/test/01.webp", durationSeconds: 88.1 };
const concepts = topics.map(topic => <AnchoredDetails key={topic.id} id={topic.id} title={topic.title}><p>{topic.body}</p><p>{topic.question}</p></AnchoredDetails>);
describe("Academy", () => {
  beforeEach(() => window.history.replaceState(null, "", "/learn"));
  it("labels caption-incomplete review previews and emits no phantom caption track", () => {
    const { container } = render(<AcademyPlayer lesson={lessons[0]} media={{ src: sample.src, poster: sample.poster, durationSeconds: 88, reviewOnly: true }} onClose={() => {}}/>);
    expect(container.querySelector("track")).toBeNull();
    expect(screen.getByText("Original English subtitles not yet connected")).toBeVisible();
    expect(screen.getByText(/Local review preview · not approved for publication/)).toBeVisible();
  });
  it("shows nine lessons, exactly three tabs and no media requests while unavailable", () => {
    const { container } = render(<LearnAcademy media={{}}>{concepts}</LearnAcademy>);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Video Tutorials" })).toHaveAttribute("aria-selected", "true");
    expect(container.querySelectorAll("article")).toHaveLength(9);
    expect(container.querySelectorAll('[data-publication="review-cut"]')).toHaveLength(0);
    expect(container.querySelector("video, source, track, img")).toBeNull();
  });
  it("shows all nine reviewed lessons when the server supplies verified media", () => {
    const media = Object.fromEntries(lessons.map(lesson => [lesson.id, sample])) as AcademyManifest;
    render(<LearnAcademy media={media}>{concepts}</LearnAcademy>);
    expect(screen.getAllByRole("button", { name: /^Watch / })).toHaveLength(9);
    expect(screen.getByRole("button", { name: "Watch Gemini Advisor" })).toBeVisible();
    expect(screen.queryByText("Not published · review cut")).toBeNull();
  });
  it("retains all original concepts and accordion state across keyboard tab changes", () => {
    render(<LearnAcademy media={{}}>{concepts}</LearnAcademy>);
    const videoTab = screen.getByRole("tab", { name: "Video Tutorials" });
    fireEvent.keyDown(videoTab, { key: "ArrowRight" });
    for (const topic of topics) {
      (document.getElementById(topic.id) as HTMLDetailsElement).open = true;
      expect(screen.getByText(topic.body)).toBeVisible();
    }
    const detail = document.getElementById(topics[0].id) as HTMLDetailsElement;
    detail.open = true;
    fireEvent.click(videoTab);
    fireEvent.click(screen.getByRole("tab", { name: "Learn the Concepts" }));
    expect(detail.open).toBe(true);
  });
  it("opens old concept deep links and keeps valid return context", () => {
    window.history.replaceState(null, "", "/learn?session=123e4567-e89b-12d3-a456-426614174000&stage=1#confidence");
    render(<LearnAcademy media={{}}>{concepts}</LearnAcademy>);
    expect(screen.getByRole("tab", { name: "Learn the Concepts" })).toHaveAttribute("aria-selected", "true");
    expect(document.getElementById("confidence")).toHaveAttribute("open");
    fireEvent.click(screen.getByRole("tab", { name: "Video Tutorials" }));
    expect(window.location.search).toContain("stage=1");
    expect(window.location.search).toContain("123e4567");
  });
  it("unmounts a playing video when changing tabs and preserves disclosure state", () => {
    const { container } = render(<LearnAcademy media={{ "01": sample }}>{concepts}</LearnAcademy>);
    fireEvent.click(screen.getByRole("button", { name: "Watch Getting Started" }));
    expect(container.querySelector("video")).not.toBeNull();
    expect(container.querySelector("video")).not.toHaveAttribute("autoplay");
    fireEvent.click(screen.getByRole("tab", { name: "Learn the Concepts" }));
    expect(container.querySelector("video")).toBeNull();
  });
  it("handles player failure, retry, speed and keyboard controls", () => {
    const close = vi.fn();
    const { container } = render(<AcademyPlayer lesson={lessons[0]} media={sample} onClose={close}/>);
    const video = container.querySelector("video")!;
    const load = vi.spyOn(video, "load").mockImplementation(() => {});
    fireEvent.error(video);
    expect(screen.getByRole("alert")).toHaveTextContent("Your migration is unchanged");
    fireEvent.click(screen.getByRole("button", { name: "Retry video" }));
    expect(load).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByLabelText("Playback speed"), { target: { value: "1.5" } });
    expect(video.playbackRate).toBe(1.5);
    fireEvent.keyDown(video, { key: "m" }); expect(video.muted).toBe(true);
    fireEvent.keyDown(video, { key: "Escape" }); expect(close).toHaveBeenCalledOnce();
    expect(container.querySelector("track")).toHaveAttribute("srclang", "en");
    expect(screen.getByRole("link", { name: "Read English transcript" })).toHaveAttribute("href", sample.transcript);
  });
  it("exposes corrected Gemini guides and strips untrusted navigation context", () => {
    const { container } = render(<><WatchGuide lesson="04"/><WatchGuide lesson="05"/><WatchGuide lesson="01" session="https://evil.example" stage={99}/></>);
    expect(container.querySelectorAll("a")).toHaveLength(3);
    expect(container.querySelector('a[href="/learn?tab=videos#lesson-01"]')).not.toBeNull();
  });
});


describe("Product Demos navigation", () => {
  beforeEach(() => window.history.replaceState(null, "", "/learn?tab=demos"));
  it("opens the third tab directly, preserves tab order and stops demos when leaving", () => {
    const { container } = render(<LearnAcademy media={{}}>{concepts}</LearnAcademy>);
    expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Video Tutorials", "Learn the Concepts", "Product Demos"]);
    const demos = screen.getByRole("tab", { name: "Product Demos" });
    expect(demos).toHaveAttribute("aria-selected", "true");
    expect(container.querySelectorAll("#panel-demos video")).toHaveLength(4);
    fireEvent.keyDown(demos, { key: "ArrowRight" });
    const tutorials = screen.getByRole("tab", { name: "Video Tutorials" });
    expect(tutorials).toHaveFocus();
    expect(container.querySelectorAll("#panel-demos video")).toHaveLength(0);
    fireEvent.keyDown(tutorials, { key: "ArrowLeft" });
    expect(demos).toHaveFocus();
    expect(window.location.search).toBe("?tab=demos");
    fireEvent.keyDown(demos, { key: "Home" });
    expect(tutorials).toHaveFocus();
    fireEvent.keyDown(tutorials, { key: "End" });
    expect(demos).toHaveFocus();
  });
  it("synchronizes browser history and same-page tutorial links", () => {
    render(<LearnAcademy media={{}}>{concepts}</LearnAcademy>);
    fireEvent.click(screen.getByRole("link", { name: "Explore the nine-module Academy" }));
    expect(screen.getByRole("tab", { name: "Video Tutorials" })).toHaveAttribute("aria-selected", "true");
    window.history.replaceState(null, "", "/learn?tab=demos#demo-gemini-advisor-independent-reviewer");
    fireEvent.popState(window);
    expect(screen.getByRole("tab", { name: "Product Demos" })).toHaveAttribute("aria-selected", "true");
  });
});
