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
 * TextureAnalyzer measures high-frequency skin roughness and visible pores
 * using physical-scale Laplacian spatial filtering on perceptual lightness L*.
 */
export class TextureAnalyzer implements Analyzer {
  readonly id = "texture";
  readonly version = "1.0.0";

  async analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<AnalysisResult> {
    checkAborted(signal);

    const { labL } = ensureLabChannels(input);
    const numPixels = input.width * input.height;
    const skinMask = input.skinMaskBuffer;
    const width = input.width;
    const height = input.height;

    // Physical filter step based on pore size (~0.35 mm)
    const step = Math.max(1, Math.min(4, Math.round(input.pixelsPerMm * 0.35)));
    const salienceMap = new Float32Array(numPixels);

    // 2D discrete Laplacian kernel: 4*center - (left + right + top + bottom)
    for (let y = step; y < height - step; y++) {
      for (let x = step; x < width - step; x++) {
        const idx = y * width + x;
        if (skinMask[idx] !== 1) continue;

        const left = idx - step;
        const right = idx + step;
        const top = idx - step * width;
        const bottom = idx + step * width;

        if (skinMask[left] === 1 && skinMask[right] === 1 && skinMask[top] === 1 && skinMask[bottom] === 1) {
          const centerL = labL[idx]!;
          const laplacian = 4 * centerL - (labL[left]! + labL[right]! + labL[top]! + labL[bottom]!);
          const roughness = Math.abs(laplacian);
          // Normalize to [0, 1] relative to reference texture dynamic range
          salienceMap[idx] = Math.min(1.0, roughness / 64.0);
        }
      }
    }

    checkAborted(signal);

    const regionScores = createEmptyRegionScores();
    const regionMasks = input.regionMasks;

    let totalSkin = 0;
    let totalRoughnessSum = 0;

    for (let i = 0; i < numPixels; i++) {
      if (skinMask[i] === 1) {
        totalSkin++;
        totalRoughnessSum += salienceMap[i]!;
      }
    }

    const overallScore = totalSkin > 0
      ? clamp(round((totalRoughnessSum / totalSkin) * 120))
      : 0;

    if (regionMasks) {
      for (const [regionId, mask] of Object.entries(regionMasks) as [FaceRegionId, Uint8Array][]) {
        let rSkin = 0;
        let rSum = 0;

        for (let i = 0; i < numPixels; i++) {
          if (mask[i] === 1 && skinMask[i] === 1) {
            rSkin++;
            rSum += salienceMap[i]!;
          }
        }

        if (rSkin > 0) {
          regionScores[regionId] = clamp(round((rSum / rSkin) * 120));
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

    // Texture analysis is especially sensitive to camera blur
    let confidence = input.qualityReport.overallScore;
    if (input.qualityReport.blurScore < 50) {
      confidence = Math.min(confidence, 0.3);
    } else if (input.qualityReport.blurScore < 100) {
      confidence = Math.min(confidence, 0.6);
    }
    confidence = Math.max(0.1, Math.min(1.0, round(confidence, 2)));

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
        filterStepPx: step,
        meanRoughness: totalSkin > 0 ? round(totalRoughnessSum / totalSkin, 3) : 0
      }
    };

    return AnalysisResultSchema.parse(result);
  }
}
