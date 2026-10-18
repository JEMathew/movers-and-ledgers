import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import Home from "@/app/page";

describe("Product Vision media", () => {
  it("places the conceptual vision inline above the fold hero with user-initiated, native playback", () => {
    render(<Home/>);
    const hero = document.querySelector(".discovery-hero")!;
    const vision = document.querySelector("#product-vision")!;
    expect(hero.contains(vision)).toBe(true);
    expect(document.querySelector("details#product-vision-disclosure")).toBeNull();
    expect(screen.getByText("Our vision · 25 sec")).toBeVisible();
    expect(document.querySelector("#product-vision")).toHaveAccessibleName("Our vision · 25 sec");
    // DOM order: headline, then video, then CTA (mobile reads the video directly under the headline).
    const order = [...hero.querySelectorAll("h1, video, a.button")].map(node => node.tagName);
    expect(order).toEqual(["H1", "VIDEO", "A"]);
    const video = screen.getByLabelText("MoveBooks AI Product Vision");
    expect(video.tagName).toBe("VIDEO");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).not.toHaveAttribute("loop");
    expect(video).not.toHaveAttribute("muted");
    expect(video).toHaveAttribute("width", "1920");
    expect(video).toHaveAttribute("height", "1080");
    expect(video).toHaveAttribute("poster", "/media/movebooks-ai-product-vision-poster.webp");
    expect(video.querySelector("source")).toHaveAttribute("src", "/media/movebooks-ai-product-vision.mp4");
    // No visible description paragraph; the accessible description lives in a discreet disclosure.
    expect(document.querySelector("#vision-boundary")).toBeNull();
    const description = screen.getByText("Video description").closest("details")!;
    expect(description.open).toBe(false);
    expect(description).toHaveTextContent("From Migration Uncertainty to Business-Ready Accounting");
    expect(description).toHaveTextContent("spoken captions are not provided yet");
    expect(screen.getByRole("button", { name: "Play the vision" })).toBeVisible();
  });
  it("hides the play prompt once playback starts and restores it when the video ends", () => {
    render(<Home/>);
    const video = screen.getByLabelText("MoveBooks AI Product Vision");
    fireEvent.play(video);
    expect(screen.queryByRole("button", { name: "Play the vision" })).not.toBeInTheDocument();
    fireEvent.ended(video);
    expect(screen.getByRole("button", { name: "Play the vision" })).toBeVisible();
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
