import {
  type FaceRegionId,
  type AnalyzerInput,
  type QualityReport,
  FaceRegion,
  createEmptyRegionScores
} from "../index";
import { batchRgbaToLab } from "../geometry/color";

export interface LabChannels {
  readonly labL: Float32Array;
  readonly labA: Float32Array;
  readonly labB: Float32Array;
}

export function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Analysis aborted");
  }
}

export function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

export function round(val: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

/**
 * Retrieves or lazily computes CIELAB channels for an analyzer input.
 */
export function ensureLabChannels(input: AnalyzerInput): LabChannels {
  if (input.labL && input.labA && input.labB) {
    return {
      labL: input.labL,
      labA: input.labA,
      labB: input.labB
    };
  }

  const numPixels = input.width * input.height;
  const outL = new Float32Array(numPixels);
  const outA = new Float32Array(numPixels);
  const outB = new Float32Array(numPixels);

  batchRgbaToLab(input.uvTextureBuffer, numPixels, outL, outA, outB);

  return { labL: outL, labA: outA, labB: outB };
}

/**
 * Computes mean and standard deviation of a channel across valid skin pixels.
 */
export function computeSkinStats(
  channel: Float32Array,
  skinMask: Uint8Array
): { mean: number; stdDev: number; count: number } {
  let sum = 0;
  let count = 0;
  const len = Math.min(channel.length, skinMask.length);

  for (let i = 0; i < len; i++) {
    if (skinMask[i] === 1) {
      sum += channel[i]!;
      count++;
    }
  }

  if (count === 0) {
    return { mean: 0, stdDev: 0, count: 0 };
  }

  const mean = sum / count;
  let varianceSum = 0;

  for (let i = 0; i < len; i++) {
    if (skinMask[i] === 1) {
      const diff = channel[i]! - mean;
      varianceSum += diff * diff;
    }
  }

  const stdDev = Math.sqrt(varianceSum / count);
  return { mean, stdDev, count };
}

/**
 * Normalizes a continuous float intensity map into a [0, 255] Uint8Array heatmap.
 */
export function normalizeToHeatmap(
  values: Float32Array,
  minVal: number,
  maxVal: number,
  mask?: Uint8Array
): Uint8Array {
  const len = values.length;
  const out = new Uint8Array(len);
  const range = maxVal - minVal || 1;

  for (let i = 0; i < len; i++) {
    if (mask && mask[i] === 0) {
      out[i] = 0;
      continue;
    }
    const normalized = (values[i]! - minVal) / range;
    out[i] = Math.max(0, Math.min(255, Math.round(normalized * 255)));
  }

  return out;
}

/**
 * Helper to compute regional scores using a per-pixel condition or salience map.
 */
export function computeRegionalScoresFromMap(
  salienceMap: Float32Array,
  input: AnalyzerInput,
  threshold = 0
): { regionScores: Record<FaceRegionId, number>; overallScore: number } {
  const scores = createEmptyRegionScores();
  const numPixels = input.width * input.height;
  const regionMasks = input.regionMasks;

  let overallWeightedSum = 0;
  let totalSkinPixels = 0;

  for (let i = 0; i < numPixels; i++) {
    if (input.skinMaskBuffer[i] === 1) {
      totalSkinPixels++;
      overallWeightedSum += salienceMap[i]!;
    }
  }

  const overallMean = totalSkinPixels > 0 ? overallWeightedSum / totalSkinPixels : 0;
  const overallScore = clamp(round(overallMean * 100));

  if (!regionMasks) {
    for (const region of Object.values(FaceRegion)) {
      scores[region] = overallScore;
    }
    return { regionScores: scores, overallScore };
  }

  for (const [regionId, mask] of Object.entries(regionMasks) as [FaceRegionId, Uint8Array][]) {
    let regionSum = 0;
    let regionCount = 0;
    for (let i = 0; i < numPixels; i++) {
      if (mask[i] === 1 && input.skinMaskBuffer[i] === 1) {
        regionCount++;
        if (salienceMap[i]! >= threshold) {
          regionSum += salienceMap[i]!;
        }
      }
    }
    const regionMean = regionCount > 0 ? regionSum / regionCount : overallMean;
    scores[regionId] = clamp(round(regionMean * 100));
  }

  return { regionScores: scores, overallScore };
}
