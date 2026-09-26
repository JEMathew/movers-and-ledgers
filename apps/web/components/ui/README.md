# MoveBooks AI UI foundation

The components in this directory are the reusable product and marketing primitives for MoveBooks AI. Import public components from `@/components/ui` rather than from individual files.

Semantic color, spacing, typography, radius, shadow, and motion tokens live in `app/globals.css`. Components should use those tokens instead of adding literal colors. The `.dark` token set is intentionally tuned independently from the light palette.

The global theme provider uses the operating-system preference on first visit and persists an explicit choice. The visual reference route at `/design-system` exercises both themes, product statuses, controls, migration patterns, and agent activity. Keep that route out of public navigation.

Accessibility conventions:

- status treatments always pair an icon with visible text;
- icon-only controls require an accessible `label`;
- focus styles and minimum touch targets come from the shared component classes;
- tabs support arrow, Home, and End keys;
- dialogs use the native modal focus model;
- motion must use the shared durations and remain understandable under `prefers-reduced-motion`.
