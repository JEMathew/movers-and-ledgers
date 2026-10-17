# End-to-end journey evidence — product commit `fa13e9e`

**Environment: Local** (sandbox, 18 Oct 2026). Real UI against the real FastAPI backend from the same tree; demo identity; in-memory persistence; `model_mode: deterministic-only`. Nothing is mocked. Not the deployed candidate, not live Gemini, not Google sign-in.

Script: [`final-journey.cjs`](../../../browser-journey/final-journey.cjs). Each run creates fresh synthetic migrations through UI buttons only.

| Run | Result | Contents |
|---|---|---|
| `full-page/` | PASSED, 21 checks | Full-page screenshots of every stage; `browser-evidence.json` (events, checks, API method/path/status) |
| `recording/` | PASSED, 21 checks, 214.9 s | Trace for [`movebooks-demo.mp4`](../../../assets/movebooks-demo.mp4) (3:43.7, H.264 1440×1000), captions, `video-manifest.json` (SHA-256), QA contact sheet |

Checks cover: landing; demo sign-in and sample selection; discovery and readiness; independent second opinion on `1200 · Misc Clearing` (labelled deterministic, not live AI); user-requested advice labelled fallback; all 12 mappings reviewed; separate plan approval; controlled duplicate exception → human-approved resolution → checkpoint retry → completion; 17 deterministic validation checks; 8 configuration areas with sensitive approvals; onboarding; invoice contract, owner approval, posting and **Verified First Productive Use (USD 100.00 + 7.25 tax = 107.25)**; My Migration completed state; Evidence & Results and an explicit read-only AI activity check (reports tracking off); a second migration; picker lists both; switching; restoration after reload; picker after clearing browser memory; fresh browser context lists both without local memory; architecture segment labelled as source evidence; no browser runtime errors.
