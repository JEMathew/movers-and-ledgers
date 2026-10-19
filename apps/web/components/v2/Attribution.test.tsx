import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AI_ASSISTANCE_STATUS } from "./ai-status";
import { APPROVED_ATTRIBUTION, Attribution } from "./Attribution";

describe("product attribution", () => {
  it("renders the owner-approved line exactly, as one quiet line", () => {
    render(<Attribution />);
    const line = screen.getByText("Built on Google Cloud and powered by Gemini AI");
    expect(APPROVED_ATTRIBUTION).toBe("Built on Google Cloud and powered by Gemini AI");
    expect(line.tagName).toBe("P");
    expect(line).toHaveClass("v2-attribution");
    expect(line.textContent).toBe("Built on Google Cloud and powered by Gemini AI");
    expect(line.querySelector("img, svg, a")).toBeNull();
    expect(document.body).not.toHaveTextContent(/Gemini AI planned/);
  });
  it("leaves the AI assistance status Planned in Phase 1", () => {
    expect(AI_ASSISTANCE_STATUS).toBe("planned");
  });
});
