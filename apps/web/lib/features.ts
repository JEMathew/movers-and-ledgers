/**
 * Reversible product feature flags. Each defaults to off and is read from a public build-time variable, so a
 * flag can be turned on per environment without code changes and turned off again the same way.
 */
export const features = {
  /** MoveBooks Play in public and member navigation. The /play route and its source stay available. */
  playInNavigation: process.env.NEXT_PUBLIC_FEATURE_PLAY_NAV === "on",
} as const;
