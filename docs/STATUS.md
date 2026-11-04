# DermaLens — Project Status

## Overview
- **Current Milestone**: M2 — Analysis (Phases P3–P4)
- **Current Phase**: Phase 4 — Acne detection (classical v1)
- **Last Updated**: 2026-11-04
- **Branch**: `feat/p3-analyzers-v1`

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
- [x] Camera stream pipeline & teardown (`visibilitychange`, unmount, route change, camera light off).
- [x] Live face-guide overlay with actionable guidance feedback ("move closer", "face the light", "hold still").
- [x] Pure quality-gate metrics in `packages/analysis-core`: single face, size/distance, yaw/pitch/roll, blur (Laplacian variance), exposure (clipping), colour cast (gray-world deviation).
- [x] Auto-capture after N consecutive good frames, plus a manual shutter fallback.
- [x] Downscaled EXIF-fixed upload pipeline with the same quality gate.
- [x] In-memory `CapturedFrame { bitmap, size, source, qualityReport }` lifecycle (no persistence of raw frames).
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

### Phase 4 — Acne detection (classical v1) (Planned)
- [ ] Classical DoG/blob detection at iris-scaled lesion sizes
- [ ] Heuristic false-positive suppression
- [ ] UV-space lesion map & blemish count output

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
- **D1**: All concerns covered (acne, redness, pigmentation, oiliness, texture/pores, wrinkles, dark circles).
- **D2**: Classical CV first for acne, ML later (Phase 4b).
- **D3**: Free public product.
- **D4**: iPhone and Android tested; mid-range reference devices to be logged.
- **D5**: PDF export, generated client-side.
- **D6**: English only.
- **D7**: Under 10 hours/week, no fixed date.
- **D10**: Regular website only (no PWA or offline service worker).
- **D12**: Public GitHub repo, All Rights Reserved.
- **D13**: Ship everything at once at v1.0 (no staged public beta).

## Decisions Open (Ask in Phase 8)
- **D8**: Custom domain.
- **D9**: Target market (India-first vs global scope).
- **D11**: Analytics / error tracking (default is none).

## Blockers
- None.

## Next Action
- Write `docs/plans/p4.md` and implement Phase 4 classical acne detection (`@dermalens/analysis-core`).

## Last-Session Summary
- Milestone 1 achieved (Phases 0, 1, 2 complete).
- Implemented Phase 3 classical CV analyzers in `@dermalens/analysis-core`:
  - Core Tier: Redness, Pigmentation (ITA° + DoG spots), Oiliness (specular highlights), Texture (physical-scale Laplacian).
  - Beta Tier: Wrinkles (ridge detection, capped confidence), Dark Circles (periorbital contrast vs cheek, capped confidence).
  - Scoring & Aggregation: composite skin index and concern ranking.
  - Worker pipeline: integrated all analyzers with shared CIELAB computation.
  - Playwright visualizer at `/debug/analyzers` with zero outbound requests.
- All 36 unit tests and 9 E2E tests passing across Chromium and WebKit mobile viewports.
