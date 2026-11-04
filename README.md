# DermaLens

> **On-device face skin analysis for mobile web.** Camera or photo upload → on-device computer vision → detailed visual report + 3D face view. **Photos never leave the device.**

[![CI](https://github.com/vandit-bajaj/python-project/actions/workflows/ci.yml/badge.svg)](https://github.com/vandit-bajaj/python-project/actions/workflows/ci.yml)
[![Status](https://img.shields.io/badge/status-pre--release%20(v0.6%20draft)-blue)]()
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)]()

---

## Notice: Pre-Release & Proprietary Source

This repository is public to demonstrate engineering architecture, on-device AI techniques, and code quality. **All rights are reserved.** You may view and review the source code for personal evaluation. No permission is granted to reproduce, distribute, deploy, or commercially exploit this software without written authorization.

### Important Disclaimer
**DermaLens provides cosmetic measurement indices and cosmetic insights only. It is NOT a medical device, does not provide medical advice, and does not diagnose, treat, prevent, or cure any skin condition or disease.** Users with medical skin concerns should consult a certified dermatologist.

---

## Architectural Principles

1. **On-Device by Construction**: Zero server image uploads, zero server inference, strict Content Security Policy (`connect-src 'self'`), zero telemetry touching images or face landmarks.
2. **Mobile-First Ergonomics**: Designed directly for iPhone Safari and Android Chrome with thumb-reachable touch targets (>= 44px), `100dvh`, and safe-area padding.
3. **Pure UV-Space Analyzers**: Analysis algorithms compute outputs in canonical face-UV space, decoupling computer vision from DOM, React, or three.js rendering.
4. **Worker Thread Offloading**: Heavy MediaPipe landmarker and vision processing execute off the main thread in a dedicated Web Worker via typed Comlink RPC.

---

## Monorepo Layout

```text
├── apps/
│   └── web/                # Next.js App Router (PWA/mobile web frontend)
├── packages/
│   ├── analysis-core/      # Pure TypeScript skin analyzers, region engine, scoring
│   ├── ui/                 # Design tokens, theme CSS, and mobile UI components
│   └── models/             # Versioned manifests and asset loaders for on-device models
├── docs/                   # Architecture decision records (ADR), roadmap, and specs
└── .agent/                 # Engineering rules, workflows, and skills
```

---

## Local Development

### Prerequisites
- **Node.js**: `>= 20.18.0` (Recommended: v22 LTS)
- **pnpm**: `>= 9.0.0`
- **Git**

### Getting Started

```bash
# 1. Install dependencies (frozen lockfile)
pnpm install

# 2. Run lint and formatting check
pnpm check

# 3. Run unit tests
pnpm test

# 4. Start local development server
pnpm dev
```

Visit `http://localhost:3000` in your mobile device emulator or phone on local network.

---

## Governance & Documentation

- [Roadmap](file:///c:/Users/vandi/Downloads/python-project/docs/ROADMAP.md)
- [Project Status](file:///c:/Users/vandi/Downloads/python-project/docs/STATUS.md)
- [Contributing Policy](file:///c:/Users/vandi/Downloads/python-project/CONTRIBUTING.md)
- [Architecture Decisions (ADRs)](file:///c:/Users/vandi/Downloads/python-project/docs/adr/)
- [License](file:///c:/Users/vandi/Downloads/python-project/LICENSE)
