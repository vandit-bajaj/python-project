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
import { computeITA, classifyITATone } from "./pigmentation";

export interface DetectedBlemish {
  readonly x: number;
  readonly y: number;
  readonly radiusPx: number;
  readonly salience: number;
}

/**
 * AcneAnalyzer provides classical heuristic blemish and papule detection.
 * Identifies localized erythematous peaks with circular profiles at plausible
 * biological lesion sizes (1.5mm - 4.5mm), with false-positive suppression
 * for specular shine, hairs, and non-erythematous freckles.
 */
export class AcneAnalyzer implements Analyzer {
  readonly id = "acne";
  readonly version = "1.0.0";

  async analyze(input: AnalyzerInput, signal?: AbortSignal): Promise<AnalysisResult> {
    checkAborted(signal);

    const { labL, labA, labB } = ensureLabChannels(input);
    const numPixels = input.width * input.height;
    const skinMask = input.skinMaskBuffer;
    const width = input.width;
    const height = input.height;

    // 1. Establish baseline skin colorimetry & tone
    const statsA = computeSkinStats(labA, skinMask);
    const statsL = computeSkinStats(labL, skinMask);
    const statsB = computeSkinStats(labB, skinMask);
    const baselineA = statsA.mean;
    const baselineL = statsL.mean;
    const ita = computeITA(baselineL, statsB.mean);
    const isDarkTone = ita < 15;

    // Physical radius based on biological blemish dimensions (~1.2 mm radius)
    const radiusPx = Math.max(1, Math.min(5, Math.round(input.pixelsPerMm * 0.6)));
    const erythemaThreshold = isDarkTone ? 2.0 : 3.0;

    checkAborted(signal);

    // 2. Candidate Detection with False-Positive Suppression
    const candidates: DetectedBlemish[] = [];
    const salienceMap = new Float32Array(numPixels);

    // Inner region safely away from texture borders
    const border = radiusPx + 2;
    for (let y = border; y < height - border; y++) {
      for (let x = border; x < width - border; x++) {
        const idx = y * width + x;
        if (skinMask[idx] !== 1) continue;

        const aVal = labA[idx]!;
        const deltaA = aVal - baselineA;

        // Condition A: Elevated redness
        if (deltaA < erythemaThreshold) continue;

        const lVal = labL[idx]!;
        const bVal = labB[idx]!;
        const chroma = Math.sqrt(aVal * aVal + bVal * bVal);

        // False Positive 1: Specular highlight reflection (high L*, neutral chroma)
        if (lVal > 75 && chroma < 20) continue;

        // False Positive 2: Boundary proximity (non-skin within radius)
        let nearBoundary = false;
        for (let dy = -radiusPx; dy <= radiusPx; dy += radiusPx) {
          for (let dx = -radiusPx; dx <= radiusPx; dx += radiusPx) {
            const nIdx = (y + dy) * width + (x + dx);
            if (skinMask[nIdx] !== 1) {
              nearBoundary = true;
              break;
            }
          }
          if (nearBoundary) break;
        }
        if (nearBoundary) continue;

        // Condition B: Local peak in a* (must be greater than or equal to surrounding ring)
        let ringSum = 0;
        let ringCount = 0;
        let isLocalMax = true;

        for (let dy = -radiusPx; dy <= radiusPx; dy += radiusPx) {
          for (let dx = -radiusPx; dx <= radiusPx; dx += radiusPx) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = (y + dy) * width + (x + dx);
            const nA = labA[nIdx]!;
            if (nA > aVal) {
              isLocalMax = false;
              break;
            }
            ringSum += nA;
            ringCount++;
          }
          if (!isLocalMax) break;
        }

        if (!isLocalMax || ringCount === 0) continue;

        const ringMeanA = ringSum / ringCount;
        const peakElevation = aVal - ringMeanA;
        if (peakElevation < 1.0) continue; // must be a distinct local bump

        // False Positive 3: Elongated line / hair detection
        // Compare horizontal vs vertical gradient profile
        const hLeft = labA[y * width + (x - radiusPx)]!;
        const hRight = labA[y * width + (x + radiusPx)]!;
        const vTop = labA[(y - radiusPx) * width + x]!;
        const vBottom = labA[(y + radiusPx) * width + x]!;

        const hDiff = Math.abs(hLeft - hRight);
        const vDiff = Math.abs(vTop - vBottom);
        const hPeak = aVal - (hLeft + hRight) * 0.5;
        const vPeak = aVal - (vTop + vBottom) * 0.5;

        // If one axis has a huge peak while the orthogonal is flat/negative, it's a line/hair
        const maxPeak = Math.max(hPeak, vPeak);
        const minPeak = Math.min(hPeak, vPeak);
        if (minPeak < 0.2 && maxPeak > 2.5) continue;

        const salience = Math.min(1.0, (deltaA / 18.0) * 0.6 + (peakElevation / 8.0) * 0.4);
        candidates.push({ x, y, radiusPx, salience });
      }
    }

