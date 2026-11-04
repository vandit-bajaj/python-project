# Testing

- Pyramid: unit (`analysis-core`) > component (Storybook, Testing Library) > E2E (Playwright, Chromium + WebKit, mobile viewports).
- Every analyzer has: synthetic-perturbation tests (score responds monotonically), test-retest tests, cross-lighting tests, and golden fixtures.
- Fixtures are synthetic or explicitly consented.
- Chromium camera E2E uses fake-device flags. WebKit/iOS camera is tested manually; log results in `docs/devices.md`.
- axe-core on every screen. Lighthouse CI mobile budgets enforced.
- A bug fix starts with a failing test.
