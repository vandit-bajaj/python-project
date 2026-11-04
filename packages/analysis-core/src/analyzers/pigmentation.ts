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
  computeSkinStats,
  normalizeToHeatmap
} from "./utils";

export function computeITA(L: number, b: number): number {
  const radians = Math.atan2(L - 50, Math.max(0.01, b));
  return (radians * 180) / Math.PI;
}

export function classifyITATone(ita: number): string {
  if (ita > 55) return "Very Light";
  if (ita > 41) return "Light";
  if (ita > 28) return "Intermediate";
  if (ita > 10) return "Tan";
  if (ita > -30) return "Brown";
  return "Dark";
}

/**
 * PigmentationAnalyzer assesses skin tone uniformity, ITA classification,
 * and localized hyperpigmentation / dark spots via local contrast filtering.
 */
export class PigmentationAnalyzer implements Analyzer {
  readonly id = "pigmentation";
  readonly version = "1.0.0";

  async analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<AnalysisResult> {
    checkAborted(signal);

    const { labL, labB } = ensureLabChannels(input);
    const numPixels = input.width * input.height;
    const skinMask = input.skinMaskBuffer;
    const width = input.width;
    const height = input.height;

    // 1. Compute overall tone metrics (ITA)
    const statsL = computeSkinStats(labL, skinMask);
    const statsB = computeSkinStats(labB, skinMask);
    const overallITA = computeITA(statsL.mean, statsB.mean);
    const toneCategory = classifyITATone(overallITA);

    checkAborted(signal);

    // 2. Local dark spot detection
    // Kernel radius based on physical iris scale (~1.5 mm spot radius)
    const radiusPx = Math.max(1, Math.min(6, Math.round(input.pixelsPerMm * 1.5)));
    const salienceMap = new Float32Array(numPixels);
    let totalDarkSpotsDetected = 0;

    // Compute local contrast relative to circular neighborhood
    for (let y = radiusPx; y < height - radiusPx; y++) {
      for (let x = radiusPx; x < width - radiusPx; x++) {
        const idx = y * width + x;
        if (skinMask[idx] !== 1) continue;

        let localSum = 0;
        let localCount = 0;

        for (let dy = -radiusPx; dy <= radiusPx; dy += radiusPx) {
          for (let dx = -radiusPx; dx <= radiusPx; dx += radiusPx) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = (y + dy) * width + (x + dx);
            if (skinMask[nIdx] === 1) {
              localSum += labL[nIdx]!;
              localCount++;
            }
          }
        }

        if (localCount > 0) {
          const localMean = localSum / localCount;
          const dropL = localMean - labL[idx]!;
          // Dark spots have lower L* than surroundings
          if (dropL > 3.0) {
            const spotSalience = Math.min(1.0, (dropL - 3.0) / 18.0);
            salienceMap[idx] = spotSalience;
            if (spotSalience > 0.4) {
              totalDarkSpotsDetected++;
            }
          }
        }
      }
    }

    checkAborted(signal);

    // 3. Compute region scores
    const regionScores = createEmptyRegionScores();
    const regionMasks = input.regionMasks;

    let overallSkinCount = 0;
    let overallSalienceSum = 0;

    for (let i = 0; i < numPixels; i++) {
      if (skinMask[i] === 1) {
        overallSkinCount++;
        overallSalienceSum += salienceMap[i]!;
      }
    }

    const overallScore = overallSkinCount > 0
      ? clamp(round((overallSalienceSum / overallSkinCount) * 220))
      : 0;

    if (regionMasks) {
      for (const [regionId, mask] of Object.entries(regionMasks) as [FaceRegionId, Uint8Array][]) {
        let rSkin = 0;
        let rSalienceSum = 0;
        let rSpotCount = 0;

        for (let i = 0; i < numPixels; i++) {
          if (mask[i] === 1 && skinMask[i] === 1) {
            rSkin++;
            if (salienceMap[i]! > 0) {
              rSpotCount++;
              rSalienceSum += salienceMap[i]!;
            }
          }
        }

        if (rSkin > 0) {
          const spotDensity = (rSpotCount / rSkin) * 100;
          const avgIntensity = rSpotCount > 0 ? rSalienceSum / rSpotCount : 0;
          const score = clamp(round((spotDensity * 0.6 + avgIntensity * 40)));
          regionScores[regionId] = score;
        } else {
          regionScores[regionId] = overallScore;
        }
      }
    } else {
      for (const region of Object.values(FaceRegion)) {
        regionScores[region] = overallScore;
      }
    }

    const uvMapBuffer = normalizeToHeatmap(salienceMap, 0, 1.0, skinMask);

    let confidence = input.qualityReport.overallScore;
    if (input.qualityReport.lightingEvenness < 0.70) {
      confidence *= input.qualityReport.lightingEvenness;
    }
    confidence = Math.max(0.2, Math.min(1.0, round(confidence, 2)));

    const result: AnalysisResult = {
      id: this.id,
      version: this.version,
      overallScore,
      regionScores,
      confidence,
      uvMapWidth: width,
      uvMapHeight: height,
      uvMapBuffer,
      metadata: {
        itaAngle: round(overallITA, 1),
        toneCategory,
        totalDarkSpotsDetected
      }
    };

    return AnalysisResultSchema.parse(result);
  }
}