    checkAborted(signal);

    // 3. Non-Maximum Suppression (NMS) to eliminate duplicate detections
    // Sort descending by salience
    candidates.sort((a, b) => b.salience - a.salience);
    const retainedBlemishes: DetectedBlemish[] = [];
    const minDistanceSq = (radiusPx * 2.2) ** 2;

    for (const cand of candidates) {
      let isDuplicate = false;
      for (const retained of retainedBlemishes) {
        const dx = cand.x - retained.x;
        const dy = cand.y - retained.y;
        if (dx * dx + dy * dy < minDistanceSq) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        retainedBlemishes.push(cand);
        // Paint blob into salience map
        for (let dy = -radiusPx; dy <= radiusPx; dy++) {
          for (let dx = -radiusPx; dx <= radiusPx; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radiusPx) {
              const px = cand.x + dx;
              const py = cand.y + dy;
              const pIdx = py * width + px;
              if (pIdx >= 0 && pIdx < numPixels) {
                const falloff = 1 - dist / (radiusPx + 1);
                salienceMap[pIdx] = Math.max(salienceMap[pIdx]!, cand.salience * falloff);
              }
            }
          }
        }
      }
    }

    checkAborted(signal);

    // 4. Severity Banding and Regional Scores
    const totalCount = retainedBlemishes.length;
    let severityBand: "Minimal" | "Mild" | "Moderate" | "Marked" = "Minimal";
    let overallScore = 0;

    if (totalCount <= 2) {
      severityBand = "Minimal";
      overallScore = totalCount * 6;
    } else if (totalCount <= 10) {
      severityBand = "Mild";
      overallScore = clamp(round(15 + (totalCount - 2) * 3.5));
    } else if (totalCount <= 25) {
      severityBand = "Moderate";
      overallScore = clamp(round(45 + (totalCount - 10) * 2.0));
    } else {
      severityBand = "Marked";
      overallScore = clamp(round(75 + Math.min(25, (totalCount - 25) * 1.25)));
    }

    // Assign blemish counts and scores per region
    const regionScores = createEmptyRegionScores();
    const regionMasks = input.regionMasks;

    if (regionMasks) {
      for (const [regionId, mask] of Object.entries(regionMasks) as [FaceRegionId, Uint8Array][]) {
        let regionLesions = 0;
        let regionSkin = 0;

        for (let i = 0; i < numPixels; i++) {
          if (mask[i] === 1 && skinMask[i] === 1) {
            regionSkin++;
          }
        }

        for (const b of retainedBlemishes) {
          const idx = b.y * width + b.x;
          if (mask[idx] === 1 && skinMask[idx] === 1) {
            regionLesions++;
          }
        }

        if (regionSkin > 0) {
          const density = (regionLesions / regionSkin) * 1000; // lesions per 1k skin px
          regionScores[regionId] = clamp(round(regionLesions * 12 + density * 5));
        } else {
          regionScores[regionId] = overallScore;
        }
      }
    } else {
      for (const r of Object.values(FaceRegion)) {
        regionScores[r] = overallScore;
      }
    }

    const uvMapBuffer = normalizeToHeatmap(salienceMap, 0, 1.0, skinMask);

    // Confidence: derived from quality and skin tone contrast
    let confidence = input.qualityReport.overallScore;
    if (isDarkTone) {
      // Contrast of redness is lower on darker skin (Roadmap §6)
      confidence *= 0.85;
    }
    if (input.qualityReport.blurScore < 70) {
      confidence *= 0.75;
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
        estimatedCount: totalCount,
        severityBand,
        meanDiameterMm: round(radiusPx * 2 / input.pixelsPerMm, 2),
        isDarkToneAdjusted: isDarkTone
      }
    };

    return AnalysisResultSchema.parse(result);
  }
}
