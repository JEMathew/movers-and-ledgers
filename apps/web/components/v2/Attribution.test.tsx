import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AI_ASSISTANCE_STATUS } from "./ai-status";
import { APPROVED_ATTRIBUTION, Attribution } from "./Attribution";

describe("product attribution", () => {
  it("renders both official graphical logos and the exact owner-locked attribution once", () => {
    render(<Attribution className="site-attribution" />);
    expect(APPROVED_ATTRIBUTION).toBe("Built on Google Cloud · Built with Google Gemini");
    const line = screen.getByText("Built on Google Cloud").closest("p")!;
    expect(line.tagName).toBe("P");
    expect(line).toHaveClass("v2-attribution", "site-attribution");
    expect(line.textContent).toBe(APPROVED_ATTRIBUTION);
    expect(line.querySelectorAll("img")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Google Cloud logo" })).toHaveAttribute("src", "/brand/google-cloud-official.png");
    expect(screen.getByRole("img", { name: "Google Gemini logo" })).toHaveAttribute("src", "/brand/google-gemini-official.png");
    expect(document.querySelectorAll(".v2-attribution")).toHaveLength(1);
    const units = line.querySelectorAll(".provider-unit");
    expect(units).toHaveLength(2);
    expect(units[0].textContent).toBe("Built on Google Cloud");
    expect(units[1].textContent).toBe("· Built with Google Gemini");
    for (const [index, alt] of ["Google Cloud logo", "Google Gemini logo"].entries()) {
      expect(units[index].children).toHaveLength(2);
      expect(units[index].children[0].tagName).toBe("SPAN");
      expect(units[index].children[1]).toHaveAttribute("alt", alt);
      expect(units[index].children[1].tagName).toBe("IMG");
    }
    expect(line.querySelector("a")).toBeNull();
    expect(line).not.toHaveTextContent(/Enterprise|powered by/i);
    expect(line).not.toHaveTextContent(/partner|certified|endorsed|Gemini AI planned/i);
  });
  it("retains the official asset bytes without recreating, recoloring or cropping them", () => {
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), "public/brand/google-cloud-official.png"))).digest("hex")).toBe("a90b4e56cf87bc04be1438f7a34b99f653f1f3be1a0456d3ac32f66ec5378053");
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), "public/brand/google-gemini-official.png"))).digest("hex")).toBe("b6306682f0dca297c4fa94ea359eee760d04435fc2d39256d98f6e4281f690be");
  });
  it("leaves the AI assistance status Planned in Phase 1", () => {
    expect(AI_ASSISTANCE_STATUS).toBe("planned");
  });
});
