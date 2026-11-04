export interface ExposureMetrics {
  readonly meanLuminance: number;
  readonly shadowClippingFraction: number;
  readonly highlightClippingFraction: number;
  readonly isExposureAcceptable: boolean;
}

/**
 * Evaluates exposure quality and histogram clipping.
 * Identifies underexposure (too dark), overexposure (blown highlights),
 * or severe contrast imbalances.
 */
export function analyzeExposure(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): ExposureMetrics {
  const totalPixels = width * height;
  if (totalPixels === 0) {
    return {
      meanLuminance: 0,
      shadowClippingFraction: 0,
      highlightClippingFraction: 0,
      isExposureAcceptable: false
    };
  }

  let totalLuminance = 0;
  let shadowCount = 0;
  let highlightCount = 0;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = rgba[idx] ?? 0;
    const g = rgba[idx + 1] ?? 0;
    const b = rgba[idx + 2] ?? 0;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += lum;

    if (lum < 15) {
      shadowCount++;
    } else if (lum > 240) {
      highlightCount++;
    }
  }

  const meanLuminance = totalLuminance / totalPixels;
  const shadowClippingFraction = shadowCount / totalPixels;
  const highlightClippingFraction = highlightCount / totalPixels;

  // Exposure is acceptable if mean luminance is in comfortable cosmetic range (40 to 210)
  // and clipping is within bounds (< 25% shadows, < 15% highlights)
  const isExposureAcceptable =
    meanLuminance >= 40 &&
    meanLuminance <= 210 &&
    shadowClippingFraction < 0.25 &&
    highlightClippingFraction < 0.15;

  return {
    meanLuminance,
    shadowClippingFraction,
    highlightClippingFraction,
    isExposureAcceptable
  };
}
