import { describe, expect, it } from "vitest";
import {
  FaceRegion,
  type FaceRegionId,
  type AnalyzerInput,
  type QualityReport
} from "../src";
import { AcneAnalyzer } from "../src/analyzers/acne";

function createSyntheticUVInput(options?: {
  width?: number;
  height?: number;
  pixelsPerMm?: number;
  qualityReport?: Partial<QualityReport>;
  skinTone?: "fair" | "deep";
}): AnalyzerInput {
  const width = options?.width ?? 64;
  const height = options?.height ?? 64;
  const numPixels = width * height;

  const uvTextureBuffer = new Uint8ClampedArray(numPixels * 4);
  const skinMaskBuffer = new Uint8Array(numPixels);
  skinMaskBuffer.fill(1);

  // Default synthetic skin tone (sRGB)
  const isDeep = options?.skinTone === "deep";
  const baseR = isDeep ? 80 : 215;
  const baseG = isDeep ? 55 : 165;
  const baseB = isDeep ? 40 : 140;

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    uvTextureBuffer[idx] = baseR;
    uvTextureBuffer[idx + 1] = baseG;
    uvTextureBuffer[idx + 2] = baseB;
    uvTextureBuffer[idx + 3] = 255;
  }

  const regionMasks: Record<FaceRegionId, Uint8Array> = {
    [FaceRegion.FOREHEAD]: new Uint8Array(numPixels),
    [FaceRegion.LEFT_CHEEK]: new Uint8Array(numPixels),
    [FaceRegion.RIGHT_CHEEK]: new Uint8Array(numPixels),
    [FaceRegion.NOSE]: new Uint8Array(numPixels),
    [FaceRegion.CHIN]: new Uint8Array(numPixels),
    [FaceRegion.PERIORAL]: new Uint8Array(numPixels),
    [FaceRegion.UNDER_EYES]: new Uint8Array(numPixels),
    [FaceRegion.T_ZONE]: new Uint8Array(numPixels),
    [FaceRegion.U_ZONE]: new Uint8Array(numPixels)
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (y < 25) {
        regionMasks[FaceRegion.FOREHEAD][idx] = 1;
        regionMasks[FaceRegion.T_ZONE][idx] = 1;
      } else if (y >= 25 && y < 45) {
        if (x < 30) {
          regionMasks[FaceRegion.LEFT_CHEEK][idx] = 1;
          regionMasks[FaceRegion.U_ZONE][idx] = 1;
        } else {
          regionMasks[FaceRegion.RIGHT_CHEEK][idx] = 1;
          regionMasks[FaceRegion.U_ZONE][idx] = 1;
        }
      } else {
        regionMasks[FaceRegion.CHIN][idx] = 1;
        regionMasks[FaceRegion.T_ZONE][idx] = 1;
      }
    }
  }

  const defaultQuality: QualityReport = {
    isSingleFace: true,
    faceCoverageFraction: 0.72,
    yawDegrees: 0,
    pitchDegrees: 0,
    rollDegrees: 0,
    blurScore: 180,
    exposureValid: true,
    lightingEvenness: 0.92,
    overallScore: 0.95,
    ...options?.qualityReport
  };

  return {
    uvTextureBuffer,
    width,
    height,
    skinMaskBuffer,
    regionMasks,
    pixelsPerMm: options?.pixelsPerMm ?? 4.0,
    qualityReport: defaultQuality
  };
}

/**
 * Injects a synthetic erythematous papule (blemish) at (cx, cy) with radius R.
 */
function injectLesion(
  input: AnalyzerInput,
  cx: number,
  cy: number,
  radiusPx = 3
): void {
  for (let dy = -radiusPx; dy <= radiusPx; dy++) {
    for (let dx = -radiusPx; dx <= radiusPx; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radiusPx) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < input.width && y >= 0 && y < input.height) {
          const idx = (y * input.width + x) * 4;
          // Elevated redness (a*) with central slight contrast darkening
          const factor = 1 - dist / (radiusPx + 1);
          input.uvTextureBuffer[idx] = Math.min(255, (input.uvTextureBuffer[idx] ?? 0) + Math.round(55 * factor));
          input.uvTextureBuffer[idx + 1] = Math.max(0, (input.uvTextureBuffer[idx + 1] ?? 0) - Math.round(25 * factor));
          input.uvTextureBuffer[idx + 2] = Math.max(0, (input.uvTextureBuffer[idx + 2] ?? 0) - Math.round(25 * factor));
        }
      }
    }
  }
}

