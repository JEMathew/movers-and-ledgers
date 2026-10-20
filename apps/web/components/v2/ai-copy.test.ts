import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AI_ASSISTANCE_STATUS } from "./ai-status";

const root = join(__dirname, "..", "..");
const read = (file: string) => readFileSync(join(root, file), "utf8");

// Every public and signed-in surface whose copy mentions AI, Gemini, the Advisor or the Reviewer.
// Attribution.tsx is deliberately absent: its line is the owner-approved exception tested on its own below.
const files = [
  "app/page.tsx", "components/Nav.tsx", "components/Footer.tsx",
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
  it("keeps the Advisor and Reviewer Planned (the rule's constant is unchanged)", () => {
    expect(AI_ASSISTANCE_STATUS).toBe("planned");
  });

  it.each(files)("%s claims no AI advice that is running today", (file) => {
    expect(read(file)).not.toMatch(presentTenseAi);
  });

  it.each(files)("%s qualifies every AI offer as planned, unavailable or dev/test only", (file) => {
    const unqualified = sentences(read(file)).filter(s => aiOffer.test(s) && !qualified.test(s));
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
