export interface ColorCastMetrics {
  readonly avgR: number;
  readonly avgG: number;
  readonly avgB: number;
  readonly divergence: number;
  readonly isColorCastSevere: boolean;
}

/**
 * Assesses color cast using gray-world deviation across unclipped pixels.
 * Severe divergence suggests coloured ambient lighting (e.g. tungsten, neon, yellow bulbs)
 * that would distort redness and pigmentation readings.
 */
export function analyzeColorCast(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): ColorCastMetrics {
  const totalPixels = width * height;
  if (totalPixels === 0) {
    return {
      avgR: 0,
      avgG: 0,
      avgB: 0,
      divergence: 0,
      isColorCastSevere: false
    };
  }

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let validCount = 0;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = rgba[idx] ?? 0;
    const g = rgba[idx + 1] ?? 0;
    const b = rgba[idx + 2] ?? 0;

    // Disregard extreme clipped pixels
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 15 && lum < 240) {
      rSum += r;
      gSum += g;
      bSum += b;
      validCount++;
    }
  }

  if (validCount === 0) {
    return {
      avgR: 0,
      avgG: 0,
      avgB: 0,
      divergence: 0,
      isColorCastSevere: true
    };
  }

  const avgR = rSum / validCount;
  const avgG = gSum / validCount;
  const avgB = bSum / validCount;

  const mean = (avgR + avgG + avgB) / 3;
  if (mean === 0) {
    return {
      avgR,
      avgG,
      avgB,
      divergence: 0,
      isColorCastSevere: false
    };
  }

  // Maximum divergence normalized by the average channel mean
  const maxDiff = Math.max(
    Math.abs(avgR - mean),
    Math.abs(avgG - mean),
    Math.abs(avgB - mean)
  );
  const divergence = maxDiff / mean;

  // Severe if channel skew exceeds 40% of mean intensity
  const isColorCastSevere = divergence > 0.40;

  return {
    avgR,
    avgG,
    avgB,
    divergence,
    isColorCastSevere
  };
}
