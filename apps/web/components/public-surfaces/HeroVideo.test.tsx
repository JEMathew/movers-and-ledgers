import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import Home from "@/app/page";
import { HERO_IMAGE } from "./HeroVideo";
import { Guide } from "./Guide";
import { GuidedDemo } from "./GuidedDemo";

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
});

describe("hero video", () => {
  it("provides the video fragment targeted by Guide and Demo without starting playback", () => {
    const destinations = [Guide, GuidedDemo].map(Page => {
      const view = render(<Page />);
      const link = view.getByText("Conceptual Product Vision video").closest("a")!;
      const destination = new URL(link.href);
      expect(destination.pathname).toBe("/");
      expect(destination.hash).toBe("#product-vision");
      view.unmount();
      return destination.hash;
    });

    render(<Home />);
    const play = screen.getByRole("button", { name: /^Play video/ });
    for (const destination of destinations) {
      const targets = document.querySelectorAll(destination);
      expect(targets).toHaveLength(1);
      expect(targets[0]).toContainElement(play);
    }
    expect(document.querySelector("dialog")).toBeNull();
    expect(document.querySelector(".lp-inline-player")).toHaveAttribute("hidden");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
  it("has one play control, titled with the asset's real duration, inside the hero", () => {
    render(<Home/>);
    const hero = document.querySelector(".lp-hero")!;
    const plays = screen.getAllByRole("button", { name: /^Play video/ });
    expect(plays).toHaveLength(1);
    expect(plays[0]).toHaveAccessibleName("Play video: Product vision, 25 seconds");
    expect(hero).toContainElement(plays[0]);
    expect(hero).toHaveTextContent("0:25 · Conceptual overview");
    expect(hero).not.toHaveTextContent("3:43");
  });
  it("plays inline only on request, preserves native controls, and restores the photograph and focus", async () => {
    render(<Home/>);
    const video = document.querySelector("video")!;
    const panel = document.querySelector(".lp-inline-player")!;
    expect(panel).toHaveAttribute("hidden");
    expect(document.querySelector("dialog")).toBeNull();
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).not.toHaveAttribute("muted");
    expect(video).toHaveAttribute("poster", HERO_IMAGE.src);
    expect(video.querySelector("source")).toHaveAttribute("src", "/media/movebooks-ai-product-vision.mp4");
    fireEvent.click(screen.getByRole("button", { name: /^Play video/ }));
    expect(panel).not.toHaveAttribute("hidden");
    expect(video).toHaveFocus();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Restore photograph" }));
    expect(panel).toHaveAttribute("hidden");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: /^Play video/ })).toHaveFocus());
    fireEvent.click(document.querySelector(".lp-hero-picture")!);
    expect(panel).not.toHaveAttribute("hidden");
    expect(screen.getByText("Video description").closest("details")).toHaveTextContent("product demonstrations below include English captions");
    expect(video.querySelector("track")).toBeNull();
    expect(screen.getByText(/Explore the captioned product demonstrations that follow/)).toBeVisible();
    fireEvent.keyDown(video, { key: "Escape" });
    expect(panel).toHaveAttribute("hidden");
  });
  it("offers replay after completion without auto-replaying", async () => {
    render(<Home/>);
    fireEvent.click(screen.getByRole("button", { name: /^Play video/ }));
    const video = document.querySelector("video")!;
    expect(video).toHaveAttribute("controls");
    video.currentTime = 25;
    fireEvent.ended(video);
    expect(document.querySelector(".lp-inline-player")).toHaveAttribute("hidden");
    expect(document.querySelector(".lp-hero-picture")).toBeVisible();
    expect(video.currentTime).toBe(0);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /^Replay video/ }));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
    expect(video).toHaveFocus();
    expect(screen.queryByRole("button", { name: /^Replay video/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restore photograph" }));
    expect(video.currentTime).toBe(0);
    await waitFor(() => expect(screen.getByRole("button", { name: /^Play video/ })).toHaveFocus());
  });
  it("explains rejected playback, preserves the photograph, and allows a clean retry", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error("Playback unavailable"));
    render(<Home/>);
    fireEvent.click(screen.getByRole("button", { name: /^Play video/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The video couldn’t play");
    expect(document.querySelector(".lp-hero-picture")).toBeVisible();
    expect(document.querySelector(".lp-hero-picture img")).toHaveAttribute("src", HERO_IMAGE.src);
    expect(document.querySelector("video")).not.toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /^Retry video/ }));
    await waitFor(() => expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(document.querySelector("video")).toBeVisible();
    expect(document.querySelectorAll(".lp-hero video")).toHaveLength(1);
  });
  it("recovers from a source failure and ignores a late rejection after restore", async () => {
    let rejectPlay!: (reason: Error) => void;
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(() => new Promise((_, reject) => { rejectPlay = reject; }));
    render(<Home/>);
    fireEvent.click(screen.getByRole("button", { name: /^Play video/ }));
    fireEvent.error(document.querySelector("video source")!);
    expect(screen.getByRole("alert")).toBeVisible();
    const video = document.querySelector("video")!;
    Object.defineProperty(video, "networkState", { configurable: true, value: 3 });
    video.load = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: /^Retry video/ }));
    rejectPlay(new Error("Old request failed"));
    await waitFor(() => expect(video.load).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(video).toBeVisible();
  });
  it("keeps only the video visible while paused and resumed, including three complete cycles", () => {
    render(<Home/>);
    const video = document.querySelector("video")!;
    const picture = document.querySelector(".lp-hero-picture")!;
    for (let cycle = 0; cycle < 3; cycle++) {
      fireEvent.click(screen.getByRole("button", { name: cycle ? /^Replay video/ : /^Play video/ }));
      expect(video.currentTime).toBe(0);
      expect(picture).not.toBeVisible();
      video.currentTime = 10;
      fireEvent.pause(video);
      expect(picture).not.toBeVisible();
      expect(video).toBeVisible();
      fireEvent.play(video);
      expect(video.currentTime).toBe(10);
      expect(picture).not.toBeVisible();
      fireEvent.ended(video);
      expect(picture).toBeVisible();
      expect(video).not.toBeVisible();
      expect(document.querySelectorAll(".lp-hero video")).toHaveLength(1);
    }
  });
  it("keeps the hero image slot marked pending visual acceptance until the approved photo replaces the poster", () => {
    render(<Home/>);
    expect(HERO_IMAGE.approved).toBe(false);
    expect(document.querySelector(".lp-hero-media")).toHaveAttribute("data-image-status", "pending-visual-acceptance");
    expect(document.querySelector(".lp-hero-picture")).toHaveAttribute("aria-hidden", "true");
  });
  it("ships one bounded H.264 fast-start asset and a small poster", () => {
    const root = resolve(process.cwd(), "public/media");
    const video = readFileSync(resolve(root, "movebooks-ai-product-vision.mp4"));
    expect(video.byteLength).toBeLessThan(7_000_000);
    expect(video.indexOf(Buffer.from("avc1"))).toBeGreaterThan(0);
    expect(video.indexOf(Buffer.from("moov"))).toBeLessThan(video.indexOf(Buffer.from("mdat")));
    expect(statSync(resolve(root, "movebooks-ai-product-vision-poster.webp")).size).toBeLessThan(100_000);
  });
});
