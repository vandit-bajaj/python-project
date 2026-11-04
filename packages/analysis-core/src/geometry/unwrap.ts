import type { FaceRegionId } from "../types";

export interface UVCoordinate {
  readonly u: number; // [0, 1] horizontal UV coordinate
  readonly v: number; // [0, 1] vertical UV coordinate
}

export interface CanonicalUVTexture {
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8ClampedArray;
  readonly labL: Float32Array;
  readonly labA: Float32Array;
  readonly labB: Float32Array;
  readonly skinMask: Uint8Array;
  readonly regionMasks: Record<FaceRegionId, Uint8Array>;
  readonly pixelsPerMm: number;
}
