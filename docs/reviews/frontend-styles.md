# Frontend styling recovery — 2026-09-29

Branch: `fix/frontend-styles`; baseline `1b6b150` (merged PR #15).
Scope: local frontend asset loading only. No design, copy, dependency, business, agent,
backend, authentication, IAM or cloud-runtime changes.

## Root cause and reproduction

The still-running Next.js 15.5.26 development server and `next build` both used `.next`.
Production build cleanup replaces assets that the development server continues to reference.
The original open page had a stylesheet link but **zero CSS rules**, a transparent body and
the browser's default Times font. Reload initially regenerated/restored 144 top-level CSS
rules and the intended Inter/system font stack without any source change.

The collision was then reproduced before editing source: the development stylesheet
`/_next/static/css/app/layout.css` returned HTTP 200 (39,999 bytes); after the required
production build, the same URL returned **404**, and the output directory contained only
the hashed production stylesheet. The dev process had started on September 28 at 19:24;
the existing production BUILD_ID was written that night at 23:45. This is a reproducible
build-output collision, not evidence of a broken Tailwind compiler. The original browser's
failed network transaction was not retained; its precise timing/status is not reconstructed.

Inspected root layout/global import, full global styles/semantic tokens, shared navigation,
theme provider/toggle, Next/PostCSS configuration, package/lockfile, installed dependency
versions, generated CSS and PR #15 frontend diff. Tailwind v4 uses the CSS-first import
and `@tailwindcss/postcss`; no legacy Tailwind config is required. Installed versions match
the lockfile. PR #15 did not change layout, global CSS, Next/PostCSS configuration or dependencies.

## Minimal fix

- `apps/web/next.config.ts`: phase-aware `distDir`; development uses `.next-dev`, while
  production build/start retain `.next` and the same standalone output contract.
- `.gitignore`, `.dockerignore`, `apps/web/eslint.config.mjs`: exclude the new generated cache
  just like `.next`, preventing accidental commits/context uploads or linting generated code.
- `apps/web/tsconfig.json`: include generated development route types, alongside production types.
- `apps/web/test/next-config.test.ts`: two regression tests assert isolated development output
  and unchanged production build/start configuration.
- This review record. No CSS, components, product copy or package-lock edits.

Uses the supported [Next.js distDir option](https://nextjs.org/docs/pages/api-reference/config/next-config-js/distDir).
No dependency upgrade or new styling system is needed. Restart an old dev process once after
pulling this configuration, then reload tabs that still reference its old assets.

## Verification

After restarting only the local frontend with isolated development output, ran a complete
production build while the dev server remained running. The **same dev CSS URL remained
HTTP 200**, 40,040 bytes, with identical before/after SHA-256:
`49b9246d8d81b9e9c5ac6a51c7650d01cbe1d91b8b42dcf30deac524238e7350`.

- 96 frontend tests passed (94 existing plus two config regression tests).
- ESLint, TypeScript, production build passed; 25 pages generated.
- Repository/Markdown link and whitespace checks passed.
- All nine routes loaded the global stylesheet after the concurrent production build:
  `/`, `/product`, `/simulator`, `/learn`, `/play`, `/guide`, `/trust`, `/feedback`, `/support`.
  Each had 144 top-level CSS rules, the expected font stack and no horizontal overflow.
- Visually inspected `/`, `/product`, `/play`, `/learn`, `/guide` at 1440×1000 and 390×844,
  in light and dark themes: navigation, headings, spacing, cards, buttons and badges render
  using the existing design system. No horizontal overflow in those 20 combinations.
- Mobile navigation opens using Enter, fits inside 390px, and Tab focuses Product with a
  visible 3px theme-colored outline. Theme switching works; Lucide icons remain present.
- Design-system status specimens retain text plus icons (not color alone), with green success,
  amber warning, red blocked, blue information and grey neutral in both themes. The existing
  violet agent accent is unchanged; this loading fix does not recolor the design system.
- The compiled reduced-motion media rule remains present and unchanged; this was not a new
  OS-level reduced-motion or assistive-technology certification.
- Browser viewport override reset after verification. Local frontend remains available on
  port 3000 for review. No deployment, cloud startup or merge occurred.

## Outcome

**GREEN for this frontend asset-loading correction. P0=0 / P1=0 unresolved findings** in the
scoped review. No remaining missing-style issue observed. Visual checks cover the named surfaces
and sizes, not every browser/device or business workflow. Recommend reviewing the small config
diff and publishing it for normal PR/CI review; do not automatically merge.
