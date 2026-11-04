import { describe, expect, it } from "vitest";
import {
  FaceRegion,
  type FaceRegionId,
  type AnalyzerInput,
  type QualityReport
} from "../src";
import { RednessAnalyzer } from "../src/analyzers/redness";
import { PigmentationAnalyzer } from "../src/analyzers/pigmentation";
import { OilinessAnalyzer } from "../src/analyzers/oiliness";
import { TextureAnalyzer } from "../src/analyzers/texture";
import { WrinklesAnalyzer } from "../src/analyzers/wrinkles";
import { DarkCirclesAnalyzer } from "../src/analyzers/darkCircles";
import { aggregateAnalysis } from "../src/scoring/aggregate";

// Helper to create synthetic canonical UV input for testing
function createSyntheticUVInput(options?: {
  width?: number;
  height?: number;
  pixelsPerMm?: number;
  qualityReport?: Partial<QualityReport>;
}): AnalyzerInput {
  const width = options?.width ?? 64;
  const height = options?.height ?? 64;
  const numPixels = width * height;

  // RGBA buffer: neutral synthetic skin (sRGB approx: 210, 160, 140, 255)
  const uvTextureBuffer = new Uint8ClampedArray(numPixels * 4);
  const skinMaskBuffer = new Uint8Array(numPixels);
  skinMaskBuffer.fill(1); // entire patch is skin

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    uvTextureBuffer[idx] = 210;     // R
    uvTextureBuffer[idx + 1] = 160; // G
    uvTextureBuffer[idx + 2] = 140; // B
    uvTextureBuffer[idx + 3] = 255; // A
  }

  // Pre-fill region masks
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

  // Partition the 64x64 patch into mock regions for testing
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (y < 20) {
        regionMasks[FaceRegion.FOREHEAD][idx] = 1;
        regionMasks[FaceRegion.T_ZONE][idx] = 1;
      } else if (y >= 20 && y < 35) {
        if (x < 25) {
          regionMasks[FaceRegion.LEFT_CHEEK][idx] = 1;
          regionMasks[FaceRegion.U_ZONE][idx] = 1;
        } else if (x > 38) {
          regionMasks[FaceRegion.RIGHT_CHEEK][idx] = 1;
          regionMasks[FaceRegion.U_ZONE][idx] = 1;
        } else {
          regionMasks[FaceRegion.NOSE][idx] = 1;
          regionMasks[FaceRegion.T_ZONE][idx] = 1;
        }
        if (y < 25 && (x < 25 || x > 38)) {
          regionMasks[FaceRegion.UNDER_EYES][idx] = 1;
        }
      } else {
        regionMasks[FaceRegion.CHIN][idx] = 1;
        regionMasks[FaceRegion.T_ZONE][idx] = 1;
        regionMasks[FaceRegion.U_ZONE][idx] = 1;
      }
    }
  }

  const defaultQuality: QualityReport = {
    isSingleFace: true,
    faceCoverageFraction: 0.7,
    yawDegrees: 0,
    pitchDegrees: 0,
    rollDegrees: 0,
    blurScore: 180,
    exposureValid: true,
    lightingEvenness: 0.9,
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

describe("Analyzers Suite: Synthetic Perturbation & Monotonicity", () => {
  it("RednessAnalyzer: score increases monotonically with increasing erythema patch intensity", async () => {
    const analyzer = new RednessAnalyzer();
    const levels = [0, 15, 30, 55];
    const scores: number[] = [];

    for (const boost of levels) {
      const input = createSyntheticUVInput();
      // Inject redness into left cheek by boosting R and reducing G/B
      const cheekMask = input.regionMasks![FaceRegion.LEFT_CHEEK]!;
      for (let i = 0; i < input.width * input.height; i++) {
        if (cheekMask[i] === 1) {
          const idx = i * 4;
          input.uvTextureBuffer[idx] = Math.min(255, input.uvTextureBuffer[idx]! + boost);
          input.uvTextureBuffer[idx + 1] = Math.max(0, input.uvTextureBuffer[idx + 1]! - boost * 0.4);
          input.uvTextureBuffer[idx + 2] = Math.max(0, input.uvTextureBuffer[idx + 2]! - boost * 0.4);
        }
      }

      const result = await analyzer.analyze(input);
      scores.push(result.regionScores[FaceRegion.LEFT_CHEEK]!);
    }

    // Must be strictly monotonic
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]!);
    }
  });

  it("PigmentationAnalyzer: score increases monotonically with number of dark spots", async () => {
    const analyzer = new PigmentationAnalyzer();
    const spotCounts = [0, 2, 5, 12];
    const scores: number[] = [];

    for (const count of spotCounts) {
      const input = createSyntheticUVInput();
      const cheekMask = input.regionMasks![FaceRegion.RIGHT_CHEEK]!;

      // Inject small dark spots of radius ~2 pixels into the cheek region
      let placed = 0;
      for (let y = 22; y < 33 && placed < count; y += 3) {
        for (let x = 42; x < 58 && placed < count; x += 4) {
          const centerIdx = y * input.width + x;
          if (cheekMask[centerIdx] === 1) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const pIdx = (y + dy) * input.width + (x + dx);
                input.uvTextureBuffer[pIdx * 4] = 80;
                input.uvTextureBuffer[pIdx * 4 + 1] = 50;
                input.uvTextureBuffer[pIdx * 4 + 2] = 40;
              }
            }
            placed++;
          }
        }
      }

      const result = await analyzer.analyze(input);
      scores.push(result.overallScore);
    }

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]!);
    }
  });

  it("OilinessAnalyzer: score increases monotonically with specular highlight area in T-Zone", async () => {
    const analyzer = new OilinessAnalyzer();
    const shineFractions = [0, 0.05, 0.15, 0.35];
    const scores: number[] = [];

    for (const frac of shineFractions) {
      const input = createSyntheticUVInput();
      const foreheadMask = input.regionMasks![FaceRegion.FOREHEAD]!;
      let modified = 0;
      const totalForehead = foreheadMask.reduce((a, b) => a + b, 0);
      const targetCount = Math.floor(totalForehead * frac);

      for (let i = 0; i < input.width * input.height && modified < targetCount; i++) {
        if (foreheadMask[i] === 1) {
          // Specular highlight: very high L*, neutral/low chroma
          input.uvTextureBuffer[i * 4] = 250;
          input.uvTextureBuffer[i * 4 + 1] = 250;
          input.uvTextureBuffer[i * 4 + 2] = 250;
          modified++;
        }
      }

      const result = await analyzer.analyze(input);
      scores.push(result.regionScores[FaceRegion.FOREHEAD]!);
    }

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]!);
    }
  });

  it("TextureAnalyzer: score increases monotonically with high-frequency noise perturbation", async () => {
    const analyzer = new TextureAnalyzer();
    const noiseLevels = [0, 4, 10, 20];
    const scores: number[] = [];

    for (const noise of noiseLevels) {
      const input = createSyntheticUVInput();
      for (let i = 0; i < input.width * input.height; i++) {
        // High frequency alternating noise
        const delta = (i % 2 === 0 ? 1 : -1) * noise;
        input.uvTextureBuffer[i * 4] = Math.min(255, Math.max(0, input.uvTextureBuffer[i * 4]! + delta));
        input.uvTextureBuffer[i * 4 + 1] = Math.min(255, Math.max(0, input.uvTextureBuffer[i * 4 + 1]! + delta));
        input.uvTextureBuffer[i * 4 + 2] = Math.min(255, Math.max(0, input.uvTextureBuffer[i * 4 + 2]! + delta));
      }

      const result = await analyzer.analyze(input);
      scores.push(result.overallScore);
    }

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]!);
    }
  });

  it("TextureAnalyzer: confidence drops heavily when input is blurry", async () => {
    const analyzer = new TextureAnalyzer();
    const sharpInput = createSyntheticUVInput({ qualityReport: { blurScore: 200 } });
    const blurryInput = createSyntheticUVInput({ qualityReport: { blurScore: 20 } });

    const sharpResult = await analyzer.analyze(sharpInput);
    const blurryResult = await analyzer.analyze(blurryInput);

    expect(blurryResult.confidence).toBeLessThan(sharpResult.confidence);
    expect(blurryResult.confidence).toBeLessThanOrEqual(0.35);
  });

  it("WrinklesAnalyzer: is marked beta, caps confidence at 0.70, and responds to crease lines", async () => {
    const analyzer = new WrinklesAnalyzer();
    const inputClean = createSyntheticUVInput();
    const inputWrinkled = createSyntheticUVInput();

    // Inject horizontal crease lines in forehead
    for (const lineY of [6, 12, 17]) {
      for (let x = 10; x < 54; x++) {
        const idx = (lineY * inputWrinkled.width + x) * 4;
        inputWrinkled.uvTextureBuffer[idx] = 90;
        inputWrinkled.uvTextureBuffer[idx + 1] = 70;
        inputWrinkled.uvTextureBuffer[idx + 2] = 60;
      }
    }

    const cleanResult = await analyzer.analyze(inputClean);
    const wrinkledResult = await analyzer.analyze(inputWrinkled);

    expect(wrinkledResult.isBeta).toBe(true);
    expect(wrinkledResult.confidence).toBeLessThanOrEqual(0.70);
    expect(wrinkledResult.regionScores[FaceRegion.FOREHEAD]!).toBeGreaterThan(
      cleanResult.regionScores[FaceRegion.FOREHEAD]!
    );
  });

  it("DarkCirclesAnalyzer: is marked beta, caps confidence at 0.75, and responds to under-eye darkening", async () => {
    const analyzer = new DarkCirclesAnalyzer();
    const inputClean = createSyntheticUVInput();
    const inputDarkened = createSyntheticUVInput();

    const underEyeMask = inputDarkened.regionMasks![FaceRegion.UNDER_EYES]!;
    for (let i = 0; i < inputDarkened.width * inputDarkened.height; i++) {
      if (underEyeMask[i] === 1) {
        const idx = i * 4;
        // Darken and shift towards purple/blue
        inputDarkened.uvTextureBuffer[idx] = 120;
        inputDarkened.uvTextureBuffer[idx + 1] = 90;
        inputDarkened.uvTextureBuffer[idx + 2] = 110;
      }
    }

    const cleanResult = await analyzer.analyze(inputClean);
    const darkResult = await analyzer.analyze(inputDarkened);

    expect(darkResult.isBeta).toBe(true);
    expect(darkResult.confidence).toBeLessThanOrEqual(0.75);
    expect(darkResult.regionScores[FaceRegion.UNDER_EYES]!).toBeGreaterThan(
      cleanResult.regionScores[FaceRegion.UNDER_EYES]!
    );
  });

  it("aggregateAnalysis: computes overall score, identifies top concerns, and validates schema", async () => {
    const redness = new RednessAnalyzer();
    const pigmentation = new PigmentationAnalyzer();
    const oiliness = new OilinessAnalyzer();
    const texture = new TextureAnalyzer();
    const wrinkles = new WrinklesAnalyzer();
    const darkCircles = new DarkCirclesAnalyzer();

    const input = createSyntheticUVInput();
    const results = await Promise.all([
      redness.analyze(input),
      pigmentation.analyze(input),
      oiliness.analyze(input),
      texture.analyze(input),
      wrinkles.analyze(input),
      darkCircles.analyze(input)
    ]);

    const aggregate = aggregateAnalysis(results, input.qualityReport);

    expect(aggregate.overallScore).toBeGreaterThanOrEqual(0);
    expect(aggregate.overallScore).toBeLessThanOrEqual(100);
    expect(aggregate.results).toHaveLength(6);
    expect(aggregate.primaryConcerns.length).toBeGreaterThan(0);
    expect(aggregate.overallConfidence).toBeGreaterThan(0);
  });

  it("Analyzer respects AbortSignal cancellation", async () => {
    const analyzer = new RednessAnalyzer();
    const input = createSyntheticUVInput();
    const controller = new AbortController();
    controller.abort();

    await expect(analyzer.analyze(input, controller.signal)).rejects.toThrow(/abort/i);
  });

  it("Test-Retest Stability: score variance remains bounded under subtle sensor noise", async () => {
    const analyzer = new RednessAnalyzer();
    const scores: number[] = [];

    for (let run = 0; run < 5; run++) {
      const input = createSyntheticUVInput();
      // Add subtle sensor noise (+/- 1 LSB)
      for (let i = 0; i < input.uvTextureBuffer.length; i += 4) {
        const noise = (run % 2 === 0 ? 1 : -1);
        input.uvTextureBuffer[i] = Math.min(255, Math.max(0, input.uvTextureBuffer[i]! + noise));
      }
      const res = await analyzer.analyze(input);
      scores.push(res.overallScore);
    }

    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    expect(maxScore - minScore).toBeLessThanOrEqual(2.0);
  });

  it("Cross-Lighting Stability: lighting degradation drops confidence and bounds drift", async () => {
    const analyzer = new PigmentationAnalyzer();
    const uniformInput = createSyntheticUVInput({ qualityReport: { lightingEvenness: 0.95 } });
    const poorLightInput = createSyntheticUVInput({ qualityReport: { lightingEvenness: 0.55 } });

    const uniformRes = await analyzer.analyze(uniformInput);
    const poorRes = await analyzer.analyze(poorLightInput);

    expect(poorRes.confidence).toBeLessThan(uniformRes.confidence);
    // Score drift between uniform and uneven lighting on same texture is bounded
    expect(Math.abs(poorRes.overallScore - uniformRes.overallScore)).toBeLessThanOrEqual(5.0);
  });

  it("Skin Tone Representation: ITA categorises Fitzpatrick tones across the spectrum", async () => {
    const analyzer = new PigmentationAnalyzer();

    // Type I/II (Very Light / Light): High L*, moderate b*
    const fairInput = createSyntheticUVInput();
    for (let i = 0; i < fairInput.width * fairInput.height; i++) {
      fairInput.uvTextureBuffer[i * 4] = 245;
      fairInput.uvTextureBuffer[i * 4 + 1] = 210;
      fairInput.uvTextureBuffer[i * 4 + 2] = 195;
    }

    // Type V/VI (Dark / Deep): Low L*, moderate b*
    const deepInput = createSyntheticUVInput();
    for (let i = 0; i < deepInput.width * deepInput.height; i++) {
      deepInput.uvTextureBuffer[i * 4] = 75;
      deepInput.uvTextureBuffer[i * 4 + 1] = 50;
      deepInput.uvTextureBuffer[i * 4 + 2] = 35;
    }

    const fairRes = await analyzer.analyze(fairInput);
    const deepRes = await analyzer.analyze(deepInput);

    expect(["Very Light", "Light"]).toContain(fairRes.metadata?.toneCategory);
    expect(["Brown", "Dark"]).toContain(deepRes.metadata?.toneCategory);
    expect(Number(fairRes.metadata?.itaAngle)).toBeGreaterThan(Number(deepRes.metadata?.itaAngle));
  });
});
