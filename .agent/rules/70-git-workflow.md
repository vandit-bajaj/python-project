# Git workflow

- Branches: `feat/p<phase>-<slug>`. One branch per agent run. Never commit to `main`.
- Conventional commits. Squash-merge PRs.
- PR template: perf impact, privacy impact, screenshots at 390x844 and 360x800.
- Required checks: typecheck, Biome, unit, build, Playwright smoke, bundle budget, zero-outbound-request test, dependency-licence gate.
- No force-push on shared branches; no history rewrites on `main`.
- Repo is public and all rights reserved (`LICENSE` carries the notice). The contribution policy is undecided: do not invent one, ask the owner.
