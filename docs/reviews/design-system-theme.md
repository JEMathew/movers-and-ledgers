# Design-system theme review

Review date: 2026-09-27

Branch: `feature/design-system-theme`

Baseline commit: `ef1b752`

## Review outcome

The initial multi-perspective review identified no P0 findings and four P1 findings. All four P1 findings were remediated and re-reviewed. The remaining P2/P3 items are documented follow-ups and do not block this design-system PR.

| ID | Reviewer | Finding and evidence | Why it matters | Severity | Recommended fix and status |
| --- | --- | --- | --- | --- | --- |
| DSR-001 | UX / Demo | `components/Nav.tsx` hid the complete primary navigation below the `md` breakpoint without a mobile alternative. | Mobile users could not reach Learn, Play, Simulator, or Workspace. | P1 | Added a keyboard-accessible native disclosure menu with the same destinations. Verified at a 390 px viewport. **Resolved.** |
| DSR-002 | Architecture / UX | The shared `Button` inherited the HTML default `type="submit"`. | A reusable action button placed in a form could trigger an unintended submission or consequential workflow action. | P1 | Default `Button` to `type="button"` while preserving an explicit `type="submit"` override. Added a regression test. **Resolved.** |
| DSR-003 | Accessibility / UX | `Select` accepted an `error` prop but did not expose or render it; field help inside a wrapping label could also be included in the accessible name. | Users could miss why a field is invalid, and screen-reader names could become noisy or misleading. | P1 | Rendered select errors, set `aria-invalid`, connected help with `aria-describedby`, and separated labels from help text for both Input and Select. Added a regression test. **Resolved.** |
| DSR-004 | Accessibility / Product consistency | Completed/current stepper state and agent activity state depended on visual icon/color treatment. | Screen-reader users did not receive the same migration and agent-state information. | P1 | Added explicit screen-reader text for completed/current steps and completed/in-progress agent activity. Added regression tests. **Resolved.** |
| DSR-005 | Security | `npm audit --omit=dev` reports an existing Next.js/PostCSS advisory (two vulnerabilities: one moderate and one high). The automated remediation upgrades to Next.js 16. | The advisory must stay visible, but a major framework upgrade has a larger regression surface than this design-system change. No path that processes attacker-controlled CSS or source maps was identified in this application. | P2 | Track a separate Next.js 16 upgrade with regression analysis. Do not use `npm audit fix --force` in this PR. **Open follow-up.** |
| DSR-006 | Security / Product | `/design-system` is intentionally reachable by direct URL, though it is absent from public navigation. | Internal QA references should not be promoted by search engines; the route contains no secrets or privileged operations. | P3 | Added `noindex, nofollow` route metadata. **Resolved.** |
| DSR-007 | UX | The CSS-only tooltip is centered on its trigger and does not perform viewport-edge collision handling. | A long future tooltip near a narrow viewport edge could clip. Current copy and placement do not clip in the showcase. | P2 | Introduce collision-aware positioning only when product usage requires edge placement. **Open follow-up.** |
| DSR-008 | Architecture | Tokens and component styles currently share one global stylesheet. | This is simple and appropriate at the current size, but continued product growth could increase coupling and review cost. | P3 | Split token, primitive, and product-pattern layers when adoption creates a concrete maintenance need. **Open follow-up.** |

## Perspective re-review

- **Product consistency:** Statuses use icon, label, and restrained semantic color. Product, Simulator, Play, Learn, and Trust share one visual language without decorative AI effects.
- **UX:** Mobile navigation is restored; light/dark hierarchy, progressive disclosure, feedback, loading, empty, error, approval, and migration patterns remain coherent.
- **Accessibility:** Focus is visible; controls are labelled; tabs support arrow/Home/End navigation; native dialog focus and Escape behavior work; field errors and non-color state text are exposed; reduced motion preserves meaning.
- **Architecture:** Tokens remain centralized, public components export through one entry point, theme boundaries remain compatible with server-rendered Next.js, and no speculative abstraction was added.
- **Security:** No secrets or dangerous HTML patterns were found. Theme preference uses `next-themes` local persistence without sensitive data. The dependency advisory remains explicitly deferred as DSR-005.
- **Motion:** Motion uses shared timing tokens for interaction, UI, and narrative state. Constant movement is limited to loading indicators and skeletons; `prefers-reduced-motion` reduces animation and transition duration.
- **Demo:** The showcase communicates financial trust, migration status, agent activity, warnings, approvals, and validation outcomes in both themes and at responsive sizes.

## Readiness

- Unresolved P0: **0**
- Unresolved P1: **0**
- Unresolved P2: **2**
- Unresolved P3: **1**

Merge recommendation: **GREEN**, subject to successful CI and human approval. Do not merge automatically.
