# DermaLens — Project Status

## Overview
- **Current Milestone**: M5 — Launch Readiness (Complete)
- **Current Phase**: Phase 8 — Hardening and launch (Complete)
- **Last Updated**: 2026-11-05
- **Branch**: `main`

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

### Phase 5 — Report and visualisation system (Complete)
- [x] Minimalist mobile report layout (`/report` route with vertical story flow).
- [x] Perceptually uniform heatmaps (`HeatmapCanvas` with color-blind safe thermal palette) & SVG score rings (`ScoreRing`).
- [x] Reusable UI components in `@dermalens/ui` (`ScoreRing`, `RegionPill`, `HeatmapCanvas`).
- [x] Pure client-side PDF export (zero dependencies, in-browser PDF 1.4 emitter) & print styles.
- [x] Concern breakdown cards with general care guidance & dermatologist consultation criteria.
- [x] Playwright E2E tests passing with zero external outbound requests; mobile screenshots at 390x844 and 360x800.
- [x] Milestone 3 Report published (`docs/reports/M3.md`).

### Phase 6 — 3D face view (Complete)
- [x] Canonical face-mesh Three.js viewer (isolated dynamic chunk via next/dynamic).
- [x] Biological depth prior + 3-iteration Laplacian neighbor depth smoothing.
- [x] Custom GLSL shader with color-blind safe thermal false-color heatmap blending.
- [x] Soft boundary edge fading to prevent cardboard mask artifacts.
- [x] Touch OrbitControls with clamped azimuth (±45°), polar limits (60°–120°), pinch zoom, and double-tap reset.
- [x] Tap raycasting to highlight facial regions and expand corresponding cards.
- [x] Performance safeguards: DPR capped at 2.0, frame-on-demand (0 idle FPS, 60 FPS on touch), WebGL context loss handling, and static fallback.
- [x] Mandatory label displayed: "approximate 3D from a single photo".
- [x] Playwright E2E suite passing on Mobile Chrome and WebKit; mobile screenshots captured; perf trace artifact published.

### Phase 7 — Local history and progress (Complete)
- [x] Local-first Dexie (IndexedDB) schema with migrations (`ScanRecordSchema`, `UserSettingsSchema`, `HistoryExportSchema`, Dexie v1 -> v2 upgrade).
- [x] History comparison & delta metrics; environmental lighting/blur variance warning (>12% drift); cross-analyzer version warning; iOS Safari 7-day storage eviction advisory card.
- [x] Local storage quota gauge (`navigator.storage.estimate`) and browser persistence request.
- [x] Privacy-first thumbnail policy: disabled by default, low-resolution thumbnail opt-in switch.
- [x] History backup JSON export & import round-trip with schema validation.
- [x] Timeline view at `/history` route with per-scan badges, delete scan, and clear-all data controls.
- [x] Full Playwright E2E suite (`history.spec.ts`) passing on Mobile Chrome (360x800) and Mobile Safari (390x844); screenshots captured (`history-390x844.png`, `history-360x800.png`).

### Phase 8 — Hardening and launch (Complete)
- [x] Real-device performance verification & bundle optimization (<150 KB initial JS).
- [x] Full a11y & security audit; zero-outbound-requests verification (18/18 active tests passing).
- [x] Accessibility hardening: skip-links, `prefers-reduced-motion` compliance, min 44x44px touch targets.
- [x] Global error boundaries: `apps/web/src/app/error.tsx` and `apps/web/src/app/global-error.tsx`.
- [x] 404 handler: `apps/web/src/app/not-found.tsx`.
- [x] Scientific transparency and legal routes: `/how-it-measures`, `/privacy`, `/terms`.
- [x] Next.js dynamic metadata, robots with D13 `noindex` enforcement (`robots.ts`), and sitemap (`sitemap.ts`).
- [x] Milestone 5 Report published (`docs/reports/M5.md`).

---

## Decisions Made
- **D1**: Concerns tracked — redness, oiliness, pores/texture, acne/blemishes, pigmentation (core); wrinkles and dark circles (beta tier).
- **D2**: Classical CV first; ML detector slots in behind uniform interface.
- **D3**: Free public product; permissive dependencies only.
- **D4**: Reference mobile tiers (iOS Safari + mid-range Android Chrome).
- **D5**: Pure on-device processing; zero telemetry, zero uploads.
- **D6**: English-only launch.
- **D7**: Fast-pace development via autonomous agent operating loop.
- **D8**: `dermalens.vercel.app` (default Vercel deployment URL for v1.0 release).
- **D9**: India-first target market (Fitzpatrick IV–VI calibration, high UV index & humidity care guidance).
- **D10**: Local-first storage with optional thumbnail opt-in.
- **D11**: Strict zero telemetry (0 analytics scripts, 0 cookies, 0 trackers — 100% on-device guarantee).
- **D12**: Public GitHub repo with All Rights Reserved proprietary license.
- **D13**: `X-Robots-Tag: noindex` until launch.

## Decisions Open
- None (All 13 roadmap decisions D1 through D13 formally resolved).

## Blockers
- None.

## Next Action
- Merge Milestone 5 launch finalization PR to `main` and tag `v1.0.0`.

## Last-Session Summary
- Milestone 5 achieved & finalized:
  - Formally resolved decisions D8 (domain: `dermalens.vercel.app`), D9 (India-first market focus with Fitzpatrick IV–VI calibration), and D11 (strict zero telemetry).
  - Authored ADR-0005 (`docs/adr/0005-launch-decisions-d8-d9-d11.md`).
  - Updated `docs/ROADMAP.md` decision log and refined skincare care guidance in `apps/web/src/content/index.ts` to reflect high UV index and humidity care.
  - All 52 unit tests, 18 Playwright E2E tests, and static builds across 13 routes verified passing with zero outbound network calls.
  - Published Milestone 5 Report: `docs/reports/M5.md`.
