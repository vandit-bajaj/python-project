import { describe, expect, it } from "vitest";
import {
  batchRgbaToLab,
  linearToSrgb,
  srgbToLab,
  srgbToLinear
} from "../src";

describe("Geometry Engine: CIELAB Color Pipeline", () => {
  it("converts pure black to L*=0, a*=0, b*=0", () => {
    const [L, a, b] = srgbToLab(0, 0, 0);
    expect(L).toBeCloseTo(0, 1);
    expect(a).toBeCloseTo(0, 1);
    expect(b).toBeCloseTo(0, 1);
  });

  it("converts D65 reference white (255, 255, 255) to L*=100, a*=0, b*=0", () => {
    const [L, a, b] = srgbToLab(255, 255, 255);
    expect(L).toBeCloseTo(100, 1);
    expect(a).toBeCloseTo(0, 1);
    expect(b).toBeCloseTo(0, 1);
  });

  it("converts mid-gray (128, 128, 128) to L*≈53.58 with zero chroma", () => {
    const [L, a, b] = srgbToLab(128, 128, 128);
    expect(L).toBeGreaterThan(50);
    expect(L).toBeLessThan(56);
    expect(Math.abs(a)).toBeLessThan(1.0);
    expect(Math.abs(b)).toBeLessThan(1.0);
  });

  it("represents primary red with high positive a* (red axis)", () => {
    const [, a] = srgbToLab(255, 0, 0);
    expect(a).toBeGreaterThan(70); // High red chroma
  });

  it("represents primary green with negative a* (green axis)", () => {
    const [, a] = srgbToLab(0, 255, 0);
    expect(a).toBeLessThan(-70); // High green chroma
  });

  it("represents primary yellow with positive b* (yellow axis)", () => {
    const [, , b] = srgbToLab(255, 255, 0);
    expect(b).toBeGreaterThan(70); // High yellow chroma
  });

  it("round-trips sRGB channels through linearization cleanly", () => {
    for (const testVal of [0, 16, 64, 128, 192, 255]) {
      const linear = srgbToLinear(testVal);
      const reconstructed = linearToSrgb(linear);
      expect(reconstructed).toBe(testVal);
    }
  });

  it("matches batch buffer conversion against single-pixel function", () => {
    const testRgba = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 255,
      128, 128, 128, 255
    ]);
    const outL = new Float32Array(3);
    const outA = new Float32Array(3);
    const outB = new Float32Array(3);

    batchRgbaToLab(testRgba, 3, outL, outA, outB);

    const [L0, a0, b0] = srgbToLab(255, 0, 0);
    expect(outL[0]).toBeCloseTo(L0, 2);
    expect(outA[0]).toBeCloseTo(a0, 2);
    expect(outB[0]).toBeCloseTo(b0, 2);

    const [L2, a2, b2] = srgbToLab(128, 128, 128);
    expect(outL[2]).toBeCloseTo(L2, 2);
    expect(outA[2]).toBeCloseTo(a2, 2);
    expect(outB[2]).toBeCloseTo(b2, 2);
  });
});
