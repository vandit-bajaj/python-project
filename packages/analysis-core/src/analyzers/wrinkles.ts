import {
  type Analyzer,
  type AnalyzerInput,
  type AnalysisResult,
  type FaceRegionId,
  FaceRegion,
  AnalysisResultSchema,
  createEmptyRegionScores
} from "../index";
import {
  checkAborted,
  clamp,
  round,
  ensureLabChannels,
  normalizeToHeatmap
} from "./utils";

/**
 * WrinklesAnalyzer evaluates fine lines and creases in forehead and periorbital regions.
 * Ships in the Beta tier with explicit beta labeling and confidence capped at 0.70.
 */
export class WrinklesAnalyzer implements Analyzer {
  readonly id = "wrinkles";
  readonly version = "1.0.0";

  async analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<AnalysisResult> {
    checkAborted(signal);

    const { labL } = ensureLabChannels(input);
    const numPixels = input.width * input.height;
    const skinMask = input.skinMaskBuffer;
    const width = input.width;
    const height = input.height;
    const salienceMap = new Float32Array(numPixels);

    // Directional ridge detection:
    // Forehead creases are largely horizontal (strong vertical valley profile: L(y-1) + L(y+1) - 2*L(y))
    const step = Math.max(1, Math.round(input.pixelsPerMm * 0.5));

    for (let y = step; y < height - step; y++) {
      for (let x = step; x < width - step; x++) {
        const idx = y * width + x;
        if (skinMask[idx] !== 1) continue;

        const top = (y - step) * width + x;
        const bottom = (y + step) * width + x;
        const left = y * width + (x - step);
        const right = y * width + (x + step);

        if (skinMask[top] === 1 && skinMask[bottom] === 1) {
          const centerL = labL[idx]!;
          // Valley profile (dark furrow between brighter adjacent skin)
          const verticalValley = (labL[top]! + labL[bottom]!) * 0.5 - centerL;
          const horizontalValley = (skinMask[left] === 1 && skinMask[right] === 1)
            ? (labL[left]! + labL[right]!) * 0.5 - centerL
            : 0;

          // Wrinkle response favors the strongest directional groove
          const grooveDepth = Math.max(0, Math.max(verticalValley, horizontalValley));
          if (grooveDepth > 3.0) {
            salienceMap[idx] = Math.min(1.0, (grooveDepth - 3.0) / 20.0);
          }
        }
      }
    }

    checkAborted(signal);

    const regionScores = createEmptyRegionScores();
    const regionMasks = input.regionMasks;

    // Target regions for wrinkle assessment
    const targetRegions: readonly FaceRegionId[] = [FaceRegion.FOREHEAD, FaceRegion.UNDER_EYES];
    let targetSalienceSum = 0;
    let targetPixelCount = 0;

    if (regionMasks) {
      for (const [regionId, mask] of Object.entries(regionMasks) as [FaceRegionId, Uint8Array][]) {
        let rSkin = 0;
        let rSum = 0;
        let rLinePixels = 0;

        for (let i = 0; i < numPixels; i++) {
          if (mask[i] === 1 && skinMask[i] === 1) {
            rSkin++;
            if (salienceMap[i]! > 0) {
              rLinePixels++;
              rSum += salienceMap[i]!;
            }
          }
        }

        if (rSkin > 0) {
          const density = (rLinePixels / rSkin) * 100;
          const avgDepth = rLinePixels > 0 ? rSum / rLinePixels : 0;
          const score = clamp(round(density * 1.5 + avgDepth * 40));
          regionScores[regionId] = score;

          if (targetRegions.includes(regionId)) {
            targetSalienceSum += rSum;
            targetPixelCount += rSkin;
          }
        }
      }
    }

    const overallScore = targetPixelCount > 0
      ? clamp(round((targetSalienceSum / targetPixelCount) * 220))
      : regionScores[FaceRegion.FOREHEAD] ?? 0;

    const uvMapBuffer = normalizeToHeatmap(salienceMap, 0, 1.0, skinMask);

    // Beta tier confidence: hard capped at 0.70
    let confidence = Math.min(0.70, input.qualityReport.overallScore * 0.75);
    // Further attenuate if head angle deviates
    if (Math.abs(input.qualityReport.yawDegrees) > 7 || Math.abs(input.qualityReport.pitchDegrees) > 7) {
      confidence *= 0.8;
    }
    confidence = Math.max(0.15, Math.min(0.70, round(confidence, 2)));

    const result: AnalysisResult = {
      id: this.id,
      version: this.version,
      overallScore,
      regionScores,
      confidence,
      uvMapWidth: width,
      uvMapHeight: height,
      uvMapBuffer,
      isBeta: true,
      metadata: {
        isBeta: true,
        targetRegionsAssessed: targetRegions.join(", ")
      }
    };

    return AnalysisResultSchema.parse(result);
  }
}
