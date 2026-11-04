---
description: Run all required checks and draft the PR description
---
1. Run typecheck, Biome, unit tests and build.
2. Run Playwright smoke tests (Chromium and WebKit).
3. Run the bundle-size budget and the dependency-licence gate.
4. Run the zero-outbound-request test.
5. Draft the PR description: summary, perf impact, privacy impact, screenshots at 390x844 and 360x800.
6. Do not merge. List anything that could not be verified (for example, real-device checks).
