# Architecture rules

- Monorepo (pnpm + Turborepo): `apps/web`, `packages/analysis-core`, `packages/ui`, `packages/models`, `docs/`, `fixtures/`. No `ml/` yet.
- Dependency direction: `analysis-core` <- `ui` <- `apps/web`. `analysis-core` imports no React, DOM or three.js; it is pure TypeScript on typed arrays.
- Every analyzer implements one interface: `id`, `version`, `analyze(input, signal) => Promise<result>`.
- Results are Zod-validated, versioned, and expressed in canonical face-UV space with per-region scores and a confidence value.
- Heavy work (landmarks, analyzers, later ONNX) runs in a Web Worker via Comlink. The main thread does UI and 3D only.
- Lazy-load MediaPipe, three.js and the PDF library. None belong in the initial bundle.
- Anything that changes architecture or adds a dependency needs an ADR in `docs/adr/`.
