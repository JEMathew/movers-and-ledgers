# UX principles

MoveBooks AI should feel calm, accountable, and comprehensible when the underlying work is complex. Preserve the current design system rather than introducing product-specific visual languages.

## Visual language

- Light/day: white + blue.
- Dark/night: near-black / graphite + blue.
- Green: success.
- Amber: warning or decision needed.
- Red: blocker or error.
- Blue: primary action, information, or agent activity.
- Grey: pending or neutral.

State must never be communicated by color alone. Pair color with plain-language text and, where useful, iconography or structure. Use shared semantic tokens and components; do not encode meaning with one-off literal colors.

## The three questions

Every meaningful screen should answer:

1. What is happening?
2. Why is it happening?
3. What do I need to do next?

For consequential decisions, also show impact, evidence, alternatives, reversibility, approval state, and accountable actor.

## Experience priorities

Optimize for comprehension, trust, user control, visible progress, transparent risk, low cognitive load, and accessibility. Prefer progressive disclosure over hidden state or dense dashboards. A user should be able to distinguish observed facts, recommendations, automated actions, pending approvals, blockers, and verified outcomes.

Keyboard operation, visible focus, meaningful labels, error association, non-color status cues, responsive layout, and assistive-technology semantics are release requirements. Dialogs must manage focus; tabs must follow expected keyboard patterns; touch targets and reading order must remain usable at supported sizes.

## Motion and feedback

Motion must communicate state, progress, or causality—not decoration. Use the shared motion conventions and preserve meaning when `prefers-reduced-motion` is enabled. Continuous motion is reserved for genuinely active progress and must stop when the state changes.

Actions need immediate, persistent-enough feedback. Loading, empty, success, warning, error, blocked, approval, and recovery states must explain both status and next step.

The `/design-system` route is the internal visual QA reference. Keep it out of public navigation and search indexing. See [the component guidance](../apps/web/components/ui/README.md) for implementation conventions.
