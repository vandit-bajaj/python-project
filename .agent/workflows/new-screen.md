---
description: Build a mobile-first screen with tokens, story and a11y checks
---
1. Plan at 390 px width first; describe the layout and states (loading, empty, error).
2. Use tokens from `packages/ui`; add no hard-coded colours or spacing.
3. Put all copy in the `content` module (English only, cosmetic framing).
4. Build the components with a Storybook story per state.
5. Run axe checks; fix all violations.
6. Capture screenshots at 390x844 and 360x800 (light and dark) as artifacts.
7. Run `/perf-check` if the screen adds dependencies or heavy rendering, then `/pre-pr`.
