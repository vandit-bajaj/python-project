export interface Point2D {
  readonly x: number;
  readonly y: number;
}

// Standard biological adult iris horizontal diameter in millimetres
export const STANDARD_IRIS_DIAMETER_MM = 11.7;

/**
 * Computes pixels-per-millimeter resolution from iris boundary landmarks.
 *
 * @param leftIrisP1 Outer boundary point 1 of iris
 * @param leftIrisP2 Outer boundary point 2 of iris (opposite side)
 * @param rightIrisP1 Optional second iris boundary point 1
 * @param rightIrisP2 Optional second iris boundary point 2
 */
export function computeIrisScale(
  leftIrisP1: Point2D,
  leftIrisP2: Point2D,
  rightIrisP1?: Point2D,
  rightIrisP2?: Point2D
): number {
  const leftDiameterPx = Math.hypot(leftIrisP2.x - leftIrisP1.x, leftIrisP2.y - leftIrisP1.y);

  let avgDiameterPx = leftDiameterPx;
  if (rightIrisP1 && rightIrisP2) {
    const rightDiameterPx = Math.hypot(rightIrisP2.x - rightIrisP1.x, rightIrisP2.y - rightIrisP1.y);
    if (rightDiameterPx > 0) {
      avgDiameterPx = (leftDiameterPx + rightDiameterPx) / 2;
    }
  }

  if (avgDiameterPx <= 0) {
    // Default safe fallback if iris landmarks are not detected: 3.5 px/mm (standard for 1080p selfies)
    return 3.5;
  }

  const pxPerMm = avgDiameterPx / STANDARD_IRIS_DIAMETER_MM;
  // Guard against extreme values (unusual crops or detection failures)
  return Math.max(1.0, Math.min(30.0, pxPerMm));
}