describe("AcneAnalyzer: Classical Blemish Estimator", () => {
  it("recovers injected synthetic lesion count within tolerance and scales monotonically", async () => {
    const analyzer = new AcneAnalyzer();
    const testCounts = [0, 3, 7, 14];
    const scores: number[] = [];

    for (const count of testCounts) {
      const input = createSyntheticUVInput();
      let placed = 0;

      // Place lesions across left cheek & forehead
      for (let y = 8; y < 40 && placed < count; y += 8) {
        for (let x = 8; x < 56 && placed < count; x += 10) {
          injectLesion(input, x, y, 3);
          placed++;
        }
      }

      const result = await analyzer.analyze(input);
      scores.push(result.overallScore);

      const detectedCount = Number(result.metadata?.estimatedCount ?? 0);
      // Detected count should recover injected count within +/- 1 tolerance
      expect(Math.abs(detectedCount - count)).toBeLessThanOrEqual(1);
    }

    // Monotonicity check
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]!);
    }
  });

  it("suppresses false positives from specular shine, hairs, and non-erythematous spots", async () => {
    const analyzer = new AcneAnalyzer();
    const input = createSyntheticUVInput();

    // 1. Inject specular highlight (high L*, neutral chroma)
    for (let y = 10; y <= 16; y++) {
      for (let x = 10; x <= 16; x++) {
        const idx = (y * input.width + x) * 4;
        input.uvTextureBuffer[idx] = 252;
        input.uvTextureBuffer[idx + 1] = 252;
        input.uvTextureBuffer[idx + 2] = 252;
      }
    }

    // 2. Inject elongated thin hair line (y = 30, x from 10 to 40, 1px wide)
    for (let x = 10; x <= 40; x++) {
      const idx = (30 * input.width + x) * 4;
      input.uvTextureBuffer[idx] = 30;
      input.uvTextureBuffer[idx + 1] = 20;
      input.uvTextureBuffer[idx + 2] = 20;
    }

    // 3. Inject flat brown freckle (no erythema halo)
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const idx = ((48 + dy) * input.width + (35 + dx)) * 4;
        input.uvTextureBuffer[idx] = 120;
        input.uvTextureBuffer[idx + 1] = 95;
        input.uvTextureBuffer[idx + 2] = 80;
      }
    }

    const result = await analyzer.analyze(input);
    const count = Number(result.metadata?.estimatedCount ?? 0);
    expect(count).toBe(0);
    expect(result.metadata?.severityBand).toBe("Minimal");
  });

  it("assigns non-diagnostic severity bands based on lesion count", async () => {
    const analyzer = new AcneAnalyzer();

    const inputZero = createSyntheticUVInput();
    const resZero = await analyzer.analyze(inputZero);
    expect(resZero.metadata?.severityBand).toBe("Minimal");

    const inputMild = createSyntheticUVInput();
    injectLesion(inputMild, 15, 15, 3);
    injectLesion(inputMild, 30, 15, 3);
    injectLesion(inputMild, 45, 15, 3);
    injectLesion(inputMild, 15, 35, 3);
    const resMild = await analyzer.analyze(inputMild);
    expect(["Minimal", "Mild"]).toContain(resMild.metadata?.severityBand);
  });

  it("adjusts confidence on deep skin tones without negative values or crashes", async () => {
    const analyzer = new AcneAnalyzer();
    const fairInput = createSyntheticUVInput({ skinTone: "fair" });
    const deepInput = createSyntheticUVInput({ skinTone: "deep" });

    const fairRes = await analyzer.analyze(fairInput);
    const deepRes = await analyzer.analyze(deepInput);

    expect(deepRes.confidence).toBeGreaterThan(0.2);
    expect(deepRes.confidence).toBeLessThanOrEqual(fairRes.confidence);
    expect(deepRes.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("respects AbortSignal cancellation", async () => {
    const analyzer = new AcneAnalyzer();
    const input = createSyntheticUVInput();
    const controller = new AbortController();
    controller.abort();

    await expect(analyzer.analyze(input, controller.signal)).rejects.toThrow(/abort/i);
  });
});
