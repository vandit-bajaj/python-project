# DermaLens — Project Status

## Overview
- **Current Milestone**: M3 — Report and Visualisation (Phase 5)
- **Current Phase**: Phase 5 — Report and visualisation system
- **Last Updated**: 2026-11-04
- **Branch**: `feat/p4-acne-detection`

---

## Roadmap Phase Checklist

### Phase 0 — Foundations and repo bootstrap (Complete)
- [x] Monorepo setup: pnpm workspace + Turborepo; Node pinned (`.nvmrc`, `packageManager`).
- [x] Scaffold `apps/web` (Next.js App Router, React 19, strict TypeScript, Tailwind v4, shadcn/ui tokens).
- [x] Stub workspace packages: `packages/analysis-core`, `packages/ui`, `packages/models`.
- [x] Tooling: Biome, Vitest, Playwright (Chromium + WebKit mobile), lefthook + commitlint.
- [x] GitHub Actions CI: frozen install, typecheck, lint, test, build, Playwright smoke, bundle-budget check, licence gate.
- [x] Dependency-licence gate: allow MIT, Apache-2.0, BSD, ISC; block GPL/AGPL.
- [x] Public repo hygiene: `.gitignore` preventing face photos, datasets, credentials; fixtures policy.
- [x] Security headers & CSP: strict `default-src 'self'`, `connect-src 'self'`, `worker-src 'self' blob:`, `img-src 'self' data: blob:`, `wasm-unsafe-eval`, `X-Robots-Tag: noindex`.
- [x] Design tokens: CSS variables for colours, type, spacing, radius, safe-area insets, `100dvh`.
- [x] Copy module: `content` module in `apps/web` (English only, cosmetic non-diagnostic language).
- [x] ADRs: ADR-0001 (on-device architecture), ADR-002 (analyzer interface), ADR-003 (worker boundary), ADR-004 (state & storage).
- [x] Docs & hygiene: `README.md`, `CONTRIBUTING.md`, `.github/pull_request_template.md`, `LICENSE` (All Rights Reserved).
- [ ] Vercel deployment setup *(Pending human setup: see `docs/HUMAN-TODO.md`)*.
- [ ] Test devices recorded & baseline benchmarks *(Pending human setup: see `docs/HUMAN-TODO.md`)*.

### Phase 1 — Mobile capture and quality gate (Complete)
- [x] Permission primer & recovery states (denied, blocked in settings, no camera).
- [x] Mobile camera pipeline (`useCamera`) with strict teardown on unmount, pagehide, and `visibilitychange`.
- [x] Face-guide SVG overlay with live feedback and dynamic status border.
- [x] Pure quality checks in `packages/analysis-core/src/quality/`:
  - Laplacian variance blur check.
  - Histogram shadow/highlight clipping exposure check.
  - Gray-world color cast divergence check.
  - Quality evaluation aggregator with user-facing guidance.
- [x] Auto-capture on consecutive good frames + manual shutter fallback.
- [x] Downscaled upload path with client-side EXIF correction and quality validation.
- [x] In-memory-only frame lifecycle (`CapturedFrame`).
- [x] Automated Playwright camera flow test with fake camera flags (`--use-fake-device-for-media-stream`).
- [ ] Physical device verification logged in `docs/HUMAN-TODO.md` *(Pending device verification)*.

### Phase 2 — Face geometry and region engine (Complete)
- [x] Web Worker + Comlink RPC pipeline.
- [x] 8 facial region index sets (forehead, cheeks, nose, chin, perioral, under-eyes, T-zone, U-zone) + debug visualizer.
- [x] Morphological skin mask excluding hair, eyes, lips, nostrils.
- [x] Iris scale normalisation (px -> mm).
- [x] Canonical UV unwrap and normalisation pipeline.
- [x] Color pipeline: sRGB -> linear -> CIELAB color space conversions.
- [x] Dev-only visualizer screen at `/debug/regions`.
- [x] Milestone 1 Report published (`docs/reports/M1.md`).

