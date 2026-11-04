---
name: analyzer-authoring
description: How to write a DermaLens skin analyzer: contract, UV-space outputs, scoring and confidence, and test recipes. Use when adding or changing anything in packages/analysis-core.
---
# Analyzer authoring

## Contract
- Implements `Analyzer`: `id`, `version`, `analyze(input, signal)`. Bump `version` whenever behaviour changes.
- Input: UV-unwrapped, colour-normalised face texture, skin mask, region maps, px-per-mm scale, quality report.
- Output (Zod-validated): per-region score 0-100, a UV-space map, a confidence in [0, 1], and the analyzer version.

## Conventions
- Work in CIELAB after sRGB-to-linear conversion. Never threshold raw RGB.
- Express sizes in millimetres via the iris-based scale, not pixels.
- Scores are relative indices, not clinical measures. Confidence drops with bad pose, lighting, blur or weak signal (for example, low contrast on darker skin).
- Wrinkles and dark circles are the lower-confidence tier: lower the confidence cap and label them beta.
- Pure functions, no DOM or React. Respect the AbortSignal.

## Test recipes
- Synthetic perturbation: inject a known amount of the target feature (redness patch, dark spot, blur, shine) into a fixture; the score must increase monotonically with the amount.
- Test-retest: run repeated captures of one face; variance must stay under the agreed bound.
- Cross-lighting: same face under different lighting; drift is bounded, and confidence falls when lighting is poor.
- Per-skin-tone: evaluate each fixture group separately and record the results for the measurement page.
- Fixtures are synthetic or explicitly consented only.
