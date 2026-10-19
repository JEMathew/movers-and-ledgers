/**
 * The technology attribution shown once per page, beneath the MoveBooks AI brand in the header
 * (approved V2 landing design, owner decision 19 Oct 2026). It states what the product is built on and
 * implies no endorsement, partnership or certification. It does not change AI_ASSISTANCE_STATUS: the
 * Advisor and Reviewer keep their own Planned badges.
 */
export const ATTRIBUTION_PARTS = ["Built on Google Cloud", "Powered by Gemini AI"] as const;
export const APPROVED_ATTRIBUTION = ATTRIBUTION_PARTS.join(" | ");

/**
 * Provider marks, used only when official, unmodified files have been added under public/brand/.
 * Until then the line is text only (owner fallback). Set a path to show that mark at its original colours.
 */
export const ATTRIBUTION_LOGOS: Record<(typeof ATTRIBUTION_PARTS)[number], string | null> = {
  "Built on Google Cloud": null, // e.g. "/brand/google-cloud.svg"
  "Powered by Gemini AI": null, // e.g. "/brand/gemini.svg"
};

export function Attribution({ className = "" }: { className?: string }) {
  return <p className={`v2-attribution ${className}`.trim()}>
    {ATTRIBUTION_PARTS.map((part, index) => {
      const logo = ATTRIBUTION_LOGOS[part];
      return <span key={part} className="v2-attribution-part">
        {/* The bar is visual; screen readers hear a comma pause instead of "vertical line". */}
        {index > 0 && <><span className="v2-attribution-sep" aria-hidden="true">|</span><span className="sr-only">, </span></>}
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static brand mark, original file unmodified */}
        {logo && <img src={logo} alt="" width={14} height={14} className="v2-attribution-logo" />}
        <span>{part}</span>
      </span>;
    })}
  </p>;
}
