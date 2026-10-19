import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import Home from "@/app/page";
import { HERO_IMAGE } from "./HeroVideo";
import { Guide } from "./Guide";
import { GuidedDemo } from "./GuidedDemo";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
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
    expect(document.querySelector(".lp-video-dialog")).not.toHaveAttribute("open");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
  it("has one play control, titled with the asset's real duration, inside the hero", () => {
    render(<Home/>);
    const hero = document.querySelector(".lp-hero")!;
    const plays = screen.getAllByRole("button", { name: /^Play video/ });
    expect(plays).toHaveLength(1);
    expect(plays[0]).toHaveAccessibleName("Play video: See MoveBooks AI in Action, 25 seconds");
    expect(hero).toContainElement(plays[0]);
    expect(hero).toHaveTextContent("0:25 · Product overview");
    expect(hero).not.toHaveTextContent("3:43");
  });
  it("opens one native, user-initiated player from the button or the picture, and pauses on close", () => {
    render(<Home/>);
    const dialog = document.querySelector("dialog.lp-video-dialog") as HTMLDialogElement;
    expect(dialog).not.toHaveAttribute("open");
    const video = within(dialog).getByLabelText("MoveBooks AI Product Vision");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).not.toHaveAttribute("muted");
    expect(video).toHaveAttribute("poster", "/media/movebooks-ai-product-vision-poster.webp");
    expect(video.querySelector("source")).toHaveAttribute("src", "/media/movebooks-ai-product-vision.mp4");
    fireEvent.click(screen.getByRole("button", { name: /^Play video/ }));
    expect(dialog).toHaveAttribute("open");
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close video" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    fireEvent.click(document.querySelector(".lp-hero-picture")!);
    expect(dialog).toHaveAttribute("open");
    expect(within(dialog).getByText("Video description").closest("details")).toHaveTextContent("spoken captions are not provided yet");
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
