import { describe, expect, it } from "vitest";
import {
  computeIrisScale,
  generateGeometricSkinMask,
  isPointInPolygon,
  refineSkinMaskWithLuminance,
  STANDARD_IRIS_DIAMETER_MM
} from "../src";

describe("Geometry Engine: Spatial, Scale & Masking", () => {
  it("computes accurate pixels-per-mm based on 11.7mm iris standard", () => {
    // Simulated iris of 46.8 pixels diameter: 46.8 / 11.7 = 4.0 px/mm
    const p1 = { x: 100, y: 100 };
    const p2 = { x: 146.8, y: 100 };

    const scale = computeIrisScale(p1, p2);
    expect(scale).toBeCloseTo(4.0, 2);
  });

  it("averages both eyes when second iris points are supplied", () => {
    const leftP1 = { x: 50, y: 100 };
    const leftP2 = { x: 96.8, y: 100 }; // 46.8 px -> 4.0 px/mm

    const rightP1 = { x: 200, y: 100 };
    const rightP2 = { x: 258.5, y: 100 }; // 58.5 px -> 5.0 px/mm

    const scale = computeIrisScale(leftP1, leftP2, rightP1, rightP2);
    expect(scale).toBeCloseTo(4.5, 2);
  });

  it("determines polygon point containment via ray casting", () => {
    const triangle = [
      { x: 10, y: 10 },
      { x: 50, y: 10 },
      { x: 30, y: 50 }
    ];

    expect(isPointInPolygon({ x: 30, y: 20 }, triangle)).toBe(true);
    expect(isPointInPolygon({ x: 0, y: 0 }, triangle)).toBe(false);
    expect(isPointInPolygon({ x: 100, y: 100 }, triangle)).toBe(false);
  });

  it("generates skin mask excluding eyes and mouth polygons", () => {
    const width = 100;
    const height = 100;

    // Face boundary: square from (10, 10) to (90, 90)
    const faceContour = [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 }
    ];

    // Left eye at (20, 20) to (35, 35)
    const leftEye = [
      { x: 20, y: 20 },
      { x: 35, y: 20 },
      { x: 35, y: 35 },
      { x: 20, y: 35 }
    ];

    // Lips at (40, 60) to (60, 75)
    const lips = [
      { x: 40, y: 60 },
      { x: 60, y: 60 },
      { x: 60, y: 75 },
      { x: 40, y: 75 }
    ];

    const mask = generateGeometricSkinMask(
      { faceContour, leftEye, rightEye: [], lips },
      width,
      height
    );

    // Cheek point (50, 45) should be skin (255)
    expect(mask[45 * width + 50]).toBe(255);

    // Eye point (25, 25) should be excluded (0)
    expect(mask[25 * width + 25]).toBe(0);

    // Lip point (50, 65) should be excluded (0)
    expect(mask[65 * width + 50]).toBe(0);

    // Background point (5, 5) outside face contour should be 0
    expect(mask[5 * width + 5]).toBe(0);
  });

  it("refines skin mask by zeroing extreme luminance pixels", () => {
    const mask = new Uint8Array(4);
    mask.fill(255);

    const labL = new Float32Array([
      5.0,  // Deep shadow / dark hair -> should be dropped
      55.0, // Normal skin -> keep
      70.0, // Normal skin -> keep
      98.0  // Blown specular highlight -> should be dropped
    ]);

    refineSkinMaskWithLuminance(mask, labL, 2, 2);

    expect(mask[0]).toBe(0);
    expect(mask[1]).toBe(255);
    expect(mask[2]).toBe(255);
    expect(mask[3]).toBe(0);
  });
});