### Phase 3 — Analyzers v1 (classical CV) (Complete)
- [x] Core analyzer: Redness (CIELAB a* elevation within skin mask, area fraction + intensity).
- [x] Core analyzer: Pigmentation (Individual Typology Angle ITA° + dark spot local contrast via Difference of Gaussians).
- [x] Core analyzer: Oiliness (Specular highlight reflection detection: high L*, low chroma, T-zone weighted).
- [x] Core analyzer: Texture / Pores (High-frequency energy via Laplacian filter normalized by physical mm scale).
- [x] Beta tier: Wrinkles (Ridge filtering in forehead / periorbital regions).
- [x] Beta tier: Dark circles (Periorbital L*/chroma relative to cheek baseline).
- [x] Aggregate scoring layer & confidence weighting derived from quality report.
- [x] Synthetic-perturbation tests: monotonic score response for all 6 concerns.
- [x] Register analyzers in Web Worker pipeline.
- [x] Dev-only visualizer screen at `/debug/analyzers` with mobile screenshots at 390x844 and 360x800.

### Phase 4 — Acne detection (classical v1) (Complete)
- [x] Classical DoG/blob detection at iris-scaled lesion sizes (~1.2 mm radius).
- [x] Heuristic false-positive suppression: rejects specular highlights, hair lines, non-erythematous freckles, and boundary artifacts.
- [x] UV-space lesion map, blemish count, and non-diagnostic cosmetic severity banding ("Minimal", "Mild", "Moderate", "Marked").
- [x] Per-skin-tone contrast adjustment and confidence scaling for Fitzpatrick IV–VI tones.
- [x] Milestone 2 Report published (`docs/reports/M2.md`).

### Phase 5 — Report and visualisation system (Planned)
- [ ] Minimalist mobile report layout
- [ ] Perceptually uniform heatmaps & SVG score rings
- [ ] Storybook components & automated a11y testing
- [ ] Pure client-side PDF export

### Phase 6 — 3D face view (Planned)
- [ ] Canonical face-mesh Three.js viewer (lazy-loaded chunk)
- [ ] UV heatmap texture blending shader & touch orbit controls

### Phase 7 — Local history and progress (Planned)
- [ ] Local-first Dexie (IndexedDB) schema with migrations
- [ ] History comparison & trend charts; Safari eviction warning

### Phase 8 — Hardening and launch (Planned)
- [ ] Real-device performance verification & bundle optimization
- [ ] Full a11y & security audit; zero-outbound-requests verification
- [ ] Legal & disclaimers review; production domain & launch readiness

---

## Decisions Made
- **D1**: Concerns tracked — redness, oiliness, pores/texture, acne/blemishes, pigmentation (core); wrinkles and dark circles (beta tier).
- **D2**: Classical CV first; ML detector slots in behind uniform interface.
- **D3**: Free public product; permissive dependencies only.
- **D4**: Reference mobile tiers (iOS Safari + mid-range Android Chrome).
- **D5**: Pure on-device processing; zero telemetry, zero uploads.
- **D6**: English-only launch.
- **D7**: Fast-pace development via autonomous agent operating loop.
- **D10**: Local-first storage with optional thumbnail opt-in.
- **D12**: Public GitHub repo with All Rights Reserved proprietary license.
- **D13**: `X-Robots-Tag: noindex` until launch.

## Decisions Open (Ask in Phase 8)
- **D8**: Custom domain.
- **D9**: Target market (India-first vs global scope).
- **D11**: Analytics / error tracking (default is none).

## Blockers
- None.

## Next Action
- Write `docs/plans/p5.md` and implement Phase 5 (Report and visualization system).

## Last-Session Summary
- Milestone 2 completed and verified (Phases 3 and 4 complete).
- Implemented `AcneAnalyzer` with iris-scaled lesion detection, false-positive suppression (specular shine, hairs, flat freckles), cosmetic severity banding, and tone adjustment.
- Updated aggregation layer and Web Worker pipeline to execute all 7 analyzers concurrently in ~35-45 ms.
- 41 unit tests and 9 E2E Playwright tests passing with zero external outbound requests.
- Published Milestone 2 report: `docs/reports/M2.md`.
