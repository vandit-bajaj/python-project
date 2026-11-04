# ADR 0001: On-Device Face Skin Analysis Architecture

- Status: accepted
- Date: 2026-11-04

## Context
DermaLens allows users to capture or upload face images to obtain cosmetic skin concern analyses. Biometric facial imagery is exceptionally sensitive personal data. Sending images to a backend server exposes users to interception, data breaches, and heavy regulatory compliance burdens (e.g. GDPR, DPDP Act), while requiring costly GPU cloud infrastructure.

## Decision
We enforce an **on-device only architecture by construction**:
1. All computer vision, landmarker detection, and skin concern analyzers run locally in the client browser using WebAssembly and WebGL/WebGPU.
2. The web application operates with zero backend API endpoints for processing images.
3. A strict Content Security Policy (CSP) restricts connections to `connect-src 'self'`.
4. Playwright automated tests continuously enforce that zero outbound network requests occur during any capture or scan flow.
5. All fonts, WASM binaries, and model assets are self-hosted with immutable HTTP caching.

## Alternatives Considered
- **Cloud API processing**: Offload heavy inference to a remote server. Rejected because it violates user privacy expectations, introduces latency and hosting costs, and requires handling biometric storage liability.
- **Hybrid processing**: Landmark on device, upload embeddings. Rejected because embeddings can still leak biometric signatures and invalidate the zero-data-collection promise.

## Consequences
- **Positive**: Absolute privacy guarantee by construction; zero cloud inference or hosting costs; scalable to unlimited users.
- **Negative**: Constrained by client hardware capability (CPU/GPU/RAM); requires strict performance budgeting and bundle size minimization for mobile phones.
