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
 * DarkCirclesAnalyzer evaluates periorbital hyperpigmentation and infraorbital shadowing
 * by comparing the under-eye region against adjacent cheek tone.
 * Ships in the Beta tier with confidence capped at 0.75.
 */
export class DarkCirclesAnalyzer implements Analyzer {
  readonly id = "darkCircles";
  readonly version = "1.0.0";

  async analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<AnalysisResult> {
    checkAborted(signal);

    const { labL, labB } = ensureLabChannels(input);
    const numPixels = input.width * input.height;
    const skinMask = input.skinMaskBuffer;
    const regionMasks = input.regionMasks;
    const salienceMap = new Float32Array(numPixels);

    // 1. Establish cheek reference baseline (L* and b*)
    let cheekLSum = 0;
    let cheekCount = 0;

    if (regionMasks) {
      const leftCheek = regionMasks[FaceRegion.LEFT_CHEEK];
      const rightCheek = regionMasks[FaceRegion.RIGHT_CHEEK];

      for (let i = 0; i < numPixels; i++) {
        if (skinMask[i] === 1 && ((leftCheek && leftCheek[i] === 1) || (rightCheek && rightCheek[i] === 1))) {
          cheekLSum += labL[i]!;
          cheekCount++;
        }
      }
    }

    // Fallback: if no cheeks mask, use skin overall
    if (cheekCount === 0) {
      for (let i = 0; i < numPixels; i++) {
        if (skinMask[i] === 1) {
          cheekLSum += labL[i]!;
          cheekCount++;
        }
      }
    }

    const baselineCheekL = cheekCount > 0 ? cheekLSum / cheekCount : 60;

    checkAborted(signal);

    // 2. Measure under-eye relative darkening
    const underEyeMask = regionMasks?.[FaceRegion.UNDER_EYES];
    let underEyeDarkeningSum = 0;
    let underEyePixelCount = 0;

    for (let i = 0; i < numPixels; i++) {
      if (skinMask[i] === 1) {
        const isUnderEye = underEyeMask ? underEyeMask[i] === 1 : false;
        const deltaL = baselineCheekL - labL[i]!;

        if (deltaL > 2.0) {
          const salience = Math.min(1.0, (deltaL - 2.0) / 16.0);
          salienceMap[i] = salience;

          if (isUnderEye) {
            underEyeDarkeningSum += salience;
            underEyePixelCount++;
          }
        }
      }
    }

    checkAborted(signal);

    const regionScores = createEmptyRegionScores();
    const underEyeScore = underEyePixelCount > 0
      ? clamp(round((underEyeDarkeningSum / underEyePixelCount) * 100))
      : 0;

    regionScores[FaceRegion.UNDER_EYES] = underEyeScore;
    // Surrounding regions baseline
    if (regionMasks) {
      for (const [regionId, mask] of Object.entries(regionMasks) as [FaceRegionId, Uint8Array][]) {
        if (regionId === FaceRegion.UNDER_EYES) continue;
        let rSum = 0;
        let rCount = 0;
        for (let i = 0; i < numPixels; i++) {
          if (mask[i] === 1 && skinMask[i] === 1 && salienceMap[i]! > 0) {
            rSum += salienceMap[i]!;
            rCount++;
          }
        }
        regionScores[regionId] = rCount > 0 ? clamp(round((rSum / rCount) * 35)) : 0;
      }
    }

    const uvMapBuffer = normalizeToHeatmap(salienceMap, 0, 1.0, skinMask);

    // Beta tier confidence: capped at 0.75
    let confidence = Math.min(0.75, input.qualityReport.overallScore * 0.8);
    // Downward pitch (> 5° down) casts orbital shadows under brow ridge
    if (input.qualityReport.pitchDegrees < -5) {
      confidence *= 0.75;
    }
    confidence = Math.max(0.15, Math.min(0.75, round(confidence, 2)));

    const result: AnalysisResult = {
      id: this.id,
      version: this.version,
      overallScore: underEyeScore,
      regionScores,
      confidence,
      uvMapWidth: input.width,
      uvMapHeight: input.height,
      uvMapBuffer,
      isBeta: true,
      metadata: {
        baselineCheekLightness: round(baselineCheekL, 1),
        isBeta: true
      }
    };

    return AnalysisResultSchema.parse(result);
  }
}
