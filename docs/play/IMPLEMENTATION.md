# Play — The clearing question

Implemented opening mission at the existing `/play` route. This follows Experience C in the final delivery directive. The untracked v1.1 case-desk proposal in the original checkout was read and left untouched; its suggested pixel-art deferral is superseded by that directive.

## Customer outcome

A nontechnical visitor plays Eli, a male accountant, in a small Harbor Light bookkeeping office. A fictional maintenance-support deadline and repeated bank-export repairs give a credible reason to assess migration. Mara's dialogue asks the player to investigate before mapping.

The player walks around furniture and collects the desk engagement note, ledger and filing-cabinet settlement statement. At the laptop, reconcile $500.00 received minus $475.00 settled, then choose where the remaining $25.00 belongs. Bank mapping fails because the processor still holds it; income mapping fails because sales were already recorded. The passing choice is Processor Clearing, an Other Current Asset. All three evidence items, the amount and the account meaning must pass. Failed attempts preserve evidence and allow correction. Success unlocks an optional **Explore Demo** link to `/simulator`.

This is a Play-only illustrative accounting fixture, separate from the canonical Harbor Light financial fixture. The account number/name connects the lesson to the product's ambiguous 1200 scenario; the mission's amounts are not asserted as the canonical demo balance.

## Implementation and boundaries

- `components/play/engine.ts`: deterministic reducer, grid collision, evidence collection, exact integer-cent parsing, readiness gates and failure consequences.
- `components/play/OfficeMission.tsx`: interactive pixel office, dialogue/notebook, mapping controls and input dispatch.
- `components/play/OfficeMission.module.css`: scoped code-native pixel art, responsive layout, OS reduced-motion behavior.
- `components/public-surfaces/Play.tsx`: existing public route surface, now hosts the mission.

All game state exists only in component memory. No fetch, identity, finance, approvals, analytics, local-storage or session-storage dependency is introduced. The puzzle never approves mappings, performs provider writes, creates migration sessions, invokes Gemini or claims financial completion. A refresh/restart resets the mission; pause/resume preserves progress during the current visit.

## Controls and accessibility

- Arrow keys / WASD walk; E or Space inspects the adjacent object; P pauses; Escape closes evidence (or pauses in the office).
- Focus the office to move. Object interaction focuses a document heading; closing evidence returns focus to the office. Form typing never moves the player.
- Click/tap an object to approach and inspect, or use native object shortcuts under the office. These collect the same evidence through the same reducer.
- A labeled touch direction pad supports walking on mobile; all controls have native accessible names. Shortcut buttons and textual evidence provide an alternative to spatial navigation.
- Evidence and success/failure use text, not color alone. Live status explains consequences.
- Sound is off by default, can be toggled, and uses short optional browser-generated interaction tones. Pause suspends sound. Leaving the browser tab pauses the mission.
- The CSS media query for `prefers-reduced-motion: reduce` removes character-position interpolation. No flashing effects, timers or continuous animation.

## Validation

- `npm test`: **47 files / 603 tests passed**, including **20 gameplay tests**.
- `npm run typecheck`: passed.
- `npm run build`: passed (Next.js production compilation and route generation).
- No deployment or browser session was performed in this worktree; the delivery integrator owns browser evidence against the combined candidate.

Gameplay tests cover reachable office objects, wall/furniture collision, spatial/shortcut parity, pause and tab hiding, focus, touch input, no network or storage effects, evidence gating, invalid decimal amounts, wrong amount/bank/income consequences, correction, Demo unlock, final-state locking and restart. The superseded three-question-quiz test now verifies the new isolated opening mission.

## Quick browser walkthrough

1. Open `/play`, choose **Start mission**.
2. With the office focused, ArrowUp four times then E opens the desk notice. Escape returns to walking.
3. For a short demonstration, expand **Object shortcuts · keyboard, touch & screen reader**, then inspect ledger, filing cabinet and laptop. Directly clicking the corresponding objects also works.
4. Enter `25.00`; choose **Operating Bank · Bank asset**; run the check to show the bank reconciliation failure.
5. Change the destination to **Processor Clearing · Other Current Asset**, run the check, and show **Mission complete · Demo unlocked** and **Explore Demo**.
6. Pause/resume and the sound toggle are in the mission toolbar. Restart returns to the opening state.

Keyboard-only walking route from the start: Up ×4, E (desk), Escape; Down, Right ×4, E (ledger), Escape; Right ×6, Up, E (cabinet), Escape; Left, Down ×2, E (laptop). The office label exposes Eli's grid coordinates for assistive technology and validation.

## Release truth

This delivers one opening mission only. No future mission is implied. Completion demonstrates a practice judgment, not migration readiness, an authenticated approval or Verified First Productive Use. The unlock opens the existing public Explore Demo route. Browser/mobile presentation, assistive-technology behavior and audible output still require delivery-candidate browser validation before being described as verified.
