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

/**
 * RednessAnalyzer evaluates erythema and localized facial redness by measuring
 * elevated CIELAB a* coordinates relative to the individual's baseline skin tone.
 */
export class RednessAnalyzer implements Analyzer {
  readonly id = "redness";
  readonly version = "1.0.0";

  async analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<AnalysisResult> {
    checkAborted(signal);

    const { labA } = ensureLabChannels(input);
    const numPixels = input.width * input.height;
    const skinMask = input.skinMaskBuffer;

    // Calculate baseline a* across the face skin mask
    const stats = computeSkinStats(labA, skinMask);
    const baselineA = stats.mean;

    // Salience map: delta a* above baseline
    const salienceMap = new Float32Array(numPixels);
    const aDeltaThreshold = 2.0; // minimum elevation to consider erythema
    const maxReferenceDelta = 16.0; // reference elevation for max score

    for (let i = 0; i < numPixels; i++) {
      if (skinMask[i] === 1) {
        const delta = labA[i]! - baselineA;
        if (delta > aDeltaThreshold) {
          salienceMap[i] = Math.min(1.0, (delta - aDeltaThreshold) / (maxReferenceDelta - aDeltaThreshold));
        }
      }
    }

    checkAborted(signal);

    // Compute regional scores and overall score
    const regionScores = createEmptyRegionScores();
    const regionMasks = input.regionMasks;

    let totalSkin = 0;
    let totalErythemaSum = 0;

    for (let i = 0; i < numPixels; i++) {
      if (skinMask[i] === 1) {
        totalSkin++;
        totalErythemaSum += salienceMap[i]!;
      }
    }

    const overallScore = totalSkin > 0
      ? clamp(round((totalErythemaSum / totalSkin) * 160)) // scale area + intensity
      : 0;

    if (regionMasks) {
      for (const [regionId, mask] of Object.entries(regionMasks) as [FaceRegionId, Uint8Array][]) {
        let regionSkin = 0;
        let regionSum = 0;
        let regionElevatedCount = 0;

        for (let i = 0; i < numPixels; i++) {
          if (mask[i] === 1 && skinMask[i] === 1) {
            regionSkin++;
            if (salienceMap[i]! > 0) {
              regionElevatedCount++;
              regionSum += salienceMap[i]!;
            }
          }
        }

        if (regionSkin > 0) {
          const areaFraction = regionElevatedCount / regionSkin;
          const avgIntensity = regionElevatedCount > 0 ? regionSum / regionElevatedCount : 0;
          // Combine affected area fraction and intensity
          const score = clamp(round((areaFraction * 0.55 + avgIntensity * 0.45) * 100));
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

    // Heatmap buffer (0-255)
    const uvMapBuffer = normalizeToHeatmap(salienceMap, 0, 1.0, skinMask);

    // Confidence derived from capture quality (penalized by uneven lighting)
    let confidence = input.qualityReport.overallScore;
    if (input.qualityReport.lightingEvenness < 0.75) {
      confidence *= input.qualityReport.lightingEvenness;
    }
    confidence = Math.max(0.2, Math.min(1.0, round(confidence, 2)));

    const result: AnalysisResult = {
      id: this.id,
      version: this.version,
      overallScore,
      regionScores,
      confidence,
      uvMapWidth: input.width,
      uvMapHeight: input.height,
      uvMapBuffer,
      metadata: {
        baselineA: round(baselineA, 2),
        affectedSkinFraction: totalSkin > 0 ? round(totalErythemaSum / totalSkin, 3) : 0
      }
    };

    return AnalysisResultSchema.parse(result);
  }
}
