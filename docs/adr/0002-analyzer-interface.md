# ADR 0002: Canonical UV-Space Analyzer Contract

- Status: accepted
- Date: 2026-11-04

## Context
DermaLens evaluates multiple distinct skin concerns (redness, pigmentation, oiliness, texture/pores, wrinkles, dark circles, acne). Different analyzers could easily introduce fragmented data representations, coordinate systems, and duplicate geometry code across 2D heatmaps and the 3D face viewer.

## Decision
All skin analyzers in `@dermalens/analysis-core` must conform to a single uniform interface and compute outputs in **canonical face-UV space**:

```typescript
export interface Analyzer<R extends AnalysisResult> {
  readonly id: string;
  readonly version: string;
  analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<R>;
}
```

1. Inputs provide:
   - Canonical UV-unwrapped face texture and skin mask.
   - Pre-computed region maps (forehead, cheeks, nose, chin, perioral, under-eyes, T-zone, U-zone).
   - Iris-calibrated scale factor (approximate pixels-per-millimeter).
   - Capture quality assessment.
2. Outputs provide:
   - Zod-validated relative score indices (0–100) per region.
   - Normalized 2D float/uint UV result map.
   - Confidence metric `[0, 1]`.
   - Explicit analyzer version.
3. Analysis core functions must be pure TypeScript with zero DOM, React, or WebGL dependencies.

## Alternatives Considered
- **Direct screen-space bounding boxes/pixel masks**: Analyze directly on the raw perspective camera frame. Rejected because perspective, head tilt, and distance distort scale and require duplicating geometric projection for the 3D model.
- **Ad-hoc analyzer return shapes**: Allow each analyzer to return custom schemas. Rejected because it complicates UI aggregation, reporting, and 3D shader pipeline binding.

## Consequences
- **Positive**: One canonical UV texture feeds 2D heatmap overlays, 3D face shaders, and regional score cards with zero geometry duplication. Enables parallel development of independent analyzers.
- **Negative**: Requires an upfront face mesh UV unwrapping stage before running analyzers.
