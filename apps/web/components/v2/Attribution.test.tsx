import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AI_ASSISTANCE_STATUS } from "./ai-status";
import { APPROVED_ATTRIBUTION, ATTRIBUTION_LOGOS, Attribution } from "./Attribution";

describe("product attribution", () => {
  it("renders the approved two-part line as one quiet line, with no link or claim of endorsement", () => {
    render(<Attribution />);
    expect(APPROVED_ATTRIBUTION).toBe("Built on Google Cloud | Powered by Gemini AI");
    const line = document.querySelector(".v2-attribution")!;
    expect(line.tagName).toBe("P");
    expect(line).toHaveClass("v2-attribution");
    expect(line.textContent).toBe("Built on Google Cloud|, Powered by Gemini AI");
    expect(screen.getByText("|")).toHaveAttribute("aria-hidden", "true");
    expect(line.querySelector("a")).toBeNull();
    expect(line).not.toHaveTextContent(/partner|certified|endorsed/i);
  });
  it("shows provider marks only for official files that were added, decoratively", () => {
    render(<Attribution />);
    const images = [...document.querySelectorAll(".v2-attribution img")];
    expect(images).toHaveLength(Object.values(ATTRIBUTION_LOGOS).filter(Boolean).length);
    for (const image of images) expect(image).toHaveAttribute("alt", "");
  });
  it("leaves the AI assistance status Planned in Phase 1", () => {
    expect(AI_ASSISTANCE_STATUS).toBe("planned");
  });
});
