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
 * OilinessAnalyzer detects sebum shine and specular reflections on the face.
 * Specular highlights exhibit high luminance L* and low chroma C* compared
 * to diffuse skin, with highest clinical weight in the T-zone.
 */
export class OilinessAnalyzer implements Analyzer {
  readonly id = "oiliness";
  readonly version = "1.0.0";

  async analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<AnalysisResult> {
    checkAborted(signal);

    const { labL, labA, labB } = ensureLabChannels(input);
    const numPixels = input.width * input.height;
    const skinMask = input.skinMaskBuffer;
    const salienceMap = new Float32Array(numPixels);

    const minSpecularL = 72.0;
    const maxChroma = 22.0;

    let specularPixelCount = 0;
    let totalSkinPixels = 0;

    for (let i = 0; i < numPixels; i++) {
      if (skinMask[i] === 1) {
        totalSkinPixels++;
        const L = labL[i]!;
        const a = labA[i]!;
        const b = labB[i]!;
        const chroma = Math.sqrt(a * a + b * b);

        if (L >= minSpecularL && chroma <= maxChroma) {
          specularPixelCount++;
          const luminanceFactor = Math.min(1.0, (L - minSpecularL) / (100 - minSpecularL));
          const chromaPurity = Math.max(0.1, 1.0 - chroma / maxChroma);
          salienceMap[i] = luminanceFactor * chromaPurity;
        }
      }
    }

    checkAborted(signal);

    const regionScores = createEmptyRegionScores();
    const regionMasks = input.regionMasks;

    if (regionMasks) {
      for (const [regionId, mask] of Object.entries(regionMasks) as [FaceRegionId, Uint8Array][]) {
        let rSkin = 0;
        let rSpecularCount = 0;
        let rSalienceSum = 0;

        for (let i = 0; i < numPixels; i++) {
          if (mask[i] === 1 && skinMask[i] === 1) {
            rSkin++;
            if (salienceMap[i]! > 0) {
              rSpecularCount++;
              rSalienceSum += salienceMap[i]!;
            }
          }
        }

        if (rSkin > 0) {
          const areaFraction = rSpecularCount / rSkin;
          const avgIntensity = rSpecularCount > 0 ? rSalienceSum / rSpecularCount : 0;
          // T-Zone regions have natural clinical focus for sebum
          const isTZone = regionId === FaceRegion.FOREHEAD || regionId === FaceRegion.NOSE || regionId === FaceRegion.CHIN || regionId === FaceRegion.T_ZONE;
          const multiplier = isTZone ? 1.2 : 0.9;
          const score = clamp(round((areaFraction * 60 + avgIntensity * 40) * multiplier));
          regionScores[regionId] = score;
        }
      }
    }

    // Overall score weights T-zone
    const overallFraction = totalSkinPixels > 0 ? specularPixelCount / totalSkinPixels : 0;
    const tZoneScore = regionScores[FaceRegion.T_ZONE] ?? regionScores[FaceRegion.FOREHEAD] ?? 0;
    const overallScore = clamp(round(overallFraction * 120 * 0.4 + tZoneScore * 0.6));

    const uvMapBuffer = normalizeToHeatmap(salienceMap, 0, 1.0, skinMask);

    let confidence = input.qualityReport.overallScore;
    if (!input.qualityReport.exposureValid) {
      confidence *= 0.6; // overexposed frames create false specular highlights
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
        specularPixelFraction: round(overallFraction, 3),
        tZoneScore
      }
    };

    return AnalysisResultSchema.parse(result);
  }
}
