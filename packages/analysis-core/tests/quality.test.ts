import { describe, expect, it } from "vitest";
import {
  analyzeColorCast,
  analyzeExposure,
  computeLaplacianVariance,
  evaluateCaptureQuality,
  QualityReportSchema
} from "../src";

function createSolidRgba(width: number, height: number, r: number, g: number, b: number): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    buf[idx] = r;
    buf[idx + 1] = g;
    buf[idx + 2] = b;
    buf[idx + 3] = 255;
  }
  return buf;
}

function createCheckerboardRgba(
  width: number,
  height: number,
  tileSize: number,
  minVal = 30,
  maxVal = 220
): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isBlack = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
      const val = isBlack ? minVal : maxVal;
      buf[idx] = val;
      buf[idx + 1] = val;
      buf[idx + 2] = val;
      buf[idx + 3] = 255;
    }
  }
  return buf;
}

describe("Quality Gate: Pure CV Metrics", () => {
  it("differentiates sharp edges from blurry/flat buffers via Laplacian variance", () => {
    const flatBuffer = createSolidRgba(64, 64, 128, 128, 128);
    const sharpBuffer = createCheckerboardRgba(64, 64, 4);

    const flatVariance = computeLaplacianVariance(flatBuffer, 64, 64);
    const sharpVariance = computeLaplacianVariance(sharpBuffer, 64, 64);

    expect(flatVariance).toBe(0);
    expect(sharpVariance).toBeGreaterThan(100);
  });

  it("detects underexposure when image is excessively dark", () => {
    const darkBuffer = createSolidRgba(32, 32, 10, 10, 10);
    const metrics = analyzeExposure(darkBuffer, 32, 32);

    expect(metrics.meanLuminance).toBeLessThan(20);
    expect(metrics.shadowClippingFraction).toBe(1.0);
    expect(metrics.isExposureAcceptable).toBe(false);
  });

  it("detects overexposure when image is blown out / clipped", () => {
    const blownBuffer = createSolidRgba(32, 32, 250, 250, 250);
    const metrics = analyzeExposure(blownBuffer, 32, 32);

    expect(metrics.meanLuminance).toBeGreaterThan(240);
    expect(metrics.highlightClippingFraction).toBe(1.0);
    expect(metrics.isExposureAcceptable).toBe(false);
  });

  it("approves well-exposed neutral buffers", () => {
    const goodBuffer = createSolidRgba(32, 32, 120, 120, 120);
    const metrics = analyzeExposure(goodBuffer, 32, 32);

    expect(metrics.isExposureAcceptable).toBe(true);
    expect(metrics.shadowClippingFraction).toBe(0);
    expect(metrics.highlightClippingFraction).toBe(0);
  });

  it("detects severe color cast", () => {
    // Severe yellow/orange tint (high R, high G, low B)
    const tintedBuffer = createSolidRgba(32, 32, 210, 190, 40);
    const metrics = analyzeColorCast(tintedBuffer, 32, 32);

    expect(metrics.divergence).toBeGreaterThan(0.35);
    expect(metrics.isColorCastSevere).toBe(true);
  });

  it("evaluates comprehensive capture quality and outputs Zod-valid QualityReport", () => {
    const sharpGoodBuffer = createCheckerboardRgba(64, 64, 8);
    const evaluation = evaluateCaptureQuality(sharpGoodBuffer, 64, 64, {
      facePresent: true,
      yawDegrees: 2,
      pitchDegrees: -1,
      rollDegrees: 0
    });

    expect(evaluation.isAcceptable).toBe(true);
    expect(evaluation.report.overallScore).toBeGreaterThanOrEqual(0.75);

    const zodCheck = QualityReportSchema.safeParse(evaluation.report);
    expect(zodCheck.success).toBe(true);
  });

  it("rejects when no face is present and provides actionable advice", () => {
    const buffer = createCheckerboardRgba(64, 64, 8);
    const evaluation = evaluateCaptureQuality(buffer, 64, 64, {
      facePresent: false
    });

    expect(evaluation.isAcceptable).toBe(false);
    expect(evaluation.report.overallScore).toBe(0);
    expect(evaluation.primaryGuidance).toBe("Center your face in the guide");
  });
});
