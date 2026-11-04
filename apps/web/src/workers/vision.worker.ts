import {
  batchRgbaToLab,
  computeIrisScale,
  generateGeometricSkinMask,
  type Point2D,
  type PolygonContours,
  refineSkinMaskWithLuminance
} from "@dermalens/analysis-core";
import * as Comlink from "comlink";

export interface ColorSpaceOutput {
  readonly labL: Float32Array;
  readonly labA: Float32Array;
  readonly labB: Float32Array;
}

export const visionWorkerApi = {
  /**
   * Initializes worker runtime.
   */
  async init(): Promise<boolean> {
    return true;
  },

  /**
   * Converts an RGBA buffer to CIELAB space in background worker thread.
   */
  async computeColorSpace(
    rgba: Uint8ClampedArray,
    width: number,
    height: number
  ): Promise<ColorSpaceOutput> {
    const pixelCount = width * height;
    const labL = new Float32Array(pixelCount);
    const labA = new Float32Array(pixelCount);
    const labB = new Float32Array(pixelCount);

    batchRgbaToLab(rgba, pixelCount, labL, labA, labB);

    return Comlink.transfer(
      { labL, labA, labB },
      [labL.buffer, labA.buffer, labB.buffer]
    );
  },

  /**
   * Generates a skin mask with morphological eye/lip exclusions and luminance refinement.
   */
  async generateSkinMask(
    contours: PolygonContours,
    width: number,
    height: number,
    labL?: Float32Array
  ): Promise<Uint8Array> {
    const mask = generateGeometricSkinMask(contours, width, height);

    if (labL) {
      refineSkinMaskWithLuminance(mask, labL, width, height);
    }

    return Comlink.transfer(mask, [mask.buffer]);
  },

  /**
   * Computes anatomical pixels-per-mm scale factor based on iris diameter.
   */
  async computeScale(
    leftIrisP1: Point2D,
    leftIrisP2: Point2D,
    rightIrisP1?: Point2D,
    rightIrisP2?: Point2D
  ): Promise<number> {
    return computeIrisScale(leftIrisP1, leftIrisP2, rightIrisP1, rightIrisP2);
  }
};

export type VisionWorkerApi = typeof visionWorkerApi;

Comlink.expose(visionWorkerApi);
