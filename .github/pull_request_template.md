## Summary
<!-- Brief description of the changes in this PR and the phase/feature addressed -->

## Related Roadmap Phase / Issue
<!-- E.g., Phase 0: Monorepo skeleton, or Closes #... -->

## Architecture Decision Record (ADR)
<!-- Link to relevant ADR in docs/adr/ if introducing new patterns, dependencies, or architectural shifts -->

## Privacy Impact
- [ ] Confirmed zero outbound requests touching face photos, pixels, landmarks, or results.
- [ ] CSP and Permissions-Policy verified.
- [ ] No real face images, datasets, or secrets committed.
- [ ] Dependency license gate passes (permissive licenses only: MIT, Apache-2.0, BSD, ISC).

## Performance Impact
- **Initial JS Bundle**:
- **Landing LCP**:
- **Lazy Loading**: Confirmed MediaPipe, Three.js, and PDF libs are not in initial bundle.

## Mobile Viewport Screenshots
<!-- Required for UI changes: capture at 390x844 (iPhone) and 360x800 (Android) -->
| Viewport | Light Theme | Dark Theme |
|---|---|---|
| iPhone (390x844) | <!-- image --> | <!-- image --> |
| Android (360x800) | <!-- image --> | <!-- image --> |

## Pre-Merge Checklist
- [ ] `pnpm typecheck` passed cleanly
- [ ] `pnpm check` (Biome lint & format) passed
- [ ] `pnpm test` (Unit tests) passed
- [ ] `pnpm test:e2e` (Playwright smoke + zero-outbound-requests) passed
- [ ] `docs/STATUS.md` updated
