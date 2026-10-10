import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import Home from "@/app/page";

describe("Product Vision media", () => {
  it("preserves conceptual vision after product entry and Play with native, bounded playback", () => {
    render(<Home/>);
    const video = screen.getByLabelText("MoveBooks AI Product Vision");
    expect(video.tagName).toBe("VIDEO");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).not.toHaveAttribute("loop");
    expect(video).toHaveAttribute("width", "1920");
    expect(video).toHaveAttribute("height", "1080");
    expect(video).toHaveAttribute("poster", "/media/movebooks-ai-product-vision-poster.webp");
    expect(video.querySelector("source")).toHaveAttribute("src", "/media/movebooks-ai-product-vision.mp4");
    expect(screen.getByText(/Product Vision shows the intended customer experience/)).toBeVisible();
    expect(screen.getByText("Conceptual product vision · 25 sec")).toBeVisible();
    const vision = document.querySelector("#product-vision")!;
    const play = screen.getByRole("heading", { name: "Learn through MoveBooks Play" }).closest("section")!;
    expect(play.compareDocumentPosition(vision) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(video).toHaveAttribute("aria-describedby", "vision-boundary");
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
