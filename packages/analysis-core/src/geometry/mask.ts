import type { Point2D } from "./scale";

/**
 * Standard ray-casting algorithm to determine if a 2D point lies within a polygon.
 */
export function isPointInPolygon(p: Point2D, polygon: readonly Point2D[]): boolean {
  let inside = false;
  const n = polygon.length;
  if (n < 3) return false;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (!pi || !pj) continue;

    const intersect =
      pi.y > p.y !== pj.y > p.y &&
      p.x < ((pj.x - pi.x) * (p.y - pi.y)) / (pj.y - pi.y) + pi.x;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

export interface PolygonContours {
  readonly faceContour: readonly Point2D[];
  readonly leftEye: readonly Point2D[];
  readonly rightEye: readonly Point2D[];
  readonly lips: readonly Point2D[];
}

/**
 * Generates a binary skin mask (Uint8Array of length width*height, values 0 or 255)
 * where skin is inside the face contour and outside eyes, lips, and nostrils.
 */
export function generateGeometricSkinMask(
  contours: PolygonContours,
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  if (contours.faceContour.length < 3) {
    return mask;
  }

  // Precompute bounding box of face contour to optimize iteration
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (const pt of contours.faceContour) {
    if (pt.x < minX) minX = Math.max(0, Math.floor(pt.x));
    if (pt.x > maxX) maxX = Math.min(width - 1, Math.ceil(pt.x));
    if (pt.y < minY) minY = Math.max(0, Math.floor(pt.y));
    if (pt.y > maxY) maxY = Math.min(height - 1, Math.ceil(pt.y));
  }

  const point: { x: number; y: number } = { x: 0, y: 0 };

  for (let y = minY; y <= maxY; y++) {
    point.y = y;
    const rowOffset = y * width;

    for (let x = minX; x <= maxX; x++) {
      point.x = x;

      if (!isPointInPolygon(point, contours.faceContour)) {
        continue;
      }

      // Exclude eye regions
      if (contours.leftEye.length >= 3 && isPointInPolygon(point, contours.leftEye)) {
        continue;
      }
      if (contours.rightEye.length >= 3 && isPointInPolygon(point, contours.rightEye)) {
        continue;
      }

      // Exclude lips/mouth
      if (contours.lips.length >= 3 && isPointInPolygon(point, contours.lips)) {
        continue;
      }

      mask[rowOffset + x] = 255;
    }
  }

  return mask;
}

/**
 * Refines the geometric skin mask by filtering out pixels with non-skin colors
 * (e.g. hair, beard, glasses frames).
 */
export function refineSkinMaskWithLuminance(
  mask: Uint8Array,
  labL: Float32Array,
  width: number,
  height: number
): void {
  const total = width * height;
  for (let i = 0; i < total; i++) {
    if (mask[i] === 255) {
      const L = labL[i] ?? 0;
      // Filter out deep shadows/hair (L < 15) and blown specular reflections (L > 95)
      if (L < 15 || L > 95) {
        mask[i] = 0;
      }
    }
  }
}
