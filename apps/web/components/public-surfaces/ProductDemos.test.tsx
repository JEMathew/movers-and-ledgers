import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ProductDemos } from "./ProductDemos";

it("offers four accessible, user-controlled demos with matching captions and transcripts without calling an API", () => {
  const fetch = vi.spyOn(globalThis, "fetch");
  render(<ProductDemos />);
  expect(screen.getByRole("heading", { name: "See MoveBooks AI in Action" })).toBeVisible();
  const cards = screen.getAllByRole("article");
  expect(cards).toHaveLength(4);
  for (const card of cards) {
    const video = card.querySelector("video")!;
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).toHaveAccessibleName();
    expect(video.querySelector("track")).toHaveAttribute("kind", "captions");
    expect(video.querySelector("track")).toHaveAttribute("srclang", "en");
    expect(within(card).getByRole("link", { name: "Read transcript" }).getAttribute("href")).toMatch(/\.txt$/);
    expect(document.querySelector(`a[href="#${card.id}"]`)).not.toBeNull();
  }
  expect(fetch).not.toHaveBeenCalled();
  fetch.mockRestore();
});
