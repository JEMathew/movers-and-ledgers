# Play browser evidence — local submission candidate

Captured 17 October 2026 at 14:30 IST against the combined candidate at `http://127.0.0.1:3000/play`, using installed Chromium 149 through bundled Playwright. This is authentic local browser evidence, not a deployment claim.

**Result: 14 checks passed.** See [browser-evidence.json](browser-evidence.json). The checks exercised keyboard movement and proximity interactions at every evidence object; focus and pause/resume; failure for a wrong Bank mapping; correction and optional Demo unlock; touch movement, evidence gating and successful completion at 390 px; desktop/mobile horizontal overflow; the OS reduced-motion preference; and absence of browser errors or API requests.

Reduced motion computes `transition-property: none`. The existing application-wide accessibility rule sets transition duration to `0.01ms` (`1e-05s`) for all elements; it does not reintroduce character interpolation.

## Screenshots

- [Desktop opening](play-desktop-opening.png)
- [Desk evidence paused](play-desktop-paused.png)
- [Ledger evidence](play-desktop-ledger.png)
- [Wrong mapping consequence](play-desktop-failed-mapping.png)
- [Completed mission and Demo unlock](play-desktop-complete.png)
- [390 px mobile opening](play-mobile390-opening.png)
- [390 px mobile completion](play-mobile390-complete.png)
- [Reduced-motion browser](play-reduced-motion.png)

Only the Next.js development indicator was hidden for screenshots. No application content or game controls were hidden or modified. Screenshots were visually inspected. This run did not perform a screen-reader session, an audible sound-quality review or a deployed acceptance test.

[validate-play.cjs](validate-play.cjs) is the reproduction script. It uses the explicitly approved local preview and the installed Chromium1228 executable because the bundled default Chromium1234 is absent. It writes exclusively into this directory and makes no financial API calls.
