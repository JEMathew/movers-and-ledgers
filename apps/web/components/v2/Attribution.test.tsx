import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AI_ASSISTANCE_STATUS } from "./ai-status";
import { APPROVED_ATTRIBUTION, Attribution, attributionText, PLANNED_ATTRIBUTION } from "./Attribution";

describe("product attribution", () => {
  it("keeps the owner-approved line exact", () => {
    expect(APPROVED_ATTRIBUTION).toBe("Built on Google Cloud and powered by Gemini AI");
    expect(attributionText("live")).toBe(APPROVED_ATTRIBUTION);
  });
  it("does not claim active Gemini inference while assistance is planned", () => {
    expect(AI_ASSISTANCE_STATUS).toBe("planned");
    render(<Attribution />);
    const line = screen.getByText(PLANNED_ATTRIBUTION);
    expect(line).toHaveAttribute("data-ai-status", "planned");
    expect(document.body).not.toHaveTextContent(/powered by Gemini/i);
    expect(line.querySelector("img, svg")).toBeNull();
  });
});
