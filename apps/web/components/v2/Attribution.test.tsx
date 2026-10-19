import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AI_ASSISTANCE_STATUS } from "./ai-status";
import { APPROVED_ATTRIBUTION, Attribution } from "./Attribution";

describe("product attribution", () => {
  it("renders the rule's exact line as one quiet line, with no logo, link or claim of endorsement", () => {
    render(<Attribution className="site-attribution" />);
    expect(APPROVED_ATTRIBUTION).toBe("Built on Google Cloud and powered by Gemini AI");
    const line = screen.getByText("Built on Google Cloud and powered by Gemini AI");
    expect(line.tagName).toBe("P");
    expect(line).toHaveClass("v2-attribution", "site-attribution");
    expect(line.textContent).toBe(APPROVED_ATTRIBUTION);
    expect(line.querySelector("img, svg, a")).toBeNull();
    expect(line).not.toHaveTextContent(/partner|certified|endorsed|Gemini AI planned/i);
  });
  it("leaves the AI assistance status Planned in Phase 1", () => {
    expect(AI_ASSISTANCE_STATUS).toBe("planned");
  });
});
