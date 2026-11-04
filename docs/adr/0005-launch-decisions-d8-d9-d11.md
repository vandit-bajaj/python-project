# ADR 0005: Launch Decisions — Domain, Target Market, and Telemetry (D8, D9, D11)

- Status: accepted
- Date: 2026-11-05

## Context
As DermaLens reached Milestone 5 (Launch Readiness) and completed Phase 8, the three previously undecided roadmap decisions required formal architectural resolution:
- **D8**: Production domain for deployment.
- **D9**: Target market focus and regional calibration emphasis.
- **D11**: Analytics, telemetry, and error tracking policy.

## Decisions

### 1. D8: Production Domain (`dermalens.vercel.app`)
- We deploy to Vercel's standard domain `https://dermalens.vercel.app` for the v1.0 release.
- A custom domain can be mapped in future phases without architectural changes.
- Pre-launch `X-Robots-Tag: noindex` will remain until official launch cutover.

### 2. D9: Target Market Focus (India-First)
- DermaLens will launch with an **India-first** focus while retaining English-language accessibility.
- The skin analysis pipeline calibrates its Individual Typology Angle (ITA°) baseline and contrast normalization specifically for Fitzpatrick phototypes IV through VI (common in South Asian populations).
- Cosmetic guidance copy highlights challenges prevalent in tropical and subtropical Indian climates: intense solar UV index, high humidity-induced sebum/shine, and post-inflammatory hyperpigmentation (PIH).
- Medical notices and disclaimer terminology align with the Digital Personal Data Protection (DPDP) Act principles of local data processing and non-diagnostic cosmetic clarity.

### 3. D11: Analytics & Telemetry (Strict Zero Telemetry)
- We maintain our strict **Zero Telemetry** principle by construction.
- No third-party or first-party analytics scripts (e.g. Google Analytics, Plausible, Vercel Web Analytics, Sentry) are injected into the application.
- The CSP continues to prohibit all outbound egress (`connect-src 'self'`).
- Crash recovery is handled gracefully client-side via React error boundaries without external reporting.

## Consequences
- **Positive**:
  - Reinforces DermaLens' core differentiator as a completely private, zero-data-collection application.
  - Tailors recommendations to South Asian skin profiles and climate realities, reducing algorithmic bias.
  - Keeps operational infrastructure costs at zero.
- **Negative**:
  - Product usage, retention, and drop-off cannot be measured directly through telemetry; user feedback must be collected out-of-band via consented channels.
