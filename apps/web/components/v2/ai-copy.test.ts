import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AI_ASSISTANCE_STATUS, AI_STATUS_DETAIL, AI_STATUS_LABEL } from "./ai-status";

const root = join(__dirname, "..", "..");
const read = (file: string) => readFileSync(join(root, file), "utf8");

// Exact owner-approved prospective disclosures. This local checkpoint is not a live
// activation: publication must wait for the corresponding hosted acceptance gates.
// Hashes freeze the reviewed wording; all remaining policy copy keeps the existing guard.
const approvedDisclosures = [
  ["privacy", "guidance", 0, "683e78da89e66f829fdb132dd8e4bd95bf26027403b572b46475e53a8908f617"],
  ["terms", "decisions", 1, "add1a27697f707cefbb0a7a6bb4217bc993119d4c5dd5012b29181bb9d27ea23"],
  ["terms", "availability", 2, "cfc1a8c0ac1185661d314e1660d031c4d73ad5d3e86ace2881a9ae887173f84a"],
] as const;

function copyWithReviewedDisclosuresChecked(file: string) {
  const source = read(file);
  if (file !== "components/policies/policy-content.json") return source;
  const policy = JSON.parse(source) as Record<string, {
    sections: { id: string; paragraphs: string[] }[];
  }>;
  for (const [document, id, index, hash] of approvedDisclosures) {
    const section = policy[document].sections.find(s => s.id === id);
    expect(section, `${document}.${id} exists`).toBeDefined();
    const paragraph = section!.paragraphs[index];
    expect(createHash("sha256").update(paragraph).digest("hex"), `${document}.${id} matches owner-approved wording`).toBe(hash);
    section!.paragraphs[index] = "";
  }
  return JSON.stringify(policy, null, 2);
}

// Every public and signed-in surface whose copy mentions AI, Gemini, the Advisor or the Reviewer.
// Attribution.tsx is deliberately absent: its line is the owner-approved exception tested on its own below.
const files = [
  "app/page.tsx", "components/Nav.tsx", "components/Footer.tsx", "components/policies/policy-content.json",
  "components/public-surfaces/Trust.tsx", "components/public-surfaces/GuidedDemo.tsx", "components/public-surfaces/Guide.tsx",
  "components/public-surfaces/ReasoningAdvice.tsx", "components/public-surfaces/OperationalActivity.tsx",
  "components/public-surfaces/Feedback.tsx", "components/public-surfaces/HeroVideo.tsx", "components/public-surfaces/LandingJourney.tsx",
  "components/MyMigration.tsx", "components/discover-assess/DiscoverAssessExperience.tsx",
  "components/plan-map-approve/MappingReview.tsx", "components/plan-map-approve/IndependentReview.tsx",
  "components/onboard-fpu/VerifiedStart.tsx", "components/try-your-data/BrowserLocalValidation.tsx",
  "components/v2/V2ComponentSheet.tsx", "components/DesignSystemShowcase.tsx",
];

// Phrases that present AI help as available today. The Beta's guidance is rule-based (model_provider_mode
// defaults to deterministic-only; live reasoning is rejected outside synthetic dev/test).
const presentTenseAi = /AI advises|Agents coordinate|AI that assists|AI is advisory|AI-assisted|powered by Gemini|Featuring Gemini|AI[- ]guided|with AI guidance|AI guidance and|AI can (provide|recommend|explain|suggest)|AI (predicts|recommends|explains|suggests)\b|AI advice is advisory|AI-powered|Agent (observation|recommendations?)\b|Optional advice about|verified live/i;

// A sentence that offers AI or Gemini help must say, in the same sentence, that it is not available today.
const aiOffer = /\b(AI|Gemini) (advice|guidance|recommendations?|explanations?|assistance|help|Advisor|Reviewer)\b|\bThe Advisor\b/;
// Future tense ("will"), a limit ("cannot", "never") or the rendered Planned badge also qualify the sentence.
const qualified = /planned|unavailable|not (available|switched on)|dev\/test|does not|is off|example|Until AI|No AI|not live|not establish|tracking|\bwill\b|cannot|never/i;

function sentences(source: string) {
  // Copy only: drop imports and comments, then split JSX text on sentence ends and tags.
  const text = source.replace(/^\s*(import|\/\/|\*|\/\*).*$/gm, "").replace(/<AiStatusBadge \/>/g, " Planned ").replace(/<[^>]+>/g, " ");
  return text.split(/(?<=[.!?])\s+|\n/).map(s => s.trim()).filter(Boolean);
}

describe("AI status in product copy", () => {
  it("preserves the released limited-live Advisor and Reviewer status", () => {
    expect(AI_ASSISTANCE_STATUS).toBe("live");
  });

  it("retains the exact released limited-evaluation labels", () => {
    expect(AI_STATUS_LABEL.live).toBe("Live · limited evaluation");
    expect(AI_STATUS_DETAIL.live).toBe("Gemini for approved synthetic accounts; Offline Judge stays deterministic");
    expect(AI_STATUS_LABEL[AI_ASSISTANCE_STATUS]).toBe("Live · limited evaluation");
    expect(AI_STATUS_DETAIL[AI_ASSISTANCE_STATUS]).toBe("Gemini for approved synthetic accounts; Offline Judge stays deterministic");
  });

  it.each(files)("%s claims no AI advice that is running today", (file) => {
    expect(read(file)).not.toMatch(presentTenseAi);
  });

  it.each(files)("%s qualifies every AI offer as planned, unavailable or dev/test only", (file) => {
    const unqualified = sentences(copyWithReviewedDisclosuresChecked(file)).filter(s => aiOffer.test(s) && !qualified.test(s));
    expect(unqualified).toEqual([]);
  });

  it("limits the owner-locked marketing exception to exact attribution without live-capability claims", () => {
    const attribution = read("components/v2/Attribution.tsx");
    expect(attribution).toContain('APPROVED_ATTRIBUTION = "Built on Google Cloud · Built with Google Gemini"');
    expect(attribution).not.toMatch(/powered by|AI[- ]guided|AI guidance|advises|recommends|verified live/i);
  });

  it.each(["components/public-surfaces/ReasoningAdvice.tsx", "components/plan-map-approve/IndependentReview.tsx", "app/page.tsx"])(
    "%s carries the Planned badge", (file) => {
      expect(read(file)).toContain("<AiStatusBadge />");
    });
});
