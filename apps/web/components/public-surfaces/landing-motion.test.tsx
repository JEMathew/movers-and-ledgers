import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Home from "@/app/page";

const session = vi.hoisted(() => ({ ready: true, busy: false, hasSession: false, identity: null, error: "", signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("@/components/IdentityProvider", () => ({ useIdentity: () => session }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;
const observers: { callback: Callback; target?: Element; disconnected: boolean; options?: IntersectionObserverInit }[] = [];
beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((media: string) => ({ media, matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("IntersectionObserver", class {
    record: (typeof observers)[number];
    constructor(callback: Callback, options?: IntersectionObserverInit) { this.record = { callback, disconnected: false, options }; observers.push(this.record); }
    observe(target: Element) { this.record.target = target; }
    disconnect() { this.record.disconnected = true; }
    unobserve() {}
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const observerFor = (selector: string) => observers.find(o => o.target?.matches(selector))!;

describe("scroll-aware header Explore Demo", () => {
  it("shows the sticky CTA when the hero CTA is behind the header and recalculates after resize", () => {
    let headerHeight = 78;
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
      return { height: this.matches(".site-header-bar") ? headerHeight : 0 } as DOMRect;
    });
    render(<ThemeProvider><Home /><Nav /></ThemeProvider>);
    const hero = observerFor("[data-hero-cta]");
    expect(hero.options?.rootMargin).toBe("-78px 0px 0px 0px");
    act(() => hero.callback([{ isIntersecting: false, boundingClientRect: { top: 11, bottom: 69 } as DOMRect }]));
    expect(screen.getByRole("banner").querySelectorAll("a.header-cta").length).toBeGreaterThan(0);
    headerHeight = 66;
    act(() => window.dispatchEvent(new Event("resize")));
    expect(hero.disconnected).toBe(true);
    const resized = observers.filter(o => o.target?.matches("[data-hero-cta]")).at(-1)!;
    expect(resized.options?.rootMargin).toBe("-66px 0px 0px 0px");
    act(() => resized.callback([{ isIntersecting: true, boundingClientRect: { top: 200 } as DOMRect }]));
    expect(screen.getByRole("banner").querySelectorAll("a.header-cta")).toHaveLength(0);
  });
  it("appears only after the hero CTA scrolls above the viewport, and hides again when it returns", () => {
    render(<ThemeProvider><Home /><Nav /></ThemeProvider>);
    const banner = () => screen.getByRole("banner");
    const headerCtas = () => banner().querySelectorAll("a.header-cta");
    expect(headerCtas()).toHaveLength(0);
    const hero = observerFor("[data-hero-cta]");
    act(() => hero.callback([{ isIntersecting: false, boundingClientRect: { top: -80 } as DOMRect }]));
    expect(headerCtas().length).toBeGreaterThan(0);
    for (const link of headerCtas()) { expect(link).toHaveAttribute("href", "/simulator"); expect(link).toHaveTextContent("Explore Demo"); }
    act(() => hero.callback([{ isIntersecting: true, boundingClientRect: { top: 200 } as DOMRect }]));
    expect(headerCtas()).toHaveLength(0);
    // Below the fold (not yet reached) is not "scrolled past".
    act(() => hero.callback([{ isIntersecting: false, boundingClientRect: { top: 2000 } as DOMRect }]));
    expect(headerCtas()).toHaveLength(0);
  });
});

describe("five-phase journey motion", () => {
  it("renders the complete static journey first, waits, then plays once on first view", () => {
    render(<Home />);
    const list = screen.getByRole("list", { name: "Journey overview, not live progress" });
    expect(list.querySelectorAll("li")).toHaveLength(5);
    expect([...list.querySelectorAll("h3")].map(h => h.textContent)).toEqual(["Understand", "Prepare", "Move", "Verify", "Start"]);
    expect(list).toHaveAttribute("data-state", "ready");
    const journey = observerFor(".lp-phases");
    act(() => journey.callback([{ isIntersecting: true }]));
    expect(list).toHaveAttribute("data-state", "playing");
    expect(journey.disconnected).toBe(true);
  });
  it("runs the sequence in CSS only when motion is allowed, once, within about 3–4 seconds", () => {
    const css = readFileSync(join(process.cwd(), "app/v2-landing.css"), "utf8");
    const gated = css.match(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(gated).toContain(".lp-phases[data-state=playing] .lp-phase-icon");
    expect(gated).toContain(".lp-phases[data-state=playing] .lp-connector-fill");
    expect(css).not.toMatch(/lp-[a-z-]+ [^;]*infinite/);
    const step = Number(css.match(/--lp-step: (\d+)ms/)?.[1]);
    // Four steps after Understand plus the last highlight.
    expect(4 * step + 360).toBeGreaterThanOrEqual(3000);
    expect(4 * step + 360).toBeLessThanOrEqual(4000);
  });
});
